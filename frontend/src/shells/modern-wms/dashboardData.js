// frontend/src/dashboardData.js

export const WMS_COUNTERS = [
  {
    id: "new-orders",
    title: "New Orders",
    value: 1200,
    badge: "Unreleased",
    badgeColor: "bg-amber-100 text-amber-800",
    iconName: "Inbox",
    color: "border-l-4 border-amber-500 bg-amber-50/40",
  },
  {
    id: "ready-to-pick",
    title: "Pick Queue",
    value: 800,
    badge: "Ready to Pick",
    badgeColor: "bg-blue-100 text-blue-800",
    iconName: "CheckSquare",
    color: "border-l-4 border-blue-500 bg-blue-50/40",
  },
  {
    id: "packing-station",
    title: "Packing Station",
    value: 140,
    badge: "In Progress",
    badgeColor: "bg-purple-100 text-purple-800",
    iconName: "Box",
    color: "border-l-4 border-purple-500 bg-purple-50/40",
  },
  {
    id: "shipped-today",
    title: "Shipped Today",
    value: 1240,
    badge: "SLA Met",
    badgeColor: "bg-green-100 text-green-800",
    iconName: "Truck",
    color: "border-l-4 border-green-500 bg-green-50/40",
  },
  {
    id: "late-orders",
    title: "Late / At-Risk",
    value: 20,
    badge: "Action Required",
    badgeColor: "bg-red-100 text-red-800",
    iconName: "AlertTriangle",
    color: "border-l-4 border-red-500 bg-red-50/40",
  },
];

export const THROUGHPUT_HOURLY = [
  {
    hour: "08:00",
    picked: 3200,
    packed: 2400,
    pickPercent: "40%",
    packPercent: "30%",
  },
  {
    hour: "10:00",
    picked: 5800,
    packed: 4500,
    pickPercent: "72.5%",
    packPercent: "56.25%",
  },
  {
    hour: "12:00",
    picked: 8000,
    packed: 7800,
    pickPercent: "100%",
    packPercent: "97.5%",
  },
  {
    hour: "14:00",
    picked: 4500,
    packed: 5000,
    pickPercent: "56.25%",
    packPercent: "62.5%",
  },
  {
    hour: "16:00",
    picked: 6200,
    packed: 5500,
    pickPercent: "77.5%",
    packPercent: "68.75%",
  },
  {
    hour: "18:00",
    picked: 1500,
    packed: 2000,
    pickPercent: "18.75%",
    packPercent: "25%",
  },
];

export const CARRIER_DISTRIBUTION = [
  {
    carrier: "USPS",
    percentage: 45,
    color: "bg-blue-600",
    text: "text-blue-600",
  },
  {
    carrier: "UPS",
    percentage: 35,
    color: "bg-amber-500",
    text: "text-amber-500",
  },
  {
    carrier: "FedEx",
    percentage: 15,
    color: "bg-purple-600",
    text: "text-purple-600",
  },
  {
    carrier: "DHL Express",
    percentage: 5,
    color: "bg-yellow-500",
    text: "text-yellow-500",
  },
];

export const LIVE_ACTIVITY_FEED = [
  {
    id: 1,
    time: "18:32",
    text: "Label generated for Order #1042 (USPS Priority)",
    type: "shipping",
  },
  {
    id: 2,
    time: "18:28",
    text: "Pick List #109 completed (18 items) by Picker Sarah M.",
    type: "pick",
  },
  {
    id: 3,
    time: "18:15",
    text: "Order #1039 packed & verified at Station 2",
    type: "pack",
  },
  {
    id: 4,
    time: "17:59",
    text: "Inventory sync complete for Location: Unishippers",
    type: "system",
  },
  {
    id: 5,
    time: "17:45",
    text: "Carrier pickup scan completed by UPS ground driver",
    type: "shipping",
  },
  {
    id: 6,
    time: "17:30",
    text: "2 late orders flagged for priority pick routing",
    type: "alert",
  },
];
