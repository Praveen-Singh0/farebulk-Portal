import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/use-auth";
import {
  Phone,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  User,
  Key,
  Globe,
  Server,
  CheckCircle,
  XCircle,
  Edit3,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL;

interface SipConfigItem {
  _id: string;
  userName: string;
  sipExtension: string;
  sipPassword: string;
  sipDomain: string;
  wssServer: string;
  displayName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  userName: string;
  sipExtension: string;
  sipPassword: string;
  sipDomain: string;
  wssServer: string;
  displayName: string;
  isActive: boolean;
}

const emptyForm: FormData = {
  userName: "",
  sipExtension: "",
  sipPassword: "",
  sipDomain: "crm.farebulk.com",
  wssServer: "wss://crm.farebulk.com:8089/ws",
  displayName: "",
  isActive: true,
};

const SipSettings = () => {
  const { user } = useAuth();
  const [configs, setConfigs] = useState<SipConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FormData>({ ...emptyForm });
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [defaults, setDefaults] = useState({ sipDomain: "", wssServer: "" });

  useEffect(() => {
    if (user?.role === "admin") {
      fetchConfigs();
      fetchDefaults();
    }
  }, []);

  // Check admin
  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center text-red-500">
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm mt-2">Only admins can manage SIP settings.</p>
      </div>
    );
  }

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${baseURL}/sip/all`, {
        withCredentials: true,
      });
      setConfigs(res.data);
    } catch (err) {
      toast.error("Failed to load SIP configurations");
    } finally {
      setLoading(false);
    }
  };

  const fetchDefaults = async () => {
    try {
      const res = await axios.get(`${baseURL}/sip/defaults`, {
        withCredentials: true,
      });
      if (res.data.sipDomain) {
        setDefaults(res.data);
      }
    } catch (err) {
      // Use hardcoded defaults
    }
  };

  const handleAdd = () => {
    setFormData({
      ...emptyForm,
      sipDomain: defaults.sipDomain || emptyForm.sipDomain,
      wssServer: defaults.wssServer || emptyForm.wssServer,
    });
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (config: SipConfigItem) => {
    setFormData({
      userName: config.userName,
      sipExtension: config.sipExtension,
      sipPassword: config.sipPassword,
      sipDomain: config.sipDomain,
      wssServer: config.wssServer,
      displayName: config.displayName,
      isActive: config.isActive,
    });
    setEditingUser(config.userName);
    setShowForm(true);
  };

  const handleDelete = async (id: string, userName: string) => {
    if (!confirm(`Delete SIP config for "${userName}"?`)) return;
    try {
      await axios.delete(`${baseURL}/sip/${id}`, { withCredentials: true });
      toast.success(`SIP config for ${userName} deleted`);
      fetchConfigs();
    } catch (err) {
      toast.error("Failed to delete SIP config");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !formData.userName ||
      !formData.sipExtension ||
      !formData.sipPassword ||
      !formData.sipDomain ||
      !formData.wssServer
    ) {
      toast.error("All fields except Display Name are required");
      return;
    }

    setSaving(true);
    try {
      await axios.post(`${baseURL}/sip/upsert`, formData, {
        withCredentials: true,
      });
      toast.success(
        editingUser
          ? `SIP config for ${formData.userName} updated`
          : `SIP config for ${formData.userName} created`
      );
      setShowForm(false);
      setEditingUser(null);
      fetchConfigs();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || "Failed to save SIP config"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <Phone className="h-6 w-6 text-indigo-500" />
            SIP Phone Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Manage SIP extensions and credentials for agents. Each agent needs a
            SIP extension to use the softphone.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchConfigs}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Extension
          </button>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                {editingUser
                  ? `Edit SIP Config — ${editingUser}`
                  : "Add New SIP Extension"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    <User className="h-3 w-3 inline mr-1" />
                    CRM Username *
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) =>
                      setFormData({ ...formData, userName: e.target.value })
                    }
                    disabled={!!editingUser}
                    placeholder="e.g. john"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    <Phone className="h-3 w-3 inline mr-1" />
                    SIP Extension *
                  </label>
                  <input
                    type="text"
                    value={formData.sipExtension}
                    onChange={(e) =>
                      setFormData({ ...formData, sipExtension: e.target.value })
                    }
                    placeholder="e.g. 101"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    <Key className="h-3 w-3 inline mr-1" />
                    SIP Password *
                  </label>
                  <input
                    type="password"
                    value={formData.sipPassword}
                    onChange={(e) =>
                      setFormData({ ...formData, sipPassword: e.target.value })
                    }
                    placeholder="SIP password"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) =>
                      setFormData({ ...formData, displayName: e.target.value })
                    }
                    placeholder="e.g. John Smith"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Globe className="h-3 w-3 inline mr-1" />
                  SIP Domain *
                </label>
                <input
                  type="text"
                  value={formData.sipDomain}
                  onChange={(e) =>
                    setFormData({ ...formData, sipDomain: e.target.value })
                  }
                  placeholder="crm.farebulk.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  <Server className="h-3 w-3 inline mr-1" />
                  WebSocket Server (WSS) *
                </label>
                <input
                  type="text"
                  value={formData.wssServer}
                  onChange={(e) =>
                    setFormData({ ...formData, wssServer: e.target.value })
                  }
                  placeholder="wss://crm.farebulk.com:8089/ws"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                />
                <label
                  htmlFor="isActive"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  Active (agent can use softphone)
                </label>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : editingUser ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Info card */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>ℹ️ Setup Guide:</strong> Get SIP extension numbers and
          passwords from your PBX provider (TheRealPBX). Each agent needs a
          unique extension. The SIP Domain and WSS Server are usually the same
          for all agents.
        </p>
      </div>

      {/* Configs table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full" />
        </div>
      ) : configs.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            No SIP extensions configured yet.
          </p>
          <button
            onClick={handleAdd}
            className="mt-3 text-indigo-500 hover:text-indigo-600 text-sm font-medium"
          >
            + Add first extension
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Extension
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Display Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {configs.map((config) => (
                  <tr
                    key={config._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                          {config.userName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {config.userName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-200">
                        {config.sipExtension}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                      {config.displayName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {config.sipDomain}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {config.isActive ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full">
                          <XCircle className="h-3 w-3" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleDelete(config._id, config.userName)
                          }
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">
              {configs.length} extension{configs.length !== 1 ? "s" : ""}{" "}
              configured · {configs.filter((c) => c.isActive).length} active
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SipSettings;
