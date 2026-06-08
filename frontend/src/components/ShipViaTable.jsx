// frontend/src/components/ShipViaTable.jsx
import React, { useState } from "react";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { themeConfig } from "../shells/modern-wms/themeConfig";

export default function ShipViaTable({
  shipVias = [],
  carriers = [],
  onAddShipVia,
  onDeleteShipVia,
  isSyncing,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [selectedServiceCode, setSelectedServiceCode] = useState("");
  const [error, setError] = useState("");

  // Find the selected carrier object so we can map its services for the dropdown
  const selectedCarrier = carriers.find(
    (c) => c.carrier_id === selectedCarrierId,
  );
  const availableServices = selectedCarrier
    ? selectedCarrier.services || []
    : [];

  // Reset form state
  const resetForm = () => {
    setNewCode("");
    setSelectedCarrierId("");
    setSelectedServiceCode("");
    setError("");
    setIsAdding(false);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanedCode = newCode.trim().toUpperCase();
    if (!cleanedCode) {
      setError("Ship Via Code is required.");
      return;
    }

    if (!selectedCarrierId) {
      setError("Please select a carrier.");
      return;
    }

    if (!selectedServiceCode) {
      setError("Please select a service.");
      return;
    }

    // Front-end uniqueness validation before hitting backend
    const exists = shipVias.some(
      (sv) => sv.ship_via_code.toUpperCase() === cleanedCode,
    );
    if (exists) {
      setError(`Code "${cleanedCode}" already exists.`);
      return;
    }

    try {
      await onAddShipVia({
        ship_via_code: cleanedCode,
        carrier_id: selectedCarrierId,
        service_code: selectedServiceCode,
      });
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save Ship Via.");
    }
  };

  // Helper to find clean carrier and service display names for the table cells
  const getCarrierFriendlyName = (carrierId) => {
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    return carrier ? carrier.friendly_name : carrierId;
  };

  const getServiceFriendlyName = (carrierId, serviceCode) => {
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    if (!carrier) return serviceCode;
    const service = (carrier.services || []).find(
      (s) => s.service_code === serviceCode,
    );
    return service ? service.name : serviceCode;
  };

  return (
    <div className="mt-8 pt-8 border-t border-gray-100">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            Ship Via Mappings
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Map shipping codes to specific carrier services.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={carriers.length === 0 || isSyncing}
            className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-semibold text-sm transition-colors ${themeConfig.colors.primaryButtonBg} ${themeConfig.colors.primaryButtonText} ${themeConfig.colors.primaryButtonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Plus size={16} className="mr-2" />
            Add Mapping
          </button>
        )}
      </div>

      {/* Inline Form to Add a New Ship Via */}
      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Input Code */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Ship Via Code
              </label>
              <input
                type="text"
                placeholder="e.g. USPSGA"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Carrier Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Select Carrier
              </label>
              <select
                value={selectedCarrierId}
                onChange={(e) => {
                  setSelectedCarrierId(e.target.value);
                  setSelectedServiceCode(""); // reset dependent service code selection
                }}
                className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="">-- Choose Connected Carrier --</option>
                {carriers.map((c) => (
                  <option key={c.carrier_id} value={c.carrier_id}>
                    {c.friendly_name} ({c.account_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Service Dropdown (populates based on carrier choice) */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Select Service
              </label>
              <select
                value={selectedServiceCode}
                disabled={!selectedCarrierId}
                onChange={(e) => setSelectedServiceCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">-- Choose Carrier Service --</option>
                {availableServices.map((s) => (
                  <option key={s.service_code} value={s.service_code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors`}
            >
              Save Mapping
            </button>
          </div>
        </form>
      )}

      {/* Ship Via Table Grid */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Ship Via Code
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Carrier Account
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
              >
                Carrier Service
              </th>
              <th scope="col" className="relative px-6 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipVias.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  className="px-6 py-8 text-center text-gray-500 text-sm"
                >
                  {carriers.length === 0
                    ? "Connect a carrier first to enable Ship Via mapping configurations."
                    : "No Ship Via configurations configured. Click 'Add Mapping' above to define one."}
                </td>
              </tr>
            ) : (
              shipVias.map((sv) => (
                <tr
                  key={sv.ship_via_code}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                    {sv.ship_via_code}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {getCarrierFriendlyName(sv.carrier_id)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getServiceFriendlyName(sv.carrier_id, sv.service_code)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => onDeleteShipVia(sv.ship_via_code)}
                      className="text-red-500 hover:text-red-700 transition-colors p-1"
                      title={`Delete mapping ${sv.ship_via_code}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
