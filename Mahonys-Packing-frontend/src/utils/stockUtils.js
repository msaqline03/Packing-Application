
/**
 * Aggregates transactions into a stock hierarchy:
 * Account -> Commodity -> Location -> Balance
 * 
 * @param {Array} transactions - List of transactions
 * @param {Array} customers - List of customers
 * @param {Array} internalAccounts - List of internal accounts
 * @param {Array} commodities - List of commodities
 * @param {Array} stockLocations - List of stock locations
 * @param {number} currentSite - Current site ID to filter by
 * @returns {Array} Sorted list of accounts with nested commodities and locations
 */
export function aggregateStock(
  transactions,
  customers,
  internalAccounts,
  commodities,
  stockLocations,
  currentSite
) {
  // 1. Filter transactions for current site
  const siteTransactions = transactions.filter((t) => t.site === currentSite);

  // 2. Build map of Account -> Commodity -> Location -> Balance
  const tempMap = {};

  siteTransactions.forEach((t) => {
    // Create Account Entry
    const accountKey = `${t.accountType}-${t.accountId}`;
    if (!tempMap[accountKey]) {
      let accountName = "Unknown";
      let accountType = t.accountType;
      
      if (t.accountType === "customer") {
        const c = customers.find((cust) => cust.id === t.accountId);
        accountName = c ? c.name : `Customer #${t.accountId}`;
      } else {
        const i = internalAccounts.find((acc) => acc.id === t.accountId);
        accountName = i ? i.name : `Internal #${t.accountId}`;
        // Fallback if type not strictly set in transaction
        if (!accountType) {
          // Double check if it's actually a customer
           const isCustomer = customers.some(c => c.id === t.accountId);
           accountType = isCustomer ? "customer" : "internal";
        } 
      }

      tempMap[accountKey] = {
        key: accountKey,
        name: accountName,
        type: accountType,
        commodities: {},
        totalBalance: 0,
      };
    }

    // Create Commodity Entry
    if (!tempMap[accountKey].commodities[t.commodityId]) {
      const c = commodities.find((comm) => comm.id === t.commodityId);
      tempMap[accountKey].commodities[t.commodityId] = {
        id: t.commodityId,
        name: c ? c.description : `Commodity #${t.commodityId}`,
        commodityCode: c ? c.commodityCode : "",
        unit: c ? c.unitType : "MT",
        locations: {},
        total: 0,
      };
    }

    // Create Location Entry
    const locId = t.locationId || "unassigned";
    if (!tempMap[accountKey].commodities[t.commodityId].locations[locId]) {
      let locName = "Unassigned";
      if (locId !== "unassigned") {
        const l = stockLocations.find((loc) => loc.id === locId);
        locName = l ? l.name : `Location #${locId}`;
      }
      tempMap[accountKey].commodities[t.commodityId].locations[locId] = {
        id: locId,
        name: locName,
        quantity: 0,
      };
    }

    // Add Quantity (Include active and reversed)
    if (t.status === "active" || t.status === "reversed") {
      const qty = t.quantity || 0;
      tempMap[accountKey].commodities[t.commodityId].locations[locId].quantity += qty;
      tempMap[accountKey].commodities[t.commodityId].total += qty;
      tempMap[accountKey].totalBalance += qty;
    }
  });

  return Object.values(tempMap).sort((a, b) => a.name.localeCompare(b.name));
}
