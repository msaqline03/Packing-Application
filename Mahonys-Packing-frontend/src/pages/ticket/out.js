"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "../../context/AppContext";
import {
  Navbar,
  Modal,
  FormRow,
  Input,
  Select,
  BtnPrimary,
  BtnSecondary,
  BtnDanger,
  BtnGhost,
} from "../../components/SharedComponents";
import { SITES, BAY_LOCATIONS } from "../../utils/mockData";

export default function OutTicketPage() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    tickets,
    cmos,
    trucks,
    commodities,
    commodityTypes,
    stockLocations,
    customers,
    internalAccounts,
    users,
    currentSite,
    setCurrentSite,
    addTicket,
    updateTicket,
    addTruck,
    addCmo,
    getTransactionsByTicket,
  } = useApp();

  const ticketId = params.get("id") ? Number(params.get("id")) : null;
  const isCreate = params.get("mode") === "create";
  const existingTicket = ticketId
    ? tickets.find((t) => t.id === ticketId)
    : null;

  const blankTicket = {
    type: "out",
    site: currentSite,
    status: "booked",
    cmoId: null,
    truck: null,
    customerId: null,
    commodityTypeId: null,
    commodityId: null,
    grossWeights: [],
    tareWeights: [],
    grossWeightDateTimes: [],
    tareWeightDateTimes: [],
    splitLoad: false,
    tests: {},
    commodityConfirmed: true,
    commodityOverrideReason: "",
    signoff: "",
    loadingLocation: "",
    notes: "",
    ticketReference: "",
    additionalReference: "",
    date: new Date().toISOString().split("T")[0],
  };

  const [ticket, setTicket] = useState(existingTicket || blankTicket);
  const [showCmoModal, setShowCmoModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);

  useEffect(() => {
    if (existingTicket) {
      setTicket(existingTicket);
    }
  }, [existingTicket]);

  const cmo = ticket.cmoId ? cmos.find((c) => c.id === ticket.cmoId) : null;
  const commodity = ticket.commodityId
    ? commodities.find((c) => c.id === ticket.commodityId)
    : null;
  const commodityType = ticket.commodityTypeId
    ? commodityTypes.find((ct) => ct.id === ticket.commodityTypeId)
    : null;
  // Customer can be either a regular customer or an internal account
  const customer = ticket.customerId
    ? customers.find((cust) => cust.id === ticket.customerId) ||
      internalAccounts.find((acc) => acc.id === ticket.customerId)
    : null;
  const isCompleted = ticket.status === "completed";

  // Calculate remaining tonnage for the selected CMO
  const getRemainingTonnage = (cmoId) => {
    if (!cmoId) return null;
    const selectedCmo = cmos.find((c) => c.id === cmoId);
    if (!selectedCmo) return null;

    // Calculate total weight from completed out tickets for this CMO
    const totalDelivered = tickets
      .filter(
        (t) => t.type === "out" && t.status === "completed" && t.cmoId === cmoId
      )
      .reduce((sum, t) => {
        const netWeight =
          t.grossWeights.reduce((a, b) => a + b, 0) -
          t.tareWeights.reduce((a, b) => a + b, 0);
        return sum + netWeight;
      }, 0);

    const remaining = selectedCmo.estimatedAmount - totalDelivered;
    return {
      total: selectedCmo.estimatedAmount,
      delivered: totalDelivered,
      remaining,
    };
  };

  const set = (key, val) => setTicket((prev) => ({ ...prev, [key]: val }));

  // ── Location validation helper ──
  const getLocationStock = (locationId) => {
    const stockItems = [];

    // Process completed incoming tickets
    tickets
      .filter(
        (t) =>
          t.type === "in" &&
          t.status === "completed" &&
          t.unloadedLocation === locationId
      )
      .forEach((ticket) => {
        const tCmo = cmos.find((c) => c.id === ticket.cmoId);
        const tCommodityType = tCmo
          ? commodityTypes.find((ct) => ct.id === tCmo.commodityTypeId)
          : null;

        const netWeight =
          ticket.grossWeights.reduce((a, b) => a + b, 0) -
          ticket.tareWeights.reduce((a, b) => a + b, 0);

        if (netWeight > 0 && tCommodityType) {
          const existingItem = stockItems.find(
            (item) => item.commodityTypeId === tCommodityType.id
          );

          if (existingItem) {
            existingItem.weight += netWeight;
          } else {
            stockItems.push({
              commodityTypeId: tCommodityType.id,
              commodityTypeName: tCommodityType.name,
              weight: netWeight,
            });
          }
        }
      });

    // Subtract outgoing tickets
    tickets
      .filter(
        (t) =>
          t.type === "out" &&
          t.status === "completed" &&
          t.loadingLocation === locationId
      )
      .forEach((ticket) => {
        const tCmo = cmos.find((c) => c.id === ticket.cmoId);
        const tCommodityType = tCmo
          ? commodityTypes.find((ct) => ct.id === tCmo.commodityTypeId)
          : null;

        const netWeight =
          ticket.grossWeights.reduce((a, b) => a + b, 0) -
          ticket.tareWeights.reduce((a, b) => a + b, 0);

        if (netWeight > 0 && tCommodityType) {
          const existingItem = stockItems.find(
            (item) => item.commodityTypeId === tCommodityType.id
          );

          if (existingItem) {
            existingItem.weight -= netWeight;
            if (existingItem.weight <= 0) {
              stockItems.splice(stockItems.indexOf(existingItem), 1);
            }
          }
        }
      });

    return stockItems.filter((item) => item.weight > 0);
  };

  // Get valid loading locations (only locations with the selected commodity type)
  const getValidLoadingLocations = () => {
    if (!ticket.commodityTypeId) return [];

    return stockLocations
      .filter((loc) => loc.status === "active")
      .filter((loc) => {
        const stockItems = getLocationStock(loc.id);
        return stockItems.some(
          (item) => item.commodityTypeId === ticket.commodityTypeId
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  const addWeight = (type) => {
    set(type, [...ticket[type], 0]);
    const dateTimeType =
      type === "grossWeights" ? "grossWeightDateTimes" : "tareWeightDateTimes";
    set(dateTimeType, [...(ticket[dateTimeType] || []), ""]);
  };

  const updateWeight = (type, idx, val) => {
    const arr = [...ticket[type]];
    const prevValue = arr[idx];
    const newValue = Number(val) || 0;
    arr[idx] = newValue;
    set(type, arr);

    // Auto-fill date/time when weight value is first entered
    const dateTimeType =
      type === "grossWeights" ? "grossWeightDateTimes" : "tareWeightDateTimes";
    const dateTimeArr = [...(ticket[dateTimeType] || [])];

    // If there's no datetime yet and a weight value is being entered, set current datetime
    if (!dateTimeArr[idx] && newValue > 0 && prevValue === 0) {
      const now = new Date();
      const datetime = now.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
      dateTimeArr[idx] = datetime;
      set(dateTimeType, dateTimeArr);
    }
  };

  const updateWeightDateTime = (type, idx, val) => {
    const dateTimeType =
      type === "grossWeights" ? "grossWeightDateTimes" : "tareWeightDateTimes";
    const arr = [...(ticket[dateTimeType] || [])];
    arr[idx] = val;
    set(dateTimeType, arr);
  };

  const removeWeight = (type, idx) => {
    set(
      type,
      ticket[type].filter((_, i) => i !== idx)
    );
    const dateTimeType =
      type === "grossWeights" ? "grossWeightDateTimes" : "tareWeightDateTimes";
    set(
      dateTimeType,
      (ticket[dateTimeType] || []).filter((_, i) => i !== idx)
    );
  };

  const grossTotal = ticket.grossWeights.reduce((a, b) => a + b, 0);
  const tareTotal = ticket.tareWeights.reduce((a, b) => a + b, 0);
  const netTotal = grossTotal - tareTotal;

  const canComplete =
    ticket.cmoId &&
    ticket.truck &&
    grossTotal > 0 &&
    tareTotal > 0 &&
    ticket.signoff &&
    ticket.loadingLocation;

  const handleSave = () => {
    if (isCreate || !ticketId) {
      const newTicket = addTicket(ticket);
      router.push(`/outgoing?id=${newTicket.id}`);
    } else {
      updateTicket(ticketId, ticket);
      router.push(`/outgoing?id=${ticketId}`);
    }
  };

  const handleComplete = () => {
    const updated = { ...ticket, status: "completed" };
    let savedTicket;
    if (isCreate || !ticketId) {
      savedTicket = addTicket(updated);
      setTicket(savedTicket);
    } else {
      updateTicket(ticketId, updated);
      savedTicket = { ...updated, id: ticketId };
      setTicket(updated);
    }
    setShowPrintConfirm(true);
  };

  const [newCmo, setNewCmo] = useState({
    direction: "out",
    customerId: "",
    commodityTypeId: "",
    commodityId: "",
    status: "Active",
    estimatedAmount: "",
    actualAmountDelivered: "",
    additionalReferences: [],
    note: "",
    attachments: [],
  });
  const [newTruck, setNewTruck] = useState({ name: "", driver: "", tare: "" });

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f4f8",
        fontFamily: "'Segoe UI', sans-serif",
      }}
    >
      <Navbar site={currentSite} onSiteChange={setCurrentSite} sites={SITES} />

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: "#0f1e3d",
              }}
            >
              {isCompleted ? "Completed" : isCreate ? "New" : "Edit"} Out-Ticket{" "}
              {ticketId ? `#${ticketId}` : ""}
            </h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Outgoing weighbridge ticket
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isCompleted && (
              <BtnSecondary
                onClick={() => router.push(`/print/out/${ticketId}`)}
                style={{ fontSize: 12 }}
              >
                Print
              </BtnSecondary>
            )}
            {isCompleted && (
              <BtnGhost
                onClick={() => set("status", "processing")}
                style={{
                  fontSize: 12,
                  color: "#b45309",
                  background: "#fef3c7",
                }}
              >
                Override
              </BtnGhost>
            )}
            <BtnGhost
              onClick={() => router.push("/outgoing")}
              style={{ fontSize: 12 }}
            >
              Back
            </BtnGhost>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* CMO */}
            <Card title="CMO & Booking">
              <FormRow label="CMO" required>
                <div style={{ display: "flex", gap: 6 }}>
                  <Select
                    value={ticket.cmoId || ""}
                    onChange={(e) => {
                      const cmoId = Number(e.target.value);
                      set("cmoId", cmoId);
                      // Auto-populate customer, commodity type, and commodity from CMO
                      if (cmoId) {
                        const selectedCmo = cmos.find((c) => c.id === cmoId);
                        if (selectedCmo) {
                          set("customerId", selectedCmo.customerId);
                          set("commodityTypeId", selectedCmo.commodityTypeId);
                          set("commodityId", selectedCmo.commodityId);
                        }
                      }
                    }}
                    disabled={isCompleted}
                  >
                    <option value="">— Select CMO —</option>
                    {cmos
                      .filter((c) => c.direction === "out")
                      .map((c) => {
                        const cCommodity = commodities.find(
                          (com) => com.id === c.commodityId
                        );
                        return (
                          <option key={c.id} value={c.id}>
                            {c.cmoReference} —{" "}
                            {cCommodity?.description || "Unknown"}
                          </option>
                        );
                      })}
                  </Select>
                  {!isCompleted && (
                    <button
                      onClick={() => setShowCmoModal(true)}
                      style={{
                        background: "#3b82f6",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        width: 30,
                        cursor: "pointer",
                        fontSize: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              </FormRow>
              {ticket.cmoId && getRemainingTonnage(ticket.cmoId) && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    background: "#f0f9ff",
                    border: "1px solid #bae6fd",
                    borderRadius: 6,
                    fontSize: 11.5,
                    color: "#0c4a6e",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span>
                      <strong>CMO:</strong> {cmo?.cmoReference}
                    </span>
                    <span>
                      <strong>Remaining:</strong>{" "}
                      {getRemainingTonnage(
                        ticket.cmoId
                      ).remaining.toLocaleString()}{" "}
                      {commodity?.unitType || "kg"}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748b" }}>
                    Estimated:{" "}
                    {getRemainingTonnage(ticket.cmoId).total.toLocaleString()}{" "}
                    {commodity?.unitType || "kg"} | Delivered:{" "}
                    {getRemainingTonnage(
                      ticket.cmoId
                    ).delivered.toLocaleString()}{" "}
                    {commodity?.unitType || "kg"}
                  </div>
                </div>
              )}

              <FormRow label="Customer / Account">
                <Select
                  value={ticket.customerId || ""}
                  onChange={(e) => set("customerId", Number(e.target.value))}
                  disabled={isCompleted}
                >
                  <option value="">— Select Customer / Account —</option>
                  <optgroup label="Customers">
                    {customers.map((c) => (
                      <option key={`cust-${c.id}`} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Internal Accounts">
                    {internalAccounts.map((a) => (
                      <option key={`int-${a.id}`} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </optgroup>
                </Select>
              </FormRow>

              <FormRow label="Commodity Type">
                <Select
                  value={ticket.commodityTypeId || ""}
                  onChange={(e) => {
                    set("commodityTypeId", Number(e.target.value));
                    set("commodityId", null); // Reset commodity when type changes
                  }}
                  disabled={isCompleted}
                >
                  <option value="">— Select Commodity Type —</option>
                  {commodityTypes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </Select>
              </FormRow>

              <FormRow label="Commodity">
                <Select
                  value={ticket.commodityId || ""}
                  onChange={(e) => set("commodityId", Number(e.target.value))}
                  disabled={isCompleted || !ticket.commodityTypeId}
                >
                  <option value="">— Select Commodity —</option>
                  {commodities
                    .filter(
                      (c) =>
                        c.status === "active" &&
                        (!ticket.commodityTypeId ||
                          c.commodityTypeId === ticket.commodityTypeId)
                    )
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.commodityCode}
                      </option>
                    ))}
                </Select>
              </FormRow>
            </Card>

            {/* Loading Location */}
            <Card title="Loading Location">
              <FormRow label="Loading Location" required>
                <Select
                  value={ticket.loadingLocation}
                  onChange={(e) =>
                    set("loadingLocation", Number(e.target.value))
                  }
                  disabled={isCompleted || !ticket.cmoId}
                >
                  <option value="">— Select Location —</option>
                  {!ticket.cmoId && (
                    <option value="" disabled>
                      Select CMO first to see available locations
                    </option>
                  )}
                  {ticket.cmoId && getValidLoadingLocations().length === 0 && (
                    <option value="" disabled>
                      No locations with{" "}
                      {commodityTypes.find(
                        (ct) => ct.id === ticket.commodityTypeId
                      )?.name || "this commodity"}{" "}
                      in stock
                    </option>
                  )}
                  {ticket.cmoId &&
                    getValidLoadingLocations().map((loc) => {
                      const stockItems = getLocationStock(loc.id);
                      const matchingStock = stockItems.find(
                        (item) =>
                          item.commodityTypeId === ticket.commodityTypeId
                      );
                      const stockInfo = matchingStock
                        ? ` - ${(matchingStock.weight / 1000).toFixed(
                            1
                          )}t available`
                        : "";

                      return (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.locationType}){stockInfo}
                        </option>
                      );
                    })}
                </Select>
                {ticket.cmoId &&
                  ticket.commodityTypeId &&
                  getValidLoadingLocations().length === 0 && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "10px 12px",
                        background: "#fee2e2",
                        border: "1px solid #fecaca",
                        borderRadius: 6,
                        fontSize: 11.5,
                        color: "#991b1b",
                        lineHeight: 1.4,
                      }}
                    >
                      <strong
                        style={{
                          display: "block",
                          marginBottom: 4,
                          fontSize: 12,
                        }}
                      >
                        ⚠️ No Stock Available
                      </strong>
                      There are no locations with{" "}
                      {
                        commodityTypes.find(
                          (ct) => ct.id === ticket.commodityTypeId
                        )?.name
                      }{" "}
                      currently in stock. Please check incoming tickets or stock
                      locations.
                    </div>
                  )}
              </FormRow>
            </Card>

            {/* Truck & Weights — Note: Out tickets record Tare first, then Gross */}
            <Card title="Truck & Weights">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <FormRow label="Truck" required>
                  <div style={{ display: "flex", gap: 6 }}>
                    <Select
                      value={ticket.truck?.id || ""}
                      onChange={(e) => {
                        const t = trucks.find(
                          (tr) => tr.id === Number(e.target.value)
                        );
                        set("truck", t || null);
                      }}
                      disabled={isCompleted}
                    >
                      <option value="">— Select Truck —</option>
                      {trucks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.driver})
                        </option>
                      ))}
                    </Select>
                    {!isCompleted && (
                      <button
                        onClick={() => setShowTruckModal(true)}
                        style={{
                          background: "#3b82f6",
                          color: "#fff",
                          border: "none",
                          borderRadius: 6,
                          width: 30,
                          cursor: "pointer",
                          fontSize: 16,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        +
                      </button>
                    )}
                  </div>
                </FormRow>
                <FormRow label="Split Load">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <div
                      onClick={() =>
                        !isCompleted && set("splitLoad", !ticket.splitLoad)
                      }
                      style={{
                        width: 40,
                        height: 22,
                        borderRadius: 11,
                        background: ticket.splitLoad ? "#3b82f6" : "#d1d5db",
                        position: "relative",
                        cursor: isCompleted ? "not-allowed" : "pointer",
                        transition: "background 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#fff",
                          position: "absolute",
                          top: 2,
                          left: ticket.splitLoad ? 20 : 2,
                          transition: "left 0.2s",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                        }}
                      />
                    </div>
                    <span style={{ fontSize: 12, color: "#64748b" }}>
                      Split Load
                    </span>
                  </label>
                </FormRow>
              </div>

              <WeightSection
                label="Tare Weight (In)"
                type="tareWeights"
                weights={ticket.tareWeights}
                dateTimes={ticket.tareWeightDateTimes}
                total={tareTotal}
                unitType={commodity?.unitType || "t"}
                onAdd={() => addWeight("tareWeights")}
                onUpdate={(i, v) => updateWeight("tareWeights", i, v === "" ? null : Math.round(Number(v) * 1000))}
                onUpdateDateTime={(i, v) =>
                  updateWeightDateTime("tareWeights", i, v)
                }
                onRemove={(i) => removeWeight("tareWeights", i)}
                splitLoad={ticket.splitLoad}
                disabled={isCompleted}
              />
              <WeightSection
                label="Gross Weight (Out)"
                type="grossWeights"
                weights={ticket.grossWeights}
                dateTimes={ticket.grossWeightDateTimes}
                total={grossTotal}
                unitType={commodity?.unitType || "t"}
                onAdd={() => addWeight("grossWeights")}
                onUpdate={(i, v) => updateWeight("grossWeights", i, v === "" ? null : Math.round(Number(v) * 1000))}
                onUpdateDateTime={(i, v) =>
                  updateWeightDateTime("grossWeights", i, v)
                }
                onRemove={(i) => removeWeight("grossWeights", i)}
                splitLoad={ticket.splitLoad}
                disabled={isCompleted}
              />

              {tareTotal > grossTotal && grossTotal > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    padding: "10px 12px",
                    background: "#fef3c7",
                    border: "1px solid #fde047",
                    borderRadius: 6,
                    fontSize: 11.5,
                    color: "#78350f",
                    lineHeight: 1.4,
                  }}
                >
                  <strong
                    style={{
                      display: "block",
                      marginBottom: 4,
                      fontSize: 12,
                    }}
                  >
                    ⚠️ Weight Warning
                  </strong>
                  Tare weight exceeds gross weight. Please verify the weight
                  entries.
                </div>
              )}

              <div
                style={{
                  marginTop: 10,
                  padding: "8px 12px",
                  background: netTotal > 0 ? "#ecfdf5" : "#f3f4f6",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: netTotal > 0 ? "#065f46" : "#6b7280",
                  }}
                >
                  Net Weight
                </span>
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: netTotal > 0 ? "#059669" : "#6b7280",
                  }}
                >
                  {netTotal > 0 ? netTotal.toLocaleString() : "—"}{" "}
                  <span style={{ fontSize: 10 }}>
                    {commodity?.unitType === "MT" ? "t" : "kg"}
                  </span>
                </span>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div
            style={{
              width: 280,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <Card title="Details">
              <FormRow label="Ticket Reference">
                <Input
                  value={ticket.ticketReference}
                  onChange={(e) => set("ticketReference", e.target.value)}
                  disabled={isCompleted}
                  placeholder="Enter ticket reference…"
                />
              </FormRow>
              <FormRow label="Additional Reference">
                <Input
                  value={ticket.additionalReference}
                  onChange={(e) => set("additionalReference", e.target.value)}
                  disabled={isCompleted}
                  placeholder="Enter additional reference…"
                />
              </FormRow>
              <FormRow label="Commodity">
                <Input
                  value={commodity?.description || "—"}
                  disabled
                  style={{ background: "#f3f4f6" }}
                />
              </FormRow>
              <FormRow label="Signoff">
                <Select
                  value={ticket.signoff}
                  onChange={(e) => set("signoff", e.target.value)}
                  disabled={isCompleted}
                >
                  <option value="">— Select User —</option>
                  {users
                    .filter((u) => u.active)
                    .map((u) => (
                      <option key={u.id} value={u.name}>
                        {u.name}
                      </option>
                    ))}
                </Select>
              </FormRow>
              <FormRow label="Notes">
                <textarea
                  value={ticket.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  disabled={isCompleted}
                  placeholder="Add notes…"
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 12,
                    resize: "vertical",
                    minHeight: 60,
                    outline: "none",
                    boxSizing: "border-box",
                    background: isCompleted ? "#f3f4f6" : "#fff",
                    fontFamily: "'Segoe UI', sans-serif",
                  }}
                />
              </FormRow>
            </Card>
            <Card title="Actions">
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {!isCompleted && (
                  <>
                    <BtnPrimary
                      onClick={handleComplete}
                      disabled={!canComplete}
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        fontSize: 13,
                      }}
                    >
                      Complete Ticket
                    </BtnPrimary>
                    <BtnSecondary
                      onClick={handleSave}
                      style={{
                        width: "100%",
                        justifyContent: "center",
                        fontSize: 13,
                      }}
                    >
                      Save Draft
                    </BtnSecondary>
                  </>
                )}
                {!isCompleted && ticketId && (
                  <BtnDanger
                    onClick={() => {
                      if (window.confirm("Remove this ticket?"))
                        router.push("/outgoing");
                    }}
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: 12,
                    }}
                  >
                    Remove Ticket
                  </BtnDanger>
                )}
                {!canComplete && !isCompleted && (
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 4 }}>
                    <span style={{ fontWeight: 600 }}>Required:</span> CMO,
                    truck, tare & gross weights, signoff, and loading location.
                  </div>
                )}
              </div>
            </Card>

            {/* Transactions */}
            {ticketId && isCompleted && (
              <Card title="Transactions">
                <TransactionInfo
                  ticketId={ticketId}
                  getTransactionsByTicket={getTransactionsByTicket}
                />
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        open={showCmoModal}
        onClose={() => setShowCmoModal(false)}
        title="Create New CMO (Outgoing)"
      >
        <div
          style={{
            padding: "10px 14px",
            background: "#f8fafc",
            borderRadius: 6,
            marginBottom: 16,
            border: "1px solid #e2e8f0",
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.4,
            }}
          >
            CMO Reference will be auto-generated
          </span>
        </div>
        <FormRow label="Customer / Account" required>
          <Select
            value={newCmo.customerId}
            onChange={(e) =>
              setNewCmo({ ...newCmo, customerId: e.target.value })
            }
          >
            <option value="">— Select Customer / Account —</option>
            <optgroup label="Customers">
              {customers.map((c) => (
                <option key={`cust-${c.id}`} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </optgroup>
            <optgroup label="Internal Accounts">
              {internalAccounts.map((a) => (
                <option key={`int-${a.id}`} value={a.id}>
                  {a.name}
                </option>
              ))}
            </optgroup>
          </Select>
        </FormRow>
        <FormRow label="Commodity Type" required>
          <Select
            value={newCmo.commodityTypeId}
            onChange={(e) =>
              setNewCmo({
                ...newCmo,
                commodityTypeId: e.target.value,
                commodityId: "",
              })
            }
          >
            <option value="">— Select Commodity Type —</option>
            {commodityTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </FormRow>
        <FormRow label="Commodity" required>
          <Select
            value={newCmo.commodityId}
            onChange={(e) =>
              setNewCmo({ ...newCmo, commodityId: e.target.value })
            }
            disabled={!newCmo.commodityTypeId}
          >
            <option value="">— Select Commodity —</option>
            {commodities
              .filter(
                (c) =>
                  c.status === "active" &&
                  (!newCmo.commodityTypeId ||
                    c.commodityTypeId === Number(newCmo.commodityTypeId))
              )
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.commodityCode}
                </option>
              ))}
          </Select>
        </FormRow>
        <FormRow
          label={`Estimated Amount${
            newCmo.commodityId
              ? ` (${
                  commodities.find((c) => c.id === Number(newCmo.commodityId))
                    ?.unitType || "kg"
                })`
              : " (kg)"
          }`}
        >
          <Input
            value={newCmo.estimatedAmount}
            onChange={(e) =>
              setNewCmo({ ...newCmo, estimatedAmount: e.target.value })
            }
            type="number"
            placeholder="0"
          />
        </FormRow>
        <FormRow label="Note">
          <Input
            value={newCmo.note}
            onChange={(e) => setNewCmo({ ...newCmo, note: e.target.value })}
            placeholder="Optional notes"
          />
        </FormRow>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <BtnGhost onClick={() => setShowCmoModal(false)}>Cancel</BtnGhost>
          <BtnPrimary
            onClick={() => {
              if (
                newCmo.customerId &&
                newCmo.commodityTypeId &&
                newCmo.commodityId
              ) {
                addCmo({
                  direction: "out",
                  customerId: Number(newCmo.customerId),
                  commodityTypeId: Number(newCmo.commodityTypeId),
                  commodityId: Number(newCmo.commodityId),
                  status: newCmo.status,
                  estimatedAmount: Number(newCmo.estimatedAmount) || 0,
                  actualAmountDelivered:
                    Number(newCmo.actualAmountDelivered) || 0,
                  additionalReferences: newCmo.additionalReferences,
                  note: newCmo.note.trim(),
                  attachments: newCmo.attachments,
                });
                setShowCmoModal(false);
                setNewCmo({
                  direction: "out",
                  customerId: "",
                  commodityTypeId: "",
                  commodityId: "",
                  status: "Active",
                  estimatedAmount: "",
                  actualAmountDelivered: "",
                  additionalReferences: [],
                  note: "",
                  attachments: [],
                });
              }
            }}
          >
            Create CMO
          </BtnPrimary>
        </div>
      </Modal>

      <Modal
        open={showTruckModal}
        onClose={() => setShowTruckModal(false)}
        title="Add New Truck"
      >
        <FormRow label="Truck ID" required>
          <Input
            value={newTruck.name}
            onChange={(e) => setNewTruck({ ...newTruck, name: e.target.value })}
            placeholder="e.g. TRK-006"
          />
        </FormRow>
        <FormRow label="Driver">
          <Input
            value={newTruck.driver}
            onChange={(e) =>
              setNewTruck({ ...newTruck, driver: e.target.value })
            }
            placeholder="Driver name"
          />
        </FormRow>
        <FormRow label="Tare Weight (t)">
          <Input
            value={newTruck.tare}
            onChange={(e) => setNewTruck({ ...newTruck, tare: e.target.value })}
            type="number"
            placeholder="0"
          />
        </FormRow>
        <div
          style={{
            marginTop: 16,
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
          }}
        >
          <BtnGhost onClick={() => setShowTruckModal(false)}>Cancel</BtnGhost>
          <BtnPrimary
            onClick={() => {
              if (newTruck.name) {
                addTruck({ ...newTruck, tare: Number(newTruck.tare) || 0 });
                setShowTruckModal(false);
                setNewTruck({ name: "", driver: "", tare: "" });
              }
            }}
          >
            Add Truck
          </BtnPrimary>
        </div>
      </Modal>

      <Modal
        open={showPrintConfirm}
        onClose={() => {
          setShowPrintConfirm(false);
          router.push(`/outgoing?id=${ticket.id}`);
        }}
        title="Ticket Completed"
      >
        <p
          style={{
            fontSize: 13,
            color: "#1e293b",
            textAlign: "center",
            margin: "12px 0",
          }}
        >
          The outgoing ticket has been completed.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            marginTop: 16,
          }}
        >
          <BtnPrimary
            onClick={() => {
              setShowPrintConfirm(false);
              router.push(`/print/out/${ticket.id}`);
            }}
            style={{ fontSize: 12 }}
          >
            Print Ticket
          </BtnPrimary>
          <BtnGhost
            onClick={() => {
              setShowPrintConfirm(false);
              router.push(`/outgoing?id=${ticket.id}`);
            }}
            style={{ fontSize: 12 }}
          >
            Skip Print
          </BtnGhost>
        </div>
      </Modal>
    </div>
  );
}

