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

export default function ShippingLinesPage() {
  const {
    shippingLines,
    currentSite,
    setCurrentSite,
    addShippingLine,
    updateShippingLine,
    deleteShippingLine,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedLineId, setSelectedLineId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    website: "",
    email: "",
    phone: "",
  });

  const filtered = useMemo(() => {
    return shippingLines.filter((l) => {
      if (!search) return true;
      const text = `${l.code || ""} ${l.name || ""} ${l.website || ""} ${l.email || ""} ${l.phone || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [shippingLines, search]);

  const selected = shippingLines.find((l) => l.id === selectedLineId) || null;

  const shippingLineColumns = useMemo(
    () => [
      { id: "code", label: "Code", width: "100px", getValue: (l) => l.code ?? "", cellStyle: { fontWeight: 700, color: "#2563eb" } },
      { id: "name", label: "Name", minWidth: 120, getValue: (l) => l.name ?? "", cellStyle: { fontWeight: 600 } },
      { id: "website", label: "Website", minWidth: 120, getValue: (l) => l.website ?? "", cellStyle: { color: "#64748b", fontSize: 11.5 } },
      { id: "email", label: "Email", width: "180px", getValue: (l) => l.email ?? "", cellStyle: { color: "#64748b", fontSize: 11.5 } },
      { id: "phone", label: "Phone", width: "140px", getValue: (l) => l.phone ?? "", cellStyle: { color: "#64748b", fontSize: 11.5 } },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      code: "",
      name: "",
      website: "",
      email: "",
      phone: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      code: selected.code || "",
      name: selected.name || "",
      website: selected.website || "",
      email: selected.email || "",
      phone: selected.phone || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert("Shipping Line Code and Name are required");
      return;
    }

    const lineData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      website: formData.website.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
    };

    if (editMode) {
      updateShippingLine(selected.id, lineData);
    } else {
      addShippingLine(lineData);
    }

    setModalOpen(false);
    setFormData({
      code: "",
      name: "",
      website: "",
      email: "",
      phone: "",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        `Delete shipping line "${selected.name}" permanently?`
      )
    ) {
      deleteShippingLine(selected.id);
      setSelectedLineId(null);
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
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 700,
            color: "#0f1e3d",
          }}
        >
          Shipping Lines
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage shipping line contacts and carriers.
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
              placeholder="Search shipping lines…"
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
              + Add Shipping Line
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
            columns={shippingLineColumns}
            data={filtered}
            getRowKey={(l) => l.id}
            onRowClick={(l) => setSelectedLineId(l.id)}
            selectedRowKey={selectedLineId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No shipping lines match your search."
                : "No shipping lines found. Add your first one!"
            }
          />

          {/* Info panel */}
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
                Shipping Line Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Shipping Line Code" value={selected.code} highlight />
                <InfoRow label="Shipping Line Name" value={selected.name} highlight />
                <InfoRow label="Website" value={selected.website} />
                <InfoRow label="Contact Email" value={selected.email} />
                <InfoRow label="Contact Phone" value={selected.phone} />

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
                    Edit Shipping Line
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Shipping Line
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
                Select a shipping line to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Shipping Line" : "Add Shipping Line"}
        width={520}
      >
        <FormRow label="Shipping Line Code" required>
          <Input
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value })
            }
            placeholder="e.g., MSC, MAEU"
          />
        </FormRow>

        <FormRow label="Shipping Line Name" required>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., MSC Mediterranean Shipping"
          />
        </FormRow>

        <FormRow label="Website">
          <Input
            type="url"
            value={formData.website}
            onChange={(e) =>
              setFormData({ ...formData, website: e.target.value })
            }
            placeholder="https://www.example.com"
          />
        </FormRow>

        <FormRow label="Shipping Line Contact Email">
          <Input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="contact@example.com"
          />
        </FormRow>

        <FormRow label="Shipping Line Contact Phone Number">
          <Input
            type="tel"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
            placeholder="+1 234 567 8900"
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
