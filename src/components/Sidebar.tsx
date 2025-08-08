import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import {
  LayoutDashboard,
  BarChart3,
  FileText,
  Users,
  Settings,
  ShoppingCart,
  User,
  ClipboardList,
  X,
  Plane,
} from "lucide-react";
import { Button } from "./ui/button";

interface SidebarProps {
  role: "admin" | "travel" | "ticket";
}

const Sidebar = ({ role }: SidebarProps) => {
  const location = useLocation();

  const adminMenu = [
    { name: "Dashboard", path: "/dashboard/overview", icon: LayoutDashboard },
    { name: "Sales Overview", path: "/dashboard/sales", icon: BarChart3 },
    { name: "Consultants", path: "/dashboard/consultants", icon: Users },
    { name: "Flight Bookings", path: "/dashboard/APIBooking", icon: Plane },
    { name: "Reports", path: "/dashboard/reports", icon: FileText },
    { name: "Settings", path: "/dashboard/settings", icon: Settings },
  ];

  const travelConsultantMenu = [
    { name: "Dashboard", path: "/dashboard/overview", icon: LayoutDashboard },
    { name: "Add Sale", path: "/dashboard/forms", icon: ShoppingCart },
    { name: "My Sales", path: "/dashboard/my-sales", icon: BarChart3 },
    {
      name: "My Submissions",
      path: "/dashboard/submissions",
      icon: ClipboardList,
    },
    // { name: 'Flight Bookings', path: '/dashboard/APIBooking', icon: Plane },
    { name: "Flight Bookings", path: "#", icon: Plane },
    { name: "My Profile", path: "/dashboard/profile", icon: User },
  ];

  const ticketConsultantMenu = [
    { name: "Dashboard", path: "/dashboard/overview", icon: LayoutDashboard },
    {
      name: "Ticket Request",
      path: "/dashboard/ticket-request",
      icon: ShoppingCart,
    },
    { name: "My Sales", path: "/dashboard/my-sales", icon: BarChart3 },
    // { name: 'Flight Bookings', path: '/dashboard/APIBooking', icon: Plane },
    { name: "Flight Bookings", path: "#", icon: Plane },

    { name: "My Profile", path: "/dashboard/profile", icon: User },
  ];

  const menu =
    role === "admin"
      ? adminMenu
      : role === "travel"
      ? travelConsultantMenu
      : ticketConsultantMenu;

  return (
    <div className="w-64 h-screen bg-card border-r border-border">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            {role === "admin"
              ? "Admin Dashboard"
              : role === "travel"
              ? "Travel Consultant"
              : "Ticket Consultant"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => {
              const event = new CustomEvent("toggleSidebar");
              window.dispatchEvent(event);
            }}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-2 mt-6">
          {menu.map((item) => {
            const Icon = item.icon;
            const needsUpgrade = (() => {
              if (role === "admin") return false; // admin sees everything

              if (role === "ticket") {
                // Only block certain menus for ticket consultants
                return [
                  "Flight Bookings",
                  "My Profile",
                  "My Submissions",
                ].includes(item.name);
              }

              if (role === "travel") {
                // Block more menus for travel consultants
                return [
                  "Flight Bookings",
                  "My Profile",
                  "My Submissions",
                  "My Sales",
                ].includes(item.name);
              }

              return false;
            })();

            const baseClasses = cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              location.pathname === item.path
                ? "bg-[#9B87F5] text-white"
                : "text-muted-foreground hover:bg-[#9B87F5]/10 hover:text-[#9B87F5]"
            );
            return (
              <div key={item.name} className="relative group">
                {needsUpgrade ? (
                  // render non-clickable element for disabled menu
                  <div
                    className={cn(baseClasses, "opacity-50 cursor-not-allowed")}
                    aria-disabled="true"
                    role="button"
                    tabIndex={-1}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </div>
                ) : (
                  // regular link for enabled items
                  <Link to={item.path} className={baseClasses}>
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )}

                {needsUpgrade && (
                  <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 text-xs font-medium bg-gray-800 text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap">
                    Upgrade Pro
                    {/* Arrow pointing up toward the menu */}
                    <span className="absolute left-1/2 -translate-x-1/2 -top-2 border-4 border-transparent border-b-gray-800"></span>
                  </span>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
