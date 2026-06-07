import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { themeConfig } from "./themeConfig";
import { ArrowRight, Zap, Info, RefreshCw } from "lucide-react";
import CarrierTable from "../../components/CarrierTable"; // Import our new table!

export default function CarrierSettings({ activeAccountId }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [carriers, setCarriers] = useState([]);
  const [error, setError] = useState(null);

  // Automatically fetch carriers whenever a new demo account is selected
  useEffect(() => {
    if (activeAccountId) {
      loadCarriers();
    }
  }, [activeAccountId]);

  const loadCarriers = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      const data = await api.listCarriers(activeAccountId);
      setCarriers(data);
    } catch (err) {
      console.error("Failed to load carriers:", err);
      setError("Failed to sync carriers from ShipStation.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectClick = async () => {
    setIsRedirecting(true);
    setError(null);
    try {
      // Call our backend to get the ephemeral redirect URL
      const { redirect_url } = await api.getDirectLoginUrl(activeAccountId);

      // Save the active account ID so we can restore it when they come back
      localStorage.setItem("ss_active_account_id", activeAccountId);

      // Redirect the user's browser to the ShipStation portal
      window.location.href = redirect_url;
    } catch (err) {
      console.error("Direct Login Failed:", err);
      setError(err.message || "Failed to generate connection link.");
      setIsRedirecting(false);
    }
  };

  // If no demo account is selected from the top DemoBar
  if (!activeAccountId) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 flex items-center space-x-4">
        <Info className="text-blue-500 w-8 h-8" />
        <div>
          <h3 className="font-bold text-blue-800">No Demo Account Selected</h3>
          <p className="text-blue-700 text-sm">
            Please select a demo account from the control bar at the top of the
            page to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`${themeConfig.colors.cardBg} p-6 rounded-lg shadow-sm border border-gray-100`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Carrier Accounts</h2>
          <p className="text-gray-500 mt-1">
            Click "Connect Carriers" to manage your carrier accounts
          </p>
        </div>

        <div className="flex space-x-3">
          {/* Manual Sync Button */}
          <button
            onClick={loadCarriers}
            disabled={isSyncing || isRedirecting}
            className={`inline-flex items-center justify-center px-3 py-2.5 rounded-md font-medium text-sm transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50 ${
              isSyncing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Sync carrier data"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          </button>

          {/* Connect Button */}
          <button
            onClick={handleConnectClick}
            disabled={isRedirecting || isSyncing}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-md font-semibold text-sm transition-colors ${
              themeConfig.colors.primaryButtonBg
            } ${themeConfig.colors.primaryButtonText} ${
              themeConfig.colors.primaryButtonHover
            } ${isRedirecting || isSyncing ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isRedirecting ? (
              "Generating Link..."
            ) : (
              <>
                <Zap size={16} className="mr-2" />
                Connect Carriers
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
          <strong>Sync Error:</strong> {error}
        </div>
      )}

      {/* Drop in the interactive table! */}
      <CarrierTable carriers={carriers} isLoading={isSyncing} />
    </div>
  );
}
