// frontend/src/shells/modern-wms/AccountSettingsElement.jsx
//
// ShipEngine Elements integration: full default Account Settings workflow
// (carriers, external carriers, payment method, warehouses, units, label
// layout) for the active demo seller account.
//
// https://docs.shipstation.com/apis/shipengine/docs/elements/getting-started
import { useCallback } from "react";
import PropTypes from "prop-types";
import { Info } from "lucide-react";
import {
  AccountSettings,
  ConnectExternalCarrier,
  ElementsProvider,
} from "@shipengine/elements";
import { api } from "../../services/api";
import { themeConfig } from "./themeConfig";

// Carrier codes visible in this demo. Elements silently hides the
// corresponding section if either array is empty/omitted -- see the
// "Connecting Carrier Accounts" section of the getting-started guide.
// Matches the USPS/UPS/FedEx story already used in the mock dashboard data.
const ENABLED_SHIPENGINE_CARRIERS = ["stamps_com", "ups"];
const ENABLED_EXTERNAL_CARRIERS = ["ups", "fedex"];

// Minimal theme so buttons/links pick up the app's accent color instead of
// the Elements default gray fallback. Every themeConfig field is optional.
const elementsThemeConfig = {
  palette: {
    primary: {
      main: "#00529B", // matches tailwind.config.js `link-blue`
    },
  },
};

function AccountSettingsElement({ activeAccountId }) {
  // getToken must fetch fresh each call so ElementsProvider can refetch
  // once the short-lived (3600s) JWT expires.
  const getToken = useCallback(() => {
    return api.getElementsToken(activeAccountId);
  }, [activeAccountId]);

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
      <ElementsProvider
        // Re-created only when the active account changes, so switching
        // accounts in the demo bar tears down and re-mounts against the
        // new tenant's token instead of caching the previous one.
        key={activeAccountId}
        getToken={getToken}
        themeConfig={elementsThemeConfig}
        onError={(err) => console.error("[ShipEngine Elements]", err)}
        features={{
          globalFeatures: {
            enabledShipEngineCarriers: ENABLED_SHIPENGINE_CARRIERS,
            enabledExternalCarriers: ENABLED_EXTERNAL_CARRIERS,
            poweredByShipEngine: false,
          },
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <AccountSettings.Element />
          <ConnectExternalCarrier.Element
            onCarrierConnected={() =>
              console.log("[ShipEngine Elements] carrier connected")
            }
            onCancel={() => console.log("[ShipEngine Elements] connect-carrier cancelled")}
          />
        </div>
      </ElementsProvider>
    </div>
  );
}

AccountSettingsElement.propTypes = {
  activeAccountId: PropTypes.string,
};

export default AccountSettingsElement;
