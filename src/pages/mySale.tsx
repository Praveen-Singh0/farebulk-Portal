"use client";

import { useState, useEffect } from "react";
import { Search, RefreshCw, Eye, Calendar, DollarSign, Trash2 } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useAuth } from '@/contexts/use-auth';


interface TicketRequestStatus {
  _id: string;
  ticketRequest: {
    _id: string;
    passengerName: string;
    passengerEmail: string;
    phoneNumber: string;
    confirmationCode: string;
    ticketCost: string;
    mco?: string;
    ticketType?: string;
    requestFor?: string;
    consultant?: string;
    Desc?: string;
    createdAt: string;
  };
  status: string;
  paymentMethod?: string;
  remark?: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function MySale() {
  const { user } = useAuth();
  const [ticketStatuses, setTicketStatuses] = useState<TicketRequestStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStatuses, setFilteredStatuses] = useState<TicketRequestStatus[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<TicketRequestStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  console.log("ticketStatuses;;;", ticketStatuses)

  const fetchTicketStatuses = async () => {
    try {
      setLoading(true);

      if (!user || !user.email) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/ticket-requests-status`, {
        withCredentials: true
      });


      // Filter based on user role
      let userStatuses = response.data.data || [];

      // If not admin or ticket, filter by updatedBy field
      if (user.role === 'travel') {
        // Show only requests handled by this travel consultant
        userStatuses = userStatuses.filter((status: TicketRequestStatus) =>
          status.ticketRequest.consultant?.toLowerCase().trim() === user.userName?.toLowerCase().trim()
        );
      } else if (user.role !== 'admin' && user.role !== 'ticket') {
        // Default logic for other users
        userStatuses = userStatuses.filter((status: TicketRequestStatus) =>
          status.updatedBy === user.email ||
          status.updatedBy === user.userName
        );
      }


      setTicketStatuses(userStatuses);
      setFilteredStatuses(userStatuses);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const calculateDeduction = (mco: string | undefined) => {
    const mcoAmount = parseFloat(mco || '0') || 0;
    return mcoAmount * 0.15;
  };

  // Get the sale amount (after 15% deduction)
  const calculateSale = (mco: string | undefined) => {
    const mcoAmount = parseFloat(mco || '0') || 0;
    const deduction = calculateDeduction(mco);
    return mcoAmount - deduction;
  };


  // Filter statuses based on search term
  useEffect(() => {
    if (searchTerm === "") {
      setFilteredStatuses(ticketStatuses);
    } else {
      const filtered = ticketStatuses.filter((status) => {
        const ticket = status.ticketRequest;
        return (
          ticket?.passengerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket?.passengerEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket?.confirmationCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket?.ticketType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket?.consultant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          status.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          status.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          status.updatedBy?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
      setFilteredStatuses(filtered);
    }
  }, [searchTerm, ticketStatuses]);

  // Fetch data when user changes or component mounts
  useEffect(() => {
    if (user) {
      fetchTicketStatuses();
    }
  }, [user]);

  const formatDate = (dateString: string): string => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/New_York', // New York timezone (EST/EDT)
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      };

      const formatter = new Intl.DateTimeFormat('en-US', options);
      return formatter.format(new Date(dateString)); // e.g., "Jun 26, 2025, 02:35 AM"
    } catch {
      return dateString;
    }
  };


  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  // Handle view details
  const handleViewDetails = (status: TicketRequestStatus) => {
    setSelectedStatus(status);
    setIsModalOpen(true);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedStatus(null);
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'charge':
        return 'bg-green-100 text-green-800';
      case 'not charge':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const confirmDelete = window.confirm("Are you sure you want to delete this ticket status?");
      if (!confirmDelete) return;

      await axios.delete(`${import.meta.env.VITE_BASE_URL}/ticket-requests-status/${id}`, {
        withCredentials: true
      });

      // Remove the deleted item from the state
      setTicketStatuses(prev => prev.filter(status => status._id !== id));
      setFilteredStatuses(prev => prev.filter(status => status._id !== id));
    } catch (error) {
      console.error("Failed to delete ticket request status:", error);
      alert("Failed to delete ticket request status.");
    }
  };


  // Calculate totals based on sale amounts
  const totalChargeTransactions = filteredStatuses.filter(
    status => status.status.toLowerCase() === 'charge'
  ).length;

  const chargedSales = filteredStatuses
    .filter(status => status.status.toLowerCase() === 'charge')
    .reduce((sum, status) => {
      const saleAmount = calculateSale(status.ticketRequest?.mco);
      return sum + saleAmount;
    }, 0);


  // Error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-500 mb-4">Error: {error}</p>
              <button
                onClick={fetchTicketStatuses}
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
              <p className="text-gray-500 mb-4">Please log in to view sales data</p>
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
            {user.role === 'admin' ? 'All Sales' : 'My Sales'}
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === 'admin'
              ? `View all ticket sales and status updates (${ticketStatuses.length} total)`
              : `View your ticket sales and status updates (${ticketStatuses.length} total)`
            }
          </p>
        </div>
        <button
          onClick={fetchTicketStatuses}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Transactions</p>
              {/* <p className="text-2xl font-bold text-gray-900">{ticketStatuses.filter(item => item.status === 'Charge').length}</p> */}
              <p className="text-2xl font-bold text-gray-900">{totalChargeTransactions}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Sales Value</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(chargedSales)}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Search and Content */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Sales History ({filteredStatuses.length} showing)
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, status..."
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
                  <th className="text-left p-3 font-semibold text-gray-700">Sale/MCO</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Payment Method</th>
                  <th className="text-left p-3 font-semibold text-gray-700">Updated At</th>
                  <th className="text-right p-3 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={9}>
                      <div className="flex items-center justify-center h-64">
                        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
                      </div>
                    </td>
                  </tr>
                ) : filteredStatuses.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center p-8 text-gray-500">
                      {searchTerm
                        ? "No sales match your search."
                        : user.role === 'admin' || user.role === 'ticket'
                          ? "No sales data found."
                          : "You haven't processed any sales yet."
                      }
                    </td>
                  </tr>
                ) : (
                  filteredStatuses.map((status) => {
                    const ticket = status.ticketRequest;
                    const saleAmount = calculateSale(ticket?.mco);
                    return (
                      <tr key={status._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{ticket?.consultant || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{ticket?.passengerName || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{ticket?.passengerEmail || 'N/A'}</div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {ticket?.ticketType || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket?.requestFor || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {ticket?.confirmationCode || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          {status.status === 'Charge' && (
                            <div className="font-medium text-green-600">
                              {formatCurrency(saleAmount)}
                            </div>
                          )}
                          {ticket?.mco && (
                            <div className="text-sm text-gray-500">
                              MCO: {formatCurrency(parseFloat(ticket.mco))}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(status.status)}`}>
                            {status.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-900">
                            {status.paymentMethod || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="text-sm text-gray-700">
                            {formatDate(status.updatedAt)}
                          </div>
                        </td>
                        <td className="p-3 flex text-right">
                          <button
                            onClick={() => handleViewDetails(status)}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </button>
                          {user.role !== 'travel' && (
                            <button
                              onClick={() => handleDelete(status._id)}
                              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                              title="View Details"
                            >
                              <Trash2 className="h-4 w-4 text-gray-600" />
                            </button>
                          )}

                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

            </table>
          </div>
        </div>
      </div>

      {/* Modal for viewing details */}
      {isModalOpen && selectedStatus && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900">
                Sale Details
              </h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Passenger Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Passenger Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <p className="text-sm text-gray-900">{selectedStatus.ticketRequest?.passengerName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-sm text-gray-900">{selectedStatus.ticketRequest?.passengerEmail}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <p className="text-sm text-gray-900">{selectedStatus.ticketRequest?.phoneNumber}</p>
                  </div>
                </div>

                {/* Ticket Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Ticket Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Type</label>
                    <p className="text-sm text-gray-900">{selectedStatus.ticketRequest?.ticketType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Request For</label>
                    <p className="text-sm text-gray-900">{selectedStatus.ticketRequest?.requestFor}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmation Code</label>
                    <p className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                      {selectedStatus.ticketRequest?.confirmationCode}
                    </p>
                  </div>
                </div>

                {/* Financial Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Financial Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ticket Cost</label>
                    <p className="text-sm text-gray-900"><strong>{formatCurrency(parseFloat(selectedStatus.ticketRequest?.ticketCost || '0'))}</strong></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MCO Amount</label>
                    <p className="text-sm text-gray-900"><strong>{formatCurrency(parseFloat(selectedStatus.ticketRequest?.mco || '0'))}</strong></p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deduction (15% of MCO)</label>
                    <p className="text-sm text-gray-900"><strong>{formatCurrency(calculateDeduction(selectedStatus.ticketRequest?.mco))}</strong></p>
                  </div>
                  <p className=" text-gray-900 font-medium text-green-600">Final Sale: {formatCurrency(calculateSale(selectedStatus.ticketRequest?.mco))}</p>

                </div>

                {/* Status Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Status Information</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(selectedStatus.status)}`}>
                      {selectedStatus.status}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                    <p className="text-sm text-gray-900">{selectedStatus.paymentMethod || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Updated By</label>
                    <p className="text-sm text-gray-900">{selectedStatus.updatedBy}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                    <p className="text-sm text-gray-900">{selectedStatus.remark || 'No remarks'}</p>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4 md:col-span-2">
                  <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-sm text-gray-900">{selectedStatus.ticketRequest?.Desc || 'No description'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Created At</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedStatus.createdAt)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Updated At</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedStatus.updatedAt)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
              <button
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}