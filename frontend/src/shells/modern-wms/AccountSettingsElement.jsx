// frontend/src/shells/modern-wms/AccountSettingsElement.jsx
//
// ShipEngine Elements integration: full default Account Settings workflow
// (carriers, external carriers, payment method, warehouses, units, label
// layout) for the active demo seller account.
//
// https://docs.shipstation.com/apis/shipengine/docs/elements/getting-started
import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Info } from "lucide-react";
import {
  AccountSettings,
  ConnectExternalCarrier,
  ElementsProvider,
  ManageExternalCarriers,
} from "@shipengine/elements";
import { api } from "../../services/api";
import { themeConfig } from "./themeConfig";

// Carrier codes visible in this demo. Elements silently hides the
// corresponding section if either array is empty/omitted -- see the
// "Connecting Carrier Accounts" section of the getting-started guide.
// Matches the USPS/UPS/FedEx story already used in the mock dashboard data.
const ENABLED_SHIPENGINE_CARRIERS = ["stamps_com", "globalpost"];
const ENABLED_EXTERNAL_CARRIERS = [
  "ups",
  "fedex",
  "dhl_express",
  "wwex_parcel",
  "veho",
  "tusk",
  "ontrac",
  "cirro_e_commerce",
  "clearjet",
  "unishippers_parcel",
  "canada_post",
  "canpar",
  "purolator_ca",
  "gls_us",
  "globalpost_byoa",
  "endicia",
  "amazon_shipping_us",
  "swyft",
];

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

  // ElementsProvider's `container` prop is where its shadow root attaches.
  // Left unset, *every* Element under one provider shares a single implicit
  // `elements-container` shadow root -- which is why AccountSettings and
  // ConnectExternalCarrier previously stacked in one box regardless of any
  // outer grid CSS. Two providers, each pointed at its own ref, mount their
  // shadow roots at two distinct DOM locations instead.
  const leftContainerRef = useRef(null);
  const rightContainerRef = useRef(null);
  const [containersMounted, setContainersMounted] = useState(false);

  useEffect(() => {
    setContainersMounted(true);
  }, []);

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

  const sharedProviderProps = {
    key: activeAccountId,
    getToken,
    themeConfig: elementsThemeConfig,
    onError: (err) => console.error("[ShipEngine Elements]", err),
    features: {
      globalFeatures: {
        enabledShipEngineCarriers: ENABLED_SHIPENGINE_CARRIERS,
        enabledExternalCarriers: ENABLED_EXTERNAL_CARRIERS,
        poweredByShipEngine: false,
      },
    },
  };

  return (
    <div
      className={`${themeConfig.colors.cardBg} p-6 rounded-lg shadow-sm border border-gray-100`}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div ref={leftContainerRef} />
        <div ref={rightContainerRef} />
      </div>

      {containersMounted && leftContainerRef.current && (
        <ElementsProvider
          {...sharedProviderProps}
          container={leftContainerRef.current}
        >
          <AccountSettings.Element />
        </ElementsProvider>
      )}

      {containersMounted && rightContainerRef.current && (
        <ElementsProvider
          {...sharedProviderProps}
          container={rightContainerRef.current}
        >
          <div className="space-y-6">
            <ConnectExternalCarrier.Element
              onCarrierConnected={() =>
                console.log("[ShipEngine Elements] carrier connected")
              }
              onCancel={() =>
                console.log("[ShipEngine Elements] connect-carrier cancelled")
              }
            />
            <ManageExternalCarriers.Element
              onCarrierConnected={() =>
                console.log("[ShipEngine Elements] carrier connected (manage)")
              }
            />
          </div>
        </ElementsProvider>
      )}
    </div>
  );
}

AccountSettingsElement.propTypes = {
  activeAccountId: PropTypes.string,
};

export default AccountSettingsElement;
