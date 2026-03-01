"use client";
import React from "react";
import { useApp } from "../context/AppContext";
import { Navbar } from "../components/SharedComponents";
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

export default function TransportersPage() {
  const { currentSite, setCurrentSite } = useApp();

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
          Transporters
        </h1>
        <p
          style={{
            margin: "0 0 24px",
            fontSize: 13,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Manage transporter contacts and haulage companies.
        </p>

        <SectionCard
          title="Transporters"
          description="List and manage transporter contacts."
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Transporter entries can be added and edited here. Use this list for
            weighbridge and logistics contact reference.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
