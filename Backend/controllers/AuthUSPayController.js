const { APIContracts, APIControllers, Constants: SDKConstants } = require('authorizenet');
const TicketRequestStatus = require('../models/TicketRequestStatus');
const TicketRequest = require('../models/TicketRequest');
const { User } = require('../models/User');
const { convertCurrency } = require('../utils/currencyConverter');
require('dotenv').config();


function formatExpiryDate(expiry) {
  if (!expiry || !expiry.includes('/')) return expiry;
  const [month, year] = expiry.split('/');
  const fullYear = parseInt(year, 10) < 100 ? `20${year}` : year;
  return `${fullYear}-${month.padStart(2, '0')}`;
}

const authorizeUsPayment = async (req, res) => {
  try {
    const { ticketRequestId } = req.body;

    let apiLoginKey = process.env.AUTHUSLOGINID;
    let transactionKey = process.env.AUTHUSTRANSACTIONKEY;

   
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
  
    // Convert amount to USD if needed (Authorize.Net requires USD)
    const currency = ticketRequest.currency || 'USD';
    let amountToCharge = parseFloat(ticketRequest.mco);
    
    if (currency !== 'USD') {
      amountToCharge = convertCurrency(amountToCharge, currency, 'USD');
    }
    
    if (isNaN(amountToCharge)) {
      return res.status(400).json({ success: false, message: 'Invalid amount format' });
    }

  // Use billing address only for internal user details, do not send to Authorize.Net
  // (No billTo object will be set on the transactionRequest)

    // Add custom fields for ticket information using correct XML structure
    const userFields = {
      userField: [
        {
          name: 'Ticket Type',
          value: ticketRequest.ticketType || ''
        },
        {
          name: 'Request For',
          value: ticketRequest.requestFor || ''
        },
        {
          name: 'Airline Code',
          value: ticketRequest.airlineCode || ''
        },
        {
          name: 'Confirmation Code',
          value: ticketRequest.confirmationCode || ''
        },
        {
          name: 'Consultant',
          value: ticketRequest.consultant || ''
        }
      ]
    };

    const transactionRequest = new APIContracts.TransactionRequestType();

  transactionRequest.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
  transactionRequest.setPayment(paymentType);
  transactionRequest.setAmount(amountToCharge);
  // Do NOT set billTo (billing address) on transactionRequest

    // Set user fields using the correct structure
    transactionRequest.setUserFields(userFields);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthentication);
    createRequest.setTransactionRequest(transactionRequest);

    // Explicitly force production endpoint
    SDKConstants.endpoint.sandbox = SDKConstants.endpoint.production;

    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    ctrl.execute(async () => {
      try {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        console.log('Authorize.Net raw response:', JSON.stringify(apiResponse));

        if (response && response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
          const transactionResponse = response.getTransactionResponse();

          if (transactionResponse) {
            const responseCode = transactionResponse.getResponseCode();

            if (responseCode === "1" && transactionResponse.getMessages() !== null) {
              // ✅ Approved
              ticketRequest.status = 'Charge';
              await ticketRequest.save();

              // Calculate sale amounts with currency support
              const currency = ticketRequest.currency || 'USD';
              const mcoAmount = parseFloat(ticketRequest.mco) || 0;
              const saleAmountOriginal = mcoAmount - (mcoAmount * 0.15);
              
              let saleAmountUSD = saleAmountOriginal;
              if (currency !== 'USD') {
                saleAmountUSD = convertCurrency(saleAmountOriginal, currency, 'USD');
              }

              const ticketRequestStatus = new TicketRequestStatus({
                ticketRequest,
                status: 'Charge',
                paymentMethod: 'Authorize US',
                remark: 'Payment successful via Authorize.Net',
                updatedBy,
                currency,
                saleAmountOriginal,
                saleAmountUSD,
                exchangeRate: ticketRequest.exchangeRate || 1
              });
              await ticketRequestStatus.save();

              console.log('Transaction success! ID:', transactionResponse.getTransId());

              return res.status(200).json({
                success: true,
                message: 'Payment successful and ticket status updated',
                transactionId: transactionResponse.getTransId(),
                authCode: transactionResponse.getAuthCode(),
                currency: currency,
                originalAmount: mcoAmount,
                chargedAmountUSD: amountToCharge,
                customFields: {
                  ticketType: ticketRequest.ticketType,
                  requestFor: ticketRequest.requestFor,
                  airlineCode: ticketRequest.airlineCode,
                  confirmationCode: ticketRequest.confirmationCode,
                  consultant: ticketRequest.consultant
                }
              });
            } else {
              // ❌ Transaction failed - extract specific error messages
              let errorMessage = 'Transaction failed';
              let errorDetails = [];

              // Check for transaction-level errors first (most specific)
              if (transactionResponse.getErrors() != null) {
                const errors = transactionResponse.getErrors().getError();
                if (errors && errors.length > 0) {
                  // Get the most specific error message
                  errorMessage = errors[0].getErrorText();
                  errorDetails = errors.map(err => ({
                    code: err.getErrorCode(),
                    text: err.getErrorText()
                  }));
                }
              }
              // Check for transaction messages if no errors found
              else if (transactionResponse.getMessages() != null) {
                const messages = transactionResponse.getMessages().getMessage();
                if (messages && messages.length > 0) {
                  errorMessage = messages[0].getText();
                }
              }
              // Check response code for additional context
              else if (responseCode === "2") {
                errorMessage = 'Transaction was declined by the payment processor';
              } else if (responseCode === "3") {
                errorMessage = 'Transaction error occurred';
              } else if (responseCode === "4") {
                errorMessage = 'Transaction is being held for review';
              } else {
                errorMessage = 'Transaction was declined';
              }

              console.log('Transaction failed:', {
                responseCode,
                errorMessage,
                errorDetails,
                fullResponse: JSON.stringify(transactionResponse)
              });

              return res.status(400).json({
                success: false,
                message: errorMessage,
                errorCode: responseCode,
                errorDetails: errorDetails,
                transactionId: transactionResponse.getTransId() || null
              });
            }
          } else {
            // ❌ Unknown transaction failure
            console.log('Transaction failed without detailed transaction response.');
            return res.status(400).json({
              success: false,
              message: 'Transaction failed without detailed transaction response.',
            });
          }
        } else {
          // ❌ API-level failure (e.g., authentication, validation)
          let errorMessage = 'API request failed';
          let errorDetails = [];

          if (response && response.getMessages() && response.getMessages().getMessage()) {
            const messages = response.getMessages().getMessage();
            if (messages && messages.length > 0) {
              // Get the most specific API error message
              errorMessage = messages[0].getText();
              errorDetails = messages.map(msg => ({
                code: msg.getCode(),
                text: msg.getText()
              }));
            }
          }

          console.log('API-level error:', {
            resultCode: response ? response.getMessages().getResultCode() : 'Unknown',
            errorMessage,
            errorDetails,
            fullResponse: JSON.stringify(apiResponse)
          });

          return res.status(400).json({
            success: false,
            message: errorMessage,
            errorType: 'API_ERROR',
            errorDetails: errorDetails
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