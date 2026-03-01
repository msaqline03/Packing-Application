// ═══════════════════════════════════════════════════════════════════════════
// TRANSACTION ENGINE - Grain Bank System
// ═══════════════════════════════════════════════════════════════════════════
// This module implements a simple grain bank system where customer accounts
// track their grain deposits and withdrawals.
//
// INCOMING TICKETS create 3 transactions:
// 1. Deposit net weight to customer account
// 2. Deduct shrinkage from customer account (% of net weight)
// 3. Add shrinkage to designated shrink account
//
// OUTGOING TICKETS create 1 transaction:
// 1. Withdraw net weight from customer account (NO shrinkage)
//
// SHRINKAGE ONLY APPLIES TO INCOMING TICKETS
//
// Debit/Credit entries are reserved for manual adjustments (future feature).

/**
 * Transaction Structure:
 * {
 *   id: number,
 *   transactionDate: ISO string,
 *   ticketId: number,
 *   ticketType: "in" | "out" | "adjustment",
 *   accountId: number,          // Customer or Internal Account ID
 *   accountType: "customer" | "internal",
 *   commodityId: number,
 *   commodityTypeId: number,
 *   locationId: number,          // Stock location
 *   site: number,
 *   transactionType: "deposit" | "withdrawal" | "shrinkage" | "adjustment",
 *   quantity: number,            // Weight in MT (metric tons) - positive or negative
 *   reference: string,           // Ticket reference
 *   notes: string,
 *   status: "active" | "adjusted" | "reversed",
 *   adjustmentOf: number | null, // If this adjusts another transaction
 *   createdAt: ISO string,
 *   updatedAt: ISO string
 * }
 */

// ─── TRANSACTION TYPES ──────────────────────────────────────────────────────

/**
 * For INCOMING tickets (grain delivered):
 * Example: 25 tons net weight, 10% shrinkage
 * 1. DEPOSIT: Net weight added to customer account (+25 tons)
 * 2. SHRINKAGE: Shrinkage deducted from customer account (-2.5 tons)
 * 3. SHRINKAGE: Shrinkage added to shrink account (+2.5 tons)
 * Final result: Customer has 25 - 2.5 = 22.5 tons
 *
 * For OUTGOING tickets (grain withdrawn):
 * Example: 20 tons net weight
 * 1. WITHDRAWAL: Net weight removed from customer account (-20 tons)
 * Final result: Customer loses 20 tons (NO shrinkage on outgoing)
 */

const WEIGHT_EPSILON = 1e-6; // treat weights as equal within rounding

/** Normalize date to YYYY-MM-DD for consistent filtering and display. */
function toDateOnly(dateStr) {
  if (dateStr == null || dateStr === "") return null;
  const s = String(dateStr).trim();
  return s.includes("T") ? s.split("T")[0] : s;
}

// ─── WEIGHT HELPERS ─────────────────────────────────────────────────────────
/** Sum of gross weights minus sum of tare weights, in MT (÷1000 from kg). */
export function calculateNetWeight(ticket) {
  if (!ticket?.grossWeights?.length || !ticket?.tareWeights?.length) return 0;
  const gross = ticket.grossWeights.reduce((a, b) => a + b, 0);
  const tare = ticket.tareWeights.reduce((a, b) => a + b, 0);
  return (gross - tare) / 1000; // kg -> MT
}

/** Sum of gross weights in MT (÷1000 from kg). */
export function calculateGrossWeight(ticket) {
  if (!ticket?.grossWeights?.length) return 0;
  return ticket.grossWeights.reduce((a, b) => a + b, 0) / 1000; // kg -> MT
}

/** Net weight for a bulk pack ticket (single gross/tare in kg), in MT. */
export function calculateBulkTicketNetWeight(bulkTicket) {
  const gross = bulkTicket?.grossWeight != null ? Number(bulkTicket.grossWeight) : 0;
  const tare = bulkTicket?.tareWeight != null ? Number(bulkTicket.tareWeight) : 0;
  if (gross <= 0 || tare < 0) return 0;
  return (gross - tare) / 1000; // kg -> MT
}

/** Net weight for a container (nett in kg), in MT. */
export function calculateContainerNetWeight(container) {
  const nett = container?.nett != null ? Number(container.nett) : 0;
  return nett <= 0 ? 0 : nett / 1000; // kg -> MT
}

/**
 * Get transactions for a given source (bulk ticket or container) by ticketId and ticketType.
 * Use ticketType "bulk-in"|"bulk-out" or "container-in"|"container-out" to avoid mixing with regular tickets.
 */
export function getTransactionsForSource(ticketId, ticketType, transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter(
    (t) => Number(t.ticketId) === Number(ticketId) && t.ticketType === ticketType
  );
}

/** Parse shrink value to a 0–100 number. Accepts "10%", 10, or null/undefined. */
function parseShrinkPercent(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const num = typeof raw === "number" ? raw : parseFloat(String(raw).replace("%", "").trim());
  if (Number.isNaN(num)) return null;
  return Math.max(0, Math.min(100, num));
}

