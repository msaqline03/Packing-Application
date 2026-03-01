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
  DataTable,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function CommodityTypesPage() {
  const {
    commodityTypes,
    currentSite,
    setCurrentSite,
    addCommodityType,
    updateCommodityType,
    deleteCommodityType,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    acosCode: "",
    testRequired: "no",
  });

  const filtered = useMemo(() => {
    return commodityTypes.filter((t) => {
      if (!search) return true;
      const text = `${t.name} ${t.acosCode}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [commodityTypes, search]);

  const selected = commodityTypes.find((t) => t.id === selectedTypeId) || null;

  const typeColumns = useMemo(
    () => [
      { id: "name", label: "Name", minWidth: 120, getValue: (t) => t.name, cellStyle: { fontWeight: 600 } },
      { id: "acosCode", label: "ACOS Code", width: "150px", getValue: (t) => t.acosCode, cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 12 } },
      {
        id: "testRequired",
        label: "Test Required",
        width: "120px",
        getValue: (t) => (t.testRequired === "yes" ? "Yes" : "No"),
        render: (_, t) => (
          <span style={{ color: t.testRequired === "yes" ? "#16a34a" : "#64748b", fontSize: 11.5, textTransform: "capitalize" }}>
            {t.testRequired === "yes" ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: "",
      acosCode: "",
      testRequired: "no",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      name: selected.name || "",
      acosCode: selected.acosCode || "",
      testRequired: selected.testRequired || "no",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.acosCode.trim()) {
      alert("Name and ACOS Code are required");
      return;
    }

    const typeData = {
      name: formData.name.trim(),
      acosCode: formData.acosCode.trim(),
      testRequired: formData.testRequired,
    };

    if (editMode) {
      updateCommodityType(selected.id, typeData);
    } else {
      addCommodityType(typeData);
    }

    setModalOpen(false);
    setFormData({
      name: "",
      acosCode: "",
      testRequired: "no",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete commodity type "${selected.name}" permanently?`)
    ) {
      deleteCommodityType(selected.id);
      setSelectedTypeId(null);
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
              placeholder="Search commodity types…"
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
              + Add Commodity Type
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
          {/* Commodity type list */}
          <DataTable
            columns={typeColumns}
            data={filtered}
            getRowKey={(t) => t.id}
            onRowClick={(t) => setSelectedTypeId(t.id)}
            selectedRowKey={selectedTypeId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No commodity types match your search."
                : "No commodity types found. Add your first commodity type!"
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
                Commodity Type Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Name" value={selected.name} highlight />
                <InfoRow label="ACOS Code" value={selected.acosCode} highlight />
                <InfoRow
                  label="Test Required"
                  value={selected.testRequired === "yes" ? "Yes" : "No"}
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
                    Edit Commodity Type
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Commodity Type
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
                Select a commodity type to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Commodity Type" : "Add New Commodity Type"}
        width={600}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <FormRow label="Name" required>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Wheat"
            />
          </FormRow>

          <FormRow label="ACOS Code" required>
            <Input
              value={formData.acosCode}
              onChange={(e) =>
                setFormData({ ...formData, acosCode: e.target.value })
              }
              placeholder="e.g., WHT001"
            />
          </FormRow>

          <FormRow label="Test Required">
            <Select
              value={formData.testRequired}
              onChange={(e) =>
                setFormData({ ...formData, testRequired: e.target.value })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
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
            {editMode ? "Update Commodity Type" : "Add Commodity Type"}
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
