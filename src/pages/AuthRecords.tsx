import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/use-auth";
import {
  Send,
  CheckCircle,
  Clock,
  Download,
  RefreshCw,
  Search,
  FileText,
  Shield,
  AlertCircle,
} from "lucide-react";

interface AuthRecord {
  _id: string;
  agentName: string;
  agentEmail: string;
  customerEmail: string;
  cardholderName: string;
  contactNo: string;
  bookingReference: string;
  companyName: string;
  passengers: string[];
  cardType: string;
  cardLast4: string;
  expiryDate: string;
  amount: string;
  status: "sent" | "authorized" | "expired";
  token: string;
  sentAt: string;
  authorizedAt: string | null;
  customerIP: string;
  pdfPath: string;
  createdAt: string;
}

interface AuthStats {
  totalSent: number;
  totalAuthorized: number;
  totalExpired: number;
  todaySent: number;
  todayAuthorized: number;
  total: number;
}

const AuthRecords = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<AuthRecord[]>([]);
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [downloading, setDownloading] = useState<string | null>(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recordsRes, statsRes] = await Promise.all([
        axios.get(`${BASE_URL}/auth-records`, { withCredentials: true }),
        axios.get(`${BASE_URL}/auth-records/stats`, { withCredentials: true }),
      ]);
      setRecords(recordsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error("Error fetching auth records:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleDownloadPdf = async (recordId: string) => {
    setDownloading(recordId);
    try {
      const response = await axios.get(
        `${BASE_URL}/auth-records/${recordId}/pdf`,
        {
          withCredentials: true,
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `authorization_${recordId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Failed to download PDF. The file may not be available yet.");
    } finally {
      setDownloading(null);
    }
  };

  const filteredRecords = records.filter((record) => {
    const matchesSearch =
      searchTerm === "" ||
      record.cardholderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.bookingReference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.agentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.cardLast4.includes(searchTerm);

    const matchesStatus =
      statusFilter === "all" || record.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="h-3 w-3" />
            Pending
          </span>
        );
      case "authorized":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3 w-3" />
            Authorized
          </span>
        );
      case "expired":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="h-3 w-3" />
            Expired
          </span>
        );
      default:
        return null;
    }
  };

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600 text-lg">Loading authorizations...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Authorization Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Track credit card authorization requests and approvals
            </p>
          </div>
        </div>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500">Total Auths</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Send className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600">
                  {stats.totalSent}
                </p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">
                  {stats.totalAuthorized}
                </p>
                <p className="text-xs text-gray-500">Authorized</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Send className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.todaySent}
                </p>
                <p className="text-xs text-gray-500">Sent Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {stats.todayAuthorized}
                </p>
                <p className="text-xs text-gray-500">Authorized Today</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, booking ref, agent..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="all">All Status</option>
          <option value="sent">Pending</option>
          <option value="authorized">Authorized</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Records Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Card
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Amount
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Merchant
                </th>
                {(user?.role === "admin" || user?.role === "ticket") && (
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Agent
                  </th>
                )}
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Sent
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Authorized
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  PDF
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={(user?.role === "admin" || user?.role === "ticket") ? 9 : 8}
                    className="text-center py-12 text-gray-500"
                  >
                    <Shield className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">No authorizations found</p>
                    <p className="text-sm">
                      Authorization records will appear here when agents send
                      auth emails.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record._id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {record.cardholderName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {record.customerEmail}
                        </p>
                        {record.bookingReference && (
                          <p className="text-xs text-blue-600 font-mono">
                            Ref: {record.bookingReference}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium text-gray-700">
                          {record.cardType || "Card"}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          •••• {record.cardLast4 || "****"}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-semibold text-gray-900">
                        {record.amount ? `$${record.amount}` : "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-700">
                        {record.companyName || "—"}
                      </span>
                    </td>
                    {(user?.role === "admin" || user?.role === "ticket") && (
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-indigo-600">
                          {record.agentName}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3">{getStatusBadge(record.status)}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">
                        {formatDate(record.sentAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.authorizedAt ? (
                        <div>
                          <span className="text-xs text-emerald-600 font-medium">
                            {formatDate(record.authorizedAt)}
                          </span>
                          {record.customerIP && (
                            <p className="text-xs text-gray-400">
                              IP: {record.customerIP}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.status === "authorized" && record.pdfPath ? (
                        <button
                          onClick={() => handleDownloadPdf(record._id)}
                          disabled={downloading === record._id}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 border border-blue-200 transition-colors disabled:opacity-50"
                        >
                          {downloading === record._id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          PDF
                        </button>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record count */}
      <div className="text-sm text-gray-500 text-right">
        Showing {filteredRecords.length} of {records.length} records
      </div>
    </div>
  );
};

export default AuthRecords;
