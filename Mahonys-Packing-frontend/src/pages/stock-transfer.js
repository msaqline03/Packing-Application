"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import {
  Navbar,
  BtnPrimary,
  BtnSecondary,
  FormRow,
  Select,
} from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function StockTransferPage() {
  const router = useRouter();
  const {
    stockLocations,
    commodityTypes,
    commodities,
    internalAccounts,
    currentSite,
    setCurrentSite,
    calculateLocationStock,
    addTicket,
    cmos,
    addCmo,
  } = useApp();

  const [transfer, setTransfer] = useState({
    commodityTypeId: null,
    commodityId: null,
    fromLocationId: null,
    toLocationId: null,
    quantity: "",
    reason: "",
    reference: "",
  });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const set = (key, value) =>
    setTransfer((prev) => ({ ...prev, [key]: value }));

  // Get available locations for site
  const availableLocations = stockLocations.filter(
    (loc) => loc.site === currentSite && loc.status === "active"
  );

  // Get commodities for selected type
  const availableCommodities = useMemo(() => {
    if (!transfer.commodityTypeId) return [];
    return commodities.filter(
      (c) =>
        c.commodityTypeId === transfer.commodityTypeId && c.status === "active"
    );
  }, [transfer.commodityTypeId, commodities]);

  // Calculate available stock at from location
  const availableStock = useMemo(() => {
    if (!transfer.fromLocationId || !transfer.commodityTypeId) return 0;
    return calculateLocationStock(
      transfer.fromLocationId,
      transfer.commodityTypeId
    );
  }, [
    transfer.fromLocationId,
    transfer.commodityTypeId,
    calculateLocationStock,
  ]);

  // Get or create transfer internal account
  const transferAccount =
    internalAccounts.find((a) => a.name === "Inter-Site Transfer") ||
    internalAccounts[0];

  // Validation
  const canTransfer =
    transfer.commodityTypeId &&
    transfer.commodityId &&
    transfer.fromLocationId &&
    transfer.toLocationId &&
    transfer.fromLocationId !== transfer.toLocationId &&
    transfer.quantity &&
    parseFloat(transfer.quantity) > 0 &&
    parseFloat(transfer.quantity) * 1000 <= availableStock;

  const handleTransfer = () => {
    if (!canTransfer) return;

    const quantityKg = parseFloat(transfer.quantity) * 1000;

    // Find or create a transfer CMO for this commodity
    let transferCmo = cmos.find(
      (c) =>
        c.customerId === transferAccount.id &&
        c.commodityId === transfer.commodityId &&
        c.direction === "in" &&
        c.status === "Active"
    );

    if (!transferCmo) {
      // Create new transfer CMO
      const newCmo = {
        direction: "in",
        customerId: transferAccount.id,
        commodityTypeId: transfer.commodityTypeId,
        commodityId: transfer.commodityId,
        status: "Active",
        estimatedAmount: 0,
        actualAmountDelivered: 0,
        additionalReferences: ["STOCK-TRANSFER"],
        note: "Stock transfer CMO - auto-created",
        attachments: [],
        bookings: [],
      };
      addCmo(newCmo);

      // Get the newly created CMO
      transferCmo = cmos[cmos.length - 1] || newCmo;
    }

    // Create outgoing ticket (remove from source)
    const outTicket = {
      type: "out",
      site: currentSite,
      status: "completed",
      cmoId: transferCmo.id,
      truck: { id: 0, name: "TRANSFER", driver: "System", tare: 0 },
      customerId: transferAccount.id,
      commodityTypeId: transfer.commodityTypeId,
      commodityId: transfer.commodityId,
      grossWeights: [quantityKg],
      tareWeights: [0],
      grossWeightDateTimes: [new Date().toISOString()],
      tareWeightDateTimes: [new Date().toISOString()],
      splitLoad: false,
      tests: {},
      commodityConfirmed: true,
      commodityOverrideReason: "",
      signoff: "AUTO-TRANSFER",
      loadingLocation: transfer.fromLocationId,
      notes: `Stock Transfer: ${transfer.reason || "Internal transfer"}${
        transfer.reference ? ` - Ref: ${transfer.reference}` : ""
      }`,
      ticketReference: `TRANS-OUT-${Date.now()}`,
      additionalReference: transfer.reference || "",
      date: new Date().toISOString().split("T")[0],
    };

    // Create incoming ticket (add to destination)
    const inTicket = {
      type: "in",
      site: currentSite,
      status: "completed",
      cmoId: transferCmo.id,
      truck: { id: 0, name: "TRANSFER", driver: "System", tare: 0 },
      customerId: transferAccount.id,
      commodityTypeId: transfer.commodityTypeId,
      commodityId: transfer.commodityId,
      grossWeights: [quantityKg],
      tareWeights: [0],
      grossWeightDateTimes: [new Date().toISOString()],
      tareWeightDateTimes: [new Date().toISOString()],
      splitLoad: false,
      tests: {},
      commodityConfirmed: true,
      commodityOverrideReason: "",
      signoff: "AUTO-TRANSFER",
      unloadedLocation: transfer.toLocationId,
      notes: `Stock Transfer: ${transfer.reason || "Internal transfer"}${
        transfer.reference ? ` - Ref: ${transfer.reference}` : ""
      }`,
      ticketReference: `TRANS-IN-${Date.now()}`,
      additionalReference: transfer.reference || "",
      date: new Date().toISOString().split("T")[0],
    };

    // Add both tickets
    addTicket(outTicket);
    addTicket(inTicket);

    setShowConfirmation(true);
    setTimeout(() => {
      router.push("/account-balances");
    }, 2000);
  };

  const fromLocation = availableLocations.find(
    (l) => l.id === transfer.fromLocationId
  );
  const toLocation = availableLocations.find(
    (l) => l.id === transfer.toLocationId
  );
  const selectedCommodity = commodities.find(
    (c) => c.id === transfer.commodityId
  );

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
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#0f1e3d",
              margin: 0,
            }}
          >
            Stock Transfer
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnSecondary onClick={() => router.push("/account-balances")}>
              ← Account Balances
            </BtnSecondary>
            <BtnSecondary onClick={() => router.push("/transactions")}>
              View Transactions
            </BtnSecondary>
          </div>
        </div>

        {/* Info Banner */}
        <div
          style={{
            background: "#dbeafe",
            border: "1px solid #93c5fd",
            borderRadius: 8,
            padding: "12px 16px",
            fontSize: 12,
            color: "#1e40af",
          }}
        >
          <strong>Note:</strong> Stock transfers create paired tickets to move
          stock between locations. The stock will be removed from the source
          location and added to the destination location.
        </div>

        {/* Transfer Form */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "20px 24px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Commodity Type */}
            <FormRow label="Commodity Type" required>
              <Select
                value={transfer.commodityTypeId || ""}
                onChange={(e) => {
                  set("commodityTypeId", Number(e.target.value) || null);
                  set("commodityId", null); // Reset commodity
                }}
              >
                <option value="">— Select Commodity Type —</option>
                {commodityTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </Select>
            </FormRow>

            {/* Commodity */}
            <FormRow label="Commodity" required>
              <Select
                value={transfer.commodityId || ""}
                onChange={(e) =>
                  set("commodityId", Number(e.target.value) || null)
                }
                disabled={!transfer.commodityTypeId}
              >
                <option value="">— Select Commodity —</option>
                {availableCommodities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.description} ({c.commodityCode})
                  </option>
                ))}
              </Select>
            </FormRow>

            {/* From Location */}
            <FormRow label="From Location" required>
              <Select
                value={transfer.fromLocationId || ""}
                onChange={(e) =>
                  set("fromLocationId", Number(e.target.value) || null)
                }
              >
                <option value="">— Select Source Location —</option>
                {availableLocations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.locationType})
                  </option>
                ))}
              </Select>
              {transfer.fromLocationId && transfer.commodityTypeId && (
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                  Available: {availableStock.toFixed(2)} t
                </div>
              )}
            </FormRow>

            {/* To Location */}
            <FormRow label="To Location" required>
              <Select
                value={transfer.toLocationId || ""}
                onChange={(e) =>
                  set("toLocationId", Number(e.target.value) || null)
                }
              >
                <option value="">— Select Destination Location —</option>
                {availableLocations
                  .filter((loc) => loc.id !== transfer.fromLocationId)
                  .map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} ({loc.locationType})
                    </option>
                  ))}
              </Select>
            </FormRow>

            {/* Quantity */}
            <FormRow label="Quantity (tonnes)" required>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={transfer.quantity}
                onChange={(e) => set("quantity", e.target.value)}
                placeholder="0.00"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              {transfer.quantity &&
                parseFloat(transfer.quantity) * 1000 > availableStock && (
                  <div style={{ fontSize: 11, color: "#dc2626", marginTop: 4 }}>
                    Exceeds available stock
                  </div>
                )}
            </FormRow>

            {/* Reference */}
            <FormRow label="Reference">
              <input
                type="text"
                value={transfer.reference}
                onChange={(e) => set("reference", e.target.value)}
                placeholder="Optional reference number"
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </FormRow>

            {/* Reason */}
            <FormRow label="Reason">
              <textarea
                value={transfer.reason}
                onChange={(e) => set("reason", e.target.value)}
                placeholder="Reason for transfer..."
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  resize: "vertical",
                  minHeight: 60,
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Segoe UI', sans-serif",
                }}
              />
            </FormRow>
          </div>
        </div>

        {/* Summary */}
        {canTransfer && (
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              padding: "16px 20px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0f1e3d",
                marginBottom: 12,
              }}
            >
              Transfer Summary
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                fontSize: 12.5,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>Commodity:</span>
                <span style={{ fontWeight: 600, color: "#0f1e3d" }}>
                  {selectedCommodity?.description}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>From:</span>
                <span style={{ fontWeight: 600, color: "#dc2626" }}>
                  {fromLocation?.name}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748b" }}>To:</span>
                <span style={{ fontWeight: 600, color: "#059669" }}>
                  {toLocation?.name}
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  paddingTop: 8,
                  borderTop: "1px solid #f1f5f9",
                }}
              >
                <span style={{ color: "#64748b" }}>Quantity:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: "#3b82f6",
                    fontSize: 14,
                  }}
                >
                  {parseFloat(transfer.quantity).toFixed(2)} t
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <BtnPrimary
            onClick={handleTransfer}
            disabled={!canTransfer}
            style={{
              flex: 1,
              justifyContent: "center",
              fontSize: 14,
            }}
          >
            Execute Transfer
          </BtnPrimary>
          <BtnSecondary
            onClick={() =>
              setTransfer({
                commodityTypeId: null,
                commodityId: null,
                fromLocationId: null,
                toLocationId: null,
                quantity: "",
                reason: "",
                reference: "",
              })
            }
            style={{
              fontSize: 14,
            }}
          >
            Clear
          </BtnSecondary>
        </div>

        {!canTransfer && (
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              textAlign: "center",
            }}
          >
            Complete all required fields with valid values to execute transfer
          </div>
        )}
      </div>

      {/* Success Confirmation */}
      {showConfirmation && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "24px 32px",
              maxWidth: 400,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#d1fae5",
                color: "#059669",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                margin: "0 auto 16px",
              }}
            >
              ✓
            </div>
            <div
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "#0f1e3d",
                marginBottom: 8,
              }}
            >
              Transfer Complete!
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>
              {parseFloat(transfer.quantity).toFixed(2)} t of{" "}
              {selectedCommodity?.description} has been transferred from{" "}
              {fromLocation?.name} to {toLocation?.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