function WeightSection({
  label,
  type,
  weights,
  dateTimes,
  total,
  unitType,
  onAdd,
  onUpdate,
  onUpdateDateTime,
  onRemove,
  splitLoad,
  disabled,
}) {
  // Ensure at least one input field is always shown
  const displayWeights = weights.length === 0 ? [0] : weights;
  const displayDateTimes = dateTimes || [];

  return (
    <div style={{ marginTop: 12 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 6,
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "#374151",
            textTransform: "uppercase",
            letterSpacing: 0.4,
          }}
        >
          {label}
        </span>
        <span style={{ fontSize: 11, color: "#64748b" }}>
          Total:{" "}
          <strong>
            {(unitType === "MT" || unitType === "t" ? total / 1000 : total).toLocaleString(undefined, unitType === "MT" || unitType === "t" ? { minimumFractionDigits: 2, maximumFractionDigits: 3 } : undefined)} {unitType === "MT" || unitType === "t" ? "t" : "kg"}
          </strong>
        </span>
      </div>
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        {displayWeights.map((w, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "8px",
              background: "#f9fafb",
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          >
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <label
                  style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}
                >
                  Weight ({unitType === "MT" || unitType === "t" ? "t" : "kg"})
                </label>
                <input
                  type="number"
                  value={unitType === "MT" || unitType === "t" ? (w != null && w !== "" ? String(Number(w) / 1000) : "") : (w || "")}
                  onChange={(e) => onUpdate(i, e.target.value)}
                  disabled={disabled}
                  placeholder="0"
                  style={{
                    width: 110,
                    padding: "7px 10px",
                    border: "1px solid #d1d5db",
                    borderRadius: 6,
                    fontSize: 13,
                    outline: "none",
                    background: disabled ? "#f3f4f6" : "#fff",
                  }}
                />
              </div>
              {splitLoad && !disabled && weights.length > 1 && (
                <button
                  onClick={() => onRemove(i)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    cursor: "pointer",
                    fontSize: 18,
                    marginTop: 18,
                    padding: "0 4px",
                  }}
                >
                  ×
                </button>
              )}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label
                style={{ fontSize: 10, color: "#6b7280", fontWeight: 600 }}
              >
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={displayDateTimes[i] || ""}
                onChange={(e) => onUpdateDateTime(i, e.target.value)}
                disabled={disabled}
                style={{
                  width: 180,
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 12,
                  outline: "none",
                  background: disabled ? "#f3f4f6" : "#fff",
                }}
              />
            </div>
          </div>
        ))}
        {!disabled && splitLoad && (
          <button
            onClick={onAdd}
            style={{
              background: "#eef2ff",
              color: "#4f46e5",
              border: "1px dashed #a5b4fc",
              borderRadius: 6,
              padding: "5px 10px",
              cursor: "pointer",
              fontSize: 11,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            + Add
          </button>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "10px 16px",
          borderBottom: "1px solid #f1f5f9",
          background: "#f8fafc",
        }}
      >
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#0f1e3d",
            textTransform: "uppercase",
            letterSpacing: 0.5,
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

// ── Transaction Info Component ─────────────────────────────────────────────
function TransactionInfo({ ticketId, getTransactionsByTicket }) {
  const router = useRouter();
  const ticketTransactions = getTransactionsByTicket(ticketId);

  if (ticketTransactions.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#6b7280", fontStyle: "italic" }}>
        No transactions recorded for this ticket yet.
      </div>
    );
  }

  const activeTransactions = ticketTransactions.filter(
    (t) => t.status === "active"
  );
  const hasAdjustments = ticketTransactions.some(
    (t) => t.status === "adjusted"
  );
  const hasReversals = ticketTransactions.some((t) => t.status === "reversed");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div
        style={{
          fontSize: 11,
          color: "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span>
          {activeTransactions.length} active transaction
          {activeTransactions.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={() => router.push("/transactions")}
          style={{
            background: "none",
            border: "none",
            color: "#3b82f6",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
            padding: 0,
          }}
        >
          View All
        </button>
      </div>

      {activeTransactions.slice(0, 4).map((t) => (
        <div
          key={t.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 10px",
            background: "#f8fafc",
            borderRadius: 6,
            fontSize: 11.5,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                fontWeight: 600,
                color: "#0f1e3d",
              }}
            >
              {t.transactionType
                ? t.transactionType.charAt(0).toUpperCase() +
                  t.transactionType.slice(1)
                : "N/A"}
            </span>
            <span style={{ fontSize: 10, color: "#64748b" }}>
              {t.transactionDate}
            </span>
          </div>
          <span
            style={{
              fontWeight: 700,
              color: t.quantity >= 0 ? "#059669" : "#dc2626",
            }}
          >
            {t.quantity >= 0 ? "+" : ""}
            {t.quantity.toFixed(2)} MT
          </span>
        </div>
      ))}

      {hasAdjustments && (
        <div
          style={{
            fontSize: 10.5,
            color: "#b45309",
            background: "#fef3c7",
            padding: "6px 8px",
            borderRadius: 4,
            marginTop: 4,
          }}
        >
          This ticket has been adjusted
        </div>
      )}

      {hasReversals && (
        <div
          style={{
            fontSize: 10.5,
            color: "#991b1b",
            background: "#fee2e2",
            padding: "6px 8px",
            borderRadius: 4,
            marginTop: 4,
          }}
        >
          Some transactions have been reversed
        </div>
      )}
    </div>
  );
}
