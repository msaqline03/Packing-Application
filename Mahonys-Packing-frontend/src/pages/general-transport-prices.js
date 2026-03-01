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
        <h3
          style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f1e3d" }}
        >
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

export default function GeneralTransportPricesPage() {
  const {
    transporters,
    currentSite,
    setCurrentSite,
    transporterTransportPrices,
    addTransporterTransportPrice,
    updateTransporterTransportPrice,
    deleteTransporterTransportPrice,
  } = useApp();

  const containerSizes = CONTAINER_SIZES;

  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    transporterId: "",
    containerSize: "",
    price: "",
    lineItemDescription: "",
  });

  const openAdd = () => {
    setEditId(null);
    setForm({
      transporterId: "",
      containerSize: containerSizes[0] || "",
      price: "",
      lineItemDescription: "",
    });
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditId(entry.id);
    setForm({
      transporterId: String(entry.transporterId),
      containerSize: entry.containerSize,
      price: entry.price == null ? "" : String(entry.price),
      lineItemDescription: entry.lineItemDescription ?? "",
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.transporterId || !form.containerSize) {
      alert("Select transporter and container size.");
      return;
    }
    const num = form.price.trim() === "" ? 0 : parseFloat(form.price);
    if (form.price.trim() !== "" && (Number.isNaN(num) || num < 0)) {
      alert("Enter a valid price (≥ 0).");
      return;
    }
    if (editId) {
      updateTransporterTransportPrice(editId, {
        transporterId: Number(form.transporterId),
        containerSize: form.containerSize,
        price: num,
        lineItemDescription: (form.lineItemDescription || "").trim(),
      });
    } else {
      addTransporterTransportPrice({
        transporterId: Number(form.transporterId),
        containerSize: form.containerSize,
        price: num,
        lineItemDescription: (form.lineItemDescription || "").trim(),
      });
    }
    setModalOpen(false);
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
          General Transport Prices
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Set transport price per transporter and container size.
        </p>

        <SectionCard
          title="Transporter transport prices"
          description="Set price and line-item description per transporter and container size."
        >
          <div style={{ marginBottom: 12 }}>
            <BtnPrimary onClick={openAdd} style={{ fontSize: 12 }}>
              + Add transporter transport price
            </BtnPrimary>
          </div>
          {transporterTransportPrices.length === 0 ? (
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              No transport prices yet. Add one to set price per transporter and
              container size.
            </p>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 80px 1fr 100px 100px",
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
              <span>Transporter</span>
              <span>Size</span>
              <span>Line-item description</span>
              <span>Price</span>
              <span>Actions</span>
            </div>
          )}
          {transporterTransportPrices.map((e) => {
            const transporter = transporters.find((t) => t.id === e.transporterId);
            return (
              <div
                key={e.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 80px 1fr 100px 100px",
                  gap: 8,
                  alignItems: "center",
                  padding: "8px 0",
                  borderBottom: "1px solid #f1f5f9",
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 500, color: "#1e293b" }}>
                  {transporter?.name ?? `Transporter #${e.transporterId}`}
                </span>
                <span style={{ color: "#475569" }}>{e.containerSize}</span>
                <span
                  style={{
                    color: "#64748b",
                    fontSize: 12,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {e.lineItemDescription || "—"}
                </span>
                <span style={{ fontWeight: 600, color: "#2563eb" }}>
                  {e.price != null ? Number(e.price).toFixed(2) : "—"}
                </span>
                <span style={{ display: "flex", gap: 4 }}>
                  <BtnSecondary
                    onClick={() => openEdit(e)}
                    style={{ padding: "4px 8px", fontSize: 11 }}
                  >
                    Edit
                  </BtnSecondary>
                  <BtnDanger
                    onClick={() => {
                      if (
                        window.confirm(
                          "Remove this transporter transport price?"
                        )
                      ) {
                        deleteTransporterTransportPrice(e.id);
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

      {/* Modal: Add/Edit transporter transport price */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          editId ? "Edit transporter transport price" : "Add transporter transport price"
        }
        width={460}
      >
        <FormRow label="Transporter" required>
          <Select
            value={form.transporterId}
            onChange={(e) =>
              setForm({ ...form, transporterId: e.target.value })
            }
          >
            <option value="">Select transporter</option>
            {transporters.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.code})
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Container size" required>
          <Select
            value={form.containerSize}
            onChange={(e) =>
              setForm({ ...form, containerSize: e.target.value })
            }
          >
            {containerSizes.map((sz) => (
              <option key={sz} value={sz}>
                {sz}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Line-item description">
          <Input
            value={form.lineItemDescription}
            onChange={(e) =>
              setForm({ ...form, lineItemDescription: e.target.value })
            }
            placeholder="e.g. Transport - 20ft"
          />
        </FormRow>
        <FormRow label="Price" required>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
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
          <BtnSecondary onClick={() => setModalOpen(false)}>Cancel</BtnSecondary>
          <BtnPrimary onClick={handleSave}>
            {editId ? "Save" : "Add"}
          </BtnPrimary>
        </div>
      </Modal>
    </div>
  );
}
