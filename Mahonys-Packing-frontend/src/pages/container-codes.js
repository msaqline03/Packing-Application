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
import { SITES, CONTAINER_SIZES } from "../utils/mockData";

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

function formatNum(v) {
  if (v == null || v === "") return "—";
  const n = Number(v);
  return Number.isNaN(n) ? "—" : n.toLocaleString();
}

export default function ContainerCodesPage() {
  const {
    containerCodes,
    currentSite,
    setCurrentSite,
    addContainerCode,
    updateContainerCode,
    deleteContainerCode,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    isoCode: "",
    containerSize: "",
    description: "",
    cubicMeters: "",
    averageWeight: "",
    maxWeight: "",
    averageEmptyTare: "",
  });

  const filtered = useMemo(() => {
    return containerCodes.filter((c) => {
      if (!search) return true;
      const text = `${c.isoCode || ""} ${c.containerSize || ""} ${c.description || ""} ${c.cubicMeters ?? ""} ${c.averageWeight ?? ""} ${c.maxWeight ?? ""} ${c.averageEmptyTare ?? ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [containerCodes, search]);

  const selected = containerCodes.find((c) => c.id === selectedId) || null;

  const containerCodeColumns = useMemo(
    () => [
      { id: "isoCode", label: "ISO Code", width: "80px", getValue: (c) => c.isoCode ?? "", cellStyle: { fontWeight: 700, color: "#2563eb" } },
      { id: "containerSize", label: "Size", width: "60px", getValue: (c) => c.containerSize ?? "", cellStyle: { fontSize: 11.5, color: "#64748b" } },
      { id: "description", label: "Description", minWidth: 100, getValue: (c) => c.description ?? "", cellStyle: { fontWeight: 600 } },
      { id: "cubicMeters", label: "m³", width: "70px", getValue: (c) => formatNum(c.cubicMeters), render: (_, c) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatNum(c.cubicMeters)}</span> },
      { id: "averageWeight", label: "Avg (t)", width: "90px", getValue: (c) => formatNum(c.averageWeight != null ? c.averageWeight / 1000 : null), render: (_, c) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatNum(c.averageWeight != null ? c.averageWeight / 1000 : null)}</span> },
      { id: "maxWeight", label: "Max (t)", width: "90px", getValue: (c) => formatNum(c.maxWeight != null ? c.maxWeight / 1000 : null), render: (_, c) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatNum(c.maxWeight != null ? c.maxWeight / 1000 : null)}</span> },
      { id: "averageEmptyTare", label: "Tare (t)", width: "100px", getValue: (c) => formatNum(c.averageEmptyTare != null ? c.averageEmptyTare / 1000 : null), render: (_, c) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatNum(c.averageEmptyTare != null ? c.averageEmptyTare / 1000 : null)}</span> },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      isoCode: "",
      containerSize: "",
      description: "",
      cubicMeters: "",
      averageWeight: "",
      maxWeight: "",
      averageEmptyTare: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      isoCode: selected.isoCode || "",
      containerSize: selected.containerSize || "",
      description: selected.description || "",
      cubicMeters: selected.cubicMeters != null ? String(selected.cubicMeters) : "",
      averageWeight: selected.averageWeight != null ? String(selected.averageWeight / 1000) : "",
      maxWeight: selected.maxWeight != null ? String(selected.maxWeight / 1000) : "",
      averageEmptyTare: selected.averageEmptyTare != null ? String(selected.averageEmptyTare / 1000) : "",
    });
    setModalOpen(true);
  };

  const parseNum = (s) => {
    if (s === "" || s == null) return null;
    const n = Number(s);
    return Number.isNaN(n) ? null : n;
  };

  const handleSubmit = () => {
    if (!formData.isoCode.trim()) {
      alert("ISO Code is required");
      return;
    }

    const data = {
      isoCode: formData.isoCode.trim(),
      containerSize: formData.containerSize.trim() || null,
      description: formData.description.trim(),
      cubicMeters: parseNum(formData.cubicMeters),
      averageWeight: parseNum(formData.averageWeight) != null ? Math.round(parseNum(formData.averageWeight) * 1000) : null,
      maxWeight: parseNum(formData.maxWeight) != null ? Math.round(parseNum(formData.maxWeight) * 1000) : null,
      averageEmptyTare: parseNum(formData.averageEmptyTare) != null ? Math.round(parseNum(formData.averageEmptyTare) * 1000) : null,
    };

    if (editMode) {
      updateContainerCode(selected.id, data);
    } else {
      addContainerCode(data);
    }

    setModalOpen(false);
    setFormData({
      isoCode: "",
      containerSize: "",
      description: "",
      cubicMeters: "",
      averageWeight: "",
      maxWeight: "",
      averageEmptyTare: "",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        `Delete container code "${selected.isoCode} – ${selected.description}" permanently?`
      )
    ) {
      deleteContainerCode(selected.id);
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
          Container Codes
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage container types by ISO code with capacity and weight data.
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
              placeholder="Search container codes…"
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
              + Add Container Code
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
            columns={containerCodeColumns}
            data={filtered}
            getRowKey={(c) => c.id}
            onRowClick={(c) => setSelectedId(c.id)}
            selectedRowKey={selectedId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No container codes match your search."
                : "No container codes found. Add your first one!"
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
                Container Code Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="ISO Code" value={selected.isoCode} highlight />
                <InfoRow label="Container Size" value={selected.containerSize} />
                <InfoRow label="Description" value={selected.description} />
                <InfoRow label="Cubic Meters (m³)" value={formatNum(selected.cubicMeters)} />
                <InfoRow label="Average Weight (t)" value={formatNum(selected.averageWeight != null ? selected.averageWeight / 1000 : null)} />
                <InfoRow label="Max Weight (t)" value={formatNum(selected.maxWeight != null ? selected.maxWeight / 1000 : null)} />
                <InfoRow label="Average Empty Tare (t)" value={formatNum(selected.averageEmptyTare != null ? selected.averageEmptyTare / 1000 : null)} />

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
                    Edit Container Code
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Container Code
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
                Select a container code to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Container Code" : "Add Container Code"}
        width={520}
      >
        <FormRow label="ISO Code" required>
          <Input
            value={formData.isoCode}
            onChange={(e) =>
              setFormData({ ...formData, isoCode: e.target.value })
            }
            placeholder="e.g., 22G1, 42G1"
          />
        </FormRow>

        <FormRow label="Container Size">
          <select
            value={formData.containerSize}
            onChange={(e) =>
              setFormData({ ...formData, containerSize: e.target.value })
            }
            style={{
              width: "100%",
              padding: "8px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 13,
              outline: "none",
              boxSizing: "border-box",
              background: "#fff",
            }}
          >
            <option value="">— Select size —</option>
            {CONTAINER_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label="Description">
          <Input
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="e.g., 20' General Purpose"
          />
        </FormRow>

        <FormRow label="Cubic Meters (m³)">
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.cubicMeters}
            onChange={(e) =>
              setFormData({ ...formData, cubicMeters: e.target.value })
            }
            placeholder="e.g., 33.2"
          />
        </FormRow>

        <FormRow label="Average Weight (t)">
          <Input
            type="number"
            step="0.001"
            min="0"
            value={formData.averageWeight}
            onChange={(e) =>
              setFormData({ ...formData, averageWeight: e.target.value })
            }
            placeholder="e.g., 22.5"
          />
        </FormRow>

        <FormRow label="Max Weight (t)">
          <Input
            type="number"
            step="0.001"
            min="0"
            value={formData.maxWeight}
            onChange={(e) =>
              setFormData({ ...formData, maxWeight: e.target.value })
            }
            placeholder="e.g., 28.18"
          />
        </FormRow>

        <FormRow label="Average Empty Tare (t)">
          <Input
            type="number"
            step="0.001"
            min="0"
            value={formData.averageEmptyTare}
            onChange={(e) =>
              setFormData({ ...formData, averageEmptyTare: e.target.value })
            }
            placeholder="e.g., 2.23"
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
