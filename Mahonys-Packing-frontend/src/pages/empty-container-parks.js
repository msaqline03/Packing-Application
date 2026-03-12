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

function MobileParkList({
  filtered,
  selectedParkId,
  onSelectPark,
  search,
  formatPrice,
}) {
  const emptyMessage = search
    ? "No container parks match your search."
    : "No container parks found. Add your first one!";
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
        Container Parks ({filtered.length})
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
          filtered.map((p) => {
            const isSelected = p.id === selectedParkId;
            const contactCount = (p.contacts && p.contacts.length) || 0;
            return (
              <div
                key={p.id}
                onClick={() => onSelectPark(p.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectPark(p.id);
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
                    {p.code || "—"}
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
                  {p.name || "—"}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginBottom: 4,
                  }}
                >
                  {p.containerChainName || "—"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  {contactCount} contact{contactCount !== 1 ? "s" : ""}
                  {" · "}
                  Rev: {formatPrice(p.revenuePrice)} / Exp: {formatPrice(p.expensePrice)}
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

const emptyContact = () => ({ name: "", email: "", phone: "" });

export default function EmptyContainerParksPage() {
  const {
    containerParks,
    currentSite,
    setCurrentSite,
    addContainerPark,
    updateContainerPark,
    deleteContainerPark,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedParkId, setSelectedParkId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    containerChainName: "",
    contacts: [emptyContact()],
    notes: "",
    revenuePrice: "",
    expensePrice: "",
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
    return containerParks.filter((p) => {
      if (!search) return true;
      const text = `${p.code || ""} ${p.name || ""} ${p.containerChainName || ""} ${(p.contacts || []).map((c) => c.name || c.email || c.phone).join(" ")} ${p.notes || ""}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [containerParks, search]);

  const selected = containerParks.find((p) => p.id === selectedParkId) || null;

  const formatPrice = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    const n = Number(v);
    return isNaN(n) ? "—" : n.toFixed(2);
  };

  const parkColumns = useMemo(
    () => [
      { id: "code", label: "Code", width: "90px", getValue: (p) => p.code ?? "", cellStyle: { fontWeight: 700, color: "#2563eb" } },
      { id: "name", label: "Name", minWidth: 120, getValue: (p) => p.name ?? "", cellStyle: { fontWeight: 600 } },
      { id: "containerChainName", label: "Chain", width: "120px", getValue: (p) => p.containerChainName ?? "", cellStyle: { color: "#64748b", fontSize: 11.5 } },
      {
        id: "contacts",
        label: "Contacts",
        width: "100px",
        getValue: (p) => (p.contacts && p.contacts.length) || 0,
        render: (_, p) => {
          const n = (p.contacts && p.contacts.length) || 0;
          return <span style={{ color: "#64748b", fontSize: 11.5 }}>{n} contact{n !== 1 ? "s" : ""}</span>;
        },
      },
      { id: "revenuePrice", label: "Revenue", width: "90px", getValue: (p) => formatPrice(p.revenuePrice), render: (_, p) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatPrice(p.revenuePrice)}</span> },
      { id: "expensePrice", label: "Expense", width: "90px", getValue: (p) => formatPrice(p.expensePrice), render: (_, p) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{formatPrice(p.expensePrice)}</span> },
    ],
    []
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      code: "",
      name: "",
      containerChainName: "",
      contacts: [emptyContact()],
      notes: "",
      revenuePrice: "",
      expensePrice: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    const contacts = (selected.contacts && selected.contacts.length > 0)
      ? selected.contacts.map((c) => ({ name: c.name || "", email: c.email || "", phone: c.phone || "" }))
      : [emptyContact()];
    setFormData({
      code: selected.code || "",
      name: selected.name || "",
      containerChainName: selected.containerChainName || "",
      contacts,
      notes: selected.notes || "",
      revenuePrice: selected.revenuePrice !== undefined && selected.revenuePrice !== null ? String(selected.revenuePrice) : "",
      expensePrice: selected.expensePrice !== undefined && selected.expensePrice !== null ? String(selected.expensePrice) : "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      alert("Container Park Code and Name are required");
      return;
    }

    const contacts = (formData.contacts || [])
      .map((c) => ({
        name: (c.name || "").trim(),
        email: (c.email || "").trim(),
        phone: (c.phone || "").trim(),
      }))
      .filter((c) => c.name || c.email || c.phone);

    const parkData = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      containerChainName: (formData.containerChainName || "").trim(),
      contacts,
      notes: (formData.notes || "").trim(),
      revenuePrice: formData.revenuePrice === "" ? null : Number(formData.revenuePrice),
      expensePrice: formData.expensePrice === "" ? null : Number(formData.expensePrice),
    };

    if (editMode) {
      updateContainerPark(selected.id, parkData);
    } else {
      addContainerPark(parkData);
    }

    setModalOpen(false);
    setFormData({
      code: "",
      name: "",
      containerChainName: "",
      contacts: [emptyContact()],
      notes: "",
      revenuePrice: "",
      expensePrice: "",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        `Delete container park "${selected.name}" permanently?`
      )
    ) {
      deleteContainerPark(selected.id);
      setSelectedParkId(null);
    }
  };

  const setContact = (index, field, value) => {
    setFormData((prev) => {
      const next = [...(prev.contacts || [emptyContact()])];
      if (!next[index]) next[index] = emptyContact();
      next[index] = { ...next[index], [field]: value };
      return { ...prev, contacts: next };
    });
  };

  const addContact = () => {
    setFormData((prev) => ({
      ...prev,
      contacts: [...(prev.contacts || []), emptyContact()],
    }));
  };

  const removeContact = (index) => {
    setFormData((prev) => {
      const next = (prev.contacts || []).filter((_, i) => i !== index);
      if (next.length === 0) next.push(emptyContact());
      return { ...prev, contacts: next };
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
              Empty Container Parks
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
            Empty Container Parks
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
              Manage empty container park contacts, locations, and pricing.
              {containerParks.length > 0 && (
                <span style={{ marginLeft: 8, fontWeight: 600, color: "#0f1e3d" }}>
                  ({containerParks.length} loaded)
                </span>
              )}
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
              placeholder="Search container parks…"
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
              + Add Park
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
            minHeight: 0,
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* List - DataTable on desktop, card list on mobile */}
          {isMobile ? (
            <MobileParkList
              filtered={filtered}
              selectedParkId={selectedParkId}
              onSelectPark={setSelectedParkId}
              search={search}
              formatPrice={formatPrice}
            />
          ) : (
            <div
              style={{
                flex: "1 1 0",
                minHeight: 400,
                minWidth: 0,
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <DataTable
                key={`parks-${containerParks.length}-${(filtered[0]?.id ?? "")}`}
                columns={parkColumns}
                data={Array.isArray(filtered) ? filtered : []}
                getRowKey={(p) => (p?.id != null ? String(p.id) : "")}
                onRowClick={(p) => setSelectedParkId(p.id)}
                selectedRowKey={selectedParkId}
                maxHeight={420}
                fillHeight
                emptyMessage={
                  search
                    ? "No container parks match your search."
                    : "No container parks found. Add your first one!"
                }
              />
            </div>
          )}

          {/* Detail panel (desktop only; hidden on mobile) */}
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1e3d" }}>
              Container Park Details
            </span>
            {selected ? (
              <>
                <InfoRow label="Container Park Code" value={selected.code} highlight />
                <InfoRow label="Container Park Name" value={selected.name} highlight />
                <InfoRow label="ContainerChain Name" value={selected.containerChainName} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                    Container Park Contact(s)
                  </span>
                  {(selected.contacts && selected.contacts.length > 0) ? (
                    selected.contacts.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          padding: 8,
                          background: "#f8fafc",
                          borderRadius: 6,
                          border: "1px solid #e2e8f0",
                          fontSize: 12,
                          color: "#1e293b",
                        }}
                      >
                        <div><strong>{c.name || "—"}</strong></div>
                        {c.email ? <div>{c.email}</div> : null}
                        {c.phone ? <div>{c.phone}</div> : null}
                      </div>
                    ))
                  ) : (
                    <span style={{ fontSize: 12, color: "#94a3b8" }}>—</span>
                  )}
                </div>
                <InfoRow label="Notes" value={selected.notes} />
                <InfoRow label="Revenue Price" value={formatPrice(selected.revenuePrice)} />
                <InfoRow label="Expense Price" value={formatPrice(selected.expensePrice)} />

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
                    Edit Container Park
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Container Park
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
                Select a container park to view details
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
        title={editMode ? "Edit Container Park" : "Add Container Park"}
        width={560}
      >
        <FormRow label="Container Park Code" required>
          <Input
            value={formData.code}
            onChange={(e) =>
              setFormData({ ...formData, code: e.target.value })
            }
            placeholder="e.g., ECP-01"
          />
        </FormRow>

        <FormRow label="Container Park Name" required>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., North Depot Empty Park"
          />
        </FormRow>

        <FormRow label="ContainerChain Name">
          <Input
            value={formData.containerChainName}
            onChange={(e) =>
              setFormData({ ...formData, containerChainName: e.target.value })
            }
            placeholder="e.g., Main Chain"
          />
        </FormRow>

        <div style={{ marginTop: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>
              Container Park Contact(s)
            </span>
            <button
              type="button"
              onClick={addContact}
              style={{
                fontSize: 11,
                padding: "4px 8px",
                background: "#eff6ff",
                color: "#2563eb",
                border: "1px solid #bfdbfe",
                borderRadius: 6,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              + Add contact
            </button>
          </div>
          {(formData.contacts || []).map((c, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 10,
                marginBottom: 8,
                background: "#f8fafc",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>
                  Contact {i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeContact(i)}
                  style={{
                    fontSize: 11,
                    padding: "2px 6px",
                    background: "#fef2f2",
                    color: "#dc2626",
                    border: "1px solid #fecaca",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                >
                  Remove
                </button>
              </div>
              <Input
                value={c.name}
                onChange={(e) => setContact(i, "name", e.target.value)}
                placeholder="Contact Name"
              />
              <Input
                type="email"
                value={c.email}
                onChange={(e) => setContact(i, "email", e.target.value)}
                placeholder="Contact Email"
              />
              <Input
                type="tel"
                value={c.phone}
                onChange={(e) => setContact(i, "phone", e.target.value)}
                placeholder="Contact Phone"
              />
            </div>
          ))}
        </div>

        <FormRow label="Notes">
          <Input
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            placeholder="Optional notes"
          />
        </FormRow>

        <FormRow label="Revenue Price">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.revenuePrice}
            onChange={(e) =>
              setFormData({ ...formData, revenuePrice: e.target.value })
            }
            placeholder="0.00"
          />
        </FormRow>

        <FormRow label="Expense Price">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.expensePrice}
            onChange={(e) =>
              setFormData({ ...formData, expensePrice: e.target.value })
            }
            placeholder="0.00"
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
