const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const TicketRequest = require('../models/TicketRequest');
const TicketRequestStatus = require('../models/TicketRequestStatus');
const { User } = require('../models/User');

// Create Payment Intent for Ticket Request (with Checkout fallback)
const createStripePaymentIntent = async (req, res) => {
  console.log("createStripePaymentIntent......", req.body.ticketRequestId, "--and--", req.body.amount);

  try {
    const { ticketRequestId, amount, description, paymentMethodId, useCheckout } = req.body;
    const userId = req.user.id;

    // Validation
    if (!ticketRequestId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'ticketRequestId and amount are required',
      });
    }

    // Find ticket request
    const ticketRequest = await TicketRequest.findById(ticketRequestId);
    if (!ticketRequest) {
      return res.status(404).json({
        success: false,
        message: 'Ticket request not found',
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Create or get Stripe customer
    let stripeCustomerId = user.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.userName,
        metadata: { userId: userId.toString() },
      });
      stripeCustomerId = customer.id;
      await User.findByIdAndUpdate(userId, { stripeCustomerId });
    }

    // If useCheckout is true or no payment method provided, create Checkout session
    if (useCheckout || !paymentMethodId) {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        customer: stripeCustomerId,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Ticket Request ${ticketRequestId}`,
                description: description || `Payment for Ticket Request ${ticketRequestId}`,
              },
              unit_amount: amount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}&ticket_id=${ticketRequestId}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel?ticket_id=${ticketRequestId}`,
        metadata: {
          ticketRequestId: ticketRequestId,
          userId: userId.toString(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Checkout session created',
        sessionId: session.id,
        checkoutUrl: session.url,
        useCheckout: true,
      });
    }

    // Continue with direct payment intent creation
    console.log("stripeCustomerId...", stripeCustomerId);

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: stripeCustomerId,
      payment_method: paymentMethodId,
      confirmation_method: 'automatic',
      confirm: true,
      description: description || `Payment for Ticket Request ${ticketRequestId}`,
      metadata: {
        ticketRequestId: ticketRequestId,
        userId: userId.toString(),
      },
      return_url: `${process.env.FRONTEND_URL}/payment-return`,
    });

    console.log("paymentIntent...", paymentIntent);

    // Handle payment intent responses (same as before)
    if (paymentIntent.status === 'succeeded') {
      await TicketRequest.findByIdAndUpdate(ticketRequestId, {
        status: 'Charge',
        paymentIntentId: paymentIntent.id,
      });

      const updatedBy = user.userName || user.email || userId;
      const ticketRequestStatus = new TicketRequestStatus({
        ticketRequest: ticketRequestId,
        status: 'Charge',
        paymentMethod: 'Stripe',
        remark: `Payment successful via Stripe - Transaction ID: ${paymentIntent.id}`,
        updatedBy,
      });
      await ticketRequestStatus.save();

      return res.status(200).json({
        success: true,
        message: 'Payment successful',
        paymentIntentId: paymentIntent.id,
        amount,
        currency: 'usd',
        status: paymentIntent.status,
      });
    } else if (paymentIntent.status === 'requires_action') {
      return res.status(200).json({
        success: true,
        message: 'Payment requires additional authentication',
        paymentIntentId: paymentIntent.id,
        client_secret: paymentIntent.client_secret,
        status: paymentIntent.status,
        requires_action: true,
      });
    } else if (paymentIntent.status === 'requires_payment_method') {
      return res.status(400).json({
        success: false,
        message: 'Payment method was declined',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        shouldUseCheckout: true, // Flag to indicate checkout should be used
      });
    } else if (paymentIntent.status === 'processing') {
      return res.status(200).json({
        success: true,
        message: 'Payment is being processed',
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      });
    } else {
      await TicketRequest.findByIdAndUpdate(ticketRequestId, {
        status: 'Failed',
      });

      const updatedBy = user.userName || user.email || userId;
      const ticketRequestStatus = new TicketRequestStatus({
        ticketRequest: ticketRequestId,
        status: 'Failed',
        paymentMethod: 'Stripe',
        remark: `Payment failed via Stripe - Transaction ID: ${paymentIntent.id}, Status: ${paymentIntent.status}`,
        updatedBy,
      });
      await ticketRequestStatus.save();

      return res.status(400).json({
        success: false,
        message: `Payment failed with status: ${paymentIntent.status}`,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
        shouldUseCheckout: true, // Flag to indicate checkout should be used
      });
    }

  } catch (error) {
    console.error('Error creating Stripe payment intent:', error);
    
    // Handle Stripe-specific errors
    if (error.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        code: error.code,
        decline_code: error.decline_code,
        shouldUseCheckout: true, // Suggest checkout for card errors
      });
    } else if (error.type === 'StripeRateLimitError') {
      return res.status(429).json({
        success: false,
        message: 'Too many requests made to the API too quickly',
      });
    } else if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({
        success: false,
        message: error.message,
        shouldUseCheckout: true,
      });
    } else if (error.type === 'StripeAPIError') {
      return res.status(500).json({
        success: false,
        message: 'An error occurred with Stripe API',
      });
    } else if (error.type === 'StripeConnectionError') {
      return res.status(500).json({
        success: false,
        message: 'A network error occurred',
      });
    } else if (error.type === 'StripeAuthenticationError') {
      return res.status(401).json({
        success: false,
        message: 'Authentication with Stripe failed',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    });
  }
};

