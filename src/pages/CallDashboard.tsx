import { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/use-auth";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneCall,
  RefreshCw,
  Radio,
  Users,
  Headphones,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  Volume2,
  ArrowRightLeft,
  Clock,
  Zap,
  Settings2,
  Circle,
  Plus,
  Minus,
  Pause,
  Play,
  ListOrdered,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { toast } from "react-toastify";

const baseURL = import.meta.env.VITE_BASE_URL;

interface LiveCall {
  id: string;
  channel: string;
  callerChannel: string;
  calleeChannel: string;
  extension: string;
  callerID: string;
  calleeNumber: string;
  state: string;
  application: string;
  duration: number;
  durationFormatted: string;
  direction: string;
  bridgeID: string;
  linkedID: string;
}

interface ExtStatus {
  extension: string;
  status: string;
}

interface QueueMember {
  extension: string;
  interface: string;
  status: string;
  paused: boolean;
  callsTaken: number;
}

interface QueueCaller {
  position: number;
  channel: string;
  waitTime: string;
}

interface QueueData {
  queue: string;
  strategy: string;
  calls: number;
  holdtime: number;
  talktime: number;
  completed: number;
  abandoned: number;
  members: QueueMember[];
  callers: QueueCaller[];
}

const STRATEGIES = [
  { value: "ringall", label: "Ring All", desc: "Ring every extension simultaneously", icon: Users },
  { value: "roundrobin", label: "Round Robin", desc: "Ring extensions in rotation", icon: ArrowRightLeft },
  { value: "random", label: "Random", desc: "Ring a random extension", icon: Zap },
  { value: "leastrecent", label: "Least Recent", desc: "Ring the least recently used", icon: Clock },
];

const ALL_EXTENSIONS = ["101", "102", "103", "104", "105", "106", "107", "108", "109", "110"];

const CallDashboard = () => {
  const { user } = useAuth();
  const [calls, setCalls] = useState<LiveCall[]>([]);
  const [activeChannels, setActiveChannels] = useState(0);
  const [activeCalls, setActiveCalls] = useState(0);
  const [extensions, setExtensions] = useState<ExtStatus[]>([]);
  const [ringStrategy, setRingStrategy] = useState("ringall");
  const [loading, setLoading] = useState(true);
  const [strategyLoading, setStrategyLoading] = useState(false);
  const [bargeTarget, setBargeTarget] = useState<string | null>(null);
  const [adminExt, setAdminExt] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  // Queue state
  const [queueData, setQueueData] = useState<QueueData | null>(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [addingExt, setAddingExt] = useState<string | null>(null);
  const [removingExt, setRemovingExt] = useState<string | null>(null);
  const [pausingExt, setPausingExt] = useState<string | null>(null);

  // Admin check
  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-center text-red-500">
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm mt-2">Only admins can access the call dashboard.</p>
      </div>
    );
  }

  const fetchAll = useCallback(async () => {
    try {
      const [callsRes, stratRes, extRes, queueRes] = await Promise.all([
        axios.get(`${baseURL}/ami/live-calls`, { withCredentials: true }),
        axios.get(`${baseURL}/ami/ring-strategy`, { withCredentials: true }),
        axios.get(`${baseURL}/ami/extension-status`, { withCredentials: true }),
        axios.get(`${baseURL}/ami/queue/status`, { withCredentials: true }),
      ]);
      setCalls(callsRes.data.calls || []);
      setActiveChannels(callsRes.data.activeChannels || 0);
      setActiveCalls(callsRes.data.activeCalls || 0);
      setRingStrategy(stratRes.data.strategy || "ringall");
      setExtensions(extRes.data.extensions || []);
      setQueueData(queueRes.data);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  useEffect(() => {
    if (autoRefresh) {
      intervalRef.current = setInterval(fetchAll, 3000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [autoRefresh, fetchAll]);

  const handleStrategyChange = async (newStrategy: string) => {
    setStrategyLoading(true);
    try {
      await axios.put(
        `${baseURL}/ami/ring-strategy`,
        { strategy: newStrategy },
        { withCredentials: true }
      );
      setRingStrategy(newStrategy);
      toast.success(`Ring strategy updated to ${newStrategy}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update ring strategy");
    } finally {
      setStrategyLoading(false);
    }
  };

  const handleBarge = async (extension: string) => {
    if (!adminExt) {
      setBargeTarget(extension);
      return;
    }
    try {
      const res = await axios.post(
        `${baseURL}/ami/barge`,
        { extension, adminExtension: adminExt },
        { withCredentials: true }
      );
      toast.success(res.data.message);
      setBargeTarget(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to initiate barge");
    }
  };

  const confirmBarge = async () => {
    if (!adminExt || !bargeTarget) {
      toast.error("Enter your SIP extension first");
      return;
    }
    await handleBarge(bargeTarget);
  };

  // Queue management handlers
  const handleAddToQueue = async (ext: string) => {
    setAddingExt(ext);
    try {
      const res = await axios.post(
        `${baseURL}/ami/queue/add-member`,
        { extension: ext },
        { withCredentials: true }
      );
      toast.success(res.data.message);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to add ${ext} to queue`);
    } finally {
      setAddingExt(null);
    }
  };

  const handleRemoveFromQueue = async (ext: string) => {
    setRemovingExt(ext);
    try {
      const res = await axios.post(
        `${baseURL}/ami/queue/remove-member`,
        { extension: ext },
        { withCredentials: true }
      );
      toast.success(res.data.message);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to remove ${ext} from queue`);
    } finally {
      setRemovingExt(null);
    }
  };

  const handlePauseMember = async (ext: string, paused: boolean) => {
    setPausingExt(ext);
    try {
      const res = await axios.post(
        `${baseURL}/ami/queue/pause-member`,
        { extension: ext, paused },
        { withCredentials: true }
      );
      toast.success(res.data.message);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${paused ? "pause" : "unpause"} ${ext}`);
    } finally {
      setPausingExt(null);
    }
  };

  const directionIcon = (dir: string) => {
    switch (dir) {
      case "inbound": return <PhoneIncoming className="h-4 w-4 text-blue-500" />;
      case "outbound": return <PhoneOutgoing className="h-4 w-4 text-green-500" />;
      default: return <ArrowRightLeft className="h-4 w-4 text-gray-400" />;
    }
  };

  const stateColor = (state: string) => {
    if (state === "Up") return "text-green-600 bg-green-50 dark:bg-green-900/20";
    if (state === "Ringing" || state === "Ring") return "text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20";
    return "text-gray-600 bg-gray-50 dark:bg-gray-800";
  };

  const extStatusColor = (status: string) => {
    if (status === "In use") return "bg-green-500";
    if (status === "Ringing") return "bg-yellow-500 animate-pulse";
    if (status === "Not in use") return "bg-blue-400";
    return "bg-gray-400";
  };

  const queueMemberStatusColor = (status: string, paused: boolean) => {
    if (paused) return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
    if (status === "In use") return "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400";
    if (status === "Ringing") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400";
    if (status === "Not in use") return "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400";
    return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  };

  // Figure out which extensions are NOT in the queue
  const queueMemberExts = queueData?.members.map(m => m.extension) || [];
  const availableToAdd = ALL_EXTENSIONS.filter(e => !queueMemberExts.includes(e));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <PhoneCall className="h-6 w-6 text-indigo-500" />
            Live Call Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Monitor active calls, manage ring strategy, queues, and barge into calls.
            {lastUpdate && <span className="ml-2 text-xs text-gray-400">Last update: {lastUpdate}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors ${
              autoRefresh
                ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            <Radio className={`h-3.5 w-3.5 ${autoRefresh ? "animate-pulse" : ""}`} />
            {autoRefresh ? "Live" : "Paused"}
          </button>
          <button
            onClick={fetchAll}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <PhoneCall className="h-6 w-6 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{activeCalls}</p>
                <p className="text-xs text-gray-500">Active Calls</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Phone className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{activeChannels}</p>
                <p className="text-xs text-gray-500">Active Channels</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {extensions.filter(e => e.status === "In use" || e.status === "Ringing").length} / {extensions.length}
                </p>
                <p className="text-xs text-gray-500">Extensions Active</p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                <ListOrdered className="h-6 w-6 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {queueData?.members.length || 0}
                </p>
                <p className="text-xs text-gray-500">Queue Members</p>
              </div>
            </div>
          </div>

          {/* Extension Status Bar */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Extension Status
            </h3>
            <div className="flex flex-wrap gap-2">
              {extensions.length > 0 ? extensions.map((ext) => (
                <div
                  key={ext.extension}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-750 rounded-lg border border-gray-200 dark:border-gray-600"
                  title={ext.status}
                >
                  <Circle className={`h-2.5 w-2.5 fill-current ${extStatusColor(ext.status)} rounded-full`} />
                  <span className="text-sm font-mono font-medium text-gray-700 dark:text-gray-200">
                    {ext.extension}
                  </span>
                  <span className="text-xs text-gray-400">
                    {ext.status === "In use" ? "🔊" : ext.status === "Ringing" ? "🔔" : ext.status === "Not in use" ? "✓" : "—"}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-gray-400">No extensions detected</p>
              )}
            </div>
            <div className="mt-2 flex gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500 inline-block" /> In use</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500 inline-block" /> Ringing</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-blue-400 inline-block" /> Available</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400 inline-block" /> Offline</span>
            </div>
          </div>

          {/* Call Queue Management */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ListOrdered className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  Inbound Call Queue
                </h3>
                {queueData && (
                  <span className="text-xs font-medium px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full">
                    {queueData.strategy}
                  </span>
                )}
              </div>
              {queueData && (
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>Completed: <strong className="text-green-600">{queueData.completed}</strong></span>
                  <span>Abandoned: <strong className="text-red-600">{queueData.abandoned}</strong></span>
                  <span>Avg Hold: <strong>{queueData.holdtime}s</strong></span>
                  <span>Avg Talk: <strong>{queueData.talktime}s</strong></span>
                </div>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Queue Callers Waiting */}
              {queueData && queueData.callers.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <h4 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2 flex items-center gap-2">
                    <Phone className="h-4 w-4 animate-pulse" />
                    {queueData.callers.length} Caller{queueData.callers.length > 1 ? "s" : ""} Waiting
                  </h4>
                  <div className="space-y-1">
                    {queueData.callers.map((caller) => (
                      <div key={caller.position} className="flex items-center gap-3 text-sm text-red-700 dark:text-red-300">
                        <span className="font-mono font-bold">#{caller.position}</span>
                        <span className="font-mono text-xs">{caller.channel}</span>
                        <span className="text-xs">Wait: {caller.waitTime}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Queue Members Table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Queue Members ({queueData?.members.length || 0})
                </h4>

                {queueData && queueData.members.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Extension</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Calls Taken</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {queueData.members.map((member) => (
                          <tr key={member.extension} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded font-semibold text-gray-700 dark:text-gray-200">
                                {member.extension}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${queueMemberStatusColor(member.status, member.paused)}`}>
                                {member.paused ? (
                                  <><Pause className="h-3 w-3" /> Paused</>
                                ) : (
                                  <>{member.status === "In use" ? <PhoneCall className="h-3 w-3" /> : member.status === "Ringing" ? <Phone className="h-3 w-3 animate-pulse" /> : member.status === "Not in use" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} {member.status}</>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-mono text-gray-600 dark:text-gray-300">{member.callsTaken}</span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handlePauseMember(member.extension, !member.paused)}
                                  disabled={pausingExt === member.extension}
                                  className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                    member.paused
                                      ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
                                      : "bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400"
                                  }`}
                                  title={member.paused ? "Unpause member" : "Pause member"}
                                >
                                  {pausingExt === member.extension ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : member.paused ? (
                                    <Play className="h-3 w-3" />
                                  ) : (
                                    <Pause className="h-3 w-3" />
                                  )}
                                  {member.paused ? "Resume" : "Pause"}
                                </button>
                                <button
                                  onClick={() => handleRemoveFromQueue(member.extension)}
                                  disabled={removingExt === member.extension}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 text-xs font-medium rounded-lg transition-colors"
                                  title="Remove from queue"
                                >
                                  {removingExt === member.extension ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <UserMinus className="h-3 w-3" />
                                  )}
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No members in queue. Add extensions below.</p>
                  </div>
                )}
              </div>

              {/* Add Extensions to Queue */}
              {availableToAdd.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-green-500" />
                    Add Extension to Queue
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {availableToAdd.map((ext) => {
                      const extInfo = extensions.find(e => e.extension === ext);
                      const isOnline = extInfo && extInfo.status !== "Unavailable";
                      return (
                        <button
                          key={ext}
                          onClick={() => handleAddToQueue(ext)}
                          disabled={addingExt === ext}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
                            isOnline
                              ? "border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20"
                              : "border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 hover:bg-gray-100"
                          }`}
                          title={`Add extension ${ext} to queue${extInfo ? ` (${extInfo.status})` : ""}`}
                        >
                          {addingExt === ext ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Plus className="h-3.5 w-3.5" />
                          )}
                          <span className="font-mono">{ext}</span>
                          {extInfo && (
                            <Circle className={`h-2 w-2 fill-current ${extStatusColor(extInfo.status)} rounded-full`} />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ring Strategy */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-indigo-500" />
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                Inbound Ring Strategy
              </h3>
              {strategyLoading && <Loader2 className="h-4 w-4 animate-spin text-indigo-500 ml-2" />}
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {STRATEGIES.map((s) => {
                const Icon = s.icon;
                const isActive = ringStrategy === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => handleStrategyChange(s.value)}
                    disabled={strategyLoading}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                        : "border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className={`h-4 w-4 ${isActive ? "text-indigo-500" : "text-gray-400"}`} />
                      <span className={`text-sm font-semibold ${isActive ? "text-indigo-700 dark:text-indigo-300" : "text-gray-700 dark:text-gray-200"}`}>
                        {s.label}
                      </span>
                      {isActive && <CheckCircle className="h-4 w-4 text-indigo-500 ml-auto" />}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Calls Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-indigo-500" />
                Live Calls
                {calls.length > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-full animate-pulse">
                    {calls.length} LIVE
                  </span>
                )}
              </h3>
            </div>

            {calls.length === 0 ? (
              <div className="py-16 text-center">
                <Phone className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No active calls right now.</p>
                <p className="text-gray-400 text-xs mt-1">Calls will appear here in real-time when agents make or receive calls.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Direction</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Extension</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Caller ID</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Destination</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">State</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {calls.map((call) => (
                      <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {directionIcon(call.direction)}
                            <span className="text-xs font-medium capitalize text-gray-600 dark:text-gray-300">
                              {call.direction}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-200 font-semibold">
                            {call.extension || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                          {call.callerID || "Unknown"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                          {call.calleeNumber || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${stateColor(call.state)}`}>
                            {call.state === "Up" ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : call.state === "Ringing" || call.state === "Ring" ? (
                              <Phone className="h-3 w-3 animate-pulse" />
                            ) : (
                              <AlertCircle className="h-3 w-3" />
                            )}
                            {call.state}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono text-gray-600 dark:text-gray-300">
                            {call.durationFormatted}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {call.extension && call.state === "Up" && (
                            <button
                              onClick={() => handleBarge(call.extension)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors"
                              title={`Barge into call on ext ${call.extension}`}
                            >
                              <Headphones className="h-3.5 w-3.5" />
                              Barge
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Barge Modal */}
          {bargeTarget && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Headphones className="h-5 w-5 text-red-500" />
                    Barge into Ext {bargeTarget}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Enter your SIP extension. Your phone will ring — answer it to join the call on extension <strong>{bargeTarget}</strong>.
                  </p>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Your Admin Extension
                    </label>
                    <input
                      type="text"
                      value={adminExt}
                      onChange={(e) => setAdminExt(e.target.value)}
                      placeholder="e.g. 104"
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={confirmBarge}
                      disabled={!adminExt}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      <Headphones className="h-4 w-4" />
                      Barge Now
                    </button>
                    <button
                      onClick={() => setBargeTarget(null)}
                      className="px-4 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CallDashboard;
