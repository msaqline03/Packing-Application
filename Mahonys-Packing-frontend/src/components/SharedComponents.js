"use client";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";

// Shared page layout: use full width on large screens (cap at 1920px)
export const PAGE_MAX_WIDTH = 1920;

// Navbar moved to Navbar.js
export { Navbar } from "./Navbar";

// ─── STATUS BADGE ───────────────────────────────────────────────────────────
const STATUS_STYLES = {
  booked: { bg: "#dbeafe", color: "#1e40af", label: "Booked" },
  processing: { bg: "#fef3c7", color: "#b45309", label: "Processing" },
  completed: { bg: "#d1fae5", color: "#065f46", label: "Completed" },
  cancelled: { bg: "#fee2e2", color: "#991b1b", label: "Cancelled" },
};

const PACK_STATUS_STYLES = {
  Pending: { bg: "#f3f4f6", color: "#4b5563", label: "Pending" },
  Inprogress: { bg: "#dbeafe", color: "#1e40af", label: "In progress" },
  "Awaiting Approval": {
    bg: "#fef3c7",
    color: "#b45309",
    label: "Awaiting Approval",
  },
  "Pending Fumigation": {
    bg: "#fde68a",
    color: "#92400e",
    label: "Pending Fumigation",
  },
  Approved: { bg: "#d1fae5", color: "#065f46", label: "Approved" },
  Invoiced: { bg: "#e0e7ff", color: "#3730a3", label: "Invoiced" },
  Completed: { bg: "#a7f3d0", color: "#064e3b", label: "Completed" },
};

export function StatusBadge({ status, variant }) {
  const styles = variant === "pack" ? PACK_STATUS_STYLES : STATUS_STYLES;
  const s = styles[status] || {
    bg: "#f3f4f6",
    color: "#374151",
    label: status,
  };
  return (
    <span
      style={{
        display: "inline-block",
        background: s.bg,
        color: s.color,
        fontSize: 11,
        fontWeight: 600,
        padding: "2px 8px",
        borderRadius: 12,
        textTransform: "capitalize",
        letterSpacing: 0.3,
        whiteSpace: "nowrap",
      }}
    >
      {s.label}
    </span>
  );
}

export function PackStatusBadge({ status }) {
  return <StatusBadge status={status} variant="pack" />;
}

// ─── MODAL ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 520 }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: 12,
          width: "100%",
          maxWidth: width,
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px 16px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 600,
              color: "#0f1e3d",
            }}
          >
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              color: "#6b7280",
              cursor: "pointer",
              padding: "0 4px",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: "0 24px 24px" }}>{children}</div>
      </div>
    </div>
  );
}

// ─── FORM FIELD ─────────────────────────────────────────────────────────────
export function FormRow({ label, children, required }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label
        style={{
          display: "block",
          fontSize: 12,
          fontWeight: 600,
          color: "#374151",
          marginBottom: 5,
          textTransform: "uppercase",
          letterSpacing: 0.5,
        }}
      >
        {label} {required && <span style={{ color: "#ef4444" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

export function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  style: extraStyle,
  disabled,
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "7px 10px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 13,
        color: "#111827",
        background: disabled ? "#f3f4f6" : "#fff",
        outline: "none",
        boxSizing: "border-box",
        transition: "border-color 0.15s",
        fontFamily: "'Segoe UI', sans-serif",
        ...extraStyle,
      }}
      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
    />
  );
}

// ─── TOGGLE ─────────────────────────────────────────────────────────────────
export function Toggle({ checked, onChange, disabled }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) onChange(!checked);
  };
  return (
    <button
      type="button"
      role="switch"
      aria-checked={!!checked}
      disabled={disabled}
      onClick={handleClick}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        border: "none",
        padding: 0,
        cursor: disabled ? "not-allowed" : "pointer",
        background: checked ? "#3b82f6" : "#cbd5e1",
        position: "relative",
        transition: "background 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 2,
          left: checked ? 20 : 2,
          width: 18,
          height: 18,
          borderRadius: "50%",
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}

export function Select({ value, onChange, children, disabled }) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      style={{
        width: "100%",
        padding: "7px 10px",
        border: "1px solid #d1d5db",
        borderRadius: 6,
        fontSize: 13,
        color: "#111827",
        background: disabled ? "#f3f4f6" : "#fff",
        outline: "none",
        boxSizing: "border-box",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "'Segoe UI', sans-serif",
      }}
      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
      onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
    >
      {children}
    </select>
  );
}

