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

export default function InTicketPage() {
  const router = useRouter();
  const params = useSearchParams();
  const {
    tickets,
    cmos,
    trucks,
    commodities,
    commodityTypes,
    tests,
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
    type: "in",
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
    commodityConfirmed: false,
    commodityOverrideReason: "",
    signoff: "",
    unloadedLocation: "",
    notes: "",
    ticketReference: "",
    additionalReference: "",
    date: new Date().toISOString().split("T")[0],
  };

  const [ticket, setTicket] = useState(existingTicket || blankTicket);
  const [showCmoModal, setShowCmoModal] = useState(false);
  const [showTruckModal, setShowTruckModal] = useState(false);
  const [showCommodityModal, setShowCommodityModal] = useState(false);
  const [suggestedCommodities, setSuggestedCommodities] = useState([]);
  const [testResultsSummary, setTestResultsSummary] = useState([]);
  const [overrideReason, setOverrideReason] = useState("");
  const [showPrintConfirm, setShowPrintConfirm] = useState(false);

  useEffect(() => {
    if (existingTicket) setTicket(existingTicket);
  }, [existingTicket]);

  // Check location warning when location or CMO changes
  useEffect(() => {
    if (ticket.unloadedLocation && ticket.cmoId) {
      const warning = validateLocationSelection(ticket.unloadedLocation);
      setLocationWarning(warning);
    } else {
      setLocationWarning(null);
    }
  }, [ticket.unloadedLocation, ticket.cmoId]);

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

    // Calculate total weight from completed in tickets for this CMO
    const totalReceived = tickets
      .filter(
        (t) => t.type === "in" && t.status === "completed" && t.cmoId === cmoId
      )
      .reduce((sum, t) => {
        const netWeight =
          t.grossWeights.reduce((a, b) => a + b, 0) -
          t.tareWeights.reduce((a, b) => a + b, 0);
        return sum + netWeight;
      }, 0);

    const remaining = selectedCmo.estimatedAmount - totalReceived;
    return {
      total: selectedCmo.estimatedAmount,
      received: totalReceived,
      remaining,
    };
  };

  const set = (key, val) => setTicket((prev) => ({ ...prev, [key]: val }));
  const setTest = (name, val) =>
    setTicket((prev) => ({ ...prev, tests: { ...prev.tests, [name]: val } }));

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

  const validateLocationSelection = (locationId) => {
    if (!locationId || !ticket.commodityTypeId) return null;

    const stockItems = getLocationStock(locationId);
    const location = stockLocations.find((loc) => loc.id === locationId);
    const selectedCommodityType = commodityTypes.find(
      (ct) => ct.id === ticket.commodityTypeId
    );

    // If location is empty, it's valid
    if (stockItems.length === 0) {
      return null;
    }

    // Check if any stock has a different commodity type
    const differentCommodityTypes = stockItems.filter(
      (item) => item.commodityTypeId !== ticket.commodityTypeId
    );

    if (differentCommodityTypes.length > 0) {
      const otherTypes = differentCommodityTypes
        .map((item) => item.commodityTypeName)
        .join(", ");
      return `Warning: This location currently contains ${otherTypes}. You are trying to unload ${selectedCommodityType?.name}. Consider selecting an empty bin or a location with the same commodity type.`;
    }

    return null;
  };

  const [locationWarning, setLocationWarning] = useState(null);

  // ── Weight helpers ──
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

  // ── Commodity confirmation logic ──
  // Tests help identify/confirm which commodity (grade) the load is
  const confirmCommodity = () => {
    if (!ticket.commodityTypeId) return;

    // Get all commodities of the same type
    const sameCommodities = commodities.filter(
      (c) =>
        c.commodityTypeId === ticket.commodityTypeId && c.status === "active"
    );

    // Check each commodity to see if the test results match
    const commodityAnalysis = sameCommodities.map((comm) => {
      const testResults = (comm.testThresholds || []).map((threshold) => {
        const testValue = Number(ticket.tests[threshold.testName]);
        const min = Number(threshold.min);
        const max = Number(threshold.max);
        const hasValue =
          !isNaN(testValue) && ticket.tests[threshold.testName] !== "";
        const isWithinRange = hasValue && testValue >= min && testValue <= max;

        return {
          testName: threshold.testName,
          value: testValue,
          min,
          max,
          hasValue,
          pass: isWithinRange,
        };
      });

      // Commodity matches if all its required tests pass
      const allTestsPass =
        testResults.length > 0 && testResults.every((r) => r.pass);

      return {
        commodityId: comm.id,
        commodityDescription: comm.description,
        testResults,
        matches: allTestsPass,
      };
    });

    // Find commodities that match
    const matchingCommodities = commodityAnalysis.filter((c) => c.matches);

    // Check if the currently selected commodity matches
    const selectedCommodityAnalysis = commodityAnalysis.find(
      (c) => c.commodityId === ticket.commodityId
    );

    setTestResultsSummary(commodityAnalysis);
    setSuggestedCommodities(matchingCommodities);
    setOverrideReason("");
    setShowCommodityModal(true);
  };

  // ── Validation ──
  const canComplete =
    ticket.cmoId &&
    ticket.truck &&
    grossTotal > 0 &&
    tareTotal > 0 &&
    ticket.commodityConfirmed &&
    ticket.signoff &&
    ticket.unloadedLocation;

  const handleSave = () => {
    if (isCreate || !ticketId) {
      const newTicket = addTicket(ticket);
      router.push(`/incoming?id=${newTicket.id}`);
    } else {
      updateTicket(ticketId, ticket);
      router.push(`/incoming?id=${ticketId}`);
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

  const handleOverride = () => {
    set("status", "processing");
  };

  // ── New CMO modal state ──
  const [newCmo, setNewCmo] = useState({
    direction: "in",
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

  // ── New Truck modal state ──
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
        {/* Header */}
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
              {isCompleted ? "Completed" : isCreate ? "New" : "Edit"} In-Ticket{" "}
              {ticketId ? `#${ticketId}` : ""}
            </h1>
            <span style={{ fontSize: 12, color: "#64748b" }}>
              Incoming weighbridge ticket
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {isCompleted && (
              <BtnSecondary
                onClick={() => router.push(`/print/in/${ticketId}`)}
                style={{ fontSize: 12 }}
              >
                Print
              </BtnSecondary>
            )}
            {isCompleted && (
              <BtnGhost
                onClick={handleOverride}
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
              onClick={() => router.push("/incoming")}
              style={{ fontSize: 12 }}
            >
              Back
            </BtnGhost>
          </div>
        </div>

        <div style={{ display: "flex", gap: 16 }}>
          {/* ── LEFT: Main form ───────────────────────────────────────── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {/* CMO Section */}
            <Card title="CMO & Booking">
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <FormRow
                  label="CMO"
                  required
                  style={{ flex: 1, marginBottom: 0 }}
                >
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
                        .filter((c) => c.direction === "in")
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
              </div>
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
                    {commodity?.unitType || "kg"} | Received:{" "}
                    {getRemainingTonnage(
                      ticket.cmoId
                    ).received.toLocaleString()}{" "}
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

            {/* Truck & Weights */}
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

              {/* Gross Weights */}
              <WeightSection
                label="Gross Weight"
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
              {/* Tare Weights */}
              <WeightSection
                label="Tare Weight"
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

              {/* Net */}
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

            {/* Tests */}
            {ticket.commodityTypeId && (
              <Card title="Test Results">
                {/* Collect all unique tests from all commodities of this type */}
                {(() => {
                  const allTests = new Map();
                  const sameCommodities = commodities.filter(
                    (c) =>
                      c.commodityTypeId === ticket.commodityTypeId &&
                      c.status === "active"
                  );

                  sameCommodities.forEach((comm) => {
                    (comm.testThresholds || []).forEach((threshold) => {
                      if (!allTests.has(threshold.testName)) {
                        allTests.set(threshold.testName, {
                          testName: threshold.testName,
                          testId: threshold.testId,
                        });
                      }
                    });
                  });

                  const uniqueTests = Array.from(allTests.values());

                  return (
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(200px, 1fr))",
                        gap: 12,
                      }}
                    >
                      {uniqueTests.map(({ testName, testId }) => {
                        const test = tests.find((t) => t.id === testId);
                        const testValue =
                          Number(ticket.tests[testName]) || null;
                        const hasValue =
                          testValue !== null && ticket.tests[testName] !== "";

                        // Check if this value is within range for any commodity of this type
                        let isInRangeForAnyCommodity = false;
                        if (hasValue) {
                          sameCommodities.forEach((comm) => {
                            const threshold = (comm.testThresholds || []).find(
                              (t) => t.testName === testName
                            );
                            if (threshold) {
                              const min = Number(threshold.min);
                              const max = Number(threshold.max);
                              if (testValue >= min && testValue <= max) {
                                isInRangeForAnyCommodity = true;
                              }
                            }
                          });
                        }

                        const isOutOfRange =
                          hasValue && !isInRangeForAnyCommodity;

                        return (
                          <div
                            key={testName}
                            style={{
                              padding: "10px",
                              borderRadius: 6,
                              border: `1px solid ${
                                isOutOfRange
                                  ? "#fecaca"
                                  : isInRangeForAnyCommodity
                                  ? "#bbf7d0"
                                  : "#e2e8f0"
                              }`,
                              background: isOutOfRange
                                ? "#fef2f2"
                                : isInRangeForAnyCommodity
                                ? "#f0fdf4"
                                : "#fff",
                            }}
                          >
                            <label
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: "#374151",
                                textTransform: "uppercase",
                                letterSpacing: 0.4,
                                display: "block",
                                marginBottom: 4,
                              }}
                            >
                              {testName}{" "}
                              <span style={{ color: "#94a3b8" }}>
                                ({test?.unit || ""})
                              </span>
                            </label>
                            <Input
                              value={ticket.tests[testName] || ""}
                              onChange={(e) =>
                                setTest(testName, e.target.value)
                              }
                              type="number"
                              step="0.01"
                              disabled={isCompleted}
                              placeholder="0.00"
                              style={{
                                marginTop: 4,
                                borderColor: isOutOfRange
                                  ? "#ef4444"
                                  : isInRangeForAnyCommodity
                                  ? "#16a34a"
                                  : "#d1d5db",
                              }}
                            />
                            {hasValue && (
                              <div
                                style={{
                                  fontSize: 10,
                                  marginTop: 6,
                                  fontWeight: 600,
                                }}
                              >
                                {isInRangeForAnyCommodity ? (
                                  <span style={{ color: "#16a34a" }}>
                                    Valid for some commodities
                                  </span>
                                ) : (
                                  <span style={{ color: "#dc2626" }}>
                                    Not valid for any commodity
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
                <div
                  style={{
                    marginTop: 14,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                  }}
                >
                  <BtnPrimary
                    onClick={confirmCommodity}
                    disabled={isCompleted || ticket.commodityConfirmed}
                    style={{ fontSize: 12 }}
                  >
                    {ticket.commodityConfirmed
                      ? "Commodity Confirmed"
                      : "Identify Commodity"}
                  </BtnPrimary>
                  {ticket.commodityConfirmed && commodity && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#059669",
                        fontWeight: 600,
                      }}
                    >
                      {commodity.description}
                    </span>
                  )}
                  {ticket.commodityConfirmed &&
                    ticket.commodityOverrideReason && (
                      <span style={{ fontSize: 11, color: "#b45309" }}>
                        Override: {ticket.commodityOverrideReason}
                      </span>
                    )}
                </div>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Sidebar ────────────────────────────────────────── */}
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
              <FormRow label="Unloaded Location" required>
                <Select
                  value={ticket.unloadedLocation}
                  onChange={(e) => {
                    const locId = Number(e.target.value);
                    set("unloadedLocation", locId);
                    const warning = validateLocationSelection(locId);
                    setLocationWarning(warning);
                  }}
                  disabled={isCompleted || !ticket.cmoId}
                >
                  <option value="">— Select Location —</option>
                  {stockLocations
                    .filter((loc) => loc.status === "active")
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((loc) => {
                      const stockItems = getLocationStock(loc.id);
                      const isEmpty = stockItems.length === 0;
                      const hasMatchingType = stockItems.some(
                        (item) =>
                          item.commodityTypeId === ticket.commodityTypeId
                      );
                      const stockInfo =
                        stockItems.length > 0
                          ? ` - ${stockItems
                              .map((item) => item.commodityTypeName)
                              .join(", ")}`
                          : " - Empty";

                      return (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} ({loc.locationType}){stockInfo}
                        </option>
                      );
                    })}
                </Select>
                {locationWarning && (
                  <div
                    style={{
                      marginTop: 8,
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
                      ⚠️ Location Warning
                    </strong>
                    {locationWarning}
                  </div>
                )}
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

            {/* Actions */}
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
                      if (window.confirm("Remove this ticket?")) {
                        require("../../context/AppContext");
                        router.push("/incoming");
                      }
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
                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 4,
                      lineHeight: 1.4,
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>Required:</span> CMO,
                    truck, gross & tare weights, commodity confirmed, signoff,
                    and unload location.
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

      {/* ── MODALS ──────────────────────────────────────────────────────── */}
      {/* New CMO */}
      <Modal
        open={showCmoModal}
        onClose={() => setShowCmoModal(false)}
        title="Create New CMO (Incoming)"
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
                  direction: "in",
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
                  direction: "in",
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

      {/* New Truck */}
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

      {/* Commodity Identification */}
      <Modal
        open={showCommodityModal}
        onClose={() => setShowCommodityModal(false)}
        title="Commodity Identification"
        width={700}
      >
        <div style={{ marginBottom: 16 }}>
          {suggestedCommodities.length > 0 ? (
            <div
              style={{
                padding: "12px 16px",
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  color: "#059669",
                  fontWeight: 600,
                  margin: 0,
                  fontSize: 14,
                }}
              >
                {suggestedCommodities.length === 1
                  ? "Suggested Commodity:"
                  : "Matching Commodities:"}
              </p>
              <p
                style={{ margin: "4px 0 0 0", fontSize: 12, color: "#64748b" }}
              >
                {suggestedCommodities
                  .map(
                    (c) =>
                      commodities.find((comm) => comm.id === c.commodityId)
                        ?.description
                  )
                  .join(", ")}
              </p>
              <p
                style={{
                  margin: "4px 0 0 0",
                  fontSize: 11,
                  color: "#64748b",
                  fontStyle: "italic",
                }}
              >
                Test results match the requirements for{" "}
                {suggestedCommodities.length === 1
                  ? "this commodity"
                  : "these commodities"}
              </p>
            </div>
          ) : (
            <div
              style={{
                padding: "12px 16px",
                background: "#fef3c7",
                border: "1px solid #fde047",
                borderRadius: 8,
              }}
            >
              <p
                style={{
                  color: "#b45309",
                  fontWeight: 600,
                  margin: 0,
                  fontSize: 14,
                }}
              >
                No commodity matches all test results
              </p>
              <p
                style={{ margin: "4px 0 0 0", fontSize: 12, color: "#78350f" }}
              >
                You can still select a commodity with an override reason
              </p>
            </div>
          )}
        </div>

        {/* Commodity Analysis */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 10,
            }}
          >
            Test Results Analysis
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {testResultsSummary.map((commodityAnalysis, idx) => (
              <div
                key={idx}
                style={{
                  padding: "10px 12px",
                  background: commodityAnalysis.matches ? "#f0fdf4" : "#fef2f2",
                  border: `2px solid ${
                    commodityAnalysis.matches ? "#bbf7d0" : "#fecaca"
                  }`,
                  borderRadius: 8,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8,
                  }}
                >
                  <span
                    style={{ fontWeight: 700, color: "#1e293b", fontSize: 13 }}
                  >
                    {commodityAnalysis.commodityDescription}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: commodityAnalysis.matches ? "#059669" : "#dc2626",
                    }}
                  >
                    {commodityAnalysis.matches ? "MATCH" : "NO MATCH"}
                  </span>
                </div>
                {commodityAnalysis.testResults.length > 0 && (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 4 }}
                  >
                    {commodityAnalysis.testResults.map((test, tIdx) => (
                      <div
                        key={tIdx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          color: "#64748b",
                          paddingLeft: 8,
                        }}
                      >
                        <span>
                          <span
                            style={{
                              fontWeight: 600,
                              color: test.pass ? "#059669" : "#dc2626",
                              marginRight: 4,
                            }}
                          >
                            {test.pass ? "PASS" : "FAIL"}:
                          </span>
                          {test.testName}
                        </span>
                        <span>
                          Value:{" "}
                          <strong
                            style={{ color: test.pass ? "#059669" : "#dc2626" }}
                          >
                            {test.hasValue ? test.value : "—"}
                          </strong>
                          {" • "}
                          Range:{" "}
                          <strong>
                            {test.min}-{test.max}
                          </strong>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Select Commodity */}
        <div style={{ marginBottom: 16 }}>
          <FormRow label="Confirm Commodity" required>
            <Select
              value={ticket.commodityId || ""}
              onChange={(e) => set("commodityId", Number(e.target.value))}
            >
              <option value="">— Select Commodity —</option>
              {commodities
                .filter(
                  (c) =>
                    c.commodityTypeId === ticket.commodityTypeId &&
                    c.status === "active"
                )
                .map((comm) => {
                  const isSuggested = suggestedCommodities.some(
                    (s) => s.commodityId === comm.id
                  );
                  return (
                    <option key={comm.id} value={comm.id}>
                      {comm.description}
                      {isSuggested ? " (Suggested)" : ""}
                    </option>
                  );
                })}
            </Select>
          </FormRow>
        </div>

        {/* Override reason if needed */}
        {ticket.commodityId &&
          !suggestedCommodities.some(
            (s) => s.commodityId === ticket.commodityId
          ) && (
            <FormRow label="Override Reason" required>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why you're selecting a different commodity than suggested..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "7px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "#111827",
                  background: "#fff",
                  outline: "none",
                  boxSizing: "border-box",
                  fontFamily: "'Segoe UI', sans-serif",
                  resize: "vertical",
                }}
              />
            </FormRow>
          )}

        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <BtnGhost onClick={() => setShowCommodityModal(false)}>
            Cancel
          </BtnGhost>
          {ticket.commodityId &&
            suggestedCommodities.some(
              (s) => s.commodityId === ticket.commodityId
            ) && (
              <BtnPrimary
                onClick={() => {
                  set("commodityConfirmed", true);
                  set("commodityOverrideReason", "");
                  setShowCommodityModal(false);
                }}
                style={{ fontSize: 12 }}
              >
                Confirm{" "}
                {
                  commodities.find((c) => c.id === ticket.commodityId)
                    ?.description
                }
              </BtnPrimary>
            )}
          {ticket.commodityId &&
            !suggestedCommodities.some(
              (s) => s.commodityId === ticket.commodityId
            ) && (
              <BtnSecondary
                onClick={() => {
                  if (!overrideReason.trim()) {
                    alert(
                      "Please provide an override reason for selecting a different commodity"
                    );
                    return;
                  }
                  set("commodityConfirmed", true);
                  set("commodityOverrideReason", overrideReason);
                  setShowCommodityModal(false);
                }}
                disabled={!overrideReason.trim()}
                style={{ fontSize: 12 }}
              >
                Override & Confirm
              </BtnSecondary>
            )}
        </div>
      </Modal>

      {/* Print confirmation */}
      <Modal
        open={showPrintConfirm}
        onClose={() => {
          setShowPrintConfirm(false);
          router.push(`/incoming?id=${ticket.id}`);
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
          The ticket has been completed successfully.
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
              router.push(`/print/in/${ticket.id}`);
            }}
            style={{ fontSize: 12 }}
          >
            Print Ticket
          </BtnPrimary>
          <BtnGhost
            onClick={() => {
              setShowPrintConfirm(false);
              router.push(`/incoming?id=${ticket.id}`);
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

// ── Weight Section Component ────────────────────────────────────────────────
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
                <Input
                  value={unitType === "MT" || unitType === "t" ? (w != null && w !== "" ? String(Number(w) / 1000) : "") : (w || "")}
                  onChange={(e) => onUpdate(i, e.target.value)}
                  type="number"
                  disabled={disabled}
                  placeholder="0"
                  style={{ width: 110 }}
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

// ── Card wrapper ────────────────────────────────────────────────────────────
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