/**
 * Resolve effective shrink % in priority order:
 * 1. Customer + commodity (special agreement) — overrides all
 * 2. Commodity shrink — overrides type and default
 * 3. Commodity type shrink — overrides default
 * 4. Default shrink
 * @returns {number} 0–100
 */
export function getEffectiveShrinkPercent(
  customerId,
  commodityId,
  commodity,
  commodityType,
  defaultShrinkPercent,
  customerCommodityShrinkList = []
) {
  const cc = (customerCommodityShrinkList || []).find(
    (s) => Number(s.customerId) === Number(customerId) && Number(s.commodityId) === Number(commodityId)
  );
  const ccPercent = cc != null ? parseShrinkPercent(cc.shrinkPercent) : null;
  if (ccPercent != null) return ccPercent;

  const commodityPercent = commodity ? parseShrinkPercent(commodity.shrinkAmount) : null;
  if (commodityPercent != null) return commodityPercent;

  const typePercent = commodityType != null ? parseShrinkPercent(commodityType.shrinkPercent) : null;
  if (typePercent != null) return typePercent;

  const defaultPercent = parseShrinkPercent(defaultShrinkPercent);
  return defaultPercent != null ? defaultPercent : 0;
}

/** Shrinkage amount in MT from net weight and shrink % (number or commodity with shrinkAmount). */
export function calculateShrinkage(netWeightMT, shrinkPercentOrCommodity) {
  if (!netWeightMT || netWeightMT <= 0) return 0;
  let percent;
  if (typeof shrinkPercentOrCommodity === "number" && !Number.isNaN(shrinkPercentOrCommodity)) {
    percent = Math.max(0, Math.min(100, shrinkPercentOrCommodity));
  } else {
    const raw = shrinkPercentOrCommodity?.shrinkAmount ?? "0%";
    percent = parseShrinkPercent(raw) ?? 0;
  }
  return (netWeightMT * percent) / 100;
}

// ─── GENERATE TRANSACTION ID ────────────────────────────────────────────────
let nextTransactionId = 1000;
export const genTransactionId = () => ++nextTransactionId;

// ─── CREATE TRANSACTIONS FOR INCOMING TICKET ────────────────────────────────

/**
 * Creates grain bank transactions for an incoming ticket
 * Shrinkage is calculated on NET weight and only applies to incoming tickets.
 * Shrink % is resolved in order: customer+commodity → commodity → commodity type → default.
 * @param {Object} ticket - The ticket object
 * @param {Object} cmo - The CMO associated with the ticket
 * @param {Object} commodity - The commodity object (for shrinkage %)
 * @param {Array} customers - List of customers
 * @param {Array} internalAccounts - List of internal accounts
 * @param {Object} [shrinkConfig] - { defaultShrinkPercent, customerCommodityShrink, commodityTypes }
 * @returns {Array} Array of 3 transaction entries (deposit, shrink out, shrink in)
 */
