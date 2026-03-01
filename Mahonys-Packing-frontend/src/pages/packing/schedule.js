"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../../context/AppContext";
import { Navbar, PackStatusBadge, BtnSecondary } from "../../components/SharedComponents";
import { SITES } from "../../utils/mockData";

function toDateStr(d) {
  return d.toISOString().split("T")[0];
}

function packDateStr(pack) {
  const raw = pack.date;
  if (!raw) return null;
  return typeof raw === "string" && raw.includes("T") ? raw.split("T")[0] : raw;
}

export default function PackingSchedulePage() {
  const router = useRouter();
  const {
    packs,
    packers,
    customers,
    commodities,
    currentSite,
    setCurrentSite,
    updatePack,
  } = useApp();

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

  const activePackers = useMemo(
    () => (packers || []).filter((p) => p.status === "active"),
    [packers]
  );

  const sitePacks = useMemo(
    () => (packs || []).filter((p) => p.siteId === currentSite),
    [packs, currentSite]
  );

  const unassignedPacks = useMemo(
    () =>
      sitePacks.filter((p) => p.scheduledPackerId == null || p.scheduledPackerId === ""),
    [sitePacks]
  );

  const getPacksForCell = useMemo(() => {
    return (packerId, dateStr) =>
      sitePacks.filter(
        (p) => p.scheduledPackerId === packerId && packDateStr(p) === dateStr
      );
  }, [sitePacks]);

  const [selectedUnassignedId, setSelectedUnassignedId] = useState(null);
  const [assigningCell, setAssigningCell] = useState(null); // { packerId, dateStr }

  const handleAssign = (packId, packerId, dateStr) => {
    updatePack(packId, { scheduledPackerId: packerId, date: dateStr });
    setSelectedUnassignedId(null);
    setAssigningCell(null);
  };

  const handleUnassign = (packId) => {
    updatePack(packId, { scheduledPackerId: null });
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
            Schedule
          </span>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
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
            {numDays} days · Click an unassigned pack then a cell to assign
          </span>
          <BtnSecondary
            onClick={() => router.push("/packing-schedule")}
            style={{ fontSize: 12, marginLeft: "auto" }}
          >
            Packing Table
          </BtnSecondary>
        </div>

        <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
          {/* Unassigned sidebar */}
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
              Unassigned packs
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: 8 }}>
              {unassignedPacks.length === 0 && (
                <div style={{ fontSize: 12, color: "#94a3b8", padding: 12, textAlign: "center" }}>
                  No unassigned packs
                </div>
              )}
              {unassignedPacks.map((p) => {
                const selected = selectedUnassignedId === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedUnassignedId(selected ? null : p.id)}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 6,
                      background: selected ? "#dbeafe" : "#f8fafc",
                      border: selected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                      marginBottom: 6,
                      cursor: "pointer",
                      fontSize: 11.5,
                      color: "#334155",
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#1e40af" }}>#{p.id}</div>
                    <div style={{ marginTop: 2 }}>{getCustomerName(p.customerId)}</div>
                    <div style={{ color: "#64748b", fontSize: 10.5 }}>
                      {getCommodityDesc(p.commodityId)} · {p.jobReference || "—"}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <PackStatusBadge status={p.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid */}
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
            <div style={{ display: "flex", flexDirection: "column", minWidth: "max-content" }}>
              {/* Header row: dates */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "140px repeat(" + numDays + ", minmax(100px, 1fr))",
                  gap: 0,
                  background: "#f1f5f9",
                  borderBottom: "2px solid #e2e8f0",
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

              {/* Packer rows */}
              {activePackers.length === 0 && (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  No active packers. Add packers in Reference Data → Packers.
                </div>
              )}
              {activePackers.map((packer) => (
                <div
                  key={packer.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "140px repeat(" + numDays + ", minmax(100px, 1fr))",
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
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#1e293b",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {packer.name}
                  </div>
                  {dates.map((dateStr) => {
                    const cellPacks = getPacksForCell(packer.id, dateStr);
                    const isAssigning =
                      assigningCell &&
                      assigningCell.packerId === packer.id &&
                      assigningCell.dateStr === dateStr;
                    return (
                      <div
                        key={dateStr}
                        onClick={() => handleCellClick(packer.id, dateStr)}
                        style={{
                          minHeight: 76,
                          padding: 6,
                          borderRight: "1px solid #f1f5f9",
                          background: isAssigning ? "#eff6ff" : "transparent",
                          cursor: "pointer",
                          overflowY: "auto",
                        }}
                      >
                        {cellPacks.map((p) => (
                          <div
                            key={p.id}
                            style={{
                              background: "#fff",
                              border: "1px solid #e2e8f0",
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
                                handleUnassign(p.id);
                              }}
                              title="Unassign"
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
                            <div style={{ fontWeight: 700, color: "#1e40af", paddingRight: 20 }}>
                              #{p.id}
                            </div>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {getCustomerName(p.customerId)}
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
                        ))}
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
          </div>
        </div>
      </div>
    </div>
  );
}
