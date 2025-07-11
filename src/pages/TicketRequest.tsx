"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Eye, X } from "lucide-react";
import { format } from "date-fns";
import axios, { AxiosError } from "axios";

import { useAuth } from '@/contexts/use-auth';
import { toast } from "../components/ui/use-toast";

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
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface BackendErrorResponse {
  message?: string;
  errorType?: string;
  errorCode?: string;
  errorDetails?: { code?: string; text?: string }[];
}


export default function Submission() {
  const { user } = useAuth();
  const [ticketRequests, setTicketRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRequests, setFilteredRequests] = useState<TicketRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TicketRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  const [currentSlide, setCurrentSlide] = useState(0);
  const [statusData, setStatusData] = useState({
    status: '',
    paymentMethod: '',
    remark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTicketRequests = async () => {
    try {
      setLoading(true);

      if (!user || !user.email) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/ticket-requests`, {
        withCredentials: true
      });

      // Filter tickets based on user email and status
      const userTickets = response.data.filter((ticket: TicketRequest) => {
        // First filter by user access
        let hasAccess = user.role === 'ticket' || user.role === 'admin';

        if (!hasAccess) {
          hasAccess =
            ticket.passengerEmail === user.email ||
            ticket.consultant === user.userName ||
            ticket.consultant === user.email;
        }


        // Then filter by status - only show pending requests
        return hasAccess && ticket.status === 'Pending';
      });

      console.log("Filtered tickets for user:", userTickets);

      setTicketRequests(userTickets);
      setFilteredRequests(userTickets);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Filter requests based on search term
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredRequests(ticketRequests);
    } else {
      const filtered = ticketRequests.filter((request) =>
        request.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.passengerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.ticketType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.consultant?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRequests(filtered);
    }
  }, [searchTerm, ticketRequests]);

  // Fetch data when user changes or component mounts
  useEffect(() => {
    if (user) {
      fetchTicketRequests();
    }
  }, [user]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy 'at' hh:mm a");
    } catch {
      return dateString;
    }
  };





  const maskCardNumber = (cardNumber?: string) => {
    if (!cardNumber) return "N/A";
    return cardNumber.replace(/(.{4})/g, "$1 ").trim();
  };

  // Format currency
  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return isNaN(num) ? amount : num.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  // Handle view details
  const handleViewDetails = (request: TicketRequest) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };


  const handleNext = () => {
    setCurrentSlide(1);
  };


  // Add status update handler
  const handleStatusUpdate = async () => {
    if (!selectedRequest) return;

    if (!statusData.status) {
      alert('Status are required.');
      return;
    }
    if (!statusData.paymentMethod) {
      alert('Payment Method are required.');
      return;
    }

    try {
      setIsSubmitting(true);

      const updateData = {
        ticketRequestId: selectedRequest._id,
        status: statusData.status,
        paymentMethod: statusData.paymentMethod,
        remark: statusData.remark,
        ticketRequest: selectedRequest // Include the full ticket request
      };


      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/ticket-requests-status/`,
        updateData,
        {
          withCredentials: true,
        }
      );

      console.log('Response:', response.data);

      if (response.data.success) {
        // Refresh the ticket requests list
        await fetchTicketRequests();

        // Show success message

        // Close the modal after successful update
        closeModal();
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleAuthUsPayment = async () => {
    if (!selectedRequest) return;

    try {
      setIsSubmitting(true);

      toast({
        title: "Processing your payment on BACKEND...",
        description: "We securely connect to Authorize.net.",
        className: "bg-yellow-500 border border-yellow-200 text-white",
      });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      const updateData = {
        ticketRequestId: selectedRequest._id,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/ticket-requests-AuthrizeUS/`,
        updateData,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        // ✅ Show success toast with transaction details
        toast({
          title: "Payment successful!",
          description: `Transaction ID: ${response.data.transactionId}${response.data.authCode ? ` | Auth Code: ${response.data.authCode}` : ''
            }`,
          className: "bg-green-500 border border-green-200 text-white",
        });

        // Refresh ticket requests
        await fetchTicketRequests();

        // Close modal
        closeModal();
      } else {
        // ❌ Show specific error toast from backend
        toast({
          title: "Payment failed!",
          description: response.data.message || "Something went wrong.",
          className: "bg-red-500 border border-red-200 text-white",
        });
      }
    } catch (error) {
      console.error("Error payment:", error);
      const err = error as AxiosError;


      let errorMessage = "Transaction failed.";
      let errorTitle = "Payment error";

      // Handle different types of errors
      if (err.response) {
        // Server responded with error status
        const errorData = err.response.data as BackendErrorResponse;
        if (errorData.message) {
          // Use specific error message from backend
          errorMessage = errorData.message;

          // Customize title based on error type
          if (errorData.errorType === 'API_ERROR') {
            errorTitle = "API Authentication Error";
          } else if (errorData.errorCode) {
            errorTitle = `Payment Declined (Code: ${errorData.errorCode})`;
          } else {
            errorTitle = "Payment Error";
          }

          // Add error details if available
          if (errorData.errorDetails && errorData.errorDetails.length > 0) {
            const firstError = errorData.errorDetails[0];
            errorMessage = `${errorMessage}${firstError.code ? ` (Error Code: ${firstError.code})` : ''
              }`;
          }
        } else {
          // Fallback error handling
          errorMessage = `Server error: ${err.response.status}`;
        }
      } else if (err.request) {
        // Network error
        errorTitle = "Network Error";
        errorMessage = "Unable to connect to payment server. Please check your internet connection.";
      } else {
        // Other errors
        errorTitle = "Unexpected Error";
        errorMessage = err.message || "An unexpected error occurred.";
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        className: "bg-red-500 border border-red-200 text-white",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setCurrentSlide(0);
    setStatusData({
      status: '',
      paymentMethod: '',
      remark: ''
    });
  };



  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <button
                onClick={fetchTicketRequests}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center mx-auto"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated state
  if (!user) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-gray-500 mb-4">Please log in to view ticket requests</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {user.role === 'admin' ? 'All Ticket Requests' : 'My Ticket Requests'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin'
              ? `Manage and view all ticket requests (${ticketRequests.length} total)`
              : `View your ticket requests (${ticketRequests.length} total)`
            }
          </p>

        </div>
        <button
          onClick={fetchTicketRequests}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Search and Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {user.role === 'admin' || user.role === 'ticket' ? 'All Submissions' : 'My Submissions'} ({filteredRequests.length} showing)
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, code, type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left p-3 font-semibold text-gray-700">Consultant</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Passenger</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ticket Type</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Confirmation</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Cost</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Submitted</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  {user.role === "ticket" && (
                    <th className="text-right p-3 font-semibold text-gray-700">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="flex items-center justify-center h-64">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                        <span className="ml-2 text-gray-600">Loading ticket requests...</span>

                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center p-8 text-gray-500">
                      {searchTerm
                        ? "No ticket requests match your search."
                        : user.role === 'admin' || user.role === 'ticket'
                          ? "No ticket requests found."
                          : "You haven't submitted any ticket requests yet."}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr key={request._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{request.consultant}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{request.passengerName}</div>
                        <div className="text-sm text-gray-500">{request.passengerEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900"> {request.ticketType || "N/A"}
                          {request.airlineCode ? ` - ${request.airlineCode}` : ""}
                        </div>
                        <div className="text-sm text-gray-500">{request.requestFor || "N/A"}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{request.confirmationCode}</span>
                      </td>
                      <td className="p-3">
                        <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          Ticket Cost : {formatCurrency(request.ticketCost)}
                        </div>
                        <div className="text-sm text-gray-500 px-2 py-1">MCO : {formatCurrency(request.mco)}</div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-700">{request.date}  {request.time}</div>
                      </td>
                      <td className="p-3">
                        <div className="inline-block bg-yellow-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          {request.status || "No Status"}
                        </div>
                      </td>
                      {user.role === "ticket" && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewDetails(request)}
                              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                              title="View Details"
                            >
                              <Eye className="h-4 w-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      )}

                    </tr>
                  ))
                )}
              </tbody>

            </table>
          </div>
        </div>
      </div>

      {/* Modal - Keep the same modal code from previous response */}




      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Enhanced Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Ticket Request Details
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 group"
              >
                <X className="h-6 w-6 text-gray-500 group-hover:text-gray-700" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
                {currentSlide === 0 ? (
                  <div className="space-y-8">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center space-x-2 mb-8">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <div className="w-12 h-0.5 bg-gray-300"></div>
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                      {/* Passenger Information */}
                      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 border border-blue-100">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Passenger Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Name</label>
                            <p className="text-gray-900 font-medium bg-white/60 px-3 py-2 rounded-lg">
                              {selectedRequest.passengerName}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                            <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg break-all">
                              {selectedRequest.passengerEmail}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Phone Number</label>
                            <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                              {selectedRequest.phoneNumber}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Information */}
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Ticket Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Request For</label>
                            <div className="bg-white/60 px-3 py-2 rounded-lg">
                              <p className="text-gray-900">{selectedRequest.ticketType || "N/A"}</p>
                              <p className="text-gray-900">{selectedRequest.requestFor || "N/A"}</p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Confirmation Code</label>
                            <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                              {selectedRequest.confirmationCode}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                            <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                              {selectedRequest.Desc || "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Ticket Cost</label>
                            <p className="text-2xl font-bold text-green-600 bg-white/60 px-3 py-2 rounded-lg">
                              {formatCurrency(selectedRequest.ticketCost)}
                            </p>
                          </div>

                          {selectedRequest.mco && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">MCO</label>
                              <p className="text-xl font-semibold text-purple-600 bg-white/60 px-3 py-2 rounded-lg">
                                {formatCurrency(selectedRequest.mco)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>


                      {/* Payment Information */}
                      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Payment Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Payment Method</label>
                            <p className="text-gray-900 capitalize bg-white/60 px-3 py-2 rounded-lg">
                              {selectedRequest.paymentMethod || "N/A"}
                            </p>
                          </div>
                          {selectedRequest.cardholderName && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Cardholder Name</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.cardholderName}
                              </p>
                            </div>
                          )}
                          {selectedRequest.cardNumber && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Card Number</label>
                              <p className="text-gray-900 font-mono bg-white/60 px-3 py-2 rounded-lg">
                                {maskCardNumber(selectedRequest.cardNumber)}
                              </p>
                            </div>
                          )}
                          {selectedRequest.expiryDate && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Expiry Date</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.expiryDate}
                              </p>
                            </div>
                          )}
                          {selectedRequest.cvv && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">CVV</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.cvv}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Booking Information */}
                      <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Booking Information</h4>
                        </div>
                        <div className="space-y-4">
                          {selectedRequest.date && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Date</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.date}
                              </p>
                            </div>
                          )}
                          {selectedRequest.time && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Time</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.time}
                              </p>
                            </div>
                          )}
                          {selectedRequest.consultant && (
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Consultant</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.consultant}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Billing Information */}
                      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">Billing Details</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Address</label>
                            <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                              {selectedRequest.billingAddress || "N/A"}
                            </p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.billingCity || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">State</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.billingState || "N/A"}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Country</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.billingCountry || "N/A"}
                              </p>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-600 mb-2">Zip Code</label>
                              <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                                {selectedRequest.billingZipCode || "N/A"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* System Information */}
                      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                        <div className="flex items-center space-x-3 mb-6">
                          <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900">System Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Created At</label>
                            <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                              {formatDate(selectedRequest.createdAt)}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Updated At</label>
                            <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                              {formatDate(selectedRequest.updatedAt)}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-2">Request ID</label>
                            <p className="text-gray-900 font-mono text-xs bg-white/60 px-3 py-2 rounded-lg break-all">
                              {selectedRequest._id}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-2xl mx-auto">
                    {/* Progress indicator */}
                    <div className="flex items-center justify-center space-x-2 mb-8">
                      <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                      <div className="w-12 h-0.5 bg-gray-300"></div>
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100">
                      <div className="flex items-center space-x-3 mb-8">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <h4 className="text-2xl font-bold text-gray-900">Update Ticket Status</h4>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Status Selection */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Status *</label>
                            <select
                              value={statusData.status}
                              onChange={(e) => setStatusData(prev => ({ ...prev, status: e.target.value }))}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/80"
                            >
                              <option value="">Select Status</option>
                              <option value="Charge">Charge</option>
                              <option value="Not Charge">Not Charge</option>
                            </select>
                          </div>

                          {/* Payment Method Selection */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">Payment Method *</label>
                            <select
                              value={statusData.paymentMethod}
                              onChange={(e) =>
                                setStatusData((prev) => ({ ...prev, paymentMethod: e.target.value }))
                              }
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/80"
                            >
                              <option value="">Select Payment Method</option>
                              <option value="Stripe UK">Stripe UK</option>
                              <option value="Stripe India">Stripe India</option>
                              <option value="Authorize US">Authorize US</option>
                            </select>
                          </div>
                        </div>

                        {/* Remark Field */}
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Remark</label>
                          <textarea
                            value={statusData.remark}
                            onChange={(e) => setStatusData(prev => ({ ...prev, remark: e.target.value }))}
                            rows={5}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 bg-white/80 resize-none"
                            placeholder="Enter your remarks here..."
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end pt-4">
                          {statusData.paymentMethod === 'Authorize US' ? (
                            <button
                              onClick={handleAuthUsPayment}
                              disabled={isSubmitting}
                              className="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {isSubmitting ? (
                                <>
                                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                  Payment Processing...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                  Authorize US
                                </>
                              )}
                            </button>
                          ) : (
                            <button
                              onClick={handleStatusUpdate}
                              disabled={isSubmitting}
                              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              {isSubmitting ? (
                                <>
                                  <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                                  Updating...
                                </>
                              ) : (
                                <>
                                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  Submit
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>Step {currentSlide + 1} of 2</span>
              </div>
              <div className="flex items-center space-x-3">
                {currentSlide === 1 && (
                  <button
                    onClick={() => setCurrentSlide(0)}
                    className="px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Back</span>
                  </button>
                )}
                {currentSlide === 0 && (
                  <button
                    onClick={handleNext}
                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <span>Next</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}



    </div >
  );
}