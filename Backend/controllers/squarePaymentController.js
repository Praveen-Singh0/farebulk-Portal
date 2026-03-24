const { SquareClient, SquareEnvironment } = require('square');
const TicketRequest = require('../models/TicketRequest');
const TicketRequestStatus = require('../models/TicketRequestStatus');
const { User } = require('../models/User');
const { convertCurrency } = require('../utils/currencyConverter');
const crypto = require('crypto');

// Initialize Square client
const getSquareClient = () => {
    const environment = process.env.SQUARE_ENVIRONMENT === 'production'
        ? SquareEnvironment.Production
        : SquareEnvironment.Sandbox;

    return new SquareClient({
        token: process.env.SQUARE_ACCESS_TOKEN,
        environment,
    });
};

const createSquarePayment = async (req, res) => {
    try {
        const { ticketRequestId, amount, sourceId, description } = req.body;

        console.log('Square payment request:', { ticketRequestId, amount, sourceId });

        // Validate inputs
        if (!ticketRequestId || !amount || !sourceId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters: ticketRequestId, amount, sourceId'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        // Find ticket request
        const ticketRequest = await TicketRequest.findById(ticketRequestId);
        if (!ticketRequest) {
            return res.status(404).json({
                success: false,
                message: 'Ticket request not found'
            });
        }

        // Find user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Square merchant (Myfaredeal INC) is in Canada — must charge in CAD
        // The amount from frontend is in USD (mcoUSD), convert to CAD for Square
        const amountInCAD = convertCurrency(amount / 100, 'USD', 'CAD'); // amount comes in cents, convert to dollars first
        const amountInCADCents = Math.round(amountInCAD * 100);

        console.log('Square: USD cents:', amount, '-> CAD cents:', amountInCADCents);

        const squareClient = getSquareClient();

        // Create payment using Square in CAD
        const response = await squareClient.payments.create({
            sourceId: sourceId,
            idempotencyKey: crypto.randomUUID(),
            amountMoney: {
                amount: BigInt(amountInCADCents),
                currency: 'CAD'
            },
            locationId: process.env.SQUARE_LOCATION_ID,
            note: description || `Payment for Ticket Request ${ticketRequestId}`,
            referenceId: ticketRequestId,
        });

        console.log('Square payment response:', response.result?.payment?.id, 'Status:', response.result?.payment?.status);

        const payment = response.result?.payment;

        if (payment && (payment.status === 'COMPLETED' || payment.status === 'APPROVED')) {
            // Payment succeeded
            await updateTicketStatus(ticketRequest, 'Charge', user, payment.id, amountInCAD);

            return res.status(200).json({
                success: true,
                paymentId: payment.id,
                status: 'succeeded',
                message: `Payment of C$${amountInCAD.toFixed(2)} completed successfully via Square`
            });
        } else {
            return res.status(400).json({
                success: false,
                message: `Payment failed: ${payment?.status || 'Unknown'}`,
                status: payment?.status
            });
        }

    } catch (error) {
        console.error('Square payment error:', error);

        let message = 'Payment processing failed';
        let statusCode = 500;

        if (error.errors && error.errors.length > 0) {
            const sqError = error.errors[0];
            message = sqError.detail || sqError.code || 'Square payment error';
            if (sqError.category === 'PAYMENT_METHOD_ERROR') {
                statusCode = 400;
            } else if (sqError.category === 'INVALID_REQUEST_ERROR') {
                statusCode = 400;
            }
        }

        return res.status(statusCode).json({
            success: false,
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Update ticket status (same pattern as Stripe)
const updateTicketStatus = async (ticketRequest, status, user, paymentId, amountCAD) => {
    try {
        const updatedBy = user.userName || user.email || user._id.toString();

        ticketRequest.status = status;
        if (paymentId) {
            ticketRequest.paymentIntentId = paymentId;
        }
        if (status === 'Charge') {
            ticketRequest.paymentMethod = 'Square (Myfaredeal INC - Canada)';
        }
        await ticketRequest.save();

        const currency = ticketRequest.currency || 'USD';
        const mcoAmount = parseFloat(ticketRequest.mco) || 0;
        const saleAmountOriginal = mcoAmount - (mcoAmount * 0.15);

        let saleAmountUSD = saleAmountOriginal;
        if (currency !== 'USD') {
            saleAmountUSD = convertCurrency(saleAmountOriginal, currency, 'USD');
        }

        const remark = status === 'Charge'
            ? `Payment successful via Square (Myfaredeal INC - Canada) - C$${amountCAD ? amountCAD.toFixed(2) : 'N/A'} - Transaction ID: ${paymentId}`
            : `Payment failed via Square${paymentId ? ` - Transaction ID: ${paymentId}` : ''}`;

        const ticketRequestStatus = new TicketRequestStatus({
            ticketRequest,
            status,
            paymentMethod: 'Square (Myfaredeal INC - Canada)',
            remark,
            updatedBy,
            paymentIntentId: paymentId,
            currency,
            saleAmountOriginal,
            saleAmountUSD,
            exchangeRate: ticketRequest.exchangeRate || 1
        });

        await ticketRequestStatus.save();
        console.log('Ticket status updated for Square payment');

    } catch (error) {
        console.error('Error updating ticket status for Square:', error);
        throw error;
    }
};

module.exports = {
    createSquarePayment,
};
