"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Navbar, BtnSecondary } from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

const TABS = [
  { id: "detail", label: "Detail" },
  { id: "byAccount", label: "By Account" },
  { id: "byCommodity", label: "By Commodity" },
  { id: "byLocation", label: "By Location" },
  { id: "pivot", label: "Pivot" },
];

export default function StockOnHandPage() {
  const router = useRouter();
  const {
    transactions,
    customers,
    internalAccounts,
    commodities,
    stockLocations,
    currentSite,
    setCurrentSite,
  } = useApp();

  const [filterCustomer, setFilterCustomer] = useState("");
  const [filterCommodity, setFilterCommodity] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [showInternalAccounts, setShowInternalAccounts] = useState(true);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [activeTab, setActiveTab] = useState("detail");
  const [expandedGroups, setExpandedGroups] = useState({});

  const toggleExpanded = (key) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // ─── AGGREGATION LOGIC ──────────────────────────────────────────────────────
  const stockData = useMemo(() => {
    const { aggregateStock } = require("../utils/stockUtils");
    let result = aggregateStock(
      transactions,
      customers,
      internalAccounts,
      commodities,
      stockLocations,
      currentSite
    );

    if (!showInternalAccounts) {
      result = result.filter((a) => a.type === "customer");
    }

    if (filterCustomer) {
      result = result.filter((a) => a.key === filterCustomer);
    }

    result.forEach((acc) => {
      if (filterCommodity) {
        const commId = Number(filterCommodity);
        const keptComm = acc.commodities[commId];
        acc.commodities = keptComm ? { [commId]: keptComm } : {};
      }

      if (filterLocation) {
        const locId = Number(filterLocation);
        Object.keys(acc.commodities).forEach((cId) => {
          const keptLoc = acc.commodities[cId].locations[locId];
          acc.commodities[cId].locations = keptLoc ? { [locId]: keptLoc } : {};
          if (keptLoc) {
            acc.commodities[cId].total = keptLoc.quantity;
          } else {
            acc.commodities[cId].total = 0;
          }
        });
      }
    });

    if (!showZeroBalances) {
      result = result.filter((acc) => {
        const hasStock = Object.values(acc.commodities).some((c) =>
          Math.abs(c.total) > 0.001
        );
        return hasStock;
      });
    }

    if (!showZeroBalances) {
      result.forEach((acc) => {
        Object.keys(acc.commodities).forEach((cId) => {
          if (Math.abs(acc.commodities[cId].total) <= 0.001) {
            delete acc.commodities[cId];
          }
        });
      });
    }

    return result;
  }, [
    transactions,
    customers,
    internalAccounts,
    commodities,
    stockLocations,
    currentSite,
    showInternalAccounts,
    filterCustomer,
    filterCommodity,
    filterLocation,
    showZeroBalances,
  ]);

  const availableCustomers = useMemo(() => {
    return [
      ...customers.map((c) => ({ ...c, key: `customer-${c.id}` })),
      ...internalAccounts.map((i) => ({ ...i, key: `internal-${i.id}` })),
    ];
  }, [customers, internalAccounts]);

  const flattenedStock = useMemo(() => {
    const rows = [];
    stockData.forEach((acc) => {
      Object.values(acc.commodities).forEach((comm) => {
        Object.values(comm.locations).forEach((loc) => {
          rows.push({
            key: `${acc.key}-${comm.id}-${loc.id}`,
            accountKey: acc.key,
            accountName: acc.name,
            accountType: acc.type,
            commodityId: comm.id,
            commodityCode: comm.commodityCode,
            commodityName: comm.name,
            locationId: loc.id,
            locationName: loc.name,
            quantity: loc.quantity,
            unit: comm.unit,
          });
        });
      });
    });
    return rows;
  }, [stockData]);

  // ─── SUMMARY CARDS ─────────────────────────────────────────────────────────
  const summaryCards = useMemo(() => {
    const totalStock = flattenedStock.reduce((s, r) => s + r.quantity, 0);
    const accountKeys = new Set(flattenedStock.map((r) => r.accountKey));
    const commodityTotals = {};
    flattenedStock.forEach((r) => {
      commodityTotals[r.commodityId] = (commodityTotals[r.commodityId] || 0) + r.quantity;
    });
    const topCommodityEntry = Object.entries(commodityTotals).sort(
      (a, b) => Math.abs(b[1]) - Math.abs(a[1])
    )[0];
    const topCommodity = topCommodityEntry
      ? commodities.find((c) => c.id === Number(topCommodityEntry[0]))?.description || "—"
      : "—";

    return {
      totalStock,
      accountCount: accountKeys.size,
      topCommodity,
    };
  }, [flattenedStock, commodities]);

  // ─── BY ACCOUNT (grouped) ──────────────────────────────────────────────────
  const byAccount = useMemo(() => {
    const map = {};
    flattenedStock.forEach((r) => {
      if (!map[r.accountKey]) {
        map[r.accountKey] = {
          key: r.accountKey,
          accountName: r.accountName,
          accountType: r.accountType,
          total: 0,
          rows: [],
        };
      }
      map[r.accountKey].total += r.quantity;
      map[r.accountKey].rows.push(r);
    });
    return Object.values(map).sort((a, b) => a.accountName.localeCompare(b.accountName));
  }, [flattenedStock]);

  // ─── BY COMMODITY (grouped) ────────────────────────────────────────────────
  const byCommodity = useMemo(() => {
    const map = {};
    flattenedStock.forEach((r) => {
      const k = r.commodityId;
      if (!map[k]) {
        map[k] = {
          key: `comm-${k}`,
          commodityId: k,
          commodityCode: r.commodityCode,
          commodityName: r.commodityName,
          unit: r.unit,
          total: 0,
          rows: [],
        };
      }
      map[k].total += r.quantity;
      map[k].rows.push(r);
    });
    return Object.values(map).sort((a, b) =>
      `${a.commodityCode} ${a.commodityName}`.localeCompare(`${b.commodityCode} ${b.commodityName}`)
    );
  }, [flattenedStock]);

  // ─── BY LOCATION (grouped) ─────────────────────────────────────────────────
  const byLocation = useMemo(() => {
    const map = {};
    flattenedStock.forEach((r) => {
      const k = r.locationId;
      const name = r.locationName;
      if (!map[k]) {
        map[k] = {
          key: `loc-${k}`,
          locationId: k,
          locationName: name,
          total: 0,
          rows: [],
        };
      }
      map[k].total += r.quantity;
      map[k].rows.push(r);
    });
    return Object.values(map).sort((a, b) =>
      String(a.locationName).localeCompare(String(b.locationName))
    );
  }, [flattenedStock]);

  // ─── PIVOT (Account x Location matrix) ─────────────────────────────────────
  const pivotData = useMemo(() => {
    const accounts = [...new Set(flattenedStock.map((r) => r.accountKey))];
    const locations = [...new Set(flattenedStock.map((r) => r.locationId))];
    const accountNames = {};
    const accountTypes = {};
    flattenedStock.forEach((r) => {
      accountNames[r.accountKey] = r.accountName;
      accountTypes[r.accountKey] = r.accountType;
    });
    const locationNames = {};
    flattenedStock.forEach((r) => {
      locationNames[r.locationId] = r.locationName;
    });

    const cellMap = {};
    flattenedStock.forEach((r) => {
      const k = `${r.accountKey}|${r.locationId}`;
      cellMap[k] = (cellMap[k] || 0) + r.quantity;
    });

    const rowTotals = {};
    const colTotals = {};
    let grandTotal = 0;

    accounts.forEach((acc) => {
      rowTotals[acc] = 0;
      locations.forEach((loc) => {
        const v = cellMap[`${acc}|${loc}`] || 0;
        rowTotals[acc] += v;
        colTotals[loc] = (colTotals[loc] || 0) + v;
        grandTotal += v;
      });
    });

    locations.forEach((loc) => {
      if (colTotals[loc] === undefined) colTotals[loc] = 0;
    });

    return {
      accounts,
      locations,
      accountNames,
      accountTypes,
      locationNames,
      cellMap,
      rowTotals,
      colTotals,
      grandTotal,
    };
  }, [flattenedStock]);

  const qtyColor = (q) => (q < 0 ? "#dc2626" : "#059669");
  const Badge = ({ type }) => (
    <span
      style={{
        marginLeft: 8,
        fontSize: 10,
        background: type === "customer" ? "#dbeafe" : "#f3e8ff",
        color: type === "customer" ? "#1e40af" : "#6b21a8",
        padding: "2px 6px",
        borderRadius: 4,
        textTransform: "uppercase",
        fontWeight: 700,
      }}
    >
      {type === "customer" ? "CUST" : "INT"}
    </span>
  );

  const tableWrapper = {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    overflow: "hidden",
  };

  const tableScroll = {
    overflow: "auto",
    minHeight: 400,
    maxHeight: "calc(100vh - 380px)",
  };

  const thStyle = {
    padding: "10px 14px",
    textAlign: "left",
    fontWeight: 700,
    color: "#64748b",
    fontSize: 10.5,
    textTransform: "uppercase",
  };

  const tdStyle = { padding: "11px 14px", color: "#475569" };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <Navbar site={currentSite} onSiteChange={setCurrentSite} sites={SITES} />

      <div
        style={{
          maxWidth: 1920,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0f1e3d",
              margin: 0,
            }}
          >
            Stock on Hand
          </h1>
          <BtnSecondary onClick={() => router.push("/transactions")}>
            All Transactions
          </BtnSecondary>
        </div>

        {/* Summary cards */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "16px 20px",
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
              Total Stock
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: qtyColor(summaryCards.totalStock),
              }}
            >
              {summaryCards.totalStock.toFixed(2)} MT
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "16px 20px",
              minWidth: 160,
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
              Accounts with Stock
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#0f1e3d" }}>
              {summaryCards.accountCount}
            </div>
          </div>
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "16px 20px",
              minWidth: 200,
            }}
          >
            <div style={{ fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 4 }}>
              Top Commodity by Volume
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#0f1e3d" }}>
              {summaryCards.topCommodity}
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "14px 18px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 12,
          }}
        >
          <select
            value={filterCustomer}
            onChange={(e) => setFilterCustomer(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="">All Accounts</option>
            {availableCustomers.map((c) => (
              <option key={c.key} value={c.key}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterCommodity}
            onChange={(e) => setFilterCommodity(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="">All Commodities</option>
            {commodities.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.description}
              </option>
            ))}
          </select>

          <select
            value={filterLocation}
            onChange={(e) => setFilterLocation(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
            }}
          >
            <option value="">All Locations</option>
            {stockLocations
              .filter((l) => l.site === currentSite)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
          </select>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showInternalAccounts}
              onChange={(e) => setShowInternalAccounts(e.target.checked)}
            />
            Show Internal
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showZeroBalances}
              onChange={(e) => setShowZeroBalances(e.target.checked)}
            />
            Show Zero Balances
          </label>

          <div style={{ marginLeft: "auto", fontSize: 13, color: "#64748b" }}>
            {stockData.length} account(s) found
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            borderBottom: "1px solid #e2e8f0",
            background: "#fff",
            borderRadius: "10px 10px 0 0",
            padding: "8px 14px 0",
            border: "1px solid #e2e8f0",
            borderBottom: "none",
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "10px 16px",
                border: "none",
                background: activeTab === tab.id ? "#0f1e3d" : "transparent",
                color: activeTab === tab.id ? "#fff" : "#64748b",
                fontWeight: 600,
                fontSize: 13,
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={tableWrapper}>
          <div style={tableScroll}>
            {activeTab === "detail" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={thStyle}>Account</th>
                    <th style={thStyle}>Commodity</th>
                    <th style={thStyle}>Location</th>
                    <th style={{ ...thStyle, textAlign: "right" }}>Quantity</th>
                  </tr>
                </thead>
                <tbody>
                  {flattenedStock.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          padding: 48,
                          textAlign: "center",
                          color: "#9ca3af",
                          fontSize: 13,
                        }}
                      >
                        No stock records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {flattenedStock.map((r) => (
                        <tr key={r.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600, color: "#0f1e3d" }}>
                              {r.accountName} <Badge type={r.accountType} />
                            </span>
                          </td>
                          <td style={tdStyle}>{r.commodityName}</td>
                          <td style={tdStyle}>{r.locationName}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            <span style={{ fontWeight: 700, color: qtyColor(r.quantity) }}>
                              {r.quantity.toFixed(3)} {r.unit}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0", fontWeight: 700 }}>
                        <td colSpan={3} style={{ ...tdStyle, textAlign: "right" }}>
                          Total
                        </td>
                        <td style={{ ...tdStyle, textAlign: "right", color: qtyColor(summaryCards.totalStock) }}>
                          {summaryCards.totalStock.toFixed(3)} MT
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "byAccount" && (
              <div style={{ padding: "16px 20px" }}>
                {byAccount.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                    No stock records found matching filters.
                  </div>
                ) : (
                  byAccount.map((grp) => {
                    const isExpanded = expandedGroups[grp.key] === true;
                    return (
                      <div
                        key={grp.key}
                        style={{
                          marginBottom: 16,
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => toggleExpanded(grp.key)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            cursor: "pointer",
                            borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#0f1e3d" }}>
                            <span style={{ marginRight: 8, fontSize: 10, color: "#64748b" }}>{isExpanded ? "▼" : "▶"}</span>
                            {grp.accountName} <Badge type={grp.accountType} />
                          </span>
                          <span style={{ fontWeight: 700, color: qtyColor(grp.total) }}>
                            {grp.total.toFixed(3)} MT
                          </span>
                        </div>
                        {isExpanded && (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#fafbfc" }}>
                                <th style={{ ...thStyle, paddingLeft: 24 }}>Commodity</th>
                                <th style={thStyle}>Location</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grp.rows.map((r) => (
                                <tr key={r.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ ...tdStyle, paddingLeft: 24 }}>{r.commodityName}</td>
                                  <td style={tdStyle}>{r.locationName}</td>
                                  <td style={{ ...tdStyle, textAlign: "right" }}>
                                    <span style={{ fontWeight: 700, color: qtyColor(r.quantity) }}>
                                      {r.quantity.toFixed(3)} {r.unit}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "byCommodity" && (
              <div style={{ padding: "16px 20px" }}>
                {byCommodity.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                    No stock records found matching filters.
                  </div>
                ) : (
                  byCommodity.map((grp) => {
                    const isExpanded = expandedGroups[grp.key] === true;
                    return (
                      <div
                        key={grp.key}
                        style={{
                          marginBottom: 16,
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => toggleExpanded(grp.key)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            cursor: "pointer",
                            borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#0f1e3d" }}>
                            <span style={{ marginRight: 8, fontSize: 10, color: "#64748b" }}>{isExpanded ? "▼" : "▶"}</span>
                            {grp.commodityName}
                          </span>
                          <span style={{ fontWeight: 700, color: qtyColor(grp.total) }}>
                            {grp.total.toFixed(3)} {grp.unit}
                          </span>
                        </div>
                        {isExpanded && (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#fafbfc" }}>
                                <th style={{ ...thStyle, paddingLeft: 24 }}>Account</th>
                                <th style={thStyle}>Location</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grp.rows.map((r) => (
                                <tr key={r.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ ...tdStyle, paddingLeft: 24 }}>
                                    <span style={{ fontWeight: 600 }}>{r.accountName}</span>{" "}
                                    <Badge type={r.accountType} />
                                  </td>
                                  <td style={tdStyle}>{r.locationName}</td>
                                  <td style={{ ...tdStyle, textAlign: "right" }}>
                                    <span style={{ fontWeight: 700, color: qtyColor(r.quantity) }}>
                                      {r.quantity.toFixed(3)} {r.unit}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "byLocation" && (
              <div style={{ padding: "16px 20px" }}>
                {byLocation.length === 0 ? (
                  <div style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                    No stock records found matching filters.
                  </div>
                ) : (
                  byLocation.map((grp) => {
                    const isExpanded = expandedGroups[grp.key] === true;
                    return (
                      <div
                        key={grp.key}
                        style={{
                          marginBottom: 16,
                          border: "1px solid #e2e8f0",
                          borderRadius: 8,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          onClick={() => toggleExpanded(grp.key)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "12px 16px",
                            background: "#f8fafc",
                            cursor: "pointer",
                            borderBottom: isExpanded ? "1px solid #e2e8f0" : "none",
                          }}
                        >
                          <span style={{ fontWeight: 600, color: "#0f1e3d" }}>
                            <span style={{ marginRight: 8, fontSize: 10, color: "#64748b" }}>{isExpanded ? "▼" : "▶"}</span>
                            {grp.locationName}
                          </span>
                          <span style={{ fontWeight: 700, color: qtyColor(grp.total) }}>
                            {grp.total.toFixed(3)} MT
                          </span>
                        </div>
                        {isExpanded && (
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ background: "#fafbfc" }}>
                                <th style={{ ...thStyle, paddingLeft: 24 }}>Account</th>
                                <th style={thStyle}>Commodity</th>
                                <th style={{ ...thStyle, textAlign: "right" }}>Quantity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {grp.rows.map((r) => (
                                <tr key={r.key} style={{ borderBottom: "1px solid #f1f5f9" }}>
                                  <td style={{ ...tdStyle, paddingLeft: 24 }}>
                                    <span style={{ fontWeight: 600 }}>{r.accountName}</span>{" "}
                                    <Badge type={r.accountType} />
                                  </td>
                                  <td style={tdStyle}>{r.commodityName}</td>
                                  <td style={{ ...tdStyle, textAlign: "right" }}>
                                    <span style={{ fontWeight: 700, color: qtyColor(r.quantity) }}>
                                      {r.quantity.toFixed(3)} {r.unit}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "pivot" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ ...thStyle, minWidth: 180 }}>Account</th>
                    {pivotData.locations.map((loc) => (
                      <th key={loc} style={{ ...thStyle, textAlign: "right", minWidth: 100 }}>
                        {pivotData.locationNames[loc] || loc}
                      </th>
                    ))}
                    <th style={{ ...thStyle, textAlign: "right", minWidth: 100, background: "#e2e8f0" }}>
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pivotData.accounts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={pivotData.locations.length + 2}
                        style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}
                      >
                        No stock records found matching filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {pivotData.accounts.map((acc) => (
                        <tr key={acc} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={tdStyle}>
                            <span style={{ fontWeight: 600 }}>
                              {pivotData.accountNames[acc]}{" "}
                              <Badge type={pivotData.accountTypes[acc]} />
                            </span>
                          </td>
                          {pivotData.locations.map((loc) => {
                            const v = pivotData.cellMap[`${acc}|${loc}`] || 0;
                            return (
                              <td key={loc} style={{ ...tdStyle, textAlign: "right" }}>
                                <span style={{ fontWeight: 600, color: qtyColor(v) }}>
                                  {v.toFixed(2)}
                                </span>
                              </td>
                            );
                          })}
                          <td
                            style={{
                              ...tdStyle,
                              textAlign: "right",
                              fontWeight: 700,
                              background: "#f8fafc",
                              color: qtyColor(pivotData.rowTotals[acc]),
                            }}
                          >
                            {pivotData.rowTotals[acc].toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: "#f8fafc", borderTop: "2px solid #e2e8f0", fontWeight: 700 }}>
                        <td style={{ ...tdStyle }}>Total</td>
                        {pivotData.locations.map((loc) => (
                          <td
                            key={loc}
                            style={{
                              ...tdStyle,
                              textAlign: "right",
                              color: qtyColor(pivotData.colTotals[loc]),
                            }}
                          >
                            {pivotData.colTotals[loc].toFixed(2)}
                          </td>
                        ))}
                        <td
                          style={{
                            ...tdStyle,
                            textAlign: "right",
                            background: "#e2e8f0",
                            color: qtyColor(pivotData.grandTotal),
                          }}
                        >
                          {pivotData.grandTotal.toFixed(2)}
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
