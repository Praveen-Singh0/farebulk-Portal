const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TicketRequest = require('../models/TicketRequest');
const TicketRequestStatus = require('../models/TicketRequestStatus');
const { User } = require('../models/User');

const createStripePaymentIntent = async (req, res) => {
    try {
        const { ticketRequestId, amount, paymentMethodId, description } = req.body;

        console.log('description:', description);

        

        console.log('Payment request received:', { ticketRequestId, amount, paymentMethodId });

        // Validate inputs
        if (!ticketRequestId || !amount || !paymentMethodId) {
            return res.status(400).json({ 
                success: false,
                message: 'Missing required parameters: ticketRequestId, amount, paymentMethodId'
            });
        }

        // Validate amount is positive
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

        console.log('Creating payment intent for user:', user.email);

        // Create payment intent and confirm immediately
        const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(amount), 
            currency: 'usd',
            payment_method: paymentMethodId,
            confirmation_method: 'automatic',
            confirm: true,
            return_url: 'https://your-domain.com/payment-return', // Add this line
            description: description || `Payment for Ticket Request ${ticketRequestId}`,
            metadata: {
                ticketRequestId: ticketRequestId, 
                userId: user._id.toString(),
                userEmail: user.email
            }
        });

        console.log('Payment intent created:', paymentIntent.id, 'Status:', paymentIntent.status);

        // Handle different payment statuses
        if (paymentIntent.status === 'succeeded') {
            console.log('Payment succeeded immediately');
            await updateTicketStatus(ticketRequest, 'Charge', user, paymentIntent.id);

            return res.status(200).json({
                success: true,
                paymentIntentId: paymentIntent.id,
                status: 'succeeded',
                message: 'Payment completed successfully'
            });
        }
        else if (paymentIntent.status === 'requires_action') {
            console.log('Payment requires 3D Secure authentication');

            return res.status(200).json({
                success: true,
                requires_action: true,
                client_secret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                message: '3D Secure authentication required'
            });
        }
        else {
            console.log('Payment failed with status:', paymentIntent.status);

            return res.status(400).json({
                success: false,
                message: `Payment failed: ${paymentIntent.status}`,
                status: paymentIntent.status
            });
        }

    } catch (error) {
        console.error('Payment processing error:', error);

        // Handle Stripe-specific errors
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

// ✅ Update ticket status exactly like your Authorize.Net implementation
const updateTicketStatus = async (ticketRequest, status, user, paymentIntentId) => {
    try {
        console.log(`Updating ticket ${ticketRequest._id} status to ${status}`);

        // Get updatedBy string
        const updatedBy = user.userName || user.email || user._id.toString();

        // ✅ Update ticketRequest status and save (exactly like your pattern)
        ticketRequest.status = status;
        if (paymentIntentId) {
            ticketRequest.paymentIntentId = paymentIntentId;
        }
        if (status === 'Charge') {
            ticketRequest.paymentMethod = 'Stripe';
        }
        await ticketRequest.save();

        // ✅ Create new TicketRequestStatus record (exactly like your pattern)
        const remark = status === 'Charge'
            ? `Payment successful via Stripe - Transaction ID: ${paymentIntentId}`
            : `Payment failed via Stripe${paymentIntentId ? ` - Transaction ID: ${paymentIntentId}` : ''}`;

        const ticketRequestStatus = new TicketRequestStatus({
            ticketRequest, // Pass the entire ticketRequest object
            status,
            paymentMethod: 'Stripe',
            remark,
            updatedBy,
            paymentIntentId // Add paymentIntentId to the status record too
        });

        await ticketRequestStatus.save();
        console.log('Ticket status updated successfully');

    } catch (error) {
        console.error('Error updating ticket status:', error);
        throw error; // Re-throw to handle in calling function
    }
};

module.exports = {
    createStripePaymentIntent,
};