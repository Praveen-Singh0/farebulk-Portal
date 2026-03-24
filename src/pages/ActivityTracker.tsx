import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '@/contexts/use-auth';
import { RefreshCw, Circle, Clock, User, Coffee, LogIn, LogOut, ArrowLeft, Calendar, Filter } from 'lucide-react';

interface UserStatus {
  userName: string;
  email: string;
  role: string;
  currentStatus: string;
  lastActivity: string | null;
}

interface ActivityLog {
  _id: string;
  userName: string;
  email: string;
  role: string;
  action: string;
  timestamp: string;
  ip: string;
}

const ActivityTracker = () => {
  const { user } = useAuth();
  const [statuses, setStatuses] = useState<UserStatus[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [timeline, setTimeline] = useState<ActivityLog[]>([]);
  const baseURL = import.meta.env.VITE_BASE_URL;

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatTimeOnly = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
  };

  const formatDateFull = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      timeZone: 'America/New_York',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'login':
      case 'back':
        return 'text-green-500';
      case 'break':
        return 'text-yellow-500';
      case 'logout':
        return 'text-red-500';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'login':
      case 'back':
        return 'bg-green-50 border-green-200';
      case 'break':
        return 'bg-yellow-50 border-yellow-200';
      case 'logout':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'login':
      case 'back':
        return 'Online';
      case 'break':
        return 'On Break';
      case 'logout':
        return 'Offline';
      default:
        return 'Offline';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'login':
      case 'back':
        return 'bg-green-100 text-green-800';
      case 'break':
        return 'bg-yellow-100 text-yellow-800';
      case 'logout':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'login':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'back':
        return <LogIn className="h-4 w-4 text-green-600" />;
      case 'break':
        return <Coffee className="h-4 w-4 text-yellow-600" />;
      case 'logout':
        return <LogOut className="h-4 w-4 text-red-600" />;
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'login':
        return 'bg-green-100 text-green-800';
      case 'back':
        return 'bg-blue-100 text-blue-800';
      case 'break':
        return 'bg-yellow-100 text-yellow-800';
      case 'logout':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const fetchStatuses = async () => {
    try {
      const res = await axios.get(`${baseURL}/activity/statuses`, { withCredentials: true });
      setStatuses(res.data);
    } catch (err) {
      console.error('Error fetching statuses:', err);
    }
  };

  const fetchLogs = async () => {
    try {
      const params: Record<string, string> = {};
      if (filterUser) params.userName = filterUser;
      if (filterAction) params.action = filterAction;
      if (filterDate) params.date = filterDate;
      const res = await axios.get(`${baseURL}/activity/logs`, { params, withCredentials: true });
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const fetchTimeline = async (userName: string) => {
    try {
      const res = await axios.get(`${baseURL}/activity/timeline/${userName}`, { withCredentials: true });
      setTimeline(res.data);
      setSelectedUser(userName);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    }
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchStatuses(), fetchLogs()]);
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchStatuses, 15000); // Auto-refresh every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filterUser, filterAction, filterDate]);

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 text-lg font-medium">Access denied. Admin only.</p>
      </div>
    );
  }

  const onlineCount = statuses.filter(s => s.currentStatus === 'login' || s.currentStatus === 'back').length;
  const breakCount = statuses.filter(s => s.currentStatus === 'break').length;
  const offlineCount = statuses.filter(s => s.currentStatus === 'logout' || s.currentStatus === 'offline').length;

  const uniqueUsers = [...new Set(logs.map(l => l.userName))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Activity Tracker</h2>
          <p className="text-sm text-gray-500 mt-1">Monitor login, break & logout activity of all agents</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Circle className="h-5 w-5 text-green-600 fill-green-600" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Online</p>
              <p className="text-2xl font-bold text-green-800">{onlineCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Coffee className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-yellow-600 font-medium">On Break</p>
              <p className="text-2xl font-bold text-yellow-800">{breakCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <LogOut className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-red-600 font-medium">Offline</p>
              <p className="text-2xl font-bold text-red-800">{offlineCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => { setActiveTab('live'); setSelectedUser(null); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'live' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Live Status
        </button>
        <button
          onClick={() => { setActiveTab('history'); setSelectedUser(null); }}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'history' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Activity History
        </button>
      </div>

      {/* LIVE STATUS TAB */}
      {activeTab === 'live' && !selectedUser && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">Current Team Status</h3>
          </div>
          <div className="divide-y">
            {statuses.length === 0 ? (
              <div className="p-8 text-center text-gray-400">No users found</div>
            ) : (
              statuses
                .sort((a, b) => {
                  const order: Record<string, number> = { login: 0, back: 0, break: 1, logout: 2, offline: 3 };
                  return (order[a.currentStatus] ?? 3) - (order[b.currentStatus] ?? 3);
                })
                .map((s) => (
                  <div
                    key={s.userName}
                    className={`flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer transition-colors ${getStatusBg(s.currentStatus)}`}
                    onClick={() => fetchTimeline(s.userName)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                          {s.userName?.charAt(0).toUpperCase()}
                        </div>
                        <Circle className={`h-3 w-3 absolute -bottom-0.5 -right-0.5 fill-current ${getStatusColor(s.currentStatus)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{s.userName}</p>
                        <p className="text-xs text-gray-500">{s.email} • {s.role}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(s.currentStatus)}`}>
                        {getStatusLabel(s.currentStatus)}
                      </span>
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Last activity</p>
                        <p className="text-sm text-gray-600">{formatTime(s.lastActivity)}</p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* USER TIMELINE (when clicking a user from live status) */}
      {activeTab === 'live' && selectedUser && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gray-50 flex items-center gap-3">
            <button
              onClick={() => setSelectedUser(null)}
              className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h3 className="font-semibold text-gray-800">{selectedUser}'s Today Timeline</h3>
              <p className="text-xs text-gray-500">Click on a user from the list to see their timeline</p>
            </div>
          </div>
          <div className="p-4">
            {timeline.length === 0 ? (
              <p className="text-center text-gray-400 py-8">No activity today</p>
            ) : (
              <div className="relative">
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                <div className="space-y-4">
                  {timeline.map((log) => (
                    <div key={log._id} className="flex items-start gap-4 relative">
                      <div className="z-10 bg-white p-1 rounded-full border-2 border-gray-200">
                        {getActionIcon(log.action)}
                      </div>
                      <div className="flex-1 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionBadge(log.action)}`}>
                            {log.action.toUpperCase()}
                          </span>
                          <span className="text-sm text-gray-500">{formatTimeOnly(log.timestamp)}</span>
                        </div>
                        {log.ip && <p className="text-xs text-gray-400 mt-1">IP: {log.ip}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* HISTORY TAB */}
      {activeTab === 'history' && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Filter className="h-3 w-3 inline mr-1" />Agent
              </label>
              <select
                value={filterUser}
                onChange={(e) => setFilterUser(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[150px]"
              >
                <option value="">All Agents</option>
                {uniqueUsers.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <User className="h-3 w-3 inline mr-1" />Action
              </label>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white min-w-[130px]"
              >
                <option value="">All Actions</option>
                <option value="login">Login</option>
                <option value="break">Break</option>
                <option value="back">Back</option>
                <option value="logout">Logout</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                <Calendar className="h-3 w-3 inline mr-1" />Date
              </label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm bg-white"
              />
            </div>
            {(filterUser || filterAction || filterDate) && (
              <button
                onClick={() => { setFilterUser(''); setFilterAction(''); setFilterDate(''); }}
                className="px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Agent</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Action</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">Time (EST)</th>
                    <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-400">
                        No activity logs found
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                              {log.userName?.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-gray-900">{log.userName}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{log.role}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${getActionBadge(log.action)}`}>
                              {log.action.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            {formatDateFull(log.timestamp)}
                          </div>
                        </td>
                        <td className="p-3 text-sm text-gray-500 font-mono">{log.ip || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-3 border-t bg-gray-50 text-xs text-gray-500">
              Showing {logs.length} records {filterUser && `for ${filterUser}`} {filterDate && `on ${filterDate}`}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ActivityTracker;
