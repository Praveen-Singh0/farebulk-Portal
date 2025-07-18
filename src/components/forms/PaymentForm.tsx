import React, { useState, useEffect } from "react";
import axios, { AxiosError } from "axios";
import { toast } from "../../components/ui/use-toast";
import { loadStripe } from "@stripe/stripe-js";

// Interfaces
interface TicketRequest {
  _id: string;
  passengerName: string;
  passengerEmail: string;
  phoneNumber: string;
  airlineCode: string;
  confirmationCode: string;
  ticketCost: string;
  status: string;
  mco: string;
  paymentMethod?: string;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  date: string;
  time?: string;
  datetime?: string;
  consultant?: string;
  ticketType?: string;
  requestFor?: string;
  Desc?: string;
  billingZipCode: string;
  billingCountry: string;
  billingState: string;
  billingCity: string;
  billingAddress: string;
  billingEmail?: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingPhone?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  amount?: number;
  userName?: string;
  email?: string;
}

interface BackendErrorResponse {
  message?: string;
  errorType?: string;
  errorCode?: string;
  errorDetails?: { code?: string; text?: string }[];
  shouldUseCheckout?: boolean; // Add this line
}

interface StatusData {
  paymentMethod: string;
}

interface PaymentFormProps {
  selectedRequest: TicketRequest | null;
  statusData: StatusData;
  fetchTicketRequests: () => Promise<void>;
  closeModal: () => void;
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string);

