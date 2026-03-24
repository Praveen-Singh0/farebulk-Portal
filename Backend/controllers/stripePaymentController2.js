const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY_2);
const TicketRequest = require('../models/TicketRequest');
const TicketRequestStatus = require('../models/TicketRequestStatus');
const { User } = require('../models/User');
const { convertCurrency } = require('../utils/currencyConverter');

const createStripePaymentIntent2 = async (req, res) => {
    try {
        const { ticketRequestId, amount, paymentMethodId, description } = req.body;

        console.log('Stripe US - Payment request received:', { ticketRequestId, amount, paymentMethodId });

        if (!ticketRequestId || !amount || !paymentMethodId) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required parameters: ticketRequestId, amount, paymentMethodId'
            });
        }

        if (amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Amount must be greater than 0'
            });
        }

        const ticketRequest = await TicketRequest.findById(ticketRequestId);
        if (!ticketRequest) {
            return res.status(404).json({
                success: false,
                message: 'Ticket request not found'
            });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            }); 
        }

        console.log('Stripe US - Creating payment intent for user:', user.email);

        const currency = ticketRequest.currency || 'USD';
        let amountInUSD = amount;
        
        if (currency !== 'USD') {
            amountInUSD = convertCurrency(amount, currency, 'USD');
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amountInUSD),
            currency: 'usd',
            payment_method: paymentMethodId,
            confirmation_method: 'automatic',
            confirm: true,
            return_url: process.env.FRONTEND_URL || 'https://crm.farebulk.com',
            description: description || `Payment for Ticket Request ${ticketRequestId}`,
            metadata: {
                ticketRequestId: ticketRequestId, 
                userId: user._id.toString(),
                userEmail: user.email,
                originalCurrency: currency,
                originalAmount: amount.toString(),
                gateway: 'Stripe US'
            }
        });

        console.log('Stripe US - Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
            console.log('Stripe US - Payment succeeded immediately');
            await updateTicketStatus(ticketRequest, 'Charge', user, paymentIntent.id);

            return res.status(200).json({
                success: true,
                paymentIntentId: paymentIntent.id,
                status: 'succeeded',
                message: 'Payment completed successfully via Stripe US'
            });
        }
        else if (paymentIntent.status === 'requires_action') {
            console.log('Stripe US - Payment requires 3D Secure authentication');

            return res.status(200).json({
                success: true,
                requires_action: true,
                client_secret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                message: '3D Secure authentication required'
            });
        }
        else {
            console.log('Stripe US - Payment failed with status:', paymentIntent.status);

            return res.status(400).json({
                success: false,
                message: `Payment failed: ${paymentIntent.status}`,
                status: paymentIntent.status
            });
        }

    } catch (error) {
        console.error('Stripe US - Payment processing error:', error);

        let message = 'Payment processing failed';
        let code = 'payment_error';
        let statusCode = 500;

        if (error.type === 'StripeCardError') {
            message = error.message || 'Your card was declined';
            code = error.code || 'card_declined';
            statusCode = 400;
        } else if (error.type === 'StripeRateLimitError') {
            message = 'Too many requests. Please try again later.';
            code = 'rate_limit';
            statusCode = 429;
        } else if (error.type === 'StripeInvalidRequestError') {
            message = 'Invalid payment request. Please check your details.';
            code = 'invalid_request';
            statusCode = 400;
        } else if (error.type === 'StripeAPIError') {
            message = 'Payment service temporarily unavailable. Please try again.';
            code = 'api_error';
            statusCode = 502;
        } else if (error.type === 'StripeConnectionError') {
            message = 'Network error. Please check your connection and try again.';
            code = 'network_error';
            statusCode = 503;
        }

        return res.status(statusCode).json({
            success: false,
            message,
            code,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

const updateTicketStatus = async (ticketRequest, status, user, paymentIntentId) => {
    try {
        console.log(`Stripe US - Updating ticket ${ticketRequest._id} status to ${status}`);

        const updatedBy = user.userName || user.email || user._id.toString();

        ticketRequest.status = status;
        if (paymentIntentId) {
            ticketRequest.paymentIntentId = paymentIntentId;
        }
        if (status === 'Charge') {
            ticketRequest.paymentMethod = 'Stripe US';
        }
        await ticketRequest.save();

        const currency = ticketRequest.currency || 'USD';
        const mcoAmount = parseFloat(ticketRequest.mco) || 0;
        const saleAmountOriginal = mcoAmount - (mcoAmount * 0.15);
        
        let saleAmountUSD = saleAmountOriginal;
        if (currency !== 'USD') {
            const { convertCurrency } = require('../utils/currencyConverter');
            saleAmountUSD = convertCurrency(saleAmountOriginal, currency, 'USD');
        }

        const remark = status === 'Charge'
            ? `Payment successful via Stripe US - Transaction ID: ${paymentIntentId}`
            : `Payment failed via Stripe US${paymentIntentId ? ` - Transaction ID: ${paymentIntentId}` : ''}`;

        const ticketRequestStatus = new TicketRequestStatus({
            ticketRequest,
            status,
            paymentMethod: 'Stripe US',
            remark,
            updatedBy,
            paymentIntentId,
            currency,
            saleAmountOriginal,
            saleAmountUSD,
            exchangeRate: ticketRequest.exchangeRate || 1
        });

        await ticketRequestStatus.save();
        console.log('Stripe US - Ticket status updated successfully');

    } catch (error) {
        console.error('Stripe US - Error updating ticket status:', error);
        throw error;
    }
};

module.exports = {
    createStripePaymentIntent2,
};
