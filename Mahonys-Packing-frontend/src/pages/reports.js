"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  BtnPrimary,
  BtnSecondary,
  BtnGhost,
  StatusBadge,
  DataTable,
} from "../components/SharedComponents";
import { SITES, CUSTOMERS } from "../utils/mockData";

const REPORT_TYPES = [
  "All",
  "Tickets",
  "Location Inventory",
  "Containers",
  "Transactions",
];

export default function ReportsPage() {
  const {
    tickets,
    cmos,
    commodities,
    commodityTypes,
    stockLocations,
    currentSite,
    setCurrentSite,
  } = useApp();

  // ── Filters ──
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCustomers, setSelectedCustomers] = useState([]); // [] = all
  const [selectedCommodities, setSelectedCommodities] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedDirections, setSelectedDirections] = useState(["in", "out"]);
  const [reportType, setReportType] = useState("All");
  const [email, setEmail] = useState("");
  const [generated, setGenerated] = useState(false);

  // Toggle helpers
  const toggleItem = (list, setList, item) =>
    setList((prev) =>
      prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]
    );

  // ── Filtered data ──
  const filteredTickets = useMemo(() => {
    return tickets
      .filter((t) => {
        if (!selectedDirections.includes(t.type)) return false;
        if (selectedSites.length && !selectedSites.includes(t.site))
          return false;
        if (selectedStatuses.length && !selectedStatuses.includes(t.status))
          return false;
        if (dateFrom && t.date < dateFrom) return false;
        if (dateTo && t.date > dateTo) return false;

        const cmo = cmos.find((c) => c.id === t.cmoId);
        if (
          selectedCustomers.length &&
          (!cmo || !selectedCustomers.includes(cmo.customer?.id))
        )
          return false;
        if (
          selectedCommodities.length &&
          (!cmo || !selectedCommodities.includes(cmo.commodity?.id))
        )
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [
    tickets,
    cmos,
    selectedDirections,
    selectedSites,
    selectedStatuses,
    dateFrom,
    dateTo,
    selectedCustomers,
    selectedCommodities,
  ]);

  // ── Summary stats ──
  const stats = useMemo(() => {
    const totalNet = filteredTickets.reduce((sum, t) => {
      const g = t.grossWeights.reduce((a, b) => a + b, 0);
      const ta = t.tareWeights.reduce((a, b) => a + b, 0);
      return sum + (g - ta);
    }, 0);
    const byStatus = {};
    filteredTickets.forEach((t) => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
    });
    const byCommodity = {};
    filteredTickets.forEach((t) => {
      const cmo = cmos.find((c) => c.id === t.cmoId);
      const name = cmo?.commodity?.description || "Unknown";
      byCommodity[name] = (byCommodity[name] || 0) + 1;
    });
    return { totalNet, byStatus, byCommodity, count: filteredTickets.length };
  }, [filteredTickets, cmos]);

  const reportTicketColumns = useMemo(
    () => [
      { id: "id", label: "ID", width: "55px", getValue: (t) => t.id, cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 11.5 } },
      { id: "type", label: "Dir", width: "30px", getValue: (t) => (t.type === "in" ? "In" : "Out"), render: (_, t) => <span style={{ fontSize: 14 }}>{t.type === "in" ? "In" : "Out"}</span> },
      {
        id: "customer",
        label: "Customer",
        minWidth: 100,
        getValue: (t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          return cmo?.customer?.name || "—";
        },
      },
      {
        id: "commodity",
        label: "Commodity",
        minWidth: 100,
        getValue: (t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          return `${cmo?.commodity?.name || "—"} ${t.grade || ""}`;
        },
        render: (_, t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          return (
            <span>
              {cmo?.commodity?.name || "—"}{" "}
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{t.grade}</span>
            </span>
          );
        },
      },
      { id: "truck", label: "Truck", width: "90px", getValue: (t) => t.truck?.name ?? "", render: (_, t) => <span style={{ color: "#64748b" }}>{t.truck?.name || "—"}</span> },
      {
        id: "site",
        label: "Site",
        width: "100px",
        getValue: (t) => SITES.find((s) => s.id === t.site)?.name ?? "",
        render: (_, t) => <span style={{ color: "#64748b", fontSize: 11 }}>{SITES.find((s) => s.id === t.site)?.name || "—"}</span>,
      },
      { id: "status", label: "Status", width: "110px", getValue: (t) => t.status, render: (_, t) => <StatusBadge status={t.status} /> },
      {
        id: "net",
        label: "Net (t)",
        width: "85px",
        getValue: (t) => (t.grossWeights.reduce((a, b) => a + b, 0) - t.tareWeights.reduce((a, b) => a + b, 0)) / 1000,
        render: (_, t) => {
          const net = (t.grossWeights.reduce((a, b) => a + b, 0) - t.tareWeights.reduce((a, b) => a + b, 0)) / 1000;
          return (
            <span style={{ textAlign: "right", fontWeight: 600, color: net > 0 ? "#059669" : "#6b7280", display: "block" }}>
              {net > 0 ? net.toFixed(1) : "—"}
            </span>
          );
        },
      },
    ],
    [cmos]
  );

  // ── Location Inventory Calculation ──
  const locationInventory = useMemo(() => {
    const stockByLocation = {};

    stockLocations.forEach((loc) => {
      stockByLocation[loc.id] = {
        location: loc,
        items: [],
        totalWeight: 0,
      };
    });

    // Add incoming
    tickets
      .filter(
        (t) => t.type === "in" && t.status === "completed" && t.unloadedLocation
      )
      .forEach((ticket) => {
        const location = stockLocations.find(
          (l) =>
            l.id === ticket.unloadedLocation ||
            l.name === ticket.unloadedLocation
        );
        if (location && stockByLocation[location.id]) {
          const cmo = cmos.find((c) => c.id === ticket.cmoId);
          const commodity = cmo
            ? commodities.find((c) => c.id === cmo.commodityId)
            : null;
          const commodityType = cmo
            ? commodityTypes.find((ct) => ct.id === cmo.commodityTypeId)
            : null;

          const netWeight =
            ticket.grossWeights.reduce((a, b) => a + b, 0) -
            ticket.tareWeights.reduce((a, b) => a + b, 0);

          if (netWeight > 0) {
            const existingItem = stockByLocation[location.id].items.find(
              (item) => item.commodity?.id === commodity?.id
            );

            if (existingItem) {
              existingItem.weight += netWeight;
            } else {
              stockByLocation[location.id].items.push({
                commodity,
                commodityType,
                weight: netWeight,
              });
            }
            stockByLocation[location.id].totalWeight += netWeight;
          }
        }
      });

    // Subtract outgoing
    tickets
      .filter(
        (t) => t.type === "out" && t.status === "completed" && t.loadingLocation
      )
      .forEach((ticket) => {
        const location = stockLocations.find(
          (l) =>
            l.id === ticket.loadingLocation || l.name === ticket.loadingLocation
        );
        if (location && stockByLocation[location.id]) {
          const netWeight =
            ticket.grossWeights.reduce((a, b) => a + b, 0) -
            ticket.tareWeights.reduce((a, b) => a + b, 0);

          if (netWeight > 0) {
            stockByLocation[location.id].totalWeight -= netWeight;
            if (stockByLocation[location.id].totalWeight < 0) {
              stockByLocation[location.id].totalWeight = 0;
            }
          }
        }
      });

    return Object.values(stockByLocation)
      .filter(
        (data) =>
          selectedSites.length === 0 ||
          selectedSites.includes(data.location.site)
      )
      .sort((a, b) => a.location.name.localeCompare(b.location.name));
  }, [
    stockLocations,
    tickets,
    cmos,
    commodities,
    commodityTypes,
    selectedSites,
  ]);

  const clearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setSelectedCustomers([]);
    setSelectedCommodities([]);
    setSelectedSites([]);
    setSelectedStatuses([]);
    setSelectedDirections(["in", "out"]);
    setGenerated(false);
  };

  const hasActiveFilters =
    dateFrom ||
    dateTo ||
    selectedCustomers.length ||
    selectedCommodities.length ||
    selectedSites.length ||
    selectedStatuses.length ||
    selectedDirections.length < 2;

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: "#0f1e3d",
              }}
            >
              Ticket Reports
            </h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Flexible filtering, live preview and export
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {hasActiveFilters && (
              <BtnGhost
                onClick={clearFilters}
                style={{ fontSize: 12, color: "#6b7280" }}
              >
                Clear Filters
              </BtnGhost>
            )}
          </div>
        </div>

        {/* ── Report Type Tabs ──────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: 4,
          }}
        >
          {REPORT_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => {
                setReportType(type);
                setGenerated(true);
              }}
              style={{
                flex: 1,
                padding: "8px 0",
                border: "none",
                borderRadius: 8,
                background:
                  reportType === type
                    ? "linear-gradient(135deg, #2563eb, #3b82f6)"
                    : "transparent",
                color: reportType === type ? "#fff" : "#64748b",
                fontSize: 13,
                fontWeight: reportType === type ? 600 : 500,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {type}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {/* ── LEFT: Filters ──────────────────────────────────────────── */}
          <div
            style={{
              width: 300,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            {/* Date Range */}
            <FilterCard title="Date Range">
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                      marginTop: 3,
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8", marginTop: 16 }}>
                  →
                </span>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      fontSize: 10.5,
                      color: "#64748b",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "5px 8px",
                      border: "1px solid #e2e8f0",
                      borderRadius: 6,
                      fontSize: 12,
                      outline: "none",
                      boxSizing: "border-box",
                      marginTop: 3,
                    }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <QuickDate
                  label="Today"
                  onSet={() => {
                    const v = new Date().toISOString().split("T")[0];
                    setDateFrom(v);
                    setDateTo(v);
                  }}
                />
                <QuickDate
                  label="This Week"
                  value="week"
                  onSet={() => {
                    const today = new Date();
                    const mon = new Date(today);
                    mon.setDate(today.getDate() - today.getDay() + 1);
                    setDateFrom(mon.toISOString().split("T")[0]);
                    setDateTo(today.toISOString().split("T")[0]);
                  }}
                />
                <QuickDate
                  label="This Month"
                  value="month"
                  onSet={() => {
                    const today = new Date();
                    setDateFrom(
                      new Date(today.getFullYear(), today.getMonth(), 1)
                        .toISOString()
                        .split("T")[0]
                    );
                    setDateTo(today.toISOString().split("T")[0]);
                  }}
                />
              </div>
            </FilterCard>

            {/* Direction */}
            <FilterCard title="Direction">
              <div style={{ display: "flex", gap: 6 }}>
                {["in", "out"].map((d) => (
                  <button
                    key={d}
                    onClick={() =>
                      toggleItem(selectedDirections, setSelectedDirections, d)
                    }
                    style={{
                      flex: 1,
                      padding: "5px 0",
                      border: "none",
                      borderRadius: 6,
                      background: selectedDirections.includes(d)
                        ? d === "in"
                          ? "#dbeafe"
                          : "#fce7f3"
                        : "#f3f4f6",
                      color: selectedDirections.includes(d)
                        ? d === "in"
                          ? "#1e40af"
                          : "#9d174d"
                        : "#6b7280",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {d === "in" ? "Incoming" : "Outgoing"}
                  </button>
                ))}
              </div>
            </FilterCard>

            {/* Site */}
            <FilterCard title="Site">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {SITES.map((s) => (
                  <label
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedSites.includes(s.id)}
                      onChange={() =>
                        toggleItem(selectedSites, setSelectedSites, s.id)
                      }
                      style={{ accentColor: "#3b82f6" }}
                    />
                    {s.name}
                  </label>
                ))}
              </div>
            </FilterCard>

            {/* Customer */}
            <FilterCard title="Customer">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {CUSTOMERS.map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      fontSize: 12,
                      color: "#374151",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(c.id)}
                      onChange={() =>
                        toggleItem(
                          selectedCustomers,
                          setSelectedCustomers,
                          c.id
                        )
                      }
                      style={{ accentColor: "#3b82f6" }}
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </FilterCard>

            {/* Commodity */}
            <FilterCard title="Commodity">
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {commodities
                  .filter((c) => c.status === "active")
                  .map((c) => (
                    <label
                      key={c.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        fontSize: 12,
                        color: "#374151",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCommodities.includes(c.id)}
                        onChange={() =>
                          toggleItem(
                            selectedCommodities,
                            setSelectedCommodities,
                            c.id
                          )
                        }
                        style={{ accentColor: "#3b82f6" }}
                      />
                      {c.description}
                    </label>
                  ))}
              </div>
            </FilterCard>

            {/* Status */}
            <FilterCard title="Status">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                {["booked", "processing", "completed", "cancelled"].map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      toggleItem(selectedStatuses, setSelectedStatuses, s)
                    }
                    style={{
                      background: selectedStatuses.includes(s)
                        ? "#dbeafe"
                        : "#f3f4f6",
                      color: selectedStatuses.includes(s)
                        ? "#1e40af"
                        : "#6b7280",
                      border: "none",
                      borderRadius: 12,
                      padding: "3px 9px",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                      textTransform: "capitalize",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </FilterCard>

            {/* Email & Generate */}
            <FilterCard title="Email Report">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@email.com"
                style={{
                  width: "100%",
                  padding: "6px 10px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <BtnPrimary
                  onClick={() => setGenerated(true)}
                  style={{ flex: 1, justifyContent: "center", fontSize: 12 }}
                >
                  Generate
                </BtnPrimary>
                <BtnSecondary
                  onClick={() => alert("Email sent (demo)")}
                  disabled={!email}
                  style={{ fontSize: 11 }}
                >
                  Send
                </BtnSecondary>
              </div>
            </FilterCard>
          </div>

          {/* ── RIGHT: Results ──────────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {reportType === "Location Inventory" ? (
              <>
                {/* Location Inventory View */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                  }}
                >
                  <SummaryCard
                    title="Locations"
                    value={locationInventory.length}
                    color="#3b82f6"
                  />
                  <SummaryCard
                    title="Total Stock (t)"
                    value={(
                      locationInventory.reduce(
                        (sum, loc) => sum + loc.totalWeight,
                        0
                      ) / 1000
                    ).toFixed(1)}
                    color="#10b981"
                  />
                  <SummaryCard
                    title="With Stock"
                    value={
                      locationInventory.filter((loc) => loc.totalWeight > 0)
                        .length
                    }
                    color="#059669"
                  />
                  <SummaryCard
                    title="Empty"
                    value={
                      locationInventory.filter((loc) => loc.totalWeight === 0)
                        .length
                    }
                    color="#94a3b8"
                  />
                </div>

                {/* Export Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    padding: "10px 16px",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    <strong>{locationInventory.length}</strong> location
                    {locationInventory.length !== 1 ? "s" : ""} in report
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <BtnSecondary
                      onClick={() => alert("CSV exported (demo)")}
                      style={{ fontSize: 11 }}
                    >
                      Export CSV
                    </BtnSecondary>
                    <BtnSecondary
                      onClick={() => alert("PDF exported (demo)")}
                      style={{ fontSize: 11 }}
                    >
                      Export PDF
                    </BtnSecondary>
                    <BtnSecondary
                      onClick={() => window.print()}
                      style={{ fontSize: 11 }}
                    >
                      Print
                    </BtnSecondary>
                  </div>
                </div>

                {/* Location Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(350px, 1fr))",
                    gap: 12,
                  }}
                >
                  {locationInventory.map((data) => {
                    const loc = data.location;
                    const utilizationPercent =
                      loc.capacity > 0
                        ? Math.round((data.totalWeight / loc.capacity) * 100)
                        : 0;
                    const isNearCapacity = utilizationPercent >= 90;
                    const isMediumCapacity =
                      utilizationPercent >= 70 && utilizationPercent < 90;

                    return (
                      <div
                        key={loc.id}
                        style={{
                          background: "#fff",
                          borderRadius: 10,
                          border: "1px solid #e2e8f0",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            padding: "12px 16px",
                            borderBottom: "1px solid #f1f5f9",
                            background: "#f8fafc",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <div>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: "#0f1e3d",
                                }}
                              >
                                {loc.name}
                              </span>
                              <div
                                style={{
                                  fontSize: 10,
                                  color: "#64748b",
                                  marginTop: 1,
                                }}
                              >
                                {loc.locationType} •{" "}
                                {SITES.find((s) => s.id === loc.site)?.name ||
                                  "—"}
                              </div>
                            </div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: "#2563eb",
                              }}
                            >
                              {(data.totalWeight / 1000).toFixed(1)}t
                            </div>
                          </div>
                        </div>

                        <div style={{ padding: "12px 16px" }}>
                          {/* Capacity Bar */}
                          {loc.capacity > 0 && (
                            <div style={{ marginBottom: 12 }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 4,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 10,
                                    color: "#64748b",
                                    fontWeight: 600,
                                  }}
                                >
                                  CAPACITY
                                </span>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: isNearCapacity
                                      ? "#dc2626"
                                      : isMediumCapacity
                                      ? "#f59e0b"
                                      : "#059669",
                                  }}
                                >
                                  {utilizationPercent}%
                                </span>
                              </div>
                              <div
                                style={{
                                  width: "100%",
                                  height: 6,
                                  background: "#f1f5f9",
                                  borderRadius: 3,
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    width: `${Math.min(
                                      utilizationPercent,
                                      100
                                    )}%`,
                                    height: "100%",
                                    background: isNearCapacity
                                      ? "#dc2626"
                                      : isMediumCapacity
                                      ? "#f59e0b"
                                      : "#059669",
                                    transition: "width 0.3s",
                                  }}
                                />
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginTop: 3,
                                }}
                              >
                                <span style={{ fontSize: 9, color: "#94a3b8" }}>
                                  {data.totalWeight.toLocaleString()} kg
                                </span>
                                <span style={{ fontSize: 9, color: "#94a3b8" }}>
                                  of {loc.capacity.toLocaleString()} kg
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Stock Items */}
                          {data.items.length === 0 ? (
                            <div
                              style={{
                                textAlign: "center",
                                padding: "16px 0",
                                color: "#9ca3af",
                                fontSize: 11,
                                fontStyle: "italic",
                              }}
                            >
                              No stock
                            </div>
                          ) : (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                              }}
                            >
                              {data.items.map((item, idx) => (
                                <div
                                  key={idx}
                                  style={{
                                    padding: "8px 10px",
                                    background: "#f8fafc",
                                    borderRadius: 6,
                                    border: "1px solid #e2e8f0",
                                  }}
                                >
                                  <div
                                    style={{
                                      display: "flex",
                                      justifyContent: "space-between",
                                    }}
                                  >
                                    <div style={{ flex: 1 }}>
                                      <div
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 600,
                                          color: "#1e293b",
                                        }}
                                      >
                                        {item.commodity?.description ||
                                          "Unknown"}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 10,
                                          color: "#64748b",
                                          marginTop: 1,
                                        }}
                                      >
                                        Type:{" "}
                                        {item.commodityType?.name || "Unknown"}
                                      </div>
                                    </div>
                                    <div
                                      style={{
                                        textAlign: "right",
                                        marginLeft: 8,
                                      }}
                                    >
                                      <div
                                        style={{
                                          fontSize: 12,
                                          fontWeight: 700,
                                          color: "#2563eb",
                                        }}
                                      >
                                        {item.weight.toLocaleString()}
                                      </div>
                                      <div
                                        style={{
                                          fontSize: 9,
                                          color: "#64748b",
                                        }}
                                      >
                                        kg
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                {/* Summary Cards */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 12,
                  }}
                >
                  <SummaryCard
                    title="Total Tickets"
                    value={stats.count}
                    color="#3b82f6"
                  />
                  <SummaryCard
                    title="Net Weight (t)"
                    value={(stats.totalNet / 1000).toFixed(1)}
                    color="#10b981"
                  />
                  <SummaryCard
                    title="Completed"
                    value={stats.byStatus.completed || 0}
                    color="#059669"
                  />
                  <SummaryCard
                    title="Pending"
                    value={
                      (stats.byStatus.booked || 0) +
                      (stats.byStatus.processing || 0)
                    }
                    color="#f59e0b"
                  />
                </div>

                {/* Breakdown row */}
                <div style={{ display: "flex", gap: 12 }}>
                  <div
                    style={{
                      flex: 1,
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      padding: "14px 18px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      By Commodity
                    </span>
                    <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                      {Object.entries(stats.byCommodity).map(
                        ([name, count]) => (
                          <div
                            key={name}
                            style={{ flex: 1, textAlign: "center" }}
                          >
                            <div
                              style={{
                                fontSize: 18,
                                fontWeight: 700,
                                color: "#0f1e3d",
                              }}
                            >
                              {count}
                            </div>
                            <div style={{ fontSize: 11, color: "#64748b" }}>
                              {name}
                            </div>
                          </div>
                        )
                      )}
                      {Object.keys(stats.byCommodity).length === 0 && (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                          No data
                        </span>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      flex: 1,
                      background: "#fff",
                      borderRadius: 10,
                      border: "1px solid #e2e8f0",
                      padding: "14px 18px",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      By Status
                    </span>
                    <div style={{ marginTop: 8, display: "flex", gap: 12 }}>
                      {Object.entries(stats.byStatus).map(([status, count]) => (
                        <div
                          key={status}
                          style={{ flex: 1, textAlign: "center" }}
                        >
                          <div
                            style={{
                              fontSize: 18,
                              fontWeight: 700,
                              color: "#0f1e3d",
                            }}
                          >
                            {count}
                          </div>
                          <StatusBadge status={status} />
                        </div>
                      ))}
                      {Object.keys(stats.byStatus).length === 0 && (
                        <span style={{ fontSize: 12, color: "#9ca3af" }}>
                          No data
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Export Bar */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #e2e8f0",
                    padding: "10px 16px",
                  }}
                >
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    <strong>{filteredTickets.length}</strong> ticket
                    {filteredTickets.length !== 1 ? "s" : ""} match current
                    filters
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <BtnSecondary
                      onClick={() => alert("CSV exported (demo)")}
                      style={{ fontSize: 11 }}
                    >
                      Export CSV
                    </BtnSecondary>
                    <BtnSecondary
                      onClick={() => alert("PDF exported (demo)")}
                      style={{ fontSize: 11 }}
                    >
                      Export PDF
                    </BtnSecondary>
                    <BtnSecondary
                      onClick={() => window.print()}
                      style={{ fontSize: 11 }}
                    >
                      Print
                    </BtnSecondary>
                  </div>
                </div>

                {/* Ticket Table */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DataTable
                    columns={reportTicketColumns}
                    data={filteredTickets}
                    getRowKey={(t) => t.id}
                    maxHeight={440}
                    emptyMessage="No tickets match your filters. Try adjusting the criteria."
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────────────
function FilterCard({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "8px 14px",
          borderBottom: "1px solid #f1f5f9",
          background: "#f8fafc",
        }}
      >
        <span style={{ fontSize: 11, fontWeight: 700, color: "#0f1e3d" }}>
          {title}
        </span>
      </div>
      <div style={{ padding: "10px 14px" }}>{children}</div>
    </div>
  );
}

function SummaryCard({ title, value, color }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        padding: "14px 16px",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 700, color: "#0f1e3d" }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: "#64748b" }}>{title}</div>
    </div>
  );
}

function QuickDate({ label, onSet }) {
  return (
    <button
      onClick={onSet}
      style={{
        background: "#eef2ff",
        color: "#4f46e5",
        border: "none",
        borderRadius: 12,
        padding: "3px 8px",
        fontSize: 10.5,
        fontWeight: 600,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
