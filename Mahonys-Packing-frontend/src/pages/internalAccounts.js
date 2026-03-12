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

export default function InternalAccountsPage() {
  const {
    internalAccounts,
    currentSite,
    setCurrentSite,
    addInternalAccount,
    updateInternalAccount,
    deleteInternalAccount,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shrinkApplied: "no",
    shrinkReceivalAccount: "no",
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
    return internalAccounts.filter((a) => {
      if (!search) return true;
      const text = `${a.name} ${a.description}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [internalAccounts, search]);

  const selected = internalAccounts.find((a) => a.id === selectedAccountId) || null;

  const accountColumns = useMemo(
    () => [
      {
        id: "name",
        label: "Account Name",
        minWidth: 120,
        getValue: (a) => a.name,
        render: (_, a) => (
          <>
            {a.shrinkReceivalAccount && <span style={{ color: "#f59e0b", marginRight: 4 }}>★ </span>}
            <span style={{ fontWeight: 700, color: "#2563eb", fontSize: 12 }}>{a.name}</span>
          </>
        ),
      },
      { id: "description", label: "Description", width: "250px", getValue: (a) => a.description ?? "", render: (v) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{v || "—"}</span> },
      { id: "shrinkApplied", label: "Shrink Applied", width: "150px", getValue: (a) => (a.shrinkApplied ? "Yes" : "No"), render: (v) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{v}</span> },
      {
        id: "shrinkReceival",
        label: "Shrink Receival",
        width: "150px",
        getValue: (a) => (a.shrinkReceivalAccount ? "Yes" : "No"),
        render: (_, a) => (
          <span style={{ color: a.shrinkReceivalAccount ? "#f59e0b" : "#64748b", fontWeight: a.shrinkReceivalAccount ? 600 : 400, fontSize: 11.5 }}>
            {a.shrinkReceivalAccount ? "Yes" : "No"}
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
      description: "",
      shrinkApplied: "no",
      shrinkReceivalAccount: "no",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      name: selected.name || "",
      description: selected.description || "",
      shrinkApplied: selected.shrinkApplied ? "yes" : "no",
      shrinkReceivalAccount: selected.shrinkReceivalAccount ? "yes" : "no",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Account Name is required");
      return;
    }

    // Check if trying to set shrinkReceivalAccount to true
    const shrinkReceival = formData.shrinkReceivalAccount === "yes";
    if (shrinkReceival) {
      const existingReceival = internalAccounts.find(
        (a) => a.shrinkReceivalAccount && (!editMode || a.id !== selected?.id)
      );
      if (existingReceival) {
        const confirm = window.confirm(
          `"${existingReceival.name}" is currently set as the shrink receival account. Setting this account as the shrink receival account will remove that designation from "${existingReceival.name}". Continue?`
        );
        if (!confirm) return;
      }
    }

    const accountData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      shrinkApplied: formData.shrinkApplied === "yes",
      shrinkReceivalAccount: shrinkReceival,
    };

    if (editMode) {
      updateInternalAccount(selected.id, accountData);
    } else {
      addInternalAccount(accountData);
    }

    setModalOpen(false);
    setFormData({
      name: "",
      description: "",
      shrinkApplied: "no",
      shrinkReceivalAccount: "no",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete internal account "${selected.name}" permanently?`)
    ) {
      deleteInternalAccount(selected.id);
      setSelectedAccountId(null);
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
            <span style={{ color: "#0f1e3d", fontWeight: 600 }}>Internal Accounts</span>
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
            Internal Accounts
          </h1>
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
              placeholder="Search internal accounts…"
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
              + Add Account
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
          {/* Account list - DataTable on desktop, card list on mobile */}
          {isMobile ? (
            <MobileAccountList
              filtered={filtered}
              selectedAccountId={selectedAccountId}
              onSelectAccount={setSelectedAccountId}
              search={search}
            />
          ) : (
            <DataTable
              columns={accountColumns}
              data={filtered}
              getRowKey={(a) => a.id}
              onRowClick={(a) => setSelectedAccountId(a.id)}
              selectedRowKey={selectedAccountId}
              maxHeight={420}
              getRowStyle={(a) => (a.shrinkReceivalAccount ? { background: "#fef3c7" } : {})}
              emptyMessage={
                search
                  ? "No internal accounts match your search."
                  : "No internal accounts found. Add your first internal account!"
              }
            />
          )}

          {/* ── INFO PANEL (desktop only; hidden on mobile) ───────────────── */}
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
                Internal Account Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow
                  label="Account Name"
                  value={selected.name}
                  highlight
                />
                <InfoRow
                  label="Description"
                  value={selected.description || "No description"}
                />
                <InfoRow
                  label="Shrink Applied"
                  value={selected.shrinkApplied ? "Yes" : "No"}
                />
                <InfoRow
                  label="Shrink Receival Account"
                  value={selected.shrinkReceivalAccount ? "Yes" : "No"}
                  highlight={selected.shrinkReceivalAccount}
                />

                {selected.shrinkReceivalAccount && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#fef3c7",
                      borderRadius: 6,
                      fontSize: 11.5,
                      color: "#92400e",
                      fontWeight: 500,
                      border: "1px solid #fcd34d",
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 4 }}>★</span>
                    This is the designated shrink receival account. Only one
                    account can have this designation.
                  </div>
                )}

                {selected.shrinkApplied && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#dbeafe",
                      borderRadius: 6,
                      fontSize: 11.5,
                      color: "#1e40af",
                      fontWeight: 500,
                      border: "1px solid #93c5fd",
                    }}
                  >
                    Shrink will be applied on tickets received for this account.
                  </div>
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
                    Edit Account
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Account
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
                Select an internal account to view details
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
        title={editMode ? "Edit Internal Account" : "Add New Internal Account"}
        width={600}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <FormRow label="Account Name" required>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Quality Control"
            />
          </FormRow>

          <FormRow label="Account Description">
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter a description for this internal account"
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

          <FormRow label="Shrink Applied?">
            <Select
              value={formData.shrinkApplied}
              onChange={(e) =>
                setFormData({ ...formData, shrinkApplied: e.target.value })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
            <div
              style={{
                marginTop: 6,
                fontSize: 11.5,
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              Specifies whether shrink is applied on tickets being received for
              this account.
            </div>
          </FormRow>

          <FormRow label="Shrink Receival Account?">
            <Select
              value={formData.shrinkReceivalAccount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  shrinkReceivalAccount: e.target.value,
                })
              }
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
            <div
              style={{
                marginTop: 6,
                fontSize: 11.5,
                color: "#64748b",
                fontStyle: "italic",
              }}
            >
              Only one internal account can be set as the shrink receival
              account. Setting this will remove the designation from any other
              account.
            </div>
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
            {editMode ? "Update Account" : "Add Account"}
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

function MobileAccountList({
  filtered,
  selectedAccountId,
  onSelectAccount,
  search,
}) {
  const emptyMessage = search
    ? "No internal accounts match your search."
    : "No internal accounts found. Add your first internal account!";
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
        Internal Accounts ({filtered.length})
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
          filtered.map((a) => {
            const isSelected = a.id === selectedAccountId;
            return (
              <div
                key={a.id}
                onClick={() => onSelectAccount(a.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectAccount(a.id);
                  }
                }}
                style={{
                  background: isSelected ? "#eff6ff" : a.shrinkReceivalAccount ? "#fefce8" : "#fff",
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
                      fontWeight: 700,
                      color: "#2563eb",
                    }}
                  >
                    {a.shrinkReceivalAccount && (
                      <span style={{ color: "#f59e0b", marginRight: 4 }}>★ </span>
                    )}
                    {a.name}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "#64748b",
                    marginBottom: 4,
                  }}
                >
                  {a.description || "—"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#94a3b8",
                  }}
                >
                  Shrink applied: {a.shrinkApplied ? "Yes" : "No"}
                  {a.shrinkReceivalAccount && " · Shrink receival account"}
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
          color: highlight ? "#f59e0b" : "#64748b",
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
          color: highlight ? "#92400e" : "#1e293b",
          fontWeight: highlight ? 700 : 500,
          wordBreak: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}
