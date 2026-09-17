import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Info } from "lucide-react";
import { api } from "../../services/api";
import { themeConfig } from "./themeConfig";
import CarrierTableSection from "./CarrierTableSection";
import WarehouseLocationsSection from "./WarehouseLocationsSection";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function CarrierSettings({ activeAccountId }) {
  CarrierSettings.propTypes = {
    activeAccountId: PropTypes.string,
  };

  // Carrier states
  const [carriers, setCarriers] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Warehouse states
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isAddingWarehouse, setIsAddingWarehouse] = useState(false);

  // Common
  const [error, setError] = useState(null);

  const loadCarrierSettings = useCallback(async () => {
    setIsSyncing(true);
    setError(null);
    try {
      await api.getAccount(activeAccountId);
      const carriersData = await api.listCarriers(activeAccountId);
      setCarriers(carriersData);
    } catch (err) {
      console.error("Failed to load carrier settings:", err);
      setError("Failed to sync configurations from active account.");
    } finally {
      setIsSyncing(false);
    }
  }, [activeAccountId]);

  const fetchWarehouses = useCallback(async () => {
    if (!activeAccountId) return;
    setIsLoadingWarehouses(true);
    setError(null);
    try {
      const warehousesData = await api.listWarehouses(activeAccountId);
      setWarehouses(warehousesData);
    } catch (err) {
      console.error("Failed to load warehouses:", err);
      setError("Failed to load warehouse locations.");
    } finally {
      setIsLoadingWarehouses(false);
    }
  }, [activeAccountId]);

  useEffect(() => {
    if (activeAccountId) {
      loadCarrierSettings();
      fetchWarehouses();
    }
  }, [activeAccountId, loadCarrierSettings, fetchWarehouses]);


  const handleAddLocation = async () => {
    if (!activeAccountId) return;
    setIsAddingWarehouse(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/warehouses/${activeAccountId}`,
        { method: "POST" },
      );
      if (!response.ok)
        throw new Error("Failed to create new warehouse on ShipStation API.");
      await fetchWarehouses();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsAddingWarehouse(false);
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

  const handleRefresh = () => {
    loadCarrierSettings();
    fetchWarehouses();
  };

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
      {error && (
        <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <CarrierTableSection
        carriers={carriers}
        isSyncing={isSyncing}
        isRedirecting={isRedirecting}
        onRefresh={handleRefresh}
        onConnect={handleConnectClick}
      />

      <WarehouseLocationsSection
        warehouses={warehouses}
        isLoading={isLoadingWarehouses}
        isAdding={isAddingWarehouse}
        onAddLocation={handleAddLocation}
      />
    </div>
  );
}

export default CarrierSettings;
