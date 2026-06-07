// This file defines the specific aesthetic constants for the "Modern WMS" template.
// These align directly with the custom Tailwind classes we set up earlier.

export const themeConfig = {
  colors: {
    // The classic dark teal navigation bar
    headerBg: "bg-header-blue",
    headerText: "text-white",

    // The light grey application background
    appBg: "bg-gray-50",

    // The carrier settings card and table styling
    cardBg: "bg-white",
    tableHeaderBg: "bg-table-header",
    tableHeaderText: "text-gray-600",

    // Primary actions (like the Connect button)
    primaryButtonBg: "bg-link-blue",
    primaryButtonText: "text-white",
    primaryButtonHover: "hover:bg-blue-800",
  },
  layout: {
    // Defines how much padding and max-width the main content area has
    containerClasses: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8",
  },
};
