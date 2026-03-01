"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  Modal,
  FormRow,
  Input,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  DataTable,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

function InfoRow({ label, value, highlight }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 13,
          color: highlight ? "#1e40af" : "#1e293b",
          fontWeight: highlight ? 600 : 500,
          wordBreak: "break-word",
        }}
      >
        {value || "—"}
      </span>
    </div>
  );
}

const emptyContact = () => ({ name: "", email: "", phone: "" });

export default function TerminalsPage() {
  const {
    terminals,
    currentSite,
    setCurrentSite,
    addTerminal,
    updateTerminal,
    deleteTerminal,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTerminalId, setSelectedTerminalId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    contacts: [emptyContact()],
    notes: "",
    revenuePrice: "",
    expensePrice: "",
  });

  const filtered = useMemo(() => {
    return terminals.filter((t) => {
      if (!search) return true;
      const text = `${t.code || ""} ${t.name || ""} ${(t.contacts || []).map((c) => c.name || c.email || c.phone).join(" ")} ${t.notes || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [terminals, search]);

  const selected = terminals.find((t) => t.id === selectedTerminalId) || null;

  const formatPrice = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    return isNaN(n) ? "—" : n.toFixed(2);
  };

  const terminalColumns = useMemo(
    () => [
      { id: "code", label: "Code", width: "90px", getValue: (t) => t.code ?? "", cellStyle: { fontWeight: 700, color: "#2563eb" } },
      { id: "name", label: "Name", minWidth: 120, getValue: (t) => t.name ?? "", cellStyle: { fontWeight: 600 } },
      {
        id: "contacts",
        label: "Contacts",
        width: "100px",
        getValue: (t) => (t.contacts && t.contacts.length) || 0,
        render: (_, t) => {
          const n = (t.contacts && t.contacts.length) || 0;
          return <span style={{ color: "#64748b", fontSize: 11.5 }}>{n} contact{n !== 1 ? "s" : ""}</span>;
        },
      },
      { id: "revenuePrice", label: "Revenue", width: "90px", getValue: (t) => formatPrice(t.revenuePrice), render: (_, t) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatPrice(t.revenuePrice)}</span> },
      { id: "expensePrice", label: "Expense", width: "90px", getValue: (t) => formatPrice(t.expensePrice), render: (_, t) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatPrice(t.expensePrice)}</span> },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      code: "",
      name: "",
      contacts: [emptyContact()],
      notes: "",
      revenuePrice: "",
      expensePrice: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    const contacts = (selected.contacts && selected.contacts.length > 0)
      ? selected.contacts.map((c) => ({ name: c.name || "", email: c.email || "", phone: c.phone || "" }))
      : [emptyContact()];
    setFormData({
      code: selected.code || "",
      name: selected.name || "",
      contacts,
      notes: selected.notes || "",
      revenuePrice: selected.revenuePrice !== undefined && selected.revenuePrice !== null ? String(selected.revenuePrice) : "",
      expensePrice: selected.expensePrice !== undefined && selected.expensePrice !== null ? String(selected.expensePrice) : "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert("Terminal Code and Name are required");
      return;
    }

    const contacts = (formData.contacts || [])
      .map((c) => ({
        name: (c.name || "").trim(),
        email: (c.email || "").trim(),
        phone: (c.phone || "").trim(),
      }))
      .filter((c) => c.name || c.email || c.phone);

    const terminalData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      contacts,
      notes: (formData.notes || "").trim(),
      revenuePrice: formData.revenuePrice === "" ? null : Number(formData.revenuePrice),
      expensePrice: formData.expensePrice === "" ? null : Number(formData.expensePrice),
    };

    if (editMode) {
      updateTerminal(selected.id, terminalData);
    } else {
      addTerminal(terminalData);
    }

    setModalOpen(false);
    setFormData({
      code: "",
      name: "",
      contacts: [emptyContact()],
      notes: "",
      revenuePrice: "",
      expensePrice: "",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        `Delete terminal "${selected.name}" permanently?`
      )
    ) {
      deleteTerminal(selected.id);
      setSelectedTerminalId(null);
    }
  };

  const setContact = (index, field, value) => {
    setFormData((prev) => {
      const next = [...(prev.contacts || [emptyContact()])];
      if (!next[index]) next[index] = emptyContact();
      next[index] = { ...next[index], [field]: value };
      return { ...prev, contacts: next };
    });
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...(prev.contacts || []), emptyContact()],
    }));
  };

  const removeContact = (index) => {
    setFormData((prev) => {
      const next = (prev.contacts || []).filter((_, i) => i !== index);
      if (next.length === 0) next.push(emptyContact());
      return { ...prev, contacts: next };
    });
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
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 700,
            color: "#0f1e3d",
          }}
        >
          Terminals
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage terminal contacts, locations, and pricing.
        </p>

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
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              minWidth: 180,
              maxWidth: 400,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terminals…"
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

          <div style={{ display: "flex", gap: 6 }}>
            <BtnPrimary onClick={openCreateModal} style={{ fontSize: 12 }}>
              + Add Terminal
            </BtnPrimary>
            <BtnSecondary
              onClick={openEditModal}
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
          {/* List */}
          <DataTable
            columns={terminalColumns}
            data={filtered}
            getRowKey={(t) => t.id}
            onRowClick={(t) => setSelectedTerminalId(t.id)}
            selectedRowKey={selectedTerminalId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No terminals match your search."
                : "No terminals found. Add your first one!"
            }
          />

          {/* Detail panel */}
          <div
            style={{
              width: 360,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: 600,
              overflowY: "auto",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1e3d" }}>
              Terminal Details
            </span>
            {selected ? (
              <>
                <InfoRow label="Terminal Code" value={selected.code} highlight />
                <InfoRow label="Terminal Name" value={selected.name} highlight />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                    Terminal Contact(s)
                  </span>
                  {(selected.contacts && selected.contacts.length > 0) ? (
                    selected.contacts.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          background: "#f8fafc",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                          color: "#1e293b",
                        }}
                      >
                        <div><strong>{c.name || "—"}</strong></div>
                        {c.email ? <div>{c.email}</div> : null}
                        {c.phone ? <div>{c.phone}</div> : null}
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                  )}
                </div>
                <InfoRow label="Notes" value={selected.notes} />
                <InfoRow label="Revenue Price" value={formatPrice(selected.revenuePrice)} />
                <InfoRow label="Expense Price" value={formatPrice(selected.expensePrice)} />

                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 14,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <BtnSecondary
                    onClick={openEditModal}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: 8,
                    }}
                  >
                    Edit Terminal
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Terminal
                  </BtnDanger>
                </div>
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
                Select a terminal to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Terminal" : "Add Terminal"}
        width={560}
      >
        <FormRow label="Terminal Code" required>
          <Input
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value })
            }
            placeholder="e.g., TRM-01"
          />
        </FormRow>

        <FormRow label="Terminal Name" required>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., North Terminal"
          />
        </FormRow>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Terminal Contact(s)
            </span>
            <button
              type="button"
              onClick={addContact}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              + Add contact
            </button>
          </div>
          {(formData.contacts || []).map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 10,
                marginBottom: 8,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                  Contact {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
              <Input
                value={c.name}
                onChange={(e) => setContact(i, "name", e.target.value)}
                placeholder="Contact Name"
              />
              <Input
                type="email"
                value={c.email}
                onChange={(e) => setContact(i, "email", e.target.value)}
                placeholder="Contact Email"
              />
              <Input
                type="tel"
                value={c.phone}
                onChange={(e) => setContact(i, "phone", e.target.value)}
                placeholder="Contact Phone"
              />
            </div>
          ))}
        </div>

        <FormRow label="Notes">
          <Input
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Optional notes"
          />
        </FormRow>

        <FormRow label="Revenue Price">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.revenuePrice}
            onChange={(e) =>
              setFormData({ ...formData, revenuePrice: e.target.value })
            }
            placeholder="0.00"
          />
        </FormRow>

        <FormRow label="Expense Price">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.expensePrice}
            onChange={(e) =>
              setFormData({ ...formData, expensePrice: e.target.value })
            }
            placeholder="0.00"
          />
        </FormRow>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            justifyContent: "flex-end",
          }}
        >
          <BtnSecondary onClick={() => setModalOpen(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSubmit}>
            {editMode ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
