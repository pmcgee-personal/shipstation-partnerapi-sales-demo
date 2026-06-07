import React, { useState } from "react";
import { api } from "../../services/api";
import { themeConfig } from "./themeConfig";
import { ArrowRight, Zap, Info } from "lucide-react";

// This is a placeholder for the table we will build in the next step
const CarrierTablePlaceholder = () => (
  <div className="mt-6 border border-dashed border-gray-300 rounded-lg p-8 text-center">
    <p className="text-gray-500">
      Connected carriers will appear here after sync.
    </p>
  </div>
);

export default function CarrierSettings({ activeAccountId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleConnectClick = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Call our backend to get the ephemeral redirect URL
      const { redirect_url } = await api.getDirectLoginUrl(activeAccountId);

      // Redirect the user's browser to the ShipStation portal
      window.location.href = redirect_url;
    } catch (err) {
      console.error("Direct Login Failed:", err);
      setError(err.message || "An unknown error occurred.");
      setIsLoading(false);
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

  // If an account IS selected, show the connect button
  return (
    <div
      className={`${themeConfig.colors.cardBg} p-6 rounded-lg shadow-sm border border-gray-100`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Carrier Integration Settings
          </h2>
          <p className="text-gray-500 mt-1">
            Connect your account to the ShipStation API to manage carriers.
          </p>
        </div>
        <button
          onClick={handleConnectClick}
          disabled={isLoading}
          className={`inline-flex items-center justify-center px-5 py-2.5 rounded-md font-semibold text-sm transition-colors ${
            themeConfig.colors.primaryButtonBg
          } ${themeConfig.colors.primaryButtonText} ${
            themeConfig.colors.primaryButtonHover
          } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {isLoading ? (
            "Generating Link..."
          ) : (
            <>
              <Zap size={16} className="mr-2" />
              Connect to ShipStation API
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-4 bg-red-50 text-red-700 p-3 rounded-md border border-red-200 text-sm">
          <strong>Connection Failed:</strong> {error}
        </div>
      )}

      <CarrierTablePlaceholder />
    </div>
  );
}
