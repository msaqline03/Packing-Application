// ─── DATA STORE (no mock data – use API / AppContext state) ─────────────────

import { COUNTRIES as COUNTRIES_DATA, PORTS as PORTS_DATA } from "./mockDataCountriesPorts";

export const COUNTRIES = COUNTRIES_DATA;
export const PORTS = PORTS_DATA;

export const SITES = [{ id: 1, name: "Main Depot" }];

export const TRUCKS = [];
export const CUSTOMERS = [];
export const SHIPPING_LINES = [];
export const FEES_AND_CHARGES = [];
export const CONTAINER_PARKS = [];
export const TERMINALS = [];
export const TRANSPORTERS = [];

export const CONTAINER_SIZES = ["10ft", "20ft", "40ft", "45ft", "48ft", "53ft"];

export const CONTAINER_CODES = [];
export const PACKERS = [];
export const INTERNAL_ACCOUNTS = [];
export const BAY_LOCATIONS = [];
export const STOCK_LOCATIONS = [];
export const SIGNOFF_USERS = [];
export const USERS = [];

export const PERMISSIONS = {
  canSignOffTickets: { id: "canSignOffTickets", label: "Can Sign Off Tickets", description: "Ability to approve and sign off on incoming/outgoing tickets" },
  canAddCommodity: { id: "canAddCommodity", label: "Can Add Commodity", description: "Ability to create new commodity entries" },
  canEditCommodity: { id: "canEditCommodity", label: "Can Edit Commodity", description: "Ability to modify existing commodity entries" },
  canDeleteCommodity: { id: "canDeleteCommodity", label: "Can Delete Commodity", description: "Ability to remove commodity entries" },
  canAddCustomer: { id: "canAddCustomer", label: "Can Add Customer", description: "Ability to create new customer records" },
  canEditCustomer: { id: "canEditCustomer", label: "Can Edit Customer", description: "Ability to modify existing customer records" },
  canDeleteCustomer: { id: "canDeleteCustomer", label: "Can Delete Customer", description: "Ability to remove customer records" },
  canManageStockLocations: { id: "canManageStockLocations", label: "Can Manage Stock Locations", description: "Ability to add, edit, or delete stock locations" },
  canViewReports: { id: "canViewReports", label: "Can View Reports", description: "Ability to access and view reports" },
  canManageTests: { id: "canManageTests", label: "Can Manage Tests", description: "Ability to add, edit, or delete test definitions" },
  canManageCMO: { id: "canManageCMO", label: "Can Manage CMO", description: "Ability to create and manage CMO records" },
};

export const USER_PERMISSIONS = [];

export const DEFAULT_SHRINK_PERCENT = 0.5;
export const CUSTOMER_COMMODITY_SHRINK = [];
export const DEFAULT_PACKING_PRICES = [];
export const COMMODITY_PRICES = [];
export const COMMODITY_TYPE_CUSTOMER_PRICES = [];
export const COMMODITY_CUSTOMER_PRICES = [];
export const TRANSPORTER_TRANSPORT_PRICES = [];

export const COMMODITY_TYPES = [];
export const COMMODITIES_LIST = [];
export const TESTS = [];
export const CMO_STATUSES = [];

export const INITIAL_CMOS = [];
export const INITIAL_TICKETS = [];
export const INITIAL_PACKS = [];
export const INITIAL_TRANSACTIONS = [];
export const INITIAL_VESSEL_DEPARTURES = [];

export const PACK_STATUSES = ["Pending", "Inprogress", "Awaiting Approval", "Pending Fumigation", "Approved", "Invoiced", "Completed"];
export const SAMPLE_STATUSES = ["Sent", "Pending", "Received", "Failed"];
export const INSPECTION_RESULTS = ["Pass", "Fail"];

// ─── ID generators ─────────────────────────────────────────────────────────
let nextId = 1;
export const genId = () => nextId++;
let nextCmoRef = 1;
export const genCmoRef = () => `CMO-${String(nextCmoRef++).padStart(3, "0")}`;
let nextPackId = 1;
export const genPackId = () => nextPackId++;
let nextContainerId = 1;
export const genContainerId = () => nextContainerId++;
let nextBulkTicketId = 1;
export const genBulkTicketId = () => nextBulkTicketId++;
let nextVesselDepartureId = 1;
export const genVesselDepartureId = () => nextVesselDepartureId++;

// ─── Helpers ───────────────────────────────────────────────────────────────
export function createReleaseDetail(releaseRef, emptyContainerParkId, transporterId) {
  return { releaseRef: releaseRef || "", emptyContainerParkId: emptyContainerParkId || null, transporterId: transporterId || null };
}

export function createBlankBulkTicket() {
  return {
    id: null,
    date: new Date().toISOString().split("T")[0],
    truckId: null,
    grossWeight: null,
    tareWeight: null,
    locationId: null,
    signoff: "",
    testResults: {},
    notes: "",
    status: "draft",
  };
}

export function createBlankContainer() {
  return {
    id: null,
    containerNumber: "",
    sealNumber: "",
    containerIsoCode: "",
    startDateTime: "",
    stockLocationId: null,
    packerId: null,
    tare: null,
    containerTare: null,
    gross: null,
    nett: null,
    releaseRef: "",
    emptyContainerParkId: null,
    transporterId: null,
    packerSignoff: "",
    packerSignoffDateTime: "",
    authorisedOfficer: "",
    emptyContainerInspectionResult: "",
    emptyContainerInspectionRemark: "",
    grainInspectionResult: "",
    grainInspectionRemark: "",
    authorisedOfficerSignoff: "",
    authorisedOfficerSignoffDateTime: "",
    status: "draft",
  };
}

export function getVesselForPack(pack, vesselDepartures = []) {
  const dep = vesselDepartures.find((v) => v.id === pack.vesselDepartureId);
  if (dep) {
    return {
      vessel: dep.vessel || "",
      voyageNumber: dep.voyageNumber || "",
      vesselLloyds: dep.vesselLloyds || "",
      vesselCutoffDate: dep.vesselCutoffDate || "",
      vesselReceivalsOpenDate: dep.vesselReceivalsOpenDate || "",
      vesselEta: dep.vesselEta || "",
      vesselEtd: dep.vesselEtd || "",
      vesselFreeDays: dep.vesselFreeDays,
    };
  }
  if (pack.vessel || pack.voyageNumber) {
    return {
      vessel: pack.vessel || "",
      voyageNumber: pack.voyageNumber || "",
      vesselLloyds: pack.vesselLloyds || "",
      vesselCutoffDate: pack.vesselCutoffDate || "",
      vesselReceivalsOpenDate: pack.vesselReceivalsOpenDate || "",
      vesselEta: pack.vesselEta || "",
      vesselEtd: pack.vesselEtd || "",
      vesselFreeDays: pack.vesselFreeDays,
    };
  }
  return null;
}
