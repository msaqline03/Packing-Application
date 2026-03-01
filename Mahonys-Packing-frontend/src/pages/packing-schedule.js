"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  PackStatusBadge,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  DataTable,
} from "../components/SharedComponents";
import { SITES, PACK_STATUSES, getVesselForPack } from "../utils/mockData";

export default function PackingSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    packs,
    customers,
    commodityTypes,
    commodities,
    shippingLines,
    containerParks,
    transporters,
    packers,
    vesselDepartures,
    currentSite,
    setCurrentSite,
    updatePack,
    deletePack,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([...PACK_STATUSES]);
  const [importExportFilter, setImportExportFilter] = useState("all"); // "all" | "Import" | "Export"
  const [searchByDate, setSearchByDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedPackId, setSelectedPackId] = useState(null);

  useEffect(() => {
    const idParam = searchParams.get("id");
    if (idParam) {
      const packId = Number(idParam);
      const pack = packs.find((p) => p.id === packId);
      if (pack) {
        setSelectedPackId(packId);
        if (!selectedStatuses.includes(pack.status)) {
          setSelectedStatuses((prev) => [...prev, pack.status]);
        }
        if (pack.date && pack.date !== selectedDate) {
          setSearchByDate(false);
        }
      }
    }
  }, [searchParams, packs]);

  const toggleStatus = (s) =>
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const filtered = useMemo(() => {
    return packs
      .filter((p) => p.siteId === currentSite)
      .filter((p) => selectedStatuses.includes(p.status))
      .filter(
        (p) =>
          importExportFilter === "all" || p.importExport === importExportFilter,
      )
      .filter(
        (p) => !searchByDate || (p.date && p.date.startsWith(selectedDate)),
      )
      .filter((p) => {
        if (!search) return true;
        const customer = customers.find((c) => c.id === p.customerId);
        const commodity = commodities.find((c) => c.id === p.commodityId);
        const v = getVesselForPack(p, vesselDepartures || []);
        const text = `${p.id} ${p.jobReference || ""} ${customer?.name || ""} ${
          commodity?.description || ""
        } ${p.exporter || ""} ${p.destinationCountry || ""} ${v?.vessel || ""} ${
          p.jobNotes || ""
        }`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [
    packs,
    customers,
    commodities,
    vesselDepartures,
    currentSite,
    selectedStatuses,
    importExportFilter,
    searchByDate,
    selectedDate,
    search,
  ]);

  const selected =
    packs.find((p) => p.id === selectedPackId) ||
    filtered[0] ||
    null;
  const selectedCustomer = selected
    ? customers.find((c) => c.id === selected.customerId)
    : null;
  const selectedCommodity = selected
    ? commodities.find((c) => c.id === selected.commodityId)
    : null;
  const selectedCommodityType = selected
    ? commodityTypes.find((t) => t.id === selected.commodityTypeId)
    : null;
  const selectedShippingLine = selected?.shippingLineId
    ? shippingLines.find((l) => l.id === selected.shippingLineId)
    : null;

  const packColumns = useMemo(
    () => [
      { id: "id", label: "ID", width: "56px", getValue: (p) => p.id, cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 12 } },
      { id: "importExport", label: "I/E", width: "72px", getValue: (p) => p.importExport ?? "", render: (_, p) => <span style={{ fontSize: 11, color: "#64748b" }}>{p.importExport || "—"}</span> },
      {
        id: "customer",
        label: "Customer",
        minWidth: 100,
        getValue: (p) => customers.find((c) => c.id === p.customerId)?.name ?? "",
        render: (_, p) => <span>{customers.find((c) => c.id === p.customerId)?.name || "—"}</span>,
      },
      {
        id: "commodity",
        label: "Commodity",
        minWidth: 100,
        getValue: (p) => commodities.find((c) => c.id === p.commodityId)?.description ?? "",
        render: (_, p) => <span>{commodities.find((c) => c.id === p.commodityId)?.description || "—"}</span>,
      },
      {
        id: "status",
        label: "Status",
        width: "110px",
        getValue: (p) => p.status,
        render: (_, p) => <PackStatusBadge status={p.status} />,
      },
      { id: "jobReference", label: "Job Ref", width: "90px", getValue: (p) => p.jobReference ?? "", render: (_, p) => <span style={{ color: "#64748b", fontSize: 11 }}>{p.jobReference || "—"}</span> },
      { id: "containersRequired", label: "Cnt", width: "70px", getValue: (p) => p.containersRequired ?? "", render: (_, p) => <span style={{ textAlign: "right" }}>{p.containersRequired ?? "—"}</span> },
      { id: "mtTotal", label: "MT", width: "70px", getValue: (p) => p.mtTotal ?? "", render: (_, p) => <span style={{ textAlign: "right", fontWeight: 600, color: "#059669" }}>{p.mtTotal ?? "—"}</span> },
    ],
    [customers, commodities]
  );

  const handleDelete = () => {
    if (selected && window.confirm("Delete this pack permanently?")) {
      deletePack(selected.id);
      setSelectedPackId(null);
    }
  };

  const advanceDate = (d) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(dt.toISOString().split("T")[0]);
  };

  const getSiteName = (siteId) => {
    const site = SITES.find((s) => s.id === siteId);
    return site ? site.name : "—";
  };

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
          minHeight: 0,
          maxWidth: 1920,
          margin: "0 auto",
          padding: "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
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
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              minWidth: 180,
              maxWidth: 340,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search packs…"
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={importExportFilter}
            onChange={(e) => setImportExportFilter(e.target.value)}
            style={{
              padding: "6px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12,
              background: "#fff",
            }}
          >
            <option value="all">All (Import/Export)</option>
            <option value="Import">Import</option>
            <option value="Export">Export</option>
          </select>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PACK_STATUSES.map((s) => {
              const on = selectedStatuses.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  style={{
                    background: on ? "#dbeafe" : "#f3f4f6",
                    color: on ? "#1e40af" : "#6b7280",
                    border: "none",
                    borderRadius: 14,
                    padding: "3px 8px",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.replace(" ", "\u00a0")}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginLeft: "auto",
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 11.5,
                color: "#6b7280",
              }}
            >
              <input
                type="checkbox"
                checked={searchByDate}
                onChange={(e) => setSearchByDate(e.target.checked)}
                style={{ accentColor: "#3b82f6" }}
              />
              By Date
            </label>
            {searchByDate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  background: "#f0f4f8",
                  borderRadius: 6,
                  padding: "2px 4px",
                }}
              >
                <button
                  onClick={() => advanceDate(-1)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#374151",
                    fontSize: 14,
                    padding: "2px 6px",
                  }}
                >
                  ‹
                </button>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 12,
                    color: "#374151",
                    outline: "none",
                    padding: "2px 2px",
                  }}
                />
                <button
                  onClick={() => advanceDate(1)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#374151",
                    fontSize: 14,
                    padding: "2px 6px",
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 6 }}>
            <BtnSecondary
              onClick={() => router.push("/packing/schedule")}
              style={{ fontSize: 12 }}
            >
              Schedule
            </BtnSecondary>
            <BtnPrimary
              onClick={() => router.push("/pack?mode=create")}
              style={{ fontSize: 12 }}
            >
              + Create Pack
            </BtnPrimary>
            <BtnSecondary
              onClick={() => selected && router.push(`/pack?id=${selected.id}`)}
              disabled={!selected}
              style={{ fontSize: 12 }}
            >
              Edit
            </BtnSecondary>
            <BtnDanger
              onClick={handleDelete}
              disabled={!selected}
              style={{ fontSize: 12 }}
            >
              Delete
            </BtnDanger>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: "flex", gap: 16, flex: 1, minHeight: 0 }}>
          <div
            style={{
              flex: "1 1 0",
              minHeight: 0,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <DataTable
              columns={packColumns}
              data={filtered}
              getRowKey={(p) => p.id}
              onRowClick={(p) => setSelectedPackId(p.id)}
              selectedRowKey={selectedPackId}
              fillHeight
              emptyMessage="No packs match the current filters."
            />
          </div>

          {/* Detail panel */}
          <div
            style={{
              width: 300,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1e3d" }}>
                Pack Details
              </span>
              {selected && <PackStatusBadge status={selected.status} />}
            </div>
            {selected ? (
              <>
                <InfoRow label="Pack ID" value={`#${selected.id}`} />
                <InfoRow label="Import/Export" value={selected.importExport} />
                <InfoRow
                  label="Customer"
                  value={selectedCustomer?.name || "—"}
                />
                <InfoRow label="Exporter" value={selected.exporter || "—"} />
                <InfoRow
                  label="Commodity Type"
                  value={selectedCommodityType?.name || "—"}
                />
                <InfoRow
                  label="Commodity"
                  value={selectedCommodity?.description || "—"}
                />
                <InfoRow
                  label="Job Reference"
                  value={selected.jobReference || "—"}
                />
                <InfoRow
                  label="Fumigation"
                  value={selected.fumigation || "—"}
                />
                <InfoRow
                  label="Containers"
                  value={selected.containersRequired ?? "—"}
                />
                <InfoRow
                  label="Qty/Container"
                  value={
                    selected.quantityPerContainer != null
                      ? selected.quantityPerContainer
                      : "—"
                  }
                />
                <InfoRow
                  label="MT Total"
                  value={selected.mtTotal ?? "—"}
                  highlight
                />
                <InfoRow
                  label="Destination"
                  value={
                    [selected.destinationCountry, selected.destinationPort]
                      .filter(Boolean)
                      .join(", ") || "—"
                  }
                />
                <InfoRow
                  label="Shipping Line"
                  value={
                    selectedShippingLine?.name ||
                    selectedShippingLine?.code ||
                    "—"
                  }
                />
                {(() => {
                  const v = getVesselForPack(selected, vesselDepartures || []);
                  return (
                    <>
                      <InfoRow
                        label="Vessel"
                        value={
                          v?.vessel
                            ? `${v.vessel}${v.voyageNumber ? ` (${v.voyageNumber})` : ""}`
                            : "—"
                        }
                      />
                      {v?.vessel && (
                        <>
                          <InfoRow
                            label="Cut-off Date"
                            value={v.vesselCutoffDate || "—"}
                          />
                          <InfoRow
                            label="Receivals Open"
                            value={v.vesselReceivalsOpenDate || "—"}
                          />
                          <InfoRow label="ETA" value={v.vesselEta || "—"} />
                          <InfoRow label="ETD" value={v.vesselEtd || "—"} />
                          <InfoRow
                            label="Free Days"
                            value={
                              v.vesselFreeDays != null &&
                              v.vesselFreeDays !== ""
                                ? String(v.vesselFreeDays)
                                : "—"
                            }
                          />
                        </>
                      )}
                    </>
                  );
                })()}
                <InfoRow label="Site" value={getSiteName(selected.siteId)} />
                {(selected.packType === "container" ||
                  (selected.containersRequired != null &&
                    selected.containersRequired > 0)) && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 12,
                      borderTop: "1px solid #e2e8f0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        color: "#64748b",
                        textTransform: "uppercase",
                        letterSpacing: 0.4,
                        fontWeight: 600,
                        marginBottom: 8,
                      }}
                    >
                      Assigned packers
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {(packers || [])
                        .filter((p) => p.status === "active")
                        .map((pkr) => {
                          const ids = Array.isArray(selected.assignedPackerIds)
                            ? selected.assignedPackerIds
                            : [];
                          const checked = ids.includes(pkr.id);
                          return (
                            <label
                              key={pkr.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                cursor: "pointer",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...ids, pkr.id]
                                    : ids.filter((id) => id !== pkr.id);
                                  updatePack(selected.id, {
                                    assignedPackerIds: next,
                                  });
                                }}
                                style={{ accentColor: "#3b82f6" }}
                              />
                              {pkr.name}
                            </label>
                          );
                        })}
                      {(!packers ||
                        packers.filter((p) => p.status === "active").length ===
                          0) && (
                        <span style={{ fontSize: 11, color: "#94a3b8" }}>
                          No active packers
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {selected.jobNotes && (
                  <InfoRow label="Job Notes" value={selected.jobNotes} />
                )}
              </>
            ) : (
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 12.5,
                  textAlign: "center",
                  paddingTop: 20,
                }}
              >
                Select a pack to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 11,
          color: "#64748b",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: highlight ? "#059669" : "#1e293b",
          fontWeight: highlight ? 700 : 500,
          textAlign: "right",
          maxWidth: "60%",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </span>
    </div>
  );
}
