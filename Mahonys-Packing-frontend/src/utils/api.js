/**
 * API client for Mahonys Packing backend (Laravel).
 * Set NEXT_PUBLIC_API_URL in .env or .env.local (e.g. http://localhost:8000/api).
 */
function getBaseUrl() {
  if (typeof process === "undefined") return "";
  const env = process.env.NEXT_PUBLIC_API_URL || "";
  if (env) return env;
  if (typeof window !== "undefined" && window.location?.port === "3000") {
    return "http://localhost:8000/api";
  }
  return "";
}
const BASE = getBaseUrl();

function request(path, options = {}) {
  const url = BASE ? `${BASE.replace(/\/$/, "")}/${path.replace(/^\//, "")}` : path;
  const headers = { "Content-Type": "application/json", ...options.headers };
  return fetch(url, { ...options, headers }).then(async (res) => {
    const text = await res.text();
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data?.message || res.statusText || `HTTP ${res.status}`);
    return data;
  });
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: "DELETE" }),
};

/** Backend country: { id, code, name }. Frontend country: { id, countryName, countryCode, contacts?, notes?, warnings? } */
export function countryFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    countryName: row.name ?? "",
    countryCode: row.code ?? "",
    contacts: Array.isArray(row.contacts) ? row.contacts : [],
    notes: row.notes ?? "",
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
  };
}

export function countryToApi(country) {
  return {
    name: country.countryName ?? country.name ?? "",
    code: country.countryCode ?? country.code ?? "",
    notes: country.notes ?? "",
    contacts: Array.isArray(country.contacts) ? country.contacts : [],
    warnings: Array.isArray(country.warnings) ? country.warnings : [],
  };
}

/** Backend customer: snake_case (invoicing_contact). Frontend: camelCase (invoicingContact). */
export function customerFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code ?? "",
    name: row.name ?? "",
    emails: Array.isArray(row.emails) ? row.emails : [],
    contacts: Array.isArray(row.contacts) ? row.contacts : [],
    addresses: Array.isArray(row.addresses) ? row.addresses : [],
    website: row.website ?? "",
    notes: row.notes ?? "",
    invoicingContact: row.invoicing_contact ?? "",
    warnings: Array.isArray(row.warnings) ? row.warnings : [],
  };
}

export function customerToApi(customer) {
  return {
    code: customer.code ?? "",
    name: customer.name ?? "",
    emails: Array.isArray(customer.emails) ? customer.emails : [],
    contacts: Array.isArray(customer.contacts) ? customer.contacts : [],
    addresses: Array.isArray(customer.addresses) ? customer.addresses : [],
    website: customer.website ?? "",
    notes: customer.notes ?? "",
    invoicing_contact: customer.invoicingContact ?? customer.invoicing_contact ?? "",
    warnings: Array.isArray(customer.warnings) ? customer.warnings : [],
  };
}

/** Backend packer: snake_case. Frontend: camelCase (commodityTypesAllowed, stockLocationsAllowed). */
export function packerFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    status: row.status ?? "active",
    commodityTypesAllowed: Array.isArray(row.commodity_types_allowed) ? row.commodity_types_allowed : [],
    stockLocationsAllowed: Array.isArray(row.stock_locations_allowed) ? row.stock_locations_allowed : [],
  };
}

export function packerToApi(packer) {
  return {
    name: packer.name ?? "",
    description: packer.description ?? "",
    status: packer.status ?? "active",
    commodity_types_allowed: Array.isArray(packer.commodityTypesAllowed) ? packer.commodityTypesAllowed : (packer.commodity_types_allowed ?? []),
    stock_locations_allowed: Array.isArray(packer.stockLocationsAllowed) ? packer.stockLocationsAllowed : (packer.stock_locations_allowed ?? []),
  };
}

/** Backend container code: snake_case. Frontend: camelCase (isoCode, containerSize, averageWeight, maxWeight, averageEmptyTare in kg). */
export function containerCodeFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    isoCode: row.iso_code ?? "",
    containerSize: row.container_size ?? "",
    description: row.description ?? "",
    cubicMeters: row.cubic_meters != null ? row.cubic_meters : null,
    averageWeight: row.average_weight != null ? row.average_weight : null,
    maxWeight: row.max_weight != null ? row.max_weight : null,
    averageEmptyTare: row.average_empty_tare != null ? row.average_empty_tare : null,
  };
}

export function containerCodeToApi(code) {
  return {
    iso_code: code.isoCode ?? code.iso_code ?? "",
    container_size: code.containerSize ?? code.container_size ?? "",
    description: code.description ?? "",
    cubic_meters: code.cubicMeters != null ? code.cubicMeters : null,
    average_weight: code.averageWeight != null ? code.averageWeight : null,
    max_weight: code.maxWeight != null ? code.maxWeight : null,
    average_empty_tare: code.averageEmptyTare != null ? code.averageEmptyTare : null,
  };
}

