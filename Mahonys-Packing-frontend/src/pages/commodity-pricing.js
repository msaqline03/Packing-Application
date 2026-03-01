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
} from "../components/SharedComponents";
import { SITES, CONTAINER_SIZES } from "../utils/mockData";

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

export default function CommodityPricingPage() {
  const {
    commodityTypes,
    commodities,
    customers,
    currentSite,
    setCurrentSite,
    defaultPackingPrices,
    commodityPrices,
    commodityTypeCustomerPrices,
    commodityCustomerPrices,
    addDefaultPackingPrice,
    updateDefaultPackingPrice,
    addCommodityPrice,
    updateCommodityPrice,
    deleteCommodityPrice,
    addCommodityTypeCustomerPrice,
    updateCommodityTypeCustomerPrice,
    deleteCommodityTypeCustomerPrice,
    addCommodityCustomerPrice,
    updateCommodityCustomerPrice,
    deleteCommodityCustomerPrice,
  } = useApp();

  const containerSizes = CONTAINER_SIZES;

  const getDefaultPrice = (commodityTypeId, containerSize) => {
    const e = defaultPackingPrices.find(
      (p) =>
        p.commodityTypeId === commodityTypeId &&
        p.containerSize === containerSize,
    );
    return e;
  };

  const [cpModalOpen, setCpModalOpen] = useState(false);
  const [cpEditId, setCpEditId] = useState(null);
  const [cpForm, setCpForm] = useState({
    commodityId: "",
    containerSize: "",
    price: "",
  });

  const [ctcpModalOpen, setCtcpModalOpen] = useState(false);
  const [ctcpEditId, setCtcpEditId] = useState(null);
  const [ctcpForm, setCtcpForm] = useState({
    customerId: "",
    commodityTypeId: "",
    containerSize: "",
    price: "",
  });

  const [ccpModalOpen, setCcpModalOpen] = useState(false);
  const [ccpEditId, setCcpEditId] = useState(null);
  const [ccpForm, setCcpForm] = useState({
    customerId: "",
    commodityId: "",
    containerSize: "",
    price: "",
  });

  const handleDefaultPriceChange = (commodityTypeId, containerSize, value) => {
    const trimmed = value.trim();
    const num = trimmed === "" ? null : parseFloat(trimmed);
    if (trimmed !== "" && (Number.isNaN(num) || num < 0)) return;
    const existing = getDefaultPrice(commodityTypeId, containerSize);
    if (existing) {
      if (trimmed === "") {
        updateDefaultPackingPrice(existing.id, { price: 0 });
      } else {
        updateDefaultPackingPrice(existing.id, { price: num });
      }
    } else {
      if (trimmed !== "" && !Number.isNaN(num)) {
        addDefaultPackingPrice({
          commodityTypeId,
          containerSize,
          price: num,
        });
      }
    }
  };

  const openAddCp = () => {
    setCpEditId(null);
    setCpForm({
      commodityId: "",
      containerSize: containerSizes[0] || "",
      price: "",
    });
    setCpModalOpen(true);
  };

  const openEditCp = (entry) => {
    setCpEditId(entry.id);
    setCpForm({
      commodityId: String(entry.commodityId),
      containerSize: entry.containerSize,
      price: entry.price == null ? "" : String(entry.price),
    });
    setCpModalOpen(true);
  };

  const handleSaveCp = () => {
    if (!cpForm.commodityId || !cpForm.containerSize) {
      alert("Select commodity and container size.");
      return;
    }
    const num =
      cpForm.price.trim() === "" ? 0 : parseFloat(cpForm.price);
    if (cpForm.price.trim() !== "" && (Number.isNaN(num) || num < 0)) {
      alert("Enter a valid price (≥ 0).");
      return;
    }
    if (cpEditId) {
      const entry = commodityPrices.find((e) => e.id === cpEditId);
      if (entry) {
        updateCommodityPrice(cpEditId, {
          commodityId: Number(cpForm.commodityId),
          containerSize: cpForm.containerSize,
          price: num,
        });
      }
    } else {
      addCommodityPrice({
        commodityId: Number(cpForm.commodityId),
        containerSize: cpForm.containerSize,
        price: num,
      });
    }
    setCpModalOpen(false);
  };

  const openAddCtcp = () => {
    setCtcpEditId(null);
    setCtcpForm({
      customerId: "",
      commodityTypeId: "",
      containerSize: containerSizes[0] || "",
      price: "",
    });
    setCtcpModalOpen(true);
  };

  const openEditCtcp = (entry) => {
    setCtcpEditId(entry.id);
    setCtcpForm({
      customerId: String(entry.customerId),
      commodityTypeId: String(entry.commodityTypeId),
      containerSize: entry.containerSize,
      price: entry.price == null ? "" : String(entry.price),
    });
    setCtcpModalOpen(true);
  };

  const handleSaveCtcp = () => {
    if (
      !ctcpForm.customerId ||
      !ctcpForm.commodityTypeId ||
      !ctcpForm.containerSize
    ) {
      alert("Select customer, commodity type, and container size.");
      return;
    }
    const num =
      ctcpForm.price.trim() === "" ? 0 : parseFloat(ctcpForm.price);
    if (ctcpForm.price.trim() !== "" && (Number.isNaN(num) || num < 0)) {
      alert("Enter a valid price (≥ 0).");
      return;
    }
    if (ctcpEditId) {
      updateCommodityTypeCustomerPrice(ctcpEditId, {
        customerId: Number(ctcpForm.customerId),
        commodityTypeId: Number(ctcpForm.commodityTypeId),
        containerSize: ctcpForm.containerSize,
        price: num,
      });
    } else {
      addCommodityTypeCustomerPrice({
        customerId: Number(ctcpForm.customerId),
        commodityTypeId: Number(ctcpForm.commodityTypeId),
        containerSize: ctcpForm.containerSize,
        price: num,
      });
    }
    setCtcpModalOpen(false);
  };

  const openAddCcp = () => {
    setCcpEditId(null);
    setCcpForm({
      customerId: "",
      commodityId: "",
      containerSize: containerSizes[0] || "",
      price: "",
    });
    setCcpModalOpen(true);
  };

  const openEditCcp = (entry) => {
    setCcpEditId(entry.id);
    setCcpForm({
      customerId: String(entry.customerId),
      commodityId: String(entry.commodityId),
      containerSize: entry.containerSize,
      price: entry.price == null ? "" : String(entry.price),
    });
    setCcpModalOpen(true);
  };

  const handleSaveCcp = () => {
    if (!ccpForm.customerId || !ccpForm.commodityId || !ccpForm.containerSize) {
      alert("Select customer, commodity, and container size.");
      return;
    }
    const num =
      ccpForm.price.trim() === "" ? 0 : parseFloat(ccpForm.price);
    if (ccpForm.price.trim() !== "" && (Number.isNaN(num) || num < 0)) {
      alert("Enter a valid price (≥ 0).");
      return;
    }
    if (ccpEditId) {
      updateCommodityCustomerPrice(ccpEditId, {
        customerId: Number(ccpForm.customerId),
        commodityId: Number(ccpForm.commodityId),
        containerSize: ccpForm.containerSize,
        price: num,
      });
    } else {
      addCommodityCustomerPrice({
        customerId: Number(ccpForm.customerId),
        commodityId: Number(ccpForm.commodityId),
        containerSize: ccpForm.containerSize,
        price: num,
      });
    }
    setCcpModalOpen(false);
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
          General Pack Pricing
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Packing prices are resolved in order:{" "}
          <strong>Commodity+Customer</strong> (specific commodity) →{" "}
          <strong>Commodity Type+Customer</strong> (all commodities of that type) →{" "}
          <strong>Commodity</strong> → <strong>Default (by commodity type)</strong>.
          The first price set wins.
        </p>

        {/* 1. Default packing price (by commodity type × container size) */}
        <SectionCard
          title="1. Default packing price"
          description="Set on the commodity type for each container size. Used when no commodity-specific or customer-specific price exists."
        >
          {containerSizes.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              No container sizes defined. Add container codes first.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: `160px repeat(${containerSizes.length}, 100px)`,
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
                {containerSizes.map((sz) => (
                  <span key={sz}>{sz}</span>
                ))}
              </div>
              {commodityTypes.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: `160px repeat(${containerSizes.length}, 100px)`,
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}
                  >
                    {t.name}
                  </span>
                  {containerSizes.map((sz) => {
                    const entry = getDefaultPrice(t.id, sz);
                    const value =
                      entry != null && entry.price != null
                        ? String(entry.price)
                        : "";
                    return (
                      <Input
                        key={sz}
                        type="number"
                        min={0}
                        step={0.01}
                        value={value}
                        onChange={(e) =>
                          handleDefaultPriceChange(
                            t.id,
                            sz,
                            e.target.value,
                          )
                        }
                        placeholder="—"
                        style={{ width: "100%", boxSizing: "border-box" }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* 2. Commodity price */}
        <SectionCard
          title="2. Commodity price"
          description="Each commodity may have a separate price per container size. Overrides the default packing price."
        >
          <div style={{ marginBottom: 12 }}>
            <BtnPrimary onClick={openAddCp} style={{ fontSize: 12 }}>
              + Add commodity price
            </BtnPrimary>
          </div>
          {commodityPrices.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              No commodity-level prices. Add one to override the default for a
              commodity and container size.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 100px 100px",
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
              <span>Size</span>
              <span>Price</span>
              <span>Actions</span>
            </div>
          )}
          {commodityPrices.map((e) => {
            const commodity = commodities.find((c) => c.id === e.commodityId);
            const type = commodityTypes.find(
              (t) => t.id === commodity?.commodityTypeId,
            );
            return (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 100px 100px",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500, color: "#1e293b" }}>
                  {commodity
                    ? `${commodity.description || commodity.commodityCode} (${type?.name ?? ""})`
                    : `Commodity #${e.commodityId}`}
                </span>
                <span style={{ color: "#475569" }}>{e.containerSize}</span>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {e.price != null ? Number(e.price).toFixed(2) : "—"}
                </span>
                <span style={{ display: "flex", gap: 4 }}>
                  <BtnSecondary
                    onClick={() => openEditCp(e)}
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    Edit
                  </BtnSecondary>
                  <BtnDanger
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this commodity price? Default will apply."
                        )
                      ) {
                        deleteCommodityPrice(e.id);
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

        {/* 3. Commodity Type + Customer price */}
        <SectionCard
          title="3. Commodity Type + Customer price (contract)"
          description="Special price for a customer applied to all commodities of a given type. Overrides commodity and default for that customer."
        >
          <div style={{ marginBottom: 12 }}>
            <BtnPrimary onClick={openAddCtcp} style={{ fontSize: 12 }}>
              + Add commodity type + customer price
            </BtnPrimary>
          </div>
          {commodityTypeCustomerPrices.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              No commodity-type + customer prices. Add one to apply a special
              price for a customer across all commodities of a type.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px 100px 100px",
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
              <span>Commodity type</span>
              <span>Size</span>
              <span>Price</span>
              <span>Actions</span>
            </div>
          )}
          {commodityTypeCustomerPrices.map((e) => {
            const customer = customers.find((c) => c.id === e.customerId);
            const type = commodityTypes.find((t) => t.id === e.commodityTypeId);
            return (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 80px 100px 100px",
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
                  {type?.name ?? `Type #${e.commodityTypeId}`}
                </span>
                <span style={{ color: "#475569" }}>{e.containerSize}</span>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {e.price != null ? Number(e.price).toFixed(2) : "—"}
                </span>
                <span style={{ display: "flex", gap: 4 }}>
                  <BtnSecondary
                    onClick={() => openEditCtcp(e)}
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    Edit
                  </BtnSecondary>
                  <BtnDanger
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this commodity type + customer price?"
                        )
                      ) {
                        deleteCommodityTypeCustomerPrice(e.id);
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

        {/* 4. Commodity + Customer price */}
        <SectionCard
          title="4. Commodity + Customer price (contract)"
          description="Special price for a customer on a specific commodity. Overrides commodity type + customer, commodity, and default."
        >
          <div style={{ marginBottom: 12 }}>
            <BtnPrimary onClick={openAddCcp} style={{ fontSize: 12 }}>
              + Add commodity + customer price
            </BtnPrimary>
          </div>
          {commodityCustomerPrices.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              No commodity + customer prices. Add one for a specific customer
              and commodity per container size.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 80px 100px 100px",
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
              <span>Size</span>
              <span>Price</span>
              <span>Actions</span>
            </div>
          )}
          {commodityCustomerPrices.map((e) => {
            const customer = customers.find((c) => c.id === e.customerId);
            const commodity = commodities.find((c) => c.id === e.commodityId);
            const type = commodityTypes.find(
              (t) => t.id === commodity?.commodityTypeId,
            );
            return (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 80px 100px 100px",
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
                  {commodity
                    ? `${commodity.description || commodity.commodityCode} (${type?.name ?? ""})`
                    : `Commodity #${e.commodityId}`}
                </span>
                <span style={{ color: "#475569" }}>{e.containerSize}</span>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {e.price != null ? Number(e.price).toFixed(2) : "—"}
                </span>
                <span style={{ display: "flex", gap: 4 }}>
                  <BtnSecondary
                    onClick={() => openEditCcp(e)}
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    Edit
                  </BtnSecondary>
                  <BtnDanger
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this customer–commodity price?"
                        )
                      ) {
                        deleteCommodityCustomerPrice(e.id);
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

      {/* Modal: Add/Edit commodity price */}
      <Modal
        open={cpModalOpen}
        onClose={() => setCpModalOpen(false)}
        title={cpEditId ? "Edit commodity price" : "Add commodity price"}
        width={440}
      >
        <FormRow label="Commodity" required>
          <Select
            value={cpForm.commodityId}
            onChange={(e) =>
              setCpForm({ ...cpForm, commodityId: e.target.value })
            }
          >
            <option value="">Select commodity</option>
            {commodities.map((c) => {
              const type = commodityTypes.find(
                (t) => t.id === c.commodityTypeId,
              );
              return (
                <option key={c.id} value={c.id}>
                  {c.description || c.commodityCode} ({type?.name})
                </option>
              );
            })}
          </Select>
        </FormRow>
        <FormRow label="Container size" required>
          <Select
            value={cpForm.containerSize}
            onChange={(e) =>
              setCpForm({ ...cpForm, containerSize: e.target.value })
            }
          >
            {containerSizes.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Price" required>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={cpForm.price}
            onChange={(e) => setCpForm({ ...cpForm, price: e.target.value })}
            placeholder="0"
          />
        </FormRow>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
          <BtnSecondary onClick={() => setCpModalOpen(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSaveCp}>
            {cpEditId ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>

      {/* Modal: Add/Edit commodity type + customer price */}
      <Modal
        open={ctcpModalOpen}
        onClose={() => setCtcpModalOpen(false)}
        title={
          ctcpEditId
            ? "Edit commodity type + customer price"
            : "Add commodity type + customer price"
        }
        width={440}
      >
        <FormRow label="Customer" required>
          <Select
            value={ctcpForm.customerId}
            onChange={(e) =>
              setCtcpForm({ ...ctcpForm, customerId: e.target.value })
            }
          >
            <option value="">Select customer</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Commodity type" required>
          <Select
            value={ctcpForm.commodityTypeId}
            onChange={(e) =>
              setCtcpForm({ ...ctcpForm, commodityTypeId: e.target.value })
            }
          >
            <option value="">Select commodity type</option>
            {commodityTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Container size" required>
          <Select
            value={ctcpForm.containerSize}
            onChange={(e) =>
              setCtcpForm({ ...ctcpForm, containerSize: e.target.value })
            }
          >
            {containerSizes.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Price" required>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={ctcpForm.price}
            onChange={(e) =>
              setCtcpForm({ ...ctcpForm, price: e.target.value })
            }
            placeholder="0"
          />
        </FormRow>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
          <BtnSecondary onClick={() => setCtcpModalOpen(false)}>
            Cancel
          </BtnSecondary>
          <BtnPrimary onClick={handleSaveCtcp}>
            {ctcpEditId ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>

      {/* Modal: Add/Edit commodity + customer price */}
      <Modal
        open={ccpModalOpen}
        onClose={() => setCcpModalOpen(false)}
        title={
          ccpEditId
            ? "Edit commodity + customer price"
            : "Add commodity + customer price"
        }
        width={440}
      >
        <FormRow label="Customer" required>
          <Select
            value={ccpForm.customerId}
            onChange={(e) =>
              setCcpForm({ ...ccpForm, customerId: e.target.value })
            }
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
            value={ccpForm.commodityId}
            onChange={(e) =>
              setCcpForm({ ...ccpForm, commodityId: e.target.value })
            }
          >
            <option value="">Select commodity</option>
            {commodities.map((c) => {
              const type = commodityTypes.find(
                (t) => t.id === c.commodityTypeId,
              );
              return (
                <option key={c.id} value={c.id}>
                  {c.description || c.commodityCode} ({type?.name})
                </option>
              );
            })}
          </Select>
        </FormRow>
        <FormRow label="Container size" required>
          <Select
            value={ccpForm.containerSize}
            onChange={(e) =>
              setCcpForm({ ...ccpForm, containerSize: e.target.value })
            }
          >
            {containerSizes.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Price" required>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={ccpForm.price}
            onChange={(e) => setCcpForm({ ...ccpForm, price: e.target.value })}
            placeholder="0"
          />
        </FormRow>
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            justifyContent: "flex-end",
          }}
        >
          <BtnSecondary onClick={() => setCcpModalOpen(false)}>
            Cancel
          </BtnSecondary>
          <BtnPrimary onClick={handleSaveCcp}>
            {ccpEditId ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
