import React, { useState, useEffect } from "react";
import {
  PlaySquare,
  Plus,
  RefreshCcw,
  ChevronDown,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { api } from "../services/api";

// 1. Import our newly extracted and tested utility function!
import { generateDemoDetails } from "../utils/demoUtils";

// 2. The inline generator definition has been completely removed.

export default function DemoBar({ activeAccountId, setActiveAccountId }) {
  const [accounts, setAccounts] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setIsLoadingAccounts(true);
      await loadAccounts();
      setIsLoadingAccounts(false);
    };
    fetchInitialData();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await api.listAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      const msg = err.message || "Unknown error";
      console.error("Failed to load accounts:", err);
      setError(`Failed to fetch accounts: ${msg}`);
    }
  };

  const handleNewAccountClick = async () => {
    setIsCreating(true);
    setError(null);
    try {
      // 3. We call the imported function exactly the same way
      const { label, email } = generateDemoDetails();
      const newAccount = await api.createAccount(label, email);

      await loadAccounts();
      setActiveAccountId(newAccount.account_id);
    } catch (err) {
      const msg = err.message || "Unknown error";
      console.error("Seamless account creation failed:", err);
      setError(`Creation failed: ${msg}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleReset = () => {
    setActiveAccountId(null);
    setError(null);
  };

  return (
    <div className="bg-slate-900 text-slate-300 text-sm py-2 px-4 flex items-center justify-between border-b border-slate-700 shadow-sm relative">
      {/* Left Side */}
      <div className="flex items-center space-x-6">
        <div className="flex items-center space-x-2 text-white font-medium">
          <PlaySquare size={16} className="text-emerald-400" />
          <span>SALES DEMO</span>
        </div>

        {/* Error Banner Injection */}
        {error ? (
          <div className="absolute left-40 bg-rose-950/80 text-rose-300 border border-rose-800/50 px-3 py-1 rounded flex items-center space-x-2 animate-in fade-in zoom-in duration-200">
            <AlertCircle size={14} />
            <span className="text-xs font-medium">{error}</span>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="text-slate-500">Template:</span>
            <span className="bg-slate-800 px-2 py-1 rounded text-slate-300 flex items-center">
              Modern WMS <ChevronDown size={14} className="ml-1 opacity-50" />
            </span>
          </div>
        )}
      </div>

      {/* Right Side */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-slate-500">Active Account:</span>
          <select
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded px-3 py-1 focus:ring-1 focus:ring-emerald-500 outline-none w-48 cursor-pointer disabled:opacity-50"
            value={activeAccountId || ""}
            onChange={(e) => setActiveAccountId(e.target.value)}
            disabled={isCreating || isLoadingAccounts}
          >
            {/* dynamic loading prompt */}
            {isLoadingAccounts ? (
              <option value="">Loading accounts...</option>
            ) : (
              <option value="">-- Select Demo Account --</option>
            )}

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
          disabled={isCreating || isLoadingAccounts}
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
