// frontend/src/shells/modern-wms/CarrierSettings.jsx
import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { themeConfig } from "./themeConfig";
import { Zap, Info, RefreshCw } from "lucide-react";
import CarrierTable from "../../components/CarrierTable";
import ShipViaTable from "../../components/ShipViaTable"; // <-- Added our new Ship Via component

export default function CarrierSettings({ activeAccountId }) {
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [carriers, setCarriers] = useState([]);
  const [shipVias, setShipVias] = useState([]); // State to hold active account's mappings
  const [error, setError] = useState(null);

  // Automatically fetch carriers and account configurations on selection change
  useEffect(() => {
    if (activeAccountId) {
      loadCarrierSettings();
    }
  }, [activeAccountId]);

  const loadCarrierSettings = async () => {
    setIsSyncing(true);
    setError(null);
    try {
      // 1. Load active account details (which contains our database shipVias array)
      const accountData = await api.getAccount(activeAccountId);
      setShipVias(accountData.shipVias || []);

      // 2. Load connected carrier configurations from ShipStation API
      const carriersData = await api.listCarriers(activeAccountId);
      setCarriers(carriersData);
    } catch (err) {
      console.error("Failed to load carrier settings floor data:", err);
      setError("Failed to sync configurations from active account.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleConnectClick = async () => {
    setIsRedirecting(true);
    setError(null);
    try {
      const { redirect_url } = await api.getDirectLoginUrl(activeAccountId);
      localStorage.setItem("ss_active_account_id", activeAccountId);
      localStorage.setItem("ss_return_from_carrier_flow", "true");
      window.location.href = redirect_url;
    } catch (err) {
      console.error("Direct Login Failed:", err);
      setError(err.message || "Failed to generate connection link.");
      setIsRedirecting(false);
    }
  };

  // Add Ship Via handler callback
  const handleAddShipVia = async (shipViaData) => {
    try {
      const updatedAccount = await api.addShipVia(activeAccountId, shipViaData);
      setShipVias(updatedAccount.shipVias || []);
    } catch (err) {
      console.error("Add Ship Via Failed:", err);
      throw new Error(err.message || "Failed to add mapping.");
    }
  };

  // Delete Ship Via handler callback
  const handleDeleteShipVia = async (shipViaCode) => {
    if (
      !window.confirm(
        `Are you sure you want to delete the mapping for "${shipViaCode}"?`,
      )
    ) {
      return;
    }
    try {
      const updatedAccount = await api.deleteShipVia(
        activeAccountId,
        shipViaCode,
      );
      setShipVias(updatedAccount.shipVias || []);
    } catch (err) {
      console.error("Delete Ship Via Failed:", err);
      setError(err.message || "Failed to remove mapping.");
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
          <button
            onClick={loadCarrierSettings}
            disabled={isSyncing || isRedirecting}
            className={`inline-flex items-center justify-center px-3 py-2.5 rounded-md font-medium text-sm transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50 ${
              isSyncing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Sync carrier data"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          </button>

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

      {/* Main Carrier Connection List */}
      <CarrierTable carriers={carriers} isLoading={isSyncing} />

      {/* New Ship Via Mapping System (renders underneath the carriers list) */}
      <ShipViaTable
        shipVias={shipVias}
        carriers={carriers}
        onAddShipVia={handleAddShipVia}
        onDeleteShipVia={handleDeleteShipVia}
        isSyncing={isSyncing}
      />
    </div>
  );
}
