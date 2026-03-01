"use client";
import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { Navbar, BtnSecondary } from "../components/SharedComponents";
import { SITES } from "../utils/mockData";

export default function TransactionsPage() {
  const router = useRouter();
  const {
    transactions,
    tickets,
    cmos,
    customers,
    internalAccounts,
    commodities,
    stockLocations,
    currentSite,
    setCurrentSite,
  } = useApp();

  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, in, out
  const [filterStatus, setFilterStatus] = useState("active"); // all, active, adjusted, reversed
  const [selectedDate, setSelectedDate] = useState("");

  // Base filter (site, type, date, search) — no status, so we can reuse for balance
  const transactionList = Array.isArray(transactions) ? transactions : [];
  const filteredByFiltersOnly = useMemo(() => {
    return transactionList
      .filter((t) => Number(t.site) === Number(currentSite))
      .filter((t) => {
        if (filterType === "all") return true;
        return t.ticketType === filterType;
      })
      .filter((t) => {
        if (!selectedDate) return true;
        const tDate = t.transactionDate;
        const dateOnly = typeof tDate === "string" && tDate.includes("T") ? tDate.split("T")[0] : tDate;
        return dateOnly === selectedDate;
      })
      .filter((t) => {
        if (!search) return true;
        const account =
          customers.find((c) => c.id === t.accountId) ||
          internalAccounts.find((a) => a.id === t.accountId);
        const commodity = commodities.find((c) => c.id === t.commodityId);
        const location = stockLocations.find((l) => l.id === t.locationId);
        const text = `${t.id} ${t.reference} ${account?.name || ""} ${
          commodity?.description || ""
        } ${location?.name || ""} ${t.notes}`.toLowerCase();
        return text.includes(search.toLowerCase());
      });
  }, [
    transactionList,
    currentSite,
    filterType,
    selectedDate,
    search,
    customers,
    internalAccounts,
    commodities,
    stockLocations,
  ]);

  // Table list: apply status filter on top of base filters
  const filtered = useMemo(() => {
    return filteredByFiltersOnly
      .filter((t) => {
        if (filterStatus === "all") return true;
        return t.status === filterStatus;
      })
      .sort(
        (a, b) => new Date(b.transactionDate) - new Date(a.transactionDate)
      );
  }, [filteredByFiltersOnly, filterStatus]);

  // Summary totals = actual stock (always include active + reversed so reversals cancel). Independent of status filter.
  const countsInBalance = (t) =>
    t.status === "active" || t.status === "reversed" || t.status === "adjusted";
  const totals = useMemo(() => {
    const forBalance = filteredByFiltersOnly.filter(countsInBalance);
    
    // Sum all positive quantities as "Deposits" (Credits)
    const totalDeposits = forBalance
      .filter((t) => t.quantity > 0)
      .reduce((sum, t) => sum + t.quantity, 0);

    // Sum all negative quantities as "Withdrawals" (Debits) - stored as absolute for display
    const totalWithdrawals = forBalance
      .filter((t) => t.quantity < 0)
      .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    // Shrinkage is usually negative for customer, but we track it specifically if needed for display.
    // However, for the Net Balance, we just sum everything.
    const netBalance = forBalance.reduce((sum, t) => sum + t.quantity, 0);
    
    // Separate shrinkage for display if it's explicitly labeled (usually these are negative for customer)
    const totalShrinkage = forBalance
      .filter((t) => t.transactionType === "shrinkage" && t.accountType === "customer")
       .reduce((sum, t) => sum + Math.abs(t.quantity), 0);

    return {
      totalDeposits,
      totalWithdrawals,
      totalShrinkage,
      netBalance,
    };
  }, [filteredByFiltersOnly]);

  const getAccountName = (accountId, accountType) => {
    if (accountType === "customer") {
      return customers.find((c) => c.id === accountId)?.name || "Unknown";
    } else {
      return (
        internalAccounts.find((a) => a.id === accountId)?.name || "Unknown"
      );
    }
  };

  const getCommodityName = (commodityId) => {
    return commodities.find((c) => c.id === commodityId)?.description || "—";
  };

  const getLocationName = (locationId) => {
    return stockLocations.find((l) => l.id === locationId)?.name || "—";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return { bg: "#d1fae5", text: "#065f46" };
      case "adjusted":
        return { bg: "#fef3c7", text: "#b45309" };
      case "reversed":
        return { bg: "#fee2e2", text: "#991b1b" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280" };
    }
  };

  const getTransTypeStyle = (type) => {
    const styles = {
      deposit: { bg: "#d1fae5", color: "#065f46" },
      withdrawal: { bg: "#fee2e2", color: "#991b1b" },
      shrinkage: { bg: "#fef3c7", color: "#b45309" },
    };
    return styles[type] || { bg: "#e0e7ff", color: "#4338ca" };
  };

  const formatDate = (transactionDate) => {
    if (!transactionDate) return "—";
    const str = String(transactionDate);
    return str.includes("T") ? str.split("T")[0] : str;
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
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {/* Title */}
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
            Transaction Ledger
          </h1>
          <div style={{ display: "flex", gap: 8 }}>
            <BtnSecondary onClick={() => router.push("/account-balances")}>
              Account Balances
            </BtnSecondary>
          </div>
        </div>

        {/* Toolbar */}
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
          }}
        >
          {/* Search */}
          <div
            style={{
              position: "relative",
              flex: "1 1 220px",
              minWidth: 180,
              maxWidth: 340,
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
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

          {/* Type filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12.5,
              outline: "none",
              background: "#fff",
            }}
          >
            <option value="all">All Types</option>
            <option value="in">Incoming</option>
            <option value="out">Outgoing</option>
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12.5,
              outline: "none",
              background: "#fff",
            }}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="adjusted">Adjusted</option>
            <option value="reversed">Reversed</option>
          </select>

          {/* Date filter */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            style={{
              padding: "7px 10px",
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              fontSize: 12.5,
              outline: "none",
            }}
          />

          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              style={{
                padding: "7px 12px",
                border: "none",
                background: "#f3f4f6",
                borderRadius: 6,
                fontSize: 12,
                color: "#6b7280",
                cursor: "pointer",
              }}
            >
              Clear Date
            </button>
          )}

          {/* Totals */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              gap: 16,
              fontSize: 12.5,
            }}
          >
            <div>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>
                Deposits:{" "}
              </span>
              <span style={{ fontWeight: 700, color: "#059669" }}>
                {totals.totalDeposits.toFixed(2)} MT
              </span>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>
                Withdrawals:{" "}
              </span>
              <span style={{ fontWeight: 700, color: "#dc2626" }}>
                {totals.totalWithdrawals.toFixed(2)} MT
              </span>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>
                Shrinkage:{" "}
              </span>
              <span style={{ fontWeight: 700, color: "#f59e0b" }}>
                {totals.totalShrinkage.toFixed(2)} MT
              </span>
            </div>
            <div>
              <span style={{ color: "#6b7280", fontWeight: 600 }}>Net: </span>
              <span
                style={{
                  fontWeight: 700,
                  color: totals.netBalance >= 0 ? "#059669" : "#dc2626",
                }}
              >
                {totals.netBalance.toFixed(2)} MT
              </span>
            </div>
          </div>
          <div
            style={{
              marginLeft: 12,
              fontSize: 11,
              color: "#6b7280",
              alignSelf: "center",
            }}
            title="Summary always reflects actual stock (reversed + reversals cancel). Status filter only affects which rows are shown in the table."
          >
            (actual stock)
          </div>
        </div>

        {/* Transactions table */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            overflow: "hidden",
          }}
        >
          <div style={{ overflow: "auto", minHeight: 400, maxHeight: 600 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "2px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Trans ID</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Date</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Ticket</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Account</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Commodity</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Location</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Ticket Type</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Trans Type</th>
                  <th style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Quantity (MT)</th>
                  <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700, color: "#64748b", fontSize: 10.5, textTransform: "uppercase", whiteSpace: "nowrap" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={10} style={{ padding: 48, textAlign: "center", color: "#9ca3af", fontSize: 13 }}>
                      No transactions match the current filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((t) => (
                    <tr
                      key={t.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <td style={{ padding: "10px 14px", fontWeight: 600, color: "#6366f1" }}>{t.id}</td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>{formatDate(t.transactionDate)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{ color: "#2563eb", cursor: "pointer", textDecoration: "underline" }}
                          onClick={() => router.push(`/${t.ticketType === "in" ? "incoming" : "outgoing"}?id=${t.ticketId}`)}
                        >
                          #{t.ticketId}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>{getAccountName(t.accountId, t.accountType)}</td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>{getCommodityName(t.commodityId)}</td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>{getLocationName(t.locationId)}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 600, color: t.ticketType === "in" ? "#059669" : "#dc2626" }}>
                          {t.ticketType}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {(() => {
                          const type = t.transactionType;
                          const s = getTransTypeStyle(type);
                          return (
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: s.bg, color: s.color }}>
                              {(type || "N/A").toUpperCase()}
                            </span>
                          );
                        })()}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span style={{ fontWeight: 600, color: (t.quantity ?? 0) >= 0 ? "#059669" : "#dc2626" }}>
                          {(t.quantity ?? 0) >= 0 ? "+" : ""}{(Number(t.quantity) || 0).toFixed(3)}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        {(() => {
                          const c = getStatusColor(t.status);
                          return (
                            <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 10.5, fontWeight: 600, background: c.bg, color: c.text, textTransform: "capitalize" }}>
                              {t.status}
                            </span>
                          );
                        })()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            border: "1px solid #e2e8f0",
            padding: "14px 18px",
            fontSize: 12,
            color: "#64748b",
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 8, color: "#0f1e3d" }}>
            Grain Bank System:
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}
          >
            <div>
              <strong>Incoming Tickets:</strong> 3 transactions created. (1)
              DEPOSIT net weight to customer account, (2) DEDUCT shrinkage from
              customer, (3) ADD shrinkage to shrink account. Example: 25 MT in
              with 10% shrink = +25 MT, -2.5 MT, +2.5 MT to shrink account.
              Customer ends with 22.5 MT.
            </div>
            <div>
              <strong>Outgoing Tickets:</strong> 1 transaction created. Simply
              WITHDRAW net weight from customer account. No shrinkage
              transactions. Example: 20 MT out = -20 MT from customer.
            </div>
            <div>
              <strong>Deposit:</strong> Stock added to customer account
              (positive quantity)
            </div>
            <div>
              <strong>Withdrawal:</strong> Stock removed from customer account
              (negative quantity)
            </div>
            <div>
              <strong>Shrinkage:</strong> Handling loss - only on incoming
              tickets, calculated as percentage of net weight
            </div>
            <div>
              <strong>Adjustment:</strong> When a completed ticket’s weight is
              updated, old entries are marked Adjusted and new entries are
              created (traceability). Manual ledger adjustments are a future
              feature.
            </div>
            <div>
              <strong>Active:</strong> Current valid transaction entries
            </div>
            <div>
              <strong>Adjusted:</strong> Superseded by a weight change on the
              ticket
            </div>
            <div>
              <strong>Reversed:</strong> Cancelled due to ticket deletion
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
