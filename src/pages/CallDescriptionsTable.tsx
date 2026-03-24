import React, { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, RefreshCw, Trash2, Plus, X, PhoneIncoming, Edit2, Save, Calendar, Filter } from 'lucide-react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { useAuth } from '@/contexts/use-auth';

interface CallDescription {
  _id: string;
  sourceNumber: string;
  destination: string;
  callDuration: string;
  status: string;
  callConversation: string;
  date: string;
  user?: string;
}

const EMPTY_FORM = {
  sourceNumber: '',
  destination: '',
  callDuration: '',
  status: 'Answered',
  callConversation: '',
  date: new Date().toISOString().split('T')[0],
};

const STATUS_OPTIONS = ['Answered', 'Missed', 'Busy', 'Declined', 'No Answer'];

const CallDescriptionsTable: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<CallDescription[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  // Date filter state
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [filterAgent, setFilterAgent] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const isTravel = user?.role === 'travel';
  const isAdmin = user?.role === 'admin';
  const hasAccess = user?.role === 'admin' || user?.role === 'ticket' || user?.role === 'travel';
  const baseURL = import.meta.env.VITE_BASE_URL;

  // Fetch data
  const fetchData = async () => {
    if (!hasAccess) return;
    setLoading(true);
    setError('');
    try {
      const params: Record<string, string> = {};
      if (isTravel && user?.userName) {
        params.user = user.userName;
      }
      const response = await axios.get(`${baseURL}/call-descriptions`, {
        params,
        withCredentials: true,
      });
      if (response.data.success) {
        setData(response.data.data || []);
      } else {
        setError('Failed to fetch data');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch');
      } else {
        setError('Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  // Get unique agent names for filter dropdown
  const agentNames = useMemo(() => {
    const names = new Set(data.map(d => d.user || 'Unknown'));
    return Array.from(names).sort();
  }, [data]);

  // Filter data by date range, agent, and status
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Date from filter
      if (dateFrom && item.date < dateFrom) return false;
      // Date to filter
      if (dateTo && item.date > dateTo) return false;
      // Agent filter (admin only)
      if (filterAgent && (item.user || 'Unknown') !== filterAgent) return false;
      // Status filter
      if (filterStatus && item.status !== filterStatus) return false;
      return true;
    });
  }, [data, dateFrom, dateTo, filterAgent, filterStatus]);

  // Quick date presets
  const setToday = () => {
    const today = new Date().toISOString().split('T')[0];
    setDateFrom(today);
    setDateTo(today);
  };

  const setThisWeek = () => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    setDateFrom(monday.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const setThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    setDateFrom(firstDay.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const setLast7Days = () => {
    const now = new Date();
    const past = new Date(now);
    past.setDate(now.getDate() - 6);
    setDateFrom(past.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const setLast30Days = () => {
    const now = new Date();
    const past = new Date(now);
    past.setDate(now.getDate() - 29);
    setDateFrom(past.toISOString().split('T')[0]);
    setDateTo(now.toISOString().split('T')[0]);
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
    setFilterAgent('');
    setFilterStatus('');
  };

  const hasActiveFilters = dateFrom || dateTo || filterAgent || filterStatus;

  // Submit new call log
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sourceNumber || !form.destination || !form.callDuration || !form.callConversation || !form.date) {
      alert('Please fill all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const response = await axios.post(`${baseURL}/callDescription`, {
        apiData: {
          ...form,
          user: user?.userName || 'Unknown',
        }
      }, { withCredentials: true });

      if (response.data.success) {
        setForm(EMPTY_FORM);
        setShowForm(false);
        fetchData();
      } else {
        alert(response.data.message || 'Failed to save');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        alert(err.response?.data?.message || 'Failed to save call log');
      } else {
        alert('Failed to save call log');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Start editing a row
  const startEdit = (call: CallDescription) => {
    setEditingId(call._id);
    setEditForm({
      sourceNumber: call.sourceNumber,
      destination: call.destination,
      callDuration: call.callDuration,
      status: call.status,
      callConversation: call.callConversation,
      date: call.date,
    });
  };

  // Save edit
  const saveEdit = async (id: string) => {
    try {
      const response = await axios.put(`${baseURL}/call-descriptions/${id}`, {
        apiData: {
          ...editForm,
          user: user?.userName || 'Unknown',
        }
      }, { withCredentials: true });

      if (response.data.success) {
        setEditingId(null);
        fetchData();
      } else {
        alert(response.data.message || 'Failed to update');
      }
    } catch (err) {
      alert('Failed to update call log');
    }
  };

  // Delete item
  const deleteItem = async (id: string) => {
    if (!confirm('Delete this call log?')) return;
    try {
      const response = await axios.delete(`${baseURL}/call-descriptions/${id}`, {
        withCredentials: true
      });
      if (response.data.success) {
        setData(prev => prev.filter(item => item._id !== id));
      } else {
        alert('Failed to delete');
      }
    } catch {
      alert('Failed to delete');
    }
  };

  // Download Excel (exports filtered data)
  const downloadExcel = () => {
    if (filteredData.length === 0) {
      alert('No data to export');
      return;
    }
    const rows = filteredData.map((item, index) => ({
      'S.No': index + 1,
      'Source Number': item.sourceNumber,
      'Destination': item.destination,
      'Duration': item.callDuration,
      'Status': item.status,
      'Conversation': item.callConversation,
      'Agent': item.user || '-',
      'Date': item.date,
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 6 }, { wch: 16 }, { wch: 16 }, { wch: 12 },
      { wch: 12 }, { wch: 40 }, { wch: 15 }, { wch: 14 },
    ];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Call Logs');
    const dateLabel = dateFrom && dateTo ? `${dateFrom}_to_${dateTo}` : new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `call-logs-${dateLabel}.xlsx`);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Answered': 'bg-green-100 text-green-800',
      'Missed': 'bg-red-100 text-red-800',
      'Busy': 'bg-yellow-100 text-yellow-800',
      'Declined': 'bg-red-100 text-red-800',
      'No Answer': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => { fetchData(); }, [user]);

  if (!hasAccess) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
        No permission to view call logs
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add Call Log Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b flex justify-between items-center bg-blue-50">
            <div className="flex items-center gap-2">
              <PhoneIncoming className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-900">Log New Call</h3>
            </div>
            <button onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
              className="p-1 hover:bg-blue-100 rounded-full transition-colors">
              <X className="h-5 w-5 text-blue-600" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Caller Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Caller Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.sourceNumber}
                  onChange={e => setForm({ ...form, sourceNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                  placeholder="e.g. 1234567890"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">10-12 digits only</p>
              </div>

              {/* Destination */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Destination <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.destination}
                  onChange={e => setForm({ ...form, destination: e.target.value })}
                  placeholder="e.g. New York, Delhi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Call Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Call Duration <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.callDuration}
                  onChange={e => setForm({ ...form, callDuration: e.target.value })}
                  placeholder="e.g. 5 min, 2:30"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Call Status
                </label>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {STATUS_OPTIONS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Conversation / Notes - full width */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Call Notes / Conversation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.callConversation}
                onChange={e => setForm({ ...form, callConversation: e.target.value })}
                placeholder="Brief summary of the call conversation..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                required
              />
            </div>

            {/* Submit */}
            <div className="mt-4 flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 transition-colors font-medium"
              >
                {submitting ? 'Saving...' : 'Save Call Log'}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white rounded-lg shadow-sm border">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isTravel ? 'My Call Logs' : 'Call Logs'}
          </h2>
          <div className="flex gap-2 flex-wrap">
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Call</span>
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                hasActiveFilters
                  ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200 ring-2 ring-indigo-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              title="Date Filters"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && (
                <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {[dateFrom, dateTo, filterAgent, filterStatus].filter(Boolean).length}
                </span>
              )}
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={downloadExcel}
              disabled={filteredData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Download Excel</span>
            </button>
          </div>
        </div>

        {/* Date Filter Panel */}
        {showFilters && (
          <div className="px-6 py-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
            <div className="flex flex-col gap-4">
              {/* Quick Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                <Calendar className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-medium text-indigo-800 mr-1">Quick:</span>
                <button onClick={setToday}
                  className="px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors">
                  Today
                </button>
                <button onClick={setLast7Days}
                  className="px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors">
                  Last 7 Days
                </button>
                <button onClick={setThisWeek}
                  className="px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors">
                  This Week
                </button>
                <button onClick={setThisMonth}
                  className="px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors">
                  This Month
                </button>
                <button onClick={setLast30Days}
                  className="px-3 py-1 text-xs font-medium bg-white border border-indigo-200 text-indigo-700 rounded-full hover:bg-indigo-100 transition-colors">
                  Last 30 Days
                </button>
              </div>

              {/* Custom Date Range + Agent + Status */}
              <div className="flex items-end gap-4 flex-wrap">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">From Date</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={e => setDateFrom(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={e => setDateTo(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                {!isTravel && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Agent</label>
                    <select
                      value={filterAgent}
                      onChange={e => setFilterAgent(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[140px]"
                    >
                      <option value="">All Agents</option>
                      {agentNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-w-[130px]"
                  >
                    <option value="">All Status</option>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear All
                  </button>
                )}
              </div>

              {/* Active filter summary */}
              {hasActiveFilters && (
                <div className="text-xs text-indigo-600 font-medium">
                  Showing {filteredData.length} of {data.length} records
                  {dateFrom && dateTo && ` from ${dateFrom} to ${dateTo}`}
                  {dateFrom && !dateTo && ` from ${dateFrom}`}
                  {!dateFrom && dateTo && ` up to ${dateTo}`}
                  {filterAgent && ` | Agent: ${filterAgent}`}
                  {filterStatus && ` | Status: ${filterStatus}`}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-2">Loading...</span>
            </div>
          ) : (
            <>
              {/* Stats bar */}
              <div className="flex gap-4 mb-4 flex-wrap">
                <div className="bg-blue-50 px-3 py-1 rounded text-sm font-medium text-blue-800">
                  Total: {filteredData.length}
                </div>
                <div className="bg-green-50 px-3 py-1 rounded text-sm font-medium text-green-800">
                  Answered: {filteredData.filter(d => d.status === 'Answered').length}
                </div>
                <div className="bg-red-50 px-3 py-1 rounded text-sm font-medium text-red-800">
                  Missed: {filteredData.filter(d => d.status === 'Missed').length}
                </div>
                <div className="bg-yellow-50 px-3 py-1 rounded text-sm font-medium text-yellow-800">
                  Busy: {filteredData.filter(d => d.status === 'Busy').length}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-semibold border">Caller No.</th>
                      <th className="text-left p-3 font-semibold border">Destination</th>
                      <th className="text-left p-3 font-semibold border">Duration</th>
                      <th className="text-left p-3 font-semibold border">Status</th>
                      <th className="text-left p-3 font-semibold border">Call Notes</th>
                      {!isTravel && <th className="text-left p-3 font-semibold border">Agent</th>}
                      <th className="text-left p-3 font-semibold border">Date</th>
                      <th className="text-left p-3 font-semibold border w-24">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.length === 0 ? (
                      <tr>
                        <td colSpan={isTravel ? 7 : 8} className="text-center py-12 text-gray-500 border">
                          {hasActiveFilters
                            ? 'No call logs match your filters. Try adjusting the date range or other filters.'
                            : 'No call logs found. Click "Add Call" to log your first call.'}
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((call) => (
                        <tr key={call._id} className="border-b hover:bg-gray-50">
                          {editingId === call._id ? (
                            <>
                              <td className="p-2 border">
                                <input type="text" value={editForm.sourceNumber}
                                  onChange={e => setEditForm({ ...editForm, sourceNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                                  className="w-full px-2 py-1 border rounded text-sm" />
                              </td>
                              <td className="p-2 border">
                                <input type="text" value={editForm.destination}
                                  onChange={e => setEditForm({ ...editForm, destination: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm" />
                              </td>
                              <td className="p-2 border">
                                <input type="text" value={editForm.callDuration}
                                  onChange={e => setEditForm({ ...editForm, callDuration: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm" />
                              </td>
                              <td className="p-2 border">
                                <select value={editForm.status}
                                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm">
                                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </td>
                              <td className="p-2 border">
                                <input type="text" value={editForm.callConversation}
                                  onChange={e => setEditForm({ ...editForm, callConversation: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm" />
                              </td>
                              {!isTravel && <td className="p-2 border text-sm">{call.user || '-'}</td>}
                              <td className="p-2 border">
                                <input type="date" value={editForm.date}
                                  onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                                  className="w-full px-2 py-1 border rounded text-sm" />
                              </td>
                              <td className="p-2 border">
                                <div className="flex gap-1">
                                  <button onClick={() => saveEdit(call._id)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Save">
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => setEditingId(null)}
                                    className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Cancel">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 border">
                                <a href={`sip:${call.sourceNumber}`} className="font-mono text-sm bg-blue-50 px-2 py-1 rounded text-green-600 hover:text-green-800 hover:underline cursor-pointer inline-block" title="Call with Zoiper">
                                  📞 {call.sourceNumber}
                                </a>
                              </td>
                              <td className="p-3 border">
                                <a href={`sip:${call.destination}`} className="font-mono text-sm bg-purple-50 px-2 py-1 rounded text-green-600 hover:text-green-800 hover:underline cursor-pointer inline-block" title="Call with Zoiper">
                                  📞 {call.destination}
                                </a>
                              </td>
                              <td className="p-3 font-medium border">{call.callDuration}</td>
                              <td className="p-3 border">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                                  {call.status}
                                </span>
                              </td>
                              <td className="p-3 relative group border">
                                <div className="truncate cursor-help text-sm max-w-32">
                                  {call.callConversation}
                                </div>
                                {call.callConversation.length > 25 && (
                                  <div className="absolute left-0 top-full w-80 p-3 bg-gray-800 text-white text-sm rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-40 overflow-y-auto">
                                    <div className="break-words">{call.callConversation}</div>
                                    <div className="absolute -top-1 left-4 w-2 h-2 bg-gray-800 rotate-45"></div>
                                  </div>
                                )}
                              </td>
                              {!isTravel && <td className="p-3 text-sm border">{call.user || '-'}</td>}
                              <td className="p-3 text-sm border">{call.date}</td>
                              <td className="p-3 border">
                                <div className="flex gap-1">
                                  <button onClick={() => startEdit(call)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Edit">
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => deleteItem(call._id)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Delete">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallDescriptionsTable;
