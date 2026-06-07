import React, { useState, useEffect } from "react";
import DemoBar from "./components/DemoBar";

// In Phase 1, we hardcode the Modern WMS shell.
// Later, this will read from process.env.VITE_SHELL dynamically.
import ModernWmsLayout from "./shells/modern-wms/Layout";

function App() {
  // 1. Initialize state directly from localStorage so it persists across redirects
  const [activeAccountId, setActiveAccountId] = useState(() => {
    return localStorage.getItem("ss_active_account_id") || null;
  });

  // 2. Keep localStorage in sync whenever the sales rep manually changes the account
  useEffect(() => {
    if (activeAccountId) {
      localStorage.setItem("ss_active_account_id", activeAccountId);
    } else {
      localStorage.removeItem("ss_active_account_id");
    }
  }, [activeAccountId]);

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