// ─── BUTTONS ────────────────────────────────────────────────────────────────
const BTN_BASE = {
  border: "none",
  borderRadius: 6,
  padding: "7px 14px",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  whiteSpace: "nowrap",
  transition: "all 0.15s",
  fontFamily: "'Segoe UI', sans-serif",
};

export function BtnPrimary({ children, onClick, disabled, style: extra }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_BASE,
        background: disabled
          ? "#93c5fd"
          : "linear-gradient(135deg, #2563eb, #3b82f6)",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: disabled ? "none" : "0 2px 6px rgba(37,99,235,0.35)",
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

export function BtnSecondary({ children, onClick, disabled, style: extra }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_BASE,
        background: "#fff",
        color: "#1e40af",
        border: "1px solid #bfdbfe",
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

export function BtnDanger({ children, onClick, disabled, style: extra }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_BASE,
        background: disabled ? "#fca5a5" : "#dc2626",
        color: "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

export function BtnGhost({ children, onClick, disabled, style: extra }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...BTN_BASE,
        background: "transparent",
        color: "#374151",
        padding: "7px 10px",
        ...extra,
      }}
    >
      {children}
    </button>
  );
}

// ─── DATA TABLE ─────────────────────────────────────────────────────────────
// Columns: [{ id, label, width?, minWidth?, visible?, getValue(row), render?(value, row), sortable?, filterable?, cellStyle? }]
// data, getRowKey(row), onRowClick?, selectedRowKey?, maxHeight?, fillHeight?, emptyMessage?, getRowStyle?(row)
export function DataTable({
  columns: columnsProp,
  data,
  getRowKey,
  onRowClick,
  selectedRowKey,
  maxHeight = 420,
  fillHeight = false,
  emptyMessage = "No data.",
  getRowStyle,
}) {
  const columns = Array.isArray(columnsProp) ? columnsProp : [];
  const [columnVisibility, setColumnVisibility] = useState(() => {
    const o = {};
    columns.forEach((c) => {
      o[c.id] = c.visible !== false;
    });
    return o;
  });
  const [sortState, setSortState] = useState({
    columnId: null,
    direction: null,
  });
  const [columnFilters, setColumnFilters] = useState({});
  const [columnsOpen, setColumnsOpen] = useState(false);
  const columnsRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (columnsRef.current && !columnsRef.current.contains(e.target)) {
        setColumnsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const visibleColumns = useMemo(
    () => columns.filter((c) => columnVisibility[c.id]),
    [columns, columnVisibility],
  );

  const filteredAndSortedData = useMemo(() => {
    const source = Array.isArray(data) ? data : [];
    let result = [...source];
    visibleColumns.forEach((col) => {
      const filterVal = (columnFilters[col.id] || "").trim().toLowerCase();
      if (filterVal && col.filterable !== false) {
        result = result.filter((row) => {
          const val = col.getValue(row);
          const str = val == null ? "" : String(val).toLowerCase();
          return str.includes(filterVal);
        });
      }
    });
    const { columnId, direction } = sortState;
    if (columnId && direction) {
      const col = columns.find((c) => c.id === columnId);
      if (col && col.sortable !== false) {
        result.sort((a, b) => {
          const va = col.getValue(a);
          const vb = col.getValue(b);
          const aNum = typeof va === "number";
          const bNum = typeof vb === "number";
          let cmp = 0;
          if (aNum && bNum) cmp = va - vb;
          else {
            const sa = va == null ? "" : String(va);
            const sb = vb == null ? "" : String(vb);
            cmp = sa.localeCompare(sb, undefined, { numeric: true });
          }
          return direction === "asc" ? cmp : -cmp;
        });
      }
    }
    return result;
  }, [data, visibleColumns, columnFilters, sortState, columns]);

  const toggleColumn = (id) => {
    setColumnVisibility((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const visibleCount = columns.filter((c) => next[c.id]).length;
      if (visibleCount === 0) return prev;
      return next;
    });
  };

  const cycleSort = (columnId) => {
    setSortState((prev) => {
      if (prev.columnId !== columnId) return { columnId, direction: "asc" };
      if (prev.direction === "asc") return { columnId, direction: "desc" };
      return { columnId: null, direction: null };
    });
  };

  const setFilter = (columnId, value) => {
    setColumnFilters((prev) => ({ ...prev, [columnId]: value }));
  };

  const gridTemplateColumns =
    visibleColumns.length > 0
      ? visibleColumns
          .map(
            (c) =>
              c.width || (c.minWidth ? `minmax(${c.minWidth}px, 1fr)` : "1fr"),
          )
          .join(" ")
      : "1fr";

  return (
    <div
      style={{
        flex: "1 1 0",
        minHeight: 0,
        background: "#fff",
        borderRadius: 10,
        border: "1px solid #e2e8f0",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar: column selector */}
      <div
        style={{
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          padding: "6px 14px",
          background: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          gap: 8,
        }}
      >
        <div ref={columnsRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setColumnsOpen((o) => !o)}
            style={{
              ...BTN_BASE,
              background: "#fff",
              color: "#475569",
              border: "1px solid #e2e8f0",
              fontSize: 11,
              padding: "5px 10px",
            }}
          >
            Columns ▾
          </button>
          {columnsOpen && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                marginTop: 4,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: 6,
                minWidth: 160,
                zIndex: 50,
              }}
            >
              {columns.map((col) => (
                <label
                  key={col.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 8px",
                    cursor: "pointer",
                    fontSize: 12,
                    color: "#334155",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={!!columnVisibility[col.id]}
                    onChange={() => toggleColumn(col.id)}
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Table: horizontal + vertical scroll */}
      <div
        style={{
          overflow: "auto",
          flex: 1,
          minHeight: 0,
          ...(fillHeight
            ? {}
            : { minHeight: Math.min(maxHeight, 320), maxHeight }),
        }}
      >
        <div style={{ minWidth: "max-content", minHeight: 200 }}>
          {/* Header row with sort + filter */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns,
              gap: 0,
              background: "#f8fafc",
              borderBottom: "2px solid #e2e8f0",
              padding: "6px 14px",
              fontSize: 10.5,
              fontWeight: 700,
              color: "#64748b",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              position: "sticky",
              top: 0,
              zIndex: 2,
              left: 0,
            }}
          >
            {visibleColumns.map((col) => {
              const isSorted = sortState.columnId === col.id;
              const canSort = col.sortable !== false;
              return (
                <div
                  key={col.id}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      cursor: canSort ? "pointer" : "default",
                    }}
                    onClick={() => canSort && cycleSort(col.id)}
                    role={canSort ? "button" : undefined}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {col.label}
                    </span>
                    {canSort && (
                      <span style={{ color: "#94a3b8", fontSize: 10 }}>
                        {isSorted
                          ? sortState.direction === "asc"
                            ? " ↑"
                            : " ↓"
                          : " ⇅"}
                      </span>
                    )}
                  </div>
                  {col.filterable !== false && (
                    <input
                      type="text"
                      placeholder="Filter..."
                      value={columnFilters[col.id] || ""}
                      onChange={(e) => setFilter(col.id, e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "100%",
                        padding: "3px 6px",
                        border: "1px solid #e2e8f0",
                        borderRadius: 4,
                        fontSize: 11,
                        boxSizing: "border-box",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Body */}
          {filteredAndSortedData.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 48,
                color: "#9ca3af",
                fontSize: 13,
              }}
            >
              {emptyMessage}
            </div>
          ) : (
            filteredAndSortedData.map((row) => {
              const key =
                typeof getRowKey === "function"
                  ? getRowKey(row)
                  : row[getRowKey];
              const isSelected =
                selectedRowKey != null && key === selectedRowKey;
              return (
                <div
                  key={key}
                  onClick={() => onRowClick && onRowClick(row)}
                  role={onRowClick ? "button" : undefined}
                  style={{
                    display: "grid",
                    gridTemplateColumns,
                    gap: 0,
                    padding: "11px 14px",
                    borderBottom: "1px solid #f1f5f9",
                    cursor: onRowClick ? "pointer" : "default",
                    ...(getRowStyle ? getRowStyle(row) : {}),
                    background: isSelected
                      ? "#eff6ff"
                      : (getRowStyle?.(row)?.background ?? "transparent"),
                    transition: "background 0.1s",
                    fontSize: 12.5,
                    color: "#1e293b",
                    alignItems: "center",
                  }}
                >
                  {visibleColumns.map((col) => {
                    let value;
                    let content;
                    try {
                      value =
                        typeof col.getValue === "function"
                          ? col.getValue(row)
                          : row[col.id];
                      content = col.render
                        ? col.render(value, row)
                        : (value ?? "—");
                    } catch (err) {
                      content = "—";
                    }
                    return (
                      <div
                        key={col.id}
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          minWidth: "min-content",
                          ...(col.cellStyle || {}),
                        }}
                      >
                        {content}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
