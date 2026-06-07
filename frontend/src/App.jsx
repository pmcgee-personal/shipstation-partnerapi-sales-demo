import React, { useState } from "react";
import DemoBar from "./components/DemoBar";

// In Phase 1, we hardcode the Modern WMS shell.
// Later, this will read from process.env.VITE_SHELL dynamically.
import ModernWmsLayout from "./shells/modern-wms/Layout";

function App() {
  // This state controls which demo account the sales rep is actively demonstrating.
  // We lift this state up to the very top so both the DemoBar and the Shell can access it.
  const [activeAccountId, setActiveAccountId] = useState(null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* 1. The Global Sales Demo Control Bar (Fixed above everything) */}
      <DemoBar
        activeAccountId={activeAccountId}
        setActiveAccountId={setActiveAccountId}
      />

      {/* 2. The Active Template Shell (The "Mock" Software) */}
      <div className="flex-1">
        <ModernWmsLayout activeAccountId={activeAccountId} />
      </div>
    </div>
  );
}

export default App;
