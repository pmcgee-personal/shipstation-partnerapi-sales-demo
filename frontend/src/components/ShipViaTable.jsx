import React, { useState } from "react";
import {
  Plus,
  Trash2,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
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
  const [selectedPackageType, setSelectedPackageType] = useState(""); // <-- NEW STATE
  const [error, setError] = useState("");

  // --- NEW: State and handler for expandable rows ---
  const [expandedRows, setExpandedRows] = useState([]);

  const handleRowClick = (shipViaCode) => {
    if (expandedRows.includes(shipViaCode)) {
      setExpandedRows(expandedRows.filter((code) => code !== shipViaCode));
    } else {
      setExpandedRows([...expandedRows, shipViaCode]);
    }
  };
  // ---------------------------------------------------

  const selectedCarrier = carriers.find(
    (c) => c.carrier_id === selectedCarrierId,
  );

  const availableServices = selectedCarrier
    ? selectedCarrier.services || []
    : [];

  const resetForm = () => {
    setNewCode("");
    setSelectedCarrierId("");
    setSelectedServiceCode("");
    setSelectedPackageType(""); // <-- RESET
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
    if (!selectedCarrierId || !selectedServiceCode) {
      setError("A carrier and service must be selected.");
      return;
    }
    if (!selectedPackageType) {
      setError("A package type must be selected.");
      return;
    }
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
        package_type: selectedPackageType, // <-- SEND TO BACKEND
      });
      resetForm();
    } catch (err) {
      setError(err.message || "Failed to save Ship Via.");
    }
  };

  const getCarrierDisplayInfo = (carrierId) => {
    const carrier = carriers.find((c) => c.carrier_id === carrierId);
    if (!carrier) return { name: carrierId, accountNumber: "N/A" };
    return {
      name: carrier.friendly_name,
      accountNumber: carrier.account_number,
    };
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
    <div className="mt-8 pt-8 border-t border-gray-200">
      <div className="flex justify-between items-center gap-8 mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-800">Ship Via</h3>
          <p className="text-gray-500 mt-1">
            Map internal shipping codes to carrier services and packaging.
          </p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            disabled={carriers.length === 0 || isSyncing}
            className={`inline-flex shrink-0 items-center justify-center px-5 py-2.5 rounded-md font-semibold text-sm transition-colors ${themeConfig.colors.primaryButtonBg} ${themeConfig.colors.primaryButtonText} ${themeConfig.colors.primaryButtonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <Plus size={16} className="mr-2" />
            Add Ship Via
          </button>
        )}
      </div>

      {isAdding && (
        <form
          onSubmit={handleAddSubmit}
          className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100 space-y-4"
        >
          {/* UPDATED: Changed grid to lg:grid-cols-4 to fit all four columns beautifully */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Select Carrier
              </label>
              <select
                value={selectedCarrierId}
                onChange={(e) => {
                  setSelectedCarrierId(e.target.value);
                  setSelectedServiceCode("");
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
            {/* NEW: Package Type Dropdown Framework */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">
                Package Type
              </label>
              <select
                value={selectedPackageType}
                onChange={(e) => setSelectedPackageType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="">-- Choose Package Type --</option>
                <option value="package">Package</option>
                <option value="letter">Letter / Envelope</option>
                <option value="custom">Custom Packaging</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle size={16} />
              <p>{error}</p>
            </div>
          )}
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

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* NEW: Empty TH for the chevron column */}
              <th scope="col" className="w-12 px-4 py-3.5"></th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
              >
                Ship Via Code
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
              >
                Carrier Account
              </th>
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
              >
                Carrier Service
              </th>
              {/* NEW: Package Type Header */}
              <th
                scope="col"
                className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
              >
                Package Type
              </th>
              {/* Action column (acts as the 5th visual column to match Carrier Accounts visual weight) */}
              <th scope="col" className="relative px-6 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {shipVias.length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  className="px-6 py-8 text-center text-gray-500 text-sm"
                >
                  {carriers.length === 0
                    ? "Connect a carrier first to enable Ship Via mapping."
                    : "No Ship Via configurations defined. Click 'Add Ship Via' to begin."}
                </td>
              </tr>
            ) : (
              shipVias.map((sv) => {
                const carrierInfo = getCarrierDisplayInfo(sv.carrier_id);
                // NEW: Check if this row is expanded
                const isExpanded = expandedRows.includes(sv.ship_via_code);

                return (
                  <React.Fragment key={sv.ship_via_code}>
                    {/* Main Row */}
                    <tr
                      className="hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => handleRowClick(sv.ship_via_code)}
                    >
                      {/* NEW: Chevron Cell */}
                      <td className="px-4 py-4 text-center">
                        {isExpanded ? (
                          <ChevronDown size={16} className="text-gray-500" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                        {sv.ship_via_code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {carrierInfo.name}{" "}
                        <span className="text-gray-400 font-normal">
                          ({carrierInfo.accountNumber})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getServiceFriendlyName(sv.carrier_id, sv.service_code)}
                      </td>
                      {/* NEW: Render the Package Type */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {sv.package_type || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent row expansion when clicking delete
                            onDeleteShipVia(sv.ship_via_code);
                          }}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title={`Delete mapping ${sv.ship_via_code}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>

                    {/* NEW: Expandable Technical Details Row */}
                    {isExpanded && (
                      <tr className="bg-slate-50">
                        {/* Note colSpan=6 to cover the extra Chevron column + all data columns + actions */}
                        <td colSpan="6" className="px-6 py-4">
                          <div className="pl-12 max-w-3xl">
                            <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wider">
                              Technical API Details
                            </h4>
                            <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-100 px-4 py-2 shadow-sm">
                              <div className="flex items-center justify-between py-2.5">
                                <span className="text-sm font-medium text-slate-800">
                                  Carrier ID
                                </span>
                                <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {sv.carrier_id}
                                </code>
                              </div>
                              <div className="flex items-center justify-between py-2.5">
                                <span className="text-sm font-medium text-slate-800">
                                  Service Code
                                </span>
                                <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                  {sv.service_code}
                                </code>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