const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedRequest,
  fetchTicketRequests,
  closeModal,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stripe, setStripe] = useState<any>(null);
  const [paymentStep, setPaymentStep] = useState<string>("ready"); // ready, processing, checkout

  useEffect(() => {
    const initializeStripe = async () => {
      const stripeInstance = await stripePromise;
      setStripe(stripeInstance);
    };
    initializeStripe();
  }, []);

  const handleStripeCheckout = async () => {
    if (!selectedRequest) {
      toast({
        title: "Error",
        description: "No ticket request selected",
        className: "bg-red-500 border border-red-200 text-white",
      });
      return;
    }

    try {
      setPaymentStep("checkout");

      toast({
        title: "Creating checkout session...",
        description: "Redirecting to secure payment page...",
        className: "bg-blue-500 border border-blue-200 text-white",
      });

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/stripe/create-payment-intent`,
        {
          ticketRequestId: selectedRequest._id,
          amount: Math.round(parseFloat(selectedRequest.ticketCost) * 100),
          description: `Payment for Ticket Request ${selectedRequest._id}`,
          useCheckout: true,
        },
        { withCredentials: true }
      );

      if (response.data.success && response.data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.checkoutUrl;
      } else {
        toast({
          title: "Checkout Error",
          description: response.data.message || "Failed to create checkout session",
          className: "bg-red-500 border border-red-200 text-white",
        });
        setPaymentStep("ready");
      }
    } catch (err) {
      console.error("Stripe checkout error:", err);

      const error = err as AxiosError<BackendErrorResponse>;
      let errorMessage = "An unexpected error occurred";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Checkout Error",
        description: errorMessage,
        className: "bg-red-500 border border-red-200 text-white",
      });
      setPaymentStep("ready");
    }
  };

  const handleStripePayment = async () => {
    if (!selectedRequest || !stripe) {
      toast({
        title: "Error",
        description: !selectedRequest ? "No ticket request selected" : "Stripe not loaded",
        className: "bg-red-500 border border-red-200 text-white",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      setPaymentStep("processing");

      // Check if we have card details for direct payment
      const hasCardDetails = selectedRequest.cardNumber && selectedRequest.expiryDate && selectedRequest.cvv;

      if (!hasCardDetails) {
        // No card details, go straight to checkout
        await handleStripeCheckout();
        return;
      }

      toast({
        title: "Processing payment...",
        description: "Creating secure payment token...",
        className: "bg-yellow-500 border border-yellow-200 text-white",
      });

      // Parse expiry date (assuming format MM/YY)
      const [exp_month, exp_year] = selectedRequest?.expiryDate?.split('/') || ['', ''];
      const fullYear = `20${exp_year}`;

      // Create payment method using Stripe.js (secure tokenization)
      const { paymentMethod, error: paymentMethodError } = await stripe.createPaymentMethod({
        type: 'card',
        card: {
          number: selectedRequest.cardNumber?.replace(/\s/g, '') || '',
          exp_month: parseInt(exp_month, 10),
          exp_year: parseInt(fullYear, 10),
          cvc: selectedRequest.cvv,
        },
        billing_details: {
          name: selectedRequest.cardholderName || selectedRequest.passengerName,
          email: selectedRequest.billingEmail || selectedRequest.passengerEmail,
          phone: selectedRequest.billingPhone || selectedRequest.phoneNumber,
          address: {
            line1: selectedRequest.billingAddress,
            city: selectedRequest.billingCity,
            state: selectedRequest.billingState,
            postal_code: selectedRequest.billingZipCode,
            country: selectedRequest.billingCountry === 'US' ? 'US' : 'US',
          },
        },
      });

      if (paymentMethodError) {
        // Card details invalid, fallback to checkout
        toast({
          title: "Card Error",
          description: "Card details invalid. Redirecting to secure checkout...",
          className: "bg-yellow-500 border border-yellow-200 text-white",
        });
        await handleStripeCheckout();
        return;
      }

      toast({
        title: "Processing payment...",
        description: "Sending payment to server...",
        className: "bg-yellow-500 border border-yellow-200 text-white",
      });

      // Send payment method to backend
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/stripe/create-payment-intent`,
        {
          ticketRequestId: selectedRequest._id,
          amount: Math.round(parseFloat(selectedRequest.ticketCost) * 100),
          description: `Payment for Ticket Request ${selectedRequest._id}`,
          paymentMethodId: paymentMethod.id,
          useCheckout: false,
        },
        { withCredentials: true }
      );

      console.log('Payment response:', response.data);

      if (response.data.success) {
        // Check if payment requires confirmation (3D Secure)
        if (response.data.requires_action && response.data.client_secret) {
          toast({
            title: "Authentication Required",
            description: "Completing payment authentication...",
            className: "bg-blue-500 border border-blue-200 text-white",
          });

          const { error: confirmError } = await stripe.confirmCardPayment(
            response.data.client_secret
          );

          if (confirmError) {
            // 3D Secure failed, fallback to checkout
            toast({
              title: "Authentication Failed",
              description: "Redirecting to secure checkout...",
              className: "bg-yellow-500 border border-yellow-200 text-white",
            });
            await handleStripeCheckout();
            return;
          }
        }

        toast({
          title: "Payment Success!",
          description: `Payment of $${selectedRequest.ticketCost} processed successfully. Transaction ID: ${response.data.paymentIntentId}`,
          className: "bg-green-500 border border-green-200 text-white",
        });

        // Refresh the ticket requests and close modal
        await fetchTicketRequests();
        closeModal();
      } else {
        // Direct payment failed, fallback to checkout
        if (response.data.shouldUseCheckout) {
          toast({
            title: "Direct Payment Failed",
            description: "Redirecting to secure checkout...",
            className: "bg-yellow-500 border border-yellow-200 text-white",
          });
          await handleStripeCheckout();
        } else {
          toast({
            title: "Payment Failed",
            description: response.data.message || "Payment processing failed",
            className: "bg-red-500 border border-red-200 text-white",
          });
          setPaymentStep("ready");
        }
      }
    } catch (err) {
      console.error("Stripe payment error:", err);

      const error = err as AxiosError<BackendErrorResponse>;
      let errorMessage = "An unexpected error occurred";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Check if we should fallback to checkout
      if (error.response?.data?.shouldUseCheckout) {
        toast({
          title: "Direct Payment Failed",
          description: "Redirecting to secure checkout...",
          className: "bg-yellow-500 border border-yellow-200 text-white",
        });
        await handleStripeCheckout();
      } else {
        toast({
          title: "Payment Error",
          description: errorMessage,
          className: "bg-red-500 border border-red-200 text-white",
        });
        setPaymentStep("ready");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine button text and icon based on current state
  const getButtonContent = () => {
    if (paymentStep === "checkout") {
      return {
        text: "Redirecting to Checkout...",
        icon: (
          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        className: "bg-gradient-to-r from-blue-500 to-blue-600"
      };
    }

    if (isSubmitting || paymentStep === "processing") {
      return {
        text: "Processing Payment...",
        icon: (
          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        className: "bg-gradient-to-r from-yellow-500 to-yellow-600"
      };
    }

    if (!stripe) {
      return {
        text: "Loading Stripe...",
        icon: (
          <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ),
        className: "bg-gradient-to-r from-gray-500 to-gray-600"
      };
    }

    return {
      text: `Pay $${selectedRequest?.ticketCost || '0'} with Stripe`,
      icon: (
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      className: "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
    };
  };

  const buttonContent = getButtonContent();

  return (
    <div className="space-y-4">
      {/* Display card information */}
      {selectedRequest && (
        <div className="bg-gray-50 p-4 rounded-md border">
          <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
          <p className="text-sm text-gray-600">
            Card: •••• •••• •••• {selectedRequest.cardNumber?.slice(-4) || 'N/A'}
          </p>
          <p className="text-sm text-gray-600">
            Cardholder: {selectedRequest.cardholderName || selectedRequest.passengerName}
          </p>
          <p className="text-sm text-gray-600">
            Amount: ${selectedRequest.ticketCost}
          </p>
          {(!selectedRequest.cardNumber || !selectedRequest.expiryDate || !selectedRequest.cvv) && (
            <p className="text-sm text-yellow-600 mt-2">
              ⚠️ No card details found. Will redirect to Stripe Checkout.
            </p>
          )}
        </div>
      )}

      {/* Single Payment Button */}
      <button
        onClick={handleStripePayment}
        disabled={!selectedRequest || isSubmitting || !stripe || paymentStep !== "ready"}
        className={`w-full px-8 py-3 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-all duration-200 shadow-lg hover:shadow-xl ${buttonContent.className}`}
      >
        {buttonContent.icon}
        {buttonContent.text}
      </button>

      {/* Payment flow explanation */}
      <div className="text-xs text-gray-500 text-center">
        {selectedRequest?.cardNumber && selectedRequest?.expiryDate && selectedRequest?.cvv ? (
          "Will attempt direct payment first, then fallback to Stripe Checkout if needed"
        ) : (
          "Will redirect to Stripe Checkout for secure payment"
        )}
      </div>
    </div>
  );
};

export default PaymentForm;