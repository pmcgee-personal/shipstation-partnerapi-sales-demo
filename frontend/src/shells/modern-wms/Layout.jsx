import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  Settings,
  Settings2,
  Users,
  MapPin,
} from "lucide-react";

import { themeConfig } from "./themeConfig";
import CarrierSettings from "./CarrierSettings";
import LocationsPage from "./LocationsPage";
import DashboardPage from "./DashboardPage"; // <-- Added our new import

export default function Layout({ activeAccountId }) {
  const [activePage, setActivePage] = useState(() => {
    // Check if we specifically flagged a return from the Carrier Portal
    const isReturningFromAuth = localStorage.getItem(
      "ss_return_from_carrier_flow",
    );

    if (isReturningFromAuth) {
      // Clear the breadcrumb so a normal page refresh tomorrow goes back to Dashboard
      localStorage.removeItem("ss_return_from_carrier_flow");
      return "carrier-settings";
    }

    // Default to dashboard for all standard page loads
    return "dashboard";
  });

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package, disabled: true },
    { id: "shipping", label: "Shipping", icon: Truck, disabled: true },
    { id: "locations", label: "Locations", icon: MapPin },
    { id: "settings", label: "Carrier Settings", icon: Settings },
  ];

  return (
    <div className="flex h-[calc(100vh-38px)] overflow-hidden bg-gray-50">
      {/* 1. Left Sidebar Navigation */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between">
        <div className="p-4 flex-1">
          {/* Mock App Brand */}
          <div className="flex items-center space-x-2 text-white font-bold text-lg mb-8 tracking-wide px-2">
            <Settings2 className="text-blue-400" />
            <span>ApexWMS</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePage === item.id ||
                (item.id === "settings" && activePage === "carrier-settings");

              return (
                <button
                  key={item.id}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.id === "settings") {
                      setActivePage("carrier-settings");
                    } else {
                      setActivePage(item.id);
                    }
                  }}
                  className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                    item.disabled
                      ? "text-slate-600 cursor-not-allowed"
                      : isActive
                        ? "bg-blue-600 text-white"
                        : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer of Sidebar */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center space-x-2">
          <Users size={14} />
          <span>Demo Session</span>
        </div>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Dark Teal Application Header */}
        <header
          className={`${themeConfig.colors.headerBg} ${themeConfig.colors.headerText} py-4 px-8 shadow-sm flex items-center justify-between`}
        >
          <div>
            <h1 className="text-lg font-semibold tracking-wide"></h1>
            <p className="text-xs text-slate-300">Environment: Sandbox</p>
          </div>
        </header>

        {/* Main Section Content Wrapper */}
        <main className={themeConfig.layout.containerClasses}>
          {/* Conditional rendering for our pages */}
          {/* --> Updated to render our new page component <-- */}
          {activePage === "dashboard" && <DashboardPage />}
          {activePage === "locations" && (
            <LocationsPage activeAccountId={activeAccountId} />
          )}
          {activePage === "carrier-settings" && (
            <CarrierSettings activeAccountId={activeAccountId} />
          )}
        </main>
      </div>
    </div>
  );
}
