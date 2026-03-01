"use client";
import React, { useState, useMemo } from "react";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  BtnPrimary,
  BtnSecondary,
  DataTable,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function UserPermissionsPage() {
  const {
    users,
    permissions,
    userPermissions,
    currentSite,
    setCurrentSite,
    getUserPermissions,
    updateUserPermissions,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

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
      {
        id: "name",
        label: "Name",
        minWidth: 120,
        getValue: (u) => u.name,
        render: (_, u) => {
          const count = getUserPermissions(u.id).length;
          return (
            <div>
              <div style={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
              <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 2 }}>{count} permission{count !== 1 ? "s" : ""}</div>
            </div>
          );
        },
      },
      { id: "role", label: "Role", width: "120px", getValue: (u) => u.role ?? "", render: (v) => <span style={{ color: "#64748b", fontSize: 11.5 }}>{v || "—"}</span> },
    ],
    [getUserPermissions]
  );

  const handleUserSelect = (userId) => {
    setSelectedUserId(userId);
    const perms = getUserPermissions(userId);
    setSelectedPermissions(perms);
    setHasChanges(false);
  };

  const handlePermissionToggle = (permissionId) => {
    const newPerms = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter((p) => p !== permissionId)
      : [...selectedPermissions, permissionId];
    setSelectedPermissions(newPerms);
    setHasChanges(true);
  };

  const handleSave = () => {
    if (selectedUserId) {
      updateUserPermissions(selectedUserId, selectedPermissions);
      setHasChanges(false);
      alert("Permissions updated successfully!");
    }
  };

  const handleCancel = () => {
    if (selectedUserId) {
      const perms = getUserPermissions(selectedUserId);
      setSelectedPermissions(perms);
      setHasChanges(false);
    }
  };

  const permissionsList = Object.values(permissions);

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
        {/* ── HEADER ────────────────────────────────────────────────────── */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "16px 18px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: "#0f1e3d",
              marginBottom: 8,
            }}
          >
            User Permissions Management
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Select a user to view and manage their permissions
          </p>
        </div>

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* User list */}
          <div style={{ width: 400, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <div style={{ padding: "14px 14px 10px", background: "#fff", borderRadius: "10px 10px 0 0", border: "1px solid #e2e8f0", borderBottom: "none" }}>
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
            <DataTable
              columns={userColumns}
              data={filtered}
              getRowKey={(u) => u.id}
              onRowClick={(u) => handleUserSelect(u.id)}
              selectedRowKey={selectedUserId}
              maxHeight={420}
              emptyMessage={search ? "No users match your search." : "No users found."}
            />
          </div>

          {/* ── PERMISSIONS PANEL ───────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: 18,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {selected ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingBottom: 12,
                    borderBottom: "2px solid #e2e8f0",
                  }}
                >
                  <div>
                    <h3
                      style={{
                        margin: 0,
                        fontSize: 16,
                        fontWeight: 700,
                        color: "#0f1e3d",
                      }}
                    >
                      {selected.name}
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        color: "#64748b",
                        marginTop: 2,
                      }}
                    >
                      {selected.email} • {selected.role || "No role"}
                    </p>
                  </div>
                  {hasChanges && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#f59e0b",
                        fontWeight: 600,
                        background: "#fef3c7",
                        padding: "4px 10px",
                        borderRadius: 6,
                      }}
                    >
                      Unsaved Changes
                    </span>
                  )}
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: 500,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      marginBottom: 12,
                    }}
                  >
                    Permissions
                  </div>
                  {permissionsList.map((permission) => {
                    const isChecked = selectedPermissions.includes(
                      permission.id
                    );
                    return (
                      <div
                        key={permission.id}
                        onClick={() => handlePermissionToggle(permission.id)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "12px",
                          borderRadius: 8,
                          border: "1px solid #e2e8f0",
                          marginBottom: 10,
                          cursor: "pointer",
                          background: isChecked ? "#eff6ff" : "#fff",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = "#f8fafc";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isChecked) {
                            e.currentTarget.style.background = "#fff";
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{
                            marginTop: 2,
                            cursor: "pointer",
                            width: 16,
                            height: 16,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0f1e3d",
                              marginBottom: 3,
                            }}
                          >
                            {permission.label}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: "#64748b",
                              lineHeight: 1.5,
                            }}
                          >
                            {permission.description}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    paddingTop: 14,
                    borderTop: "1px solid #e2e8f0",
                  }}
                >
                  <BtnPrimary
                    onClick={handleSave}
                    disabled={!hasChanges}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Save Changes
                  </BtnPrimary>
                  <BtnSecondary
                    onClick={handleCancel}
                    disabled={!hasChanges}
                    style={{ flex: 1, justifyContent: "center" }}
                  >
                    Cancel
                  </BtnSecondary>
                </div>
              </>
            ) : (
              <div
                style={{
                  color: "#9ca3af",
                  fontSize: 13,
                  textAlign: "center",
                  paddingTop: 80,
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    marginBottom: 12,
                  }}
                >
                  👤
                </div>
                Select a user to manage their permissions
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
