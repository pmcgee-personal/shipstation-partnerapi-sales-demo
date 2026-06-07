import React, { useState, useEffect } from "react";
import {
  PlaySquare,
  Plus,
  RefreshCcw,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { api } from "../services/api";
// We no longer need NewAccountModal

// Helper to generate unique, professional demo names
const generateDemoDetails = () => {
  const companyNouns = [
    "Goods",
    "Supply",
    "Logistics",
    "Outfitters",
    "Imports",
    "Wares",
  ];
  const companyAdjectives = [
    "Apex",
    "Riverside",
    "Summit",
    "Coastal",
    "Pinnacle",
    "Nova",
  ];

  const randomAdjective =
    companyAdjectives[Math.floor(Math.random() * companyAdjectives.length)];
  const randomNoun =
    companyNouns[Math.floor(Math.random() * companyNouns.length)];
  const timestamp = Date.now().toString().slice(-5); // Unique suffix

  const label = `${randomAdjective} ${randomNoun}`;
  const email = `demo-${randomAdjective.toLowerCase()}-${timestamp}@example.com`;

  return { label, email };
};

export default function DemoBar({ activeAccountId, setActiveAccountId }) {
  const [accounts, setAccounts] = useState([]);
  const [isCreating, setIsCreating] = useState(false); // State for the new account button

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.listAccounts();
      setAccounts(data);
    } catch (error) {
      console.error("Failed to load accounts:", error);
    }
  };

  const handleNewAccountClick = async () => {
    setIsCreating(true);
    try {
      const { label, email } = generateDemoDetails();
      const newAccount = await api.createAccount(label, email);

      // Reload the dropdown and auto-select the new account
      await loadAccounts();
      setActiveAccountId(newAccount.account_id);
    } catch (error) {
      console.error("Seamless account creation failed:", error);
      alert(
        "Failed to create a new demo account. Please check the console for details.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setActiveAccountId(null);
  };

  return (
    <div className="bg-slate-900 text-slate-300 text-sm py-2 px-4 flex items-center justify-between border-b border-slate-700 shadow-sm">
      {/* Left Side */}
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

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Active Account:</span>
          <select
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-1 focus:ring-1 focus:ring-emerald-500 outline-none w-48 cursor-pointer"
            value={activeAccountId || ""}
            onChange={(e) => setActiveAccountId(e.target.value)}
            disabled={isCreating}
          >
            <option value="">-- Select Demo Account --</option>
            {accounts.map((acc) => (
              <option key={acc.account_id} value={acc.account_id}>
                {acc.label} ({acc.account_id})
              </option>
            ))}
          </select>
        </div>

        <button
          className="flex items-center space-x-1.5 text-slate-300 hover:text-white hover:bg-slate-800 px-2.5 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-wait"
          title="Create New Demo Account"
          onClick={handleNewAccountClick}
          disabled={isCreating}
        >
          {isCreating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Plus size={14} />
          )}
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
