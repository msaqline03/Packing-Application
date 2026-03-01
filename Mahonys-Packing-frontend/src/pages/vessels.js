"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
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

function formatDateOnly(val) {
  if (val == null || typeof val !== "string" || !val.trim()) return "—";
  const d = new Date(val.trim().replace(" ", "T"));
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateTime(val) {
  if (val == null || typeof val !== "string" || !val.trim()) return "—";
  const d = new Date(val.trim().replace(" ", "T"));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

export default function VesselsPage() {
  const router = useRouter();
  const {
    vesselDepartures,
    shippingLines,
    packs,
    currentSite,
    setCurrentSite,
    addVesselDeparture,
    updateVesselDeparture,
    deleteVesselDeparture,
  } = useApp();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    vessel: "",
    voyageNumber: "",
    vesselLloyds: "",
    vesselCutoffDate: "",
    vesselReceivalsOpenDate: "",
    vesselEta: "",
    vesselEtd: "",
    vesselFreeDays: "",
    shippingLineId: "",
  });

  const filtered = useMemo(() => {
    return (vesselDepartures || [])
      .filter((v) => {
        if (!search) return true;
        const sl = shippingLines?.find((l) => l.id === v.shippingLineId);
        const text = `${v.vessel || ""} ${v.voyageNumber || ""} ${v.vesselLloyds || ""} ${v.vesselCutoffDate || ""} ${v.vesselEta || ""} ${v.vesselEtd || ""} ${sl?.name || ""}`.toLowerCase();
        return text.includes(search.toLowerCase());
      })
      .sort((a, b) => {
        const dateA = a.vesselCutoffDate || "9999-99-99";
        const dateB = b.vesselCutoffDate || "9999-99-99";
        return dateA.localeCompare(dateB) || (a.vessel || "").localeCompare(b.vessel || "");
      });
  }, [vesselDepartures, shippingLines, search]);

  const selected = (vesselDepartures || []).find((v) => v.id === selectedId) || null;

  const vesselColumns = useMemo(
    () => [
      { id: "vessel", label: "Vessel", width: "140px", getValue: (v) => v.vessel ?? "", cellStyle: { fontWeight: 600, color: "#2563eb" } },
      { id: "voyageNumber", label: "Voyage", width: "100px", getValue: (v) => v.voyageNumber ?? "", cellStyle: { fontSize: 11.5, color: "#64748b" } },
      {
        id: "vesselCutoffDate",
        label: "Cut-off",
        width: "150px",
        getValue: (v) => v.vesselCutoffDate ?? "",
        render: (_, v) => <span style={{ fontSize: 11.5 }}>{formatDateTime(v.vesselCutoffDate)}</span>,
      },
      {
        id: "vesselReceivalsOpenDate",
        label: "Receivals",
        width: "150px",
        getValue: (v) => v.vesselReceivalsOpenDate ?? "",
        render: (_, v) => <span style={{ fontSize: 11.5, color: "#64748b" }}>{formatDateTime(v.vesselReceivalsOpenDate)}</span>,
      },
      {
        id: "vesselEta",
        label: "ETA",
        width: "150px",
        getValue: (v) => v.vesselEta ?? "",
        render: (_, v) => <span style={{ fontSize: 11.5, color: "#64748b" }}>{formatDateTime(v.vesselEta)}</span>,
      },
      {
        id: "vesselEtd",
        label: "ETD",
        width: "150px",
        getValue: (v) => v.vesselEtd ?? "",
        render: (_, v) => <span style={{ fontSize: 11.5, color: "#64748b" }}>{formatDateTime(v.vesselEtd)}</span>,
      },
      {
        id: "vesselFreeDays",
        label: "Free Days",
        width: "100px",
        getValue: (v) => (v.vesselFreeDays != null && v.vesselFreeDays !== "" ? v.vesselFreeDays : ""),
        render: (_, v) => <span style={{ fontSize: 11.5 }}>{v.vesselFreeDays != null && v.vesselFreeDays !== "" ? v.vesselFreeDays : "—"}</span>,
      },
    ],
    []
  );

  const packsUsingSelected = useMemo(
    () => (packs || []).filter((p) => p.vesselDepartureId === selected?.id),
    [packs, selected?.id],
  );

  const openCreateModal = () => {
    setEditMode(false);
    setFormData({
      vessel: "",
      voyageNumber: "",
      vesselLloyds: "",
      vesselCutoffDate: "",
      vesselReceivalsOpenDate: "",
      vesselEta: "",
      vesselEtd: "",
      vesselFreeDays: "",
      shippingLineId: "",
    });
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (!selected) return;
    setEditMode(true);
    setFormData({
      vessel: selected.vessel || "",
      voyageNumber: selected.voyageNumber || "",
      vesselLloyds: selected.vesselLloyds || "",
      vesselCutoffDate: selected.vesselCutoffDate || "",
      vesselReceivalsOpenDate: selected.vesselReceivalsOpenDate || "",
      vesselEta: selected.vesselEta || "",
      vesselEtd: selected.vesselEtd || "",
      vesselFreeDays: selected.vesselFreeDays === null || selected.vesselFreeDays === "" ? "" : String(selected.vesselFreeDays),
      shippingLineId: selected.shippingLineId ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.vessel.trim()) {
      alert("Vessel name is required");
      return;
    }

    const depData = {
      vessel: formData.vessel.trim(),
      voyageNumber: formData.voyageNumber.trim(),
      vesselLloyds: formData.vesselLloyds.trim(),
      vesselCutoffDate: formData.vesselCutoffDate.trim(),
      vesselReceivalsOpenDate: formData.vesselReceivalsOpenDate.trim(),
      vesselEta: formData.vesselEta.trim(),
      vesselEtd: formData.vesselEtd.trim(),
      vesselFreeDays: formData.vesselFreeDays === "" ? null : Number(formData.vesselFreeDays),
      shippingLineId: formData.shippingLineId ? Number(formData.shippingLineId) : null,
    };

    if (editMode) {
      updateVesselDeparture(selected.id, depData);
    } else {
      addVesselDeparture(depData);
    }

    setModalOpen(false);
  };

  const handleDelete = () => {
    if (
      selected &&
      window.confirm(
        packsUsingSelected.length > 0
          ? `This vessel departure is used by ${packsUsingSelected.length} pack(s). Deleting will remove the vessel assignment from those packs. Continue?`
          : `Delete vessel departure "${selected.vessel} ${selected.voyageNumber ? `(${selected.voyageNumber})` : ""}"?`,
      )
    ) {
      deleteVesselDeparture(selected.id);
      setSelectedId(null);
    }
  };

  const getShippingLineName = (id) =>
    shippingLines?.find((l) => l.id === id)?.name ?? "—";

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
        <h1
          style={{
            margin: "0 0 4px",
            fontSize: 22,
            fontWeight: 700,
            color: "#0f1e3d",
          }}
        >
          Vessel Departures
        </h1>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage vessel schedule data. Multiple packs can share the same vessel departure.
        </p>

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
              placeholder="Search vessel, voyage, cutoff…"
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

          <div style={{ display: "flex", gap: 6 }}>
            <BtnPrimary onClick={openCreateModal} style={{ fontSize: 12 }}>
              + Add Vessel Departure
            </BtnPrimary>
            <BtnSecondary
              onClick={openEditModal}
              disabled={!selected}
              style={{ fontSize: 12 }}
            >
              Edit
            </BtnSecondary>
            <BtnSecondary
              onClick={() => router.push("/vessel-scheduler")}
              style={{ fontSize: 12 }}
            >
              Schedule
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
          {/* List */}
          <DataTable
            columns={vesselColumns}
            data={filtered}
            getRowKey={(v) => v.id}
            onRowClick={(v) => setSelectedId(v.id)}
            selectedRowKey={selectedId}
            maxHeight={420}
            emptyMessage={
              search
                ? "No vessel departures match your search."
                : "No vessel departures yet. Add one or import from CSV on the Schedule page."
            }
          />

          {/* Info panel */}
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
                Vessel Departure Details
              </span>
            </div>
            {selected ? (
              <>
                <InfoRow label="Vessel" value={selected.vessel} highlight />
                <InfoRow label="Voyage Number" value={selected.voyageNumber} />
                <InfoRow label="Lloyds ID" value={selected.vesselLloyds} />
                <InfoRow label="Cut-off Date" value={formatDateTime(selected.vesselCutoffDate)} />
                <InfoRow label="Receivals Open" value={formatDateTime(selected.vesselReceivalsOpenDate)} />
                <InfoRow label="ETA" value={formatDateTime(selected.vesselEta)} />
                <InfoRow label="ETD" value={formatDateTime(selected.vesselEtd)} />
                <InfoRow label="Free Days" value={selected.vesselFreeDays != null && selected.vesselFreeDays !== "" ? String(selected.vesselFreeDays) : "—"} />
                <InfoRow label="Shipping Line" value={getShippingLineName(selected.shippingLineId)} />
                {packsUsingSelected.length > 0 && (
                  <div
                    style={{
                      padding: 10,
                      background: "#f0f9ff",
                      borderRadius: 8,
                      fontSize: 11,
                      color: "#0369a1",
                    }}
                  >
                    Used by {packsUsingSelected.length} pack(s)
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
                    Edit Vessel Departure
                  </BtnSecondary>
                  <BtnDanger
                    onClick={handleDelete}
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    Delete
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
                Select a vessel departure to view details
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODAL ──────────────────────────────────────────────────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editMode ? "Edit Vessel Departure" : "Add Vessel Departure"}
        width={520}
      >
        <FormRow label="Vessel Name" required>
          <Input
            value={formData.vessel}
            onChange={(e) =>
              setFormData({ ...formData, vessel: e.target.value })
            }
            placeholder="e.g., MSC Aurora"
          />
        </FormRow>

        <FormRow label="Voyage Number">
          <Input
            value={formData.voyageNumber}
            onChange={(e) =>
              setFormData({ ...formData, voyageNumber: e.target.value })
            }
            placeholder="e.g., VY-2026-04"
          />
        </FormRow>

        <FormRow label="Lloyds ID">
          <Input
            value={formData.vesselLloyds}
            onChange={(e) =>
              setFormData({ ...formData, vesselLloyds: e.target.value })
            }
            placeholder="Lloyds number"
          />
        </FormRow>

        <FormRow label="Cut-off Date & Time">
          <Input
            type="datetime-local"
            value={(formData.vesselCutoffDate || "").replace(" ", "T").slice(0, 16)}
            onChange={(e) =>
              setFormData({
                ...formData,
                vesselCutoffDate: e.target.value ? e.target.value.slice(0, 16).replace("T", " ") : "",
              })
            }
          />
        </FormRow>

        <FormRow label="Receivals Open Date & Time">
          <Input
            type="datetime-local"
            value={(formData.vesselReceivalsOpenDate || "").replace(" ", "T").slice(0, 16)}
            onChange={(e) =>
              setFormData({
                ...formData,
                vesselReceivalsOpenDate: e.target.value ? e.target.value.slice(0, 16).replace("T", " ") : "",
              })
            }
          />
        </FormRow>

        <FormRow label="ETA">
          <Input
            type="datetime-local"
            value={(formData.vesselEta || "").replace(" ", "T").slice(0, 16)}
            onChange={(e) =>
              setFormData({
                ...formData,
                vesselEta: e.target.value ? e.target.value.slice(0, 16).replace("T", " ") : "",
              })
            }
            placeholder="Arrival"
          />
        </FormRow>

        <FormRow label="ETD">
          <Input
            type="datetime-local"
            value={(formData.vesselEtd || "").replace(" ", "T").slice(0, 16)}
            onChange={(e) =>
              setFormData({
                ...formData,
                vesselEtd: e.target.value ? e.target.value.slice(0, 16).replace("T", " ") : "",
              })
            }
            placeholder="Departure"
          />
        </FormRow>

        <FormRow label="Free Days">
          <Input
            type="number"
            min={0}
            value={formData.vesselFreeDays}
            onChange={(e) =>
              setFormData({ ...formData, vesselFreeDays: e.target.value })
            }
            placeholder="Days"
          />
        </FormRow>

        <FormRow label="Shipping Line">
          <Select
            value={formData.shippingLineId}
            onChange={(e) =>
              setFormData({ ...formData, shippingLineId: e.target.value })
            }
          >
            <option value="">— Select —</option>
            {(shippingLines || []).map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} ({l.code})
              </option>
            ))}
          </Select>
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