// Handle Checkout Session Success
const handleCheckoutSuccess = async (req, res) => {
  try {
    const { session_id } = req.query;
    
    if (!session_id) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required',
      });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);
    const { ticketRequestId, userId } = session.metadata;

    if (session.payment_status === 'paid') {
      // Update ticket request
      await TicketRequest.findByIdAndUpdate(ticketRequestId, {
        status: 'Charge',
        paymentIntentId: session.payment_intent,
      });

      const user = await User.findById(userId).select('userName email');
      const updatedBy = user?.userName || user?.email || userId;

      // Create status record
      const ticketRequestStatus = new TicketRequestStatus({
        ticketRequest: ticketRequestId,
        status: 'Charge',
        paymentMethod: 'Stripe',
        remark: `Payment successful via Stripe Checkout - Session ID: ${session_id}`,
        updatedBy,
      });
      await ticketRequestStatus.save();

      return res.status(200).json({
        success: true,
        message: 'Payment successful',
        sessionId: session_id,
        paymentIntentId: session.payment_intent,
        amount: session.amount_total,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Payment was not completed',
        sessionId: session_id,
      });
    }

  } catch (error) {
    console.error('Error handling checkout success:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to handle checkout success',
      error: error.message,
    });
  }
};

// Updated Stripe Webhook Handler
const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        const { ticketRequestId, userId } = paymentIntent.metadata;

        console.log('Payment succeeded webhook for:', ticketRequestId);

        if (ticketRequestId) {
          const ticketRequest = await TicketRequest.findById(ticketRequestId);
          if (ticketRequest && ticketRequest.status !== 'Charge') {
            ticketRequest.status = 'Charge';
            ticketRequest.paymentIntentId = paymentIntent.id;
            await ticketRequest.save();

            const user = await User.findById(userId).select('userName email');
            const updatedBy = user?.userName || user?.email || userId;

            const ticketRequestStatus = new TicketRequestStatus({
              ticketRequest: ticketRequestId,
              status: 'Charge',
              paymentMethod: 'Stripe',
              remark: `Payment successful via Stripe webhook - Transaction ID: ${paymentIntent.id}`,
              updatedBy,
            });
            await ticketRequestStatus.save();
          }
        }
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object;
        const { ticketRequestId, userId } = session.metadata;

        console.log('Checkout session completed webhook for:', ticketRequestId);

        if (ticketRequestId && session.payment_status === 'paid') {
          const ticketRequest = await TicketRequest.findById(ticketRequestId);
          if (ticketRequest && ticketRequest.status !== 'Charge') {
            ticketRequest.status = 'Charge';
            ticketRequest.paymentIntentId = session.payment_intent;
            await ticketRequest.save();

            const user = await User.findById(userId).select('userName email');
            const updatedBy = user?.userName || user?.email || userId;

            const ticketRequestStatus = new TicketRequestStatus({
              ticketRequest: ticketRequestId,
              status: 'Charge',
              paymentMethod: 'Stripe',
              remark: `Payment successful via Stripe Checkout - Session ID: ${session.id}`,
              updatedBy,
            });
            await ticketRequestStatus.save();
          }
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        const { ticketRequestId, userId } = paymentIntent.metadata;

        console.log('Payment failed webhook for:', ticketRequestId);

        if (ticketRequestId) {
          const ticketRequest = await TicketRequest.findById(ticketRequestId);
          if (ticketRequest && ticketRequest.status !== 'Failed') {
            ticketRequest.status = 'Failed';
            await ticketRequest.save();

            const user = await User.findById(userId).select('userName email');
            const updatedBy = user?.userName || user?.email || userId;

            const ticketRequestStatus = new TicketRequestStatus({
              ticketRequest: ticketRequestId,
              status: 'Failed',
              paymentMethod: 'Stripe',
              remark: `Payment failed via Stripe webhook - Transaction ID: ${paymentIntent.id}`,
              updatedBy,
            });
            await ticketRequestStatus.save();
          }
        }
        break;
      }

      case 'payment_intent.processing': {
        const paymentIntent = event.data.object;
        const { ticketRequestId, userId } = paymentIntent.metadata;

        console.log('Payment processing webhook for:', ticketRequestId);

        if (ticketRequestId) {
          const ticketRequest = await TicketRequest.findById(ticketRequestId);
          if (ticketRequest) {
            const user = await User.findById(userId).select('userName email');
            const updatedBy = user?.userName || user?.email || userId;

            const ticketRequestStatus = new TicketRequestStatus({
              ticketRequest: ticketRequestId,
              status: 'Processing',
              paymentMethod: 'Stripe',
              remark: `Payment is being processed via Stripe - Transaction ID: ${paymentIntent.id}`,
              updatedBy,
            });
            await ticketRequestStatus.save();
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

module.exports = {
  createStripePaymentIntent,
  handleStripeWebhook,
  handleCheckoutSuccess,
};