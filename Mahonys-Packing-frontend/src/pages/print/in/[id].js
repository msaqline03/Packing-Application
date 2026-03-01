"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import { useApp } from "../../../context/AppContext";
import { SITES } from "../../../utils/mockData";

export default function PrintInTicket() {
  const router = useRouter();
  const { id } = useParams();
  const { tickets, cmos, stockLocations } = useApp();

  const ticket = tickets.find((t) => t.id === Number(id));
  const cmo = ticket ? cmos.find((c) => c.id === ticket.cmoId) : null;
  const site = ticket ? SITES.find((s) => s.id === ticket.site) : null;

  const getLocationName = (locationId) => {
    // Handle both old string-based and new ID-based location references
    if (typeof locationId === 'string') return locationId;
    const location = stockLocations.find((loc) => loc.id === locationId);
    return location ? location.name : "—";
  };

  const grossTotal = ticket ? ticket.grossWeights.reduce((a, b) => a + b, 0) : 0;
  const tareTotal = ticket ? ticket.tareWeights.reduce((a, b) => a + b, 0) : 0;
  const netTotal = grossTotal - tareTotal;

  if (!ticket) {
    return (
      <div style={{ textAlign: "center", padding: 80, color: "#9ca3af", fontFamily: "'Segoe UI', sans-serif" }}>
        <p>Ticket not found.</p>
        <button onClick={() => router.push("/incoming")} style={{ marginTop: 16, background: "#3b82f6", color: "#fff", border: "none", borderRadius: 6, padding: "8px 20px", cursor: "pointer", fontSize: 13 }}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e8edf2", fontFamily: "'Segoe UI', sans-serif", padding: 32 }}>
      {/* Print controls (hidden on print) */}
      <div className="no-print" style={{ maxWidth: 680, margin: "0 auto 20px", display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button onClick={() => window.print()} style={{ background: "#2563eb", color: "#fff", border: "none", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Print</button>
        <button onClick={() => router.push("/incoming")} style={{ background: "#fff", color: "#374151", border: "1px solid #d1d5db", borderRadius: 6, padding: "8px 16px", cursor: "pointer", fontSize: 13 }}>Back</button>
      </div>

      {/* Ticket Document */}
      <div style={{ maxWidth: 680, margin: "0 auto", background: "#fff", borderRadius: 12, boxShadow: "0 4px 24px rgba(0,0,0,0.1)", overflow: "hidden" }}>
        {/* Header band */}
        <div style={{ background: "linear-gradient(135deg, #0f1e3d, #1a3a6b)", padding: "18px 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, background: "linear-gradient(135deg, #3b82f6, #60a5fa)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff" }}>W</div>
            <div>
              <div style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>Mahonys EMS</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Weighbridge Ticket — Incoming</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#60a5fa", fontWeight: 700, fontSize: 20 }}>#{ticket.id}</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>{ticket.date}</div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 28px" }}>
          {/* Two-column info */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
            <Section title="Customer & CMO">
              <PrintRow label="Customer" value={cmo?.customer?.name || "—"} />
              <PrintRow label="Acuity ID" value={cmo?.acuityId || "—"} />
              <PrintRow label="Email" value={cmo?.customer?.email || "—"} />
              <PrintRow label="Site" value={site?.name || "—"} />
            </Section>
            <Section title="Commodity">
              <PrintRow label="Commodity" value={cmo?.commodity?.name || "—"} />
              <PrintRow label="Grade" value={ticket.grade || "—"} />
              <PrintRow label="Status" value={ticket.status} />
              <PrintRow label="Signoff" value={ticket.signoff || "—"} />
            </Section>
          </div>

          <div style={{ borderTop: "1px solid #f1f5f9", margin: "20px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px 32px" }}>
            <Section title="Truck & Weights">
              <PrintRow label="Truck" value={ticket.truck?.name || "—"} />
              <PrintRow label="Driver" value={ticket.truck?.driver || "—"} />
              <PrintRow label="Split Load" value={ticket.splitLoad ? "Yes" : "No"} />
            </Section>
            <Section title="Location">
              <PrintRow label="Unloaded To" value={getLocationName(ticket.unloadedLocation) || "—"} />
            </Section>
          </div>

          {/* Weights table */}
          <div style={{ marginTop: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Weights (t)</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ textAlign: "left", padding: "7px 10px", borderBottom: "2px solid #e2e8f0", fontWeight: 600, color: "#64748b", fontSize: 10.5, textTransform: "uppercase" }}>Type</th>
                  {ticket.grossWeights.map((_, i) => (<th key={`g${i}`} style={{ textAlign: "right", padding: "7px 10px", borderBottom: "2px solid #e2e8f0", fontWeight: 600, color: "#64748b", fontSize: 10.5 }}>Entry {i + 1}</th>))}
                  <th style={{ textAlign: "right", padding: "7px 10px", borderBottom: "2px solid #e2e8f0", fontWeight: 700, color: "#0f1e3d", fontSize: 10.5 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#374151" }}>Gross</td>
                  {ticket.grossWeights.map((w, i) => (<td key={i} style={{ textAlign: "right", padding: "7px 10px", borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>{(w / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>))}
                  <td style={{ textAlign: "right", padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#1e293b" }}>{(grossTotal / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                </tr>
                <tr>
                  <td style={{ padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 600, color: "#374151" }}>Tare</td>
                  {ticket.tareWeights.map((w, i) => (<td key={i} style={{ textAlign: "right", padding: "7px 10px", borderBottom: "1px solid #f1f5f9", color: "#1e293b" }}>{(w / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>))}
                  <td style={{ textAlign: "right", padding: "7px 10px", borderBottom: "1px solid #f1f5f9", fontWeight: 700, color: "#1e293b" }}>{(tareTotal / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })}</td>
                </tr>
                <tr style={{ background: "#ecfdf5" }}>
                  <td style={{ padding: "8px 10px", fontWeight: 700, color: "#065f46" }}>Net</td>
                  <td colSpan={ticket.grossWeights.length} />
                  <td style={{ textAlign: "right", padding: "8px 10px", fontWeight: 700, color: "#059669", fontSize: 14 }}>{(netTotal / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 })} t</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Test results */}
          {Object.keys(ticket.tests).length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Test Results</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {Object.entries(ticket.tests).map(([name, val]) => (
                  <div key={name} style={{ background: "#f8fafc", borderRadius: 6, padding: "8px 12px", border: "1px solid #e2e8f0", minWidth: 120 }}>
                    <div style={{ fontSize: 10.5, color: "#64748b", textTransform: "uppercase", fontWeight: 600 }}>{name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#1e293b", marginTop: 2 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {ticket.notes && (
            <div style={{ marginTop: 20, padding: "10px 14px", background: "#f8fafc", borderRadius: 6, border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 3 }}>Notes</div>
              <div style={{ fontSize: 12, color: "#374151" }}>{ticket.notes}</div>
            </div>
          )}

          {/* Signature line */}
          <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between" }}>
            <div style={{ borderTop: "1px solid #d1d5db", width: 200, paddingTop: 6 }}>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Signature — Operator</div>
            </div>
            <div style={{ borderTop: "1px solid #d1d5db", width: 200, paddingTop: 6 }}>
              <div style={{ fontSize: 10, color: "#94a3b8" }}>Signature — Driver</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "10px 28px", display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "#94a3b8" }}>
          <span>Mahonys EMS</span>
          <span>Generated: {new Date().toLocaleString()}</span>
        </div>
      </div>

      <style>{`@media print { .no-print { display: none !important; } body { background: #fff !important; } }`}</style>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, paddingBottom: 4, borderBottom: "1px solid #f1f5f9" }}>{title}</div>
      {children}
    </div>
  );
}

function PrintRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontSize: 12 }}>
      <span style={{ color: "#64748b", fontWeight: 500 }}>{label}</span>
      <span style={{ color: "#1e293b", fontWeight: 600 }}>{value}</span>
    </div>
  );
}