export function createIncomingTransactions(ticket, cmo, commodity = null, customers = [], internalAccounts = [], shrinkConfig = null) {
  console.log("🔍 createIncomingTransactions called:", {
    hasTicket: !!ticket,
    hasCmo: !!cmo,
    ticketStatus: ticket?.status,
    ticketType: ticket?.type,
    ticketId: ticket?.id,
  });

  if (!ticket || !cmo) {
    console.warn("❌ Missing ticket or cmo");
    return [];
  }
  if (ticket.status !== "completed") {
    console.warn("❌ Ticket not completed, status:", ticket.status);
    return [];
  }
  if (ticket.type !== "in") {
    console.warn("❌ Ticket type not 'in', type:", ticket.type);
    return [];
  }

  const netWeight = calculateNetWeight(ticket);
  console.log("⚖️ Net weight calculated:", {
    netWeight,
    grossWeights: ticket.grossWeights,
    tareWeights: ticket.tareWeights,
  });

  if (netWeight <= 0) {
    console.warn("❌ Net weight is zero or negative:", netWeight);
    return [];
  }

  let effectivePercent;
  if (shrinkConfig && (shrinkConfig.commodityTypes || shrinkConfig.customerCommodityShrink || shrinkConfig.defaultShrinkPercent != null)) {
    const commodityType = (shrinkConfig.commodityTypes || []).find(
      (t) => t.id === (commodity?.commodityTypeId || cmo?.commodityTypeId)
    );
    effectivePercent = getEffectiveShrinkPercent(
      cmo.customerId,
      cmo.commodityId || commodity?.id,
      commodity,
      commodityType,
      shrinkConfig.defaultShrinkPercent,
      shrinkConfig.customerCommodityShrink || []
    );
  } else {
    effectivePercent = commodity ? (parseShrinkPercent(commodity.shrinkAmount) ?? 0) : 0;
  }
  const shrinkageAmount = calculateShrinkage(netWeight, effectivePercent);
  const shrinkLabel = `${effectivePercent}%`;
  const timestamp = new Date().toISOString();
  const reference = ticket.ticketReference || `TKT-${ticket.id}`;

  // Find the shrink receival account
  const shrinkAccount = internalAccounts.find((a) => a.shrinkReceivalAccount);
  if (!shrinkAccount) {
    console.warn("⚠️ No shrink receival account found");
  }

  console.log("✅ Creating incoming transactions:", {
    netWeight,
    shrinkageAmount,
    reference,
    customerId: cmo.customerId,
  });

  const transactions = [];

  // Transaction 1: Deposit NET weight to customer account
  transactions.push({
    id: genTransactionId(),
    transactionDate: toDateOnly(ticket.date) || timestamp.split("T")[0],
    ticketId: ticket.id,
    ticketType: "in",
    accountId: cmo.customerId,
    accountType: customers.find((c) => c.id === cmo.customerId)
      ? "customer"
      : "internal",
    commodityId: cmo.commodityId || ticket.commodityId,
    commodityTypeId: cmo.commodityTypeId || ticket.commodityTypeId,
    locationId: ticket.unloadedLocation,
    site: ticket.site,
    transactionType: "deposit",
    quantity: netWeight,
    reference: reference,
    notes: `Grain deposit - ${reference}${
      ticket.notes ? ` - ${ticket.notes}` : ""
    }`,
    status: "active",
    adjustmentOf: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  // Transaction 2: Deduct shrinkage from customer account
  if (shrinkageAmount > 0) {
    transactions.push({
      id: genTransactionId(),
      transactionDate: toDateOnly(ticket.date) || timestamp.split("T")[0],
      ticketId: ticket.id,
      ticketType: "in",
      accountId: cmo.customerId,
      accountType: customers.find((c) => c.id === cmo.customerId)
        ? "customer"
        : "internal",
      commodityId: cmo.commodityId || ticket.commodityId,
      commodityTypeId: cmo.commodityTypeId || ticket.commodityTypeId,
      locationId: ticket.unloadedLocation,
      site: ticket.site,
      transactionType: "shrinkage",
      quantity: -shrinkageAmount, // Negative to deduct from customer
      reference: reference,
      notes: `Shrinkage deduction (${shrinkLabel}) - ${reference}`,
      status: "active",
      adjustmentOf: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    // Transaction 3: Add shrinkage to shrink account
    if (shrinkAccount) {
      transactions.push({
        id: genTransactionId(),
        transactionDate: toDateOnly(ticket.date) || timestamp.split("T")[0],
        ticketId: ticket.id,
        ticketType: "in",
        accountId: shrinkAccount.id,
        accountType: "internal",
        commodityId: cmo.commodityId || ticket.commodityId,
        commodityTypeId: cmo.commodityTypeId || ticket.commodityTypeId,
        locationId: ticket.unloadedLocation,
        site: ticket.site,
        transactionType: "shrinkage",
        quantity: shrinkageAmount, // Positive to add to shrink account
        reference: reference,
        notes: `Shrinkage received (${shrinkLabel}) - ${reference}`,
        status: "active",
        adjustmentOf: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }

  return transactions;
}

// ─── CREATE TRANSACTIONS FOR OUTGOING TICKET ────────────────────────────────

/**
 * Creates grain bank transactions for an outgoing ticket
 * NO shrinkage on outgoing tickets - only a single withdrawal transaction
 * @param {Object} ticket - The ticket object
 * @param {Object} cmo - The CMO associated with the ticket
 * @param {Object} commodity - The commodity object (not used for outgoing)
 * @param {Array} customers - List of customers
 * @param {Array} internalAccounts - List of internal accounts
 * @returns {Array} Array with 1 transaction entry (withdrawal only)
 */
export function createOutgoingTransactions(ticket, cmo, commodity = null, customers = [], internalAccounts = []) {
  console.log("🔍 createOutgoingTransactions called:", {
    hasTicket: !!ticket,
    hasCmo: !!cmo,
    ticketStatus: ticket?.status,
    ticketType: ticket?.type,
    ticketId: ticket?.id,
  });

  if (!ticket || !cmo) {
    console.warn("❌ Missing ticket or cmo");
    return [];
  }
  if (ticket.status !== "completed") {
    console.warn("❌ Ticket not completed, status:", ticket.status);
    return [];
  }
  if (ticket.type !== "out") {
    console.warn("❌ Ticket type not 'out', type:", ticket.type);
    return [];
  }

  const netWeight = calculateNetWeight(ticket);
  console.log("⚖️ Net weight calculated:", {
    netWeight,
    grossWeights: ticket.grossWeights,
    tareWeights: ticket.tareWeights,
  });

  if (netWeight <= 0) {
    console.warn("❌ Net weight is zero or negative:", netWeight);
    return [];
  }

  const timestamp = new Date().toISOString();
  const reference = ticket.ticketReference || `TKT-${ticket.id}`;

  const transactions = [];

  console.log("✅ Creating outgoing transaction:", {
    netWeight,
    reference,
    customerId: cmo.customerId,
  });

  // Transaction 1: Withdraw NET weight from customer account (NO shrinkage)
  transactions.push({
    id: genTransactionId(),
    transactionDate: toDateOnly(ticket.date) || timestamp.split("T")[0],
    ticketId: ticket.id,
    ticketType: "out",
    accountId: cmo.customerId,
    accountType: customers.find((c) => c.id === cmo.customerId)
      ? "customer"
      : "internal",
    commodityId: cmo.commodityId || ticket.commodityId,
    commodityTypeId: cmo.commodityTypeId || ticket.commodityTypeId,
    locationId: ticket.loadingLocation,
    site: ticket.site,
    transactionType: "withdrawal",
    quantity: -netWeight, // Negative to deduct from customer
    reference: reference,
    notes: `Grain withdrawal - ${reference}${
      ticket.notes ? ` - ${ticket.notes}` : ""
    }`,
    status: "active",
    adjustmentOf: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return transactions;
}

// ─── CREATE TRANSACTIONS FOR BULK PACK TICKET ────────────────────────────────

/**
 * Creates grain bank transactions for a completed bulk pack ticket.
 * Import: deposit (+ optional shrink if pack.shrinkTaken).
 * Export: withdrawal only (no shrink).
 * @param {Object} pack - The bulk pack (customerId, commodityId, commodityTypeId, importExport, shrinkTaken, siteId)
 * @param {Object} bulkTicket - The bulk ticket (id, date, grossWeight, tareWeight, locationId, status)
 * @param {Object} commodity - The commodity (for shrink % when shrinkTaken)
 * @param {Array} customers - List of customers
 * @param {Array} internalAccounts - List of internal accounts
 * @param {Object} [shrinkConfig] - { defaultShrinkPercent, customerCommodityShrink, commodityTypes }
 * @returns {Array} Transaction entries
 */
export function createBulkPackTransactions(
  pack,
  bulkTicket,
  commodity = null,
  customers = [],
  internalAccounts = [],
  shrinkConfig = null
) {
  if (!pack || !bulkTicket || bulkTicket.status !== "completed") return [];

  const netWeight = calculateBulkTicketNetWeight(bulkTicket);
  if (netWeight <= 0) return [];

  const timestamp = new Date().toISOString();
  const ref = pack.jobReference || `Pack-${pack.id}`;
  const reference = `${ref}-BT${bulkTicket.id}`;
  const ticketType = pack.importExport === "Import" ? "bulk-in" : "bulk-out";
  const accountId = pack.customerId;
  const accountType = customers.find((c) => c.id === accountId) ? "customer" : "internal";

  if (pack.importExport === "Import") {
    const transactions = [];
    let effectivePercent = 0;
    if (pack.shrinkTaken && shrinkConfig) {
      const commodityType = (shrinkConfig.commodityTypes || []).find(
        (t) => t.id === (pack.commodityTypeId || commodity?.commodityTypeId)
      );
      effectivePercent = getEffectiveShrinkPercent(
        pack.customerId,
        pack.commodityId,
        commodity,
        commodityType,
        shrinkConfig.defaultShrinkPercent,
        shrinkConfig.customerCommodityShrink || []
      );
    }
    const shrinkageAmount = calculateShrinkage(netWeight, effectivePercent);
    const shrinkLabel = `${effectivePercent}%`;

    transactions.push({
      id: genTransactionId(),
      transactionDate: toDateOnly(bulkTicket.date) || timestamp.split("T")[0],
      ticketId: bulkTicket.id,
      ticketType,
      accountId,
      accountType,
      commodityId: pack.commodityId,
      commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
      locationId: bulkTicket.locationId,
      site: pack.siteId,
      transactionType: "deposit",
      quantity: netWeight,
      reference,
      notes: `Bulk pack deposit - ${reference}${bulkTicket.notes ? ` - ${bulkTicket.notes}` : ""}`,
      status: "active",
      adjustmentOf: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (shrinkageAmount > 0) {
      const shrinkAccount = internalAccounts.find((a) => a.shrinkReceivalAccount);
      transactions.push({
        id: genTransactionId(),
        transactionDate: toDateOnly(bulkTicket.date) || timestamp.split("T")[0],
        ticketId: bulkTicket.id,
        ticketType,
        accountId,
        accountType,
        commodityId: pack.commodityId,
        commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
        locationId: bulkTicket.locationId,
        site: pack.siteId,
        transactionType: "shrinkage",
        quantity: -shrinkageAmount,
        reference,
        notes: `Shrinkage deduction (${shrinkLabel}) - ${reference}`,
        status: "active",
        adjustmentOf: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      if (shrinkAccount) {
        transactions.push({
          id: genTransactionId(),
          transactionDate: toDateOnly(bulkTicket.date) || timestamp.split("T")[0],
          ticketId: bulkTicket.id,
          ticketType,
          accountId: shrinkAccount.id,
          accountType: "internal",
          commodityId: pack.commodityId,
          commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
          locationId: bulkTicket.locationId,
          site: pack.siteId,
          transactionType: "shrinkage",
          quantity: shrinkageAmount,
          reference,
          notes: `Shrinkage received (${shrinkLabel}) - ${reference}`,
          status: "active",
          adjustmentOf: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
    return transactions;
  }

  // Export: withdrawal only
  return [
    {
      id: genTransactionId(),
      transactionDate: toDateOnly(bulkTicket.date) || timestamp.split("T")[0],
      ticketId: bulkTicket.id,
      ticketType,
      accountId,
      accountType,
      commodityId: pack.commodityId,
      commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
      locationId: bulkTicket.locationId,
      site: pack.siteId,
      transactionType: "withdrawal",
      quantity: -netWeight,
      reference,
      notes: `Bulk pack withdrawal - ${reference}${bulkTicket.notes ? ` - ${bulkTicket.notes}` : ""}`,
      status: "active",
      adjustmentOf: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

/** Bulk ticket type for transactions. */
function getBulkTicketType(pack) {
  return pack?.importExport === "Import" ? "bulk-in" : "bulk-out";
}

/**
 * Reversal transactions when a completed bulk ticket is deleted.
 */
export function createBulkPackReversalTransactions(bulkTicket, pack, existingTransactions) {
  if (!bulkTicket || bulkTicket.status !== "completed" || !pack) {
    return { reversalTransactions: [], transactionsToUpdate: [] };
  }
  const ticketType = getBulkTicketType(pack);
  const ticketTransactions = existingTransactions.filter(
    (t) => Number(t.ticketId) === Number(bulkTicket.id) && t.ticketType === ticketType && t.status === "active"
  );
  const timestamp = new Date().toISOString();
  const reversalTransactions = ticketTransactions.map((original) => ({
    ...original,
    id: genTransactionId(),
    quantity: -original.quantity,
    notes: `REVERSAL: ${original.notes} - Bulk ticket deleted`,
    status: "active",
    adjustmentOf: original.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  const transactionsToUpdate = ticketTransactions.map((t) => ({
    ...t,
    status: "reversed",
    updatedAt: timestamp,
  }));
  return { reversalTransactions, transactionsToUpdate };
}

/**
 * Adjustment transactions when a completed bulk ticket's weight or location is modified.
 */
export function createBulkPackAdjustmentTransactions(
  oldBulkTicket,
  newBulkTicket,
  pack,
  existingTransactions,
  commodity = null,
  customers = [],
  internalAccounts = [],
  shrinkConfig = null
) {
  if (!pack || !oldBulkTicket || oldBulkTicket.status !== "completed" || newBulkTicket.status !== "completed") {
    return { transactionsToUpdate: [], newTransactions: [] };
  }
  const oldNet = calculateBulkTicketNetWeight(oldBulkTicket);
  const newNet = calculateBulkTicketNetWeight(newBulkTicket);
  const locationChanged = (oldBulkTicket.locationId !== newBulkTicket.locationId);
  if (Math.abs(oldNet - newNet) < WEIGHT_EPSILON && !locationChanged) {
    return { transactionsToUpdate: [], newTransactions: [] };
  }
  const ticketType = getBulkTicketType(pack);
  const ticketTransactions = existingTransactions.filter(
    (t) => Number(t.ticketId) === Number(oldBulkTicket.id) && t.ticketType === ticketType && t.status === "active"
  );
  const transactionsToUpdate = ticketTransactions.map((t) => ({
    ...t,
    status: "adjusted",
    updatedAt: new Date().toISOString(),
  }));
  const negationTransactions = ticketTransactions
    .filter((t) => !t.notes?.includes("CORRECTION"))
    .map((original) => ({
      ...original,
      id: genTransactionId(),
      quantity: -original.quantity,
      notes: `CORRECTION: Reversing previous entry due to bulk ticket adjustment`,
      status: "active",
      adjustmentOf: original.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  const replacementTransactions = createBulkPackTransactions(
    pack,
    newBulkTicket,
    commodity,
    customers,
    internalAccounts,
    shrinkConfig
  );
  replacementTransactions.forEach((t) => {
    t.notes = `ADJUSTMENT: ${t.notes} (New net: ${newNet.toFixed(3)} MT)`;
    if (ticketTransactions.length > 0) t.adjustmentOf = ticketTransactions[0].id;
  });
  return {
    transactionsToUpdate,
    newTransactions: [...negationTransactions, ...replacementTransactions],
  };
}

// ─── CONTAINER PACK TRANSACTIONS ────────────────────────────────────────────

/** Container ticket type for transactions. */
function getContainerTicketType(pack) {
  return pack?.importExport === "Import" ? "container-in" : "container-out";
}

/**
 * Creates grain bank transactions for a completed container.
 * Import: deposit + optional shrink (if pack.shrinkTaken). Export: withdrawal only.
 */
export function createContainerPackTransactions(
  pack,
  container,
  commodity = null,
  customers = [],
  internalAccounts = [],
  shrinkConfig = null
) {
  if (!pack || !container || container.status !== "completed") return [];

  const netWeight = calculateContainerNetWeight(container);
  if (netWeight <= 0) return [];

  const timestamp = new Date().toISOString();
  const ref = pack.jobReference || `Pack-${pack.id}`;
  const reference = `${ref}-C${container.id}`;
  const ticketType = getContainerTicketType(pack);
  const accountId = pack.customerId;
  const accountType = customers.find((c) => c.id === accountId) ? "customer" : "internal";
  const shrinkTaken = pack.shrinkTaken === true;

  if (pack.importExport === "Import") {
    const transactions = [];
    let effectivePercent = 0;
    if (shrinkTaken && shrinkConfig) {
      const commodityType = (shrinkConfig.commodityTypes || []).find(
        (t) => t.id === (pack.commodityTypeId || commodity?.commodityTypeId)
      );
      effectivePercent = getEffectiveShrinkPercent(
        pack.customerId,
        pack.commodityId,
        commodity,
        commodityType,
        shrinkConfig.defaultShrinkPercent,
        shrinkConfig.customerCommodityShrink || []
      );
    }
    const shrinkageAmount = calculateShrinkage(netWeight, effectivePercent);
    const shrinkLabel = `${effectivePercent}%`;

    transactions.push({
      id: genTransactionId(),
      transactionDate: toDateOnly(container.startDateTime) || timestamp.split("T")[0],
      ticketId: container.id,
      ticketType,
      accountId,
      accountType,
      commodityId: pack.commodityId,
      commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
      locationId: container.stockLocationId,
      site: pack.siteId,
      transactionType: "deposit",
      quantity: netWeight,
      reference,
      notes: `Container pack deposit - ${reference}`,
      status: "active",
      adjustmentOf: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    if (shrinkageAmount > 0) {
      const shrinkAccount = internalAccounts.find((a) => a.shrinkReceivalAccount);
      transactions.push({
        id: genTransactionId(),
        transactionDate: toDateOnly(container.startDateTime) || timestamp.split("T")[0],
        ticketId: container.id,
        ticketType,
        accountId,
        accountType,
        commodityId: pack.commodityId,
        commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
        locationId: container.stockLocationId,
        site: pack.siteId,
        transactionType: "shrinkage",
        quantity: -shrinkageAmount,
        reference,
        notes: `Shrinkage deduction (${shrinkLabel}) - ${reference}`,
        status: "active",
        adjustmentOf: null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      if (shrinkAccount) {
        transactions.push({
          id: genTransactionId(),
          transactionDate: toDateOnly(container.startDateTime) || timestamp.split("T")[0],
          ticketId: container.id,
          ticketType,
          accountId: shrinkAccount.id,
          accountType: "internal",
          commodityId: pack.commodityId,
          commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
          locationId: container.stockLocationId,
          site: pack.siteId,
          transactionType: "shrinkage",
          quantity: shrinkageAmount,
          reference,
          notes: `Shrinkage received (${shrinkLabel}) - ${reference}`,
          status: "active",
          adjustmentOf: null,
          createdAt: timestamp,
          updatedAt: timestamp,
        });
      }
    }
    return transactions;
  }

  return [
    {
      id: genTransactionId(),
      transactionDate: toDateOnly(container.startDateTime) || timestamp.split("T")[0],
      ticketId: container.id,
      ticketType,
      accountId,
      accountType,
      commodityId: pack.commodityId,
      commodityTypeId: pack.commodityTypeId || commodity?.commodityTypeId,
      locationId: container.stockLocationId,
      site: pack.siteId,
      transactionType: "withdrawal",
      quantity: -netWeight,
      reference,
      notes: `Container pack withdrawal - ${reference}`,
      status: "active",
      adjustmentOf: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ];
}

export function createContainerPackReversalTransactions(container, pack, existingTransactions) {
  if (!container || container.status !== "completed" || !pack) {
    return { reversalTransactions: [], transactionsToUpdate: [] };
  }
  const ticketType = getContainerTicketType(pack);
  const ticketTransactions = existingTransactions.filter(
    (t) => Number(t.ticketId) === Number(container.id) && t.ticketType === ticketType && t.status === "active"
  );
  const timestamp = new Date().toISOString();
  const reversalTransactions = ticketTransactions.map((original) => ({
    ...original,
    id: genTransactionId(),
    quantity: -original.quantity,
    notes: `REVERSAL: ${original.notes} - Container deleted`,
    status: "active",
    adjustmentOf: original.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
  const transactionsToUpdate = ticketTransactions.map((t) => ({
    ...t,
    status: "reversed",
    updatedAt: timestamp,
  }));
  return { reversalTransactions, transactionsToUpdate };
}

export function createContainerPackAdjustmentTransactions(
  oldContainer,
  newContainer,
  pack,
  existingTransactions,
  commodity = null,
  customers = [],
  internalAccounts = [],
  shrinkConfig = null
) {
  if (!pack || !oldContainer || oldContainer.status !== "completed" || newContainer.status !== "completed") {
    return { transactionsToUpdate: [], newTransactions: [] };
  }
  const oldNet = calculateContainerNetWeight(oldContainer);
  const newNet = calculateContainerNetWeight(newContainer);
  const locationChanged = (oldContainer.stockLocationId !== newContainer.stockLocationId);
  if (Math.abs(oldNet - newNet) < WEIGHT_EPSILON && !locationChanged) {
    return { transactionsToUpdate: [], newTransactions: [] };
  }
  const ticketType = getContainerTicketType(pack);
  const ticketTransactions = existingTransactions.filter(
    (t) => Number(t.ticketId) === Number(oldContainer.id) && t.ticketType === ticketType && t.status === "active"
  );
  const transactionsToUpdate = ticketTransactions.map((t) => ({
    ...t,
    status: "adjusted",
    updatedAt: new Date().toISOString(),
  }));
  const negationTransactions = ticketTransactions
    .filter((t) => !t.notes?.includes("CORRECTION"))
    .map((original) => ({
      ...original,
      id: genTransactionId(),
      quantity: -original.quantity,
      notes: `CORRECTION: Reversing previous entry due to container adjustment`,
      status: "active",
      adjustmentOf: original.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));
  const replacementTransactions = createContainerPackTransactions(
    pack,
    newContainer,
    commodity,
    customers,
    internalAccounts,
    shrinkConfig
  );
  replacementTransactions.forEach((t) => {
    t.notes = `ADJUSTMENT: ${t.notes} (New net: ${newNet.toFixed(3)} MT)`;
    if (ticketTransactions.length > 0) t.adjustmentOf = ticketTransactions[0].id;
  });
  return {
    transactionsToUpdate,
    newTransactions: [...negationTransactions, ...replacementTransactions],
  };
}

// ─── CREATE ADJUSTMENT TRANSACTIONS ─────────────────────────────────────────

/**
 * Creates adjustment transactions when a ticket's weight is modified
 * This marks old transactions as adjusted and creates new ones
 * @param {Object} oldTicket - Original ticket before adjustment
 * @param {Object} newTicket - Updated ticket after adjustment
 * @param {Object} cmo - The CMO associated with the ticket
 * @param {Array} existingTransactions - Current transaction list
 * @param {Object} commodity - The commodity object (for shrinkage %)
 * @param {Array} customers - List of customers
 * @param {Array} internalAccounts - List of internal accounts
 * @param {Object} [shrinkConfig] - { defaultShrinkPercent, customerCommodityShrink, commodityTypes }
 * @returns {Object} { transactionsToUpdate, newTransactions }
 */
export function createAdjustmentTransactions(
  oldTicket,
  newTicket,
  cmo,
  existingTransactions,
  commodity = null,
  customers = [],
  internalAccounts = [],
  shrinkConfig = null
) {
  const oldNetWeight = Number(calculateNetWeight(oldTicket)) || 0;
  const newNetWeight = Number(calculateNetWeight(newTicket)) || 0;

  // If weights haven't changed (within rounding), no adjustment needed
  if (Math.abs(oldNetWeight - newNetWeight) < WEIGHT_EPSILON) {
    return { transactionsToUpdate: [], newTransactions: [] };
  }

  const ticketId = Number(oldTicket.id);
  // Find existing transactions for this ticket (robust to string/number id)
  const ticketTransactions = existingTransactions.filter(
    (t) => Number(t.ticketId) === ticketId && t.status === "active"
  );

  // Mark existing transactions as adjusted
  const transactionsToUpdate = ticketTransactions.map((t) => ({
    ...t,
    status: "adjusted",
    updatedAt: new Date().toISOString(),
  }));

  // Create negation transactions (CORRECTION entries)
  // ONLY negate "Real" transactions, not previous corrections (to avoid double negation loops)
  const negationTransactions = ticketTransactions
    .filter((t) => !t.notes?.includes("CORRECTION"))
    .map((original) => ({
      ...original,
      id: genTransactionId(),
      quantity: -original.quantity, // Flip sign to negate
      notes: `CORRECTION: Reversing previous entry due to adjustment`,
      status: "active",
      adjustmentOf: original.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

  // Create new transactions with adjusted weight
  const replacementTransactions =
    oldTicket.type === "in"
      ? createIncomingTransactions(newTicket, cmo, commodity, customers, internalAccounts, shrinkConfig)
      : createOutgoingTransactions(newTicket, cmo, commodity, customers, internalAccounts);

  // Add metadata to new transactions
  replacementTransactions.forEach((t) => {
    t.notes = `ADJUSTMENT: ${t.notes} (New net: ${newNetWeight.toFixed(3)} MT)`;
    if (ticketTransactions.length > 0) {
      t.adjustmentOf = ticketTransactions[0].id;
    }
  });

  return { 
    transactionsToUpdate, 
    newTransactions: [...negationTransactions, ...replacementTransactions] 
  };
}

// ─── UPDATE TRANSACTIONS FOR TICKET METADATA (NO WEIGHT CHANGE) ────────────

/**
 * Updates existing active transactions for a completed ticket when only
 * metadata changed (date, reference, notes, CMO, commodity, location).
 * Provides traceability: transactions stay in sync with the ticket and
 * show an amendment note.
 * @param {Object} newTicket - The updated ticket (metadata only, weight unchanged)
 * @param {Object} cmo - The CMO associated with the ticket
 * @param {Array} existingTransactions - Current transaction list
 * @param {Array} customers - List of customers (unused in logic but kept for consistency if needed)
 * @param {Array} internalAccounts - List of internal accounts (unused in logic type)
 * @returns {Array} New transactions array with updated entries for this ticket
 */
export function updateTransactionsForTicketMetadata(
  newTicket,
  cmo,
  existingTransactions,
  customers = [],
  internalAccounts = []
) {
  if (!newTicket || !cmo || newTicket.status !== "completed") {
    return existingTransactions;
  }

  const now = new Date().toISOString();
  const reference = newTicket.ticketReference || `TKT-${newTicket.id}`;
  const transactionDate = newTicket.date || now.split("T")[0];
  const amendmentSuffix = ` — Ticket amended ${now.split("T")[0]}`;
  const locationId =
    newTicket.type === "in"
      ? newTicket.unloadedLocation
      : newTicket.loadingLocation;

  return existingTransactions.map((t) => {
    if (t.ticketId !== newTicket.id || t.status !== "active") return t;
    // Strip any previous amendment suffix so we don't stack them
    const baseNotes = (t.notes || "")
      .replace(/\s*—\s*Ticket amended.*$/, "")
      .trim();
    return {
      ...t,
      transactionDate,
      reference,
      notes: baseNotes + amendmentSuffix,
      updatedAt: now,
      accountId: cmo.customerId,
      commodityId: cmo.commodityId || newTicket.commodityId,
      commodityTypeId: cmo.commodityTypeId || newTicket.commodityTypeId,
      locationId,
      // We could update accountType here if we suspect it changed, 
      // but usually accountId change implies it.
      accountType: customers.find((c) => c.id === cmo.customerId) ? "customer" : "internal",
    };
  });
}

// ─── REVERSE TRANSACTIONS (FOR DELETED TICKETS) ────────────────────────────

/**
 * Creates reversal transactions when a ticket is deleted
 * @param {Object} ticket - The ticket being deleted
 * @param {Object} cmo - The CMO associated with the ticket
 * @param {Array} existingTransactions - Current transaction list
 * @returns {Object} { reversalTransactions, transactionsToUpdate }
 */
export function createReversalTransactions(ticket, cmo, existingTransactions) {
  if (!ticket || ticket.status !== "completed")
    return { reversalTransactions: [], transactionsToUpdate: [] };

  // Find existing active transactions for this ticket
  const ticketTransactions = existingTransactions.filter(
    (t) => t.ticketId === ticket.id && t.status === "active"
  );

  const timestamp = new Date().toISOString();
  // const reference = ticket.ticketReference || `TKT-${ticket.id}`;

  // Create reversal entries (opposite quantity of original entries)
  const reversalTransactions = ticketTransactions.map((original) => ({
    ...original,
    id: genTransactionId(),
    quantity: -original.quantity, // Flip the sign to reverse
    notes: `REVERSAL: ${original.notes} - Ticket deleted`,
    status: "active",
    adjustmentOf: original.id,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  // Mark original transactions as reversed
  const transactionsToUpdate = ticketTransactions.map((t) => ({
    ...t,
    status: "reversed",
    updatedAt: timestamp,
  }));

  return { reversalTransactions, transactionsToUpdate };
}

// ─── QUERY HELPERS ─────────────────────────────────────────────────────────

/**
 * Total stock (MT) at a location from active transactions.
 * @param {number} locationId
 * @param {Array} transactions
 * @param {number|null} commodityTypeId - optional filter by commodity type
 * @returns {number} Total weight in MT (sum of quantity for location)
 */
export function getLocationStock(locationId, transactions, commodityTypeId = null) {
  if (!Array.isArray(transactions)) return 0;
  return transactions
    .filter(
      (t) =>
        t.status === "active" &&
        t.locationId === locationId &&
        (commodityTypeId == null || t.commodityTypeId === commodityTypeId)
    )
    .reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
}

/**
 * Account balance (MT) from active transactions.
 * @param {number} accountId
 * @param {Array} transactions
 * @param {number|null} commodityId - optional filter by commodity
 * @returns {number} Balance in MT
 */
export function getAccountBalance(accountId, transactions, commodityId = null) {
  if (!Array.isArray(transactions)) return 0;
  return transactions
    .filter(
      (t) =>
        t.status === "active" &&
        t.accountId === accountId &&
        (commodityId == null || t.commodityId === commodityId)
    )
    .reduce((sum, t) => sum + (Number(t.quantity) || 0), 0);
}

/**
 * All transactions for a ticket (any status).
 * @param {number} ticketId
 * @param {Array} transactions
 * @returns {Array}
 */
export function getTicketTransactions(ticketId, transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter((t) => Number(t.ticketId) === Number(ticketId));
}

/**
 * Ledger of transactions for an account (any status).
 * @param {number} accountId
 * @param {Array} transactions
 * @returns {Array}
 */
export function getAccountLedger(accountId, transactions) {
  if (!Array.isArray(transactions)) return [];
  return transactions.filter((t) => Number(t.accountId) === Number(accountId));
}
