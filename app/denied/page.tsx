import Link from "next/link";

export default function DeniedPage() {
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
        border: "0.5px solid #F09595",
        borderRadius: 16,
        padding: "40px 48px",
        maxWidth: 420,
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ marginBottom: 20 }}>
          <span style={{
            fontSize: 11,
            background: "#FCEBEB",
            color: "#A32D2D",
            padding: "3px 12px",
            borderRadius: 20,
            fontWeight: 500,
          }}>
            Access Denied
          </span>
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 500, margin: "0 0 8px", color: "var(--color-text-primary)" }}>
          Not authorised
        </h1>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 28px", lineHeight: 1.6 }}>
          This dashboard is restricted to @channelfactory.com email addresses.
          Please sign in with your Channel Factory Google account.
        </p>
        <Link href="/login" style={{
          display: "inline-block",
          fontSize: 13,
          fontWeight: 500,
          color: "var(--color-text-primary)",
          background: "var(--color-background-secondary)",
          border: "0.5px solid var(--color-border-secondary)",
          padding: "9px 20px",
          borderRadius: 8,
          textDecoration: "none",
        }}>
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
