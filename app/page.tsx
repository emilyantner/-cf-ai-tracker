import Dashboard from "@/components/Dashboard";

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", padding: "2rem 1rem", background: "var(--color-background-secondary)" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <Dashboard />
      </div>
    </main>
  );
}
