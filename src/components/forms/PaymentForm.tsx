import React, { useState } from "react";
import axios from "axios";
import { toast } from "../../components/ui/use-toast";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";



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

interface StatusData {
  paymentMethod: string;
}

interface PaymentFormProps {
  selectedRequest: TicketRequest | null;
  statusData: StatusData;
  fetchTicketRequests: () => Promise<void>;
  closeModal: () => void;
}


const PaymentForm: React.FC<PaymentFormProps> = ({
  selectedRequest,
  fetchTicketRequests,
  closeModal
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !selectedRequest) {
      toast({
        title: "Error",
        description: "Stripe is not ready",
        className: "bg-red-500 border border-red-200 text-white"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create payment method from card element
      const { paymentMethod, error } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement)!,
        billing_details: {
          name: selectedRequest.cardholderName || selectedRequest.passengerName,
          email: selectedRequest.billingEmail || selectedRequest.passengerEmail,
          phone: selectedRequest.billingPhone || selectedRequest.phoneNumber,
          address: {
            line1: selectedRequest.billingAddress,
            city: selectedRequest.billingCity,
            state: selectedRequest.billingState,
            postal_code: selectedRequest.billingZipCode,
            country: "US",
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // Send payment method to backend
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/stripe/create-payment-intent`,
        {
          ticketRequestId: selectedRequest._id,
          amount: Math.round(parseFloat(selectedRequest.mco) * 100), // Convert to cents
          paymentMethodId: paymentMethod.id,
          description: selectedRequest.Desc,
        },
        { withCredentials: true }
      );

      // Handle 3D Secure if required
      if (response.data.requires_action) {
        const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
          response.data.client_secret
        );
        
        if (confirmError) {
          throw new Error(confirmError.message);
        }
        
        if (paymentIntent?.status !== "succeeded") {
          throw new Error("Payment confirmation failed");
        }
      }

      // Success
      toast({
        title: "Payment Successful",
        description: `Payment of $${selectedRequest.mco} completed.`,
        className: "bg-green-500 border border-green-200 text-white"
      });
      
      await fetchTicketRequests();
      closeModal();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      toast({
        title: "Payment Failed",
        description: error.message || "Something went wrong.",
        className: "bg-red-500 border border-red-200 text-white"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {selectedRequest && (
        <div className="bg-gray-50 p-4 rounded-md border">
          <h3 className="font-semibold text-gray-700 mb-2">Payment Details</h3>
          <p className="text-sm text-gray-600">
            Amount: ${selectedRequest.mco}
          </p>
          <p className="text-sm text-gray-600">
            Card Number: {selectedRequest.cardNumber || "Not provided"}
          </p>
          <p className="text-sm text-gray-600">
            Expiry: {selectedRequest.expiryDate || "Not provided"}
          </p>
          <p className="text-sm text-gray-600">
            cvv: {selectedRequest.cvv || "Not provided"}
          </p>
           <p className="text-sm text-gray-600">
            ZIP: {selectedRequest.billingZipCode || "Not provided"}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} >
        <div className="mb-4 border p-4 rounded-md w-[400px]" >
          <CardElement
            options={{ 
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                }, 
                invalid: {
                  color: '#9e2146',
                },
              },
            }}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={!stripe || isSubmitting}
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {isSubmitting ? 'Processing...' : `Pay $${selectedRequest?.mco}`}
        </button>
      </form>
    </div>
  );
};

export default PaymentForm;