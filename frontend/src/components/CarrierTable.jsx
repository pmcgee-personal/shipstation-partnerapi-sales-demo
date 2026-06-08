import React, { useState } from "react";
import { themeConfig } from "../shells/modern-wms/themeConfig";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function CarrierTable({ carriers, isLoading }) {
  const [expandedRows, setExpandedRows] = useState([]);

  const handleRowClick = (carrierId) => {
    if (expandedRows.includes(carrierId)) {
      setExpandedRows(expandedRows.filter((id) => id !== carrierId));
    } else {
      setExpandedRows([...expandedRows, carrierId]);
    }
  };

  if (isLoading) {
    return (
      <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <p className="text-gray-500 flex items-center justify-center">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></span>
          Syncing carrier configurations...
        </p>
      </div>
    );
  }

  if (!carriers || carriers.length === 0) {
    return (
      <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <p className="text-gray-500 font-medium">
          No carriers are currently connected.
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Click "Connect to ShipStation API" above to configure your carriers.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 overflow-hidden border border-gray-200 rounded-lg shadow-sm">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className={themeConfig.colors.tableHeaderBg}>
          <tr>
            <th scope="col" className="w-12 px-4 py-3"></th>
            <th
              scope="col"
              className={`px-6 py-3 text-left font-semibold ${themeConfig.colors.tableHeaderText}`}
            >
              Carrier
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left font-semibold ${themeConfig.colors.tableHeaderText}`}
            >
              Account Number
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left font-semibold ${themeConfig.colors.tableHeaderText}`}
            >
              Account Nickname
            </th>
            <th
              scope="col"
              className={`px-6 py-3 text-left font-semibold ${themeConfig.colors.tableHeaderText}`}
            >
              Services
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {carriers.map((carrier) => {
            const isExpanded = expandedRows.includes(carrier.carrier_id);
            return (
              <React.Fragment key={carrier.carrier_id}>
                {/* Main Carrier Row */}
                <tr
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => handleRowClick(carrier.carrier_id)}
                >
                  <td className="px-4 py-4 text-center">
                    {isExpanded ? (
                      <ChevronDown size={16} className="text-gray-500" />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400" />
                    )}
                  </td>
                  <td className="px-6 py-4 font-semibold text-gray-900">
                    {carrier.friendly_name || carrier.carrier_code}
                  </td>
                  <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                    {carrier.account_number || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {carrier.nickname || "-"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {carrier.services?.length || 0} services
                    </span>
                  </td>
                </tr>

                {/* Compact, Clean Service Row */}
                {isExpanded && (
                  <tr className="bg-slate-50">
                    <td colSpan="5" className="px-6 py-4">
                      <div className="pl-12 max-w-3xl">
                        <h4 className="font-bold text-slate-700 text-xs mb-3 uppercase tracking-wider">
                          Available Services
                        </h4>
                        <div className="divide-y divide-gray-100 bg-white rounded-lg border border-gray-100 px-4 py-2 shadow-sm">
                          {carrier.services.map((service) => (
                            <div
                              key={service.service_code}
                              className="flex items-center justify-between py-2.5"
                            >
                              <span className="text-sm font-medium text-slate-800">
                                {service.name}
                              </span>

                              {/* Capabilities shown inline as small clean badges */}
                              <div className="flex space-x-1.5">
                                {service.domestic && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    Domestic
                                  </span>
                                )}
                                {service.international && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                                    International
                                  </span>
                                )}
                                {service.is_return_supported && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                    Returns
                                  </span>
                                )}
                                {service.is_multi_package_supported && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-100">
                                    Multi-Package
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
