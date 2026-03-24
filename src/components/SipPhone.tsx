import { useState, useRef, useEffect, useCallback } from "react";
import {
  Phone,
  PhoneCall,
  PhoneOff,
  PhoneIncoming,
  PhoneForwarded,
  Mic,
  MicOff,
  Pause,
  Play,
  Delete,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  X,
  Loader2,
  Users,
  ArrowRightLeft,
  PhoneOutgoing,
  Clock,
  Hash,
  UserPlus,
  User,
  BookOpen,
  Mail,
  Ticket,
} from "lucide-react";
import axios from "axios";
import {
  UserAgent,
  Registerer,
  RegistererState,
  Inviter,
  SessionState,
  UserAgentState,
} from "sip.js";
import type { Invitation } from "sip.js";
import type { Session } from "sip.js";

const baseURL = import.meta.env.VITE_BASE_URL;

const DTMF_TONES = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["*", "0", "#"],
];

type PhoneStatus =
  | "disconnected"
  | "connecting"
  | "registered"
  | "ringing-out"
  | "ringing-in"
  | "in-call"
  | "on-hold"
  | "error";

type ActiveTab = "dialpad" | "transfer" | "conference";

interface SipCredentials {
  sipExtension: string;
  sipPassword: string;
  sipDomain: string;
  wssServer: string;
  displayName: string;
}

interface CallerIdInfo {
  found: boolean;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalBookings: number;
  totalAuthRecords: number;
  totalCalls: number;
  bookings: {
    id: string;
    name: string;
    email: string;
    confirmationCode: string;
    airline: string;
    type: string;
    requestFor: string;
    status: string;
    consultant: string;
    date: string;
  }[];
  authRecords: {
    id: string;
    name: string;
    email: string;
    bookingRef: string;
    company: string;
    amount: string;
    status: string;
    date: string;
  }[];
  recentCalls: {
    id: string;
    source: string;
    destination: string;
    duration: string;
    status: string;
    notes: string;
    agent: string;
    date: string;
  }[];
}

interface CallLogEntry {
  number: string;
  name?: string;
  type: "outbound" | "inbound" | "missed";
  time: string;
  duration: number;
}

