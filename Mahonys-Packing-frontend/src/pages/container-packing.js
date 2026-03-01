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
  PackStatusBadge,
} from "../components/SharedComponents";
import {
  SITES,
  CONTAINER_CODES,
  createBlankContainer,
  INSPECTION_RESULTS,
} from "../utils/mockData";

export default function ContainerPackingPage() {
  const {
    packs,
    customers,
    commodities,
    commodityTypes,
    containerParks,
    transporters,
    stockLocations,
    packers,
    currentSite,
    setCurrentSite,
    startPackJob,
    updatePackVerification,
    addContainerToPack,
    ensurePackContainerSlots,
    updateContainerInPack,
    deleteContainerFromPack,
  } = useApp();

  const [selectedPackId, setSelectedPackId] = useState(null);
  const [containerModalOpen, setContainerModalOpen] = useState(false);
  const [editingContainerId, setEditingContainerId] = useState(null);
  const [containerForm, setContainerForm] = useState(createBlankContainer());

  // Auto-add container slots when a pack is selected so packer can fill details
  useEffect(() => {
    if (selectedPackId && ensurePackContainerSlots) {
      ensurePackContainerSlots(selectedPackId);
    }
  }, [selectedPackId, ensurePackContainerSlots]);

  const containerPacks = useMemo(
    () =>
      packs.filter(
        (p) =>
          p.siteId === currentSite &&
          (p.packType === "container" || (p.containersRequired != null && p.containersRequired > 0)) &&
          ["Pending", "Inprogress"].includes(p.status)
      ),
    [packs, currentSite]
  );

  const selectedPack = selectedPackId
    ? packs.find((p) => p.id === selectedPackId)
    : null;
  const verification = selectedPack?.verification || {
    importDetailsChecked: false,
    sampleRequirementsChecked: false,
    rfpDetailsChecked: false,
    micorRequirementsChecked: false,
  };
  const releaseDetails = selectedPack?.releaseDetails || [];
  const containers = selectedPack?.containers || [];
  const allVerified =
    verification.importDetailsChecked &&
    verification.sampleRequirementsChecked &&
    verification.rfpDetailsChecked &&
    verification.micorRequirementsChecked;

  const openNewContainer = () => {
    setEditingContainerId(null);
    setContainerForm(createBlankContainer());
    setContainerModalOpen(true);
  };

  const openEditContainer = (c) => {
    setEditingContainerId(c.id);
    setContainerForm({
      ...c,
      tare: c.tare != null && c.tare !== "" ? c.tare / 1000 : c.tare,
      containerTare: c.containerTare != null && c.containerTare !== "" ? c.containerTare / 1000 : c.containerTare,
      gross: c.gross != null && c.gross !== "" ? c.gross / 1000 : c.gross,
      nett: c.nett != null && c.nett !== "" ? c.nett / 1000 : c.nett,
    });
    setContainerModalOpen(true);
  };

  const onSelectRelease = (releaseRef) => {
    const rd = releaseDetails.find((r) => r.releaseRef === releaseRef);
    setContainerForm((prev) => ({
      ...prev,
      releaseRef: releaseRef || "",
      emptyContainerParkId: rd?.emptyContainerParkId ?? null,
      transporterId: rd?.transporterId ?? null,
    }));
  };

  const saveContainer = () => {
    if (!selectedPackId) return;
    const payload = {
      ...containerForm,
      stockLocationId: containerForm.stockLocationId || null,
      packerId: containerForm.packerId != null && containerForm.packerId !== "" ? Number(containerForm.packerId) : null,
      tare: containerForm.tare != null && containerForm.tare !== "" ? Math.round(Number(containerForm.tare) * 1000) : null,
      containerTare: containerForm.containerTare != null && containerForm.containerTare !== "" ? Math.round(Number(containerForm.containerTare) * 1000) : null,
      gross: containerForm.gross != null && containerForm.gross !== "" ? Math.round(Number(containerForm.gross) * 1000) : null,
      nett: containerForm.nett != null && containerForm.nett !== "" ? Math.round(Number(containerForm.nett) * 1000) : null,
    };
    if (editingContainerId) {
      updateContainerInPack(selectedPackId, editingContainerId, payload);
    } else {
      addContainerToPack(selectedPackId, payload);
    }
    setContainerModalOpen(false);
  };

  const removeContainer = (containerId) => {
    if (!selectedPackId || !window.confirm("Remove this container from the job?")) return;
    deleteContainerFromPack(selectedPackId, containerId);
    setContainerModalOpen(false);
  };

  const setVerification = (key, value) => {
    if (!selectedPackId) return;
    updatePackVerification(selectedPackId, { [key]: value });
  };

  const customer = selectedPack
    ? customers.find((c) => c.id === selectedPack.customerId)
    : null;
  const commodity = selectedPack
    ? commodities.find((c) => c.id === selectedPack.commodityId)
    : null;

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
            margin: 0,
            fontSize: 22,
            fontWeight: 700,
            color: "#0f1e3d",
          }}
        >
          Container Packing
        </h1>

        <div style={{ display: "flex", gap: 16, flex: 1 }}>
          {/* Job list */}
          <div
            style={{
              width: 320,
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
                padding: "12px 14px",
                background: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                fontSize: 11,
                fontWeight: 700,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Container pack jobs
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {containerPacks.length === 0 && (
                <div
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  No container pack jobs (Pending/In progress) for this site.
                </div>
              )}
              {containerPacks.map((p) => {
                const cnt = (p.containers || []).length;
                const required = p.containersRequired ?? 0;
                const isSelected = selectedPackId === p.id;
                const cust = customers.find((c) => c.id === p.customerId);
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPackId(p.id)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid #f1f5f9",
                      cursor: "pointer",
                      background: isSelected ? "#eff6ff" : "transparent",
                      fontSize: 13,
                      color: "#1e293b",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, color: "#2563eb" }}>#{p.id}</span>
                      <PackStatusBadge status={p.status} />
                    </div>
                    <div style={{ color: "#64748b", fontSize: 12 }}>{p.jobReference || "—"}</div>
                    <div style={{ fontSize: 12, marginTop: 2 }}>{cust?.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
                      Containers: {cnt} / {required}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected job detail + containers */}
          <div
            style={{
              flex: 1,
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {!selectedPack ? (
              <div
                style={{
                  padding: 48,
                  textAlign: "center",
                  color: "#94a3b8",
                  fontSize: 14,
                }}
              >
                Select a pack job to pack containers.
              </div>
            ) : (
              <>
                <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700, color: "#0f1e3d" }}>
                        Pack #{selectedPack.id} · {selectedPack.jobReference || "—"}
                      </h2>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        {customer?.name} · {commodity?.description} · {selectedPack.importExport}
                      </div>
                    </div>
                    {selectedPack.status === "Pending" && (
                      <BtnPrimary
                        onClick={() => startPackJob(selectedPack.id)}
                        style={{ fontSize: 12 }}
                      >
                        Start job
                      </BtnPrimary>
                    )}
                  </div>

                  {/* Verification checklist */}
                  <div
                    style={{
                      marginTop: 16,
                      padding: 14,
                      background: "#f8fafc",
                      borderRadius: 8,
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#475569", marginBottom: 10 }}>
                      Verify before packing
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                      {[
                        { key: "importDetailsChecked", label: "Import details checked" },
                        { key: "sampleRequirementsChecked", label: "Sample requirements checked" },
                        { key: "rfpDetailsChecked", label: "RFP details checked" },
                        { key: "micorRequirementsChecked", label: "MICOR requirements checked" },
                      ].map(({ key, label }) => (
                        <label
                          key={key}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            fontSize: 13,
                            color: "#334155",
                            cursor: "pointer",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={!!verification[key]}
                            onChange={(e) => setVerification(key, e.target.checked)}
                            style={{ accentColor: "#3b82f6" }}
                          />
                          {label}
                        </label>
                      ))}
                    </div>
                    {!allVerified && (
                      <div style={{ fontSize: 12, color: "#b45309", marginTop: 8 }}>
                        Complete all checks before packing containers.
                      </div>
                    )}
                  </div>
                </div>

                {/* Containers table */}
                <div style={{ padding: 16, flex: 1, overflow: "auto" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>
                      Containers ({containers.length} / {selectedPack.containersRequired ?? 0})
                    </span>
                    <BtnPrimary
                      onClick={openNewContainer}
                      disabled={!allVerified}
                      style={{ fontSize: 12 }}
                    >
                      + Add container
                    </BtnPrimary>
                  </div>
                  {containers.length === 0 ? (
                    <div
                      style={{
                        padding: 32,
                        textAlign: "center",
                        color: "#94a3b8",
                        fontSize: 13,
                        border: "1px dashed #e2e8f0",
                        borderRadius: 8,
                      }}
                    >
                      No containers yet. Complete verification and add containers.
                    </div>
                  ) : (
                    <div
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                            <th style={thStyle}>Container</th>
                            <th style={thStyle}>Packer</th>
                            <th style={thStyle}>Seal</th>
                            <th style={thStyle}>ISO</th>
                            <th style={thStyle}>Release</th>
                            <th style={thStyle}>Nett (t)</th>
                            <th style={thStyle}>Empty</th>
                            <th style={thStyle}>Grain</th>
                            <th style={thStyle}>Packer signoff</th>
                            <th style={thStyle}>Status</th>
                            <th style={thStyle}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {containers.map((c) => {
                            const isCompleted = c.status === "completed";
                            const canComplete =
                              !isCompleted &&
                              c.nett != null &&
                              c.nett > 0 &&
                              c.stockLocationId != null;
                            const packer = c.packerId != null && packers ? packers.find((p) => p.id === c.packerId) : null;
                            return (
                              <tr
                                key={c.id}
                                onClick={() => openEditContainer(c)}
                                style={{
                                  borderBottom: "1px solid #f1f5f9",
                                  cursor: "pointer",
                                  background: "transparent",
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.background = "#f8fafc";
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.background = "transparent";
                                }}
                              >
                                <td style={tdStyle}>{c.containerNumber || "—"}</td>
                                <td style={tdStyle}>{packer ? packer.name : "—"}</td>
                                <td style={tdStyle}>{c.sealNumber || "—"}</td>
                                <td style={tdStyle}>{c.containerIsoCode || "—"}</td>
                                <td style={tdStyle}>{c.releaseRef || "—"}</td>
                                <td style={tdStyle}>{c.nett != null ? (Number(c.nett) / 1000).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 3 }) : "—"}</td>
                                <td style={tdStyle}>{c.emptyContainerInspectionResult || "—"}</td>
                                <td style={tdStyle}>{c.grainInspectionResult || "—"}</td>
                                <td style={tdStyle}>{c.packerSignoff ? "Yes" : "—"}</td>
                                <td style={tdStyle}>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      padding: "2px 8px",
                                      borderRadius: 12,
                                      background: isCompleted ? "#d1fae5" : "#f3f4f6",
                                      color: isCompleted ? "#065f46" : "#4b5563",
                                    }}
                                  >
                                    {c.status || "draft"}
                                  </span>
                                </td>
                                <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                                  {!isCompleted && (
                                    <button
                                      type="button"
                                      disabled={!canComplete}
                                      onClick={() => {
                                        if (
                                          canComplete &&
                                          window.confirm(
                                            "Complete this container? This will create stock transactions (in/out, shrink if applicable)."
                                          )
                                        ) {
                                          updateContainerInPack(selectedPackId, c.id, {
                                            ...c,
                                            status: "completed",
                                          });
                                        }
                                      }}
                                      style={{
                                        background: "none",
                                        border: "none",
                                        color: canComplete ? "#059669" : "#9ca3af",
                                        cursor: canComplete ? "pointer" : "not-allowed",
                                        fontSize: 12,
                                      }}
                                    >
                                      Complete
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Container add/edit modal */}
      <Modal
        open={containerModalOpen}
        onClose={() => setContainerModalOpen(false)}
        title={editingContainerId ? "Edit container" : "Add container"}
        width={640}
      >
        <ContainerForm
          form={containerForm}
          setForm={setContainerForm}
          onSelectRelease={onSelectRelease}
          releaseDetails={releaseDetails}
          containerParks={containerParks}
          transporters={transporters}
          stockLocations={stockLocations}
          containerCodes={CONTAINER_CODES}
          packers={packers}
          assignedPackerIdsForJob={selectedPack?.assignedPackerIds}
        />
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
          {editingContainerId && (
            <BtnDanger onClick={() => removeContainer(editingContainerId)}>
              Remove
            </BtnDanger>
          )}
          <BtnSecondary onClick={() => setContainerModalOpen(false)}>
            Cancel
          </BtnSecondary>
          <BtnPrimary onClick={saveContainer}>Save</BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "8px 12px",
  fontWeight: 600,
  color: "#64748b",
  fontSize: 11,
  textTransform: "uppercase",
};
const tdStyle = { padding: "10px 12px", color: "#1e293b" };

function ContainerForm({
  form,
  setForm,
  onSelectRelease,
  releaseDetails,
  containerParks,
  transporters,
  stockLocations,
  containerCodes,
  packers,
  assignedPackerIdsForJob,
}) {
  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  // Packer options: if job has assigned packers, only show those; otherwise all active packers
  const packerOptions = (() => {
    const list = packers || [];
    const active = list.filter((p) => p.status === "active");
    if (Array.isArray(assignedPackerIdsForJob) && assignedPackerIdsForJob.length > 0) {
      return active.filter((p) => assignedPackerIdsForJob.includes(p.id));
    }
    return active;
  })();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormRow label="Container number">
          <Input
            value={form.containerNumber || ""}
            onChange={(e) => set("containerNumber", e.target.value)}
            placeholder="e.g. MSKU1234567"
          />
        </FormRow>
        <FormRow label="Seal number">
          <Input
            value={form.sealNumber || ""}
            onChange={(e) => set("sealNumber", e.target.value)}
            placeholder="Seal"
          />
        </FormRow>
        <FormRow label="Container ISO code">
          <Select
            value={form.containerIsoCode || ""}
            onChange={(e) => set("containerIsoCode", e.target.value)}
          >
            <option value="">— Select —</option>
            {(containerCodes || []).map((c) => (
              <option key={c.id} value={c.isoCode}>
                {c.isoCode} ({c.containerSize})
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Start date and time">
          <Input
            type="datetime-local"
            value={form.startDateTime || ""}
            onChange={(e) => set("startDateTime", e.target.value)}
          />
        </FormRow>
        <FormRow label="Stock location">
          <Select
            value={form.stockLocationId ?? ""}
            onChange={(e) => set("stockLocationId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Select —</option>
            {(stockLocations || []).map((loc) => (
              <option key={loc.id} value={loc.id}>{loc.name}</option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Packer (pick one packer for this container)">
          <Select
            value={form.packerId ?? ""}
            onChange={(e) => set("packerId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Select —</option>
            {packerOptions.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Release">
          <Select
            value={form.releaseRef || ""}
            onChange={(e) => {
              const v = e.target.value;
              set("releaseRef", v);
              onSelectRelease(v);
            }}
          >
            <option value="">— Select —</option>
            {releaseDetails.map((r, i) => (
              <option key={i} value={r.releaseRef}>{r.releaseRef}</option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Container park (same as release)">
          <Select
            value={form.emptyContainerParkId ?? ""}
            onChange={(e) => set("emptyContainerParkId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Select —</option>
            {(containerParks || []).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Transporter (same as release)">
          <Select
            value={form.transporterId ?? ""}
            onChange={(e) => set("transporterId", e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">— Select —</option>
            {(transporters || []).map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </Select>
        </FormRow>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 8 }}>Weights (t)</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14 }}>
        <FormRow label="Tare">
          <Input
            type="number"
            value={form.tare ?? ""}
            onChange={(e) => set("tare", e.target.value === "" ? null : e.target.value)}
          />
        </FormRow>
        <FormRow label="Container tare">
          <Input
            type="number"
            value={form.containerTare ?? ""}
            onChange={(e) => set("containerTare", e.target.value === "" ? null : e.target.value)}
          />
        </FormRow>
        <FormRow label="Gross">
          <Input
            type="number"
            value={form.gross ?? ""}
            onChange={(e) => set("gross", e.target.value === "" ? null : e.target.value)}
          />
        </FormRow>
        <FormRow label="Nett">
          <Input
            type="number"
            value={form.nett ?? ""}
            onChange={(e) => set("nett", e.target.value === "" ? null : e.target.value)}
          />
        </FormRow>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 8 }}>Packer signoff</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormRow label="Packer signoff">
          <Input
            value={form.packerSignoff || ""}
            onChange={(e) => set("packerSignoff", e.target.value)}
            placeholder="Name"
          />
        </FormRow>
        <FormRow label="Packer signoff date and time">
          <Input
            type="datetime-local"
            value={form.packerSignoffDateTime || ""}
            onChange={(e) => set("packerSignoffDateTime", e.target.value)}
          />
        </FormRow>
      </div>

      <FormRow label="Authorised officer">
        <Input
          value={form.authorisedOfficer || ""}
          onChange={(e) => set("authorisedOfficer", e.target.value)}
          placeholder="Name"
        />
      </FormRow>

      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 8 }}>Empty container inspection</div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
        <FormRow label="Result">
          <Select
            value={form.emptyContainerInspectionResult || ""}
            onChange={(e) => set("emptyContainerInspectionResult", e.target.value)}
          >
            <option value="">—</option>
            {INSPECTION_RESULTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Remark">
          <Input
            value={form.emptyContainerInspectionRemark || ""}
            onChange={(e) => set("emptyContainerInspectionRemark", e.target.value)}
            placeholder="Remark"
          />
        </FormRow>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 8 }}>Grain inspection</div>
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 14 }}>
        <FormRow label="Result">
          <Select
            value={form.grainInspectionResult || ""}
            onChange={(e) => set("grainInspectionResult", e.target.value)}
          >
            <option value="">—</option>
            {INSPECTION_RESULTS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Remark">
          <Input
            value={form.grainInspectionRemark || ""}
            onChange={(e) => set("grainInspectionRemark", e.target.value)}
            placeholder="Remark"
          />
        </FormRow>
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginTop: 8 }}>Authorised officer sign-off</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <FormRow label="Authorised officer sign-off">
          <Input
            value={form.authorisedOfficerSignoff || ""}
            onChange={(e) => set("authorisedOfficerSignoff", e.target.value)}
            placeholder="Name"
          />
        </FormRow>
        <FormRow label="Sign-off date and time">
          <Input
            type="datetime-local"
            value={form.authorisedOfficerSignoffDateTime || ""}
            onChange={(e) => set("authorisedOfficerSignoffDateTime", e.target.value)}
          />
        </FormRow>
      </div>
    </div>
  );
}
