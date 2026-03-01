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
        {value ?? "—"}
      </span>
    </div>
  );
}

const emptyContact = () => ({
  contactName: "",
  contactPhone: "",
  contactEmail: "",
});

const emptyWarning = () => ({
  warningDescription: "",
  showOnPacks: true,
});

export default function CountriesPage() {
  const {
    countries,
    currentSite,
    setCurrentSite,
    addCountry,
    updateCountry,
    deleteCountry,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    countryName: "",
    countryCode: "",
    contacts: [emptyContact()],
    notes: "",
    warnings: [emptyWarning()],
  });

  const filtered = useMemo(() => {
    return countries.filter((c) => {
      if (!search) return true;
      const text = `${c.countryName || ""} ${c.countryCode || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [countries, search]);

  const selected = countries.find((c) => c.id === selectedId) || null;

  const countryColumns = useMemo(
    () => [
      { id: "countryName", label: "Country Name", minWidth: 120, getValue: (c) => c.countryName ?? "", cellStyle: { fontWeight: 700, color: "#2563eb" } },
      { id: "countryCode", label: "Code", width: "120px", getValue: (c) => c.countryCode ?? "", cellStyle: { fontSize: 11.5, color: "#64748b" } },
      {
        id: "notes",
        label: "Country Notes",
        minWidth: 140,
        getValue: (c) => {
          const n = (c.notes || "").trim();
          if (!n) return "—";
          return n.length > 60 ? `${n.slice(0, 60)}…` : n;
        },
        cellStyle: { fontSize: 12, color: "#475569", maxWidth: 200 },
      },
      {
        id: "contacts",
        label: "Contact(s)",
        width: "100px",
        getValue: (c) => {
          const arr = Array.isArray(c.contacts) ? c.contacts : [];
          const count = arr.filter(
            (x) =>
              (x.contactName || "").trim() ||
              (x.contactPhone || "").trim() ||
              (x.contactEmail || "").trim()
          ).length;
          if (count === 0) return "—";
          return count === 1 ? "1 contact" : `${count} contacts`;
        },
        cellStyle: { fontSize: 12, color: "#1e293b", textAlign: "center" },
      },
      {
        id: "warnings",
        label: "Warning(s)",
        width: "100px",
        getValue: (c) => {
          const arr = Array.isArray(c.warnings) ? c.warnings : [];
          const count = arr.filter((w) => (w.warningDescription || "").trim()).length;
          if (count === 0) return "—";
          return count === 1 ? "1 warning" : `${count} warnings`;
        },
        cellStyle: { fontSize: 12, color: "#1e293b", textAlign: "center" },
      },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      countryName: "",
      countryCode: "",
      contacts: [emptyContact()],
      notes: "",
      warnings: [emptyWarning()],
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    const contacts =
      Array.isArray(selected.contacts) && selected.contacts.length > 0
        ? selected.contacts.map((c) => ({
            contactName: c.contactName || "",
            contactPhone: c.contactPhone || "",
            contactEmail: c.contactEmail || "",
          }))
        : [emptyContact()];
    const warnings =
      Array.isArray(selected.warnings) && selected.warnings.length > 0
        ? selected.warnings.map((w) => ({
            warningDescription: w.warningDescription || "",
            showOnPacks: w.showOnPacks !== false,
          }))
        : [emptyWarning()];
    setFormData({
      countryName: selected.countryName || "",
      countryCode: selected.countryCode || "",
      contacts,
      notes: selected.notes || "",
      warnings,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.countryName.trim()) {
      alert("Country Name is required");
      return;
    }

    const contacts = formData.contacts
      .filter(
        (c) =>
          (c.contactName || "").trim() ||
          (c.contactPhone || "").trim() ||
          (c.contactEmail || "").trim(),
      )
      .map((c) => ({
        contactName: (c.contactName || "").trim(),
        contactPhone: (c.contactPhone || "").trim(),
        contactEmail: (c.contactEmail || "").trim(),
      }));

    const warnings = formData.warnings
      .filter((w) => (w.warningDescription || "").trim())
      .map((w) => ({
        warningDescription: (w.warningDescription || "").trim(),
        showOnPacks: w.showOnPacks !== false,
      }));

    const data = {
      countryName: formData.countryName.trim(),
      countryCode: (formData.countryCode || "").trim(),
      contacts: contacts.length ? contacts : [],
      notes: (formData.notes || "").trim(),
      warnings: warnings.length ? warnings : [],
    };

    if (editMode) {
      updateCountry(selected.id, data);
    } else {
      addCountry(data);
    }

    setModalOpen(false);
    setFormData({
      countryName: "",
      countryCode: "",
      contacts: [emptyContact()],
      notes: "",
      warnings: [emptyWarning()],
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        `Delete country "${selected.countryName}" permanently?`,
      )
    ) {
      deleteCountry(selected.id);
      setSelectedId(null);
    }
  };

  const addContactRow = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...prev.contacts, emptyContact()],
    }));
  };

  const removeContactRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.filter((_, i) => i !== index),
    }));
  };

  const updateContact = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      contacts: prev.contacts.map((c, i) =>
        i === index ? { ...c, [field]: value } : c,
      ),
    }));
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
          Countries
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage country details: name, code, contacts, notes, and warnings for
          packs.
        </p>

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
              placeholder="Search countries…"
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
              + Add Country
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

        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          <DataTable
            columns={countryColumns}
            data={filtered}
            getRowKey={(c) => c.id}
            onRowClick={(c) => setSelectedId(c.id)}
            selectedRowKey={selectedId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No countries match your search."
                : "No countries found. Add your first one!"
            }
          />

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
                Country Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Country Name" value={selected.countryName} highlight />
                <InfoRow label="Country Code" value={selected.countryCode} />
                <InfoRow label="Country Notes" value={selected.notes} />
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                    Country Contact(s)
                  </span>
                  <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
                    {(!selected.contacts || selected.contacts.length === 0) && (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                    )}
                    {(selected.contacts || []).map((contact, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          background: "#f8fafc",
                          borderRadius: 6,
                          fontSize: 12,
                          color: "#1e293b",
                        }}
                      >
                        <div><strong>{contact.contactName || "—"}</strong></div>
                        {contact.contactPhone && (
                          <div style={{ marginTop: 2 }}>Phone: {contact.contactPhone}</div>
                        )}
                        {contact.contactEmail && (
                          <div style={{ marginTop: 2 }}>Email: {contact.contactEmail}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                    Country Warning(s)
                  </span>
                  <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
                    {(!selected.warnings || selected.warnings.length === 0) && (
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                    )}
                    {(selected.warnings || []).map((w, i) => (
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
                    ))}
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
                    Edit Country
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Country
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
                Select a country to view details
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Country" : "Add Country"}
        width={560}
      >
        <FormRow label="Country Name" required>
          <Input
            value={formData.countryName}
            onChange={(e) =>
              setFormData({ ...formData, countryName: e.target.value })
            }
            placeholder="e.g., Indonesia"
          />
        </FormRow>

        <FormRow label="Country Code">
          <Input
            value={formData.countryCode}
            onChange={(e) =>
              setFormData({ ...formData, countryCode: e.target.value })
            }
            placeholder="e.g., ID"
          />
        </FormRow>

        <FormRow label="Country Notes">
          <textarea
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Optional notes"
            rows={3}
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </FormRow>

        <FormRow label="Country Contact(s)">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {formData.contacts.map((contact, index) => (
              <div
                key={index}
                style={{
                  padding: 10,
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  background: "#f8fafc",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>
                    Contact {index + 1}
                  </span>
                  {formData.contacts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeContactRow(index)}
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
                  value={contact.contactName}
                  onChange={(e) => updateContact(index, "contactName", e.target.value)}
                  placeholder="Contact Name"
                />
                <Input
                  value={contact.contactPhone}
                  onChange={(e) => updateContact(index, "contactPhone", e.target.value)}
                  placeholder="Contact Phone"
                />
                <Input
                  value={contact.contactEmail}
                  onChange={(e) => updateContact(index, "contactEmail", e.target.value)}
                  placeholder="Contact Email"
                />
              </div>
            ))}
            <BtnSecondary onClick={addContactRow} style={{ fontSize: 12 }}>
              + Add Contact
            </BtnSecondary>
          </div>
        </FormRow>

        <FormRow label="Country Warning(s)">
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
