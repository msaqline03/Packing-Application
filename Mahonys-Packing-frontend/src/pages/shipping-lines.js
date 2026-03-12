"use client";
import React, { useState, useMemo, useEffect } from "react";
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

const MOBILE_BREAKPOINT = 900;

function MobileShippingLineList({
  filtered,
  selectedLineId,
  onSelectLine,
  search,
}) {
  const emptyMessage = search
    ? "No shipping lines match your search."
    : "No shipping lines found. Add your first one!";
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
        Shipping Lines ({filtered.length})
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
          filtered.map((l) => {
            const isSelected = l.id === selectedLineId;
            return (
              <div
                key={l.id}
                onClick={() => onSelectLine(l.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectLine(l.id);
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
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#2563eb",
                    }}
                  >
                    {l.code || "—"}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#1e293b",
                    marginBottom: 4,
                  }}
                >
                  {l.name || "—"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                  }}
                >
                  {l.email || l.phone || l.website || "—"}
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
          padding: isMobile ? "12px 14px" : "20px 24px",
          display: "flex",
          flexDirection: "column",
          gap: isMobile ? 12 : 16,
        }}
      >
        {/* ── BREADCRUMB & PAGE HEADER ────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <nav
            style={{
              fontSize: 12,
              color: "#64748b",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            aria-label="Breadcrumb"
          >
            <span>Contacts</span>
            <span style={{ color: "#cbd5e1" }}>/</span>
            <span style={{ color: "#0f1e3d", fontWeight: 600 }}>
              Shipping Lines
            </span>
          </nav>
          <h1
            style={{
              margin: 0,
              fontSize: isMobile ? 20 : 24,
              fontWeight: 700,
              color: "#0f1e3d",
              letterSpacing: "-0.02em",
            }}
          >
            Shipping Lines
          </h1>
          {!isMobile && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: "#64748b",
                lineHeight: 1.5,
              }}
            >
              Manage shipping line contacts and carriers.
            </p>
          )}
        </div>

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
              + Add Line
            </BtnPrimary>
            {isMobile && selected ? (
              <BtnPrimary
                onClick={openEditModal}
                style={{ fontSize: 12, flex: 1 }}
              >
                View / Edit
              </BtnPrimary>
            ) : (
              <BtnSecondary
                onClick={openEditModal}
                disabled={!selected}
                style={{ fontSize: 12, flex: isMobile ? 1 : undefined }}
              >
                Edit
              </BtnSecondary>
            )}
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
          {/* List - DataTable on desktop, card list on mobile */}
          {isMobile ? (
            <MobileShippingLineList
              filtered={filtered}
              selectedLineId={selectedLineId}
              onSelectLine={setSelectedLineId}
              search={search}
            />
          ) : (
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
          )}

          {/* Info panel (desktop only; hidden on mobile) */}
          {!isMobile && (
          <div
            style={{
              width: 360,
              minWidth: 0,
              flex: "0 0 360px",
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
          )}
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