const SipPhone = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [dialNumber, setDialNumber] = useState("");
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [status, setStatus] = useState<PhoneStatus>("disconnected");
  const [statusText, setStatusText] = useState("Offline");
  const [callTimer, setCallTimer] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isHeld, setIsHeld] = useState(false);
  const [incomingCaller, setIncomingCaller] = useState("");
  const [showDtmf, setShowDtmf] = useState(false);
  const [credentials, setCredentials] = useState<SipCredentials | null>(null);
  const [credError, setCredError] = useState("");
  const [activeTab, setActiveTab] = useState<ActiveTab>("dialpad");
  const [currentCallNumber, setCurrentCallNumber] = useState("");

  // Transfer states
  const [transferNumber, setTransferNumber] = useState("");
  const [transferType, setTransferType] = useState<"blind" | "attended">("blind");
  const [isTransferring, setIsTransferring] = useState(false);

  // Conference states
  const [confNumber, setConfNumber] = useState("");
  const [confSessions, setConfSessions] = useState<
    { session: Session; number: string; state: string }[]
  >([]);
  const [isAddingParty, setIsAddingParty] = useState(false);

  // Volume
  const [volume, setVolume] = useState(80);
  const [showVolume, setShowVolume] = useState(false);

  // Caller ID
  const [callerIdInfo, setCallerIdInfo] = useState<CallerIdInfo | null>(null);
  const [callerIdLoading, setCallerIdLoading] = useState(false);
  const [showCallerDetail, setShowCallerDetail] = useState(false);

  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);
  const sessionRef = useRef<Session | null>(null);
  const callTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const callStartRef = useRef<number>(0);

  // Load call logs
  useEffect(() => {
    try {
      const saved = localStorage.getItem("crm_call_logs");
      if (saved) setCallLogs(JSON.parse(saved));
    } catch {}
  }, []);

  // Audio element
  useEffect(() => {
    const audio = new Audio();
    audio.autoplay = true;
    audio.volume = volume / 100;
    remoteAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.srcObject = null;
    };
  }, []);

  // Volume sync
  useEffect(() => {
    if (remoteAudioRef.current) remoteAudioRef.current.volume = volume / 100;
  }, [volume]);

  // Fetch SIP credentials
  useEffect(() => {
    fetchCredentials();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupCall();
      if (registererRef.current) {
        try {
          registererRef.current.unregister();
        } catch {}
      }
      if (userAgentRef.current) {
        try {
          userAgentRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await axios.get(`${baseURL}/sip/my-config`, {
        withCredentials: true,
      });
      setCredentials(res.data);
      setCredError("");
    } catch (err: any) {
      setCredError(err.response?.data?.message || "No SIP config found");
      setCredentials(null);
    }
  };

  const addCallLog = (
    number: string,
    type: "outbound" | "inbound" | "missed",
    duration: number,
    name?: string
  ) => {
    const entry: CallLogEntry = {
      number,
      name: name || callerIdInfo?.customerName || undefined,
      type,
      time: new Date().toISOString(),
      duration,
    };
    const updated = [entry, ...callLogs].slice(0, 50);
    setCallLogs(updated);
    localStorage.setItem("crm_call_logs", JSON.stringify(updated));
  };

  /* ─── CALLER ID LOOKUP ────────────────────────────────── */
  const lookupCallerId = async (phone: string): Promise<CallerIdInfo | null> => {
    if (!phone || phone.length < 3) return null;
    // Skip lookup for internal extensions (3 digits)
    if (/^\d{3}$/.test(phone)) return null;
    setCallerIdLoading(true);
    try {
      const res = await axios.get(
        `${baseURL}/caller-id/lookup/${encodeURIComponent(phone)}`,
        { withCredentials: true }
      );
      const data = res.data as CallerIdInfo;
      setCallerIdInfo(data);
      return data;
    } catch (err) {
      console.error("Caller ID lookup error:", err);
      setCallerIdInfo(null);
      return null;
    } finally {
      setCallerIdLoading(false);
    }
  };

  /* ─── SIP CONNECT ──────────────────────────────────────── */
  const connectSip = useCallback(async () => {
    if (!credentials) return;
    if (
      userAgentRef.current &&
      status !== "disconnected" &&
      status !== "error"
    )
      return;

    setStatus("connecting");
    setStatusText("Connecting...");

    try {
      if (userAgentRef.current) {
        try {
          await userAgentRef.current.stop();
        } catch {}
        userAgentRef.current = null;
        registererRef.current = null;
      }

      const uri = UserAgent.makeURI(
        `sip:${credentials.sipExtension}@${credentials.sipDomain}`
      );
      if (!uri) throw new Error("Invalid SIP URI");

      const ua = new UserAgent({
        uri,
        transportOptions: {
          server: credentials.wssServer,
          traceSip: false,
        },
        authorizationUsername: credentials.sipExtension,
        authorizationPassword: credentials.sipPassword,
        displayName: credentials.displayName || credentials.sipExtension,
        logLevel: "warn",
        delegate: {
          onInvite: (invitation: Invitation) =>
            handleIncomingCall(invitation),
        },
      });

      ua.stateChange.addListener((state: UserAgentState) => {
        if (state === UserAgentState.Stopped) {
          setStatus("disconnected");
          setStatusText("Offline");
        }
      });

      await ua.start();

      ua.transport.stateChange.addListener((state: any) => {
        if (state === "Disconnected" || state === "Disconnecting") {
          setStatus("error");
          setStatusText("Transport disconnected");
        }
      });
      ua.transport.onDisconnect = (error?: Error) => {
        if (error) {
          setStatus("error");
          setStatusText("WSS: " + (error.message || "Lost"));
        }
      };

      userAgentRef.current = ua;

      const registerer = new Registerer(ua, { expires: 300 });
      registerer.stateChange.addListener((state: RegistererState) => {
        switch (state) {
          case RegistererState.Registered:
            setStatus("registered");
            setStatusText(`Ext: ${credentials.sipExtension}`);
            break;
          case RegistererState.Unregistered:
            setStatus("disconnected");
            setStatusText("Unregistered");
            break;
          case RegistererState.Terminated:
            setStatus("disconnected");
            setStatusText("Terminated");
            break;
        }
      });

      await registerer.register();
      registererRef.current = registerer;
    } catch (error: any) {
      console.error("[SipPhone] Connect error:", error);
      setStatus("error");
      const msg = error?.message || "Connection failed";
      setStatusText(
        msg.includes("WebSocket") ? "WSS failed — check network" : msg
      );
    }
  }, [credentials, status]);

  /* ─── DISCONNECT ───────────────────────────────────────── */
  const disconnectSip = async () => {
    cleanupCall();
    if (registererRef.current) {
      try {
        await registererRef.current.unregister();
      } catch {}
      registererRef.current = null;
    }
    if (userAgentRef.current) {
      try {
        await userAgentRef.current.stop();
      } catch {}
      userAgentRef.current = null;
    }
    setStatus("disconnected");
    setStatusText("Offline");
  };

  /* ─── INCOMING CALL ────────────────────────────────────── */
  const handleIncomingCall = (invitation: Invitation) => {
    sessionRef.current = invitation;
    const caller =
      invitation.remoteIdentity?.uri?.user ||
      invitation.remoteIdentity?.displayName ||
      "Unknown";
    setIncomingCaller(caller);
    setCurrentCallNumber(caller);
    setStatus("ringing-in");
    setStatusText(`Incoming: ${caller}`);
    setIsOpen(true);
    setIsMinimized(false);
    lookupCallerId(caller);

    invitation.stateChange.addListener((state: SessionState) => {
      if (state === SessionState.Terminated) {
        if (status === "ringing-in") addCallLog(caller, "missed", 0);
        cleanupCall();
        setStatus("registered");
        setStatusText(`Ext: ${credentials?.sipExtension || ""}`);
      }
    });
  };

  /* ─── ANSWER CALL ──────────────────────────────────────── */
  const answerCall = async () => {
    const session = sessionRef.current as Invitation;
    if (!session) return;
    try {
      await (session as any).accept({
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });
      setupSessionAudio(session);
      setStatus("in-call");
      const displayName = callerIdInfo?.customerName || incomingCaller;
      setStatusText(`On call: ${displayName}`);
      callStartRef.current = Date.now();
      startCallTimer();
    } catch (error) {
      console.error("Answer error:", error);
      setStatus("error");
      setStatusText("Failed to answer");
    }
  };

  /* ─── REJECT CALL ──────────────────────────────────────── */
  const rejectCall = async () => {
    const session = sessionRef.current as Invitation;
    if (!session) return;
    try {
      await (session as any).reject();
    } catch {}
    addCallLog(incomingCaller, "missed", 0);
    cleanupCall();
    setStatus("registered");
    setStatusText(`Ext: ${credentials?.sipExtension || ""}`);
  };

  /* ─── MAKE CALL ────────────────────────────────────────── */
  const makeCall = async (number?: string) => {
    const num = (number || dialNumber).trim();
    if (!num || !userAgentRef.current || status !== "registered") return;

    setCurrentCallNumber(num);
    setStatus("ringing-out");
    setStatusText(`Calling: ${num}`);
    lookupCallerId(num);

    try {
      const target = UserAgent.makeURI(
        `sip:${num}@${credentials!.sipDomain}`
      );
      if (!target) throw new Error("Invalid target URI");

      const inviter = new Inviter(userAgentRef.current, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      sessionRef.current = inviter;

      inviter.stateChange.addListener((state: SessionState) => {
        switch (state) {
          case SessionState.Establishing:
            setStatus("ringing-out");
            break;
          case SessionState.Established:
            setStatus("in-call");
            setStatusText(`On call: ${callerIdInfo?.customerName || num}`);
            setupSessionAudio(inviter);
            callStartRef.current = Date.now();
            startCallTimer();
            break;
          case SessionState.Terminated:
            addCallLog(
              num,
              "outbound",
              Math.floor((Date.now() - callStartRef.current) / 1000),
              callerIdInfo?.customerName
            );
            cleanupCall();
            setStatus("registered");
            setStatusText(`Ext: ${credentials?.sipExtension || ""}`);
            break;
        }
      });

      await inviter.invite();
    } catch (error: any) {
      console.error("Call error:", error);
      cleanupCall();
      setStatus("error");
      setStatusText(error.message || "Call failed");
      setTimeout(() => {
        setStatus("registered");
        setStatusText(`Ext: ${credentials?.sipExtension || ""}`);
      }, 3000);
    }
  };

  /* ─── HANG UP ──────────────────────────────────────────── */
  const hangUp = async () => {
    const session = sessionRef.current;
    if (!session) return;
    try {
      switch (session.state) {
        case SessionState.Initial:
        case SessionState.Establishing:
          if ("cancel" in session) await (session as Inviter).cancel();
          else if ("reject" in session) await (session as any).reject();
          break;
        case SessionState.Established:
          await session.bye();
          break;
      }
    } catch (err) {
      console.error("Hangup error:", err);
    }

    addCallLog(
      currentCallNumber,
      status === "ringing-in" ? "inbound" : "outbound",
      callTimer
    );
    cleanupCall();
    setStatus("registered");
    setStatusText(`Ext: ${credentials?.sipExtension || ""}`);
  };

  /* ─── BLIND TRANSFER ───────────────────────────────────── */
  const blindTransfer = async () => {
    const session = sessionRef.current;
    if (
      !session ||
      !transferNumber.trim() ||
      session.state !== SessionState.Established
    )
      return;
    if (!userAgentRef.current) return;

    setIsTransferring(true);
    try {
      const target = UserAgent.makeURI(
        `sip:${transferNumber.trim()}@${credentials!.sipDomain}`
      );
      if (!target) throw new Error("Invalid transfer target");

      await session.refer(target, {
        requestDelegate: {
          onAccept: () => {
            setIsTransferring(false);
            setTransferNumber("");
            setActiveTab("dialpad");
          },
          onReject: () => {
            setIsTransferring(false);
          },
        },
      });
    } catch (err) {
      console.error("Blind transfer error:", err);
      setIsTransferring(false);
    }
  };

  /* ─── ATTENDED TRANSFER ────────────────────────────────── */
  const attendedTransfer = async () => {
    const session = sessionRef.current;
    if (
      !session ||
      !transferNumber.trim() ||
      session.state !== SessionState.Established
    )
      return;
    if (!userAgentRef.current) return;

    setIsTransferring(true);
    try {
      // Hold current call
      const pc = (session.sessionDescriptionHandler as any)
        ?.peerConnection as RTCPeerConnection | undefined;
      if (pc) {
        pc.getSenders().forEach((s) => {
          if (s.track) s.track.enabled = false;
        });
      }
      setIsHeld(true);

      // Dial the transfer target
      const target = UserAgent.makeURI(
        `sip:${transferNumber.trim()}@${credentials!.sipDomain}`
      );
      if (!target) throw new Error("Invalid transfer target");

      const consultInviter = new Inviter(userAgentRef.current, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      consultInviter.stateChange.addListener((state: SessionState) => {
        if (state === SessionState.Established) {
          setupSessionAudio(consultInviter);
          // Perform REFER with Replaces
          try {
            session.refer(consultInviter, {
              requestDelegate: {
                onAccept: () => {
                  setIsTransferring(false);
                  setTransferNumber("");
                  setActiveTab("dialpad");
                  cleanupCall();
                  setStatus("registered");
                  setStatusText(
                    `Ext: ${credentials?.sipExtension || ""}`
                  );
                },
              },
            });
          } catch (e) {
            console.error("Attended transfer REFER error:", e);
            setIsTransferring(false);
          }
        } else if (state === SessionState.Terminated) {
          // Consult leg failed, resume original
          if (pc) {
            pc.getSenders().forEach((s) => {
              if (s.track) s.track.enabled = true;
            });
          }
          setIsHeld(false);
          setIsTransferring(false);
          setupSessionAudio(session);
        }
      });

      await consultInviter.invite();
    } catch (err) {
      console.error("Attended transfer error:", err);
      setIsTransferring(false);
      setIsHeld(false);
    }
  };

  /* ─── ADD TO CONFERENCE ────────────────────────────────── */
  const addToConference = async () => {
    if (!confNumber.trim() || !userAgentRef.current) return;

    setIsAddingParty(true);
    try {
      const target = UserAgent.makeURI(
        `sip:${confNumber.trim()}@${credentials!.sipDomain}`
      );
      if (!target) throw new Error("Invalid conference target");

      const inviter = new Inviter(userAgentRef.current, target, {
        sessionDescriptionHandlerOptions: {
          constraints: { audio: true, video: false },
        },
      });

      const num = confNumber.trim();

      inviter.stateChange.addListener((state: SessionState) => {
        if (state === SessionState.Established) {
          setupSessionAudio(inviter);
          setConfSessions((prev) => [
            ...prev,
            { session: inviter, number: num, state: "connected" },
          ]);
          setConfNumber("");
          setIsAddingParty(false);
          mixConferenceAudio();
        } else if (state === SessionState.Terminated) {
          setConfSessions((prev) =>
            prev.filter((s) => s.session !== inviter)
          );
          setIsAddingParty(false);
        }
      });

      await inviter.invite();
    } catch (err) {
      console.error("Conference add error:", err);
      setIsAddingParty(false);
    }
  };

  /* ─── CONFERENCE AUDIO MIXING ──────────────────────────── */
  const mixConferenceAudio = () => {
    try {
      const audioCtx = new AudioContext();
      const merger = audioCtx.createChannelMerger(2);
      const destination = audioCtx.createMediaStreamDestination();
      merger.connect(destination);

      const allSessions = [
        sessionRef.current,
        ...confSessions.map((c) => c.session),
      ].filter(Boolean);

      allSessions.forEach((sess) => {
        if (!sess) return;
        const pc = (sess.sessionDescriptionHandler as any)
          ?.peerConnection as RTCPeerConnection | undefined;
        if (!pc) return;

        pc.getReceivers().forEach((receiver) => {
          if (receiver.track?.kind === "audio") {
            const stream = new MediaStream([receiver.track]);
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(merger);
          }
        });
      });

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = destination.stream;
        remoteAudioRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.error("Conference audio mix error:", err);
    }
  };

  /* ─── REMOVE FROM CONFERENCE ───────────────────────────── */
  const removeFromConference = async (index: number) => {
    const entry = confSessions[index];
    if (!entry) return;
    try {
      if (entry.session.state === SessionState.Established) {
        await entry.session.bye();
      }
    } catch {}
    setConfSessions((prev) => prev.filter((_, i) => i !== index));
  };

  /* ─── AUDIO SETUP ──────────────────────────────────────── */
  const setupSessionAudio = (session: Session) => {
    const sdh = session.sessionDescriptionHandler;
    if (!sdh) return;
    const pc = (sdh as any).peerConnection as
      | RTCPeerConnection
      | undefined;
    if (!pc) return;

    pc.getReceivers().forEach((receiver) => {
      if (receiver.track?.kind === "audio") {
        const stream = new MediaStream([receiver.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    });

    pc.ontrack = (event) => {
      if (event.track.kind === "audio") {
        const stream = new MediaStream([event.track]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch(() => {});
        }
      }
    };
  };

  /* ─── MUTE ─────────────────────────────────────────────── */
  const toggleMute = () => {
    const session = sessionRef.current;
    if (!session) return;
    const pc = (session.sessionDescriptionHandler as any)
      ?.peerConnection as RTCPeerConnection | undefined;
    if (!pc) return;
    pc.getSenders().forEach((s) => {
      if (s.track?.kind === "audio") s.track.enabled = isMuted;
    });
    setIsMuted(!isMuted);
  };

  /* ─── HOLD ─────────────────────────────────────────────── */
  const toggleHold = async () => {
    const session = sessionRef.current;
    if (!session) return;
    const pc = (session.sessionDescriptionHandler as any)
      ?.peerConnection as RTCPeerConnection | undefined;
    if (!pc) return;
    if (!isHeld) {
      pc.getSenders().forEach((s) => {
        if (s.track) s.track.enabled = false;
      });
      setIsHeld(true);
      setStatus("on-hold");
    } else {
      pc.getSenders().forEach((s) => {
        if (s.track) s.track.enabled = true;
      });
      setIsHeld(false);
      setStatus("in-call");
    }
  };

  /* ─── DTMF ─────────────────────────────────────────────── */
  const sendDtmf = (tone: string) => {
    const session = sessionRef.current;
    if (!session || session.state !== SessionState.Established) return;
    try {
      const pc = (session.sessionDescriptionHandler as any)
        ?.peerConnection as RTCPeerConnection | undefined;
      if (!pc) return;
      pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === "audio" && (sender as any).dtmf) {
          (sender as any).dtmf.insertDTMF(tone, 100, 70);
        }
      });
    } catch (err) {
      console.error("DTMF error:", err);
    }
  };

  /* ─── TIMER ────────────────────────────────────────────── */
  const startCallTimer = () => {
    setCallTimer(0);
    callTimerRef.current = setInterval(
      () => setCallTimer((p) => p + 1),
      1000
    );
  };

  const cleanupCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    confSessions.forEach((c) => {
      try {
        if (c.session.state === SessionState.Established) c.session.bye();
      } catch {}
    });
    setConfSessions([]);
    setCallTimer(0);
    setIsMuted(false);
    setIsHeld(false);
    setIncomingCaller("");
    setShowDtmf(false);
    setCurrentCallNumber("");
    setActiveTab("dialpad");
    setIsTransferring(false);
    setTransferNumber("");
    setConfNumber("");
    setIsAddingParty(false);
    setCallerIdInfo(null);
    setCallerIdLoading(false);
    setShowCallerDetail(false);
    sessionRef.current = null;
    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const formatLogTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const handleKeyPress = (tone: string) => {
    if (status === "in-call" || status === "on-hold") sendDtmf(tone);
    setDialNumber((prev) => prev + tone);
  };

  const getStatusColor = () => {
    switch (status) {
      case "registered":
        return "bg-emerald-500";
      case "connecting":
        return "bg-amber-500";
      case "ringing-out":
        return "bg-blue-500";
      case "ringing-in":
        return "bg-orange-500";
      case "in-call":
        return "bg-emerald-500";
      case "on-hold":
        return "bg-amber-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  const getStatusBg = () => {
    switch (status) {
      case "in-call":
        return "bg-gradient-to-r from-emerald-600 to-teal-600";
      case "on-hold":
        return "bg-gradient-to-r from-amber-500 to-orange-500";
      case "ringing-in":
        return "bg-gradient-to-r from-orange-500 to-red-500";
      case "ringing-out":
        return "bg-gradient-to-r from-blue-500 to-indigo-500";
      default:
        return "bg-gradient-to-r from-slate-800 to-slate-900";
    }
  };

  const isInCall =
    status === "in-call" ||
    status === "on-hold" ||
    status === "ringing-out";

  /* ═══════════════════════════════════════════════════════════
     RENDER: FAB Button (closed)
     ═══════════════════════════════════════════════════════════ */
  if (!isOpen) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className={`group relative flex items-center gap-2 px-4 py-3 rounded-full shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 ${
            status === "registered" || status === "in-call"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white"
              : status === "ringing-in"
              ? "bg-gradient-to-r from-orange-500 to-red-500 text-white animate-bounce"
              : "bg-gradient-to-r from-slate-600 to-slate-700 text-white"
          }`}
        >
          <Phone className="h-5 w-5" />
          <span className="text-sm font-semibold">
            {isInCall
              ? formatTime(callTimer)
              : status === "ringing-in"
              ? "Incoming!"
              : "Phone"}
          </span>
          <span
            className={`absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full ${getStatusColor()} border-2 border-white`}
          />
          {status === "ringing-in" && (
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-orange-500 animate-ping" />
          )}
        </button>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER: Minimized bar (during call)
     ═══════════════════════════════════════════════════════════ */
  if (isMinimized && isInCall) {
    return (
      <div className="fixed bottom-5 right-5 z-50">
        <div
          className={`${getStatusBg()} text-white rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3 min-w-[300px]`}
        >
          <span className="h-2.5 w-2.5 rounded-full bg-white/60 animate-pulse" />
          <span className="text-sm font-medium flex-1 truncate">
            {callerIdInfo?.customerName || currentCallNumber || statusText}
          </span>
          {callerIdInfo?.customerName && (
            <span className="text-[10px] opacity-70 truncate max-w-[80px]">
              {currentCallNumber}
            </span>
          )}
          <span className="text-xs font-mono opacity-80">
            {formatTime(callTimer)}
          </span>
          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4 text-red-300" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={hangUp}
            className="p-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
          >
            <PhoneOff className="h-4 w-4" />
          </button>
          <button
            onClick={() => setIsMinimized(false)}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════════════════
     RENDER: Full Phone UI
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 w-[340px] overflow-hidden backdrop-blur-sm">
        {/* ── HEADER ── */}
        <div
          className={`${getStatusBg()} px-4 py-3 flex items-center justify-between`}
        >
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <Phone className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-white leading-tight">
                Softphone
              </p>
              <p className="text-[10px] text-white/70 leading-tight">
                {credentials?.displayName ||
                  credentials?.sipExtension ||
                  ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span
              className={`h-2 w-2 rounded-full ${getStatusColor()} ${
                status === "connecting" ? "animate-pulse" : ""
              }`}
            />
            {isInCall && (
              <button
                onClick={() => setIsMinimized(true)}
                className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                title="Minimize"
              >
                <Minimize2 className="h-3.5 w-3.5 text-white" />
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>

        {/* ── STATUS BAR ── */}
        {isInCall && (
          <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <div className="px-4 py-2 flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${
                  isHeld ? "bg-amber-500" : "bg-emerald-500"
                } animate-pulse`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 block truncate">
                  {callerIdInfo?.customerName
                    ? `${callerIdInfo.customerName}`
                    : statusText}
                </span>
                {callerIdInfo?.customerName && (
                  <span className="text-[10px] text-gray-400 font-mono">{currentCallNumber}</span>
                )}
              </div>
              <span className="text-xs font-mono text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {formatTime(callTimer)}
              </span>
              {callerIdInfo?.found && (
                <button
                  onClick={() => setShowCallerDetail(!showCallerDetail)}
                  className={`p-1 rounded-md transition-colors ${
                    showCallerDetail
                      ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                      : "text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                  title="Customer Info"
                >
                  <User className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {/* Caller ID Detail Panel */}
            {showCallerDetail && callerIdInfo?.found && (
              <div className="px-4 pb-2 space-y-1.5 border-t border-gray-100 dark:border-gray-700 pt-2">
                {callerIdInfo.customerEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="text-[11px] text-gray-600 dark:text-gray-300 truncate">{callerIdInfo.customerEmail}</span>
                  </div>
                )}
                {callerIdInfo.bookings.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Ticket className="h-2.5 w-2.5" /> Recent Bookings
                    </p>
                    {callerIdInfo.bookings.slice(0, 3).map((b, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-purple-50/50 dark:bg-purple-900/10 rounded-md">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-200 block truncate">
                            {b.confirmationCode} · {b.airline || "N/A"}
                          </span>
                          <span className="text-[9px] text-gray-400">
                            {b.type} · {b.status} · {b.consultant || ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {callerIdInfo.recentCalls.length > 0 && (
                  <div className="space-y-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" /> Call History
                    </p>
                    {callerIdInfo.recentCalls.slice(0, 3).map((c, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-md">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-semibold text-gray-700 dark:text-gray-200 block truncate">
                            {c.agent} · {c.status} · {c.duration}
                          </span>
                          <span className="text-[9px] text-gray-400 truncate block">
                            {c.notes?.slice(0, 50)}{c.notes && c.notes.length > 50 ? "..." : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── NO CREDENTIALS ── */}
        {credError && (
          <div className="p-6 text-center">
            <div className="h-14 w-14 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
              <WifiOff className="h-7 w-7 text-gray-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {credError}
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Ask admin to configure your SIP extension.
            </p>
            <button
              onClick={fetchCredentials}
              className="text-indigo-500 hover:text-indigo-600 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── MAIN CONTENT ── */}
        {credentials && !credError && (
          <>
            {/* DISCONNECTED / ERROR */}
            {(status === "disconnected" || status === "error") && (
              <div className="p-6 text-center">
                <div className="h-14 w-14 mx-auto bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-3">
                  <Wifi className="h-7 w-7 text-indigo-400" />
                </div>
                <p className="text-xs text-gray-500 mb-1">
                  Extension {credentials.sipExtension}
                </p>
                <p className="text-[11px] text-gray-400 mb-4">
                  {credentials.sipDomain}
                </p>
                {status === "error" && (
                  <p className="text-xs text-red-500 mb-3 px-4">
                    {statusText}
                  </p>
                )}
                <button
                  onClick={connectSip}
                  className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
                >
                  <Wifi className="h-4 w-4" />
                  Go Online
                </button>
              </div>
            )}

            {/* CONNECTING */}
            {status === "connecting" && (
              <div className="p-8 text-center">
                <Loader2 className="h-10 w-10 text-indigo-500 mx-auto mb-3 animate-spin" />
                <p className="text-sm text-gray-500">Connecting...</p>
              </div>
            )}

            {/* INCOMING CALL */}
            {status === "ringing-in" && (
              <div className="p-5">
                <div className="text-center mb-5">
                  <div className="h-20 w-20 mx-auto bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-full flex items-center justify-center mb-3 animate-pulse shadow-lg shadow-orange-200">
                    <PhoneIncoming className="h-9 w-9 text-orange-500" />
                  </div>
                  <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {callerIdInfo?.customerName || incomingCaller}
                  </p>
                  {callerIdInfo?.customerName && (
                    <p className="text-sm font-mono text-gray-500 mt-0.5">
                      {incomingCaller}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {callerIdLoading ? "Looking up..." : "Incoming call..."}
                  </p>
                  {/* Caller ID Quick Info */}
                  {callerIdInfo?.found && (
                    <div className="mt-3 space-y-1.5 text-left">
                      {callerIdInfo.customerEmail && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                          <Mail className="h-3 w-3 text-blue-500 flex-shrink-0" />
                          <span className="text-[11px] text-blue-700 dark:text-blue-300 truncate">{callerIdInfo.customerEmail}</span>
                        </div>
                      )}
                      {callerIdInfo.totalBookings > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                          <Ticket className="h-3 w-3 text-purple-500 flex-shrink-0" />
                          <span className="text-[11px] text-purple-700 dark:text-purple-300">{callerIdInfo.totalBookings} booking{callerIdInfo.totalBookings > 1 ? "s" : ""} found</span>
                        </div>
                      )}
                      {callerIdInfo.totalCalls > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                          <PhoneCall className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-300">{callerIdInfo.totalCalls} previous call{callerIdInfo.totalCalls > 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={rejectCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 transition-all shadow-md"
                  >
                    <PhoneOff className="h-5 w-5" />
                    Decline
                  </button>
                  <button
                    onClick={answerCall}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-all shadow-md animate-pulse"
                  >
                    <PhoneCall className="h-5 w-5" />
                    Answer
                  </button>
                </div>
              </div>
            )}

            {/* ═══ IN-CALL UI ═══ */}
            {isInCall && (
              <div className="flex flex-col">
                {/* Call action tabs */}
                <div className="flex border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                  {(
                    [
                      {
                        id: "dialpad" as const,
                        icon: Hash,
                        label: "Keypad",
                      },
                      {
                        id: "transfer" as const,
                        icon: ArrowRightLeft,
                        label: "Transfer",
                      },
                      {
                        id: "conference" as const,
                        icon: Users,
                        label: "Conference",
                      },
                    ] as const
                  ).map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-colors border-b-2 ${
                        activeTab === tab.id
                          ? "text-indigo-600 dark:text-indigo-400 border-indigo-500 bg-white dark:bg-gray-900"
                          : "text-gray-400 border-transparent hover:text-gray-600"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="p-3">
                  {/* KEYPAD TAB */}
                  {activeTab === "dialpad" && (
                    <>
                      {/* Main call controls */}
                      <div className="grid grid-cols-5 gap-2 mb-3">
                        <button
                          onClick={toggleMute}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                            isMuted
                              ? "bg-red-100 dark:bg-red-900/30 text-red-600 ring-1 ring-red-200"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {isMuted ? (
                            <MicOff className="h-4 w-4" />
                          ) : (
                            <Mic className="h-4 w-4" />
                          )}
                          {isMuted ? "Unmute" : "Mute"}
                        </button>
                        <button
                          onClick={toggleHold}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                            isHeld
                              ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 ring-1 ring-amber-200"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {isHeld ? (
                            <Play className="h-4 w-4" />
                          ) : (
                            <Pause className="h-4 w-4" />
                          )}
                          {isHeld ? "Resume" : "Hold"}
                        </button>
                        <button
                          onClick={() => setShowVolume(!showVolume)}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                            showVolume
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          <Volume2 className="h-4 w-4" />
                          Vol
                        </button>
                        <button
                          onClick={() => setShowDtmf(!showDtmf)}
                          className={`flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold transition-all ${
                            showDtmf
                              ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          <Hash className="h-4 w-4" />
                          DTMF
                        </button>
                        <button
                          onClick={hangUp}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-xl text-[10px] font-semibold bg-red-500 text-white hover:bg-red-600 transition-all shadow-sm"
                        >
                          <PhoneOff className="h-4 w-4" />
                          End
                        </button>
                      </div>

                      {/* Volume slider */}
                      {showVolume && (
                        <div className="flex items-center gap-3 mb-3 px-1 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                          <VolumeX className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) =>
                              setVolume(Number(e.target.value))
                            }
                            className="flex-1 h-1.5 rounded-full accent-indigo-500"
                          />
                          <Volume2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-[10px] text-gray-500 w-8 text-right">
                            {volume}%
                          </span>
                        </div>
                      )}

                      {/* DTMF Pad */}
                      {showDtmf && (
                        <div className="grid grid-cols-3 gap-1.5 mb-3">
                          {DTMF_TONES.flat().map((tone) => (
                            <button
                              key={tone}
                              onClick={() => sendDtmf(tone)}
                              className="py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 active:bg-indigo-100 transition-colors"
                            >
                              {tone}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Conference participants list */}
                      {confSessions.length > 0 && (
                        <div className="mb-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                          <p className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Users className="h-3 w-3" /> Conference (
                            {confSessions.length + 1} parties)
                          </p>
                          {confSessions.map((c, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between py-1"
                            >
                              <span className="text-xs text-gray-700 dark:text-gray-300 font-mono">
                                {c.number}
                              </span>
                              <button
                                onClick={() =>
                                  removeFromConference(i)
                                }
                                className="text-[10px] text-red-500 hover:text-red-600 font-semibold"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {/* TRANSFER TAB */}
                  {activeTab === "transfer" && (
                    <div className="space-y-3">
                      <div className="flex gap-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                        <button
                          onClick={() => setTransferType("blind")}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            transferType === "blind"
                              ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                              : "text-gray-500"
                          }`}
                        >
                          Blind Transfer
                        </button>
                        <button
                          onClick={() => setTransferType("attended")}
                          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                            transferType === "attended"
                              ? "bg-white dark:bg-gray-700 text-indigo-600 shadow-sm"
                              : "text-gray-500"
                          }`}
                        >
                          Attended Transfer
                        </button>
                      </div>

                      <div className="text-center py-1">
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          {transferType === "blind"
                            ? "Instantly transfers the call. You will be disconnected."
                            : "Talk to the target first, then complete the transfer."}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={transferNumber}
                          onChange={(e) =>
                            setTransferNumber(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              transferType === "blind"
                                ? blindTransfer()
                                : attendedTransfer();
                          }}
                          placeholder="Enter ext or number..."
                          className="flex-1 px-3 py-2.5 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <button
                        onClick={
                          transferType === "blind"
                            ? blindTransfer
                            : attendedTransfer
                        }
                        disabled={
                          !transferNumber.trim() || isTransferring
                        }
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                      >
                        {isTransferring ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />{" "}
                            Transferring...
                          </>
                        ) : (
                          <>
                            <PhoneForwarded className="h-4 w-4" />{" "}
                            {transferType === "blind"
                              ? "Blind Transfer"
                              : "Consult & Transfer"}
                          </>
                        )}
                      </button>

                      {/* Quick transfer to extensions */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Quick Transfer
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            "101",
                            "102",
                            "103",
                            "104",
                            "105",
                            "106",
                            "107",
                            "108",
                            "109",
                            "110",
                          ].map((ext) => (
                            <button
                              key={ext}
                              onClick={() =>
                                setTransferNumber(ext)
                              }
                              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                                transferNumber === ext
                                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 ring-1 ring-indigo-300"
                                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              {ext}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* CONFERENCE TAB */}
                  {activeTab === "conference" && (
                    <div className="space-y-3">
                      <div className="text-center py-1">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 dark:bg-purple-900/20 rounded-full">
                          <Users className="h-3.5 w-3.5 text-purple-500" />
                          <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
                            {confSessions.length + 1}{" "}
                            {confSessions.length === 0
                              ? "Party"
                              : "Parties"}{" "}
                            on call
                          </span>
                        </div>
                      </div>

                      {/* Current participants */}
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                          <span className="h-2 w-2 rounded-full bg-emerald-500" />
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1">
                            {currentCallNumber || "Main Call"}
                          </span>
                          <span className="text-[10px] text-emerald-600 font-medium">
                            Active
                          </span>
                        </div>
                        {confSessions.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-xl"
                          >
                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 flex-1 font-mono">
                              {c.number}
                            </span>
                            <button
                              onClick={() =>
                                removeFromConference(i)
                              }
                              className="text-[10px] text-red-500 hover:text-red-600 font-bold px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-md"
                            >
                              Drop
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add party */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={confNumber}
                          onChange={(e) =>
                            setConfNumber(e.target.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              addToConference();
                          }}
                          placeholder="Add ext or number..."
                          className="flex-1 px-3 py-2.5 text-sm font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800 dark:text-gray-100"
                        />
                      </div>

                      <button
                        onClick={addToConference}
                        disabled={
                          !confNumber.trim() || isAddingParty
                        }
                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-purple-600 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                      >
                        {isAddingParty ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />{" "}
                            Calling...
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-4 w-4" /> Add to
                            Conference
                          </>
                        )}
                      </button>

                      {/* Quick add extensions */}
                      <div>
                        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                          Quick Add
                        </p>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            "101",
                            "102",
                            "103",
                            "104",
                            "105",
                            "106",
                            "107",
                            "108",
                            "109",
                            "110",
                          ].map((ext) => (
                            <button
                              key={ext}
                              onClick={() =>
                                setConfNumber(ext)
                              }
                              disabled={confSessions.some(
                                (c) => c.number === ext
                              )}
                              className={`py-2 rounded-lg text-xs font-semibold transition-colors ${
                                confSessions.some(
                                  (c) => c.number === ext
                                )
                                  ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                                  : confNumber === ext
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 ring-1 ring-purple-300"
                                  : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                              }`}
                            >
                              {ext}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ═══ IDLE / DIAL PAD ═══ */}
            {status === "registered" && (
              <div className="px-4 py-3">
                {/* Number input */}
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="text"
                    value={dialNumber}
                    onChange={(e) => setDialNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && dialNumber.trim())
                        makeCall();
                    }}
                    placeholder="Enter number..."
                    className="flex-1 px-3 py-2.5 text-center text-lg font-mono bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-800 dark:text-gray-100 placeholder:text-gray-400"
                    autoFocus
                  />
                  {dialNumber && (
                    <button
                      onClick={() =>
                        setDialNumber((p) => p.slice(0, -1))
                      }
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Delete className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Dial pad */}
                <div className="grid grid-cols-3 gap-1.5">
                  {DTMF_TONES.flat().map((tone) => (
                    <button
                      key={tone}
                      onClick={() => handleKeyPress(tone)}
                      className="py-3 rounded-xl text-lg font-bold bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 active:scale-95 transition-all border border-gray-100 dark:border-gray-700"
                    >
                      {tone}
                    </button>
                  ))}
                </div>

                {/* Call + Disconnect */}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => makeCall()}
                    disabled={!dialNumber.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-sm font-bold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                  >
                    <PhoneCall className="h-5 w-5" />
                    Call
                  </button>
                  <button
                    onClick={disconnectSip}
                    className="px-4 py-3 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="Go Offline"
                  >
                    <WifiOff className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* ═══ CALL LOGS ═══ */}
            {status === "registered" && callLogs.length > 0 && (
              <div className="border-t border-gray-100 dark:border-gray-700">
                <div className="px-4 py-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Recent Calls
                  </p>
                  <button
                    onClick={() => {
                      setCallLogs([]);
                      localStorage.removeItem("crm_call_logs");
                    }}
                    className="text-[10px] text-gray-400 hover:text-red-500"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-32 overflow-y-auto">
                  {callLogs.slice(0, 8).map((log, i) => (
                    <button
                      key={i}
                      onClick={() => makeCall(log.number)}
                      className="w-full px-4 py-2 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left group"
                    >
                      {log.type === "outbound" ? (
                        <PhoneOutgoing className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                      ) : log.type === "inbound" ? (
                        <PhoneIncoming className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                      ) : (
                        <PhoneOff className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        {log.name && (
                          <p className="text-xs font-semibold text-gray-800 dark:text-gray-100 truncate group-hover:text-indigo-600">
                            {log.name}
                          </p>
                        )}
                        <p className={`text-xs font-mono text-gray-${log.name ? '400' : '700'} dark:text-gray-${log.name ? '400' : '200'} truncate ${!log.name ? 'group-hover:text-indigo-600' : ''}`}>
                          {log.number}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          {formatLogTime(log.time)} ·{" "}
                          {log.duration > 0
                            ? formatTime(log.duration)
                            : "—"}
                        </p>
                      </div>
                      <PhoneCall className="h-3.5 w-3.5 text-gray-300 group-hover:text-emerald-500 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── FOOTER ── */}
        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 flex items-center justify-between">
          <p className="text-[10px] text-gray-400 font-medium">
            {credentials
              ? `${
                  credentials.displayName || credentials.sipExtension
                } · ${credentials.sipDomain}`
              : "Not configured"}
          </p>
          <span
            className={`h-2 w-2 rounded-full ${getStatusColor()}`}
          />
        </div>
      </div>
    </div>
  );
};

export default SipPhone;
