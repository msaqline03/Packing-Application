"use client";
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { Navbar, StatusBadge, BtnPrimary, Select } from "../components/SharedComponents";
import { SITES, BAY_LOCATIONS } from "../utils/mockData";

export default function LoaderPage() {
  const { tickets, cmos, stockLocations, currentSite, setCurrentSite, updateTicket } = useApp();
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [tipped, setTipped] = useState({});

  // Show only in-tickets that are processing or booked (not yet completed)
  const activeTickets = tickets.filter(
    (t) => t.type === "in" && t.site === currentSite && (t.status === "processing" || t.status === "booked") && t.truck
  );

  const selected = activeTickets.find((t) => t.id === selectedTicketId) || activeTickets[0] || null;
  const selectedCmo = selected ? cmos.find((c) => c.id === selected.cmoId) : null;

  const handleLocationChange = (val) => {
    if (selected) updateTicket(selected.id, { unloadedLocation: Number(val) });
  };

  const getLocationName = (locationId) => {
    // Handle both old string-based and new ID-based location references
    if (typeof locationId === 'string') return locationId;
    const location = stockLocations.find((loc) => loc.id === locationId);
    return location ? location.name : "—";
  };

  const handleTipped = (val) => {
    setTipped((prev) => ({ ...prev, [selected.id]: val }));
  };

  const handleRefresh = () => {
    // In a real app this would re-fetch; here we just force re-render
    window.location.reload();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f4f8", fontFamily: "'Segoe UI', sans-serif" }}>
      <Navbar site={currentSite} onSiteChange={setCurrentSite} sites={SITES} />

      <div style={{ maxWidth: 1920, margin: "0 auto", padding: "20px 24px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f1e3d" }}>Loader View</h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>Assign bay locations and track unloading status</span>
          </div>
          <BtnPrimary onClick={handleRefresh} style={{ fontSize: 12 }}>Refresh</BtnPrimary>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {/* Left: Ticket list */}
          <div style={{ flex: 1, background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "2px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#0f1e3d", textTransform: "uppercase", letterSpacing: 0.5 }}>Active Incoming Tickets</span>
              <span style={{ fontSize: 11, color: "#64748b", background: "#dbeafe", padding: "2px 8px", borderRadius: 10, fontWeight: 600 }}>{activeTickets.length} active</span>
            </div>

            {activeTickets.length === 0 && (
              <div style={{ textAlign: "center", padding: 56, color: "#9ca3af", fontSize: 13 }}>
                No active tickets awaiting unload for this site.
              </div>
            )}

            {activeTickets.map((t) => {
              const cmo = cmos.find((c) => c.id === t.cmoId);
              const isSelected = selected?.id === t.id;
              const isTipped = tipped[t.id] === "yes";
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTicketId(t.id)}
                  style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer", background: isSelected ? "#eff6ff" : "transparent", borderLeft: isSelected ? "3px solid #3b82f6" : "3px solid transparent", transition: "all 0.15s" }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#2563eb" }}>Ticket #{t.id}</span>
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {isTipped && <span style={{ fontSize: 10, background: "#d1fae5", color: "#065f46", padding: "1px 6px", borderRadius: 8, fontWeight: 600 }}>TIPPED</span>}
                      <StatusBadge status={t.status} />
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>
                    {cmo?.customer?.name || "—"} · {cmo?.commodity?.name || "—"} ({t.grade})
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                    Truck: {t.truck?.name} · Location: {getLocationName(t.unloadedLocation) || "Not assigned"}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Detail + Controls */}
          <div style={{ width: 340, display: "flex", flexDirection: "column", gap: 14 }}>
            {selected ? (
              <>
                {/* Ticket Info Card */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", background: "linear-gradient(135deg, #1e3a6b, #2563eb)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Ticket #{selected.id}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
                    <DetailRow label="Customer" value={selectedCmo?.customer?.name || "—"} />
                    <DetailRow label="Commodity" value={`${selectedCmo?.commodity?.name || "—"} — ${selected.grade}`} />
                    <DetailRow label="Truck" value={selected.truck?.name || "—"} />
                    <DetailRow label="Driver" value={selected.truck?.driver || "—"} />
                    <DetailRow label="Gross (t)" value={selected.grossWeights.length ? (selected.grossWeights.reduce((a, b) => a + b, 0) / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : "—"} />
                  </div>
                </div>

                {/* Controls */}
                <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", overflow: "hidden" }}>
                  <div style={{ padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0f1e3d", textTransform: "uppercase", letterSpacing: 0.5 }}>Loader Controls</span>
                  </div>
                  <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 6 }}>Bay Location</label>
                      <Select value={selected.unloadedLocation || ""} onChange={(e) => handleLocationChange(e.target.value)}>
                        <option value="">— Select Location —</option>
                        {stockLocations
                          .filter((loc) => loc.status === "active")
                          .sort((a, b) => a.name.localeCompare(b.name))
                          .map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name} ({loc.locationType})
                            </option>
                          ))}
                      </Select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 600, color: "#374151", textTransform: "uppercase", letterSpacing: 0.4, display: "block", marginBottom: 6 }}>Truck Tipped?</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => handleTipped("yes")}
                          style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, background: tipped[selected.id] === "yes" ? "#d1fae5" : "#f3f4f6", color: tipped[selected.id] === "yes" ? "#065f46" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >Yes — Tipped</button>
                        <button
                          onClick={() => handleTipped("no")}
                          style={{ flex: 1, padding: "8px 0", border: "none", borderRadius: 6, background: tipped[selected.id] === "no" ? "#fee2e2" : "#f3f4f6", color: tipped[selected.id] === "no" ? "#991b1b" : "#6b7280", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                        >No — Pending</button>
                      </div>
                    </div>

                    {selected.unloadedLocation && (
                      <div style={{ padding: "10px 12px", background: "#eff6ff", borderRadius: 6, border: "1px solid #bfdbfe" }}>
                        <span style={{ fontSize: 11, color: "#1e40af" }}>Directing truck to <strong>{getLocationName(selected.unloadedLocation)}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                Select a ticket to manage
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
      <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.4, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: "#1e293b", fontWeight: 500 }}>{value}</span>
    </div>
  );
}
