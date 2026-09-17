import PropTypes from "prop-types";
import { Zap, RefreshCw } from "lucide-react";
import CarrierTable from "../../components/CarrierTable";
import { themeConfig } from "./themeConfig";

function CarrierTableSection({
  carriers,
  isSyncing,
  isRedirecting,
  onRefresh,
  onConnect,
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Carrier Settings</h2>
          <p className="text-gray-500 mt-1">
            Click &quot;Connect Carriers&quot; to manage your carrier accounts.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onRefresh}
            disabled={isSyncing || isRedirecting}
            className={`inline-flex items-center justify-center px-3 py-2.5 rounded-md font-medium text-sm transition-colors border border-gray-200 text-gray-600 hover:bg-gray-50 ${
              isSyncing ? "opacity-50 cursor-not-allowed" : ""
            }`}
            title="Sync carrier data"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={onConnect}
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

      <CarrierTable carriers={carriers} isLoading={isSyncing} />
    </div>
  );
}

CarrierTableSection.propTypes = {
  carriers: PropTypes.array.isRequired,
  isSyncing: PropTypes.bool.isRequired,
  isRedirecting: PropTypes.bool.isRequired,
  onRefresh: PropTypes.func.isRequired,
  onConnect: PropTypes.func.isRequired,
};

export default CarrierTableSection;
