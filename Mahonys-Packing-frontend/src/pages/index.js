"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace("/incoming"); }, [router]);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f1e3d, #1a3a6b)", fontFamily: "'Segoe UI', sans-serif" }}>
      <div style={{ textAlign: "center", color: "#fff" }}>
        <div style={{ width: 64, height: 64, background: "linear-gradient(135deg, #3b82f6, #60a5fa)", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, fontWeight: 700, margin: "0 auto 20px" }}>W</div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700 }}>Mahonys EMS</h1>
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, margin: "8px 0 0" }}>Loading…</p>
      </div>
    </div>
  );
}
