const { APIContracts, APIControllers } = require('authorizenet');
const TicketRequestStatus = require('../models/TicketRequestStatus');
const TicketRequest = require('../models/TicketRequest');
const { User } = require('../models/User');


const apiLoginKey = process.env.AUTHUSLOGINID; 
const transactionKey = process.env.AUTHUSTRANSACTIONKEY;

function formatExpiryDate(expiry) { 
  if (!expiry || !expiry.includes('/')) return expiry;
  const [month, year] = expiry.split('/');
  const fullYear = parseInt(year, 10) < 100 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}`;
}  


const authorizeUsPayment = async (req, res) => {
  try {
    const { ticketRequestId } = req.body;

    if (!ticketRequestId) {
      return res.status(400).json({ success: false, message: 'ticketRequestId is required' });
    }

    const ticketRequest = await TicketRequest.findById(ticketRequestId);
    if (!ticketRequest) {
      return res.status(404).json({ success: false, message: 'Ticket request not found' });
    }

    const user = await User.findById(req.user.id).select('userName email');
    const updatedBy = user?.userName || user?.email || req.user.id;


    const formattedExpiry = formatExpiryDate(ticketRequest.expiryDate);

    const merchantAuthentication = new APIContracts.MerchantAuthenticationType();
    merchantAuthentication.setName(apiLoginKey);
    merchantAuthentication.setTransactionKey(transactionKey);

    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(ticketRequest.cardNumber);
    creditCard.setExpirationDate(formattedExpiry); 
    creditCard.setCardCode(ticketRequest.cvv);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);
 
    const amount = parseFloat(ticketRequest.mco); 

    

    if (isNaN(amount)) {
      return res.status(400).json({ success: false, message: 'Invalid amount format' });
    }


    const billTo = new APIContracts.CustomerAddressType();
    billTo.setFirstName(ticketRequest.passengerName.split(' ')[0] || '');
    billTo.setLastName(ticketRequest.passengerName.split(' ')[1] || '');
    billTo.setPhoneNumber(ticketRequest.phoneNumber);
    billTo.setEmail(ticketRequest.passengerEmail);


    const transactionRequest = new APIContracts.TransactionRequestType();
    transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequest.setPayment(paymentType);
    transactionRequest.setAmount(amount);
    transactionRequest.setBillTo(billTo);


    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthentication);
    createRequest.setTransactionRequest(transactionRequest);

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());


    ctrl.execute(async () => {
      try {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        console.log('Authorize.Net raw response:', JSON.stringify(apiResponse));

        if (response && response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
          const transactionResponse = response.getTransactionResponse();
          if (transactionResponse && transactionResponse.getMessages() !== null) {
            // Update status
            ticketRequest.status = 'Charge';
            await ticketRequest.save();

            const ticketRequestStatus = new TicketRequestStatus({
              ticketRequest,
              status: 'Charge',
              paymentMethod: 'Authorize US',
              remark: 'Payment successful via Authorize.Net',
              updatedBy,
            });
            await ticketRequestStatus.save();

            console.log('Transaction success! ID:', transactionResponse.getTransId());

            return res.status(200).json({
              success: true,
              message: 'Payment successful and ticket status updated',
              transactionId: transactionResponse.getTransId(),
            });
          } else if (transactionResponse && transactionResponse.getErrors() != null) {
            console.log('Transaction errors:', transactionResponse.getErrors().getError()[0].getErrorText());
            return res.status(400).json({
              success: false,
              message: transactionResponse.getErrors().getError()[0].getErrorText(),
            });
          } else {
            console.log('Unknown failure without errors');
            return res.status(400).json({
              success: false,
              message: 'Transaction failed without detailed error message.',
            });
          }
        } else {
          const errorMessages = response.getMessages().getMessage();
          console.log('API-level error messages:', errorMessages);
          return res.status(400).json({
            success: false,
            message: errorMessages[0].getText(),
          });
        }
      } catch (callbackErr) {
        console.error('Callback execution error:', callbackErr);
        return res.status(500).json({
          success: false,
          message: 'Internal server error during transaction callback',
          error: callbackErr.message,
        });
      }
    });
  } catch (error) {
    console.error('authorizeUsPayment error:', error);
    return res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};



module.exports = {
  authorizeUsPayment,
};