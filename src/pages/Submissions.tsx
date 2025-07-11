"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Eye, X } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useAuth } from '@/contexts/use-auth';
import { useToast } from '../components/ui/use-toast';



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
  billingZipCode: string;
  billingCountry: string;
  billingState: string;
  billingCity: string;
  billingAddress: string;
  Desc?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export default function Submission() {
  const { user } = useAuth(); // Get user from auth context
  const [ticketRequests, setTicketRequests] = useState<TicketRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRequests, setFilteredRequests] = useState<TicketRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TicketRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

    const { toast } = useToast();

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

      console.log("Fetched data:", response.data);

      // Filter tickets based on user email

      const userTickets = response.data.filter((ticket: TicketRequest) => {
        if (user.role === 'admin') {
          return true;
        }

        return (
          ticket.passengerEmail === user.email ||
          ticket.consultant === user.userName ||
          ticket.consultant === user.email
        );
      });

      console.log("Filtered tickets for user:", userTickets);

      // Further filter tickets with status === 'Pending'
      const pendingTickets = userTickets.filter((ticket: TicketRequest) => ticket.status === "Pending");


      setTicketRequests(pendingTickets); // all user tickets
      setFilteredRequests(pendingTickets); // only pending
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
    setIsEditMode(false);
    setIsModalOpen(true);
  };

  const handleEdit = (request: TicketRequest) => {
    setSelectedRequest(request);
    setIsEditMode(true);
    setIsModalOpen(true);
  };


  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedRequest(null);
    setIsEditMode(false);
  };


  const handleSave = async () => {
  if (!selectedRequest) return;

  try {
    await axios.put(`${import.meta.env.VITE_BASE_URL}/ticket-requests/${selectedRequest._id}`, selectedRequest, {
      withCredentials: true,
    });

    // Update local state
    setTicketRequests((prev) =>
      prev.map((req) => (req._id === selectedRequest._id ? selectedRequest : req))
    );
    setFilteredRequests((prev) =>
      prev.map((req) => (req._id === selectedRequest._id ? selectedRequest : req))
    );

    // Show toast
    toast({
      title: "Ticket updated",
      description: `The ticket request for ${selectedRequest.passengerName || "Passenger"} has been successfully updated.`,
      className: "bg-green-500 border border-green-200 text-white",
    });

    // Close modal and reset states
    setIsModalOpen(false);
    setIsEditMode(false);
    setSelectedRequest(null);
  } catch (err) {
    console.error("Failed to update ticket", err);

    toast({
      title: "Update failed",
      description: "An error occurred while updating the ticket. Please try again.",
      className: "bg-red-500 border border-red-200 text-white",
    });
  }
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
          <p className="text-sm text-gray-500 mt-1">
            Logged in as: {user.userName || user.email}
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
              {user.role === 'admin' ? 'All Submissions' : 'My Submissions'} ({filteredRequests.length} showing)
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
                  <th className="text-left p-3 font-semibold text-gray-700">Passenger</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Ticket Type</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Confirmation Code</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Cost</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Submitted</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7}>
                      <div className="flex items-center justify-center h-64">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      {searchTerm
                        ? "No ticket requests match your search."
                        : user.role === 'admin'
                          ? "No ticket requests found."
                          : "You haven't submitted any ticket requests yet."}
                    </td>
                  </tr>
                ) : (
                  filteredRequests.map((request) => (
                    <tr
                      key={request._id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{request.passengerName}</div>
                        <div className="text-sm text-gray-500">{request.passengerEmail}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-gray-900">
                          {request.ticketType || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.requestFor || "N/A"}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {request.confirmationCode}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                          Ticket Cost : {formatCurrency(request.ticketCost)}
                        </div>
                        <div className="text-sm text-gray-500 px-2 py-1 ">
                          MCO : {formatCurrency(request.mco)}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="text-sm text-gray-700">
                          {request.date} {request.time}
                        </div>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleEdit(request)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                            title="Edit Ticket"
                          >
                            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5h2m-1-1v2m-6 4h12M5 13h14m-7 4h2m-1-1v2" />
                            </svg>
                          </button>


                        </div>
                      </td>
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
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Enhanced Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Sale Details
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-white/50 rounded-full transition-all duration-200 group"
              >
                <svg className="h-6 w-6 text-gray-500 group-hover:text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-8">
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
                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded"
                            value={selectedRequest.passengerName}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, passengerName: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">{selectedRequest.passengerName || "N/A"}</p>

                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Email</label>
                        {isEditMode ? (
                          <input
                            type="email"
                            className="w-full px-3 py-2 border rounded"
                            value={selectedRequest.passengerEmail}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, passengerEmail: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg break-all">{selectedRequest.passengerEmail || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Phone</label>
                        {isEditMode ? (
                          <input
                            type="tel"
                            className="w-full px-3 py-2 border rounded"
                            value={selectedRequest.phoneNumber}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, phoneNumber: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">{selectedRequest.phoneNumber || "N/A"}</p>
                        )}
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
                        <label className="block text-sm font-medium text-gray-600 mb-2">Ticket Type</label>
                        {isEditMode ? (
                          <select
                            className="w-full px-3 py-2 border rounded"
                            value={selectedRequest.ticketType}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, ticketType: e.target.value })}
                          >
                            <option value="">Select Ticket Type</option>
                            <option value="Hotel">Hotel</option>
                            <option value="Amtrack">Amtrack</option>
                            <option value="Car Rental">Car Rental</option>
                            <option value="Airline">Airline</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {selectedRequest.ticketType || "N/A"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Request For</label>
                        {isEditMode ? (
                          <select
                            className="w-full px-3 py-2 border rounded"
                            value={selectedRequest.requestFor}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, requestFor: e.target.value })}
                          >
                            <option value="">Select Request For</option>
                            <option value="New booking">New booking</option>
                            <option value="Cancellation">Cancellation</option>
                            <option value="Changes">Changes</option>
                            <option value="Others">Others</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">{selectedRequest.requestFor || "N/A"}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Confirmation Code</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded font-mono"
                            value={selectedRequest.confirmationCode}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, confirmationCode: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                            {selectedRequest.confirmationCode || "N/A"}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>

                  {/* Financial Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Cost Information</h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Ticket Cost</label>
                        <p className="text-xl font-bold text-purple-600 bg-white/60 px-3 py-2 rounded-lg">
                          {formatCurrency(selectedRequest.ticketCost || '0')}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">MCO Amount</label>
                        <p className="text-xl font-bold text-blue-600 bg-white/60 px-3 py-2 rounded-lg">
                          {formatCurrency(selectedRequest.mco || '0')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100 lg:col-span-1">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">Additional Information</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg min-h-[2.5rem]">
                          {selectedRequest.Desc || 'No description'}
                        </p>
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
                      </div>
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

                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded font-mono"
                            value={selectedRequest.billingAddress}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, billingAddress: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                            {selectedRequest.billingAddress || "N/A"}
                          </p>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
                          {isEditMode ? (
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded font-mono"
                              value={selectedRequest.billingCity}
                              onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, billingCity: e.target.value })}
                            />
                          ) : (
                            <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                              {selectedRequest.billingCity || "N/A"}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">State</label>

                          {isEditMode ? (
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded font-mono"
                              value={selectedRequest.billingState}
                              onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, billingState: e.target.value })}
                            />
                          ) : (
                            <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                              {selectedRequest.billingState || "N/A"}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Country</label>

                          {isEditMode ? (
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded font-mono"
                              value={selectedRequest.billingCountry}
                              onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, billingCountry: e.target.value })}
                            />
                          ) : (
                            <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                              {selectedRequest.billingCountry || "N/A"}
                            </p>
                          )}

                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">Zip Code</label>

                          {isEditMode ? (
                            <input
                              type="text"
                              className="w-full px-3 py-2 border rounded font-mono"
                              value={selectedRequest.billingZipCode}
                              onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, billingZipCode: e.target.value })}
                            />
                          ) : (
                            <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                              {selectedRequest.billingZipCode || "N/A"}
                            </p>
                          )}

                        </div>
                      </div>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Cardholder Name</label>

                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded font-mono"
                            value={selectedRequest.cardholderName}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, cardholderName: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                            {selectedRequest.cardholderName || ""}
                          </p>
                        )}

                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Card Number</label>

                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded font-mono"
                            value={selectedRequest.cardNumber}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, cardNumber: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                            {selectedRequest.cardNumber || "N/A"}
                          </p>
                        )}

                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Expiry Date</label>

                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded font-mono"
                            value={selectedRequest.expiryDate}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, expiryDate: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                            {selectedRequest.expiryDate || "N/A"}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">CVV</label>
                        {isEditMode ? (
                          <input
                            type="text"
                            className="w-full px-3 py-2 border rounded font-mono"
                            value={selectedRequest.cvv}
                            onChange={(e) => setSelectedRequest((prev) => prev && { ...prev, cvv: e.target.value })}
                          />
                        ) : (
                          <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                            {selectedRequest.cvv || "N/A"}
                          </p>
                        )}

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
                        <label className="block text-sm font-medium text-gray-600 mb-2">Record ID</label>
                        <p className="text-gray-900 font-mono text-xs bg-white/60 px-3 py-2 rounded-lg break-all">
                          {selectedRequest._id}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Request ID</label>
                        <p className="text-gray-900 font-mono text-xs bg-white/60 px-3 py-2 rounded-lg break-all">
                          {selectedRequest?._id}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Modal Footer */}
            <div className="flex items-center justify-between px-8 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Sale Transaction Details</span>
              </div>
              <div className="flex items-center space-x-3">
                {isEditMode && (
                  <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                )}

                <button
                  onClick={closeModal}
                  className="px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}