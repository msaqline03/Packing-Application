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

const emptyContact = () => ({ name: "", email: "", phone: "" });

const emptyWarning = () => ({
  warningDescription: "",
  showOnPacks: true,
});

/** Normalize warnings from API (may be array of strings or array of objects) */
function normalizeWarnings(warnings) {
  if (!Array.isArray(warnings) || warnings.length === 0) return [emptyWarning()];
  return warnings.map((w) =>
    typeof w === "string"
      ? { warningDescription: w, showOnPacks: true }
      : {
          warningDescription: w.warningDescription || "",
          showOnPacks: w.showOnPacks !== false,
        },
  );
}

export default function CustomersPage() {
  const {
    customers,
    currentSite,
    setCurrentSite,
    addCustomer,
    updateCustomer,
    deleteCustomer,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    emails: "",
    contacts: [emptyContact()],
    addresses: "",
    website: "",
    notes: "",
    invoicingContact: "",
    warnings: [emptyWarning()],
  });

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (!search) return true;
      const contactText = (c.contacts || [])
        .map((x) =>
          typeof x === "string"
            ? x
            : [x.name, x.email, x.phone].filter(Boolean).join(" "),
        )
        .join(" ");
      const text =
        `${c.code} ${c.name} ${c.emails?.join(" ")} ${contactText} ${c.addresses?.join(" ")}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [customers, search]);

  const selected = customers.find((c) => c.id === selectedCustomerId) || null;

  const customerColumns = useMemo(
    () => [
      {
        id: "code",
        label: "Code",
        width: "100px",
        getValue: (c) => c.code,
        cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 12 },
      },
      {
        id: "name",
        label: "Customer Name",
        minWidth: 120,
        getValue: (c) => c.name,
        render: (_, c) => (
          <span style={{ fontWeight: 600 }}>{c.name}</span>
        ),
      },
      {
        id: "emails",
        label: "Emails",
        width: "100px",
        getValue: (c) => (Array.isArray(c.emails) ? c.emails.length : 0),
        render: (_, c) => {
          const n = Array.isArray(c.emails) ? c.emails.length : 0;
          return (
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              {n ? `${n} email${n !== 1 ? "s" : ""}` : "—"}
            </span>
          );
        },
      },
      {
        id: "contacts",
        label: "Contacts",
        width: "100px",
        getValue: (c) => (Array.isArray(c.contacts) ? c.contacts.length : 0),
        render: (_, c) => {
          const n = Array.isArray(c.contacts) ? c.contacts.length : 0;
          return (
            <span style={{ color: "#64748b", fontSize: 11.5 }}>
              {n ? `${n} contact${n !== 1 ? "s" : ""}` : "—"}
            </span>
          );
        },
      },
      {
        id: "warnings",
        label: "Warning(s)",
        width: "100px",
        getValue: (c) => {
          const arr = normalizeWarnings(c.warnings);
          const count = arr.filter((w) => (w.warningDescription || "").trim()).length;
          if (count === 0) return "—";
          return count === 1 ? "1 warning" : `${count} warnings`;
        },
        cellStyle: { fontSize: 12, color: "#1e293b", textAlign: "center" },
      },
    ],
    [],
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      code: "",
      name: "",
      emails: "",
      contacts: [emptyContact()],
      addresses: "",
      website: "",
      notes: "",
      invoicingContact: "",
      warnings: [emptyWarning()],
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    const rawContacts = selected.contacts || [];
    const contacts =
      rawContacts.length > 0
        ? rawContacts.map((c) =>
            typeof c === "string"
              ? { name: c, email: "", phone: "" }
              : {
                  name: c.name || "",
                  email: c.email || "",
                  phone: c.phone || "",
                },
          )
        : [emptyContact()];
    setFormData({
      code: selected.code || "",
      name: selected.name || "",
      emails: Array.isArray(selected.emails) ? selected.emails.join("\n") : "",
      contacts,
      addresses: Array.isArray(selected.addresses)
        ? selected.addresses.join("\n")
        : "",
      website: selected.website || "",
      notes: selected.notes || "",
      invoicingContact: selected.invoicingContact || "",
      warnings: normalizeWarnings(selected.warnings),
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert("Customer Code and Name are required");
      return;
    }

    const contacts = (formData.contacts || [])
      .map((c) => ({
        name: (c.name || "").trim(),
        email: (c.email || "").trim(),
        phone: (c.phone || "").trim(),
      }))
      .filter((c) => c.name || c.email || c.phone);

    const customerData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      emails: formData.emails
        .split("\n")
        .map((e) => e.trim())
        .filter((e) => e),
      contacts,
      addresses: formData.addresses
        .split("\n")
        .map((a) => a.trim())
        .filter((a) => a),
      website: formData.website.trim(),
      notes: formData.notes.trim(),
      invoicingContact: formData.invoicingContact.trim(),
      warnings: formData.warnings
        .filter((w) => (w.warningDescription || "").trim())
        .map((w) => ({
          warningDescription: (w.warningDescription || "").trim(),
          showOnPacks: w.showOnPacks !== false,
        })),
    };

    if (editMode) {
      updateCustomer(selected.id, customerData);
    } else {
      addCustomer(customerData);
    }

    setModalOpen(false);
    setFormData({
      code: "",
      name: "",
      emails: "",
      contacts: [emptyContact()],
      addresses: "",
      website: "",
      notes: "",
      invoicingContact: "",
      warnings: [emptyWarning()],
    });
  };

  const addWarningRow = () => {
    setFormData((prev) => ({
      ...prev,
      warnings: [...prev.warnings, emptyWarning()],
    }));
  };

  const removeWarningRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      warnings: prev.warnings.filter((_, i) => i !== index),
    }));
  };

  const updateWarning = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      warnings: prev.warnings.map((w, i) =>
        i === index ? { ...w, [field]: value } : w,
      ),
    }));
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

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete customer "${selected.name}" permanently?`)
    ) {
      deleteCustomer(selected.id);
      setSelectedCustomerId(null);
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
            justifyContent: "space-between",
          }}
        >
          {/* Search */}
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
              placeholder="Search customers…"
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

          {/* Actions */}
          <div style={{ display: "flex", gap: 6 }}>
            <BtnPrimary onClick={openCreateModal} style={{ fontSize: 12 }}>
              + Add Customer
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
          {/* Customer list */}
          <DataTable
            columns={customerColumns}
            data={filtered}
            getRowKey={(c) => c.id}
            onRowClick={(c) => setSelectedCustomerId(c.id)}
            selectedRowKey={selectedCustomerId}
            maxHeight={420}
            getRowStyle={(c) => {
              const arr = normalizeWarnings(c.warnings);
              const hasWarnings = arr.some((w) => (w.warningDescription || "").trim());
              return hasWarnings ? { background: "#fef3c7" } : {};
            }}
            emptyMessage={
              search
                ? "No customers match your search."
                : "No customers found. Add your first customer!"
            }
          />

          {/* ── INFO PANEL ──────────────────────────────────────────────── */}
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
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1e3d" }}>
                Customer Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow
                  label="Customer Code"
                  value={selected.code}
                  highlight
                />
                <InfoRow
                  label="Customer Name"
                  value={selected.name}
                  highlight
                />

                {selected.emails && selected.emails.length > 0 && (
                  <InfoSection label="Email(s)">
                    {selected.emails.map((email, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 12,
                          color: "#1e293b",
                          marginBottom: 4,
                        }}
                      >
                        {email}
                      </div>
                    ))}
                  </InfoSection>
                )}

                {selected.contacts && selected.contacts.length > 0 && (
                  <InfoSection label="Contact(s)">
                    {selected.contacts.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          background: "#f8fafc",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                          color: "#1e293b",
                          marginBottom: 6,
                        }}
                      >
                        <div>
                          <strong>
                            {typeof c === "string" ? c : c.name || "—"}
                          </strong>
                        </div>
                        {typeof c === "object" && c.email ? (
                          <div>{c.email}</div>
                        ) : null}
                        {typeof c === "object" && c.phone ? (
                          <div>{c.phone}</div>
                        ) : null}
                      </div>
                    ))}
                  </InfoSection>
                )}

                {selected.addresses && selected.addresses.length > 0 && (
                  <InfoSection label="Address(es)">
                    {selected.addresses.map((address, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: 12,
                          color: "#1e293b",
                          marginBottom: 4,
                        }}
                      >
                        {address}
                      </div>
                    ))}
                  </InfoSection>
                )}

                {selected.website && (
                  <InfoRow label="Website" value={selected.website} />
                )}
                {selected.invoicingContact && (
                  <InfoRow
                    label="Invoicing Contact"
                    value={selected.invoicingContact}
                  />
                )}
                {selected.notes && (
                  <InfoRow label="Notes" value={selected.notes} />
                )}

                <div>
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      fontWeight: 600,
                    }}
                  >
                    Customer Warning(s)
                  </span>
                  <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
                    {(() => {
                      const arr = normalizeWarnings(selected.warnings);
                      const hasAny = arr.some((w) => (w.warningDescription || "").trim());
                      if (!hasAny) {
                        return <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>;
                      }
                      return arr
                        .filter((w) => (w.warningDescription || "").trim())
                        .map((w, i) => (
                          <div
                            key={i}
                            style={{
                              padding: 8,
                              background: "#fef3c7",
                              borderRadius: 6,
                              fontSize: 12,
                              color: "#1e293b",
                            }}
                          >
                            <div>{w.warningDescription || "—"}</div>
                            <div style={{ marginTop: 2, fontSize: 11, color: "#64748b" }}>
                              Show on Packs: {w.showOnPacks !== false ? "Yes" : "No"}
                            </div>
                          </div>
                        ));
                    })()}
                  </div>
                </div>

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
                    Edit Customer
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Customer
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
                Select a customer to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Customer" : "Add New Customer"}
        width={600}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <FormRow label="Customer Code" required>
            <Input
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="e.g., AC001"
            />
          </FormRow>

          <FormRow label="Customer Name" required>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Agri-Corp Pty Ltd"
            />
          </FormRow>

          <FormRow label="Customer Email(s)">
            <textarea
              value={formData.emails}
              onChange={(e) =>
                setFormData({ ...formData, emails: e.target.value })
              }
              placeholder="Enter one email per line&#10;accounts@company.com.au&#10;admin@company.com.au"
              rows={3}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#111827",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "'Segoe UI', sans-serif",
                resize: "vertical",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
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
                Customer Contact(s)
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
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span
                    style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}
                  >
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

          <FormRow label="Customer Address(es)">
            <textarea
              value={formData.addresses}
              onChange={(e) =>
                setFormData({ ...formData, addresses: e.target.value })
              }
              placeholder="Enter one address per line&#10;123 Farm Road, Toowoomba QLD 4350"
              rows={2}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#111827",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "'Segoe UI', sans-serif",
                resize: "vertical",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </FormRow>

          <FormRow label="Customer Website">
            <Input
              value={formData.website}
              onChange={(e) =>
                setFormData({ ...formData, website: e.target.value })
              }
              placeholder="e.g., www.company.com.au"
            />
          </FormRow>

          <FormRow label="Customer Invoicing Contact">
            <Input
              value={formData.invoicingContact}
              onChange={(e) =>
                setFormData({ ...formData, invoicingContact: e.target.value })
              }
              placeholder="e.g., John Smith - accounts@company.com.au"
            />
          </FormRow>

          <FormRow label="Notes">
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Any additional notes about this customer"
              rows={2}
              style={{
                width: "100%",
                padding: "7px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                color: "#111827",
                background: "#fff",
                outline: "none",
                boxSizing: "border-box",
                transition: "border-color 0.15s",
                fontFamily: "'Segoe UI', sans-serif",
                resize: "vertical",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
          </FormRow>

          <FormRow label="Customer Warning(s)">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {formData.warnings.map((warning, index) => (
                <div
                  key={index}
                  style={{
                    padding: 10,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    background: "#fefce8",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                      Warning {index + 1}
                    </span>
                    {formData.warnings.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeWarningRow(index)}
                        style={{
                          fontSize: 11,
                          color: "#dc2626",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "2px 6px",
                        }}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <Input
                    value={warning.warningDescription}
                    onChange={(e) =>
                      updateWarning(index, "warningDescription", e.target.value)
                    }
                    placeholder="Warning Description"
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={warning.showOnPacks !== false}
                      onChange={(e) =>
                        updateWarning(index, "showOnPacks", e.target.checked)
                      }
                    />
                    Show on Packs
                  </label>
                </div>
              ))}
              <BtnSecondary onClick={addWarningRow} style={{ fontSize: 12 }}>
                + Add Warning
              </BtnSecondary>
            </div>
          </FormRow>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 20,
            paddingTop: 16,
            borderTop: "1px solid #e5e7eb",
          }}
        >
          <BtnPrimary
            onClick={handleSubmit}
            style={{ flex: 1, justifyContent: "center" }}
          >
            {editMode ? "Update Customer" : "Add Customer"}
          </BtnPrimary>
          <BtnSecondary
            onClick={() => setModalOpen(false)}
            style={{ flex: 1, justifyContent: "center" }}
          >
            Cancel
          </BtnSecondary>
        </div>
      </Modal>
    </div>
  );
}

function InfoRow({ label, value, highlight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
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
          color: highlight ? "#0f1e3d" : "#1e293b",
          fontWeight: highlight ? 700 : 500,
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function InfoSection({ label, children, highlight }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span
        style={{
          fontSize: 11,
          color: highlight ? "#dc2626" : "#64748b",
          textTransform: "uppercase",
          letterSpacing: 0.4,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <div>{children}</div>
    </div>
  );
}
