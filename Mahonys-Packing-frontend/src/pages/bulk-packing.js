"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  Modal,
  FormRow,
  Input,
  Select,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  PackStatusBadge,
} from "../components/SharedComponents";
import { SITES, createBlankBulkTicket, getVesselForPack } from "../utils/mockData";
import { calculateBulkTicketNetWeight } from "../utils/transactionEngine";

export default function BulkPackingPage() {
  const {
    packs,
    customers,
    commodities,
    stockLocations,
    trucks,
    tests,
    vesselDepartures,
    currentSite,
    setCurrentSite,
    startPackJob,
    addBulkTicketToPack,
    updateBulkTicketInPack,
    deleteBulkTicketFromPack,
  } = useApp();

  const [selectedPackId, setSelectedPackId] = useState(null);
  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [editingTicketId, setEditingTicketId] = useState(null);
  const [ticketForm, setTicketForm] = useState(createBlankBulkTicket());

  const bulkPacks = useMemo(
    () =>
      packs.filter(
        (p) =>
          p.siteId === currentSite &&
          p.packType === "bulk" &&
          ["Pending", "Inprogress"].includes(p.status)
      ),
    [packs, currentSite]
  );

  const selectedPack = selectedPackId
    ? packs.find((p) => p.id === selectedPackId)
    : null;
  const bulkTickets = selectedPack?.bulkTickets || [];
  const customer = selectedPack
    ? customers.find((c) => c.id === selectedPack.customerId)
    : null;
  const commodity = selectedPack
    ? commodities.find((c) => c.id === selectedPack.commodityId)
    : null;
  const testsForPack = selectedPack?.testRequired ? tests : [];

  const openNewTicket = () => {
    setEditingTicketId(null);
    setTicketForm(createBlankBulkTicket());
    setTicketModalOpen(true);
  };

  const openEditTicket = (bt) => {
    setEditingTicketId(bt.id);
    setTicketForm({ ...bt });
    setTicketModalOpen(true);
  };

  const saveTicket = () => {
    if (!selectedPackId) return;
    const payload = {
      ...ticketForm,
      truckId: ticketForm.truckId ? Number(ticketForm.truckId) : null,
      locationId: ticketForm.locationId ? Number(ticketForm.locationId) : null,
      grossWeight:
        ticketForm.grossWeight != null && ticketForm.grossWeight !== ""
          ? Number(ticketForm.grossWeight)
          : null,
      tareWeight:
        ticketForm.tareWeight != null && ticketForm.tareWeight !== ""
          ? Number(ticketForm.tareWeight)
          : null,
    };
    if (editingTicketId) {
      updateBulkTicketInPack(selectedPackId, editingTicketId, payload);
    } else {
      addBulkTicketToPack(selectedPackId, payload);
    }
    setTicketModalOpen(false);
  };

  const completeTicket = (bt) => {
    if (
      !selectedPackId ||
      !window.confirm(
        "Complete this ticket? This will create stock transactions (in/out and shrink if applicable)."
      )
    )
      return;
    updateBulkTicketInPack(selectedPackId, bt.id, { ...bt, status: "completed" });
  };

  const removeTicket = (ticketId) => {
    if (
      !selectedPackId ||
      !window.confirm("Remove this ticket from the pack?")
    )
      return;
    deleteBulkTicketFromPack(selectedPackId, ticketId);
    setTicketModalOpen(false);
  };

  const netWeight = (bt) => calculateBulkTicketNetWeight(bt) || 0;

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
        <h1
          style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f1e3d" }}
        >
          Bulk Packing
        </h1>

        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* Pack list */}
          <div
            style={{
              width: 320,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Bulk pack jobs
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {bulkPacks.length === 0 && (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  No bulk pack jobs (Pending/In progress) for this site.
                </div>
              )}
              {bulkPacks.map((p) => {
                const cnt = (p.bulkTickets || []).length;
                const isSelected = selectedPackId === p.id;
                const cust = customers.find((c) => c.id === p.customerId);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPackId(p.id)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      background: isSelected ? "#eff6ff" : "transparent",
                      fontSize: 13,
                      color: "#1e293b",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{ fontWeight: 700, color: "#2563eb" }}
                      >
                        #{p.id}
                      </span>
                      <PackStatusBadge status={p.status} />
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>
                      {p.jobReference || "—"}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>
                      {cust?.name || "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#94a3b8",
                        marginTop: 4,
                      }}
                    >
                      Tickets: {cnt}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected pack detail + tickets */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!selectedPack ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                Select a bulk pack job.
              </div>
            ) : (
              <>
                <div
                  style={{
                    padding: 20,
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          margin: "0 0 8px",
                          fontSize: 18,
                          fontWeight: 700,
                          color: "#0f1e3d",
                        }}
                      >
                        Pack #{selectedPack.id} · {selectedPack.jobReference || "—"}
                      </h2>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        {customer?.name} · {commodity?.description} ·{" "}
                        {selectedPack.importExport}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "#64748b",
                          marginTop: 8,
                        }}
                      >
                        Destination: {selectedPack.destinationCountry || "—"}{" "}
                        {selectedPack.destinationPort
                          ? `· ${selectedPack.destinationPort}`
                          : ""}
                        {(() => {
                          const v = getVesselForPack(selectedPack, vesselDepartures || []);
                          return v?.vessel ? ` · Vessel: ${v.vessel}${v.voyageNumber ? ` (${v.voyageNumber})` : ""}` : "";
                        })()}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                        Test required: {selectedPack.testRequired ? "Yes" : "No"} · Shrink
                        taken: {selectedPack.shrinkTaken ? "Yes" : "No"}
                      </div>
                    </div>
                    {selectedPack.status === "Pending" && (
                      <BtnPrimary
                        onClick={() => startPackJob(selectedPack.id)}
                        style={{ fontSize: 12 }}
                      >
                        Start job
                      </BtnPrimary>
                    )}
                  </div>
                </div>

                <div style={{ padding: 16, flex: 1, overflow: "auto" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 12,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#374151",
                      }}
                    >
                      Bulk tickets ({bulkTickets.length})
                    </span>
                    <BtnPrimary
                      onClick={openNewTicket}
                      style={{ fontSize: 12 }}
                    >
                      + Add ticket
                    </BtnPrimary>
                  </div>
                  {bulkTickets.length === 0 ? (
                    <div
                      style={{
                        padding: 32,
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: 13,
                        border: "1px dashed #e2e8f0",
                        borderRadius: 8,
                      }}
                    >
                      No tickets yet. Add tickets (like incoming/outgoing) with
                      weights and location.
                    </div>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <table
                        style={{
                          width: "100%",
                          borderCollapse: "collapse",
                          fontSize: 12,
                        }}
                      >
                        <thead>
                          <tr
                            style={{
                              background: "#f8fafc",
                              borderBottom: "2px solid #e2e8f0",
                            }}
                          >
                            <th style={thStyle}>Date</th>
                            <th style={thStyle}>Truck</th>
                            <th style={thStyle}>Gross (kg)</th>
                            <th style={thStyle}>Tare (kg)</th>
                            <th style={thStyle}>Net (MT)</th>
                            <th style={thStyle}>Location</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {bulkTickets.map((bt) => {
                            const truck = trucks.find(
                              (t) => t.id === bt.truckId
                            );
                            const loc = stockLocations.find(
                              (l) => l.id === bt.locationId
                            );
                            const net = netWeight(bt);
                            const canComplete = net > 0 && (bt.grossWeight != null) && (bt.tareWeight != null) && bt.locationId;
                            return (
                              <tr
                                key={bt.id}
                                style={{
                                  borderBottom: "1px solid #f1f5f9",
                                }}
                              >
                                <td style={tdStyle}>{bt.date || "—"}</td>
                                <td style={tdStyle}>
                                  {truck?.name || "—"}
                                </td>
                                <td style={tdStyle}>
                                  {bt.grossWeight ?? "—"}
                                </td>
                                <td style={tdStyle}>
                                  {bt.tareWeight ?? "—"}
                                </td>
                                <td
                                  style={{
                                    ...tdStyle,
                                    fontWeight: 600,
                                    color: "#059669",
                                  }}
                                >
                                  {net > 0 ? net.toFixed(3) : "—"}
                                </td>
                                <td style={tdStyle}>{loc?.name || "—"}</td>
                                <td style={tdStyle}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: "2px 8px",
                                      borderRadius: 12,
                                      background:
                                        bt.status === "completed"
                                          ? "#d1fae5"
                                          : "#f3f4f6",
                                      color:
                                        bt.status === "completed"
                                          ? "#065f46"
                                          : "#4b5563",
                                    }}
                                  >
                                    {bt.status}
                                  </span>
                                </td>
                                <td style={tdStyle}>
                                  {bt.status !== "completed" && (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openEditTicket(bt);
                                        }}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: "#2563eb",
                                          cursor: "pointer",
                                          fontSize: 12,
                                          marginRight: 8,
                                        }}
                                      >
                                        Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          completeTicket(bt);
                                        }}
                                        disabled={!canComplete}
                                        style={{
                                          background: "none",
                                          border: "none",
                                          color: canComplete ? "#059669" : "#9ca3af",
                                          cursor: canComplete ? "pointer" : "not-allowed",
                                          fontSize: 12,
                                        }}
                                      >
                                        Complete
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={ticketModalOpen}
        onClose={() => setTicketModalOpen(false)}
        title={editingTicketId ? "Edit bulk ticket" : "Add bulk ticket"}
        width={520}
      >
        <BulkTicketForm
          form={ticketForm}
          setForm={setTicketForm}
          trucks={trucks}
          stockLocations={stockLocations}
          tests={testsForPack}
          importExport={selectedPack?.importExport}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 8,
            marginTop: 20,
          }}
        >
          {editingTicketId && (
            <BtnDanger onClick={() => removeTicket(editingTicketId)}>
              Remove
            </BtnDanger>
          )}
          <BtnSecondary onClick={() => setTicketModalOpen(false)}>
            Cancel
          </BtnSecondary>
          <BtnPrimary onClick={saveTicket}>Save</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 600,
  color: "#64748b",
  fontSize: 11,
  textTransform: "uppercase",
};
const tdStyle = { padding: "10px 12px", color: "#1e293b" };

