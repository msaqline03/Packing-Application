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

export default function UsersPage() {
  const {
    users,
    currentSite,
    setCurrentSite,
    addUser,
    updateUser,
    deleteUser,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "",
    active: true,
  });

  const filtered = useMemo(() => {
    return users.filter((u) => {
      if (!search) return true;
      const text = `${u.name} ${u.email} ${u.role}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [users, search]);

  const selected = users.find((u) => u.id === selectedUserId) || null;

  const userColumns = useMemo(
    () => [
      { id: "name", label: "Name", minWidth: 120, getValue: (u) => u.name, cellStyle: { fontWeight: 600 } },
      { id: "email", label: "Email", width: "200px", getValue: (u) => u.email, cellStyle: { color: "#64748b", fontSize: 11.5 } },
      { id: "role", label: "Role", width: "150px", getValue: (u) => u.role ?? "", render: (v) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{v || "—"}</span> },
      {
        id: "status",
        label: "Status",
        width: "100px",
        getValue: (u) => (u.active ? "Active" : "Inactive"),
        render: (_, u) => (
          <span
            style={{
              display: "inline-block",
              background: u.active ? "#d1fae5" : "#fee2e2",
              color: u.active ? "#065f46" : "#991b1b",
              fontSize: 11,
              fontWeight: 600,
              padding: "2px 8px",
              borderRadius: 12,
              textTransform: "capitalize",
              letterSpacing: 0.3,
            }}
          >
            {u.active ? "Active" : "Inactive"}
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
      email: "",
      role: "",
      active: true,
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      name: selected.name || "",
      email: selected.email || "",
      role: selected.role || "",
      active: selected.active !== false,
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      alert("Name and Email are required");
      return;
    }

    const userData = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role.trim(),
      active: formData.active,
    };

    if (editMode) {
      updateUser(selected.id, userData);
    } else {
      addUser(userData);
    }

    setModalOpen(false);
    setFormData({
      name: "",
      email: "",
      role: "",
      active: true,
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete user "${selected.name}" permanently?`)
    ) {
      deleteUser(selected.id);
      setSelectedUserId(null);
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
              placeholder="Search users…"
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
              + Add User
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
          {/* User list */}
          <DataTable
            columns={userColumns}
            data={filtered}
            getRowKey={(u) => u.id}
            onRowClick={(u) => setSelectedUserId(u.id)}
            selectedRowKey={selectedUserId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No users match your search."
                : "No users found. Add your first user!"
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
                User Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Name" value={selected.name} highlight />
                <InfoRow label="Email" value={selected.email} />
                <InfoRow label="Role" value={selected.role || "—"} />
                <InfoRow
                  label="Status"
                  value={selected.active ? "Active" : "Inactive"}
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
                    Edit User
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete User
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
                Select a user to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit User" : "Add New User"}
        width={500}
      >
        <FormRow label="Name" required>
          <Input
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            placeholder="e.g., J. Mitchell"
          />
        </FormRow>

        <FormRow label="Email" required>
          <Input
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="e.g., j.mitchell@mahonys.com.au"
            type="email"
          />
        </FormRow>

        <FormRow label="Role">
          <Input
            value={formData.role}
            onChange={(e) =>
              setFormData({ ...formData, role: e.target.value })
            }
            placeholder="e.g., Manager, Supervisor, Operator"
          />
        </FormRow>

        <FormRow label="Status">
          <Select
            value={formData.active ? "active" : "inactive"}
            onChange={(e) =>
              setFormData({ ...formData, active: e.target.value === "active" })
            }
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </Select>
        </FormRow>

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
            {editMode ? "Update User" : "Add User"}
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
