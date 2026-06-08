import React, { useState, useEffect } from "react";
import { MapPin, Plus, Loader2, AlertCircle, Info } from "lucide-react";

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
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-blue-500" />
            Warehouse Locations
          </h2>
          <p className="text-gray-500 mt-1">
            Manage physical origin locations for this account.
          </p>
        </div>

        <button
          onClick={handleAddLocation}
          disabled={isAdding || isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium shadow-sm"
        >
          {isAdding ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Add Location
        </button>
      </div>

      {/* API Errors */}
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-md border border-red-100 flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="flex justify-center items-center py-24 bg-white rounded-lg shadow-sm border border-gray-100">
          <Loader2 className="animate-spin text-blue-600 h-8 w-8" />
        </div>
      ) : (
        /* Location Listings Table */
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Location Name
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  City
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  State
                </th>
                <th
                  scope="col"
                  className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  Country
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {warehouses.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500 text-sm"
                  >
                    No locations found. Click the button above to provision a
                    warehouse.
                  </td>
                </tr>
              ) : (
                warehouses.map((warehouse) => (
                  <tr
                    key={warehouse.warehouse_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {warehouse.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {warehouse.origin_address?.city_locality || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {warehouse.origin_address?.state_province || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 uppercase">
                        {warehouse.origin_address?.country_code || "US"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
