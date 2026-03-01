"use client";
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  genId,
  genCmoRef,
  genPackId,
  genContainerId,
  genBulkTicketId,
  PERMISSIONS as INIT_PERMISSIONS,
  USERS as INIT_USERS,
  USER_PERMISSIONS as INIT_USER_PERMISSIONS,
  INTERNAL_ACCOUNTS as INIT_INTERNAL_ACCOUNTS,
  CUSTOMERS as INIT_CUSTOMERS,
  COMMODITY_TYPES as INIT_COMMODITY_TYPES,
  COMMODITIES_LIST as INIT_COMMODITIES,
  SHIPPING_LINES as INIT_SHIPPING_LINES,
  FEES_AND_CHARGES as INIT_FEES_AND_CHARGES,
  CONTAINER_PARKS as INIT_CONTAINER_PARKS,
  TERMINALS as INIT_TERMINALS,
  TRANSPORTERS as INIT_TRANSPORTERS,
  CONTAINER_CODES as INIT_CONTAINER_CODES,
  PACKERS as INIT_PACKERS,
  COUNTRIES as INIT_COUNTRIES,
  STOCK_LOCATIONS as INIT_STOCK_LOCATIONS,
  TRUCKS as INIT_TRUCKS,
  TESTS as INIT_TESTS,
  CMO_STATUSES as INIT_CMO_STATUSES,
  INITIAL_CMOS as INIT_CMOS,
  INITIAL_TICKETS as INIT_TICKETS,
  INITIAL_PACKS as INIT_PACKS,
  INITIAL_TRANSACTIONS as INITIAL_TRANSACTIONS,
  INITIAL_VESSEL_DEPARTURES as INITIAL_VESSEL_DEPARTURES,
  genVesselDepartureId,
  DEFAULT_SHRINK_PERCENT as INIT_DEFAULT_SHRINK_PERCENT,
  CUSTOMER_COMMODITY_SHRINK as INIT_CUSTOMER_COMMODITY_SHRINK,
  DEFAULT_PACKING_PRICES as INIT_DEFAULT_PACKING_PRICES,
  COMMODITY_PRICES as INIT_COMMODITY_PRICES,
  COMMODITY_TYPE_CUSTOMER_PRICES as INIT_COMMODITY_TYPE_CUSTOMER_PRICES,
  COMMODITY_CUSTOMER_PRICES as INIT_COMMODITY_CUSTOMER_PRICES,
  TRANSPORTER_TRANSPORT_PRICES as INIT_TRANSPORTER_TRANSPORT_PRICES,
} from "../utils/mockData";
import {
  createIncomingTransactions,
  createOutgoingTransactions,
  createAdjustmentTransactions,
  updateTransactionsForTicketMetadata,
  createReversalTransactions,
  createBulkPackTransactions,
  createBulkPackReversalTransactions,
  createBulkPackAdjustmentTransactions,
  createContainerPackTransactions,
  createContainerPackReversalTransactions,
  createContainerPackAdjustmentTransactions,
  getAccountBalance,
  getLocationStock,
  getTicketTransactions,
  getAccountLedger,
  calculateNetWeight,
  calculateGrossWeight,
  calculateShrinkage,
  getEffectiveShrinkPercent,
} from "../utils/transactionEngine";
import {
  parseVesselScheduleCsv,
  formatVesselDateTime,
  vesselDateTimeToDateOnly,
} from "../utils/vesselScheduleCsv";
import { useRouter } from "next/router";
import { api, countryFromApi, countryToApi, customerFromApi, customerToApi, containerCodeFromApi, containerCodeToApi, containerParkFromApi, containerParkToApi, terminalFromApi, terminalToApi, packerFromApi, packerToApi, vesselDepartureFromApi, vesselDepartureToApi, internalAccountFromApi, internalAccountToApi, isApiConfigured } from "../utils/api";

const AppContext = createContext();

/** Endpoints we can load from API (key -> used for "already loaded" tracking). */
const API_ENDPOINTS = [
  "countries",
  "customers",
  "container-codes",
  "packers",
  "vessel-departures",
  "internal-accounts",
  "container-parks",
  "terminals",
];

/**
 * Return which API endpoints the current route needs. Only these will be fetched on that page.
 * Unknown routes load nothing (pages that need data can be added here).
 */
function getEndpointsForPath(pathname) {
  if (!pathname || pathname === "/") return [];
  const p = pathname.split("?")[0];
  // Settings / reference-data pages: load only what that page needs
  if (p === "/packers") return ["packers"];
  if (p === "/countries") return ["countries"];
  if (p === "/customers") return ["customers", "countries"];
  if (p === "/container-codes") return ["container-codes"];
  if (p === "/terminals") return ["terminals"];
  if (p === "/internalAccounts") return ["internal-accounts"];
  if (p === "/empty-container-parks") return ["container-parks"];
  if (p === "/vessels") return ["vessel-departures"];
  // All other pages that use tickets, packs, CMOs, transactions: load full reference data
  const needsCore = [
    "/incoming",
    "/outgoing",
    "/loader",
    "/transactions",
    "/account-balances",
    "/stock-transfer",
    "/shrink-settings",
    "/container-packing",
    "/bulk-packing",
    "/commodity-pricing",
    "/packing-prices",
    "/general-transport-prices",
    "/commodities",
    "/commodityTypes",
    "/transporters",
    "/shipping-lines",
    "/reports",
    "/stockLocations",
    "/users",
    "/userPermissions",
    "/tests",
  ].some((base) => p === base || p.startsWith(base + "/"));
  if (needsCore) return [...API_ENDPOINTS];
  if (p.startsWith("/ticket") || p.startsWith("/pack") || p.startsWith("/packing") || p.startsWith("/vessel-scheduler") || p.startsWith("/cmo-edit") || p.startsWith("/print/")) return [...API_ENDPOINTS];
  return [];
}

