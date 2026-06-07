import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  Settings,
  Settings2,
  Users,
} from "lucide-react";
import { themeConfig } from "./themeConfig";
import CarrierSettings from "./CarrierSettings";

// Mock components for our sub-pages (we will build the real ones next!)
const DashboardPlaceholder = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
    <h2 className="text-xl font-bold text-gray-800 mb-2">WMS Dashboard</h2>
    <p className="text-gray-500">
      Welcome to Apex Warehouse Management System. Select Carrier Settings to
      get started.
    </p>
  </div>
);

export default function Layout({ activeAccountId }) {
  const [activePage, setActivePage] = useState("dashboard"); // 'dashboard' or 'carrier-settings'

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "inventory", label: "Inventory", icon: Package, disabled: true },
    { id: "shipping", label: "Shipping", icon: Truck, disabled: true },
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
        {/* Dark Teal Application Header (Matching your screenshot) */}
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
          {activePage === "dashboard" ? (
            <DashboardPlaceholder />
          ) : (
            <CarrierSettings activeAccountId={activeAccountId} />
          )}
        </main>
      </div>
    </div>
  );
}
