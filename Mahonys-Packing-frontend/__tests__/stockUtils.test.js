
const { aggregateStock } = require("../src/utils/stockUtils");

describe("Stock Aggregation Logic", () => {
  const transactions = [
    {
      id: 1,
      site: 1,
      accountId: 1,
      accountType: "customer",
      commodityId: 10,
      locationId: 100,
      quantity: 50,
      status: "active",
    },
    {
      id: 2,
      site: 1,
      accountId: 1,
      accountType: "customer",
      commodityId: 10,
      locationId: 100,
      quantity: -10,
      status: "active",
    },
    {
      id: 3,
      site: 1,
      accountId: 1, // Same customer
      accountType: "customer",
      commodityId: 10, // Same commodity
      locationId: 101, // Different location
      quantity: 20,
      status: "active",
    },
    {
      id: 4,
      site: 2, // Different site
      accountId: 1,
      commodityId: 10,
      locationId: 100,
      quantity: 1000,
      status: "active",
    },
  ];

  const customers = [{ id: 1, name: "Customer A" }];
  const internalAccounts = [];
  const commodities = [{ id: 10, description: "Wheat", commodityCode: "WHT", unitType: "MT" }];
  const stockLocations = [
      { id: 100, name: "Silo 1" },
      { id: 101, name: "Silo 2" }
  ];

  test("Aggregates stock correctly for a customer at a site", () => {
    const result = aggregateStock(
      transactions,
      customers,
      internalAccounts,
      commodities,
      stockLocations,
      1 // Site 1
    );

    expect(result).toHaveLength(1); // One customer
    const cust = result[0];
    expect(cust.name).toBe("Customer A");

    // Check Commodity
    const commKeys = Object.keys(cust.commodities);
    expect(commKeys).toHaveLength(1);
    const comm = cust.commodities[10];
    expect(comm.name).toBe("Wheat");
    expect(comm.total).toBe(60); // 50 - 10 + 20

    // Check Locations
    const locKeys = Object.keys(comm.locations);
    expect(locKeys).toHaveLength(2);
    
    expect(comm.locations[100].quantity).toBe(40); // 50 - 10
    expect(comm.locations[101].quantity).toBe(20); // 20
  });

  test("Filters out transactions from other sites", () => {
       const result = aggregateStock(
      transactions,
      customers,
      internalAccounts,
      commodities,
      stockLocations,
      2 // Site 2
    );
     expect(result).toHaveLength(1);
     expect(result[0].commodities[10].total).toBe(1000);
  });
});
