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

export default function CommoditiesPage() {
  const {
    commodities,
    commodityTypes,
    tests,
    currentSite,
    setCurrentSite,
    addCommodity,
    updateCommodity,
    deleteCommodity,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedCommodityId, setSelectedCommodityId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    commodityTypeId: "",
    commodityCode: "",
    description: "",
    hsCode: "",
    pemsCode: "",
    status: "active",
    unitType: "kg",
    testThresholds: [],
    shrinkAmount: "",
  });

  const filtered = useMemo(() => {
    return commodities.filter((c) => {
      if (!search) return true;
      const commodityType = commodityTypes.find(
        (t) => t.id === c.commodityTypeId
      );
      const typeName = commodityType ? commodityType.name : "";
      const text =
        `${c.commodityCode} ${c.description} ${typeName} ${c.hsCode} ${c.pemsCode}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [commodities, commodityTypes, search]);

  const selected = commodities.find((c) => c.id === selectedCommodityId) || null;

  const commodityColumns = useMemo(
    () => [
      { id: "code", label: "Code", width: "120px", getValue: (c) => c.commodityCode, cellStyle: { fontWeight: 700, color: "#2563eb", fontSize: 12 } },
      { id: "description", label: "Description", minWidth: 120, getValue: (c) => c.description, cellStyle: { fontWeight: 600 } },
      {
        id: "commodityType",
        label: "Commodity Type",
        width: "180px",
        getValue: (c) => commodityTypes.find((t) => t.id === c.commodityTypeId)?.name ?? "",
        render: (_, c) => {
          const name = commodityTypes.find((t) => t.id === c.commodityTypeId)?.name;
          return <span style={{ color: "#64748b", fontSize: 11.5 }}>{name || "—"}</span>;
        },
      },
      { id: "hsCode", label: "HS Code", width: "120px", getValue: (c) => c.hsCode ?? "", render: (v) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{v || "—"}</span> },
      {
        id: "status",
        label: "Status",
        width: "100px",
        getValue: (c) => c.status,
        render: (v) => (
          <span style={{ color: v === "active" ? "#16a34a" : "#dc2626", fontSize: 11, fontWeight: 600, textTransform: "capitalize" }}>{v}</span>
        ),
      },
    ],
    [commodityTypes]
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      commodityTypeId: "",
      commodityCode: "",
      description: "",
      hsCode: "",
      pemsCode: "",
      status: "active",
      unitType: "kg",
      testThresholds: [],
      shrinkAmount: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      commodityTypeId: selected.commodityTypeId || "",
      commodityCode: selected.commodityCode || "",
      description: selected.description || "",
      hsCode: selected.hsCode || "",
      pemsCode: selected.pemsCode || "",
      status: selected.status || "active",
      unitType: selected.unitType || "kg",
      testThresholds: selected.testThresholds || [],
      shrinkAmount: selected.shrinkAmount || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (
      !formData.commodityTypeId ||
      !formData.commodityCode.trim() ||
      !formData.description.trim()
    ) {
      alert("Commodity Type, Commodity Code, and Description are required");
      return;
    }

    const commodityData = {
      commodityTypeId: Number(formData.commodityTypeId),
      commodityCode: formData.commodityCode.trim(),
      description: formData.description.trim(),
      hsCode: formData.hsCode.trim(),
      pemsCode: formData.pemsCode.trim(),
      status: formData.status,
      unitType: formData.unitType,
      testThresholds: formData.testThresholds,
      shrinkAmount: formData.shrinkAmount.trim(),
    };

    if (editMode) {
      updateCommodity(selected.id, commodityData);
    } else {
      addCommodity(commodityData);
    }

    setModalOpen(false);
    setFormData({
      commodityTypeId: "",
      commodityCode: "",
      description: "",
      hsCode: "",
      pemsCode: "",
      status: "active",
      unitType: "kg",
      testThresholds: [],
      shrinkAmount: "",
    });
  };

  const addTestThreshold = () => {
    setFormData({
      ...formData,
      testThresholds: [
        ...formData.testThresholds,
        { testId: "", testName: "", min: "", max: "" },
      ],
    });
  };

  const removeTestThreshold = (index) => {
    setFormData({
      ...formData,
      testThresholds: formData.testThresholds.filter((_, i) => i !== index),
    });
  };

  const updateTestThreshold = (index, field, value) => {
    const newThresholds = [...formData.testThresholds];
    newThresholds[index] = {
      ...newThresholds[index],
      [field]: value,
    };

    // If testId is being changed, also update testName
    if (field === "testId") {
      const selectedTest = tests.find((t) => t.id === Number(value));
      if (selectedTest) {
        newThresholds[index].testName = selectedTest.name;
      }
    }

    setFormData({ ...formData, testThresholds: newThresholds });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete commodity "${selected.description}" permanently?`)
    ) {
      deleteCommodity(selected.id);
      setSelectedCommodityId(null);
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
              placeholder="Search commodities…"
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
              + Add Commodity
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
          {/* Commodity list */}
          <DataTable
            columns={commodityColumns}
            data={filtered}
            getRowKey={(c) => c.id}
            onRowClick={(c) => setSelectedCommodityId(c.id)}
            selectedRowKey={selectedCommodityId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No commodities match your search."
                : "No commodities found. Add your first commodity!"
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
                Commodity Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow
                  label="Commodity Code"
                  value={selected.commodityCode}
                  highlight
                />
                <InfoRow
                  label="Description"
                  value={selected.description}
                  highlight
                />
                <InfoRow
                  label="Commodity Type"
                  value={
                    commodityTypes.find(
                      (t) => t.id === selected.commodityTypeId
                    )?.name || "—"
                  }
                />
                <InfoRow label="HS Code" value={selected.hsCode || "—"} />
                <InfoRow label="PEMs Code" value={selected.pemsCode || "—"} />
                <InfoRow
                  label="Status"
                  value={
                    selected.status.charAt(0).toUpperCase() +
                    selected.status.slice(1)
                  }
                />
                <InfoRow label="Unit Type" value={selected.unitType || "—"} />
                <InfoRow
                  label="Shrink Amount"
                  value={selected.shrinkAmount || "—"}
                />

                {selected.testThresholds &&
                  selected.testThresholds.length > 0 && (
                    <InfoSection label="Test Thresholds">
                      <div
                        style={{
                          fontSize: 11.5,
                          color: "#1e293b",
                          padding: "8px 10px",
                          background: "#f8fafc",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        {selected.testThresholds.map((threshold, tIdx) => (
                          <div
                            key={tIdx}
                            style={{
                              fontSize: 10.5,
                              color: "#64748b",
                              marginBottom:
                                tIdx < selected.testThresholds.length - 1
                                  ? 6
                                  : 0,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontWeight: 600, color: "#2563eb" }}>
                              {threshold.testName}:
                            </span>
                            <span style={{ fontWeight: 600, color: "#1e293b" }}>
                              {threshold.min} - {threshold.max}
                            </span>
                          </div>
                        ))}
                      </div>
                    </InfoSection>
                  )}

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
                    Edit Commodity
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Commodity
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
                Select a commodity to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Commodity" : "Add New Commodity"}
        width={600}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <FormRow label="Commodity Type" required>
            <Select
              value={formData.commodityTypeId}
              onChange={(e) =>
                setFormData({ ...formData, commodityTypeId: e.target.value })
              }
            >
              <option value="">Select a commodity type</option>
              {commodityTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name} ({type.acosCode})
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Commodity Code" required>
            <Input
              value={formData.commodityCode}
              onChange={(e) =>
                setFormData({ ...formData, commodityCode: e.target.value })
              }
              placeholder="e.g., COM-001"
            />
          </FormRow>

          <FormRow label="Description" required>
            <Input
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Australian Hard Wheat"
            />
          </FormRow>

          <FormRow label="HS Code">
            <Input
              value={formData.hsCode}
              onChange={(e) =>
                setFormData({ ...formData, hsCode: e.target.value })
              }
              placeholder="e.g., 1001.99.00"
            />
          </FormRow>

          <FormRow label="PEMs Code">
            <Input
              value={formData.pemsCode}
              onChange={(e) =>
                setFormData({ ...formData, pemsCode: e.target.value })
              }
              placeholder="e.g., PEMS-12345"
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

          <FormRow label="Unit Type">
            <Select
              value={formData.unitType}
              onChange={(e) =>
                setFormData({ ...formData, unitType: e.target.value })
              }
            >
              <option value="kg">kg (Kilograms)</option>
              <option value="MT">MT (Metric Tons)</option>
              <option value="t">t (Tonnes)</option>
              <option value="lb">lb (Pounds)</option>
              <option value="bu">bu (Bushels)</option>
            </Select>
          </FormRow>

          <FormRow label="Test Thresholds">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div
                style={{
                  padding: "10px 12px",
                  background: "#fef3c7",
                  border: "1px solid #fbbf24",
                  borderRadius: 6,
                  fontSize: 11,
                  color: "#78350f",
                  lineHeight: 1.4,
                  marginBottom: 8,
                }}
              >
                <strong>Note:</strong> Each commodity IS a specific grade. Tests
                help identify and confirm the commodity. Example: Create
                separate commodities for "Wheat Grade 1", "Wheat Grade 2", etc.
              </div>
              {formData.testThresholds.map((threshold, thresholdIndex) => (
                <div
                  key={thresholdIndex}
                  style={{
                    display: "flex",
                    gap: 6,
                    padding: "8px",
                    background: "#f8fafc",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    alignItems: "flex-end",
                  }}
                >
                  <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      Test
                    </label>
                    <Select
                      value={threshold.testId}
                      onChange={(e) =>
                        updateTestThreshold(
                          thresholdIndex,
                          "testId",
                          e.target.value
                        )
                      }
                    >
                      <option value="">Select test</option>
                      {tests
                        .filter((t) => t.status === "active")
                        .map((test) => (
                          <option key={test.id} value={test.id}>
                            {test.name} ({test.unit})
                          </option>
                        ))}
                    </Select>
                  </div>
                  <div style={{ width: 80 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      Min
                    </label>
                    <Input
                      type="text"
                      value={threshold.min}
                      onChange={(e) =>
                        updateTestThreshold(
                          thresholdIndex,
                          "min",
                          e.target.value
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                  <div style={{ width: 80 }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 10,
                        fontWeight: 600,
                        color: "#64748b",
                        marginBottom: 4,
                        textTransform: "uppercase",
                      }}
                    >
                      Max
                    </label>
                    <Input
                      type="text"
                      value={threshold.max}
                      onChange={(e) =>
                        updateTestThreshold(
                          thresholdIndex,
                          "max",
                          e.target.value
                        )
                      }
                      placeholder="100"
                    />
                  </div>
                  <button
                    onClick={() => removeTestThreshold(thresholdIndex)}
                    style={{
                      background: "#fee2e2",
                      border: "1px solid #fecaca",
                      borderRadius: 4,
                      padding: "8px 10px",
                      cursor: "pointer",
                      color: "#dc2626",
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={addTestThreshold}
                style={{
                  background: "linear-gradient(135deg, #2563eb, #3b82f6)",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 16px",
                  cursor: "pointer",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(37,99,235,0.3)",
                }}
              >
                + Add Test Threshold
              </button>
            </div>
          </FormRow>

          <FormRow label="Shrink Amount">
            <Input
              value={formData.shrinkAmount}
              onChange={(e) =>
                setFormData({ ...formData, shrinkAmount: e.target.value })
              }
              placeholder="e.g., 2%"
            />
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
            {editMode ? "Update Commodity" : "Add Commodity"}
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

function InfoSection({ label, children }) {
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
      <div>{children}</div>
    </div>
  );
}
