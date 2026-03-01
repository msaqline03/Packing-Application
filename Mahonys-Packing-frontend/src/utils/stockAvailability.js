/**
 * Stock availability check for export packs.
 * Determines if enough stock will be available for a pack by the pack date,
 * accounting for: current balance, other packs consuming stock, and tickets
 * (incoming/outgoing) scheduled for future dates.
 */

import { getAccountBalance } from "./transactionEngine";
import { calculateNetWeight } from "./transactionEngine";

function toDateOnly(val) {
  if (val == null || val === "") return null;
  const s = String(val).trim();
  return s.includes("T") ? s.split("T")[0] : s;
}

/**
 * Get net weight already withdrawn for a pack (from completed containers/bulk tickets).
 * Used to avoid double-counting when computing "reserved" stock.
 */
function getPackFulfilledMt(pack, transactions) {
  if (!pack || !Array.isArray(transactions)) return 0;
  let fulfilled = 0;
  const ticketTypeOut =
    pack.importExport === "Import" ? "container-in" : "container-out";
  const bulkTypeOut =
    pack.importExport === "Import" ? "bulk-in" : "bulk-out";

  if (pack.packType === "container" && Array.isArray(pack.containers)) {
    for (const c of pack.containers) {
      if (c.status !== "completed") continue;
      const txns = transactions.filter(
        (t) =>
          t.status === "active" &&
          Number(t.ticketId) === Number(c.id) &&
          t.ticketType === ticketTypeOut
      );
      fulfilled += Math.abs(
        txns.reduce((s, t) => s + (Number(t.quantity) || 0), 0)
      );
    }
  }
  if (pack.packType === "bulk" && Array.isArray(pack.bulkTickets)) {
    for (const bt of pack.bulkTickets) {
      if (bt.status !== "completed") continue;
      const txns = transactions.filter(
        (t) =>
          t.status === "active" &&
          Number(t.ticketId) === Number(bt.id) &&
          t.ticketType === bulkTypeOut
      );
      fulfilled += Math.abs(
        txns.reduce((s, t) => s + (Number(t.quantity) || 0), 0)
      );
    }
  }
  return fulfilled;
}

/**
 * Check if enough stock will be available for an Export pack by its date.
 * Considers: current balance, other export packs (same customer+commodity),
 * and tickets (in/out) scheduled up to pack date that are not yet completed.
 *
 * @param {Object} pack - The pack to check
 * @param {Object} ctx - { packs, tickets, transactions, cmos, currentSite }
 * @returns {{ insufficient: boolean, available?: number, required?: number, shortfall?: number }}
 */
export function checkStockAvailabilityForPack(pack, ctx) {
  if (!pack || pack.importExport !== "Export") {
    return { insufficient: false };
  }

  const {
    packs = [],
    tickets = [],
    transactions = [],
    cmos = [],
    currentSite,
  } = ctx;

  const customerId = pack.customerId;
  const commodityId = pack.commodityId;
  const siteId = pack.siteId ?? currentSite;
  const packDate = toDateOnly(pack.date);
  const required = Number(pack.mtTotal) || 0;

  if (required <= 0) return { insufficient: false };

  const siteTransactions = (transactions || []).filter(
    (t) => t.site === siteId
  );

  // 1. Current balance for customer + commodity (from completed transactions)
  let available =
    getAccountBalance(customerId, siteTransactions, commodityId) || 0;

  // 2. Add incoming tickets (not completed) with date <= pack date - they'll add stock
  for (const t of tickets) {
    if (t.type !== "in" || t.status === "completed") continue;
    const cmo = cmos.find((c) => c.id === t.cmoId);
    if (!cmo || cmo.customerId !== customerId) continue;
    const tComm = cmo.commodityId ?? t.commodityId;
    if (tComm !== commodityId) continue;
    const tDate = toDateOnly(t.date);
    if (tDate && packDate && tDate <= packDate) {
      available += calculateNetWeight(t) || 0;
    }
  }

  // 3. Subtract outgoing tickets (not completed) with date <= pack date - they'll remove stock
  for (const t of tickets) {
    if (t.type !== "out" || t.status === "completed") continue;
    const cmo = cmos.find((c) => c.id === t.cmoId);
    if (!cmo || cmo.customerId !== customerId) continue;
    const tComm = cmo.commodityId ?? t.commodityId;
    if (tComm !== commodityId) continue;
    const tDate = toDateOnly(t.date);
    if (tDate && packDate && tDate <= packDate) {
      available -= calculateNetWeight(t) || 0;
    }
  }

  // 4. Subtract other export packs (same customer, commodity, site, date <= pack) that reserve stock
  const otherPacks = (packs || []).filter(
    (p) =>
      p.id !== pack.id &&
      p.importExport === "Export" &&
      p.customerId === customerId &&
      p.commodityId === commodityId &&
      (p.siteId ?? currentSite) === siteId
  );

  for (const p of otherPacks) {
    const pDate = toDateOnly(p.date);
    if (!packDate || !pDate || pDate > packDate) continue;
    const mtTotal = Number(p.mtTotal) || 0;
    const fulfilled = getPackFulfilledMt(p, transactions);
    const reserved = Math.max(0, mtTotal - fulfilled);
    available -= reserved;
  }

  const shortfall = Math.max(0, required - available);
  const insufficient = available < required - 0.001; // small tolerance

  return {
    insufficient,
    available: Math.max(0, available),
    required,
    shortfall: insufficient ? shortfall : 0,
  };
}
