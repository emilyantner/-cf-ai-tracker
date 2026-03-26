"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      setError("Incorrect password. Try again.");
      setLoading(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--color-background-secondary)",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--color-background-primary)",
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: 16,
        padding: "40px 48px",
        maxWidth: 420,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ marginBottom: 24 }}>
          <span style={{
            fontSize: 11,
            color: "#854F0B",
            background: "#FAEEDA",
            padding: "3px 12px",
            borderRadius: 20,
            fontWeight: 500,
          }}>
            Channel Factory Internal
          </span>
        </div>

        <h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 8px", color: "var(--color-text-primary)" }}>
          AI Initiatives Tracker
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 32px", lineHeight: 1.6 }}>
          AERO + IQ Series · Executive Dashboard
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoFocus
            style={{
              width: "100%",
              padding: "10px 14px",
              fontSize: 14,
              border: "0.5px solid var(--color-border-secondary)",
              borderRadius: 8,
              background: "var(--color-background-secondary)",
              color: "var(--color-text-primary)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: "#A32D2D", margin: 0 }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 500,
              background: "var(--color-text-primary)",
              color: "var(--color-background-primary)",
              border: "none",
              borderRadius: 8,
              cursor: loading || !password ? "not-allowed" : "pointer",
              opacity: loading || !password ? 0.5 : 1,
            }}
          >
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>
      </div>
    </main>
  );
}
