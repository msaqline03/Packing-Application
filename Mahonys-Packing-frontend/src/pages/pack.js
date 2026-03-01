"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  FormRow,
  Input,
  Select,
  BtnPrimary,
  BtnSecondary,
} from "../components/SharedComponents";
import {
  SITES,
  PACK_STATUSES,
  SAMPLE_STATUSES,
  getVesselForPack,
} from "../utils/mockData";
import {
  formatVesselDateTime,
  vesselDateTimeToDateOnly,
} from "../utils/vesselScheduleCsv";

const blankPack = (currentSite) => ({
  packType: "container",
  importExport: "Export",
  customerId: "",
  exporter: "",
  commodityTypeId: "",
  commodityId: "",
  status: "Pending",
  jobReference: "",
  fumigation: "",
  containersRequired: "",
  releaseIds: [],
  releaseDetails: [],
  emptyContainerParkIds: [],
  transporterIds: [],
  assignedPackerIds: [],
  siteId: currentSite,
  quantityPerContainer: "",
  maxQtyPerContainer: "",
  mtTotal: "",
  destinationCountry: "",
  destinationPort: "",
  transshipmentPort: "",
  transshipmentPortCode: "",
  shippingLineId: "",
  vesselDepartureId: null,
  importPermitRequired: false,
  importPermitNumber: "",
  importPermitDate: "",
  importPermitFiles: [],
  rfp: "",
  rfpAdditionalDeclarationRequired: false,
  additionalDeclarationFiles: [],
  rfpFiles: [],
  rfpComment: "",
  rfpExpiry: "",
  rfpCommodityCode: "",
  sampleRequired: false,
  sampleLocations: [],
  sampleSentDates: [],
  sampleStatuses: [],
  packingInstructionFiles: [],
  jobNotes: "",
  date: new Date().toISOString().split("T")[0],
  testRequired: false,
  shrinkTaken: false,
});

