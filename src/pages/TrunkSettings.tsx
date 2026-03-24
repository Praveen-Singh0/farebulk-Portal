import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/use-auth";
import {
  Phone,
  Save,
  RefreshCw,
  User,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Shield,
  Radio,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL;

interface Agent {
  _id: string;
  userName: string;
  email: string;
}

const TrunkSettings = () => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [agentName, setAgentName] = useState("");
  const [agentPhone, setAgentPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("Unknown");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchAgents();
      fetchConfig();
    }
  }, []);

  // Fetch all agents from CRM
  const fetchAgents = async () => {
    try {
      const res = await axios.get(`${baseURL}/auth/getUser`, {
        withCredentials: true,
      });
      setAgents(res.data || []);
    } catch (err) {
      console.warn("Could not fetch agents:", err);
    }
  };

  // Admin check
  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center text-red-500">
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm mt-2">Only admins can manage trunk settings.</p>
      </div>
    );
  }

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/trunk/config`, {
        withCredentials: true,
      });
      setAgentName(res.data.agentName || "");
      setAgentPhone(res.data.agentPhone || "");
      setUsername(res.data.username || "");
      setPassword(res.data.password || "");
      setRegistrationStatus(res.data.registrationStatus || "Unknown");
    } catch (err) {
      toast.error("Failed to load trunk configuration");
    } finally {
      setLoading(false);
    }
  };

  // Handle agent selection from dropdown
  const handleAgentSelect = (agentId: string) => {
    const selectedAgent = agents.find(a => a._id === agentId);
    if (selectedAgent) {
      setSelectedAgentId(agentId);
      setAgentName(selectedAgent.userName);
      setAgentPhone(selectedAgent.email);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim() || !agentPhone.trim() || !username.trim() || !password.trim()) {
      toast.error("All fields are required");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${baseURL}/trunk/config`,
        { 
          agentName: agentName.trim(),
          agentPhone: agentPhone.trim(),
          username: username.trim(), 
          password: password.trim() 
        },
        { withCredentials: true }
      );
      toast.success(res.data.message || "Trunk configuration updated");
      setRegistrationStatus(res.data.registrationStatus || "Unknown");
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to update trunk configuration"
      );
    } finally {
      setSaving(false);
    }
  };

  const statusColor =
    registrationStatus === "Registered"
      ? "text-green-600 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
      : registrationStatus === "Unregistered" || registrationStatus === "Rejected"
      ? "text-red-600 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
      : "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";

  const StatusIcon =
    registrationStatus === "Registered"
      ? CheckCircle
      : registrationStatus === "Unregistered" || registrationStatus === "Rejected"
      ? XCircle
      : AlertCircle;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Radio className="h-6 w-6 text-indigo-500" />
            Trunk Configuration
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage TheRealPBX SIP trunk credentials. Changes will update Asterisk
            and reload the trunk registration automatically.
          </p>
        </div>
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Registration Status Card */}
          <div
            className={`flex items-center gap-3 p-4 rounded-xl border ${statusColor}`}
          >
            <StatusIcon className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold">
                Trunk Status: {registrationStatus}
              </p>
              <p className="text-xs opacity-75 mt-0.5">
                {registrationStatus === "Registered"
                  ? "The SIP trunk is connected and ready for outbound/inbound calls."
                  : registrationStatus === "Rejected"
                  ? "The credentials were rejected by the provider. Please check and update."
                  : registrationStatus === "Unregistered"
                  ? "The trunk is not registered. Verify credentials and save again."
                  : "Unable to determine trunk status. Try refreshing."}
              </p>
            </div>
          </div>

          {/* Config Form */}
          <form
            onSubmit={handleSave}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                TheRealPBX Credentials
              </h3>
            </div>

            <div className="p-6 space-y-5">
              {/* Agent Selection Dropdown */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Select Agent from CRM
                </label>
                <select
                  value={selectedAgentId}
                  onChange={(e) => handleAgentSelect(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                >
                  <option value="">-- Choose an agent --</option>
                  {agents.map((agent) => (
                    <option key={agent._id} value={agent._id}>
                      {agent.userName} ({agent.email})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Select an agent from the CRM to auto-fill their details below.
                </p>
              </div>

              {/* Agent Name */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  Agent/User Name
                </label>
                <input
                  type="text"
                  value={agentName}
                  onChange={(e) => setAgentName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Name of the agent/person who will use this trunk connection.
                </p>
              </div>

              {/* Agent Phone */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  Agent Phone Number
                </label>
                <input
                  type="tel"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="e.g. +1-555-0100 or ext. 104"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Phone number or SIP extension associated with this agent.
                </p>
              </div>

              {/* Username */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  SIP Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. 05032810004"
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This is your SIP account number from TheRealPBX.
                </p>
              </div>

              {/* Password */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Key className="h-4 w-4 text-gray-400" />
                  SIP Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter SIP password"
                    className="w-full px-4 py-2.5 pr-20 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-indigo-500 hover:text-indigo-600 font-medium px-2 py-1"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Your SIP authentication password provided by TheRealPBX.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                A backup of the config will be saved before changes are applied.
              </p>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving & Reloading...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save & Reload Trunk
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>ℹ️ Note:</strong> Updating credentials will modify the
              Asterisk PJSIP configuration and automatically reload the trunk.
              The registration status will be checked after reload. If the status
              shows "Unregistered" after saving, verify the credentials with
              TheRealPBX support.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default TrunkSettings;
