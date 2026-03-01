"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  StatusBadge,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  DataTable,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function IncomingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    tickets,
    cmos,
    customers,
    internalAccounts,
    commodities,
    stockLocations,
    currentSite,
    setCurrentSite,
    deleteTicket,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState([
    "booked",
    "processing",
    "completed",
  ]);
  const [searchByDate, setSearchByDate] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  // Handle URL parameter for pre-selecting a ticket
  useEffect(() => {
    const ticketIdParam = searchParams.get("id");
    if (ticketIdParam) {
      const ticketId = Number(ticketIdParam);
      const ticket = tickets.find((t) => t.id === ticketId && t.type === "in");
      if (ticket) {
        setSelectedTicketId(ticketId);
        // Ensure the ticket's status is in the selected statuses
        if (!selectedStatuses.includes(ticket.status)) {
          setSelectedStatuses((prev) => [...prev, ticket.status]);
        }
        // If the ticket has a different date, disable date filtering or update the date
        if (ticket.date !== selectedDate) {
          setSearchByDate(false);
        }
      }
    }
  }, [searchParams, tickets]);

  const toggleStatus = (s) =>
    setSelectedStatuses((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const filtered = useMemo(() => {
    return tickets
      .filter((t) => t.type === "in" && t.site === currentSite)
      .filter((t) => selectedStatuses.includes(t.status))
      .filter((t) => !searchByDate || t.date === selectedDate)
      .filter((t) => {
        if (!search) return true;
        const cmo = cmos.find((c) => c.id === t.cmoId);
        const customer = cmo
          ? customers.find((c) => c.id === cmo.customerId) ||
            internalAccounts.find((a) => a.id === cmo.customerId)
          : null;
        const commodity = cmo
          ? commodities.find((c) => c.id === cmo.commodityId)
          : null;
        const text = `${t.id} ${customer?.name || ""} ${
          commodity?.description || ""
        } ${t.grade} ${t.truck?.name || ""} ${t.notes || ""} ${
          t.unloadedLocation || ""
        }`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [
    tickets,
    cmos,
    customers,
    commodities,
    currentSite,
    selectedStatuses,
    searchByDate,
    selectedDate,
    search,
  ]);

  const selected =
    tickets.find((t) => t.id === selectedTicketId && t.type === "in") ||
    filtered[0] ||
    null;
  const selectedCmo = selected
    ? cmos.find((c) => c.id === selected.cmoId)
    : null;
  const selectedCustomer = selectedCmo
    ? customers.find((c) => c.id === selectedCmo.customerId) ||
      internalAccounts.find((a) => a.id === selectedCmo.customerId)
    : null;
  const selectedCommodity = selectedCmo
    ? commodities.find((c) => c.id === selectedCmo.commodityId)
    : null;

  const netWeight = selected
    ? selected.grossWeights.reduce((a, b) => a + b, 0) -
      selected.tareWeights.reduce((a, b) => a + b, 0)
    : 0;

  const incomingColumns = useMemo(
    () => [
      {
        id: "id",
        label: "ID",
        width: "60px",
        getValue: (t) => t.id,
        cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 12 },
      },
      {
        id: "customer",
        label: "Customer / CMO",
        minWidth: 120,
        getValue: (t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          const customer = cmo
            ? customers.find((c) => c.id === cmo.customerId) ||
              internalAccounts.find((a) => a.id === cmo.customerId)
            : null;
          return `${customer?.name || "—"} (${cmo?.cmoReference || "—"})`;
        },
        render: (_, t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          const customer = cmo
            ? customers.find((c) => c.id === cmo.customerId) ||
              internalAccounts.find((a) => a.id === cmo.customerId)
            : null;
          return (
            <span>
              {customer?.name || "—"}{" "}
              <span style={{ color: "#94a3b8", fontSize: 11 }}>
                ({cmo?.cmoReference || "—"})
              </span>
            </span>
          );
        },
      },
      {
        id: "commodity",
        label: "Commodity & Grade",
        minWidth: 120,
        getValue: (t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          const commodity = cmo
            ? commodities.find((c) => c.id === cmo.commodityId)
            : null;
          return `${commodity?.description || "—"} ${t.grade || ""}`;
        },
        render: (_, t) => {
          const cmo = cmos.find((c) => c.id === t.cmoId);
          const commodity = cmo
            ? commodities.find((c) => c.id === cmo.commodityId)
            : null;
          return (
            <span>
              {commodity?.description || "—"}{" "}
              <span style={{ color: "#94a3b8", fontSize: 11 }}>{t.grade}</span>
            </span>
          );
        },
      },
      {
        id: "truck",
        label: "Truck",
        width: "100px",
        getValue: (t) => t.truck?.name ?? "",
        render: (_, t) => (
          <span style={{ color: "#64748b" }}>{t.truck?.name || "—"}</span>
        ),
      },
      {
        id: "status",
        label: "Status",
        width: "110px",
        getValue: (t) => t.status,
        render: (_, t) => <StatusBadge status={t.status} />,
      },
      {
        id: "net",
        label: "Net (t)",
        width: "80px",
        getValue: (t) =>
          (t.grossWeights.reduce((a, b) => a + b, 0) -
            t.tareWeights.reduce((a, b) => a + b, 0)) /
          1000,
        render: (_, t) => {
          const net =
            (t.grossWeights.reduce((a, b) => a + b, 0) -
              t.tareWeights.reduce((a, b) => a + b, 0)) /
            1000;
          return (
            <span
              style={{
                textAlign: "right",
                fontWeight: 600,
                color: net > 0 ? "#059669" : "#6b7280",
                display: "block",
              }}
            >
              {net > 0 ? net.toFixed(1) : "—"}
            </span>
          );
        },
      },
    ],
    [cmos, customers, internalAccounts, commodities],
  );

  const getLocationName = (locationId) => {
    // Handle both old string-based and new ID-based location references
    if (typeof locationId === "string") return locationId;
    const location = stockLocations.find((loc) => loc.id === locationId);
    return location ? location.name : "—";
  };

  const handleDelete = () => {
    if (selected && window.confirm("Delete this ticket permanently?")) {
      deleteTicket(selected.id);
      setSelectedTicketId(null);
    }
  };

  const advanceDate = (d) => {
    const dt = new Date(selectedDate);
    dt.setDate(dt.getDate() + d);
    setSelectedDate(dt.toISOString().split("T")[0]);
  };

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
        {/* ── TOOLBAR ───────────────────────────────────────────────────── */}
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
          {/* Search */}
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
              placeholder="Search tickets…"
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

          {/* Status pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["booked", "processing", "completed", "cancelled"].map((s) => {
              const on = selectedStatuses.includes(s);
              const colors = {
                booked: ["#dbeafe", "#1e40af"],
                processing: ["#fef3c7", "#b45309"],
                completed: ["#d1fae5", "#065f46"],
                cancelled: ["#fee2e2", "#991b1b"],
              };
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  style={{
                    background: on ? colors[s][0] : "#f3f4f6",
                    color: on ? colors[s][1] : "#6b7280",
                    border: "none",
                    borderRadius: 14,
                    padding: "3px 10px",
                    fontSize: 11.5,
                    fontWeight: 600,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    transition: "all 0.15s",
                  }}
                >
                  {s}
                </button>
              );
            })}
          </div>

          {/* Date */}
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

          {/* Actions */}
          <div style={{ display: "flex", gap: 6 }}>
            <BtnPrimary
              onClick={() => router.push("/ticket/in?mode=create")}
              style={{ fontSize: 12 }}
            >
              + Create Ticket
            </BtnPrimary>
            <BtnSecondary
              onClick={() =>
                selected && router.push(`/ticket/in?id=${selected.id}`)
              }
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

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* Ticket list */}
          <DataTable
            columns={incomingColumns}
            data={filtered}
            getRowKey={(t) => t.id}
            onRowClick={(t) => setSelectedTicketId(t.id)}
            selectedRowKey={selectedTicketId}
            maxHeight={420}
            emptyMessage="No tickets match the current filters."
          />

          {/* ── INFO PANEL ──────────────────────────────────────────────── */}
          <div
            style={{
              width: 280,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
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
                Ticket Details
              </span>
              {selected && <StatusBadge status={selected.status} />}
            </div>
            {selected ? (
              <>
                <InfoRow label="Ticket ID" value={`#${selected.id}`} />
                {selected.ticketReference && (
                  <InfoRow
                    label="Ticket Reference"
                    value={selected.ticketReference}
                  />
                )}
                {selected.additionalReference && (
                  <InfoRow
                    label="Additional Reference"
                    value={selected.additionalReference}
                  />
                )}
                <InfoRow
                  label="Customer"
                  value={selectedCustomer?.name || "—"}
                />
                <InfoRow label="CMO" value={selectedCmo?.cmoReference || "—"} />
                <InfoRow
                  label="Commodity"
                  value={selectedCommodity?.description || "—"}
                />
                <InfoRow label="Grade" value={selected.grade} />
                <InfoRow
                  label="Truck"
                  value={selected.truck?.name || "Not assigned"}
                />
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: 10,
                    marginTop: 2,
                  }}
                >
                  <InfoRow
                    label="Gross (t)"
                    value={
                      selected.grossWeights.length
                        ? (selected.grossWeights.reduce((a, b) => a + b, 0) / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Tare (t)"
                    value={
                      selected.tareWeights.length
                        ? (selected.tareWeights.reduce((a, b) => a + b, 0) / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })
                        : "—"
                    }
                  />
                  <InfoRow
                    label="Net (t)"
                    value={netWeight > 0 ? (netWeight / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : "—"}
                    highlight={netWeight > 0}
                  />
                </div>
                <InfoRow
                  label="Unloaded"
                  value={getLocationName(selected.unloadedLocation) || "—"}
                />
                <InfoRow label="Signoff" value={selected.signoff || "—"} />
                {selected.notes && (
                  <InfoRow label="Notes" value={selected.notes} />
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
                Select a ticket to view details
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
        }}
      >
        {value}
      </span>
    </div>
  );
}
