import React, { useState, useEffect } from "react";
import { PlaySquare, Plus, RefreshCcw, ChevronDown } from "lucide-react";
import { api } from "../services/api";

export default function DemoBar({ activeAccountId, setActiveAccountId }) {
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch accounts from DynamoDB when the bar loads
  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    setIsLoading(true);
    try {
      const data = await api.listAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setActiveAccountId(null);
  };

  return (
    <div className="bg-slate-900 text-slate-300 text-sm py-2 px-4 flex items-center justify-between border-b border-slate-700 shadow-sm">
      {/* Left Side: Brand & Template Indicator */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-white font-medium">
          <PlaySquare size={16} className="text-emerald-400" />
          <span>SALES DEMO</span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Template:</span>
          <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 flex items-center">
            Modern WMS <ChevronDown size={14} className="ml-1 opacity-50" />
          </span>
        </div>
      </div>

      {/* Right Side: Account Selection & Controls */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Active Account:</span>
          <select
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-1 focus:ring-1 focus:ring-emerald-500 outline-none w-48 cursor-pointer"
            value={activeAccountId || ""}
            onChange={(e) => setActiveAccountId(e.target.value)}
          >
            <option value="">-- Select Demo Account --</option>
            {accounts.map((acc) => (
              <option key={acc.account_id} value={acc.account_id}>
                {acc.label} ({acc.account_id.substring(0, 6)}...)
              </option>
            ))}
          </select>
        </div>

        <button
          className="flex items-center space-x-1 text-slate-300 hover:text-white hover:bg-slate-800 px-2 py-1 rounded transition-colors"
          title="Create New Demo Account"
          // We will wire this up to a modal in a later step!
          onClick={() => alert("New Account Modal coming soon!")}
        >
          <Plus size={14} />
          <span>New</span>
        </button>

        <div className="w-px h-4 bg-slate-700"></div>

        <button
          onClick={handleReset}
          className="flex items-center space-x-1 text-slate-400 hover:text-rose-400 transition-colors"
          title="Reset Active Demo"
        >
          <RefreshCcw size={14} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
}
