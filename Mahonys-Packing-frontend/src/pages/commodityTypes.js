"use client";
import React, { useState, useMemo, useEffect } from "react";
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

const MOBILE_BREAKPOINT = 900;

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
  const [isMobile, setIsMobile] = useState(false);
  const [showGoToTop, setShowGoToTop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const onScroll = () => setShowGoToTop(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [isMobile]);

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
          padding: isMobile ? "12px 14px" : "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 12 : 16,
        }}
      >
        {/* ── TOOLBAR ───────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: isMobile ? "12px 14px" : "14px 18px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: isMobile ? 10 : 12,
            justifyContent: "space-between",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* Search */}
          <div
            style={{
              position: "relative",
              flex: isMobile ? "1 1 auto" : "1 1 220px",
              minWidth: isMobile ? "100%" : 180,
              maxWidth: isMobile ? "none" : 400,
              width: isMobile ? "100%" : undefined,
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
          <div
            style={{
              display: "flex",
              gap: 6,
              width: isMobile ? "100%" : undefined,
              justifyContent: isMobile ? "stretch" : undefined,
            }}
          >
            <BtnPrimary
              onClick={openCreateModal}
              style={{ fontSize: 12, flex: isMobile ? 1 : undefined }}
            >
              + Add Type
            </BtnPrimary>
            <BtnSecondary
              onClick={openEditModal}
              disabled={!selected}
              style={{ fontSize: 12, flex: isMobile ? 1 : undefined }}
            >
              Edit
            </BtnSecondary>
            <BtnDanger
              onClick={handleDelete}
              disabled={!selected}
              style={{ fontSize: 12, flex: isMobile ? 1 : undefined }}
            >
              Delete
            </BtnDanger>
          </div>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 16,
            flex: 1,
            flexDirection: isMobile ? "column" : "row",
            minHeight: 0,
          }}
        >
          {/* Commodity type list - DataTable on desktop, card list on mobile */}
          {isMobile ? (
            <MobileTypeList
              filtered={filtered}
              selectedTypeId={selectedTypeId}
              onSelectType={setSelectedTypeId}
              search={search}
            />
          ) : (
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
          )}

          {/* ── INFO PANEL ──────────────────────────────────────────────── */}
          <div
            style={{
              width: isMobile ? "100%" : 360,
              minWidth: isMobile ? 0 : undefined,
              flex: isMobile ? "0 0 auto" : "0 0 360px",
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: isMobile ? 14 : 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: isMobile ? "none" : 600,
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

      {/* Go to top (mobile only) */}
      {isMobile && showGoToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 50,
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "none",
            background: "linear-gradient(135deg, #2563eb, #3b82f6)",
            color: "#fff",
            fontSize: 20,
            cursor: "pointer",
            boxShadow: "0 4px 12px rgba(37,99,235,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          aria-label="Go to top"
        >
          ↑
        </button>
      )}

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

function MobileTypeList({
  filtered,
  selectedTypeId,
  onSelectType,
  search,
}) {
  const emptyMessage = search
    ? "No commodity types match your search."
    : "No commodity types found. Add your first commodity type!";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#475569",
          padding: "4px 0",
        }}
      >
        Commodity Types ({filtered.length})
      </div>
      {filtered.length === 0 ? (
          <div
            style={{
              color: "#94a3b8",
              fontSize: 13,
              textAlign: "center",
              padding: 32,
            }}
          >
            {emptyMessage}
          </div>
        ) : (
          filtered.map((t) => {
            const isSelected = t.id === selectedTypeId;
            return (
              <div
                key={t.id}
                onClick={() => onSelectType(t.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectType(t.id);
                  }
                }}
                style={{
                  background: isSelected ? "#eff6ff" : "#fff",
                  border: `2px solid ${isSelected ? "#3b82f6" : "#e2e8f0"}`,
                  borderRadius: 10,
                  padding: 12,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#1e293b",
                    }}
                  >
                    {t.name}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: t.testRequired === "yes" ? "#16a34a" : "#64748b",
                      fontWeight: 600,
                    }}
                  >
                    {t.testRequired === "yes" ? "Test required" : "No test"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "#2563eb",
                  }}
                >
                  {t.acosCode}
                </div>
              </div>
            );
          })
        )}
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
