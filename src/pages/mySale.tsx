"use client";

import { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  Eye,
  Calendar,
  DollarSign,
  Trash2,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "@/contexts/use-auth";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

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
    airlineCode: string;
    billingZipCode: string;
    billingCountry: string;
    billingState: string;
    billingCity: string;
    billingAddress: string;
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
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const { user } = useAuth();
  const [ticketStatuses, setTicketStatuses] = useState<TicketRequestStatus[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredStatuses, setFilteredStatuses] = useState<
    TicketRequestStatus[]
  >([]);
  const [selectedStatus, setSelectedStatus] =
    useState<TicketRequestStatus | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  console.log("ticketStatuses;;;", ticketStatuses);

  const fetchTicketStatuses = async () => {
    try {
      setLoading(true);

      if (!user || !user.email) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/ticket-requests-status`,
        {
          withCredentials: true,
        }
      );

      let userStatuses: TicketRequestStatus[] = response.data.data || [];

      const currentYear = dayjs().tz("America/New_York").year();
      const currentMonth = dayjs().tz("America/New_York").month();

      userStatuses = userStatuses.filter((status) => {
        const itemDate = dayjs(status.createdAt).tz("America/New_York");
        return (
          itemDate.year() === currentYear && itemDate.month() === currentMonth
        );
      });

      userStatuses = userStatuses.filter((status: TicketRequestStatus) => {
        const itemDate = dayjs(status.updatedAt);
        return (
          itemDate.year() === currentYear && itemDate.month() === currentMonth
        );
      });

      // ✅ Then, filter based on user role
      if (user.role === "travel") {
        // Show only requests handled by this travel consultant
        userStatuses = userStatuses.filter(
          (status) =>
            status.ticketRequest.consultant?.toLowerCase().trim() ===
            user.userName?.toLowerCase().trim()
        );
      } else if (user.role !== "admin" && user.role !== "ticket") {
        // Default logic for other users
        userStatuses = userStatuses.filter(
          (status) =>
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
    const mcoAmount = parseFloat(mco || "0") || 0;
    return mcoAmount * 0.15;
  };

  // Get the sale amount (after 15% deduction)
  const calculateSale = (mco: string | undefined) => {
    const mcoAmount = parseFloat(mco || "0") || 0;
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
          ticket?.passengerName
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket?.passengerEmail
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket?.confirmationCode
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket?.ticketType
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ticket?.consultant
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          status.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          status.paymentMethod
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
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
        timeZone: "America/New_York", // New York timezone (EST/EDT)
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      };

      const formatter = new Intl.DateTimeFormat("en-US", options);
      return formatter.format(new Date(dateString)); // e.g., "Jun 26, 2025, 02:35 AM"
    } catch {
      return dateString;
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
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
      case "charge":
        return "bg-green-100 text-green-800";
      case "not charge":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this ticket status?"
      );
      if (!confirmDelete) return;

      await axios.delete(
        `${import.meta.env.VITE_BASE_URL}/ticket-requests-status/${id}`,
        {
          withCredentials: true,
        }
      );

      // Remove the deleted item from the state
      setTicketStatuses((prev) => prev.filter((status) => status._id !== id));
      setFilteredStatuses((prev) => prev.filter((status) => status._id !== id));
    } catch (error) {
      console.error("Failed to delete ticket request status:", error);
      alert("Failed to delete ticket request status.");
    }
  };

  // Calculate totals based on sale amounts
  const totalChargeTransactions = filteredStatuses.filter(
    (status) => status.status.toLowerCase() === "charge"
  ).length;

  const chargedSales = filteredStatuses
    .filter((status) => status.status.toLowerCase() === "charge")
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
              <p className="text-gray-500 mb-4">
                Please log in to view sales data
              </p>
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
            {user.role === "admin" ? "All Sales" : "My Sales"}
          </h1>
          <p className="text-gray-600 mt-1">
            {user.role === "admin"
              ? `View all ticket sales and status updates (${ticketStatuses.length} total)`
              : `View your ticket sales and status updates (${ticketStatuses.length} total)`}
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
              <p className="text-sm font-medium text-gray-600">
                Total Transactions
              </p>
              {/* <p className="text-2xl font-bold text-gray-900">{ticketStatuses.filter(item => item.status === 'Charge').length}</p> */}
              <p className="text-2xl font-bold text-gray-900">
                {totalChargeTransactions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Sales Value
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(chargedSales)}
              </p>
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
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Consultant
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Passenger
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Ticket Type
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Confirmation
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Sale/MCO
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Payment Method
                  </th>
                  <th className="text-left p-3 font-semibold text-gray-700">
                    Updated At
                  </th>
                  <th className="text-right p-3 font-semibold text-gray-700">
                    Actions
                  </th>
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
                        : user.role === "admin" || user.role === "ticket"
                        ? "No sales data found."
                        : "You haven't processed any sales yet."}
                    </td>
                  </tr>
                ) : (
                  filteredStatuses.map((status) => {
                    const ticket = status.ticketRequest;
                    const saleAmount = calculateSale(ticket?.mco);
                    return (
                      <tr
                        key={status._id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {ticket?.consultant || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {ticket?.passengerName || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket?.passengerEmail || "N/A"}
                          </div>
                        </td>

                        <td className="p-3">
                          <div className="font-medium text-gray-900">
                            {" "}
                            {ticket.ticketType || "N/A"}
                            {ticket.airlineCode
                              ? ` - ${ticket.airlineCode}`
                              : ""}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket?.requestFor || "N/A"}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {ticket?.confirmationCode || "N/A"}
                          </span>
                        </td>
                        <td className="p-3">
                          {status.status === "Charge" && (
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
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                              status.status
                            )}`}
                          >
                            {status.status}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-sm text-gray-900">
                            {status.paymentMethod || "N/A"}
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
                          {user.role !== "travel" && (
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            {/* Enhanced Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-emerald-50 to-teal-50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-emerald-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                    />
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
                <svg
                  className="h-6 w-6 text-gray-500 group-hover:text-gray-700"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
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
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Passenger Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Name
                        </label>
                        <p className="text-gray-900 font-medium bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.ticketRequest?.passengerName}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Email
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg break-all">
                          {selectedStatus.ticketRequest?.passengerEmail}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Phone
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.ticketRequest?.phoneNumber}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ticket Information */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Ticket Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Ticket Type
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.ticketRequest?.ticketType}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Request For
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.ticketRequest?.requestFor}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Confirmation Code
                        </label>
                        <p className="text-gray-900 font-mono bg-white/80 px-3 py-2 rounded-lg border-2 border-dashed border-green-200">
                          {selectedStatus.ticketRequest?.confirmationCode}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Information */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Cost Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Ticket Cost
                        </label>
                        <p className="text-xl font-bold text-purple-600 bg-white/60 px-3 py-2 rounded-lg">
                          {formatCurrency(
                            parseFloat(
                              selectedStatus.ticketRequest?.ticketCost || "0"
                            )
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          MCO Amount
                        </label>
                        <p className="text-xl font-bold text-blue-600 bg-white/60 px-3 py-2 rounded-lg">
                          {formatCurrency(
                            parseFloat(selectedStatus.ticketRequest?.mco || "0")
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Deduction (15% of MCO)
                        </label>
                        <p className="text-lg font-semibold text-red-600 bg-white/60 px-3 py-2 rounded-lg">
                          -
                          {formatCurrency(
                            calculateDeduction(
                              selectedStatus.ticketRequest?.mco
                            )
                          )}
                        </p>
                      </div>
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg p-3">
                        <p className="text-white font-bold text-xl text-center">
                          Final Sale:{" "}
                          {formatCurrency(
                            calculateSale(selectedStatus.ticketRequest?.mco)
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Status Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Status
                        </label>
                        <div className="bg-white/60 px-3 py-2 rounded-lg">
                          <span
                            className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(
                              selectedStatus.status
                            )}`}
                          >
                            {selectedStatus.status}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Payment Method
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.paymentMethod || "N/A"}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Updated By
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.updatedBy}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Remark
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg min-h-[2.5rem]">
                          {selectedStatus.remark || "No remarks"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-6 border border-teal-100 lg:col-span-1">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Additional Information
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Description
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg min-h-[2.5rem]">
                          {selectedStatus.ticketRequest?.Desc ||
                            "No description"}
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Created At
                          </label>
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {formatDate(selectedStatus.createdAt)}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Updated At
                          </label>
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {formatDate(selectedStatus.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Billing Information */}
                  <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-100">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        Billing Details
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Address
                        </label>
                        <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                          {selectedStatus.ticketRequest.billingAddress || "N/A"}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            City
                          </label>
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {selectedStatus.ticketRequest.billingCity || "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            State
                          </label>
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {selectedStatus.ticketRequest.billingState || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Country
                          </label>
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {selectedStatus.ticketRequest.billingCountry ||
                              "N/A"}
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Zip Code
                          </label>
                          <p className="text-gray-900 bg-white/60 px-3 py-2 rounded-lg">
                            {selectedStatus.ticketRequest.billingZipCode ||
                              "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Information */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-6 border border-gray-200">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                          />
                        </svg>
                      </div>
                      <h4 className="text-lg font-semibold text-gray-900">
                        System Information
                      </h4>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Record ID
                        </label>
                        <p className="text-gray-900 font-mono text-xs bg-white/60 px-3 py-2 rounded-lg break-all">
                          {selectedStatus._id}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                          Request ID
                        </label>
                        <p className="text-gray-900 font-mono text-xs bg-white/60 px-3 py-2 rounded-lg break-all">
                          {selectedStatus.ticketRequest?._id}
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
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>Sale Transaction Details</span>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 flex items-center space-x-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
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
