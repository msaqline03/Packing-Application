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
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function StockLocationsPage() {
  const {
    stockLocations = [],
    tickets = [],
    cmos = [],
    commodities = [],
    commodityTypes = [],
    currentSite,
    setCurrentSite,
    addStockLocation,
    updateStockLocation,
    deleteStockLocation,
  } = useApp();

  const [search, setSearch] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showAllSites, setShowAllSites] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    site: currentSite,
    status: "active",
    locationType: "Bay",
    capacity: "",
  });

  // Ensure formData.site stays in sync with currentSite when not editing
  useEffect(() => {
    if (!editMode && !modalOpen) {
      setFormData((prev) => ({ ...prev, site: currentSite }));
    }
  }, [currentSite, editMode, modalOpen]);

  // Reset selection when switching sites and selected location is not in current site
  useEffect(() => {
    if (selectedLocationId == null) return;
    const list = showAllSites
      ? stockLocations
      : stockLocations.filter((l) => l.site === currentSite);
    const stillValid = list.some((l) => l.id === selectedLocationId);
    if (!stillValid) setSelectedLocationId(null);
  }, [currentSite, showAllSites, stockLocations, selectedLocationId]);

  const getSiteName = (siteId) => {
    const site = SITES.find((s) => s.id === siteId);
    return site ? site.name : "Unknown";
  };

  const siteFiltered = useMemo(() => {
    const list = Array.isArray(stockLocations) ? stockLocations : [];
    if (showAllSites) return list;
    return list.filter((l) => l.site === currentSite);
  }, [stockLocations, currentSite, showAllSites]);

  const filtered = useMemo(() => {
    return siteFiltered.filter((l) => {
      if (!search || !search.trim()) return true;
      const text = `${l.name || ""} ${l.locationType || ""} ${l.status || ""}`.toLowerCase();
      return text.includes(search.trim().toLowerCase());
    });
  }, [siteFiltered, search]);

  const selected = useMemo(
    () => filtered.find((l) => l.id === selectedLocationId) || null,
    [filtered, selectedLocationId]
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      name: "",
      site: currentSite,
      status: "active",
      locationType: "Bay",
      capacity: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      name: selected.name || "",
      site: selected.site ?? currentSite,
      status: selected.status || "active",
      locationType: selected.locationType || "Bay",
      capacity: selected.capacity ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Location Name is required");
      return;
    }

    const locationData = {
      name: formData.name.trim(),
      site: Number(formData.site),
      status: formData.status,
      locationType: formData.locationType,
      capacity: Number(formData.capacity) || 0,
    };

    if (editMode) {
      updateStockLocation(selected.id, locationData);
    } else {
      addStockLocation(locationData);
    }

    setModalOpen(false);
    setFormData({
      name: "",
      site: currentSite,
      status: "active",
      locationType: "Bay",
      capacity: "",
    });
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(`Delete stock location "${selected.name}" permanently?`)
    ) {
      deleteStockLocation(selected.id);
      setSelectedLocationId(null);
    }
  };

  const getLocationStock = (locationId) => {
    const stockItems = [];
    let totalWeight = 0;
    const ticketList = Array.isArray(tickets) ? tickets : [];
    const cmoList = Array.isArray(cmos) ? cmos : [];
    const commodityList = Array.isArray(commodities) ? commodities : [];
    const ctList = Array.isArray(commodityTypes) ? commodityTypes : [];

    ticketList
      .filter(
        (t) =>
          t.type === "in" &&
          t.status === "completed" &&
          t.unloadedLocation === locationId
      )
      .forEach((ticket) => {
        const cmo = cmoList.find((c) => c.id === ticket.cmoId);
        const commodity = cmo
          ? commodityList.find((c) => c.id === cmo.commodityId)
          : null;
        const commodityType = cmo
          ? ctList.find((ct) => ct.id === cmo.commodityTypeId)
          : null;
        const gross = Array.isArray(ticket.grossWeights)
          ? ticket.grossWeights.reduce((a, b) => a + b, 0)
          : 0;
        const tare = Array.isArray(ticket.tareWeights)
          ? ticket.tareWeights.reduce((a, b) => a + b, 0)
          : 0;
        const netWeight = gross - tare;

        if (netWeight > 0) {
          const existingItem = stockItems.find(
            (item) => item.commodity?.id === commodity?.id
          );
          if (existingItem) {
            existingItem.weight += netWeight;
          } else {
            stockItems.push({ commodity, commodityType, weight: netWeight });
          }
          totalWeight += netWeight;
        }
      });

    ticketList
      .filter(
        (t) =>
          t.type === "out" &&
          t.status === "completed" &&
          t.loadingLocation === locationId
      )
      .forEach((ticket) => {
        const cmo = cmoList.find((c) => c.id === ticket.cmoId);
        const commodity = cmo
          ? commodityList.find((c) => c.id === cmo.commodityId)
          : null;
        const gross = Array.isArray(ticket.grossWeights)
          ? ticket.grossWeights.reduce((a, b) => a + b, 0)
          : 0;
        const tare = Array.isArray(ticket.tareWeights)
          ? ticket.tareWeights.reduce((a, b) => a + b, 0)
          : 0;
        const netWeight = gross - tare;

        if (netWeight > 0) {
          const existingItem = stockItems.find(
            (item) => item.commodity?.id === commodity?.id
          );
          if (existingItem) {
            existingItem.weight -= netWeight;
            if (existingItem.weight <= 0) {
              stockItems.splice(stockItems.indexOf(existingItem), 1);
            }
          }
          totalWeight -= netWeight;
        }
      });

    return { stockItems, totalWeight: Math.max(0, totalWeight) };
  };

  const emptyMessage = useMemo(() => {
    if (search?.trim()) return "No stock locations match your search.";
    if (!showAllSites && siteFiltered.length === 0)
      return `No stock locations for this site. Switch site or show all.`;
    return "No stock locations found. Add your first location!";
  }, [search, showAllSites, siteFiltered.length]);

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
        {/* TOOLBAR */}
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
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: 12,
              flex: 1,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search stock locations…"
              style={{
                width: "100%",
                maxWidth: 280,
                padding: "7px 10px",
                border: "1px solid #e2e8f0",
                borderRadius: 6,
                fontSize: 13,
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={showAllSites}
                onChange={(e) => setShowAllSites(e.target.checked)}
              />
              Show all sites
            </label>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {filtered.length} location{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <BtnPrimary onClick={openCreateModal} style={{ fontSize: 12 }}>
              + Add Location
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

        {/* MAIN CONTENT */}
        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          <div
            style={{
              flex: "1 1 0",
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                overflow: "auto",
                minHeight: 420,
                maxHeight: 420,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase" }}>Location Name</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase" }}>Site</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase" }}>Type</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase" }}>Capacity (kg)</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((l) => (
                      <tr
                        key={l.id}
                        onClick={() => setSelectedLocationId(l.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedLocationId(l.id)}
                        style={{
                          cursor: "pointer",
                          background: selectedLocationId === l.id ? "#eff6ff" : "transparent",
                          borderBottom: "1px solid #f1f5f9",
                          transition: "background 0.1s",
                        }}
                      >
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#1e293b" }}>{l.name}</td>
                        <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 11.5 }}>{getSiteName(l.site)}</td>
                        <td style={{ padding: "11px 14px", fontWeight: 600, color: "#2563eb", fontSize: 11.5 }}>{l.locationType}</td>
                        <td style={{ padding: "11px 14px", color: l.status === "active" ? "#16a34a" : "#94a3b8", fontSize: 11.5, fontWeight: 600, textTransform: "capitalize" }}>{l.status}</td>
                        <td style={{ padding: "11px 14px", color: "#64748b", fontSize: 11.5 }}>{l.capacity ? l.capacity.toLocaleString() : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* INFO PANEL */}
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
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f1e3d" }}>
              Location Details
            </span>
            {selected ? (
              <>
                <InfoRow label="Location Name" value={selected.name} highlight />
                <InfoRow label="Site" value={getSiteName(selected.site)} />
                <InfoRow label="Location Type" value={selected.locationType} />
                <InfoRow
                  label="Status"
                  value={
                    selected.status
                      ? selected.status.charAt(0).toUpperCase() +
                        selected.status.slice(1)
                      : "—"
                  }
                />
                <InfoRow
                  label="Capacity (kg)"
                  value={
                    selected.capacity
                      ? selected.capacity.toLocaleString()
                      : "—"
                  }
                />

                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 0.4,
                      fontWeight: 600,
                      display: "block",
                      marginBottom: 8,
                    }}
                  >
                    Current Stock
                  </span>
                  {(() => {
                    const { stockItems, totalWeight } = getLocationStock(
                      selected.id
                    );
                    const utilizationPercent =
                      selected.capacity > 0
                        ? Math.round((totalWeight / selected.capacity) * 100)
                        : 0;

                    return (
                      <>
                        {selected.capacity > 0 && (
                          <div style={{ marginBottom: 10 }}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: 4,
                              }}
                            >
                              <span
                                style={{ fontSize: 10, color: "#94a3b8" }}
                              >
                                Utilization
                              </span>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color:
                                    utilizationPercent >= 90
                                      ? "#dc2626"
                                      : utilizationPercent >= 70
                                      ? "#f59e0b"
                                      : "#059669",
                                }}
                              >
                                {utilizationPercent}%
                              </span>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: 6,
                                background: "#f1f5f9",
                                borderRadius: 3,
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(
                                    utilizationPercent,
                                    100
                                  )}%`,
                                  height: "100%",
                                  background:
                                    utilizationPercent >= 90
                                      ? "#dc2626"
                                      : utilizationPercent >= 70
                                      ? "#f59e0b"
                                      : "#059669",
                                  transition: "width 0.3s",
                                }}
                              />
                            </div>
                          </div>
                        )}

                        <div
                          style={{
                            padding: "8px 10px",
                            background: "#f8fafc",
                            borderRadius: 6,
                            marginBottom: 8,
                          }}
                        >
                          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
                            Total
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 700,
                              color: "#2563eb",
                            }}
                          >
                            {totalWeight.toLocaleString()}{" "}
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 500,
                                color: "#64748b",
                              }}
                            >
                              kg
                            </span>
                          </div>
                        </div>

                        {stockItems.length === 0 ? (
                          <div
                            style={{
                              textAlign: "center",
                              padding: "12px 0",
                              color: "#9ca3af",
                              fontSize: 11,
                              fontStyle: "italic",
                            }}
                          >
                            No stock currently stored
                          </div>
                        ) : (
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 6,
                              maxHeight: 180,
                              overflowY: "auto",
                            }}
                          >
                            {stockItems.map((item, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: "8px 10px",
                                  background: "#f8fafc",
                                  borderRadius: 6,
                                  border: "1px solid #e2e8f0",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    color: "#1e293b",
                                  }}
                                >
                                  {item.commodity?.description || "Unknown"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 10,
                                    color: "#64748b",
                                    marginTop: 2,
                                  }}
                                >
                                  Type: {item.commodityType?.name || "Unknown"}
                                </div>
                                <div
                                  style={{
                                    fontSize: 12,
                                    fontWeight: 700,
                                    color: "#2563eb",
                                    marginTop: 3,
                                  }}
                                >
                                  {item.weight.toLocaleString()} kg
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div
                  style={{
                    marginTop: 14,
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
                    Edit Location
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete Location
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
                Select a stock location to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Stock Location" : "Add New Stock Location"}
        width={600}
      >
        <div style={{ maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <FormRow label="Location Name" required>
            <Input
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Bay A-1, Silo 1, Pile 2"
            />
          </FormRow>

          <FormRow label="Site" required>
            <Select
              value={formData.site}
              onChange={(e) =>
                setFormData({ ...formData, site: Number(e.target.value) })
              }
            >
              {SITES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FormRow>

          <FormRow label="Location Type" required>
            <Select
              value={formData.locationType}
              onChange={(e) =>
                setFormData({ ...formData, locationType: e.target.value })
              }
            >
              <option value="Silo">Silo</option>
              <option value="Pile">Pile</option>
              <option value="Bay">Bay</option>
            </Select>
          </FormRow>

          <FormRow label="Status" required>
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

          <FormRow label="Capacity (kg)">
            <Input
              value={formData.capacity}
              onChange={(e) =>
                setFormData({ ...formData, capacity: e.target.value })
              }
              type="number"
              placeholder="e.g., 50000"
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
            {editMode ? "Update Location" : "Add Location"}
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
        {value ?? "—"}
      </span>
    </div>
  );
}
