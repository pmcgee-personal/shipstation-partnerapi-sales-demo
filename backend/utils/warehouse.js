// Warehouse location data
const WAREHOUSE_LOCATIONS = [
  {
    name: "Worldwide Express",
    address_line1: "2021 McKinney Avenue, Suite 1600",
    city_locality: "Dallas",
    state_province: "TX",
    postal_code: "75201",
    country_code: "US",
  },
];

/**
 * Get a random warehouse location from available options
 * @returns {Object} Random warehouse location
 */
function getRandomWarehouse() {
  return WAREHOUSE_LOCATIONS[
    Math.floor(Math.random() * WAREHOUSE_LOCATIONS.length)
  ];
}

/**
 * Create a warehouse payload for ShipStation API
 * @param {string} accountId - ShipStation account ID
 * @returns {Object} Warehouse creation payload
 */
function createWarehousePayload(accountId) {
  const randomLoc = getRandomWarehouse();
  return {
    name: randomLoc.name,
    origin_address: {
      ...randomLoc,
    },
    return_address: {
      ...randomLoc,
    },
  };
}

module.exports = {
  WAREHOUSE_LOCATIONS,
  getRandomWarehouse,
  createWarehousePayload,
};
