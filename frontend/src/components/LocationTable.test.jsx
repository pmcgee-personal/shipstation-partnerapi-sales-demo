// frontend/src/components/LocationTable.test.jsx
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LocationTable from "./LocationTable";

describe("LocationTable Component", () => {
  // Mock data to simulate the ShipStation API warehouse locations structure
  const mockWarehouses = [
    {
      warehouse_id: "wh-111",
      name: "Austin Distribution Center",
      origin_address: {
        city_locality: "Austin",
        state_province: "TX",
        country_code: "US",
      },
    },
    {
      warehouse_id: "wh-222",
      name: "London Fulfillment",
      origin_address: {
        city_locality: "London",
        state_province: "Greater London",
        country_code: "GB",
      },
    },
  ];

  it("renders the loading state correctly", () => {
    render(<LocationTable warehouses={[]} isLoading={true} />);

    // Assert that the loader element is present via test ID (Clean & Robust)
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders the empty state when no locations are provided", () => {
    render(<LocationTable warehouses={[]} isLoading={false} />);

    expect(
      screen.getByText(
        "No locations found. Click the button above to provision a warehouse.",
      ),
    ).toBeInTheDocument();
  });

  it("renders warehouse details correctly in table rows", () => {
    render(<LocationTable warehouses={mockWarehouses} isLoading={false} />);

    // 1. Assert the first warehouse details render
    expect(screen.getByText("Austin Distribution Center")).toBeInTheDocument();
    expect(screen.getByText("Austin")).toBeInTheDocument();
    expect(screen.getByText("TX")).toBeInTheDocument();

    // 2. Assert the second warehouse details render
    expect(screen.getByText("London Fulfillment")).toBeInTheDocument();
    expect(screen.getByText("London")).toBeInTheDocument();
    expect(screen.getByText("Greater London")).toBeInTheDocument();

    // 3. Assert country code badges render
    expect(screen.getByText("US")).toBeInTheDocument();
    expect(screen.getByText("GB")).toBeInTheDocument();
  });

  it("handles missing origin address gracefully", () => {
    const incompleteWarehouses = [
      {
        warehouse_id: "wh-333",
        name: "Incomplete Address WH",
        origin_address: null, // Simulate missing address
      },
    ];

    render(
      <LocationTable warehouses={incompleteWarehouses} isLoading={false} />,
    );

    expect(screen.getByText("Incomplete Address WH")).toBeInTheDocument();

    // It should fall back to "N/A" for city/state and "US" default for country code based on component logic
    const naElements = screen.getAllByText("N/A");
    expect(naElements.length).toBeGreaterThanOrEqual(2); // One for city, one for state
    expect(screen.getByText("US")).toBeInTheDocument();
  });
});
