import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Button } from "../components/ui/button";
import TravelConsultantForm from "../components/forms/TravelConsultantForm";
import Overview from "./Overview";
import SalesOverview from "../components/SalesOverview";
import Sidebar from "../components/Sidebar";
import Consultants from "./Consultants";
import { Menu, X, Clock, User, StickyNote } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/use-auth";
import TicketRequest from "./TicketRequest";
import Submission from "./Submissions";
import MySale from "./mySale";
import APIBooking from "./APIBooking";
import { Bell } from "lucide-react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Notes from "./Notes";

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
  Desc?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] =
    useState<boolean>(false);
  const [isNotesOpen, setIsNotesOpen] = useState<boolean>(false);
  const [pendingRequests, setPendingRequests] = useState<TicketRequest[]>([]);

  // Check if we're on the dashboard overview page
  const isDashboardOverview =
    location.pathname === "/dashboard" ||
    location.pathname === "/dashboard/" ||
    location.pathname === "/dashboard/overview";

  // Play custom notification sound
  const showSynchronizedNotifications = (
    newRequests: TicketRequest[]
  ): void => {
    newRequests.forEach((request, index) => {
      setTimeout(() => {
        // Play sound first
        const audio = new Audio("/sounds/notification.mp3");
        audio.currentTime = 0;
        audio.play().catch((error) => {
          console.log("Audio play failed:", error);
        });

        // Show toast immediately after sound starts
        setTimeout(() => {
          toast.info(
            `${request.consultant} has submitted a ${request.requestFor} request for the ${request.ticketType}`,
            {
              position: "top-right",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              onClick: () => {
                setIsNotificationPanelOpen(true);
              },
            }
          );
        }, 100);
      }, index * 1000);
    });
  };

  // Get stored notifications from localStorage
  const getStoredNotifications = (): string[] => {
    try {
      const stored = localStorage.getItem(
        `notified_requests_${user?.userName}`
      );
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  // Save notified request IDs to localStorage
  const saveNotifiedRequests = (requestIds: string[]): void => {
    try {
      localStorage.setItem(
        `notified_requests_${user?.userName}`,
        JSON.stringify(requestIds)
      );
    } catch (error) {
      console.error("Failed to save to localStorage:", error);
    }
  };

  //EST time zone
  const formatDate = (dateString: string): string => {
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

  useEffect(() => {
    if (!isDashboardOverview) {
      return;
    }

    if (user?.role === "travel") {
      return;
    }

    let isMounted = true;

    const fetchTicketRequests = async (): Promise<void> => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/ticket-requests`,
          {
            withCredentials: true,
          }
        );

        if (!isMounted) return;

        const userTickets = response.data.filter((ticket: TicketRequest) => {
          return ticket.status === "Pending";
        });

        // Get previously notified request IDs
        const storedNotifiedIds = getStoredNotifications();
        const newRequests = userTickets.filter(
          (ticket: TicketRequest) => !storedNotifiedIds.includes(ticket._id)
        );

        if (newRequests.length > 0) {
          const allCurrentIds = userTickets.map(
            (ticket: TicketRequest) => ticket._id
          );
          saveNotifiedRequests(allCurrentIds);

          // Use the synchronized notification function
          showSynchronizedNotifications(newRequests);
        } else {
          const allCurrentIds = userTickets.map(
            (ticket: TicketRequest) => ticket._id
          );
          saveNotifiedRequests(allCurrentIds);
        }

        setPendingRequests(userTickets);
      } catch (err) {
        console.error("Fetch error:", err);
      }
    };

    // Initial fetch
    fetchTicketRequests();

    // Set up polling interval
    const interval = setInterval(() => {
      if (isMounted) {
        fetchTicketRequests();
      }
    }, 30000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isDashboardOverview, user]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleNotificationClick = (): void => {
    setIsNotificationPanelOpen(true);
  };

  const handleNotesClick = (): void => {
    setIsNotesOpen(true);
  };

  const handleViewRequest = (): void => {
    setIsNotificationPanelOpen(false);
    navigate("/dashboard/ticket-request");
  };

  const url = `https://myfaredeal.us/?email=${encodeURIComponent(
    user?.email || ""
  )}&name=${encodeURIComponent(user?.userName || "")}`;

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 transform transition-transform duration-200 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }
      `}
      >
        <Sidebar role={user.role} />
      </div>

      {/* Notification Panel Overlay */}
      {isNotificationPanelOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50"
          onClick={() => setIsNotificationPanelOpen(false)}
        />
      )}

      {/* Notification Slide Panel */}
      <div
        className={`
        fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-50
        ${isNotificationPanelOpen ? "translate-x-0" : "translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">
                Notifications ({pendingRequests.length})
              </h2>
            </div>
            <button
              onClick={() => setIsNotificationPanelOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-y-auto">
            {pendingRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Bell className="h-12 w-12 mb-4 text-gray-300" />
                <p className="text-lg font-medium">No pending requests</p>
                <p className="text-sm">All caught up!</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {pendingRequests.map((request) => (
                  <div
                    key={request._id}
                    className="bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={() => handleViewRequest()}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-gray-800">
                          {request.consultant}
                        </span>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        Pending
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 flex">
                      <p className="pr-2">
                        <strong>Request:</strong> {request.requestFor}
                      </p>
                      <p>
                        <strong>For:</strong> {request.ticketType}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 mt-3 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(request.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Panel Footer */}
          {pendingRequests.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => handleViewRequest()}
                className="w-full bg-black text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                View All Ticket Requests
              </button>
            </div>
          )}
        </div>
      </div>

      {/* NOTES */}

      <Notes
        isOpen={isNotesOpen}
        onClose={() => setIsNotesOpen(false)}
        userId={user?.userName || "default"}
      />

      <div className="flex-1 flex flex-col">
        <header className="h-16 border-b border-border bg-card">
          <div className="flex h-full items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-4">
                <img
                  src="/assets/img/farebulk_icon.svg"
                  alt="Farebulk Logo"
                  className="w-[2rem] h-20 object-contain"
                />

                <h1
                  className="text-xl font-bold text-foreground"
                  style={{ margin: "0px" }}
                >
                  Farebulk Portal
                </h1>
              </div>
            </div>

            {user.role === "travel" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleNotesClick}
                  className="relative focus:outline-none hover:bg-blue-200 bg-gray-300 p-2 rounded-full transition-colors"
                >
                  <StickyNote className="h-6 w-6 text-black" />
                </button>
                Notes
              </div>
            )}

            <div className="flex items-center gap-4">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-2 py-1 rounded-lg text-white font-semibold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-400 transition-all duration-300 shadow-lg"
              >
                Auth Form
              </a>

              {user.role !== "travel" && (
                <button
                  onClick={handleNotificationClick}
                  className="relative focus:outline-none hover:bg-gray-100 p-2 rounded-full transition-colors"
                >
                  <Bell className="h-6 w-6 text-gray-600" />
                  {pendingRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-semibold rounded-full px-1.5 min-w-[20px] h-5 flex items-center justify-center animate-pulse">
                      {pendingRequests.length}
                    </span>
                  )}
                </button>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {user.userName}
                </span>
                <div className="h-8 w-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-semibold">
                  {user.userName?.charAt(0).toUpperCase()}
                </div>
              </div>

              {/* Logout button */}
              <Button variant="ghost" onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/" element={<Navigate to="overview" replace />} />
            <Route path="overview" element={<Overview />} />
            <Route path="sales" element={<SalesOverview />} />
            <Route
              path="forms"
              element={
                <div className="space-y-6">
                  {user.role === "travel" && (
                    <div className="bg-card shadow sm:rounded-lg">
                      <div className="px-4 py-5 sm:p-6">
                        <h3 className="text-lg font-medium leading-6 text-foreground">
                          Create New Sale
                        </h3>
                        <div className="mt-2 max-w-xl text-sm text-muted-foreground">
                          <p>Please carefully fill out this form.</p>
                        </div>
                        <div className="mt-5">
                          <TravelConsultantForm user={user} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              }
            />
            <Route path="reports" element={<div>Comming Soon</div>} />
            <Route path="consultants" element={<Consultants />} />
            <Route path="settings" element={<div>Comming Soon</div>} />
            <Route
              path="my-sales"
              element={
                <div>
                  <MySale />
                </div>
              }
            />
            <Route path="ticket-request" element={<TicketRequest />} />
            <Route path="profile" element={<div>Comming Soon</div>} />
            <Route
              path="submissions"
              element={
                <div>
                  <Submission />
                </div>
              }
            />
            <Route
              path="APIBooking"
              element={
                <div>
                  <APIBooking />
                </div>
              }
            />
          </Routes>
        </main>
      </div>

      {/* Toast Container */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
        style={{ marginTop: "60px" }}
      />
    </div>
  );
};

export default Dashboard;
