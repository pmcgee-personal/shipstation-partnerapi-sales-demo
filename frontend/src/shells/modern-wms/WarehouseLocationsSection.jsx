import PropTypes from "prop-types";
import { Plus, Loader2 } from "lucide-react";
import LocationTable from "../../components/LocationTable";
import { themeConfig } from "./themeConfig";

function WarehouseLocationsSection({
  warehouses,
  isLoading,
  isAdding,
  onAddLocation,
}) {
  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">
            Warehouse Locations
          </h2>
          <p className="text-gray-500 mt-1">
            Manage physical origin locations for this account.
          </p>
        </div>
        <button
          onClick={onAddLocation}
          disabled={isAdding || isLoading}
          className={`inline-flex shrink-0 items-center justify-center px-5 py-2.5 rounded-md font-semibold text-sm transition-colors ${themeConfig.colors.primaryButtonBg} ${themeConfig.colors.primaryButtonText} ${themeConfig.colors.primaryButtonHover} disabled:opacity-50 disabled:cursor-not-allowed`}
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
      <LocationTable warehouses={warehouses} isLoading={isLoading} />
    </div>
  );
}

WarehouseLocationsSection.propTypes = {
  warehouses: PropTypes.array.isRequired,
  isLoading: PropTypes.bool.isRequired,
  isAdding: PropTypes.bool.isRequired,
  onAddLocation: PropTypes.func.isRequired,
};

export default WarehouseLocationsSection;
