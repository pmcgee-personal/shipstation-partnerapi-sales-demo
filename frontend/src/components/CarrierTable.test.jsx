// src/components/CarrierTable.test.jsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CarrierTable from "./CarrierTable";

describe("CarrierTable Component", () => {
  // Mock data to simulate the ShipStation API response
  const mockCarriers = [
    {
      carrier_id: "se-12345",
      friendly_name: "USPS",
      account_number: "USPS-999",
      nickname: "Main Post Office",
      services: [
        {
          service_code: "usps_priority_mail",
          name: "USPS Priority Mail",
          domestic: true,
          international: false,
          is_return_supported: true,
          is_multi_package_supported: false,
        },
        {
          service_code: "usps_priority_mail_international",
          name: "USPS Priority Mail International",
          domestic: false,
          international: true,
          is_return_supported: false,
          is_multi_package_supported: true,
        },
      ],
    },
  ];

  it("renders the loading state correctly", () => {
    render(<CarrierTable carriers={[]} isLoading={true} />);

    expect(
      screen.getByText("Syncing carrier configurations..."),
    ).toBeInTheDocument();
  });

  it("renders the empty state when no carriers are provided", () => {
    render(<CarrierTable carriers={[]} isLoading={false} />);

    expect(
      screen.getByText("No carriers are currently connected."),
    ).toBeInTheDocument();
  });

  it("renders carrier data and expands to show correct service badges", () => {
    render(<CarrierTable carriers={mockCarriers} isLoading={false} />);

    // 1. Assert the main table row renders the carrier details
    expect(screen.getByText("USPS")).toBeInTheDocument();
    expect(screen.getByText("USPS-999")).toBeInTheDocument();
    expect(screen.getByText("2 services")).toBeInTheDocument();

    // 2. The services should NOT be visible until expanded
    expect(screen.queryByText("USPS Priority Mail")).not.toBeInTheDocument();

    // 3. Simulate a user clicking the row to expand it
    const carrierRow = screen.getByText("USPS").closest("tr");
    fireEvent.click(carrierRow);

    // 4. Assert the services are now visible
    expect(screen.getByText("USPS Priority Mail")).toBeInTheDocument();
    expect(
      screen.getByText("USPS Priority Mail International"),
    ).toBeInTheDocument();

    // 5. Assert the logic of the capability badges works perfectly based on our mock data booleans
    const domesticBadges = screen.getAllByText("Domestic");
    expect(domesticBadges).toHaveLength(1); // Only the first service is domestic

    const internationalBadges = screen.getAllByText("International");
    expect(internationalBadges).toHaveLength(1); // Only the second is international

    const returnBadges = screen.getAllByText("Returns");
    expect(returnBadges).toHaveLength(1); // Only the first supports returns
  });
});
