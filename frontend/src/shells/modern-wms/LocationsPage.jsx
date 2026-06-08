import React, { useState, useEffect } from "react";
import { Plus, Loader2, Info } from "lucide-react";
import { themeConfig } from "./themeConfig"; // Added themeConfig import
import LocationTable from "../../components/LocationTable"; // Implemented the external table component

// Pull the endpoint from your .env.local securely
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function LocationsPage({ activeAccountId }) {
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);

  // Re-fetch locations when the active child account changes
  useEffect(() => {
    fetchWarehouses();
  }, [activeAccountId]);

  const fetchWarehouses = async () => {
    if (!activeAccountId) {
      setError("No active account selected.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/warehouses/${activeAccountId}`,
      );
      if (!response.ok) {
        throw new Error(
          "Failed to load warehouse locations from ShipStation API.",
        );
      }
      const data = await response.json();
      setWarehouses(data.warehouses || []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!activeAccountId) return;

    setIsAdding(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/warehouses/${activeAccountId}`,
        {
          method: "POST",
        },
      );
      if (!response.ok) {
        throw new Error("Failed to create new warehouse on ShipStation API.");
      }
      // Re-fetch the physical origins to display the new default warehouse
      await fetchWarehouses();
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsAdding(false);
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
      {/* Page Header matching CarrierSettings layout exactly */}
      <div className="flex justify-between items-center">
        <div>
          {/* Removed MapPin icon, adjusted text color and size to match CarrierSettings */}
          <h2 className="text-xl font-bold text-gray-800">
            Warehouse Locations
          </h2>
          <p className="text-gray-500 mt-1">
            Manage physical origin locations for this account
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleAddLocation}
            disabled={isAdding || isLoading}
            className={`inline-flex items-center justify-center px-5 py-2.5 rounded-md font-semibold text-sm transition-colors ${themeConfig.colors.primaryButtonBg} ${themeConfig.colors.primaryButtonText} ${themeConfig.colors.primaryButtonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isAdding ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <Plus size={16} className="mr-2" />
                Add Location
              </>
            )}
          </button>
        </div>
      </div>

      {/* API Errors matched to CarrierSettings style */}
      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
          <strong>Sync Error:</strong> {error}
        </div>
      )}

      {/* Drop in the interactive table component! */}
      <LocationTable warehouses={warehouses} isLoading={isLoading} />
    </div>
  );
}
