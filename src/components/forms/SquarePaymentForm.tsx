import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { toast } from "../../components/ui/use-toast";
import type { TicketRequest } from "@/types/ticketRequest";

interface StatusData {
  paymentMethod: string;
}

interface SquarePaymentFormProps {
  selectedRequest: TicketRequest | null;
  statusData: StatusData;
  fetchTicketRequests: () => Promise<void>;
  closeModal: () => void;
}

declare global {
  interface Window {
    Square?: {
      payments: (appId: string, locationId: string) => Promise<SquarePayments>;
    };
  }
}

interface SquarePayments {
  card: () => Promise<SquareCard>;
}

interface SquareCard {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<{ status: string; token?: string; errors?: Array<{ message: string }> }>;
  destroy: () => Promise<void>;
}

const SquarePaymentForm: React.FC<SquarePaymentFormProps> = ({
  selectedRequest,
  fetchTicketRequests,
  closeModal,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [sdkError, setSdkError] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState("");
  const cardRef = useRef<SquareCard | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const appId = import.meta.env.VITE_SQUARE_APPLICATION_ID;
  const locationId = import.meta.env.VITE_SQUARE_LOCATION_ID;

  // Load Square Web Payments SDK
  useEffect(() => {
    const loadSquareSDK = async () => {
      // Check if already loaded
      if (window.Square) {
        await initializeCard();
        return;
      }

      // Load the script
      const script = document.createElement("script");
      script.src = "https://web.squarecdn.com/v1/square.js";
      // For production use: "https://web.squarecdn.com/v1/square.js"
      script.onload = async () => {
        await initializeCard();
      };
      script.onerror = () => {
        setSdkError("Failed to load Square payment SDK");
      };
      document.body.appendChild(script);
    };

    const initializeCard = async () => {
      try {
        if (!window.Square) {
          setSdkError("Square SDK not available");
          return;
        }

        const payments = await window.Square.payments(appId, locationId);
        const card = await payments.card();
        await card.attach("#square-card-container");
        cardRef.current = card;
        setSdkLoaded(true);
      } catch (err: unknown) {
        console.error("Square card init error:", err);
        setSdkError(err instanceof Error ? err.message : "Failed to initialize Square card form");
      }
    };

    loadSquareSDK();

    return () => {
      if (cardRef.current) {
        cardRef.current.destroy().catch(console.error);
      }
    };
  }, [appId, locationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cardRef.current || !selectedRequest) {
      toast({
        title: "Error",
        description: "Payment form is not ready",
        className: "bg-red-500 border border-red-200 text-white",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Tokenize the card
      const result = await cardRef.current.tokenize();

      if (result.status !== "OK" || !result.token) {
        const errorMsg = result.errors?.map((e) => e.message).join(", ") || "Card tokenization failed";
        throw new Error(errorMsg);
      }

      // Send to backend
      const mcoAmount = selectedRequest.mcoUSD || selectedRequest.mco;
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/square/create-payment`,
        {
          ticketRequestId: selectedRequest._id,
          amount: parseFloat(mcoAmount),
          sourceId: result.token,
          description: selectedRequest.Desc,
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        toast({
          title: "Payment Successful",
          description: `Payment of $${mcoAmount} completed via Square.`,
          className: "bg-green-500 border border-green-200 text-white",
        });
        await fetchTicketRequests();
        closeModal();
      } else {
        throw new Error(response.data.message || "Payment failed");
      }
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : "Something went wrong";
      toast({
        title: "Payment Failed",
        description: errMsg,
        className: "bg-red-500 border border-red-200 text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyClick = async (text: string | number) => {
    await navigator.clipboard.writeText(text.toString());
    setCopyStatus("Copied");
    setTimeout(() => setCopyStatus(""), 1000);
  };

  const CopyTooltip: React.FC<{ status: string }> = ({ status }) => {
    if (!status) return null;
    return (
      <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
        {status}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {selectedRequest && (
        <div className="bg-gray-50 p-4 rounded-md border">
          <h3 className="font-semibold text-gray-700 mb-2">Payment Details (Square)</h3>
          <CopyTooltip status={copyStatus} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Amount: ${selectedRequest?.mcoUSD}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Card Number: {selectedRequest?.cardNumber || "Not provided"}
              </p>
              <button
                onClick={() => handleCopyClick(selectedRequest?.cardNumber ?? "Not provided")}
                className="ml-2 p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                ��
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Expiry: {selectedRequest?.expiryDate || "Not provided"}
              </p>
              <button
                onClick={() => handleCopyClick(selectedRequest?.expiryDate ?? "Not provided")}
                className="ml-2 p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                📋
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                CVV: {selectedRequest?.cvv || "Not provided"}
              </p>
              <button
                onClick={() => handleCopyClick(selectedRequest?.cvv ?? "Not provided")}
                className="ml-2 p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                📋
              </button>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                ZIP: {selectedRequest?.billingZipCode || "Not provided"}
              </p>
              <button
                onClick={() => handleCopyClick(selectedRequest?.billingZipCode ?? "Not provided")}
                className="ml-2 p-1 text-gray-500 hover:bg-gray-100 rounded"
              >
                📋
              </button>
            </div>
          </div>
        </div>
      )}

      {sdkError && (
        <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded">
          {sdkError}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-4 border p-4 rounded-md w-[400px]" ref={containerRef}>
          {!sdkLoaded && !sdkError && (
            <div className="text-gray-400 text-sm py-3 text-center">
              Loading Square payment form...
            </div>
          )}
          <div id="square-card-container"></div>
        </div>

        <button
          type="submit"
          disabled={!sdkLoaded || isSubmitting}
          className="w-full bg-green-600 text-white p-2 rounded disabled:opacity-50 hover:bg-green-700 transition-colors"
        >
          {isSubmitting ? "Processing..." : `Pay $${selectedRequest?.mcoUSD} via Square`}
        </button>
      </form>
    </div>
  );
};

export default SquarePaymentForm;
