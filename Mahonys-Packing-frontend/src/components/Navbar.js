"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const PAGE_MAX_WIDTH = 1920;

const NAV_ITEMS = [
  {
    label: "Tickets",
    children: [
      { label: "Incoming", href: "/incoming" },
      { label: "Outgoing", href: "/outgoing" },
      { label: "CMO", href: "/cmo-edit" },
    ],
  },
  {
    label: "Packing",
    children: [
      { label: "Packing Table", href: "/packing-schedule" },
      { label: "Schedule", href: "/vessel-scheduler" },
      { label: "Container Packing", href: "/container-packing" },
      { label: "Bulk Packing", href: "/bulk-packing" },
    ],
  },
  {
    label: "Stock Management",
    children: [
      { label: "Stock Transfer", href: "/stock-transfer" },
      { label: "All Transactions", href: "/transactions" },
      { label: "Account Balances", href: "/account-balances" },
      { label: "Stock Locations", href: "/stockLocations" },
    ],
  },
  {
    label: "Products",
    children: [
      { label: "Commodity Type", href: "/commodityTypes" },
      { label: "Commodity", href: "/commodities" },
      { label: "Shrink Settings", href: "/shrink-settings" },
      { label: "Test", href: "/tests" },
    ],
  },
  {
    label: "Contacts",
    children: [
      { label: "Customers", href: "/customers" },
      { label: "Internal Accounts", href: "/internalAccounts" },
      { label: "Empty Container Parks", href: "/empty-container-parks" },
      { label: "Terminals", href: "/terminals" },
      { label: "Transporters", href: "/transporters" },
      { label: "Shipping Lines", href: "/shipping-lines" },
      { label: "Users", href: "/users" },
      { label: "User Permissions", href: "/userPermissions" },
    ],
  },
  {
    label: "Reference Data",
    children: [
      { label: "Container Codes", href: "/container-codes" },
      { label: "Countries", href: "/countries" },
      { label: "Packers", href: "/packers" },
      { label: "Ports", href: "/ports" },
      { label: "Vessels", href: "/vessels" },
      { label: "Trucks", href: "/trucks" },
      { label: "Fumigations", href: "/fumigations" },
    ],
  },
  {
    label: "Price Settings",
    children: [
      { label: "General Pack Pricing", href: "/commodity-pricing" },
      { label: "Fees and Charges", href: "/packing-prices" },
      { label: "General Transport Prices", href: "/general-transport-prices" },
      { label: "Terminal Price", href: "/terminals" },
      { label: "Empty Park Prices", href: "/empty-container-parks" },
    ],
  },
  { label: "Reports", href: "/reports" },
];

const MOBILE_BREAKPOINT = 900;

function childHrefMatches(pathname, child) {
  return (
    pathname === child.href ||
    (child.href === "/incoming" && pathname === "/ticket/in") ||
    (child.href === "/outgoing" && pathname === "/ticket/out") ||
    (child.href === "/customers" && pathname === "/customers") ||
    (child.href === "/internalAccounts" && pathname === "/internalAccounts") ||
    (child.href === "/empty-container-parks" &&
      pathname === "/empty-container-parks") ||
    (child.href === "/terminals" && pathname === "/terminals") ||
    (child.href === "/transporters" && pathname === "/transporters") ||
    (child.href === "/shipping-lines" && pathname === "/shipping-lines") ||
    (child.href === "/users" && pathname === "/users") ||
    (child.href === "/userPermissions" && pathname === "/userPermissions") ||
    (child.href === "/container-codes" && pathname === "/container-codes") ||
    (child.href === "/countries" && pathname === "/countries") ||
    (child.href === "/ports" && pathname === "/ports") ||
    (child.href === "/vessels" && pathname === "/vessels") ||
    (child.href === "/vessel-scheduler" && pathname === "/vessel-scheduler") ||
    (child.href === "/trucks" && pathname === "/trucks") ||
    (child.href === "/fumigations" && pathname === "/fumigations")
  );
}

function HamburgerIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronIcon({ down = true }) {
  return (
    <span
      style={{
        fontSize: 10,
        marginLeft: 2,
        transition: "transform 0.2s",
        display: "inline-block",
        transform: down ? "rotate(0deg)" : "rotate(180deg)",
      }}
    >
      ▼
    </span>
  );
}

