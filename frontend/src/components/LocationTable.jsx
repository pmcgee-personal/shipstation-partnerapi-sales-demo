// frontend/src/components/LocationTable.jsx
import React from "react";
import { Loader2 } from "lucide-react";

export default function LocationTable({ warehouses, isLoading }) {
  if (isLoading) {
    return (
      <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        {/* UPDATED: Removed "text-sm font-normal" to match the default base size of CarrierTable */}
        <p className="text-gray-500 flex items-center justify-center">
          <Loader2
            data-testid="loader"
            className="animate-spin text-blue-600 h-4 w-4 mr-2"
          />
          Syncing warehouse configurations...
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
            >
              Location Name
            </th>
            <th
              scope="col"
              className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
            >
              City
            </th>
            <th
              scope="col"
              className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
            >
              State
            </th>
            <th
              scope="col"
              className="px-6 py-3.5 text-left text-sm font-semibold text-gray-700"
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
  );
}
