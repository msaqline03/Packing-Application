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
  Toggle,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "under_maintenance", label: "Under Maintenance" },
  { value: "inactive", label: "In-Active" },
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

export default function PackersPage() {
  const {
    packers,
    commodityTypes,
    stockLocations,
    currentSite,
    setCurrentSite,
    addPacker,
    updatePacker,
    deletePacker,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active",
    commodityTypesAllowed: [], // [] = All
    stockLocationsAllowed: [], // [] = All
  });

  const filtered = useMemo(() => {
    return packers.filter((p) => {
      if (!search) return true;
      const text = `${p.name} ${p.description || ""} ${p.status}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [packers, search]);

  const selected = packers.find((p) => p.id === selectedId) || null;

  const statusLabel = (status) => {
    const opt = STATUS_OPTIONS.find((o) => o.value === status);
    return opt ? opt.label : status;
  };

  const formatAllowedCount = (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) return "All";
    return String(ids.length);
  };

  const packerColumns = useMemo(
    () => [
      {
        id: "name",
        label: "Name",
        minWidth: 120,
        getValue: (p) => p.name ?? "",
        cellStyle: { fontWeight: 700, color: "#2563eb" },
      },
      {
        id: "description",
        label: "Description",
        minWidth: 120,
        getValue: (p) => p.description ?? "",
        cellStyle: { color: "#64748b", fontSize: 11.5 },
      },
      {
        id: "status",
        label: "Status",
        width: "140px",
        getValue: (p) => statusLabel(p.status),
        render: (_, p) => (
          <span style={{ fontSize: 11.5, color: "#64748b" }}>
            {statusLabel(p.status)}
          </span>
        ),
      },
      {
        id: "commodityTypesAllowed",
        label: "Commodity Types",
        minWidth: 110,
        getValue: (p) => formatAllowedCount(p.commodityTypesAllowed),
        render: (_, p) => (
          <span style={{ fontSize: 11.5, color: "#64748b" }}>
            {formatAllowedCount(p.commodityTypesAllowed)}
          </span>
        ),
      },
      {
        id: "stockLocationsAllowed",
        label: "Stock Locations",
        minWidth: 120,
        getValue: (p) => formatAllowedCount(p.stockLocationsAllowed),
        render: (_, p) => (
          <span style={{ fontSize: 11.5, color: "#64748b" }}>
            {formatAllowedCount(p.stockLocationsAllowed)}
          </span>
        ),
      },
    ],
    [],
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: "",
      description: "",
      status: "active",
      commodityTypesAllowed: [],
      stockLocationsAllowed: [],
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      name: selected.name || "",
      description: selected.description || "",
      status: selected.status || "active",
      commodityTypesAllowed: Array.isArray(selected.commodityTypesAllowed)
        ? [...selected.commodityTypesAllowed]
        : [],
      stockLocationsAllowed: Array.isArray(selected.stockLocationsAllowed)
        ? [...selected.stockLocationsAllowed]
        : [],
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Name is required");
      return;
    }

    const data = {
      name: formData.name.trim(),
      description: formData.description.trim() || "",
      status: formData.status,
      commodityTypesAllowed: formData.commodityTypesAllowed,
      stockLocationsAllowed: formData.stockLocationsAllowed,
    };

    if (editMode) {
      updatePacker(selected.id, data);
    } else {
      addPacker(data);
    }

    setModalOpen(false);
    setFormData({
      name: "",
      description: "",
      status: "active",
      commodityTypesAllowed: [],
      stockLocationsAllowed: [],
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete packer "${selected.name}" permanently?`)
    ) {
      deletePacker(selected.id);
      setSelectedId(null);
    }
  };

  const formatAllowed = (ids, allItems, label) => {
    if (!Array.isArray(ids) || ids.length === 0) return "All";
    const names = ids
      .map((id) => allItems.find((x) => x.id === id)?.name)
      .filter(Boolean);
    return names.length ? names.join(", ") : "—";
  };

  const setCommodityTypeChecked = (typeId, checked) => {
    setFormData((prev) => {
      const current = prev.commodityTypesAllowed || [];
      if (checked) {
        if (current.some((id) => Number(id) === Number(typeId))) return prev;
        return { ...prev, commodityTypesAllowed: [...current, typeId] };
      }
      return {
        ...prev,
        commodityTypesAllowed: current.filter(
          (id) => Number(id) !== Number(typeId),
        ),
      };
    });
  };

  const setStockLocationChecked = (locId, checked) => {
    setFormData((prev) => {
      const current = prev.stockLocationsAllowed || [];
      if (checked) {
        if (current.some((id) => Number(id) === Number(locId))) return prev;
        return { ...prev, stockLocationsAllowed: [...current, locId] };
      }
      return {
        ...prev,
        stockLocationsAllowed: current.filter(
          (id) => Number(id) !== Number(locId),
        ),
      };
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
          Packers
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage packer details across the site: name, status, and allowed
          commodity types and stock locations.
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
              placeholder="Search packers…"
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
              + Add Packer
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
            columns={packerColumns}
            data={filtered}
            getRowKey={(p) => p.id}
            onRowClick={(p) => setSelectedId(p.id)}
            selectedRowKey={selectedId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No packers match your search."
                : "No packers found. Add your first one!"
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
                Packer Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Name" value={selected.name} highlight />
                <InfoRow label="Description" value={selected.description} />
                <InfoRow label="Status" value={statusLabel(selected.status)} />
                <InfoRow
                  label="Commodity Types Allowed"
                  value={formatAllowed(
                    selected.commodityTypesAllowed,
                    commodityTypes,
                    "Commodity Types",
                  )}
                />
                <InfoRow
                  label="Stock Locations Allowed"
                  value={formatAllowed(
                    selected.stockLocationsAllowed,
                    stockLocations,
                    "Stock Locations",
                  )}
                />

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
                    Edit Packer
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Packer
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
                Select a packer to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Packer" : "Add Packer"}
        width={520}
      >
        <FormRow label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Main Packer"
          />
        </FormRow>

        <FormRow label="Description">
          <Input
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            placeholder="Optional description"
          />
        </FormRow>

        <FormRow label="Status">
          <select
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
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
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FormRow>

        <FormRow label="Commodity Types Allowed">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <Toggle
                checked={
                  !formData.commodityTypesAllowed ||
                  formData.commodityTypesAllowed.length === 0
                }
                onChange={(on) => {
                  setFormData({
                    ...formData,
                    commodityTypesAllowed: on ? [] : commodityTypes.map((ct) => ct.id),
                  });
                }}
              />
              <span>All</span>
            </div>
            {commodityTypes.length > 0 && (
              <div
                style={{
                  paddingLeft: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  maxHeight: 120,
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                {commodityTypes.map((ct) => {
                  const isChecked =
                    Array.isArray(formData.commodityTypesAllowed) &&
                    formData.commodityTypesAllowed.some(
                      (id) => Number(id) === Number(ct.id),
                    );
                  return (
                    <div
                      key={ct.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Toggle
                        checked={!!isChecked}
                        onChange={(on) =>
                          setCommodityTypeChecked(ct.id, on)
                        }
                      />
                      {ct.name}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FormRow>

        <FormRow label="Stock Locations Allowed">
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 13,
              }}
            >
              <Toggle
                checked={
                  !formData.stockLocationsAllowed ||
                  formData.stockLocationsAllowed.length === 0
                }
                onChange={(on) => {
                  setFormData({
                    ...formData,
                    stockLocationsAllowed: on ? [] : stockLocations.map((loc) => loc.id),
                  });
                }}
              />
              <span>All</span>
            </div>
            {stockLocations.length > 0 && (
              <div
                style={{
                  paddingLeft: 20,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  maxHeight: 120,
                  overflowY: "auto",
                  border: "1px solid #e2e8f0",
                  borderRadius: 6,
                  padding: 8,
                }}
              >
                {stockLocations.map((loc) => {
                  const isChecked =
                    Array.isArray(formData.stockLocationsAllowed) &&
                    formData.stockLocationsAllowed.some(
                      (id) => Number(id) === Number(loc.id),
                    );
                  return (
                    <div
                      key={loc.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Toggle
                        checked={!!isChecked}
                        onChange={(on) =>
                          setStockLocationChecked(loc.id, on)
                        }
                      />
                      {loc.name}
                    </div>
                  );
                })}
              </div>
            )}
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
          <BtnSecondary onClick={() => setModalOpen(false)}>
            Cancel
          </BtnSecondary>
          <BtnPrimary onClick={handleSubmit}>
            {editMode ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
