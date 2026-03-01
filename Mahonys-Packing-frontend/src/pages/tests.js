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

export default function TestsPage() {
  const {
    tests,
    currentSite,
    setCurrentSite,
    addTest,
    updateTest,
    deleteTest,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedTestId, setSelectedTestId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    type: "percentage",
    unit: "%",
    description: "",
    status: "active",
  });

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      if (!search) return true;
      const text = `${t.name} ${t.type} ${t.unit} ${t.description}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [tests, search]);

  const selected = tests.find((t) => t.id === selectedTestId) || null;

  const testColumns = useMemo(
    () => [
      { id: "name", label: "Name", minWidth: 120, getValue: (t) => t.name, cellStyle: { fontWeight: 600 } },
      { id: "type", label: "Type", width: "130px", getValue: (t) => t.type, cellStyle: { color: "#64748b", fontSize: 11.5, textTransform: "capitalize" } },
      { id: "unit", label: "Unit", width: "100px", getValue: (t) => t.unit, cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 12 } },
      {
        id: "status",
        label: "Status",
        width: "100px",
        getValue: (t) => t.status,
        render: (v) => (
          <span style={{ color: v === "active" ? "#16a34a" : "#dc2626", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{v}</span>
        ),
      },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: "",
      type: "percentage",
      unit: "%",
      description: "",
      status: "active",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      name: selected.name || "",
      type: selected.type || "percentage",
      unit: selected.unit || "%",
      description: selected.description || "",
      status: selected.status || "active",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.unit.trim()) {
      alert("Name and Unit are required");
      return;
    }

    const testData = {
      name: formData.name.trim(),
      type: formData.type,
      unit: formData.unit.trim(),
      description: formData.description.trim(),
      status: formData.status,
    };

    if (editMode) {
      updateTest(selected.id, testData);
    } else {
      addTest(testData);
    }

    setModalOpen(false);
    setFormData({
      name: "",
      type: "percentage",
      unit: "%",
      description: "",
      status: "active",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete test "${selected.name}" permanently?`)
    ) {
      deleteTest(selected.id);
      setSelectedTestId(null);
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
              placeholder="Search tests…"
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
              + Add Test
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
          {/* Test list */}
          <DataTable
            columns={testColumns}
            data={filtered}
            getRowKey={(t) => t.id}
            onRowClick={(t) => setSelectedTestId(t.id)}
            selectedRowKey={selectedTestId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No tests match your search."
                : "No tests found. Add your first test!"
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
                Test Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Name" value={selected.name} highlight />
                <InfoRow
                  label="Type"
                  value={
                    selected.type.charAt(0).toUpperCase() + selected.type.slice(1)
                  }
                />
                <InfoRow label="Unit" value={selected.unit} highlight />
                <InfoRow
                  label="Description"
                  value={selected.description || "—"}
                />
                <InfoRow
                  label="Status"
                  value={
                    selected.status.charAt(0).toUpperCase() +
                    selected.status.slice(1)
                  }
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
                    Edit Test
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Test
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
                Select a test to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Test" : "Add New Test"}
        width={600}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <FormRow label="Test Name" required>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Protein, Moisture, Falling Number"
            />
          </FormRow>

          <FormRow label="Type" required>
            <Select
              value={formData.type}
              onChange={(e) => {
                const newType = e.target.value;
                const newUnit = newType === "percentage" ? "%" : "";
                setFormData({ ...formData, type: newType, unit: newUnit });
              }}
            >
              <option value="percentage">Percentage</option>
              <option value="count">Count</option>
            </Select>
          </FormRow>

          <FormRow label="Unit" required>
            <Input
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              placeholder="e.g., %, seconds, kg/hL, ppm"
            />
          </FormRow>

          <FormRow label="Description">
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Optional description of what this test measures"
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

          <FormRow label="Status">
            <Select
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
            {editMode ? "Update Test" : "Add Test"}
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