/** Normalize datetime string to "YYYY-MM-DD HH:mm" for form (matches ETA/ETD format). */
function normalizeDatetimeStr(val) {
  if (val == null || val === "") return "";
  const s = String(val).trim();
  if (!s) return "";
  const m = s.match(/^(\d{4}-\d{2}-\d{2})[T ](\d{1,2}):(\d{2})/);
  if (m) return `${m[1]} ${m[2].padStart(2, "0")}:${m[3]}`;
  return s;
}

/** Backend vessel departure: snake_case. Frontend: camelCase (voyageNumber, vesselLloyds, vesselCutoffDate, etc.). */
export function vesselDepartureFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    vessel: row.vessel ?? "",
    voyageNumber: row.voyage_number ?? "",
    vesselLloyds: row.vessel_lloyds ?? "",
    vesselCutoffDate: normalizeDatetimeStr(row.vessel_cutoff_date),
    vesselReceivalsOpenDate: normalizeDatetimeStr(row.vessel_receivals_open_date),
    vesselEta: row.vessel_eta ?? "",
    vesselEtd: row.vessel_etd ?? "",
    vesselFreeDays: row.vessel_free_days != null ? row.vessel_free_days : null,
    shippingLineId: row.shipping_line_id ?? null,
  };
}

export function vesselDepartureToApi(dep) {
  return {
    vessel: dep.vessel ?? "",
    voyage_number: dep.voyageNumber ?? dep.voyage_number ?? "",
    vessel_lloyds: dep.vesselLloyds ?? dep.vessel_lloyds ?? "",
    vessel_cutoff_date: dep.vesselCutoffDate || null,
    vessel_receivals_open_date: dep.vesselReceivalsOpenDate || null,
    vessel_eta: dep.vesselEta ?? "",
    vessel_etd: dep.vesselEtd ?? "",
    vessel_free_days: dep.vesselFreeDays != null && dep.vesselFreeDays !== "" ? Number(dep.vesselFreeDays) : null,
    shipping_line_id: dep.shippingLineId != null && dep.shippingLineId !== "" ? Number(dep.shippingLineId) : null,
  };
}

/** Backend internal account: snake_case. Frontend: camelCase (shrinkApplied, shrinkReceivalAccount). */
export function internalAccountFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    shrinkApplied: !!row.shrink_applied,
    shrinkReceivalAccount: !!row.shrink_receival_account,
  };
}

export function internalAccountToApi(account) {
  return {
    name: account.name ?? "",
    description: account.description ?? "",
    shrink_applied: !!account.shrinkApplied,
    shrink_receival_account: !!account.shrinkReceivalAccount,
  };
}

/** Backend container park: snake_case. Frontend: camelCase (containerChainName, revenuePrice, expensePrice). */
export function containerParkFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code ?? "",
    name: row.name ?? "",
    containerChainName: row.container_chain_name ?? "",
    contacts: Array.isArray(row.contacts) ? row.contacts : [],
    notes: row.notes ?? "",
    revenuePrice: row.revenue_price != null ? Number(row.revenue_price) : null,
    expensePrice: row.expense_price != null ? Number(row.expense_price) : null,
  };
}

export function containerParkToApi(park) {
  return {
    code: park.code ?? "",
    name: park.name ?? "",
    container_chain_name: park.containerChainName ?? park.container_chain_name ?? "",
    contacts: Array.isArray(park.contacts) ? park.contacts : [],
    notes: park.notes ?? "",
    revenue_price: park.revenuePrice != null && park.revenuePrice !== "" ? Number(park.revenuePrice) : null,
    expense_price: park.expensePrice != null && park.expensePrice !== "" ? Number(park.expensePrice) : null,
  };
}

/** Backend terminal: snake_case (revenue_price, expense_price). Frontend: camelCase. */
export function terminalFromApi(row) {
  if (!row) return null;
  return {
    id: row.id,
    code: row.code ?? "",
    name: row.name ?? "",
    contacts: Array.isArray(row.contacts) ? row.contacts : [],
    notes: row.notes ?? "",
    revenuePrice: row.revenue_price != null ? Number(row.revenue_price) : null,
    expensePrice: row.expense_price != null ? Number(row.expense_price) : null,
  };
}

export function terminalToApi(terminal) {
  return {
    code: terminal.code ?? "",
    name: terminal.name ?? "",
    contacts: Array.isArray(terminal.contacts) ? terminal.contacts : [],
    notes: terminal.notes ?? "",
    revenue_price: terminal.revenuePrice != null && terminal.revenuePrice !== "" ? Number(terminal.revenuePrice) : null,
    expense_price: terminal.expensePrice != null && terminal.expensePrice !== "" ? Number(terminal.expensePrice) : null,
  };
}

export function isApiConfigured() {
  return !!BASE;
}
