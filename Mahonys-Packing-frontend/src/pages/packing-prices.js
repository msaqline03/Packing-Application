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
  Select,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

const CHARGE_TYPES = [
  { value: "per MT", label: "per MT" },
  { value: "per Container", label: "per Container" },
  { value: "per Invoice", label: "per Invoice" },
];

const CHARGE_CLASSIFICATIONS = [
  { value: "revenue", label: "Revenue charge" },
  { value: "expense", label: "Expense charge" },
  { value: "both", label: "Both" },
];

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

export default function FeesAndChargesPage() {
  const {
    feesAndCharges,
    currentSite,
    setCurrentSite,
    addFeesAndCharge,
    updateFeesAndCharge,
    deleteFeesAndCharge,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    chargeName: "",
    chargeDescription: "",
    chargeRate: "",
    chargeType: "per Container",
    applyToAllPacks: true,
    chargeClassification: "revenue",
    accountCode: "",
  });

  const filtered = useMemo(() => {
    return feesAndCharges
      .filter((c) => {
        if (!search) return true;
        const text = `${c.chargeName || ""} ${c.chargeDescription || ""} ${c.chargeType || ""}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .sort((a, b) => (a.chargeName || "").localeCompare(b.chargeName || ""));
  }, [feesAndCharges, search]);

  const selected = filtered.find((c) => c.id === selectedId) || null;

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      chargeName: "",
      chargeDescription: "",
      chargeRate: "",
      chargeType: "per Container",
      applyToAllPacks: true,
      chargeClassification: "revenue",
      accountCode: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      chargeName: selected.chargeName || "",
      chargeDescription: selected.chargeDescription || "",
      chargeRate: selected.chargeRate != null ? String(selected.chargeRate) : "",
      chargeType: selected.chargeType || "per Container",
      applyToAllPacks: selected.applyToAllPacks !== false,
      chargeClassification: selected.chargeClassification || "revenue",
      accountCode: selected.accountCode ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.chargeName.trim()) {
      alert("Charge Name is required");
      return;
    }
    const rate = parseFloat(formData.chargeRate);
    if (formData.chargeRate !== "" && (isNaN(rate) || rate < 0)) {
      alert("Charge Rate must be a valid number ≥ 0");
      return;
    }

    const chargeData = {
      chargeName: formData.chargeName.trim(),
      chargeDescription: (formData.chargeDescription || "").trim(),
      chargeRate: formData.chargeRate === "" ? 0 : rate,
      chargeType: formData.chargeType,
      applyToAllPacks: formData.applyToAllPacks,
      chargeClassification: formData.chargeClassification,
      accountCode: (formData.accountCode || "").trim(),
    };

    if (editMode) {
      updateFeesAndCharge(selected.id, chargeData);
    } else {
      addFeesAndCharge(chargeData);
    }

    setModalOpen(false);
    setFormData({
      chargeName: "",
      chargeDescription: "",
      chargeRate: "",
      chargeType: "per Container",
      applyToAllPacks: true,
      chargeClassification: "revenue",
      accountCode: "",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        `Delete charge "${selected.chargeName}" permanently?`
      )
    ) {
      deleteFeesAndCharge(selected.id);
      setSelectedId(null);
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
          Fees and Charges
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Additional fees and charges that can be added to invoices and bills.
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
              placeholder="Search charges…"
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
              + Add Charge
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
          <div
            style={{
              flex: "1 1 0",
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
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px 100px 90px 100px 80px",
                gap: 0,
                background: "#f8fafc",
                borderBottom: "2px solid #e2e8f0",
                padding: "8px 14px",
                fontSize: 10.5,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              <span>Charge Name</span>
              <span>Description</span>
              <span>Rate</span>
              <span>Type</span>
              <span>Class.</span>
              <span>Account</span>
              <span>All Packs</span>
            </div>
            <div style={{ overflowY: "auto", flex: 1, minHeight: 420 }}>
              {filtered.length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    padding: 48,
                    color: "#9ca3af",
                    fontSize: 13,
                  }}
                >
                  {search
                    ? "No charges match your search."
                    : "No charges yet. Add your first one!"}
                </div>
              )}
              {filtered.map((c) => {
                const isSelected = selected?.id === c.id;
                const classLabel =
                  c.chargeClassification === "revenue"
                    ? "Revenue"
                    : c.chargeClassification === "expense"
                      ? "Expense"
                      : c.chargeClassification === "both"
                        ? "Both"
                        : "—";
                return (
                  <div
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr 80px 100px 90px 100px 80px",
                      gap: 0,
                      padding: "11px 14px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      background: isSelected ? "#eff6ff" : "transparent",
                      transition: "background 0.1s",
                      fontSize: 12.5,
                      color: "#1e293b",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                        color: "#2563eb",
                      }}
                    >
                      {c.chargeName || "—"}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        color: "#64748b",
                        fontSize: 11.5,
                      }}
                    >
                      {c.chargeDescription || "—"}
                    </span>
                    <span style={{ fontWeight: 600 }}>
                      {c.chargeRate != null ? Number(c.chargeRate) : "—"}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#64748b" }}>
                      {c.chargeType || "—"}
                    </span>
                    <span style={{ fontSize: 11.5 }}>
                      {classLabel}
                    </span>
                    <span
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontSize: 11.5,
                      }}
                    >
                      {c.accountCode || "—"}
                    </span>
                    <span style={{ fontSize: 11.5 }}>
                      {c.applyToAllPacks ? "Yes" : "No"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

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
                Charge Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Charge Name" value={selected.chargeName} highlight />
                <InfoRow label="Charge Description" value={selected.chargeDescription} />
                <InfoRow label="Charge Rate" value={selected.chargeRate != null ? String(selected.chargeRate) : null} />
                <InfoRow label="Charge Type" value={selected.chargeType} />
                <InfoRow
                  label="Revenue / Expense"
                  value={
                    selected.chargeClassification === "revenue"
                      ? "Revenue charge"
                      : selected.chargeClassification === "expense"
                        ? "Expense charge"
                        : selected.chargeClassification === "both"
                          ? "Both"
                          : "—"
                  }
                />
                <InfoRow label="Account code" value={selected.accountCode || "—"} />
                <InfoRow label="Apply to all packs" value={selected.applyToAllPacks ? "Yes" : "No"} />

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
                    Edit Charge
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Charge
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
                Select a charge to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Charge" : "Add Charge"}
        width={520}
      >
        <FormRow label="Charge Name" required>
          <Input
            value={formData.chargeName}
            onChange={(e) =>
              setFormData({ ...formData, chargeName: e.target.value })
            }
            placeholder="e.g., Handling Fee"
          />
        </FormRow>

        <FormRow label="Charge Description">
          <Input
            value={formData.chargeDescription}
            onChange={(e) =>
              setFormData({ ...formData, chargeDescription: e.target.value })
            }
            placeholder="e.g., Standard handling and administration"
          />
        </FormRow>

        <FormRow label="Charge Rate">
          <Input
            type="number"
            min={0}
            step={0.01}
            value={formData.chargeRate}
            onChange={(e) =>
              setFormData({ ...formData, chargeRate: e.target.value })
            }
            placeholder="0.00"
          />
        </FormRow>

        <FormRow label="Charge Type">
          <Select
            value={formData.chargeType}
            onChange={(e) =>
              setFormData({ ...formData, chargeType: e.target.value })
            }
          >
            {CHARGE_TYPES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormRow>

        <FormRow label="Revenue / Expense">
          <Select
            value={formData.chargeClassification}
            onChange={(e) =>
              setFormData({ ...formData, chargeClassification: e.target.value })
            }
          >
            {CHARGE_CLASSIFICATIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </FormRow>

        <FormRow label="Account code">
          <Input
            value={formData.accountCode}
            onChange={(e) =>
              setFormData({ ...formData, accountCode: e.target.value })
            }
            placeholder="e.g. 4000, REV-001"
          />
        </FormRow>

        <FormRow label="Apply to all packs">
          <Select
            value={formData.applyToAllPacks ? "yes" : "no"}
            onChange={(e) =>
              setFormData({
                ...formData,
                applyToAllPacks: e.target.value === "yes",
              })
            }
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </Select>
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
