// frontend/src/components/ShipViaTable.test.jsx
import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import ShipViaTable from "./ShipViaTable";

describe("ShipViaTable Component", () => {
  const mockCarriers = [
    {
      carrier_id: "se-5915458",
      friendly_name: "USPS",
      account_number: "pmcgee-160822",
      services: [
        {
          service_code: "usps_ground_advantage",
          name: "USPS Ground Advantage",
        },
        { service_code: "usps_priority_mail", name: "USPS Priority Mail" },
      ],
    },
  ];

  const mockShipVias = [
    {
      ship_via_code: "USPSGA",
      carrier_id: "se-5915458",
      service_code: "usps_ground_advantage",
      package_type: "package",
    },
  ];

  it("renders the empty state correctly when no mappings exist", () => {
    render(
      <ShipViaTable
        shipVias={[]}
        carriers={mockCarriers}
        onAddShipVia={vi.fn()}
        onDeleteShipVia={vi.fn()}
        isSyncing={false}
      />,
    );

    expect(
      screen.getByText(
        "No Ship Via configurations defined. Click 'Add Mapping' to begin.",
      ),
    ).toBeInTheDocument();
  });

  it("renders ship via data columns correctly", () => {
    render(
      <ShipViaTable
        shipVias={mockShipVias}
        carriers={mockCarriers}
        onAddShipVia={vi.fn()}
        onDeleteShipVia={vi.fn()}
        isSyncing={false}
      />,
    );

    expect(screen.getByText("USPSGA")).toBeInTheDocument();
    expect(screen.getByText("USPS")).toBeInTheDocument();
    expect(screen.getByText("(pmcgee-160822)")).toBeInTheDocument();
    expect(screen.getByText("USPS Ground Advantage")).toBeInTheDocument();
    expect(screen.getByText("package")).toBeInTheDocument();
  });

  it("expands a row on click to show technical API details", () => {
    render(
      <ShipViaTable
        shipVias={mockShipVias}
        carriers={mockCarriers}
        onAddShipVia={vi.fn()}
        onDeleteShipVia={vi.fn()}
        isSyncing={false}
      />,
    );

    expect(screen.queryByText("Technical API Details")).not.toBeInTheDocument();

    const row = screen.getByText("USPSGA").closest("tr");
    fireEvent.click(row);

    expect(screen.getByText("Technical API Details")).toBeInTheDocument();
    expect(screen.getByText("se-5915458")).toBeInTheDocument();
    expect(screen.getByText("usps_ground_advantage")).toBeInTheDocument();
  });

  it("opens the inline form and triggers onAddShipVia on submit", () => {
    const mockAddCallback = vi.fn();
    render(
      <ShipViaTable
        shipVias={[]}
        carriers={mockCarriers}
        onAddShipVia={mockAddCallback}
        onDeleteShipVia={vi.fn()}
        isSyncing={false}
      />,
    );

    // 1. Click "Add Mapping" button to open form
    fireEvent.click(screen.getByText("Add Mapping"));

    // 2. Enter Ship Via Code
    const codeInput = screen.getByPlaceholderText("e.g. USPSGA");
    fireEvent.change(codeInput, { target: { value: "USPSPRIO" } });

    // 3. Find and select the Carrier dropdown
    const selectElements = screen.getAllByRole("combobox");
    const carrierSelect = selectElements[0];
    fireEvent.change(carrierSelect, { target: { value: "se-5915458" } });

    // 4. Find and select the Service dropdown (it's the second combobox)
    const serviceSelect = selectElements[1];
    fireEvent.change(serviceSelect, {
      target: { value: "usps_priority_mail" },
    });

    // 5. Find and select the Package Type dropdown (it's the third combobox)
    const packageSelect = selectElements[2];
    fireEvent.change(packageSelect, { target: { value: "package" } });

    // 6. Submit the form
    fireEvent.click(screen.getByText("Save Mapping"));

    // 7. Verify the submit callback is triggered with proper properties
    expect(mockAddCallback).toHaveBeenCalledWith({
      ship_via_code: "USPSPRIO",
      carrier_id: "se-5915458",
      service_code: "usps_priority_mail",
      package_type: "package",
    });
  });

  it("calls onDeleteShipVia when trash icon is clicked", () => {
    const mockDeleteCallback = vi.fn();
    render(
      <ShipViaTable
        shipVias={mockShipVias}
        carriers={mockCarriers}
        onAddShipVia={vi.fn()}
        onDeleteShipVia={mockDeleteCallback}
        isSyncing={false}
      />,
    );

    const deleteBtn = screen.getByTitle("Delete mapping USPSGA");
    fireEvent.click(deleteBtn);

    expect(mockDeleteCallback).toHaveBeenCalledWith("USPSGA");
  });
});
