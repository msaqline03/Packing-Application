"use client";
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  PackStatusBadge,
  BtnSecondary,
  PAGE_MAX_WIDTH,
} from "../components/SharedComponents";
import { SITES, getVesselForPack } from "../utils/mockData";
import { checkStockAvailabilityForPack } from "../utils/stockAvailability";

function toDateStr(d) {
  return d.toISOString().split("T")[0];
}

function packDateStr(pack) {
  const raw = pack.date;
  if (!raw) return null;
  return typeof raw === "string" && raw.includes("T") ? raw.split("T")[0] : raw;
}

export default function VesselSchedulerPage() {
  const router = useRouter();
  const {
    packs,
    packers,
    customers,
    commodities,
    vesselDepartures,
    tickets,
    transactions,
    cmos,
    currentSite,
    setCurrentSite,
    updatePack,
  } = useApp();

  const activePackers = useMemo(
    () => (packers || []).filter((p) => p.status === "active"),
    [packers]
  );

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    return toDateStr(d);
  });
  const numDays = 14;
  const dates = useMemo(() => {
    const list = [];
    const start = new Date(startDate + "T12:00:00");
    for (let i = 0; i < numDays; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      list.push(toDateStr(d));
    }
    return list;
  }, [startDate, numDays]);

  const sitePacks = useMemo(
    () => (packs || []).filter((p) => p.siteId === currentSite),
    [packs, currentSite]
  );

  const [filterPackerIds, setFilterPackerIds] = useState([]);
  const [filterCommodityIds, setFilterCommodityIds] = useState([]);
  const [filterCustomerIds, setFilterCustomerIds] = useState([]);

  const filteredSitePacks = useMemo(() => {
    return sitePacks.filter((p) => {
      if (filterPackerIds.length > 0) {
        const packerMatch =
          (p.scheduledPackerId && filterPackerIds.includes(p.scheduledPackerId)) ||
          (Array.isArray(p.assignedPackerIds) &&
            p.assignedPackerIds.some((id) => filterPackerIds.includes(id)));
        if (!packerMatch) return false;
      }
      if (filterCommodityIds.length > 0 && !filterCommodityIds.includes(p.commodityId))
        return false;
      if (filterCustomerIds.length > 0 && !filterCustomerIds.includes(p.customerId))
        return false;
      return true;
    });
  }, [sitePacks, filterPackerIds, filterCommodityIds, filterCustomerIds]);

  const packsWithoutPacker = useMemo(
    () =>
      filteredSitePacks.filter((p) => {
        const hasPacker =
          (p.scheduledPackerId != null) ||
          (Array.isArray(p.assignedPackerIds) && p.assignedPackerIds.length > 0);
        return !hasPacker;
      }),
    [filteredSitePacks]
  );

  const packerRows = useMemo(() => {
    const list = (activePackers || []).map((pk) => ({
      id: pk.id,
      name: pk.name,
    }));
    return list;
  }, [activePackers]);

  const getPacksForCell = useMemo(() => {
    return (packerId, dateStr) =>
      filteredSitePacks.filter((p) => {
        const assigned =
          p.scheduledPackerId === packerId ||
          (Array.isArray(p.assignedPackerIds) && p.assignedPackerIds.includes(packerId));
        return assigned && packDateStr(p) === dateStr;
      });
  }, [filteredSitePacks]);

  const totalsByDate = useMemo(() => {
    const map = {};
    dates.forEach((d) => {
      map[d] = { containers: 0, mt: 0 };
    });
    filteredSitePacks.forEach((p) => {
      const d = packDateStr(p);
      if (!d || !map[d]) return;
      const cnt = p.packType === "container" ? (Number(p.containersRequired) || 0) : 0;
      const mt = Number(p.mtTotal) || 0;
      map[d].containers += cnt;
      map[d].mt += mt;
    });
    return map;
  }, [filteredSitePacks, dates]);

  const totalsByPacker = useMemo(() => {
    const map = {};
    const dateSet = new Set(dates);
    (activePackers || []).forEach((pk) => {
      map[pk.id] = { containers: 0, mt: 0 };
    });
    filteredSitePacks.forEach((p) => {
      if (!dateSet.has(packDateStr(p))) return;
      const packerIds = new Set();
      if (p.scheduledPackerId) packerIds.add(p.scheduledPackerId);
      if (Array.isArray(p.assignedPackerIds)) {
        p.assignedPackerIds.forEach((id) => packerIds.add(id));
      }
      const cnt = p.packType === "container" ? (Number(p.containersRequired) || 0) : 0;
      const mt = Number(p.mtTotal) || 0;
      packerIds.forEach((pid) => {
        if (!map[pid]) map[pid] = { containers: 0, mt: 0 };
        map[pid].containers += cnt;
        map[pid].mt += mt;
      });
    });
    return map;
  }, [filteredSitePacks, activePackers, dates]);

  const [selectedUnassignedId, setSelectedUnassignedId] = useState(null);
  const [assigningCell, setAssigningCell] = useState(null); // { packerId, dateStr }
  const [openFilter, setOpenFilter] = useState(null); // 'packers' | 'commodities' | 'customers'
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setOpenFilter(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAssign = (packId, packerId, dateStr) => {
    const pack = (packs || []).find((p) => p.id === packId);
    if (!pack) return;
    const existingIds = Array.isArray(pack.assignedPackerIds) ? pack.assignedPackerIds : [];
    const nextIds = existingIds.includes(packerId)
      ? existingIds
      : [...existingIds, packerId];
    updatePack(packId, { assignedPackerIds: nextIds, date: dateStr });
    setSelectedUnassignedId(null);
    setAssigningCell(null);
  };

  const handleUnassign = (packId, packerId) => {
    const pack = (packs || []).find((p) => p.id === packId);
    if (!pack) return;
    const existingIds = Array.isArray(pack.assignedPackerIds) ? pack.assignedPackerIds : [];
    const nextIds = existingIds.filter((id) => id !== packerId);
    updatePack(packId, {
      assignedPackerIds: nextIds,
      scheduledPackerId: pack.scheduledPackerId === packerId ? null : pack.scheduledPackerId,
    });
  };

  const handleCellClick = (packerId, dateStr) => {
    if (selectedUnassignedId) {
      handleAssign(selectedUnassignedId, packerId, dateStr);
      return;
    }
    setAssigningCell((prev) =>
      prev && prev.packerId === packerId && prev.dateStr === dateStr
        ? null
        : { packerId, dateStr }
    );
  };

  const getCustomerName = (customerId) =>
    customers?.find((c) => c.id === customerId)?.name ?? "—";
  const getCommodityDesc = (commodityId) =>
    commodities?.find((c) => c.id === commodityId)?.description ?? "—";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "'Segoe UI', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar site={currentSite} onSiteChange={setCurrentSite} sites={SITES} />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          maxWidth: PAGE_MAX_WIDTH,
          margin: "0 auto",
          padding: "20px 24px",
          width: "100%",
          gap: 16,
        }}
      >
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
          <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
            Packer Schedule
          </span>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              color: "#475569",
            }}
          >
            Start date:
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{
                padding: "6px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 12,
              }}
            />
          </label>
          <span style={{ fontSize: 11, color: "#64748b" }}>
            {numDays} days · Packers on Y-axis, dates on X-axis
          </span>
          <BtnSecondary
            onClick={() => router.push("/packing-schedule")}
            style={{ fontSize: 12, marginLeft: "auto" }}
          >
            Packing Table
          </BtnSecondary>
        </div>

        {/* Filters: Packers, Commodities, Customers — dropdown multiselect */}
        <div
          ref={filterRef}
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "12px 18px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "flex-start",
            gap: 16,
          }}
        >
          {/* Packers dropdown */}
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginRight: 6 }}>
              Packers:
            </span>
            <button
              type="button"
              onClick={() => setOpenFilter((v) => (v === "packers" ? null : "packers"))}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 12,
                minWidth: 160,
                background: "#fff",
                color: "#334155",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {filterPackerIds.length === 0
                ? "All packers"
                : filterPackerIds.length === 1
                  ? (activePackers || []).find((p) => p.id === filterPackerIds[0])?.name ?? "1 selected"
                  : `${filterPackerIds.length} selected`}
            </button>
            {openFilter === "packers" && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: 8,
                  minWidth: 200,
                  maxHeight: 260,
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {(activePackers || []).map((pk) => (
                  <label
                    key={pk.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                      borderRadius: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filterPackerIds.includes(pk.id)}
                      onChange={(e) => {
                        setFilterPackerIds((prev) =>
                          e.target.checked
                            ? [...prev, pk.id]
                            : prev.filter((id) => id !== pk.id)
                        );
                      }}
                    />
                    {pk.name}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Commodities dropdown */}
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginRight: 6 }}>
              Commodities:
            </span>
            <button
              type="button"
              onClick={() => setOpenFilter((v) => (v === "commodities" ? null : "commodities"))}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 12,
                minWidth: 160,
                background: "#fff",
                color: "#334155",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {filterCommodityIds.length === 0
                ? "All commodities"
                : filterCommodityIds.length === 1
                  ? (commodities || []).find((c) => c.id === filterCommodityIds[0])?.description ?? "1 selected"
                  : `${filterCommodityIds.length} selected`}
            </button>
            {openFilter === "commodities" && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: 8,
                  minWidth: 200,
                  maxHeight: 260,
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {(commodities || []).map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                      borderRadius: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filterCommodityIds.includes(c.id)}
                      onChange={(e) => {
                        setFilterCommodityIds((prev) =>
                          e.target.checked
                            ? [...prev, c.id]
                            : prev.filter((id) => id !== c.id)
                        );
                      }}
                    />
                    {c.description ?? `#${c.id}`}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Customers dropdown */}
          <div style={{ position: "relative" }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginRight: 6 }}>
              Customers:
            </span>
            <button
              type="button"
              onClick={() => setOpenFilter((v) => (v === "customers" ? null : "customers"))}
              style={{
                padding: "6px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 12,
                minWidth: 160,
                background: "#fff",
                color: "#334155",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              {filterCustomerIds.length === 0
                ? "All customers"
                : filterCustomerIds.length === 1
                  ? (customers || []).find((c) => c.id === filterCustomerIds[0])?.name ?? "1 selected"
                  : `${filterCustomerIds.length} selected`}
            </button>
            {openFilter === "customers" && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: 4,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                  padding: 8,
                  minWidth: 200,
                  maxHeight: 260,
                  overflowY: "auto",
                  zIndex: 10,
                }}
              >
                {(customers || []).map((c) => (
                  <label
                    key={c.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "6px 8px",
                      cursor: "pointer",
                      fontSize: 12,
                      borderRadius: 4,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={filterCustomerIds.includes(c.id)}
                      onChange={(e) => {
                        setFilterCustomerIds((prev) =>
                          e.target.checked
                            ? [...prev, c.id]
                            : prev.filter((id) => id !== c.id)
                        );
                      }}
                    />
                    {c.name ?? `#${c.id}`}
                  </label>
                ))}
              </div>
            )}
          </div>

          {(filterPackerIds.length > 0 ||
            filterCommodityIds.length > 0 ||
            filterCustomerIds.length > 0) && (
            <BtnSecondary
              onClick={() => {
                setFilterPackerIds([]);
                setFilterCommodityIds([]);
                setFilterCustomerIds([]);
              }}
              style={{ fontSize: 12, alignSelf: "center" }}
            >
              Clear filters
            </BtnSecondary>
          )}
        </div>

        <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
          {/* Sidebar: Packs without vessel */}
          <div
            style={{
              width: 240,
              flexShrink: 0,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
                  style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Packs without packer
                </div>
                <div
                  style={{
                    padding: "6px 10px",
                    fontSize: 10.5,
                    color: "#64748b",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  Select one, then click a packer/date cell to assign
                </div>
            <div style={{ overflowY: "auto", flex: 1, padding: 8 }}>
              {packsWithoutPacker.length === 0 && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    padding: 12,
                    textAlign: "center",
                  }}
                >
                  No packs without packer
                </div>
              )}
              {packsWithoutPacker.map((p) => {
                const selected = selectedUnassignedId === p.id;
                const stockCheck = checkStockAvailabilityForPack(p, {
                  packs,
                  tickets,
                  transactions,
                  cmos,
                  currentSite,
                });
                return (
                  <div
                    key={p.id}
                    onClick={() =>
                      setSelectedUnassignedId(selected ? null : p.id)
                    }
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: selected ? "#dbeafe" : stockCheck.insufficient ? "#fef2f2" : "#f8fafc",
                      border: selected
                        ? "2px solid #3b82f6"
                        : stockCheck.insufficient
                          ? "1px solid #fecaca"
                          : "1px solid #e2e8f0",
                      marginBottom: 6,
                      cursor: "pointer",
                      fontSize: 11.5,
                      color: "#334155",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#1e40af" }}>
                      #{p.id}
                    </div>
                    <div style={{ marginTop: 2 }}>
                      {getCustomerName(p.customerId)}
                    </div>
                    <div style={{ color: "#64748b", fontSize: 10.5 }}>
                      {getCommodityDesc(p.commodityId)} · {p.jobReference || "—"}
                    </div>
                    {stockCheck.insufficient && (
                      <div
                        style={{
                          fontSize: 9,
                          color: "#b91c1c",
                          marginTop: 4,
                          fontWeight: 600,
                          background: "#fee2e2",
                          padding: "2px 4px",
                          borderRadius: 4,
                        }}
                        title={`Available: ${(stockCheck.available ?? 0).toFixed(1)} MT, required: ${(stockCheck.required ?? 0).toFixed(1)} MT`}
                      >
                        ⚠ Low stock ({stockCheck.shortfall?.toFixed(1) ?? "?"} MT short)
                      </div>
                    )}
                    <div style={{ marginTop: 4 }}>
                      <PackStatusBadge status={p.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid: Packers × Dates */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "auto",
            }}
          >
            {packerRows.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: "center",
                  color: "#64748b",
                  fontSize: 13,
                }}
              >
                No active packers. Add packers in Reference Data to see the schedule.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "max-content",
                }}
              >
                {/* Header row: dates */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "140px repeat(" +
                      numDays +
                      ", minmax(100px, 1fr))",
                    gap: 0,
                    background: "#f1f5f9",
                    borderBottom: "1px solid #e2e8f0",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      padding: "10px 12px",
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      borderRight: "1px solid #e2e8f0",
                    }}
                  >
                    Packer
                  </div>
                  {dates.map((d) => (
                    <div
                      key={d}
                      style={{
                        padding: "10px 8px",
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "#64748b",
                        textAlign: "center",
                        borderRight: "1px solid #e2e8f0",
                      }}
                    >
                      {new Date(d + "T12:00:00").toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  ))}
                </div>
                {/* Totals row: per-date containers & tonnage */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "140px repeat(" +
                      numDays +
                      ", minmax(100px, 1fr))",
                    gap: 0,
                    background: "#e2e8f0",
                    borderBottom: "2px solid #e2e8f0",
                    position: "sticky",
                    top: 40,
                    zIndex: 2,
                  }}
                >
                  <div
                    style={{
                      padding: "6px 12px",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "#475569",
                      borderRight: "1px solid #cbd5e1",
                    }}
                  >
                    Day total
                  </div>
                  {dates.map((d) => {
                    const t = totalsByDate[d] || { containers: 0, mt: 0 };
                    return (
                      <div
                        key={d}
                        style={{
                          padding: "6px 8px",
                          fontSize: 10,
                          fontWeight: 600,
                          color: "#475569",
                          textAlign: "center",
                          borderRight: "1px solid #cbd5e1",
                        }}
                      >
                        {t.containers > 0 || t.mt > 0 ? (
                          <>
                            <span title="Containers">{t.containers} cnt</span>
                            <br />
                            <span title="Tonnage (MT)">{t.mt} MT</span>
                          </>
                        ) : (
                          "—"
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Packer rows */}
                {packerRows.map((row) => (
                  <div
                    key={row.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "140px repeat(" +
                        numDays +
                        ", minmax(100px, 1fr))",
                      gap: 0,
                      borderBottom: "1px solid #f1f5f9",
                      minHeight: 80,
                    }}
                  >
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "#fafafa",
                        borderRight: "1px solid #e2e8f0",
                        fontSize: 11.5,
                        fontWeight: 600,
                        color: "#1e293b",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      {row.name}
                      {(() => {
                        const t = totalsByPacker[row.id] || { containers: 0, mt: 0 };
                        if (t.containers > 0 || t.mt > 0) {
                          return (
                            <span
                              style={{
                                fontSize: 9.5,
                                fontWeight: 500,
                                color: "#64748b",
                              }}
                            >
                              {t.containers} cnt · {t.mt} MT
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </div>
                    {dates.map((dateStr) => {
                      const cellPacks = getPacksForCell(row.id, dateStr);
                      const isAssigning =
                        assigningCell &&
                        assigningCell.packerId === row.id &&
                        assigningCell.dateStr === dateStr;
                      return (
                        <div
                          key={dateStr}
                          onClick={() => handleCellClick(row.id, dateStr)}
                          style={{
                            minHeight: 76,
                            padding: 6,
                            borderRight: "1px solid #f1f5f9",
                            background: isAssigning ? "#eff6ff" : "transparent",
                            cursor: "pointer",
                            overflowY: "auto",
                          }}
                        >
                          {cellPacks.map((p) => {
                            const v = getVesselForPack(p, vesselDepartures || []);
                            const cutoffLabel = v?.vesselCutoffDate
                              ? new Date(v.vesselCutoffDate).toLocaleDateString("en-GB", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : null;
                            const stockCheck = checkStockAvailabilityForPack(p, {
                              packs,
                              tickets,
                              transactions,
                              cmos,
                              currentSite,
                            });
                            return (
                              <div
                                key={p.id}
                                style={{
                                  background: stockCheck.insufficient ? "#fef2f2" : "#fff",
                                  border: stockCheck.insufficient
                                    ? "1px solid #fecaca"
                                    : "1px solid #e2e8f0",
                                  borderRadius: 6,
                                  padding: "6px 8px",
                                  marginBottom: 4,
                                  fontSize: 10.5,
                                  color: "#334155",
                                  position: "relative",
                                }}
                              >
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUnassign(p.id, row.id);
                                  }}
                                  title="Remove from packer"
                                  style={{
                                    position: "absolute",
                                    top: 4,
                                    right: 4,
                                    width: 18,
                                    height: 18,
                                    borderRadius: 4,
                                    border: "none",
                                    background: "#fef2f2",
                                    color: "#dc2626",
                                    cursor: "pointer",
                                    fontSize: 12,
                                    lineHeight: 1,
                                    padding: 0,
                                  }}
                                >
                                  ×
                                </button>
                                <div
                                  style={{
                                    fontWeight: 700,
                                    color: "#1e40af",
                                    paddingRight: 20,
                                  }}
                                >
                                  #{p.id}
                                </div>
                                <div
                                  style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {getCustomerName(p.customerId)}
                                </div>
                                {cutoffLabel && (
                                  <div
                                    style={{
                                      fontSize: 9.5,
                                      color: "#b45309",
                                      marginTop: 2,
                                      fontWeight: 600,
                                    }}
                                  >
                                    Cut-off: {cutoffLabel}
                                  </div>
                                )}
                                {stockCheck.insufficient && (
                                  <div
                                    style={{
                                      fontSize: 9,
                                      color: "#b91c1c",
                                      marginTop: 2,
                                      fontWeight: 600,
                                      background: "#fee2e2",
                                      padding: "2px 4px",
                                      borderRadius: 4,
                                    }}
                                    title={`Available: ${(stockCheck.available ?? 0).toFixed(1)} MT, required: ${(stockCheck.required ?? 0).toFixed(1)} MT`}
                                  >
                                    ⚠ Low stock ({stockCheck.shortfall?.toFixed(1) ?? "?"} MT short)
                                  </div>
                                )}
                                <div style={{ marginTop: 4 }}>
                                  <PackStatusBadge status={p.status} />
                                </div>
                                <div
                                  style={{
                                    marginTop: 2,
                                    cursor: "pointer",
                                    textDecoration: "underline",
                                    color: "#2563eb",
                                    fontSize: 10,
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/pack?id=${p.id}`);
                                  }}
                                >
                                  Edit
                                </div>
                              </div>
                            );
                          })}
                          {cellPacks.length === 0 && (
                            <span style={{ fontSize: 10, color: "#cbd5e1" }}>
                              {selectedUnassignedId ? "Click to assign" : "—"}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