function parseList(str) {
  if (!str || typeof str !== "string") return [];
  return str
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function listToStr(arr) {
  return Array.isArray(arr) ? arr.join(", ") : "";
}

export default function PackEditPage() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    packs,
    customers,
    commodityTypes,
    commodities,
    shippingLines,
    containerParks,
    transporters,
    packers,
    currentSite,
    setCurrentSite,
    addPack,
    updatePack,
    vesselSchedule,
    vesselDepartures,
    addVesselDeparture,
  } = useApp();

  const packId = params.get("id") ? Number(params.get("id")) : null;
  const isCreate = params.get("mode") === "create";
  const existingPack = packId ? packs.find((p) => p.id === packId) : null;

  const [pack, setPack] = useState(
    () => existingPack || blankPack(currentSite)
  );

  useEffect(() => {
    if (existingPack) {
      const releaseDetails =
        existingPack.releaseDetails?.length > 0
          ? existingPack.releaseDetails
          : (existingPack.releaseIds || []).map((ref) => ({
              releaseRef: ref,
              emptyContainerParkId: null,
              transporterId: null,
            }));
      setPack({ ...existingPack, releaseDetails });
    }
  }, [existingPack]);

  const set = (key, val) => setPack((prev) => ({ ...prev, [key]: val }));

  const save = () => {
    const normalized = {
      ...pack,
      packType: pack.packType || "container",
      customerId: pack.customerId ? Number(pack.customerId) : null,
      commodityTypeId: pack.commodityTypeId ? Number(pack.commodityTypeId) : null,
      commodityId: pack.commodityId ? Number(pack.commodityId) : null,
      siteId: pack.siteId ? Number(pack.siteId) : currentSite,
      containersRequired: pack.containersRequired === "" ? null : Number(pack.containersRequired),
      quantityPerContainer: pack.quantityPerContainer === "" ? null : Number(pack.quantityPerContainer),
      maxQtyPerContainer: pack.maxQtyPerContainer === "" ? null : Number(pack.maxQtyPerContainer),
      mtTotal: pack.mtTotal === "" ? null : Number(pack.mtTotal),
      shippingLineId: pack.shippingLineId ? Number(pack.shippingLineId) : null,
      emptyContainerParkIds: Array.isArray(pack.emptyContainerParkIds) ? pack.emptyContainerParkIds : [],
      transporterIds: Array.isArray(pack.transporterIds) ? pack.transporterIds : [],
      assignedPackerIds: Array.isArray(pack.assignedPackerIds) ? pack.assignedPackerIds.map(Number).filter(Boolean) : [],
      releaseIds: Array.isArray(pack.releaseIds) ? pack.releaseIds : (Array.isArray(pack.releaseDetails) ? pack.releaseDetails.map((r) => r.releaseRef) : parseList(String(pack.releaseIdsStr || ""))),
      releaseDetails: Array.isArray(pack.releaseDetails) ? pack.releaseDetails : [],
      importPermitFiles: Array.isArray(pack.importPermitFiles) ? pack.importPermitFiles : parseList(String(pack.importPermitFilesStr || "")),
      additionalDeclarationFiles: Array.isArray(pack.additionalDeclarationFiles) ? pack.additionalDeclarationFiles : parseList(String(pack.additionalDeclarationFilesStr || "")),
      rfpFiles: Array.isArray(pack.rfpFiles) ? pack.rfpFiles : parseList(String(pack.rfpFilesStr || "")),
      sampleLocations: Array.isArray(pack.sampleLocations) ? pack.sampleLocations : parseList(String(pack.sampleLocationsStr || "")),
      sampleSentDates: Array.isArray(pack.sampleSentDates) ? pack.sampleSentDates : parseList(String(pack.sampleSentDatesStr || "")),
      sampleStatuses: Array.isArray(pack.sampleStatuses) ? pack.sampleStatuses : parseList(String(pack.sampleStatusesStr || "")),
      packingInstructionFiles: Array.isArray(pack.packingInstructionFiles) ? pack.packingInstructionFiles : parseList(String(pack.packingInstructionFilesStr || "")),
      vesselDepartureId: pack.vesselDepartureId ? Number(pack.vesselDepartureId) : null,
    };
    if (isCreate) {
      addPack(normalized);
      router.push("/packing-schedule");
    } else {
      updatePack(packId, normalized);
      router.push(`/packing-schedule?id=${packId}`);
    }
  };

  const commoditiesForType = pack.commodityTypeId
    ? commodities.filter((c) => c.commodityTypeId === Number(pack.commodityTypeId))
    : commodities;

  const sectionStyle = {
    background: "#fff",
    borderRadius: 10,
    border: "1px solid #e2e8f0",
    padding: 20,
    marginBottom: 16,
  };
  const sectionTitle = {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f1e3d",
    marginBottom: 14,
    paddingBottom: 8,
    borderBottom: "2px solid #e2e8f0",
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
          maxWidth: 900,
          margin: "0 auto",
          padding: "20px 24px 40px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f1e3d" }}>
            {isCreate ? "Create Pack" : `Edit Pack #${packId}`}
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnSecondary onClick={() => router.push("/packing-schedule")}>
              Cancel
            </BtnSecondary>
            <BtnPrimary onClick={save}>Save</BtnPrimary>
          </div>
        </div>

        {/* Basic */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Basic</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormRow label="Pack type">
              <Select
                value={pack.packType || "container"}
                onChange={(e) => set("packType", e.target.value)}
              >
                <option value="container">Container</option>
                <option value="bulk">Bulk</option>
              </Select>
            </FormRow>
            <FormRow label="Import / Export">
              <Select
                value={pack.importExport}
                onChange={(e) => set("importExport", e.target.value)}
              >
                <option value="Import">Import</option>
                <option value="Export">Export</option>
              </Select>
            </FormRow>
            <FormRow label="Status">
              <Select
                value={pack.status}
                onChange={(e) => set("status", e.target.value)}
              >
                {PACK_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Customer">
              <Select
                value={pack.customerId ?? ""}
                onChange={(e) => set("customerId", e.target.value)}
              >
                <option value="">— Select —</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Exporter">
              <Input
                value={pack.exporter || ""}
                onChange={(e) => set("exporter", e.target.value)}
                placeholder="Exporter name"
              />
            </FormRow>
            <FormRow label="Commodity Type">
              <Select
                value={pack.commodityTypeId ?? ""}
                onChange={(e) => {
                  set("commodityTypeId", e.target.value);
                  set("commodityId", "");
                }}
              >
                <option value="">— Select —</option>
                {commodityTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Commodity">
              <Select
                value={pack.commodityId ?? ""}
                onChange={(e) => set("commodityId", e.target.value)}
                disabled={!pack.commodityTypeId}
              >
                <option value="">— Select —</option>
                {commoditiesForType.map((c) => (
                  <option key={c.id} value={c.id}>{c.description}</option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Job Reference">
              <Input
                value={pack.jobReference || ""}
                onChange={(e) => set("jobReference", e.target.value)}
                placeholder="Job reference"
              />
            </FormRow>
            <FormRow label="Site">
              <Select
                value={pack.siteId ?? currentSite}
                onChange={(e) => set("siteId", Number(e.target.value))}
              >
                {SITES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </FormRow>
            {(pack.packType || "container") === "bulk" && (
              <FormRow label="Test required">
                <Select
                  value={pack.testRequired ? "yes" : "no"}
                  onChange={(e) => set("testRequired", e.target.value === "yes")}
                >
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </Select>
              </FormRow>
            )}
            <FormRow label="Shrink taken (Import jobs)">
              <Select
                value={pack.shrinkTaken ? "yes" : "no"}
                onChange={(e) => set("shrinkTaken", e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </FormRow>
          </div>
          <FormRow label="Fumigation">
            <Input
              value={pack.fumigation || ""}
              onChange={(e) => set("fumigation", e.target.value)}
              placeholder="Fumigation details"
            />
          </FormRow>
        </div>

        {/* Containers & quantity */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Containers & quantity</div>
          {(pack.packType || "container") === "container" && (
            <FormRow label="Assigned packers">
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {(packers || []).filter((p) => p.status === "active").map((pkr) => {
                  const ids = Array.isArray(pack.assignedPackerIds) ? pack.assignedPackerIds : [];
                  const checked = ids.includes(pkr.id);
                  return (
                    <label key={pkr.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...ids, pkr.id]
                            : ids.filter((id) => id !== pkr.id);
                          set("assignedPackerIds", next);
                        }}
                        style={{ accentColor: "#3b82f6" }}
                      />
                      {pkr.name}
                    </label>
                  );
                })}
                {(!packers || packers.filter((p) => p.status === "active").length === 0) && (
                  <span style={{ fontSize: 12, color: "#94a3b8" }}>No active packers. Add packers on the Packers page.</span>
                )}
              </div>
            </FormRow>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <FormRow label="Containers required">
              <Input
                type="number"
                value={pack.containersRequired ?? ""}
                onChange={(e) => set("containersRequired", e.target.value)}
                placeholder="Number"
              />
            </FormRow>
            <FormRow label="Quantity per container">
              <Input
                type="number"
                value={pack.quantityPerContainer ?? ""}
                onChange={(e) => set("quantityPerContainer", e.target.value)}
                placeholder="MT"
              />
            </FormRow>
            <FormRow label="Max qty per container">
              <Input
                type="number"
                value={pack.maxQtyPerContainer ?? ""}
                onChange={(e) => set("maxQtyPerContainer", e.target.value)}
                placeholder="MT"
              />
            </FormRow>
            <FormRow label="MT total" style={{ gridColumn: "1 / -1" }}>
              <Input
                type="number"
                value={pack.mtTotal ?? ""}
                onChange={(e) => set("mtTotal", e.target.value)}
                placeholder="Total MT"
              />
            </FormRow>
          </div>
          <FormRow label="Release details (for container packing: ref + park + transporter per release)">
            <div style={{ marginBottom: 8 }}>
              {(Array.isArray(pack.releaseDetails) ? pack.releaseDetails : []).map((rd, idx) => (
                <div
                  key={idx}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr auto",
                    gap: 10,
                    alignItems: "end",
                    marginBottom: 10,
                  }}
                >
                  <Input
                    value={rd.releaseRef || ""}
                    onChange={(e) => {
                      const next = [...(pack.releaseDetails || [])];
                      next[idx] = { ...next[idx], releaseRef: e.target.value };
                      set("releaseDetails", next);
                    }}
                    placeholder="Release ref (e.g. REL-001)"
                  />
                  <Select
                    value={rd.emptyContainerParkId ?? ""}
                    onChange={(e) => {
                      const next = [...(pack.releaseDetails || [])];
                      next[idx] = { ...next[idx], emptyContainerParkId: e.target.value ? Number(e.target.value) : null };
                      set("releaseDetails", next);
                    }}
                  >
                    <option value="">— Park —</option>
                    {containerParks.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </Select>
                  <Select
                    value={rd.transporterId ?? ""}
                    onChange={(e) => {
                      const next = [...(pack.releaseDetails || [])];
                      next[idx] = { ...next[idx], transporterId: e.target.value ? Number(e.target.value) : null };
                      set("releaseDetails", next);
                    }}
                  >
                    <option value="">— Transporter —</option>
                    {transporters.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </Select>
                  <button
                    type="button"
                    onClick={() =>
                      set(
                        "releaseDetails",
                        pack.releaseDetails.filter((_, i) => i !== idx)
                      )
                    }
                    style={{
                      background: "none",
                      border: "none",
                      color: "#dc2626",
                      cursor: "pointer",
                      padding: "6px 8px",
                      fontSize: 16,
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <BtnSecondary
                type="button"
                onClick={() =>
                  set("releaseDetails", [
                    ...(pack.releaseDetails || []),
                    { releaseRef: "", emptyContainerParkId: null, transporterId: null },
                  ])
                }
                style={{ fontSize: 12 }}
              >
                + Add release
              </BtnSecondary>
            </div>
          </FormRow>
          <FormRow label="Empty container park(s)">
            <Select
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!id) return;
                const current = Array.isArray(pack.emptyContainerParkIds) ? pack.emptyContainerParkIds : [];
                if (!current.includes(id)) set("emptyContainerParkIds", [...current, id]);
                e.target.value = "";
              }}
            >
              <option value="">— Add park —</option>
              {containerParks.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              {Array.isArray(pack.emptyContainerParkIds) && pack.emptyContainerParkIds.length > 0
                ? pack.emptyContainerParkIds.map((id) => {
                    const park = containerParks.find((p) => p.id === id);
                    return (
                      <span
                        key={id}
                        style={{
                          display: "inline-block",
                          background: "#e2e8f0",
                          padding: "2px 8px",
                          borderRadius: 6,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        {park?.name || id}{" "}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "emptyContainerParkIds",
                              pack.emptyContainerParkIds.filter((x) => x !== id)
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#64748b",
                            marginLeft: 4,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                : "None selected"}
            </div>
          </FormRow>
          <FormRow label="Transporter(s)">
            <Select
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (!id) return;
                const current = Array.isArray(pack.transporterIds) ? pack.transporterIds : [];
                if (!current.includes(id)) set("transporterIds", [...current, id]);
                e.target.value = "";
              }}
            >
              <option value="">— Add transporter —</option>
              {transporters.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </Select>
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              {Array.isArray(pack.transporterIds) && pack.transporterIds.length > 0
                ? pack.transporterIds.map((id) => {
                    const t = transporters.find((x) => x.id === id);
                    return (
                      <span
                        key={id}
                        style={{
                          display: "inline-block",
                          background: "#e2e8f0",
                          padding: "2px 8px",
                          borderRadius: 6,
                          marginRight: 6,
                          marginBottom: 4,
                        }}
                      >
                        {t?.name || id}{" "}
                        <button
                          type="button"
                          onClick={() =>
                            set(
                              "transporterIds",
                              pack.transporterIds.filter((x) => x !== id)
                            )
                          }
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#64748b",
                            marginLeft: 4,
                          }}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })
                : "None selected"}
            </div>
          </FormRow>
        </div>

        {/* Destination & shipping */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Destination & shipping</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormRow label="Destination country">
              <Input
                value={pack.destinationCountry || ""}
                onChange={(e) => set("destinationCountry", e.target.value)}
                placeholder="Country"
              />
            </FormRow>
            <FormRow label="Destination port">
              <Input
                value={pack.destinationPort || ""}
                onChange={(e) => set("destinationPort", e.target.value)}
                placeholder="Port"
              />
            </FormRow>
            <FormRow label="Transshipment port">
              <Input
                value={pack.transshipmentPort || ""}
                onChange={(e) => set("transshipmentPort", e.target.value)}
                placeholder="Port"
              />
            </FormRow>
            <FormRow label="Transshipment port code">
              <Input
                value={pack.transshipmentPortCode || ""}
                onChange={(e) => set("transshipmentPortCode", e.target.value)}
                placeholder="Code"
              />
            </FormRow>
            <FormRow label="Shipping line">
              <Select
                value={pack.shippingLineId ?? ""}
                onChange={(e) => set("shippingLineId", e.target.value)}
              >
                <option value="">— Select —</option>
                {shippingLines.map((l) => (
                  <option key={l.id} value={l.id}>{l.name} ({l.code})</option>
                ))}
              </Select>
            </FormRow>
            <FormRow label="Vessel departure">
              <Select
                value={pack.vesselDepartureId ?? ""}
                onChange={(e) =>
                  set("vesselDepartureId", e.target.value === "" ? null : Number(e.target.value))
                }
              >
                <option value="">— Select vessel —</option>
                {(vesselDepartures || []).map((vd) => (
                  <option key={vd.id} value={vd.id}>
                    {vd.vessel} {vd.voyageNumber ? ` (${vd.voyageNumber})` : ""}
                    {vd.vesselCutoffDate ? ` — Cut-off ${vd.vesselCutoffDate}` : ""}
                  </option>
                ))}
              </Select>
            </FormRow>
            {vesselSchedule && vesselSchedule.length > 0 && (
              <FormRow label="Add from CSV schedule">
                <Select
                  value=""
                  onChange={(e) => {
                    const idx = e.target.value;
                    if (idx === "") return;
                    const row = vesselSchedule[Number(idx)];
                    if (!row) return;
                    const key = `${(row.shipName || "").trim()}|${(row.voyageOut || "").trim()}`;
                    const existing = (vesselDepartures || []).find(
                      (v) => `${v.vessel}|${v.voyageNumber}` === key
                    );
                    if (existing) {
                      set("vesselDepartureId", existing.id);
                    } else {
                      const newDep = addVesselDeparture({
                        vessel: row.shipName?.trim() || "",
                        voyageNumber: row.voyageOut || "",
                        vesselLloyds: (row.lloydsId || "").replace(/^\./, ""),
                        vesselCutoffDate: vesselDateTimeToDateOnly(row.cargoCutoffDate),
                        vesselReceivalsOpenDate: vesselDateTimeToDateOnly(
                          row.exportReceivalCommencementDate
                        ),
                        vesselEta: formatVesselDateTime(row.eta),
                        vesselEtd: formatVesselDateTime(row.etd),
                        vesselFreeDays: null,
                        shippingLineId: pack.shippingLineId || null,
                      });
                      set("vesselDepartureId", newDep.id);
                    }
                    e.target.value = "";
                  }}
                >
                  <option value="">— Import from uploaded CSV —</option>
                  {vesselSchedule.map((row, idx) => (
                    <option key={idx} value={idx}>
                      {row.shipName} {row.voyageOut ? ` (${row.voyageOut})` : ""} — Cut-off {row.cargoCutoffDate || "—"}
                    </option>
                  ))}
                </Select>
              </FormRow>
            )}
            {(() => {
              const v = getVesselForPack(pack, vesselDepartures || []);
              if (!v) return null;
              return (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    padding: 12,
                    background: "#f8fafc",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "#475569",
                  }}
                >
                  <strong style={{ color: "#0f172a" }}>Vessel schedule:</strong>{" "}
                  {v.vessel} {v.voyageNumber ? `(${v.voyageNumber})` : ""}
                  {v.vesselCutoffDate && ` · Cut-off: ${v.vesselCutoffDate}`}
                  {v.vesselReceivalsOpenDate && ` · Receivals open: ${v.vesselReceivalsOpenDate}`}
                  {v.vesselEta && ` · ETA: ${v.vesselEta}`}
                  {v.vesselEtd && ` · ETD: ${v.vesselEtd}`}
                  {v.vesselFreeDays != null && v.vesselFreeDays !== "" && ` · Free days: ${v.vesselFreeDays}`}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Import permit */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Import permit</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormRow label="Import permit required">
              <Select
                value={pack.importPermitRequired ? "yes" : "no"}
                onChange={(e) => set("importPermitRequired", e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </FormRow>
            <FormRow label="Import permit number">
              <Input
                value={pack.importPermitNumber || ""}
                onChange={(e) => set("importPermitNumber", e.target.value)}
                placeholder="Number"
              />
            </FormRow>
            <FormRow label="Import permit date">
              <Input
                type="date"
                value={pack.importPermitDate || ""}
                onChange={(e) => set("importPermitDate", e.target.value)}
              />
            </FormRow>
          </div>
          <FormRow label="Import permit file(s) (comma separated for mock)">
            <Input
              value={listToStr(pack.importPermitFiles)}
              onChange={(e) => set("importPermitFiles", parseList(e.target.value))}
              placeholder="file1.pdf, file2.pdf"
            />
          </FormRow>
        </div>

        {/* RFP */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>RFP</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <FormRow label="RFP">
              <Input
                value={pack.rfp || ""}
                onChange={(e) => set("rfp", e.target.value)}
                placeholder="RFP reference"
              />
            </FormRow>
            <FormRow label="RFP additional declaration required">
              <Select
                value={pack.rfpAdditionalDeclarationRequired ? "yes" : "no"}
                onChange={(e) => set("rfpAdditionalDeclarationRequired", e.target.value === "yes")}
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </Select>
            </FormRow>
            <FormRow label="RFP comment">
              <Input
                value={pack.rfpComment || ""}
                onChange={(e) => set("rfpComment", e.target.value)}
                placeholder="Comment"
              />
            </FormRow>
            <FormRow label="RFP expiry">
              <Input
                type="date"
                value={pack.rfpExpiry || ""}
                onChange={(e) => set("rfpExpiry", e.target.value)}
              />
            </FormRow>
            <FormRow label="RFP commodity code">
              <Input
                value={pack.rfpCommodityCode || ""}
                onChange={(e) => set("rfpCommodityCode", e.target.value)}
                placeholder="Code"
              />
            </FormRow>
          </div>
          <FormRow label="Additional declaration file(s) (comma separated)">
            <Input
              value={listToStr(pack.additionalDeclarationFiles)}
              onChange={(e) => set("additionalDeclarationFiles", parseList(e.target.value))}
              placeholder="file1.pdf"
            />
          </FormRow>
          <FormRow label="RFP file(s) (comma separated)">
            <Input
              value={listToStr(pack.rfpFiles)}
              onChange={(e) => set("rfpFiles", parseList(e.target.value))}
              placeholder="rfp.pdf"
            />
          </FormRow>
        </div>

        {/* Sample */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Sample</div>
          <FormRow label="Sample required">
            <Select
              value={pack.sampleRequired ? "yes" : "no"}
              onChange={(e) => set("sampleRequired", e.target.value === "yes")}
            >
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </FormRow>
          <FormRow label="Sample location(s) (comma separated)">
            <Input
              value={listToStr(pack.sampleLocations)}
              onChange={(e) => set("sampleLocations", parseList(e.target.value))}
              placeholder="Lab A, Port QC"
            />
          </FormRow>
          <FormRow label="Sample sent date(s) (comma separated)">
            <Input
              value={listToStr(pack.sampleSentDates)}
              onChange={(e) => set("sampleSentDates", parseList(e.target.value))}
              placeholder="2026-02-05, 2026-02-06"
            />
          </FormRow>
          <FormRow label="Sample status(es)">
            <Select
              value=""
              onChange={(e) => {
                const v = e.target.value;
                if (!v) return;
                const current = Array.isArray(pack.sampleStatuses) ? pack.sampleStatuses : [];
                set("sampleStatuses", [...current, v]);
                e.target.value = "";
              }}
            >
              <option value="">— Add status —</option>
              {SAMPLE_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <div style={{ marginTop: 6, fontSize: 12, color: "#64748b" }}>
              {Array.isArray(pack.sampleStatuses) && pack.sampleStatuses.length > 0
                ? pack.sampleStatuses.map((s, i) => (
                    <span
                      key={i}
                      style={{
                        display: "inline-block",
                        background: "#e2e8f0",
                        padding: "2px 8px",
                        borderRadius: 6,
                        marginRight: 6,
                        marginBottom: 4,
                      }}
                    >
                      {s}{" "}
                      <button
                        type="button"
                        onClick={() =>
                          set(
                            "sampleStatuses",
                            pack.sampleStatuses.filter((_, j) => j !== i)
                          )
                        }
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#64748b",
                          marginLeft: 4,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                : "None"}
            </div>
          </FormRow>
        </div>

        {/* Packing & notes */}
        <div style={sectionStyle}>
          <div style={sectionTitle}>Packing & notes</div>
          <FormRow label="Packing instruction file(s) (comma separated)">
            <Input
              value={listToStr(pack.packingInstructionFiles)}
              onChange={(e) => set("packingInstructionFiles", parseList(e.target.value))}
              placeholder="file1.pdf"
            />
          </FormRow>
          <FormRow label="Job notes">
            <textarea
              value={pack.jobNotes || ""}
              onChange={(e) => set("jobNotes", e.target.value)}
              placeholder="Notes…"
              rows={4}
              style={{
                width: "100%",
                padding: "8px 10px",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                fontSize: 13,
                fontFamily: "'Segoe UI', sans-serif",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
          </FormRow>
          <FormRow label="Date">
            <Input
              type="date"
              value={pack.date || ""}
              onChange={(e) => set("date", e.target.value)}
            />
          </FormRow>
        </div>
      </div>
    </div>
  );
}
