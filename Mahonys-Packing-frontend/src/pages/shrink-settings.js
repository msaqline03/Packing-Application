"use client";
import React, { useState } from "react";
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

function SectionCard({ title, description, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          padding: "14px 18px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f1e3d" }}>
          {title}
        </h3>
        {description && (
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 12,
              color: "#64748b",
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>
      <div style={{ padding: 18 }}>{children}</div>
    </div>
  );
}

export default function ShrinkSettingsPage() {
  const {
    commodityTypes,
    commodities,
    customers,
    currentSite,
    setCurrentSite,
    defaultShrinkPercent,
    setDefaultShrinkPercent,
    updateCommodityType,
    updateCommodity,
    customerCommodityShrink,
    addCustomerCommodityShrinkEntry,
    updateCustomerCommodityShrinkEntry,
    deleteCustomerCommodityShrinkEntry,
  } = useApp();

  const [defaultInput, setDefaultInput] = useState("");
  React.useEffect(() => {
    setDefaultInput(
      defaultShrinkPercent === null || defaultShrinkPercent === undefined
        ? ""
        : String(defaultShrinkPercent)
    );
  }, [defaultShrinkPercent]);
  const [ccModalOpen, setCcModalOpen] = useState(false);
  const [ccEditId, setCcEditId] = useState(null);
  const [ccForm, setCcForm] = useState({
    customerId: "",
    commodityId: "",
    shrinkPercent: "",
  });

  const handleSaveDefault = () => {
    const num = defaultInput.trim() === "" ? 0 : parseFloat(defaultInput);
    if (!Number.isNaN(num) && num >= 0 && num <= 100) {
      setDefaultShrinkPercent(num);
    } else {
      alert("Enter a valid percentage (0–100) or leave empty for 0.");
    }
  };

  const handleCommodityTypeShrinkChange = (typeId, value) => {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : parseFloat(trimmed);
    if (trimmed === "" || (!Number.isNaN(num) && num >= 0 && num <= 100)) {
      updateCommodityType(typeId, { shrinkPercent: trimmed === "" ? null : num });
    }
  };

  const handleCommodityShrinkChange = (commodityId, value) => {
    const trimmed = value.trim();
    if (trimmed === "") {
      updateCommodity(commodityId, { shrinkAmount: "" });
      return;
    }
    const normalized = trimmed.includes("%") ? trimmed : `${trimmed}%`;
    const num = parseFloat(normalized.replace("%", ""));
    if (!Number.isNaN(num) && num >= 0 && num <= 100) {
      updateCommodity(commodityId, { shrinkAmount: normalized });
    }
  };

  const openAddCc = () => {
    setCcEditId(null);
    setCcForm({ customerId: "", commodityId: "", shrinkPercent: "" });
    setCcModalOpen(true);
  };

  const openEditCc = (entry) => {
    setCcEditId(entry.id);
    setCcForm({
      customerId: String(entry.customerId),
      commodityId: String(entry.commodityId),
      shrinkPercent: entry.shrinkPercent === null || entry.shrinkPercent === undefined ? "" : String(entry.shrinkPercent),
    });
    setCcModalOpen(true);
  };

  const handleSaveCc = () => {
    if (!ccForm.customerId || !ccForm.commodityId) {
      alert("Select both customer and commodity.");
      return;
    }
    const num = ccForm.shrinkPercent.trim() === "" ? 0 : parseFloat(ccForm.shrinkPercent);
    if (Number.isNaN(num) || num < 0 || num > 100) {
      alert("Enter a valid shrink percentage (0–100).");
      return;
    }
    if (ccEditId) {
      updateCustomerCommodityShrinkEntry(ccEditId, {
        customerId: Number(ccForm.customerId),
        commodityId: Number(ccForm.commodityId),
        shrinkPercent: num,
      });
    } else {
      addCustomerCommodityShrinkEntry({
        customerId: Number(ccForm.customerId),
        commodityId: Number(ccForm.commodityId),
        shrinkPercent: num,
      });
    }
    setCcModalOpen(false);
  };

  const parseDisplayPercent = (raw) => {
    if (raw === null || raw === undefined || raw === "") return "";
    if (typeof raw === "number") return String(raw);
    return String(raw).replace("%", "").trim();
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
        }}
      >
        <h1
          style={{
            margin: "0 0 8px",
            fontSize: 22,
            fontWeight: 700,
            color: "#0f1e3d",
          }}
        >
          Shrink Settings
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Shrink is applied on incoming tickets. The effective percentage is resolved in order:{" "}
          <strong>Customer–commodity agreement</strong> → <strong>Commodity</strong> →{" "}
          <strong>Commodity type</strong> → <strong>Default</strong>. The first value set wins.
        </p>

        {/* 1. Default shrink */}
        <SectionCard
          title="1. Default shrink"
          description="Applied to all commodity types when no shrink is set at type, commodity, or customer–commodity level."
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ width: 120 }}>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={defaultInput}
                onChange={(e) => setDefaultInput(e.target.value)}
                placeholder="0"
              />
            </div>
            <span style={{ fontSize: 13, color: "#64748b" }}>%</span>
            <BtnPrimary onClick={handleSaveDefault}>Save default</BtnPrimary>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Current: {defaultShrinkPercent ?? 0}%
            </span>
          </div>
        </SectionCard>

        {/* 2. Commodity type shrink */}
        <SectionCard
          title="2. Commodity type shrink"
          description="Overrides the default for all commodities under this type when no commodity-specific or customer–commodity shrink is set."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 120px 80px",
              gap: 8,
              alignItems: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            <span>Commodity type</span>
            <span>Shrink %</span>
            <span />
          </div>
          {commodityTypes.map((t) => (
            <div
              key={t.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px 80px",
                gap: 8,
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>
                {t.name}
              </span>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={t.shrinkPercent === null || t.shrinkPercent === undefined ? "" : String(t.shrinkPercent)}
                onChange={(e) => handleCommodityTypeShrinkChange(t.id, e.target.value)}
                placeholder="Default"
              />
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                {t.shrinkPercent != null ? "Override" : "Uses default"}
              </span>
            </div>
          ))}
        </SectionCard>

        {/* 3. Commodity shrink */}
        <SectionCard
          title="3. Commodity shrink"
          description="Overrides commodity type and default for this commodity when no customer–commodity agreement exists."
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 120px 80px",
              gap: 8,
              alignItems: "center",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 8,
            }}
          >
            <span>Commodity</span>
            <span>Type</span>
            <span>Shrink %</span>
            <span />
          </div>
          {commodities.map((c) => {
            const type = commodityTypes.find((t) => t.id === c.commodityTypeId);
            return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 120px 80px",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>
                  {c.description || c.commodityCode}
                </span>
                <span style={{ fontSize: 12, color: "#64748b" }}>{type?.name ?? "—"}</span>
                <Input
                  type="text"
                  value={parseDisplayPercent(c.shrinkAmount ?? "")}
                  onChange={(e) => handleCommodityShrinkChange(c.id, e.target.value)}
                  placeholder="Type/default"
                />
                <span style={{ fontSize: 11, color: "#94a3b8" }}>%</span>
              </div>
            );
          })}
        </SectionCard>

        {/* 4. Customer–commodity shrink */}
        <SectionCard
          title="4. Customer–commodity shrink (special agreements)"
          description="Overrides all other shrink for tickets for this customer and commodity combination."
        >
          <div style={{ marginBottom: 12 }}>
            <BtnPrimary onClick={openAddCc} style={{ fontSize: 12 }}>
              + Add customer–commodity shrink
            </BtnPrimary>
          </div>
          {customerCommodityShrink.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              No customer–commodity agreements. Add one to apply a special shrink % for a specific customer and commodity.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 100px 100px",
                gap: 8,
                alignItems: "center",
                fontSize: 11,
                fontWeight: 600,
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              <span>Customer</span>
              <span>Commodity</span>
              <span>Shrink %</span>
              <span>Actions</span>
            </div>
          )}
          {customerCommodityShrink.map((e) => {
            const customer = customers.find((c) => c.id === e.customerId);
            const commodity = commodities.find((c) => c.id === e.commodityId);
            return (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 100px 100px",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500, color: "#1e293b" }}>
                  {customer?.name ?? `Customer #${e.customerId}`}
                </span>
                <span style={{ color: "#475569" }}>
                  {commodity ? (commodity.description || commodity.commodityCode) : `Commodity #${e.commodityId}`}
                </span>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>{e.shrinkPercent}%</span>
                <span style={{ display: "flex", gap: 4 }}>
                  <BtnSecondary onClick={() => openEditCc(e)} style={{ padding: "4px 8px", fontSize: 11 }}>
                    Edit
                  </BtnSecondary>
                  <BtnDanger
                    onClick={() => {
                      if (window.confirm("Remove this customer–commodity shrink?")) {
                        deleteCustomerCommodityShrinkEntry(e.id);
                      }
                    }}
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    Delete
                  </BtnDanger>
                </span>
              </div>
            );
          })}
        </SectionCard>
      </div>

      {/* Modal: Add/Edit customer–commodity shrink */}
      <Modal
        open={ccModalOpen}
        onClose={() => setCcModalOpen(false)}
        title={ccEditId ? "Edit customer–commodity shrink" : "Add customer–commodity shrink"}
        width={440}
      >
        <FormRow label="Customer" required>
          <Select
            value={ccForm.customerId}
            onChange={(e) => setCcForm({ ...ccForm, customerId: e.target.value })}
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Commodity" required>
          <Select
            value={ccForm.commodityId}
            onChange={(e) => setCcForm({ ...ccForm, commodityId: e.target.value })}
          >
            <option value="">Select commodity</option>
            {commodities.map((c) => {
              const type = commodityTypes.find((t) => t.id === c.commodityTypeId);
              return (
                <option key={c.id} value={c.id}>
                  {c.description || c.commodityCode} ({type?.name})
                </option>
              );
            })}
          </Select>
        </FormRow>
        <FormRow label="Shrink %" required>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.1}
              value={ccForm.shrinkPercent}
              onChange={(e) => setCcForm({ ...ccForm, shrinkPercent: e.target.value })}
              placeholder="0"
            />
            <span style={{ fontSize: 13, color: "#64748b" }}>%</span>
          </div>
        </FormRow>
        <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
          <BtnSecondary onClick={() => setCcModalOpen(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSaveCc}>
            {ccEditId ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
