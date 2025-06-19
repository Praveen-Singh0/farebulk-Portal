"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Eye, X } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useAuth } from '@/contexts/use-auth';

interface TicketRequest {
  _id: string;
  passengerName: string;
  passengerEmail: string;
  phoneNumber: string;
  confirmationCode: string;
  ticketCost: string;
  status: string;
  mco: string;
  paymentMethod?: string;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  date?: string;
  time?: string;
  datetime?: string;
  consultant?: string;
  ticketType?: string;
  requestFor?: string;
  Desc?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
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

        console.log("ticket :", ticket)

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

      console.log('Sending update data:', updateData);

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
                        <div className="font-medium text-gray-900">{request.ticketType || "N/A"}</div>
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
                        <div className="text-sm text-gray-700">{formatDate(request.createdAt)}</div>
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
      {
        isModalOpen && selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  {'Ticket Request Details'}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Modal Content - Same as before */}
              <div className="p-6">
                {currentSlide === 0 ? (

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Passenger Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Passenger Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        <p className="text-sm text-gray-900">{selectedRequest.passengerName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="text-sm text-gray-900">{selectedRequest.passengerEmail}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                        <p className="text-sm text-gray-900">{selectedRequest.phoneNumber}</p>
                      </div>
                    </div>

                    {/* Ticket Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Ticket Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Request For</label>
                        <p className="text-sm text-gray-900">{selectedRequest.ticketType || "N/A"}</p>
                        <p className="text-sm text-gray-900">{selectedRequest.requestFor || "N/A"}</p>

                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
                        <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                          {selectedRequest.confirmationCode}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <p className="text-sm text-gray-900">{selectedRequest.Desc || "N/A"}</p>
                      </div>
                    </div>

                    {/* Cost Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Cost Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Cost</label>
                        <p className="text-sm text-gray-900 font-medium text-green-600">
                          {formatCurrency(selectedRequest.ticketCost)}
                        </p>
                      </div>
                      {selectedRequest.mco && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">MCO</label>
                          <p className="text-sm text-gray-900">{formatCurrency(selectedRequest.mco)}</p>
                        </div>
                      )}
                    </div>

                    {/* Payment Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Payment Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                        <p className="text-sm text-gray-900 capitalize">{selectedRequest.paymentMethod || "N/A"}</p>
                      </div>
                      {selectedRequest.cardholderName && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                          <p className="text-sm text-gray-900">{selectedRequest.cardholderName}</p>
                        </div>
                      )}
                      {selectedRequest.cardNumber && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                          <p className="text-sm text-gray-900 font-mono">{maskCardNumber(selectedRequest.cardNumber)}</p>
                        </div>
                      )}
                      {selectedRequest.expiryDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                          <p className="text-sm text-gray-900">{selectedRequest.expiryDate}</p>
                        </div>
                      )}
                      {selectedRequest.cvv && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                          <p className="text-sm text-gray-900">{selectedRequest.cvv}</p>
                        </div>
                      )}
                    </div>

                    {/* Booking Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Booking Information</h4>
                      {selectedRequest.date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                          <p className="text-sm text-gray-900">{selectedRequest.date}</p>
                        </div>
                      )}
                      {selectedRequest.time && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                          <p className="text-sm text-gray-900">{selectedRequest.time}</p>
                        </div>
                      )}
                      {selectedRequest.consultant && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Consultant</label>
                          <p className="text-sm text-gray-900">{selectedRequest.consultant}</p>
                        </div>
                      )}
                    </div>

                    {/* System Information */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-medium text-gray-900 border-b pb-2">System Information</h4>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedRequest.updatedAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Request ID</label>
                        <p className="text-sm text-gray-900 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                          {selectedRequest._id}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (

                  <div className="space-y-6">
                    <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Update Ticket Status</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Status Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status *</label>
                        <select
                          value={statusData.status}
                          onChange={(e) => setStatusData(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        >
                          <option value="">Select Status</option>
                          <option value="Charge">Charge</option>
                          <option value="Not Charge">Not Charge</option>
                        </select>
                      </div>

                      {/* Payment Method Selection */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method *</label>
                        <select
                          value={statusData.paymentMethod}
                          onChange={(e) =>
                            setStatusData((prev) => ({ ...prev, paymentMethod: e.target.value }))
                          }
                          className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remark</label>
                      <textarea
                        value={statusData.remark}
                        onChange={(e) => setStatusData(prev => ({ ...prev, remark: e.target.value }))}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                        placeholder="Enter your remarks here..."
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleStatusUpdate}
                        disabled={isSubmitting}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          'Submit'
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer - Update to show Next button only on first slide */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                {currentSlide === 0 && (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Next
                  </button>
                )}
                {currentSlide === 1 && (
                  <button
                    onClick={() => setCurrentSlide(0)}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}