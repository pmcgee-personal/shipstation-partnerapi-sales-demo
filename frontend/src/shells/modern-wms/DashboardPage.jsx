// frontend/src/DashboardPage.jsx
import React from "react";
import {
  Inbox,
  CheckSquare,
  Box,
  Truck,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart,
  Clock,
} from "lucide-react";
import {
  WMS_COUNTERS,
  THROUGHPUT_HOURLY,
  CARRIER_DISTRIBUTION,
  LIVE_ACTIVITY_FEED,
} from "./dashboardData";

// Map icon names from our data file to the actual Lucide components
const IconMap = {
  Inbox,
  CheckSquare,
  Box,
  Truck,
  AlertTriangle,
};

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Global Warehouse Dashboard
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Live Warehouse Performance Metrics & Activity at a Glance
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-200">
          <Activity className="w-4 h-4 animate-pulse" />
          <span className="font-medium">Live Systems Normal</span>
        </div>
      </div>

      {/* KPI Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {WMS_COUNTERS.map((counter) => {
          const IconComponent = IconMap[counter.iconName];
          return (
            <div
              key={counter.id}
              className={`rounded-xl p-5 shadow-sm bg-white ${counter.color}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">
                    {counter.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {counter.value}
                  </p>
                </div>
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  {IconComponent && (
                    <IconComponent className="w-5 h-5 text-gray-600" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${counter.badgeColor}`}
                >
                  {counter.badge}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid: Charts & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Left Column (Spans 2): Charts */}
        <div className="lg:col-span-2 space-y-6">
          {/* Throughput Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <BarChart3 className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Picking vs. Packing Throughput
              </h2>
            </div>

            {/* Custom CSS Bar Chart */}
            <div className="relative h-64 flex items-end space-x-2 md:space-x-6 border-b border-l border-gray-100 pb-2 pl-2">
              {THROUGHPUT_HOURLY.map((data, idx) => (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group"
                >
                  <div className="flex items-end justify-center space-x-1 w-full h-full relative">
                    {/* Picked Bar */}
                    <div
                      style={{ height: data.pickPercent }}
                      className="w-1/3 bg-blue-500 rounded-t-sm hover:opacity-80 transition-opacity relative"
                      title={`Picked: ${data.picked}`}
                    ></div>
                    {/* Packed Bar */}
                    <div
                      style={{ height: data.packPercent }}
                      className="w-1/3 bg-purple-500 rounded-t-sm hover:opacity-80 transition-opacity relative"
                      title={`Packed: ${data.packed}`}
                    ></div>
                  </div>
                  <span className="text-xs text-gray-500 mt-3 font-mono">
                    {data.hour}
                  </span>
                </div>
              ))}
            </div>
            {/* Chart Legend */}
            <div className="flex justify-center space-x-6 mt-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Items Picked</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-gray-600">Items Packed</span>
              </div>
            </div>
          </div>

          {/* Carrier Distribution Progress Bars */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <PieChart className="w-5 h-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">
                Carrier Utilization
              </h2>
            </div>
            <div className="space-y-5">
              {CARRIER_DISTRIBUTION.map((c, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">
                      {c.carrier}
                    </span>
                    <span className="font-bold text-gray-900">
                      {c.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className={`${c.color} h-full rounded-full`}
                      style={{ width: `${c.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (Spans 1): Live Activity Feed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
          <div className="flex items-center space-x-2 mb-6">
            <Clock className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">
              Live Floor Activity
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {LIVE_ACTIVITY_FEED.map((log) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
              >
                <div className="mt-0.5">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      log.type === "alert"
                        ? "bg-red-500"
                        : log.type === "shipping"
                          ? "bg-green-500"
                          : log.type === "system"
                            ? "bg-gray-400"
                            : "bg-blue-500"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-800">{log.text}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">
                    {log.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
              View All Logs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