function BulkTicketForm({
  form,
  setForm,
  trucks,
  stockLocations,
  tests,
  importExport,
}) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormRow label="Date">
          <Input
            type="date"
            value={form.date || ""}
            onChange={(e) => set("date", e.target.value)}
          />
        </FormRow>
        <FormRow label="Truck">
          <Select
            value={form.truckId ?? ""}
            onChange={(e) =>
              set("truckId", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">— Select —</option>
            {(trucks || []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Gross weight (kg)">
          <Input
            type="number"
            value={form.grossWeight ?? ""}
            onChange={(e) => set("grossWeight", e.target.value)}
          />
        </FormRow>
        <FormRow label="Tare weight (kg)">
          <Input
            type="number"
            value={form.tareWeight ?? ""}
            onChange={(e) => set("tareWeight", e.target.value)}
          />
        </FormRow>
        <FormRow label={importExport === "Import" ? "Unloaded location" : "Loading location"}>
          <Select
            value={form.locationId ?? ""}
            onChange={(e) =>
              set("locationId", e.target.value ? Number(e.target.value) : null)
            }
          >
            <option value="">— Select —</option>
            {(stockLocations || []).map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>
        </FormRow>
      </div>
      <FormRow label="Signoff">
        <Input
          value={form.signoff || ""}
          onChange={(e) => set("signoff", e.target.value)}
          placeholder="Name"
        />
      </FormRow>
      {tests && tests.length > 0 && (
        <>
          <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>
            Test results (optional)
          </div>
          {tests.map((test) => (
            <FormRow key={test.id} label={test.name}>
              <Input
                value={form.testResults?.[test.name] ?? ""}
                onChange={(e) =>
                  set("testResults", {
                    ...(form.testResults || {}),
                    [test.name]: e.target.value,
                  })
                }
                placeholder={test.unit ? `(${test.unit})` : ""}
              />
            </FormRow>
          ))}
        </>
      )}
      <FormRow label="Notes">
        <Input
          value={form.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Notes"
        />
      </FormRow>
    </div>
  );
}
