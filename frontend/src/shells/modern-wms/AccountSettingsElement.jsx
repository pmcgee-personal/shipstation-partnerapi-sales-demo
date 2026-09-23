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
  Onboarding,
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
  "canpar",
  "purolator_ca",
  "gls_us",
  "amazon_shipping_us",
];

// Onboarding is only relevant for US-origin sellers in this demo (Elements
// also supports GB/CA/AU, gated by the account's origin_country_code -- not
// used here). Kept separate from ENABLED_SHIPENGINE_CARRIERS above since
// that list includes non-US codes for the Account Settings/Connect External
// Carrier elements.
const ONBOARDING_SHIPENGINE_CARRIERS = ["stamps_com", "globalpost"];

// Prefills the onboarding wizard's address step so it isn't blank during a
// demo. Onboarding.Element's defaultShipFromAddress expects a Warehouse
// shape (name/isDefault/originAddress/returnAddress), NOT a flat shipFrom
// address -- that flat shape is for shipments/labels, a different API.
// Matches the existing ShipStation Austin office used elsewhere in this
// app's mock warehouse data (backend/handler.js WAREHOUSE_LOCATIONS).
const DEMO_ADDRESS = {
  name: "Demo Warehouse",
  companyName: "ShipStation",
  phone: "555-123-4567",
  addressLine1: "4301 Bull Creek Rd, Suite 300",
  cityLocality: "Austin",
  stateProvince: "TX",
  postalCode: "78731",
  countryCode: "US",
};
const DEFAULT_SHIP_FROM_ADDRESS = {
  name: "Demo Warehouse",
  isDefault: true,
  originAddress: DEMO_ADDRESS,
  returnAddress: DEMO_ADDRESS,
};

// Minimal theme so buttons/links pick up the app's accent color instead of
// the Elements default gray fallback. Every themeConfig field is optional.
const elementsThemeConfig = {
  palette: {
    primary: {
      main: "#00529B", // matches tailwind.config.js `link-blue`
    },
  },
};

// ElementsProvider's `container` prop is where its shadow root attaches, and
// that shadow root does not appear to be reliably torn down when the
// provider unmounts -- reusing the same host <div> across mount/unmount
// cycles (e.g. toggling the onboarding wizard, or switching accounts) leaves
// behind stale/unstyled shadow DOM content from the previous instance
// (confirmed via DevTools: a broken, oversized icon with no Emotion
// styles). This hook hands each mount a brand-new host element instead of
// reusing one, and removes it outright on unmount/deactivation so nothing
// survives to be reused.
//
// `active` controls whether a container should exist at all right now;
// `generation` (e.g. the active account id) forces a fresh container even
// while `active` stays true, so switching accounts can't reuse a container
// tied to the previous tenant either.
function useFreshElementsContainer(active, generation) {
  const wrapperRef = useRef(null);
  const [container, setContainer] = useState(null);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper || !active) {
      setContainer(null);
      return undefined;
    }

    const node = document.createElement("div");
    wrapper.appendChild(node);
    setContainer(node);

    return () => {
      node.remove();
      setContainer(null);
    };
  }, [active, generation]);

  return [wrapperRef, container];
}

function AccountSettingsElement({ activeAccountId }) {
  // getToken must fetch fresh each call so ElementsProvider can refetch
  // once the short-lived (3600s) JWT expires.
  const getToken = useCallback(() => {
    return api.getElementsToken(activeAccountId);
  }, [activeAccountId]);

  // Onboarding is only relevant before a seller has a ShipEngine carrier
  // wallet set up; once it's complete, Account Settings is how they manage
  // it. Collapsed by default, opened solely by AccountSettings.Element's
  // own built-in "Complete Onboarding" prompt (onRedirectToOnboarding
  // callback below) -- no separate trigger button. While open, the left
  // and right panels are unmounted rather than left running alongside it --
  // multiple simultaneous ElementsProvider instances for the same tenant
  // isn't a tested scenario for this package and corrupted their rendering.
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [leftWrapperRef, leftContainer] = useFreshElementsContainer(
    !showOnboarding,
    activeAccountId,
  );
  const [rightWrapperRef, rightContainer] = useFreshElementsContainer(
    !showOnboarding,
    activeAccountId,
  );
  const [onboardingWrapperRef, onboardingContainer] = useFreshElementsContainer(
    showOnboarding,
    activeAccountId,
  );

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

  const globalFeatures = {
    enabledShipEngineCarriers: ENABLED_SHIPENGINE_CARRIERS,
    enabledExternalCarriers: ENABLED_EXTERNAL_CARRIERS,
    poweredByShipEngine: false,
  };

  const sharedProviderProps = {
    key: activeAccountId,
    getToken,
    themeConfig: elementsThemeConfig,
    onError: (err) => console.error("[ShipEngine Elements]", err),
  };

  return (
    <div
      className={`${themeConfig.colors.cardBg} p-6 rounded-lg shadow-sm border border-gray-100`}
    >
      {/* No standalone trigger button -- opened solely via
          AccountSettings.Element's own built-in "Complete Onboarding"
          prompt (ShipEngine Carriers section), which already fires
          onRedirectToOnboarding below. */}

      {/* Positioned above the grid so opening the wizard never requires
          scrolling past the other elements to reach it. */}
      <div
        ref={onboardingWrapperRef}
        className={
          showOnboarding ? "mb-6 pb-6 border-b border-gray-100" : "hidden"
        }
      />

      {onboardingContainer && (
        <ElementsProvider
          {...sharedProviderProps}
          container={onboardingContainer}
          features={{
            globalFeatures: {
              enabledShipEngineCarriers: ONBOARDING_SHIPENGINE_CARRIERS,
              poweredByShipEngine: false,
            },
          }}
        >
          <Onboarding.Element
            defaultShipFromAddress={DEFAULT_SHIP_FROM_ADDRESS}
            onComplete={() => {
              console.log("[ShipEngine Elements] onboarding complete");
              setShowOnboarding(false);
            }}
            onSellerOnboarded={() =>
              console.log("[ShipEngine Elements] seller onboarded")
            }
          />
        </ElementsProvider>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <div ref={leftWrapperRef} />
        <div ref={rightWrapperRef} />
      </div>

      {leftContainer && (
        <ElementsProvider
          {...sharedProviderProps}
          container={leftContainer}
          features={{
            globalFeatures,
            // showExternalCarriers defaults to false, unlike every other
            // Account Settings section (carriers, payment, warehouses,
            // units, label layout all default on) -- see the "Account
            // Settings Features" table in ShipEngine's docs.
            accountSettingsFeatures: { showExternalCarriers: true },
          }}
        >
          <AccountSettings.Element
            onRedirectToOnboarding={() => {
              console.log(
                "[ShipEngine Elements] onRedirectToOnboarding fired -- AccountSettings.Element determined this seller needs onboarding",
                { activeAccountId },
              );
              setShowOnboarding(true);
            }}
          />
        </ElementsProvider>
      )}

      {rightContainer && (
        <ElementsProvider
          {...sharedProviderProps}
          container={rightContainer}
          features={{ globalFeatures }}
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