export function Navbar({ site, onSiteChange, sites }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openMobileMenus, setOpenMobileMenus] = useState({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // When mobile menu opens, expand the first-level item that contains the current page
  useEffect(() => {
    if (!mobileOpen || !isMobile) return;
    setOpenMobileMenus((prev) => {
      const next = { ...prev };
      NAV_ITEMS.forEach((item) => {
        if (item.children) {
          const isChildActive =
            item.label === "Price Settings" &&
            (pathname === "/terminals" || pathname === "/empty-container-parks")
              ? false
              : item.children.some((c) => childHrefMatches(pathname, c));
          if (isChildActive) next[item.label] = true;
        }
      });
      return next;
    });
  }, [mobileOpen, isMobile, pathname]);

  const handleMobileMenuToggle = (label) => {
    setOpenMobileMenus((prev) => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  const handleNavigate = (href) => {
    router.push(href);
    setMobileOpen(false);
  };

  const navStyle = {
    background: "linear-gradient(135deg, #0f1e3d 0%, #1a3a6b 100%)",
    boxShadow: "0 2px 12px rgba(0,0,0,0.25)",
    position: "sticky",
    top: 0,
    zIndex: 100,
    width: "100%",
  };

  return (
    <>
      <nav style={navStyle}>
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: isMobile ? "0 12px" : "0 24px",
            height: 56,
            maxWidth: PAGE_MAX_WIDTH,
            margin: "0 auto",
            width: isMobile ? "100%" : "98%",
            minWidth: 0,
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              minWidth: 0,
              flex: isMobile ? "none" : "1 1 auto",
            }}
          >
            {isMobile && (
              <button
                onClick={() => setMobileOpen(true)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
                aria-label="Open menu"
              >
                <HamburgerIcon size={28} />
              </button>
            )}
            <div
              style={{
                width: isMobile ? 26 : 32,
                height: isMobile ? 26 : 32,
                background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                borderRadius: isMobile ? 6 : 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: isMobile ? 13 : 16,
                fontWeight: 700,
                color: "#fff",
                flexShrink: 0,
              }}
            >
              W
            </div>
            <span
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: isMobile ? 14 : 17,
                letterSpacing: "-0.3px",
                fontFamily: "'Segoe UI', sans-serif",
              }}
            >
              Mahonys EMS
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 10 : 16,
              flexShrink: 0,
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 4 : 6,
                background: "rgba(255,255,255,0.08)",
                borderRadius: isMobile ? 20 : 6,
                padding: isMobile ? "6px 12px" : "4px 10px",
                border: isMobile
                  ? "1px solid rgba(255,255,255,0.15)"
                  : "none",
              }}
            >
              {!isMobile && (
                <span
                  style={{
                    color: "rgba(255,255,255,0.5)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Site
                </span>
              )}
              <select
                value={site}
                onChange={(e) => onSiteChange(Number(e.target.value))}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  fontSize: isMobile ? 12 : 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  outline: "none",
                  padding: isMobile ? "2px 0" : "2px 4px",
                  maxWidth: isMobile ? 100 : "none",
                  fontFamily: "'Segoe UI', sans-serif",
                }}
              >
                {sites.map((s) => (
                  <option
                    key={s.id}
                    value={s.id}
                    style={{ background: "#1a3a6b", color: "#fff" }}
                  >
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              JM
            </div>
          </div>
        </div>

        {/* Desktop Tab bar - hidden on mobile */}
        {!isMobile && (
          <div
            style={{
              display: "flex",
              gap: 2,
              padding: "0 24px",
              maxWidth: PAGE_MAX_WIDTH,
              margin: "0 auto",
              borderTop: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {NAV_ITEMS.map((item, idx) => {
              if (item.children) {
                const isOpen = openDropdown === idx;
                const isChildActive =
                  item.label === "Price Settings" &&
                  (pathname === "/terminals" ||
                    pathname === "/empty-container-parks")
                    ? false
                    : item.children.some((c) => childHrefMatches(pathname, c));
                return (
                  <div
                    key={item.label}
                    style={{ position: "relative" }}
                    onMouseEnter={() => setOpenDropdown(idx)}
                    onMouseLeave={() => setOpenDropdown(null)}
                  >
                    <button
                      style={{
                        background: isChildActive
                          ? "rgba(59,130,246,0.2)"
                          : "transparent",
                        border: "none",
                        borderBottom: isChildActive
                          ? "2px solid #60a5fa"
                          : "2px solid transparent",
                        color: isChildActive
                          ? "#60a5fa"
                          : "rgba(255,255,255,0.55)",
                        padding: "10px 16px",
                        cursor: "pointer",
                        fontSize: 13,
                        fontWeight: isChildActive ? 600 : 500,
                        borderRadius: "6px 6px 0 0",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        whiteSpace: "nowrap",
                        fontFamily: "'Segoe UI', sans-serif",
                      }}
                    >
                      {item.label}
                      <ChevronIcon down={!isOpen} />
                    </button>
                    {isOpen && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: 0,
                          background: "#1a3a6b",
                          borderRadius: "0 0 8px 8px",
                          boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                          minWidth: 160,
                          paddingTop: 4,
                          zIndex: 200,
                        }}
                      >
                        {item.children.map((child) => {
                          const childActive =
                            pathname === child.href ||
                            (child.href === "/incoming" &&
                              pathname === "/ticket/in") ||
                            (child.href === "/outgoing" &&
                              pathname === "/ticket/out");
                          return (
                            <button
                              key={child.href}
                              onClick={() => {
                                router.push(child.href);
                                setOpenDropdown(null);
                              }}
                              style={{
                                width: "100%",
                                background: childActive
                                  ? "rgba(59,130,246,0.2)"
                                  : "transparent",
                                border: "none",
                                color: childActive
                                  ? "#60a5fa"
                                  : "rgba(255,255,255,0.75)",
                                padding: "10px 16px",
                                cursor: "pointer",
                                fontSize: 13,
                                fontWeight: childActive ? 600 : 500,
                                textAlign: "left",
                                transition: "all 0.15s",
                                fontFamily: "'Segoe UI', sans-serif",
                              }}
                              onMouseEnter={(e) => {
                                if (!childActive) {
                                  e.target.style.background =
                                    "rgba(255,255,255,0.08)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!childActive) {
                                  e.target.style.background = "transparent";
                                }
                              }}
                            >
                              {child.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              const active =
                pathname === item.href ||
                (item.href === "/stockLocations" &&
                  pathname === "/stockLocations") ||
                (item.href === "/reports" && pathname === "/reports");
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  style={{
                    background: active ? "rgba(59,130,246,0.2)" : "transparent",
                    border: "none",
                    borderBottom: active
                      ? "2px solid #60a5fa"
                      : "2px solid transparent",
                    color: active ? "#60a5fa" : "rgba(255,255,255,0.55)",
                    padding: "10px 16px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: active ? 600 : 500,
                    borderRadius: "6px 6px 0 0",
                    transition: "all 0.2s",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    whiteSpace: "nowrap",
                    fontFamily: "'Segoe UI', sans-serif",
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileOpen && isMobile && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            zIndex: 1000,
          }}
          onClick={() => setMobileOpen(false)}
        >
          <div
            style={{
              background: "#fff",
              width: 320,
              maxWidth: "85vw",
              height: "100%",
              boxShadow: "4px 0 20px rgba(0,0,0,0.2)",
              overflowY: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile drawer header - same height (56px) as main navbar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 16px",
                height: 56,
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                background: "linear-gradient(135deg, #0f1e3d 0%, #1a3a6b 100%)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "linear-gradient(135deg, #3b82f6, #60a5fa)",
                    borderRadius: 8,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  W
                </div>
                <span
                  style={{
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 17,
                    fontFamily: "'Segoe UI', sans-serif",
                  }}
                >
                  Mahonys EMS
                </span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 4,
                  cursor: "pointer",
                  color: "#fff",
                  display: "flex",
                }}
                aria-label="Close menu"
              >
                <CloseIcon size={28} />
              </button>
            </div>

            {/* Mobile menu items */}
            <div style={{ padding: 16 }}>
              {NAV_ITEMS.map((item) => {
                if (item.children) {
                  const isOpen = openMobileMenus[item.label];
                  const isChildActive =
                    item.label === "Price Settings" &&
                    (pathname === "/terminals" ||
                      pathname === "/empty-container-parks")
                      ? false
                      : item.children.some((c) => childHrefMatches(pathname, c));

                  return (
                    <div key={item.label} style={{ marginBottom: 4 }}>
                      <button
                        onClick={() => handleMobileMenuToggle(item.label)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          background: isChildActive
                            ? "rgba(59,130,246,0.12)"
                            : "transparent",
                          border: "none",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 14,
                          fontWeight: isChildActive ? 600 : 500,
                          color: isChildActive ? "#2563eb" : "#1e293b",
                          fontFamily: "'Segoe UI', sans-serif",
                          textAlign: "left",
                        }}
                      >
                        {item.label}
                        <ChevronIcon down={!isOpen} />
                      </button>
                      {isOpen && (
                        <div
                          style={{
                            marginLeft: 16,
                            marginTop: 4,
                            paddingLeft: 16,
                            borderLeft: "2px solid #e2e8f0",
                          }}
                        >
                          {item.children.map((child) => {
                            const childActive =
                              pathname === child.href ||
                              (child.href === "/incoming" &&
                                pathname === "/ticket/in") ||
                              (child.href === "/outgoing" &&
                                pathname === "/ticket/out");
                            return (
                              <button
                                key={child.href}
                                onClick={() => handleNavigate(child.href)}
                                style={{
                                  display: "block",
                                  width: "100%",
                                  padding: "10px 12px",
                                  marginBottom: 2,
                                  background: childActive
                                    ? "rgba(59,130,246,0.12)"
                                    : "transparent",
                                  border: "none",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  fontSize: 13,
                                  fontWeight: childActive ? 600 : 500,
                                  color: childActive ? "#2563eb" : "#475569",
                                  fontFamily: "'Segoe UI', sans-serif",
                                  textAlign: "left",
                                }}
                              >
                                {child.label}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active =
                  pathname === item.href ||
                  (item.href === "/stockLocations" &&
                    pathname === "/stockLocations") ||
                  (item.href === "/reports" && pathname === "/reports");

                return (
                  <button
                    key={item.href}
                    onClick={() => handleNavigate(item.href)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      padding: "12px 16px",
                      marginBottom: 4,
                      background: active
                        ? "rgba(59,130,246,0.12)"
                        : "transparent",
                      border: "none",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      color: active ? "#2563eb" : "#1e293b",
                      fontFamily: "'Segoe UI', sans-serif",
                      textAlign: "left",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