export function AppProvider({ children }) {
  const [tickets, setTickets] = useState(INIT_TICKETS);
  const [packs, setPacks] = useState(INIT_PACKS);
  const [cmos, setCmos] = useState(INIT_CMOS);
  const [trucks, setTrucks] = useState(INIT_TRUCKS);
  const [customers, setCustomers] = useState(INIT_CUSTOMERS);
  const [internalAccounts, setInternalAccounts] = useState(
    INIT_INTERNAL_ACCOUNTS,
  );
  const [commodityTypes, setCommodityTypes] = useState(INIT_COMMODITY_TYPES);
  const [commodities, setCommodities] = useState(INIT_COMMODITIES);
  const [tests, setTests] = useState(INIT_TESTS);
  const [cmoStatuses, setCmoStatuses] = useState(INIT_CMO_STATUSES);
  const [shippingLines, setShippingLines] = useState(INIT_SHIPPING_LINES);
  const [feesAndCharges, setFeesAndCharges] = useState(INIT_FEES_AND_CHARGES);
  const [containerParks, setContainerParks] = useState(INIT_CONTAINER_PARKS);
  const [terminals, setTerminals] = useState(INIT_TERMINALS);
  const [transporters, setTransporters] = useState(INIT_TRANSPORTERS);
  const [containerCodes, setContainerCodes] = useState(INIT_CONTAINER_CODES);
  const [packers, setPackers] = useState(INIT_PACKERS);
  const [countries, setCountries] = useState(INIT_COUNTRIES);
  const [stockLocations, setStockLocations] = useState(INIT_STOCK_LOCATIONS);
  const [users, setUsers] = useState(INIT_USERS);
  const [userPermissions, setUserPermissions] = useState(INIT_USER_PERMISSIONS);
  const [permissions] = useState(INIT_PERMISSIONS);
  const [currentSite, setCurrentSite] = useState(1);
  const [transactions, setTransactions] = useState(() => Array.isArray(INITIAL_TRANSACTIONS) ? INITIAL_TRANSACTIONS : []);
  const [defaultShrinkPercent, setDefaultShrinkPercent] = useState(
    INIT_DEFAULT_SHRINK_PERCENT ?? 0,
  );
  const [customerCommodityShrink, setCustomerCommodityShrink] = useState(
    INIT_CUSTOMER_COMMODITY_SHRINK || [],
  );
  const [defaultPackingPrices, setDefaultPackingPrices] = useState(
    INIT_DEFAULT_PACKING_PRICES || [],
  );
  const [commodityPrices, setCommodityPrices] = useState(
    INIT_COMMODITY_PRICES || [],
  );
  const [commodityTypeCustomerPrices, setCommodityTypeCustomerPrices] =
    useState(INIT_COMMODITY_TYPE_CUSTOMER_PRICES || []);
  const [commodityCustomerPrices, setCommodityCustomerPrices] = useState(
    INIT_COMMODITY_CUSTOMER_PRICES || [],
  );
  const [transporterTransportPrices, setTransporterTransportPrices] = useState(
    INIT_TRANSPORTER_TRANSPORT_PRICES || [],
  );
  const [vesselSchedule, setVesselSchedule] = useState([]);
  const [vesselDepartures, setVesselDepartures] = useState(
    INITIAL_VESSEL_DEPARTURES || [],
  );

  const router = useRouter();
  const pathname = router?.pathname ?? "";
  const loadedEndpointsRef = useRef(new Set());

  // Load only the API data required by the current page. Once an endpoint is loaded, we don't re-fetch on navigation.
  useEffect(() => {
    if (!isApiConfigured()) return;
    const endpoints = getEndpointsForPath(pathname);
    const toLoad = endpoints.filter((key) => !loadedEndpointsRef.current.has(key));
    if (toLoad.length === 0) return;

    toLoad.forEach((key) => loadedEndpointsRef.current.add(key));

    if (toLoad.includes("countries")) {
      api.get("countries").then((rows) => {
        setCountries(Array.isArray(rows) ? rows.map(countryFromApi) : []);
      }).catch(() => {});
    }
    if (toLoad.includes("customers")) {
      api.get("customers").then((rows) => {
        setCustomers(Array.isArray(rows) ? rows.map(customerFromApi) : []);
      }).catch(() => {});
    }
    if (toLoad.includes("container-codes")) {
      api.get("container-codes").then((rows) => {
        setContainerCodes(Array.isArray(rows) ? rows.map(containerCodeFromApi) : []);
      }).catch(() => {});
    }
    if (toLoad.includes("packers")) {
      api.get("packers").then((rows) => {
        setPackers(Array.isArray(rows) ? rows.map(packerFromApi) : []);
      }).catch(() => {});
    }
    if (toLoad.includes("vessel-departures")) {
      api.get("vessel-departures").then((rows) => {
        setVesselDepartures(Array.isArray(rows) ? rows.map(vesselDepartureFromApi) : []);
      }).catch(() => {});
    }
    if (toLoad.includes("internal-accounts")) {
      api.get("internal-accounts").then((rows) => {
        setInternalAccounts(Array.isArray(rows) ? rows.map(internalAccountFromApi) : []);
      }).catch(() => {});
    }
    if (toLoad.includes("container-parks")) {
      api.get("container-parks").then((rows) => {
        const list = Array.isArray(rows) ? rows : (rows?.data ?? rows?.container_parks ?? []);
        const parsed = Array.isArray(list)
          ? list.map(containerParkFromApi).filter(Boolean)
          : [];
        setContainerParks(parsed);
      }).catch((err) => {
        if (typeof console !== "undefined") console.error("Failed to load container parks", err);
        setContainerParks([]);
      });
    }
    if (toLoad.includes("terminals")) {
      api.get("terminals").then((rows) => {
        setTerminals(Array.isArray(rows) ? rows.map(terminalFromApi) : []);
      }).catch(() => {});
    }
  }, [pathname]);

  // Backfill transactions for completed tickets, containers, and bulk pack tickets (initial load)
  useEffect(() => {
    setTransactions((prev) => {
      const newTransactions = [];
      const shrinkConfig = {
        defaultShrinkPercent,
        customerCommodityShrink,
        commodityTypes,
      };
      // Tickets (incoming/outgoing)
      for (const ticket of tickets) {
        if (ticket.status !== "completed") continue;
        const hasExisting = prev.some((t) => t.ticketId === ticket.id && (t.ticketType === "in" || t.ticketType === "out"));
        if (hasExisting) continue;
        const cmo = cmos.find((c) => c.id === ticket.cmoId);
        if (!cmo) continue;
        const commodity = commodities.find(
          (c) => c.id === (cmo?.commodityId || ticket.commodityId),
        );
        const created =
          ticket.type === "in"
            ? createIncomingTransactions(
                ticket,
                cmo,
                commodity,
                customers,
                internalAccounts,
                shrinkConfig,
              )
            : createOutgoingTransactions(
                ticket,
                cmo,
                commodity,
                customers,
                internalAccounts,
              );
        newTransactions.push(...created);
      }
      // Pack containers and bulk tickets
      for (const pack of packs) {
        const commodity = commodities.find((c) => c.id === pack.commodityId);
        if (pack.packType === "container" && Array.isArray(pack.containers)) {
          for (const container of pack.containers) {
            if (container.status !== "completed") continue;
            const ticketType = pack.importExport === "Import" ? "container-in" : "container-out";
            const hasExisting = prev.some(
              (t) => Number(t.ticketId) === Number(container.id) && t.ticketType === ticketType
            );
            if (hasExisting) continue;
            const created = createContainerPackTransactions(
              pack,
              container,
              commodity,
              customers,
              internalAccounts,
              shrinkConfig
            );
            newTransactions.push(...created);
          }
        }
        if (pack.packType === "bulk" && Array.isArray(pack.bulkTickets)) {
          for (const bulkTicket of pack.bulkTickets) {
            if (bulkTicket.status !== "completed") continue;
            const ticketType = pack.importExport === "Import" ? "bulk-in" : "bulk-out";
            const hasExisting = prev.some(
              (t) => Number(t.ticketId) === Number(bulkTicket.id) && t.ticketType === ticketType
            );
            if (hasExisting) continue;
            const created = createBulkPackTransactions(
              pack,
              bulkTicket,
              commodity,
              customers,
              internalAccounts,
              shrinkConfig
            );
            newTransactions.push(...created);
          }
        }
      }
      if (newTransactions.length === 0) return prev;
      return [...prev, ...newTransactions];
    });
  }, [
    tickets,
    packs,
    cmos,
    commodities,
    customers,
    internalAccounts,
    defaultShrinkPercent,
    customerCommodityShrink,
    commodityTypes,
  ]);

  // ─── TICKET OPERATIONS ──────────────────────────────────────────────────
  const addTicket = useCallback(
    (ticket) => {
      const newTicket = {
        ...ticket,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      setTickets((prev) => [...prev, newTicket]);

      // Create transactions if ticket is completed
      if (newTicket.status === "completed") {
        console.log("📝 Creating transactions for new ticket:", {
          ticketId: newTicket.id,
          ticketType: newTicket.type,
          cmoId: newTicket.cmoId,
        });

        const cmo = cmos.find((c) => c.id === newTicket.cmoId);
        const commodity = commodities.find(
          (c) => c.id === (cmo?.commodityId || newTicket.commodityId),
        );

        console.log("📦 Found CMO and commodity:", {
          hasCmo: !!cmo,
          cmoCustomerId: cmo?.customerId,
          hasCommodity: !!commodity,
          commodityShrinkAmount: commodity?.shrinkAmount,
        });

        if (cmo) {
          const shrinkConfig = {
            defaultShrinkPercent,
            customerCommodityShrink,
            commodityTypes,
          };
          const newTransactions =
            newTicket.type === "in"
              ? createIncomingTransactions(
                  newTicket,
                  cmo,
                  commodity,
                  customers,
                  internalAccounts,
                  shrinkConfig,
                )
              : createOutgoingTransactions(
                  newTicket,
                  cmo,
                  commodity,
                  customers,
                  internalAccounts,
                );

          console.log("✨ Transactions created:", newTransactions.length);

          if (newTransactions.length > 0) {
            setTransactions((prev) => [...prev, ...newTransactions]);
            console.log("✅ Transactions added to state");
          } else {
            console.warn("⚠️ No transactions created");
          }
        } else {
          console.warn("❌ CMO not found for ticket");
        }
      }

      return newTicket;
    },
    [
      cmos,
      commodities,
      defaultShrinkPercent,
      customerCommodityShrink,
      commodityTypes,
      customers,
      internalAccounts,
    ],
  );

  const updateTicket = useCallback(
    (id, updates) => {
      setTickets((prev) => {
        const oldTicket = prev.find((t) => t.id === id);
        const newTicket = { ...oldTicket, ...updates };

        // Handle transaction updates synchronously
        if (oldTicket && newTicket.status === "completed") {
          console.log("🔄 Updating ticket to completed:", {
            ticketId: newTicket.id,
            ticketType: newTicket.type,
            wasCompleted: oldTicket.status === "completed",
          });

          const cmo = cmos.find((c) => c.id === newTicket.cmoId);
          const commodity = commodities.find(
            (c) => c.id === (cmo?.commodityId || newTicket.commodityId),
          );

          if (cmo) {
            setTransactions((prevTrans) => {
              // If ticket wasn't previously completed, create new transactions
              if (oldTicket.status !== "completed") {
                console.log(
                  "🆕 Creating new transactions (ticket newly completed)",
                );
                const newTransactions =
                  newTicket.type === "in"
                    ? createIncomingTransactions(
                        newTicket,
                        cmo,
                        commodity,
                        customers,
                        internalAccounts,
                      )
                    : createOutgoingTransactions(
                        newTicket,
                        cmo,
                        commodity,
                        customers,
                        internalAccounts,
                      );
                return [...prevTrans, ...newTransactions];
              } else {
                // If ticket was already completed, sync transactions
                const oldWeight = calculateNetWeight(oldTicket);
                const newWeight = calculateNetWeight(newTicket);

                if (oldWeight !== newWeight) {
                  console.log("⚖️ Weight changed, creating adjustment");
                  const shrinkConfig = {
                    defaultShrinkPercent,
                    customerCommodityShrink,
                    commodityTypes,
                  };
                  const { transactionsToUpdate, newTransactions } =
                    createAdjustmentTransactions(
                      oldTicket,
                      newTicket,
                      cmo,
                      prevTrans,
                      commodity,
                      customers,
                      internalAccounts,
                      shrinkConfig,
                    );
                  const updated = prevTrans.map((t) => {
                    const toUpdate = transactionsToUpdate.find(
                      (u) => u.id === t.id,
                    );
                    return toUpdate || t;
                  });
                  return [...updated, ...newTransactions];
                } else {
                  // Check metadata changes
                  console.log("ℹ️ Checking metadata changes");
                  return updateTransactionsForTicketMetadata(
                    newTicket,
                    cmo,
                    prevTrans,
                    customers,
                    internalAccounts,
                  );
                }
              }
            });
          }
        }

        return prev.map((t) => (t.id === id ? newTicket : t));
      });
    },
    [
      cmos,
      commodities,
      defaultShrinkPercent,
      customerCommodityShrink,
      commodityTypes,
      customers,
      internalAccounts,
    ],
  );

  const deleteTicket = useCallback(
    (id) => {
      const ticket = tickets.find((t) => t.id === id);

      // Create reversal transactions if ticket is completed
      if (ticket && ticket.status === "completed") {
        const cmo = cmos.find((c) => c.id === ticket.cmoId);
        if (cmo) {
          setTransactions((prevTrans) => {
            const { reversalTransactions, transactionsToUpdate } =
              createReversalTransactions(ticket, cmo, prevTrans);

            // Update reversed transactions
            let updated = prevTrans.map((t) => {
              const toUpdate = transactionsToUpdate.find((u) => u.id === t.id);
              return toUpdate || t;
            });

            // Add reversal transactions
            return [...updated, ...reversalTransactions];
          });
        }
      }

      setTickets((prev) => prev.filter((t) => t.id !== id));
    },
    [tickets, cmos],
  );

  const getTicketById = useCallback(
    (id) => tickets.find((t) => t.id === id),
    [tickets],
  );

  // ─── PACK OPERATIONS (Packing Schedule) ───────────────────────────────────
  const addPack = useCallback((pack) => {
    const newPack = {
      ...pack,
      id: genPackId(),
      createdAt: new Date().toISOString(),
    };
    setPacks((prev) => [...prev, newPack]);
    return newPack;
  }, []);

  const updatePack = useCallback((id, updates) => {
    setPacks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  }, []);

  const deletePack = useCallback((id) => {
    setPacks((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getPackById = useCallback(
    (id) => packs.find((p) => p.id === id),
    [packs],
  );

  const startPackJob = useCallback((packId) => {
    setPacks((prev) =>
      prev.map((p) =>
        p.id === packId ? { ...p, status: "Inprogress" } : p,
      ),
    );
  }, []);

  const updatePackVerification = useCallback((packId, verification) => {
    setPacks((prev) =>
      prev.map((p) =>
        p.id === packId ? { ...p, verification: { ...p.verification, ...verification } } : p,
      ),
    );
  }, []);

  const addContainerToPack = useCallback((packId, container) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        const containers = Array.isArray(p.containers) ? p.containers : [];
        const newContainer = {
          ...container,
          id: container.id != null ? container.id : genContainerId(),
        };
        return { ...p, containers: [...containers, newContainer] };
      }),
    );
  }, []);

  const ensurePackContainerSlots = useCallback((packId) => {
    const pack = packs.find((p) => p.id === packId);
    if (!pack) return;
    const required = pack.containersRequired ?? 0;
    if (required <= 0) return;
    const current = Array.isArray(pack.containers) ? pack.containers : [];
    const toAdd = required - current.length;
    if (toAdd <= 0) return;
    const blankContainer = () => ({
      id: genContainerId(),
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
    });
    const newContainers = Array.from({ length: toAdd }, blankContainer);
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        const containers = Array.isArray(p.containers) ? p.containers : [];
        return { ...p, containers: [...containers, ...newContainers] };
      }),
    );
  }, [packs]);

  const updateContainerInPack = useCallback(
    (packId, containerId, updates) => {
      const pack = packs.find((p) => p.id === packId);
      const oldContainer = pack?.containers?.find((c) => c.id === containerId);
      const newContainer = oldContainer ? { ...oldContainer, ...updates } : null;

      setPacks((prev) =>
        prev.map((p) => {
          if (p.id !== packId) return p;
          const containers = (p.containers || []).map((c) =>
            c.id === containerId ? { ...c, ...updates } : c
          );
          return { ...p, containers };
        })
      );

      if (!newContainer || !pack) return;

      const commodity = commodities.find((c) => c.id === pack.commodityId);
      const shrinkConfig = {
        defaultShrinkPercent,
        customerCommodityShrink,
        commodityTypes,
      };

      if (oldContainer?.status === "completed" && newContainer.status === "completed") {
        setTransactions((prev) => {
          const { transactionsToUpdate, newTransactions } =
            createContainerPackAdjustmentTransactions(
              oldContainer,
              newContainer,
              pack,
              prev,
              commodity,
              customers,
              internalAccounts,
              shrinkConfig
            );
          if (transactionsToUpdate.length === 0 && newTransactions.length === 0)
            return prev;
          const updated = prev.map((t) => {
            const u = transactionsToUpdate.find((x) => x.id === t.id);
            return u || t;
          });
          return [...updated, ...newTransactions];
        });
        return;
      }

      if (newContainer.status === "completed" && (!oldContainer || oldContainer.status !== "completed")) {
        const newTransactions = createContainerPackTransactions(
          pack,
          newContainer,
          commodity,
          customers,
          internalAccounts,
          shrinkConfig
        );
        if (newTransactions.length > 0) {
          setTransactions((prev) => [...prev, ...newTransactions]);
        }
      }
    },
    [
      packs,
      commodities,
      defaultShrinkPercent,
      customerCommodityShrink,
      commodityTypes,
      customers,
      internalAccounts,
    ]
  );

  const deleteContainerFromPack = useCallback(
    (packId, containerId) => {
      const pack = packs.find((p) => p.id === packId);
      const container = pack?.containers?.find((c) => c.id === containerId);

      if (container?.status === "completed") {
        setTransactions((prev) => {
          const { reversalTransactions, transactionsToUpdate } =
            createContainerPackReversalTransactions(container, pack, prev);
          const updated = prev.map((t) => {
            const u = transactionsToUpdate.find((x) => x.id === t.id);
            return u || t;
          });
          return [...updated, ...reversalTransactions];
        });
      }

      setPacks((prev) =>
        prev.map((p) => {
          if (p.id !== packId) return p;
          const containers = (p.containers || []).filter((c) => c.id !== containerId);
          return { ...p, containers };
        })
      );
    },
    [packs]
  );

  const addBulkTicketToPack = useCallback((packId, bulkTicket) => {
    setPacks((prev) =>
      prev.map((p) => {
        if (p.id !== packId) return p;
        const bulkTickets = Array.isArray(p.bulkTickets) ? p.bulkTickets : [];
        const newTicket = {
          ...bulkTicket,
          id: bulkTicket.id != null ? bulkTicket.id : genBulkTicketId(),
        };
        return { ...p, bulkTickets: [...bulkTickets, newTicket] };
      }),
    );
  }, []);

  const updateBulkTicketInPack = useCallback(
    (packId, bulkTicketId, updates) => {
      const pack = packs.find((p) => p.id === packId);
      const oldBt = pack?.bulkTickets?.find((bt) => bt.id === bulkTicketId);
      const newBt = oldBt ? { ...oldBt, ...updates } : null;

      setPacks((prev) =>
        prev.map((p) => {
          if (p.id !== packId) return p;
          const bulkTickets = (p.bulkTickets || []).map((bt) =>
            bt.id === bulkTicketId ? { ...bt, ...updates } : bt
          );
          return { ...p, bulkTickets };
        })
      );

      if (!newBt || !pack) return;

      const commodity = commodities.find((c) => c.id === pack.commodityId);
      const shrinkConfig = {
        defaultShrinkPercent,
        customerCommodityShrink,
        commodityTypes,
      };

      if (oldBt?.status === "completed" && newBt.status === "completed") {
        setTransactions((prev) => {
          const { transactionsToUpdate, newTransactions } =
            createBulkPackAdjustmentTransactions(
              oldBt,
              newBt,
              pack,
              prev,
              commodity,
              customers,
              internalAccounts,
              shrinkConfig
            );
          if (transactionsToUpdate.length === 0 && newTransactions.length === 0)
            return prev;
          const updated = prev.map((t) => {
            const u = transactionsToUpdate.find((x) => x.id === t.id);
            return u || t;
          });
          return [...updated, ...newTransactions];
        });
        return;
      }

      if (newBt.status === "completed" && (!oldBt || oldBt.status !== "completed")) {
        const newTransactions = createBulkPackTransactions(
          pack,
          newBt,
          commodity,
          customers,
          internalAccounts,
          shrinkConfig
        );
        if (newTransactions.length > 0) {
          setTransactions((prev) => [...prev, ...newTransactions]);
        }
      }
    },
    [
      packs,
      commodities,
      defaultShrinkPercent,
      customerCommodityShrink,
      commodityTypes,
      customers,
      internalAccounts,
    ]
  );

  const deleteBulkTicketFromPack = useCallback(
    (packId, bulkTicketId) => {
      const pack = packs.find((p) => p.id === packId);
      const bt = pack?.bulkTickets?.find((t) => t.id === bulkTicketId);

      if (bt?.status === "completed") {
        setTransactions((prev) => {
          const { reversalTransactions, transactionsToUpdate } =
            createBulkPackReversalTransactions(bt, pack, prev);
          const updated = prev.map((t) => {
            const u = transactionsToUpdate.find((x) => x.id === t.id);
            return u || t;
          });
          return [...updated, ...reversalTransactions];
        });
      }

      setPacks((prev) =>
        prev.map((p) => {
          if (p.id !== packId) return p;
          const bulkTickets = (p.bulkTickets || []).filter((t) => t.id !== bulkTicketId);
          return { ...p, bulkTickets };
        })
      );
    },
    [packs]
  );

  // ─── CMO OPERATIONS ─────────────────────────────────────────────────────
  const addCmo = useCallback((cmo) => {
    setCmos((prev) => [
      ...prev,
      { ...cmo, id: genId(), cmoReference: genCmoRef(), bookings: [] },
    ]);
  }, []);

  const updateCmo = useCallback((id, updates) => {
    setCmos((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }, []);

  const getCmoById = useCallback((id) => cmos.find((c) => c.id === id), [cmos]);

  const addBooking = useCallback((cmoId, booking) => {
    setCmos((prev) =>
      prev.map((c) =>
        c.id === cmoId
          ? { ...c, bookings: [...c.bookings, { ...booking, id: genId() }] }
          : c,
      ),
    );
  }, []);

  const updateBooking = useCallback((cmoId, bookingId, updates) => {
    setCmos((prev) =>
      prev.map((c) =>
        c.id === cmoId
          ? {
              ...c,
              bookings: c.bookings.map((b) =>
                b.id === bookingId ? { ...b, ...updates } : b,
              ),
            }
          : c,
      ),
    );
  }, []);

  const deleteBooking = useCallback((cmoId, bookingId) => {
    setCmos((prev) =>
      prev.map((c) =>
        c.id === cmoId
          ? { ...c, bookings: c.bookings.filter((b) => b.id !== bookingId) }
          : c,
      ),
    );
  }, []);

  // ─── TRUCK OPERATIONS ───────────────────────────────────────────────────
  const addTruck = useCallback((truck) => {
    setTrucks((prev) => [...prev, { ...truck, id: genId() }]);
  }, []);

  // ─── CUSTOMER OPERATIONS ────────────────────────────────────────────────
  const addCustomer = useCallback((customer) => {
    if (isApiConfigured()) {
      api.post("customers", customerToApi(customer))
        .then((row) => {
          setCustomers((prev) => [...prev, customerFromApi(row)]);
        })
        .catch((err) => {
          console.error("Failed to add customer", err);
          setCustomers((prev) => [...prev, { ...customer, id: genId() }]);
        });
    } else {
      setCustomers((prev) => [...prev, { ...customer, id: genId() }]);
    }
  }, []);

  const updateCustomer = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api.put(`customers/${id}`, customerToApi(updates))
        .then((row) => {
          setCustomers((prev) =>
            prev.map((c) => (c.id === id ? customerFromApi(row) : c)),
          );
        })
        .catch((err) => {
          console.error("Failed to update customer", err);
          setCustomers((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          );
        });
    } else {
      setCustomers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    }
  }, []);

  const deleteCustomer = useCallback((id) => {
    if (isApiConfigured()) {
      api.delete(`customers/${id}`)
        .then(() => setCustomers((prev) => prev.filter((c) => c.id !== id)))
        .catch((err) => {
          console.error("Failed to delete customer", err);
          setCustomers((prev) => prev.filter((c) => c.id !== id));
        });
    } else {
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const getCustomerById = useCallback(
    (id) => customers.find((c) => c.id === id),
    [customers],
  );

  // ─── INTERNAL ACCOUNT OPERATIONS ────────────────────────────────────────
  const addInternalAccount = useCallback((account) => {
    if (isApiConfigured()) {
      api.post("internal-accounts", internalAccountToApi(account))
        .then((row) => {
          setInternalAccounts((prev) => [...prev, internalAccountFromApi(row)]);
        })
        .catch((err) => {
          console.error("Failed to add internal account", err);
          setInternalAccounts((prev) => [...prev, { ...account, id: genId() }]);
        });
    } else {
      setInternalAccounts((prev) => [...prev, { ...account, id: genId() }]);
    }
  }, []);

  const updateInternalAccount = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api.put(`internal-accounts/${id}`, internalAccountToApi(updates))
        .then((row) => {
          setInternalAccounts((prev) =>
            prev.map((a) => (a.id === id || a.id === Number(id) ? internalAccountFromApi(row) : a)),
          );
        })
        .catch((err) => {
          console.error("Failed to update internal account", err);
          setInternalAccounts((prev) => {
            if (updates.shrinkReceivalAccount === true) {
              return prev.map((a) =>
                a.id === id || a.id === Number(id)
                  ? { ...a, ...updates }
                  : { ...a, shrinkReceivalAccount: false },
              );
            }
            return prev.map((a) => (a.id === id || a.id === Number(id) ? { ...a, ...updates } : a));
          });
        });
    } else {
      if (updates.shrinkReceivalAccount === true) {
        setInternalAccounts((prev) =>
          prev.map((a) =>
            a.id === id ? { ...a, ...updates } : { ...a, shrinkReceivalAccount: false },
          ),
        );
      } else {
        setInternalAccounts((prev) =>
          prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        );
      }
    }
  }, []);

  const deleteInternalAccount = useCallback((id) => {
    if (isApiConfigured()) {
      api.delete(`internal-accounts/${id}`)
        .then(() => setInternalAccounts((prev) => prev.filter((a) => a.id !== id && a.id !== Number(id))))
        .catch((err) => {
          console.error("Failed to delete internal account", err);
          setInternalAccounts((prev) => prev.filter((a) => a.id !== id && a.id !== Number(id)));
        });
    } else {
      setInternalAccounts((prev) => prev.filter((a) => a.id !== id));
    }
  }, []);

  const getInternalAccountById = useCallback(
    (id) => internalAccounts.find((a) => a.id === id),
    [internalAccounts],
  );

  // ─── COMMODITY TYPE OPERATIONS ──────────────────────────────────────────
  const addCommodityType = useCallback((commodityType) => {
    setCommodityTypes((prev) => [...prev, { ...commodityType, id: genId() }]);
  }, []);

  const updateCommodityType = useCallback((id, updates) => {
    setCommodityTypes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }, []);

  const deleteCommodityType = useCallback((id) => {
    setCommodityTypes((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getCommodityTypeById = useCallback(
    (id) => commodityTypes.find((t) => t.id === id),
    [commodityTypes],
  );

  // ─── COMMODITY OPERATIONS ───────────────────────────────────────────────
  const addCommodity = useCallback((commodity) => {
    setCommodities((prev) => [...prev, { ...commodity, id: genId() }]);
  }, []);

  const updateCommodity = useCallback((id, updates) => {
    setCommodities((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }, []);

  const deleteCommodity = useCallback((id) => {
    setCommodities((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getCommodityById = useCallback(
    (id) => commodities.find((c) => c.id === id),
    [commodities],
  );

  // ─── TEST OPERATIONS ────────────────────────────────────────────────────
  const addTest = useCallback((test) => {
    setTests((prev) => [...prev, { ...test, id: genId() }]);
  }, []);

  const updateTest = useCallback((id, updates) => {
    setTests((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }, []);

  const deleteTest = useCallback((id) => {
    setTests((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTestById = useCallback(
    (id) => tests.find((t) => t.id === id),
    [tests],
  );

  // ─── SHRINK SETTINGS ──────────────────────────────────────────────────────
  const setDefaultShrinkPercentValue = useCallback((value) => {
    setDefaultShrinkPercent(value === "" || value === null ? 0 : Number(value));
  }, []);

  const addCustomerCommodityShrinkEntry = useCallback((entry) => {
    setCustomerCommodityShrink((prev) => [
      ...prev,
      {
        ...entry,
        id: genId(),
        customerId: Number(entry.customerId),
        commodityId: Number(entry.commodityId),
      },
    ]);
  }, []);

  const updateCustomerCommodityShrinkEntry = useCallback((id, updates) => {
    setCustomerCommodityShrink((prev) =>
      prev.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  }, []);

  const deleteCustomerCommodityShrinkEntry = useCallback((id) => {
    setCustomerCommodityShrink((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─── COMMODITY PRICING (default, commodity, commodity+customer) ──────────
  const addDefaultPackingPrice = useCallback((entry) => {
    setDefaultPackingPrices((prev) => [
      ...prev,
      {
        ...entry,
        id: genId(),
        commodityTypeId: Number(entry.commodityTypeId),
        containerSize: entry.containerSize,
        price: entry.price == null ? 0 : Number(entry.price),
      },
    ]);
  }, []);

  const updateDefaultPackingPrice = useCallback((id, updates) => {
    setDefaultPackingPrices((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              ...(updates.commodityTypeId != null && { commodityTypeId: Number(updates.commodityTypeId) }),
              ...(updates.price != null && { price: Number(updates.price) }),
            }
          : e,
      ),
    );
  }, []);

  const deleteDefaultPackingPrice = useCallback((id) => {
    setDefaultPackingPrices((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addCommodityPrice = useCallback((entry) => {
    setCommodityPrices((prev) => [
      ...prev,
      {
        ...entry,
        id: genId(),
        commodityId: Number(entry.commodityId),
        containerSize: entry.containerSize,
        price: entry.price == null ? 0 : Number(entry.price),
      },
    ]);
  }, []);

  const updateCommodityPrice = useCallback((id, updates) => {
    setCommodityPrices((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              ...(updates.commodityId != null && { commodityId: Number(updates.commodityId) }),
              ...(updates.containerSize != null && { containerSize: updates.containerSize }),
              ...(updates.price != null && { price: Number(updates.price) }),
            }
          : e,
      ),
    );
  }, []);

  const deleteCommodityPrice = useCallback((id) => {
    setCommodityPrices((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addCommodityCustomerPrice = useCallback((entry) => {
    setCommodityCustomerPrices((prev) => [
      ...prev,
      {
        ...entry,
        id: genId(),
        commodityId: Number(entry.commodityId),
        customerId: Number(entry.customerId),
        containerSize: entry.containerSize,
        price: entry.price == null ? 0 : Number(entry.price),
      },
    ]);
  }, []);

  const updateCommodityCustomerPrice = useCallback((id, updates) => {
    setCommodityCustomerPrices((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              ...(updates.commodityId != null && { commodityId: Number(updates.commodityId) }),
              ...(updates.customerId != null && { customerId: Number(updates.customerId) }),
              ...(updates.containerSize != null && { containerSize: updates.containerSize }),
              ...(updates.price != null && { price: Number(updates.price) }),
            }
          : e,
      ),
    );
  }, []);

  const deleteCommodityCustomerPrice = useCallback((id) => {
    setCommodityCustomerPrices((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const addCommodityTypeCustomerPrice = useCallback((entry) => {
    setCommodityTypeCustomerPrices((prev) => [
      ...prev,
      {
        ...entry,
        id: genId(),
        commodityTypeId: Number(entry.commodityTypeId),
        customerId: Number(entry.customerId),
        containerSize: entry.containerSize,
        price: entry.price == null ? 0 : Number(entry.price),
      },
    ]);
  }, []);

  const updateCommodityTypeCustomerPrice = useCallback((id, updates) => {
    setCommodityTypeCustomerPrices((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              ...(updates.commodityTypeId != null && {
                commodityTypeId: Number(updates.commodityTypeId),
              }),
              ...(updates.customerId != null && {
                customerId: Number(updates.customerId),
              }),
              ...(updates.containerSize != null && {
                containerSize: updates.containerSize,
              }),
              ...(updates.price != null && { price: Number(updates.price) }),
            }
          : e,
      ),
    );
  }, []);

  const deleteCommodityTypeCustomerPrice = useCallback((id) => {
    setCommodityTypeCustomerPrices((prev) =>
      prev.filter((e) => e.id !== id),
    );
  }, []);

  /** Resolve effective price: Commodity+Customer → CommodityType+Customer → Commodity → Default (by type) → null */
  const getEffectiveCommodityPrice = useCallback(
    (commodityId, customerId, containerSize) => {
      const commodity = commodities.find((c) => c.id === commodityId);
      if (!commodity) return null;
      const cc = commodityCustomerPrices.find(
        (e) =>
          e.commodityId === commodityId &&
          e.customerId === customerId &&
          e.containerSize === containerSize,
      );
      if (cc != null && cc.price != null) return cc.price;
      const ctcp = commodityTypeCustomerPrices.find(
        (e) =>
          e.commodityTypeId === commodity.commodityTypeId &&
          e.customerId === customerId &&
          e.containerSize === containerSize,
      );
      if (ctcp != null && ctcp.price != null) return ctcp.price;
      const cp = commodityPrices.find(
        (e) => e.commodityId === commodityId && e.containerSize === containerSize,
      );
      if (cp != null && cp.price != null) return cp.price;
      const dp = defaultPackingPrices.find(
        (e) =>
          e.commodityTypeId === commodity.commodityTypeId &&
          e.containerSize === containerSize,
      );
      if (dp != null && dp.price != null) return dp.price;
      return null;
    },
    [
      commodities,
      commodityCustomerPrices,
      commodityTypeCustomerPrices,
      commodityPrices,
      defaultPackingPrices,
    ],
  );

  // ─── TRANSPORTER OPERATIONS ──────────────────────────────────────────────
  const addTransporter = useCallback((transporter) => {
    setTransporters((prev) => [...prev, { ...transporter, id: genId() }]);
  }, []);

  const updateTransporter = useCallback((id, updates) => {
    setTransporters((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }, []);

  const deleteTransporter = useCallback((id) => {
    setTransporters((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTransporterById = useCallback(
    (id) => transporters.find((t) => t.id === id),
    [transporters],
  );

  // ─── TRANSPORTER TRANSPORT PRICES ────────────────────────────────────────
  const addTransporterTransportPrice = useCallback((entry) => {
    setTransporterTransportPrices((prev) => [
      ...prev,
      {
        ...entry,
        id: genId(),
        transporterId: Number(entry.transporterId),
        containerSize: entry.containerSize,
        price: entry.price == null ? 0 : Number(entry.price),
        lineItemDescription: entry.lineItemDescription ?? "",
      },
    ]);
  }, []);

  const updateTransporterTransportPrice = useCallback((id, updates) => {
    setTransporterTransportPrices((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              ...updates,
              ...(updates.transporterId != null && {
                transporterId: Number(updates.transporterId),
              }),
              ...(updates.containerSize != null && {
                containerSize: updates.containerSize,
              }),
              ...(updates.price != null && { price: Number(updates.price) }),
              ...(updates.lineItemDescription != null && {
                lineItemDescription: String(updates.lineItemDescription),
              }),
            }
          : e,
      ),
    );
  }, []);

  const deleteTransporterTransportPrice = useCallback((id) => {
    setTransporterTransportPrices((prev) => prev.filter((e) => e.id !== id));
  }, []);

  // ─── CMO STATUS OPERATIONS ──────────────────────────────────────────────
  const addCmoStatus = useCallback((status) => {
    setCmoStatuses((prev) => [...prev, { ...status, id: genId() }]);
  }, []);

  const updateCmoStatus = useCallback((id, updates) => {
    setCmoStatuses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  }, []);

  const deleteCmoStatus = useCallback((id) => {
    setCmoStatuses((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // ─── STOCK LOCATION OPERATIONS ──────────────────────────────────────────
  const addStockLocation = useCallback((location) => {
    setStockLocations((prev) => [...prev, { ...location, id: genId() }]);
  }, []);

  const updateStockLocation = useCallback((id, updates) => {
    setStockLocations((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  }, []);

  const deleteStockLocation = useCallback((id) => {
    setStockLocations((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getStockLocationById = useCallback(
    (id) => stockLocations.find((l) => l.id === id),
    [stockLocations],
  );

  // ─── SHIPPING LINE OPERATIONS ───────────────────────────────────────────
  const addShippingLine = useCallback((line) => {
    setShippingLines((prev) => [...prev, { ...line, id: genId() }]);
  }, []);

  const updateShippingLine = useCallback((id, updates) => {
    setShippingLines((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l)),
    );
  }, []);

  const deleteShippingLine = useCallback((id) => {
    setShippingLines((prev) => prev.filter((l) => l.id !== id));
  }, []);

  const getShippingLineById = useCallback(
    (id) => shippingLines.find((l) => l.id === id),
    [shippingLines],
  );

  // ─── FEES AND CHARGES OPERATIONS ───────────────────────────────────────
  const addFeesAndCharge = useCallback((charge) => {
    setFeesAndCharges((prev) => [...prev, { ...charge, id: genId() }]);
  }, []);

  const updateFeesAndCharge = useCallback((id, updates) => {
    setFeesAndCharges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  }, []);

  const deleteFeesAndCharge = useCallback((id) => {
    setFeesAndCharges((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const getFeesAndChargeById = useCallback(
    (id) => feesAndCharges.find((c) => c.id === id),
    [feesAndCharges],
  );

  // ─── CONTAINER PARK OPERATIONS ──────────────────────────────────────────
  const addContainerPark = useCallback((park) => {
    if (isApiConfigured()) {
      api
        .post("container-parks", containerParkToApi(park))
        .then((row) => {
          setContainerParks((prev) => [...prev, containerParkFromApi(row)]);
        })
        .catch((err) => alert(err?.message || "Failed to add container park"));
      return;
    }
    setContainerParks((prev) => [...prev, { ...park, id: genId() }]);
  }, []);

  const updateContainerPark = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api
        .put(`container-parks/${id}`, containerParkToApi({ ...updates }))
        .then((row) => {
          setContainerParks((prev) =>
            prev.map((p) => (p.id === id ? containerParkFromApi(row) : p)),
          );
        })
        .catch((err) => alert(err?.message || "Failed to update container park"));
      return;
    }
    setContainerParks((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    );
  }, []);

  const deleteContainerPark = useCallback((id) => {
    if (isApiConfigured()) {
      api
        .delete(`container-parks/${id}`)
        .then(() => {
          setContainerParks((prev) => prev.filter((p) => p.id !== id));
        })
        .catch((err) => alert(err?.message || "Failed to delete container park"));
      return;
    }
    setContainerParks((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const getContainerParkById = useCallback(
    (id) => containerParks.find((p) => p.id === id),
    [containerParks],
  );

  // ─── TERMINAL OPERATIONS ─────────────────────────────────────────────────
  const addTerminal = useCallback((terminal) => {
    if (isApiConfigured()) {
      api
        .post("terminals", terminalToApi(terminal))
        .then((row) => {
          setTerminals((prev) => [...prev, terminalFromApi(row)]);
        })
        .catch((err) => alert(err?.message || "Failed to add terminal"));
      return;
    }
    setTerminals((prev) => [...prev, { ...terminal, id: genId() }]);
  }, []);

  const updateTerminal = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api
        .put(`terminals/${id}`, terminalToApi({ ...updates }))
        .then((row) => {
          setTerminals((prev) =>
            prev.map((t) => (t.id === id ? terminalFromApi(row) : t)),
          );
        })
        .catch((err) => alert(err?.message || "Failed to update terminal"));
      return;
    }
    setTerminals((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  }, []);

  const deleteTerminal = useCallback((id) => {
    if (isApiConfigured()) {
      api
        .delete(`terminals/${id}`)
        .then(() => {
          setTerminals((prev) => prev.filter((t) => t.id !== id));
        })
        .catch((err) => alert(err?.message || "Failed to delete terminal"));
      return;
    }
    setTerminals((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getTerminalById = useCallback(
    (id) => terminals.find((t) => t.id === id),
    [terminals],
  );

  // ─── CONTAINER CODE OPERATIONS ──────────────────────────────────────────
  const addContainerCode = useCallback((code) => {
    if (isApiConfigured()) {
      api.post("container-codes", containerCodeToApi(code))
        .then((row) => {
          setContainerCodes((prev) => [...prev, containerCodeFromApi(row)]);
        })
        .catch((err) => {
          console.error("Failed to add container code", err);
          setContainerCodes((prev) => [...prev, { ...code, id: genId() }]);
        });
    } else {
      setContainerCodes((prev) => [...prev, { ...code, id: genId() }]);
    }
  }, []);

  const updateContainerCode = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api.put(`container-codes/${id}`, containerCodeToApi(updates))
        .then((row) => {
          setContainerCodes((prev) =>
            prev.map((c) => (c.id === id ? containerCodeFromApi(row) : c)),
          );
        })
        .catch((err) => {
          console.error("Failed to update container code", err);
          setContainerCodes((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          );
        });
    } else {
      setContainerCodes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    }
  }, []);

  const deleteContainerCode = useCallback((id) => {
    if (isApiConfigured()) {
      api.delete(`container-codes/${id}`)
        .then(() => setContainerCodes((prev) => prev.filter((c) => c.id !== id)))
        .catch((err) => {
          console.error("Failed to delete container code", err);
          setContainerCodes((prev) => prev.filter((c) => c.id !== id));
        });
    } else {
      setContainerCodes((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const getContainerCodeById = useCallback(
    (id) => containerCodes.find((c) => c.id === id),
    [containerCodes],
  );

  // ─── PACKER OPERATIONS ──────────────────────────────────────────────────
  const addPacker = useCallback((packer) => {
    if (isApiConfigured()) {
      api.post("packers", packerToApi(packer))
        .then((row) => {
          setPackers((prev) => [...prev, packerFromApi(row)]);
        })
        .catch((err) => {
          console.error("Failed to add packer", err);
          setPackers((prev) => [...prev, { ...packer, id: genId() }]);
        });
    } else {
      setPackers((prev) => [...prev, { ...packer, id: genId() }]);
    }
  }, []);

  const updatePacker = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api.put(`packers/${id}`, packerToApi(updates))
        .then((row) => {
          setPackers((prev) =>
            prev.map((p) => (p.id === id ? packerFromApi(row) : p)),
          );
        })
        .catch((err) => {
          console.error("Failed to update packer", err);
          setPackers((prev) =>
            prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
          );
        });
    } else {
      setPackers((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      );
    }
  }, []);

  const deletePacker = useCallback((id) => {
    if (isApiConfigured()) {
      api.delete(`packers/${id}`)
        .then(() => setPackers((prev) => prev.filter((p) => p.id !== id)))
        .catch((err) => {
          console.error("Failed to delete packer", err);
          setPackers((prev) => prev.filter((p) => p.id !== id));
        });
    } else {
      setPackers((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  const getPackerById = useCallback(
    (id) => packers.find((p) => p.id === id),
    [packers],
  );

  // ─── COUNTRY OPERATIONS ─────────────────────────────────────────────────
  const addCountry = useCallback((country) => {
    if (isApiConfigured()) {
      api.post("countries", countryToApi(country))
        .then((row) => {
          setCountries((prev) => [...prev, countryFromApi(row)]);
        })
        .catch((err) => {
          console.error("Failed to add country", err);
          setCountries((prev) => [...prev, { ...country, id: genId() }]);
        });
    } else {
      setCountries((prev) => [...prev, { ...country, id: genId() }]);
    }
  }, []);

  const updateCountry = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api.put(`countries/${id}`, countryToApi(updates))
        .then((row) => {
          setCountries((prev) =>
            prev.map((c) => (c.id === id ? countryFromApi(row) : c)),
          );
        })
        .catch((err) => {
          console.error("Failed to update country", err);
          setCountries((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
          );
        });
    } else {
      setCountries((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
    }
  }, []);

  const deleteCountry = useCallback((id) => {
    if (isApiConfigured()) {
      api.delete(`countries/${id}`)
        .then(() => setCountries((prev) => prev.filter((c) => c.id !== id)))
        .catch((err) => {
          console.error("Failed to delete country", err);
          setCountries((prev) => prev.filter((c) => c.id !== id));
        });
    } else {
      setCountries((prev) => prev.filter((c) => c.id !== id));
    }
  }, []);

  const getCountryById = useCallback(
    (id) => countries.find((c) => c.id === id),
    [countries],
  );

  // ─── TRANSACTION OPERATIONS ─────────────────────────────────────────────
  const getTransactionsByTicket = useCallback(
    (ticketId) => getTicketTransactions(ticketId, transactions),
    [transactions],
  );

  const getAccountTransactions = useCallback(
    (accountId) => getAccountLedger(accountId, transactions),
    [transactions],
  );

  const calculateAccountBalance = useCallback(
    (accountId, commodityId = null) =>
      getAccountBalance(accountId, transactions, commodityId),
    [transactions],
  );

  const calculateLocationStock = useCallback(
    (locationId, commodityTypeId = null) =>
      getLocationStock(locationId, transactions, commodityTypeId),
    [transactions],
  );

  // ─── USER OPERATIONS ────────────────────────────────────────────────────
  const addUser = useCallback((user) => {
    setUsers((prev) => [...prev, { ...user, id: genId() }]);
  }, []);

  const updateUser = useCallback((id, updates) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, ...updates } : u)),
    );
  }, []);

  const deleteUser = useCallback((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    // Also remove their permissions
    setUserPermissions((prev) => prev.filter((up) => up.userId !== id));
  }, []);

  const getUserById = useCallback(
    (id) => users.find((u) => u.id === id),
    [users],
  );

  // ─── PERMISSION OPERATIONS ──────────────────────────────────────────────
  const getUserPermissions = useCallback(
    (userId) => {
      const userPerms = userPermissions.find((up) => up.userId === userId);
      return userPerms ? userPerms.permissions : [];
    },
    [userPermissions],
  );

  const updateUserPermissions = useCallback((userId, permissionsList) => {
    setUserPermissions((prev) => {
      const existing = prev.find((up) => up.userId === userId);
      if (existing) {
        return prev.map((up) =>
          up.userId === userId ? { ...up, permissions: permissionsList } : up,
        );
      } else {
        return [...prev, { userId, permissions: permissionsList }];
      }
    });
  }, []);

  const loadVesselScheduleFromCsv = useCallback((csvText) => {
    const rows = parseVesselScheduleCsv(csvText);
    setVesselSchedule(rows);
    if (rows.length > 0) {
      setVesselDepartures((prev) => {
        const byKey = new Map(
          prev.map((v) => [`${v.vessel}|${v.voyageNumber}`, v]),
        );
        for (const row of rows) {
          const key = `${(row.shipName || "").trim()}|${(row.voyageOut || "").trim()}`;
          if (!key || key === "|") continue;
          if (!byKey.has(key)) {
            const newId = genVesselDepartureId();
            byKey.set(key, {
              id: newId,
              vessel: row.shipName?.trim() || "",
              voyageNumber: row.voyageOut || "",
              vesselLloyds: (row.lloydsId || "").replace(/^\./, ""),
              vesselCutoffDate: vesselDateTimeToDateOnly(row.cargoCutoffDate),
              vesselReceivalsOpenDate: vesselDateTimeToDateOnly(
                row.exportReceivalCommencementDate,
              ),
              vesselEta: formatVesselDateTime(row.eta),
              vesselEtd: formatVesselDateTime(row.etd),
              vesselFreeDays: null,
              shippingLineId: null,
            });
          }
        }
        const existingIds = new Set(prev.map((p) => p.id));
        const added = Array.from(byKey.values()).filter(
          (v) => !existingIds.has(v.id),
        );
        return added.length > 0 ? [...prev, ...added] : prev;
      });
    }
    return rows.length;
  }, []);

  const addVesselDeparture = useCallback((departure) => {
    if (isApiConfigured()) {
      api.post("vessel-departures", vesselDepartureToApi(departure))
        .then((row) => {
          setVesselDepartures((prev) => [...prev, vesselDepartureFromApi(row)]);
        })
        .catch((err) => {
          console.error("Failed to add vessel departure", err);
          setVesselDepartures((prev) => [
            ...prev,
            { ...departure, id: genVesselDepartureId() },
          ]);
        });
    } else {
      const newDep = { ...departure, id: genVesselDepartureId() };
      setVesselDepartures((prev) => [...prev, newDep]);
    }
  }, []);

  const updateVesselDeparture = useCallback((id, updates) => {
    if (isApiConfigured()) {
      api.put(`vessel-departures/${id}`, vesselDepartureToApi(updates))
        .then((row) => {
          setVesselDepartures((prev) =>
            prev.map((v) => (v.id === id ? vesselDepartureFromApi(row) : v)),
          );
        })
        .catch((err) => {
          console.error("Failed to update vessel departure", err);
          setVesselDepartures((prev) =>
            prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
          );
        });
    } else {
      setVesselDepartures((prev) =>
        prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
      );
    }
  }, []);

  const getVesselDepartureById = useCallback(
    (id) => vesselDepartures.find((v) => v.id === id) ?? null,
    [vesselDepartures],
  );

  const deleteVesselDeparture = useCallback((id) => {
    if (isApiConfigured()) {
      api.delete(`vessel-departures/${id}`)
        .then(() => {
          setVesselDepartures((prev) => prev.filter((v) => v.id !== id));
          setPacks((prev) =>
            prev.map((p) =>
              p.vesselDepartureId === id ? { ...p, vesselDepartureId: null } : p,
            ),
          );
        })
        .catch((err) => {
          console.error("Failed to delete vessel departure", err);
          setVesselDepartures((prev) => prev.filter((v) => v.id !== id));
          setPacks((prev) =>
            prev.map((p) =>
              p.vesselDepartureId === id ? { ...p, vesselDepartureId: null } : p,
            ),
          );
        });
    } else {
      setVesselDepartures((prev) => prev.filter((v) => v.id !== id));
      setPacks((prev) =>
        prev.map((p) =>
          p.vesselDepartureId === id ? { ...p, vesselDepartureId: null } : p,
        ),
      );
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        tickets,
        packs,
        cmos,
        trucks,
        customers,
        internalAccounts,
        commodityTypes,
        commodities,
        tests,
        cmoStatuses,
        stockLocations,
        users,
        userPermissions,
        permissions,
        currentSite,
        transactions,
        setCurrentSite,
        addTicket,
        updateTicket,
        deleteTicket,
        getTicketById,
        addPack,
        updatePack,
        deletePack,
        getPackById,
        startPackJob,
        updatePackVerification,
        addContainerToPack,
        ensurePackContainerSlots,
        updateContainerInPack,
        deleteContainerFromPack,
        addBulkTicketToPack,
        updateBulkTicketInPack,
        deleteBulkTicketFromPack,
        addCmo,
        updateCmo,
        getCmoById,
        addBooking,
        updateBooking,
        deleteBooking,
        addTruck,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        getCustomerById,
        addInternalAccount,
        updateInternalAccount,
        deleteInternalAccount,
        getInternalAccountById,
        addCommodityType,
        updateCommodityType,
        deleteCommodityType,
        getCommodityTypeById,
        addCommodity,
        updateCommodity,
        deleteCommodity,
        getCommodityById,
        addTest,
        updateTest,
        deleteTest,
        getTestById,
        addCmoStatus,
        updateCmoStatus,
        deleteCmoStatus,
        addStockLocation,
        updateStockLocation,
        deleteStockLocation,
        getStockLocationById,
        shippingLines,
        addShippingLine,
        updateShippingLine,
        deleteShippingLine,
        getShippingLineById,
        feesAndCharges,
        addFeesAndCharge,
        updateFeesAndCharge,
        deleteFeesAndCharge,
        getFeesAndChargeById,
        containerParks,
        addContainerPark,
        updateContainerPark,
        deleteContainerPark,
        getContainerParkById,
        terminals,
        addTerminal,
        updateTerminal,
        deleteTerminal,
        getTerminalById,
        containerCodes,
        addContainerCode,
        updateContainerCode,
        deleteContainerCode,
        getContainerCodeById,
        packers,
        addPacker,
        updatePacker,
        deletePacker,
        getPackerById,
        countries,
        addCountry,
        updateCountry,
        deleteCountry,
        getCountryById,
        addUser,
        updateUser,
        deleteUser,
        getUserById,
        getUserPermissions,
        updateUserPermissions,
        vesselSchedule,
        setVesselSchedule,
        loadVesselScheduleFromCsv,
        vesselDepartures,
        addVesselDeparture,
        updateVesselDeparture,
        deleteVesselDeparture,
        getVesselDepartureById,
        getTransactionsByTicket,
        getAccountTransactions,
        calculateAccountBalance,
        calculateLocationStock,
        calculateNetWeight,
        calculateGrossWeight,
        calculateShrinkage,
        getEffectiveShrinkPercent,
        defaultShrinkPercent,
        setDefaultShrinkPercent: setDefaultShrinkPercentValue,
        customerCommodityShrink,
        addCustomerCommodityShrinkEntry,
        updateCustomerCommodityShrinkEntry,
        deleteCustomerCommodityShrinkEntry,
        defaultPackingPrices,
        commodityPrices,
        commodityTypeCustomerPrices,
        addCommodityTypeCustomerPrice,
        updateCommodityTypeCustomerPrice,
        deleteCommodityTypeCustomerPrice,
        commodityCustomerPrices,
        addDefaultPackingPrice,
        updateDefaultPackingPrice,
        deleteDefaultPackingPrice,
        addCommodityPrice,
        updateCommodityPrice,
        deleteCommodityPrice,
        addCommodityCustomerPrice,
        updateCommodityCustomerPrice,
        deleteCommodityCustomerPrice,
        getEffectiveCommodityPrice,
        transporters,
        addTransporter,
        updateTransporter,
        deleteTransporter,
        getTransporterById,
        transporterTransportPrices,
        addTransporterTransportPrice,
        updateTransporterTransportPrice,
        deleteTransporterTransportPrice,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
