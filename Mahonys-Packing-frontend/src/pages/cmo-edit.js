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
  BtnGhost,
  DataTable,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function CmoEditPage() {
  const {
    cmos,
    commodities,
    commodityTypes,
    cmoStatuses,
    customers,
    internalAccounts,
    currentSite,
    setCurrentSite,
    addCmo,
    updateCmo,
    addBooking,
    updateBooking,
    deleteBooking,
    addCmoStatus,
  } = useApp();
  const [cmoTypeFilter, setCmoTypeFilter] = useState("all"); // all | in | out
  const [selectedCmoId, setSelectedCmoId] = useState(null);

  const [showCreateCmo, setShowCreateCmo] = useState(false);
  const [showCreateBooking, setShowCreateBooking] = useState(false);
  const [showManageStatuses, setShowManageStatuses] = useState(false);
  const [editingCmo, setEditingCmo] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);

  const filteredCmos = cmos.filter(
    (c) => cmoTypeFilter === "all" || c.direction === cmoTypeFilter
  );
  const selectedCmo =
    cmos.find((c) => c.id === selectedCmoId) ||
    filteredCmos[0] ||
    null;

  const cmoColumns = useMemo(
    () => [
      { id: "cmoReference", label: "CMO Ref", width: "100px", getValue: (c) => c.cmoReference ?? "", cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 11.5 } },
      { id: "direction", label: "Dir", width: "30px", getValue: (c) => (c.direction === "in" ? "In" : "Out"), render: (_, c) => <span style={{ fontSize: 14 }}>{c.direction === "in" ? "In" : "Out"}</span> },
      {
        id: "customer",
        label: "Customer",
        minWidth: 100,
        getValue: (c) => customers.find((cust) => cust.id === c.customerId)?.name ?? "",
        render: (_, c) => <span>{customers.find((cust) => cust.id === c.customerId)?.name || "—"}</span>,
      },
      {
        id: "commodityType",
        label: "Commodity Type",
        width: "180px",
        getValue: (c) => commodityTypes.find((t) => t.id === c.commodityTypeId)?.name ?? "",
        render: (_, c) => <span>{commodityTypes.find((t) => t.id === c.commodityTypeId)?.name || "—"}</span>,
      },
      {
        id: "commodity",
        label: "Commodity",
        minWidth: 100,
        getValue: (c) => commodities.find((com) => com.id === c.commodityId)?.description ?? "",
        render: (_, c) => <span>{commodities.find((com) => com.id === c.commodityId)?.description || "—"}</span>,
      },
      {
        id: "status",
        label: "Status",
        width: "100px",
        getValue: (c) => c.status,
        render: (_, c) => {
          const statusObj = cmoStatuses.find((s) => s.name === c.status);
          return (
            <span
              style={{
                fontSize: 10.5,
                background: statusObj?.color || "#e2e8f0",
                color: "#1e40af",
                padding: "2px 7px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {c.status}
            </span>
          );
        },
      },
      {
        id: "bookings",
        label: "Bookings",
        width: "60px",
        getValue: (c) => c.bookings?.length ?? 0,
        render: (_, c) => <span style={{ textAlign: "right", color: "#64748b" }}>{c.bookings?.length || 0}</span>,
      },
    ],
    [customers, commodityTypes, commodities, cmoStatuses]
  );

  // ── Modal state ──
  const [newCmo, setNewCmo] = useState({
    direction: "in",
    customerId: "",
    commodityTypeId: "",
    commodityId: "",
    status: "",
    estimatedAmount: "",
    actualAmountDelivered: "",
    additionalReferences: [],
    note: "",
    attachments: [],
  });
  const [newReference, setNewReference] = useState("");
  const [newAttachment, setNewAttachment] = useState("");
  const [newStatusName, setNewStatusName] = useState("");
  const [newBooking, setNewBooking] = useState({
    date: new Date().toISOString().split("T")[0],
    expectedTrucks: 1,
    notes: "",
  });

  // Get filtered commodities based on selected commodity type
  const filteredCommoditiesForCreate = useMemo(() => {
    if (!newCmo.commodityTypeId) return [];
    return commodities.filter(
      (c) =>
        c.commodityTypeId === Number(newCmo.commodityTypeId) &&
        c.status === "active"
    );
  }, [newCmo.commodityTypeId, commodities]);

  const filteredCommoditiesForEdit = useMemo(() => {
    if (!editingCmo?.commodityTypeId) return [];
    return commodities.filter(
      (c) =>
        c.commodityTypeId === Number(editingCmo.commodityTypeId) &&
        c.status === "active"
    );
  }, [editingCmo?.commodityTypeId, commodities]);

  const handleCreateCmo = () => {
    if (
      !newCmo.customerId ||
      !newCmo.commodityTypeId ||
      !newCmo.commodityId ||
      !newCmo.status
    ) {
      alert("Customer, Commodity Type, Commodity, and Status are required");
      return;
    }
    addCmo({
      direction: newCmo.direction,
      customerId: Number(newCmo.customerId),
      commodityTypeId: Number(newCmo.commodityTypeId),
      commodityId: Number(newCmo.commodityId),
      status: newCmo.status,
      estimatedAmount: Number(newCmo.estimatedAmount) || 0,
      actualAmountDelivered: Number(newCmo.actualAmountDelivered) || 0,
      additionalReferences: newCmo.additionalReferences,
      note: newCmo.note.trim(),
      attachments: newCmo.attachments,
    });
    setShowCreateCmo(false);
    setNewCmo({
      direction: "in",
      customerId: "",
      commodityTypeId: "",
      commodityId: "",
      status: "",
      estimatedAmount: "",
      actualAmountDelivered: "",
      additionalReferences: [],
      note: "",
      attachments: [],
    });
  };

  const handleCreateBooking = () => {
    if (selectedCmo) {
      addBooking(selectedCmo.id, {
        ...newBooking,
        expectedTrucks: Number(newBooking.expectedTrucks) || 1,
      });
      setShowCreateBooking(false);
      setNewBooking({
        date: new Date().toISOString().split("T")[0],
        expectedTrucks: 1,
        notes: "",
      });
    }
  };

  const handleSaveCmo = () => {
    if (editingCmo) {
      if (
        !editingCmo.customerId ||
        !editingCmo.commodityTypeId ||
        !editingCmo.commodityId ||
        !editingCmo.status
      ) {
        alert("Customer, Commodity Type, Commodity, and Status are required");
        return;
      }
      updateCmo(editingCmo.id, {
        direction: editingCmo.direction,
        customerId: Number(editingCmo.customerId),
        commodityTypeId: Number(editingCmo.commodityTypeId),
        commodityId: Number(editingCmo.commodityId),
        status: editingCmo.status,
        estimatedAmount: Number(editingCmo.estimatedAmount) || 0,
        actualAmountDelivered: Number(editingCmo.actualAmountDelivered) || 0,
        additionalReferences: editingCmo.additionalReferences,
        note: editingCmo.note.trim(),
        attachments: editingCmo.attachments,
      });
      setEditingCmo(null);
    }
  };

  const handleAddStatus = () => {
    if (newStatusName.trim()) {
      addCmoStatus({ name: newStatusName.trim(), color: "#dbeafe" });
      setNewStatusName("");
    }
  };

  const handleSaveBooking = () => {
    if (editingBooking && selectedCmo) {
      updateBooking(selectedCmo.id, editingBooking.id, {
        date: editingBooking.date,
        expectedTrucks: Number(editingBooking.expectedTrucks) || 1,
        notes: editingBooking.notes,
      });
      setEditingBooking(null);
    }
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

      <div style={{ maxWidth: 1920, margin: "0 auto", padding: "20px 24px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 18,
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
              CMO Management
            </h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Create, edit and manage CMOs and their bookings
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnSecondary
              onClick={() => setShowManageStatuses(true)}
              style={{ fontSize: 12 }}
            >
              Manage Statuses
            </BtnSecondary>
            <BtnPrimary
              onClick={() => setShowCreateCmo(true)}
              style={{ fontSize: 12 }}
            >
              + New CMO
            </BtnPrimary>
          </div>
        </div>

        {/* Type filter tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
          {[
            ["all", "All CMOs"],
            ["in", "Incoming"],
            ["out", "Outgoing"],
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setCmoTypeFilter(val)}
              style={{
                padding: "6px 14px",
                border: "none",
                borderRadius: 6,
                background: cmoTypeFilter === val ? "#2563eb" : "#fff",
                color: cmoTypeFilter === val ? "#fff" : "#64748b",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow:
                  cmoTypeFilter === val
                    ? "0 2px 6px rgba(37,99,235,0.3)"
                    : "0 1px 2px rgba(0,0,0,0.08)",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {/* CMO List */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
            }}
          >
            <DataTable
              columns={cmoColumns}
              data={filteredCmos}
              getRowKey={(c) => c.id}
              onRowClick={(c) => setSelectedCmoId(c.id)}
              selectedRowKey={selectedCmoId}
              maxHeight={400}
              getRowStyle={(c) =>
                selectedCmoId === c.id ? { borderLeft: "3px solid #3b82f6" } : { borderLeft: "3px solid transparent" }
              }
              emptyMessage="No CMOs found."
            />
          </div>

          {/* Right Panel: Selected CMO detail + Bookings */}
          <div
            style={{
              width: 420,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {selectedCmo ? (
              <>
                {/* CMO Info */}
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
                      padding: "10px 16px",
                      background: "linear-gradient(135deg, #1e3a6b, #2563eb)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}
                    >
                      {selectedCmo.cmoReference || "CMO"} —{" "}
                      {selectedCmo.direction === "in" ? "Incoming" : "Outgoing"}
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        background: "rgba(255,255,255,0.2)",
                        color: "#fff",
                        padding: "2px 8px",
                        borderRadius: 10,
                        fontWeight: 600,
                      }}
                    >
                      {selectedCmo.status}
                    </span>
                  </div>
                  <div
                    style={{
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                      maxHeight: 400,
                      overflowY: "auto",
                    }}
                  >
                    <Row
                      label="CMO Reference"
                      value={selectedCmo.cmoReference || "—"}
                    />
                    <Row
                      label="Direction"
                      value={
                        selectedCmo.direction === "in" ? "Incoming" : "Outgoing"
                      }
                    />
                    <Row
                      label="Customer / Account"
                      value={
                        customers.find((c) => c.id === selectedCmo.customerId)
                          ?.name ||
                        internalAccounts.find(
                          (a) => a.id === selectedCmo.customerId
                        )?.name ||
                        "—"
                      }
                    />
                    <Row
                      label="Commodity Type"
                      value={
                        commodityTypes.find(
                          (t) => t.id === selectedCmo.commodityTypeId
                        )?.name || "—"
                      }
                    />
                    <Row
                      label="Commodity"
                      value={
                        commodities.find(
                          (c) => c.id === selectedCmo.commodityId
                        )?.description || "—"
                      }
                    />
                    <Row label="Status" value={selectedCmo.status || "—"} />
                    <Row
                      label="Estimated Amount"
                      value={
                        selectedCmo.estimatedAmount
                          ? `${Number(
                              selectedCmo.estimatedAmount
                            ).toLocaleString()} ${
                              commodities.find(
                                (c) => c.id === selectedCmo.commodityId
                              )?.unitType || "kg"
                            }`
                          : "—"
                      }
                    />
                    <Row
                      label="Actual Amount"
                      value={
                        selectedCmo.actualAmountDelivered
                          ? `${Number(
                              selectedCmo.actualAmountDelivered
                            ).toLocaleString()} ${
                              commodities.find(
                                (c) => c.id === selectedCmo.commodityId
                              )?.unitType || "kg"
                            }`
                          : "—"
                      }
                    />
                    {selectedCmo.additionalReferences &&
                      selectedCmo.additionalReferences.length > 0 && (
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              fontWeight: 600,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Additional References
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 4,
                            }}
                          >
                            {selectedCmo.additionalReferences.map(
                              (ref, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: 11,
                                    background: "#f1f5f9",
                                    color: "#475569",
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    fontWeight: 500,
                                  }}
                                >
                                  {ref}
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      )}
                    {selectedCmo.note && (
                      <Row label="Note" value={selectedCmo.note} />
                    )}
                    {selectedCmo.attachments &&
                      selectedCmo.attachments.length > 0 && (
                        <div>
                          <span
                            style={{
                              fontSize: 11,
                              color: "#64748b",
                              textTransform: "uppercase",
                              letterSpacing: 0.4,
                              fontWeight: 600,
                              display: "block",
                              marginBottom: 4,
                            }}
                          >
                            Attachments
                          </span>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 3,
                            }}
                          >
                            {selectedCmo.attachments.map((att, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: 11,
                                  color: "#2563eb",
                                  fontWeight: 500,
                                }}
                              >
                                {att}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                  <div
                    style={{
                      padding: "10px 16px",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      gap: 6,
                    }}
                  >
                    <BtnGhost
                      onClick={() => setEditingCmo({ ...selectedCmo })}
                      style={{ fontSize: 11 }}
                    >
                      Edit CMO
                    </BtnGhost>
                  </div>
                </div>

                {/* Bookings */}
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
                      padding: "10px 16px",
                      background: "#f8fafc",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#0f1e3d",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      Bookings
                    </span>
                    <BtnPrimary
                      onClick={() => setShowCreateBooking(true)}
                      style={{ fontSize: 10.5, padding: "3px 8px" }}
                    >
                      + Add
                    </BtnPrimary>
                  </div>
                  <div style={{ maxHeight: 260, overflowY: "auto" }}>
                    {(!selectedCmo.bookings ||
                      selectedCmo.bookings.length === 0) && (
                      <div
                        style={{
                          textAlign: "center",
                          padding: 28,
                          color: "#9ca3af",
                          fontSize: 12,
                        }}
                      >
                        No bookings yet.
                      </div>
                    )}
                    {(selectedCmo.bookings || []).map((b) => (
                      <div
                        key={b.id}
                        style={{
                          padding: "10px 14px",
                          borderBottom: "1px solid #f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {b.date}
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b" }}>
                            Expected trucks: {b.expectedTrucks}
                            {b.notes ? ` · ${b.notes}` : ""}
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          <BtnGhost
                            onClick={() => setEditingBooking({ ...b })}
                            style={{ fontSize: 10.5, padding: "3px 6px" }}
                          >
                            Edit
                          </BtnGhost>
                          <BtnDanger
                            onClick={() => {
                              if (window.confirm("Delete this booking?"))
                                deleteBooking(selectedCmo.id, b.id);
                            }}
                            style={{ fontSize: 10.5, padding: "3px 6px" }}
                          >
                            Delete
                          </BtnDanger>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  background: "#fff",
                  borderRadius: 10,
                  border: "1px solid #e2e8f0",
                  padding: 48,
                  textAlign: "center",
                  color: "#9ca3af",
                  fontSize: 13,
                }}
              >
                Select a CMO to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {/* Create CMO */}
      <Modal
        open={showCreateCmo}
        onClose={() => setShowCreateCmo(false)}
        title="Create New CMO"
        width={650}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <div
            style={{
              padding: "10px 14px",
              background: "#f8fafc",
              borderRadius: 6,
              marginBottom: 16,
              border: "1px solid #e2e8f0",
            }}
          >
            <span
              style={{
                fontSize: 11,
                color: "#64748b",
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: 0.4,
              }}
            >
              CMO Reference will be auto-generated
            </span>
          </div>

          <FormRow label="Direction" required>
            <Select
              value={newCmo.direction}
              onChange={(e) =>
                setNewCmo({ ...newCmo, direction: e.target.value })
              }
            >
              <option value="in">Incoming</option>
              <option value="out">Outgoing</option>
            </Select>
          </FormRow>

          <FormRow label="Customer / Account" required>
            <Select
              value={newCmo.customerId}
              onChange={(e) =>
                setNewCmo({ ...newCmo, customerId: e.target.value })
              }
            >
              <option value="">— Select Customer / Account —</option>
              <optgroup label="Customers">
                {customers.map((c) => (
                  <option key={`cust-${c.id}`} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </optgroup>
              <optgroup label="Internal Accounts">
                {internalAccounts.map((a) => (
                  <option key={`int-${a.id}`} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </optgroup>
            </Select>
          </FormRow>

          <FormRow label="Commodity Type" required>
            <Select
              value={newCmo.commodityTypeId}
              onChange={(e) =>
                setNewCmo({
                  ...newCmo,
                  commodityTypeId: e.target.value,
                  commodityId: "",
                })
              }
            >
              <option value="">— Select Commodity Type —</option>
              {commodityTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.acosCode})
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Commodity" required>
            <Select
              value={newCmo.commodityId}
              onChange={(e) =>
                setNewCmo({ ...newCmo, commodityId: e.target.value })
              }
              disabled={!newCmo.commodityTypeId}
            >
              <option value="">— Select Commodity —</option>
              {filteredCommoditiesForCreate.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.commodityCode}
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Status" required>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <Select
                value={newCmo.status}
                onChange={(e) =>
                  setNewCmo({ ...newCmo, status: e.target.value })
                }
                style={{ flex: 1 }}
              >
                <option value="">— Select Status —</option>
                {cmoStatuses.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </Select>
              <BtnSecondary
                onClick={() => setShowManageStatuses(true)}
                style={{
                  fontSize: 11,
                  padding: "6px 10px",
                  whiteSpace: "nowrap",
                }}
              >
                + New
              </BtnSecondary>
            </div>
          </FormRow>

          <FormRow
            label={`Estimated Amount${
              newCmo.commodityId
                ? ` (${
                    commodities.find((c) => c.id === Number(newCmo.commodityId))
                      ?.unitType || "t"
                  })`
                : " (t)"
            }`}
          >
            <Input
              value={newCmo.estimatedAmount}
              onChange={(e) =>
                setNewCmo({ ...newCmo, estimatedAmount: e.target.value })
              }
              type="number"
              placeholder="0"
            />
          </FormRow>

          <FormRow
            label={`Actual Amount Delivered${
              newCmo.commodityId
                ? ` (${
                    commodities.find((c) => c.id === Number(newCmo.commodityId))
                      ?.unitType || "t"
                  })`
                : " (t)"
            }`}
          >
            <Input
              value={newCmo.actualAmountDelivered}
              onChange={(e) =>
                setNewCmo({ ...newCmo, actualAmountDelivered: e.target.value })
              }
              type="number"
              placeholder="0"
            />
          </FormRow>

          <FormRow label="Additional References">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <Input
                  value={newReference}
                  onChange={(e) => setNewReference(e.target.value)}
                  placeholder="e.g. REF-2024-001"
                  style={{ flex: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newReference.trim()) {
                      setNewCmo({
                        ...newCmo,
                        additionalReferences: [
                          ...newCmo.additionalReferences,
                          newReference.trim(),
                        ],
                      });
                      setNewReference("");
                    }
                  }}
                />
                <BtnSecondary
                  onClick={() => {
                    if (newReference.trim()) {
                      setNewCmo({
                        ...newCmo,
                        additionalReferences: [
                          ...newCmo.additionalReferences,
                          newReference.trim(),
                        ],
                      });
                      setNewReference("");
                    }
                  }}
                  style={{ fontSize: 11, padding: "6px 10px" }}
                >
                  + Add
                </BtnSecondary>
              </div>
              {newCmo.additionalReferences.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {newCmo.additionalReferences.map((ref, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        background: "#f1f5f9",
                        padding: "4px 8px",
                        borderRadius: 4,
                        fontSize: 11,
                      }}
                    >
                      <span>{ref}</span>
                      <button
                        onClick={() =>
                          setNewCmo({
                            ...newCmo,
                            additionalReferences:
                              newCmo.additionalReferences.filter(
                                (_, i) => i !== idx
                              ),
                          })
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>

          <FormRow label="Note">
            <textarea
              value={newCmo.note}
              onChange={(e) => setNewCmo({ ...newCmo, note: e.target.value })}
              placeholder="Add any notes here..."
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 12.5,
                fontFamily: "'Segoe UI', sans-serif",
                minHeight: 80,
                resize: "vertical",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </FormRow>

          <FormRow label="Attachments">
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", gap: 6 }}>
                <Input
                  value={newAttachment}
                  onChange={(e) => setNewAttachment(e.target.value)}
                  placeholder="e.g. contract.pdf"
                  style={{ flex: 1 }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && newAttachment.trim()) {
                      setNewCmo({
                        ...newCmo,
                        attachments: [
                          ...newCmo.attachments,
                          newAttachment.trim(),
                        ],
                      });
                      setNewAttachment("");
                    }
                  }}
                />
                <BtnSecondary
                  onClick={() => {
                    if (newAttachment.trim()) {
                      setNewCmo({
                        ...newCmo,
                        attachments: [
                          ...newCmo.attachments,
                          newAttachment.trim(),
                        ],
                      });
                      setNewAttachment("");
                    }
                  }}
                  style={{ fontSize: 11, padding: "6px 10px" }}
                >
                  + Add
                </BtnSecondary>
              </div>
              {newCmo.attachments.length > 0 && (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 3 }}
                >
                  {newCmo.attachments.map((att, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        background: "#f1f5f9",
                        padding: "6px 10px",
                        borderRadius: 4,
                        fontSize: 11,
                      }}
                    >
                      <span style={{ flex: 1 }}>{att}</span>
                      <button
                        onClick={() =>
                          setNewCmo({
                            ...newCmo,
                            attachments: newCmo.attachments.filter(
                              (_, i) => i !== idx
                            ),
                          })
                        }
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: 700,
                          padding: 0,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormRow>
        </div>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <BtnGhost onClick={() => setShowCreateCmo(false)}>Cancel</BtnGhost>
          <BtnPrimary onClick={handleCreateCmo}>Create CMO</BtnPrimary>
        </div>
      </Modal>

      {/* Create Booking */}
      <Modal
        open={showCreateBooking}
        onClose={() => setShowCreateBooking(false)}
        title={`Add Booking — ${selectedCmo?.cmoReference || ""}`}
      >
        <FormRow label="Date" required>
          <Input
            value={newBooking.date}
            onChange={(e) =>
              setNewBooking({ ...newBooking, date: e.target.value })
            }
            type="date"
          />
        </FormRow>
        <FormRow label="Expected Trucks">
          <Input
            value={newBooking.expectedTrucks}
            onChange={(e) =>
              setNewBooking({ ...newBooking, expectedTrucks: e.target.value })
            }
            type="number"
            placeholder="1"
          />
        </FormRow>
        <FormRow label="Notes">
          <Input
            value={newBooking.notes}
            onChange={(e) =>
              setNewBooking({ ...newBooking, notes: e.target.value })
            }
            placeholder="Optional notes"
          />
        </FormRow>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <BtnGhost onClick={() => setShowCreateBooking(false)}>
            Cancel
          </BtnGhost>
          <BtnPrimary onClick={handleCreateBooking}>Add Booking</BtnPrimary>
        </div>
      </Modal>

      {/* Edit CMO */}
      <Modal
        open={!!editingCmo}
        onClose={() => setEditingCmo(null)}
        title="Edit CMO"
        width={650}
      >
        {editingCmo && (
          <>
            <div
              style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}
            >
              <div
                style={{
                  padding: "12px 14px",
                  background: "linear-gradient(135deg, #1e3a6b, #2563eb)",
                  borderRadius: 6,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "rgba(255,255,255,0.8)",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                    }}
                  >
                    CMO Reference
                  </span>
                  <span
                    style={{
                      fontSize: 16,
                      color: "#fff",
                      fontWeight: 700,
                      letterSpacing: 0.5,
                    }}
                  >
                    {editingCmo.cmoReference}
                  </span>
                </div>
              </div>

              <FormRow label="Direction" required>
                <Select
                  value={editingCmo.direction}
                  onChange={(e) =>
                    setEditingCmo({ ...editingCmo, direction: e.target.value })
                  }
                >
                  <option value="in">Incoming</option>
                  <option value="out">Outgoing</option>
                </Select>
              </FormRow>

              <FormRow label="Customer / Account" required>
                <Select
                  value={editingCmo.customerId}
                  onChange={(e) =>
                    setEditingCmo({ ...editingCmo, customerId: e.target.value })
                  }
                >
                  <option value="">— Select Customer / Account —</option>
                  <optgroup label="Customers">
                    {customers.map((c) => (
                      <option key={`cust-${c.id}`} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Internal Accounts">
                    {internalAccounts.map((a) => (
                      <option key={`int-${a.id}`} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </FormRow>

              <FormRow label="Commodity Type" required>
                <Select
                  value={editingCmo.commodityTypeId}
                  onChange={(e) =>
                    setEditingCmo({
                      ...editingCmo,
                      commodityTypeId: e.target.value,
                      commodityId: "",
                    })
                  }
                >
                  <option value="">— Select Commodity Type —</option>
                  {commodityTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.acosCode})
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow label="Commodity" required>
                <Select
                  value={editingCmo.commodityId}
                  onChange={(e) =>
                    setEditingCmo({
                      ...editingCmo,
                      commodityId: e.target.value,
                    })
                  }
                  disabled={!editingCmo.commodityTypeId}
                >
                  <option value="">— Select Commodity —</option>
                  {filteredCommoditiesForEdit.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.commodityCode}
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow label="Status" required>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <Select
                    value={editingCmo.status}
                    onChange={(e) =>
                      setEditingCmo({ ...editingCmo, status: e.target.value })
                    }
                    style={{ flex: 1 }}
                  >
                    <option value="">— Select Status —</option>
                    {cmoStatuses.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </Select>
                  <BtnSecondary
                    onClick={() => setShowManageStatuses(true)}
                    style={{
                      fontSize: 11,
                      padding: "6px 10px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    + New
                  </BtnSecondary>
                </div>
              </FormRow>

              <FormRow
                label={`Estimated Amount${
                  editingCmo.commodityId
                    ? ` (${
                        commodities.find(
                          (c) => c.id === Number(editingCmo.commodityId)
                        )?.unitType || "t"
                      })`
                    : " (t)"
                }`}
              >
                <Input
                  value={editingCmo.estimatedAmount || ""}
                  onChange={(e) =>
                    setEditingCmo({
                      ...editingCmo,
                      estimatedAmount: e.target.value,
                    })
                  }
                  type="number"
                  placeholder="0"
                />
              </FormRow>

              <FormRow
                label={`Actual Amount Delivered${
                  editingCmo.commodityId
                    ? ` (${
                        commodities.find(
                          (c) => c.id === Number(editingCmo.commodityId)
                        )?.unitType || "t"
                      })`
                    : " (t)"
                }`}
              >
                <Input
                  value={editingCmo.actualAmountDelivered || ""}
                  onChange={(e) =>
                    setEditingCmo({
                      ...editingCmo,
                      actualAmountDelivered: e.target.value,
                    })
                  }
                  type="number"
                  placeholder="0"
                />
              </FormRow>

              <FormRow label="Additional References">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div style={{ display: "flex", gap: 6 }}>
                    <Input
                      value={newReference}
                      onChange={(e) => setNewReference(e.target.value)}
                      placeholder="e.g. REF-2024-001"
                      style={{ flex: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && newReference.trim()) {
                          setEditingCmo({
                            ...editingCmo,
                            additionalReferences: [
                              ...(editingCmo.additionalReferences || []),
                              newReference.trim(),
                            ],
                          });
                          setNewReference("");
                        }
                      }}
                    />
                    <BtnSecondary
                      onClick={() => {
                        if (newReference.trim()) {
                          setEditingCmo({
                            ...editingCmo,
                            additionalReferences: [
                              ...(editingCmo.additionalReferences || []),
                              newReference.trim(),
                            ],
                          });
                          setNewReference("");
                        }
                      }}
                      style={{ fontSize: 11, padding: "6px 10px" }}
                    >
                      + Add
                    </BtnSecondary>
                  </div>
                  {editingCmo.additionalReferences &&
                    editingCmo.additionalReferences.length > 0 && (
                      <div
                        style={{ display: "flex", flexWrap: "wrap", gap: 4 }}
                      >
                        {editingCmo.additionalReferences.map((ref, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                              background: "#f1f5f9",
                              padding: "4px 8px",
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          >
                            <span>{ref}</span>
                            <button
                              onClick={() =>
                                setEditingCmo({
                                  ...editingCmo,
                                  additionalReferences:
                                    editingCmo.additionalReferences.filter(
                                      (_, i) => i !== idx
                                    ),
                                })
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: 12,
                                fontWeight: 700,
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </FormRow>

              <FormRow label="Note">
                <textarea
                  value={editingCmo.note || ""}
                  onChange={(e) =>
                    setEditingCmo({ ...editingCmo, note: e.target.value })
                  }
                  placeholder="Add any notes here..."
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    fontSize: 12.5,
                    fontFamily: "'Segoe UI', sans-serif",
                    minHeight: 80,
                    resize: "vertical",
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </FormRow>

              <FormRow label="Attachments">
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <div style={{ display: "flex", gap: 6 }}>
                    <Input
                      value={newAttachment}
                      onChange={(e) => setNewAttachment(e.target.value)}
                      placeholder="e.g. contract.pdf"
                      style={{ flex: 1 }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && newAttachment.trim()) {
                          setEditingCmo({
                            ...editingCmo,
                            attachments: [
                              ...(editingCmo.attachments || []),
                              newAttachment.trim(),
                            ],
                          });
                          setNewAttachment("");
                        }
                      }}
                    />
                    <BtnSecondary
                      onClick={() => {
                        if (newAttachment.trim()) {
                          setEditingCmo({
                            ...editingCmo,
                            attachments: [
                              ...(editingCmo.attachments || []),
                              newAttachment.trim(),
                            ],
                          });
                          setNewAttachment("");
                        }
                      }}
                      style={{ fontSize: 11, padding: "6px 10px" }}
                    >
                      + Add
                    </BtnSecondary>
                  </div>
                  {editingCmo.attachments &&
                    editingCmo.attachments.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 3,
                        }}
                      >
                        {editingCmo.attachments.map((att, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              background: "#f1f5f9",
                              padding: "6px 10px",
                              borderRadius: 4,
                              fontSize: 11,
                            }}
                          >
                            <span style={{ flex: 1 }}>{att}</span>
                            <button
                              onClick={() =>
                                setEditingCmo({
                                  ...editingCmo,
                                  attachments: editingCmo.attachments.filter(
                                    (_, i) => i !== idx
                                  ),
                                })
                              }
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                cursor: "pointer",
                                fontSize: 14,
                                fontWeight: 700,
                                padding: 0,
                                lineHeight: 1,
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </FormRow>
            </div>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
                paddingTop: 16,
                borderTop: "1px solid #e5e7eb",
              }}
            >
              <BtnGhost onClick={() => setEditingCmo(null)}>Cancel</BtnGhost>
              <BtnPrimary onClick={handleSaveCmo}>Save Changes</BtnPrimary>
            </div>
          </>
        )}
      </Modal>

      {/* Edit Booking */}
      <Modal
        open={!!editingBooking}
        onClose={() => setEditingBooking(null)}
        title="Edit Booking"
      >
        {editingBooking && (
          <>
            <FormRow label="Date" required>
              <Input
                value={editingBooking.date}
                onChange={(e) =>
                  setEditingBooking({ ...editingBooking, date: e.target.value })
                }
                type="date"
              />
            </FormRow>
            <FormRow label="Expected Trucks">
              <Input
                value={editingBooking.expectedTrucks}
                onChange={(e) =>
                  setEditingBooking({
                    ...editingBooking,
                    expectedTrucks: e.target.value,
                  })
                }
                type="number"
              />
            </FormRow>
            <FormRow label="Notes">
              <Input
                value={editingBooking.notes}
                onChange={(e) =>
                  setEditingBooking({
                    ...editingBooking,
                    notes: e.target.value,
                  })
                }
              />
            </FormRow>
            <div
              style={{
                marginTop: 16,
                display: "flex",
                gap: 8,
                justifyContent: "flex-end",
              }}
            >
              <BtnGhost onClick={() => setEditingBooking(null)}>
                Cancel
              </BtnGhost>
              <BtnPrimary onClick={handleSaveBooking}>Save Booking</BtnPrimary>
            </div>
          </>
        )}
      </Modal>

      {/* Manage Statuses */}
      <Modal
        open={showManageStatuses}
        onClose={() => setShowManageStatuses(false)}
        title="Manage CMO Statuses"
        width={500}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <Input
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
              placeholder="e.g. In Transit"
              style={{ flex: 1 }}
              onKeyPress={(e) => {
                if (e.key === "Enter" && newStatusName.trim())
                  handleAddStatus();
              }}
            />
            <BtnPrimary
              onClick={handleAddStatus}
              style={{ fontSize: 12, padding: "6px 12px" }}
            >
              + Add Status
            </BtnPrimary>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {cmoStatuses.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "#f8fafc",
                  borderRadius: 6,
                  border: "1px solid #e2e8f0",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: s.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {s.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}
        >
          <BtnGhost onClick={() => setShowManageStatuses(false)}>
            Close
          </BtnGhost>
        </div>
      </Modal>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
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
      <span style={{ fontSize: 12.5, color: "#1e293b", fontWeight: 500 }}>
        {value}
      </span>
    </div>
  );
}
