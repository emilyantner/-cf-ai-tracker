"use client";

import { useState, useRef } from "react";
import { PILLARS, ACTIONS } from "@/lib/data";
import type { StatusKey, Pillar, Task, Action } from "@/lib/data";

const STATUS: Record<StatusKey, { bg: string; text: string; dot: string }> = {
  "Complete":    { bg: "#E1F5EE", text: "#0F6E56", dot: "#1D9E75" },
  "On Track":    { bg: "#EAF3DE", text: "#3B6D11", dot: "#639922" },
  "In Progress": { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD" },
  "At Risk":     { bg: "#FAEEDA", text: "#854F0B", dot: "#BA7517" },
  "Blocked":     { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A" },
  "Not Started": { bg: "#F1EFE8", text: "#5F5E5A", dot: "#888780" },
};

const prodColor: Record<string, { bg: string; text: string }> = {
  "AERO":     { bg: "#EEEDFE", text: "#3C3489" },
  "IQ Series":{ bg: "#E1F5EE", text: "#085041" },
  "Both":     { bg: "#F1EFE8", text: "#444441" },
};

const STATUS_ORDER: StatusKey[] = ["Blocked", "At Risk", "In Progress", "Not Started", "On Track", "Complete"];

function Dot({ s }: { s: StatusKey }) {
  const c = STATUS[s] ?? STATUS["Not Started"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, fontSize: 11, padding: "2px 9px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {s}
    </span>
  );
}

function InlineEdit({ value, onCommit }: { value: string; onCommit: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  const escaping = useRef(false);
  return (
    <input
      autoFocus
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={() => { onCommit(escaping.current ? value : draft); escaping.current = false; }}
      onKeyDown={e => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
        if (e.key === "Escape") { escaping.current = true; (e.target as HTMLInputElement).blur(); }
      }}
      style={{
        fontSize: "inherit", fontFamily: "inherit", fontWeight: "inherit",
        color: "inherit", background: "var(--color-background-secondary)",
        border: "0.5px solid var(--color-border-secondary)",
        borderRadius: 4, padding: "1px 4px", outline: "none",
        minWidth: 60, maxWidth: 180,
      }}
    />
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [pillars, setPillars] = useState<Pillar[]>(PILLARS);
  const [actions, setActions] = useState<Action[]>(ACTIONS);
  const [editingField, setEditingField] = useState<{
    type: "task" | "action";
    id: number;
    pillarId?: string;
    field: "owner" | "due";
  } | null>(null);

  function updateTask(pillarId: string, taskId: number, patch: Partial<Task>) {
    setPillars(prev => prev.map(p =>
      p.id !== pillarId ? p : {
        ...p,
        tasks: p.tasks.map(t => t.id !== taskId ? t : { ...t, ...patch })
      }
    ));
  }

  function updateAction(actionId: number, patch: Partial<Action>) {
    setActions(prev => prev.map(a => a.id !== actionId ? a : { ...a, ...patch }));
  }

  const pillar = pillars.find((p) => p.id === activePillar);

  const totalTasks  = pillars.reduce((a, p) => a + p.tasks.length, 0);
  const doneTasks   = pillars.reduce((a, p) => a + p.tasks.filter((t) => t.status === "Complete").length, 0);
  const atRiskTasks = pillars.reduce((a, p) => a + p.tasks.filter((t) => t.status === "At Risk" || t.status === "Blocked").length, 0);
  const openActions = actions.length;
  const pct = Math.round((doneTasks / totalTasks) * 100);

  const groupedActions = STATUS_ORDER
    .map(s => ({ status: s, items: actions.filter(a => a.status === s) }))
    .filter(g => g.items.length > 0);

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1.5rem 1rem", color: "var(--color-text-primary)", maxWidth: 1000 }}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 21, fontWeight: 500, margin: 0 }}>AI Initiatives Tracker</h1>
          <span style={{ fontSize: 11, color: "var(--color-text-secondary)", background: "var(--color-background-secondary)", padding: "2px 10px", borderRadius: 20, border: "0.5px solid var(--color-border-tertiary)" }}>Channel Factory</span>
          <span style={{ fontSize: 11, color: "#854F0B", background: "#FAEEDA", padding: "2px 10px", borderRadius: 20 }}>Mar 25, 2026</span>
        </div>
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>AERO + IQ Series · All sources integrated through Mar 25</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        {[
          { label: "Overall progress",  value: `${pct}%`,    sub: `${doneTasks} of ${totalTasks} tasks complete` },
          { label: "In progress",        value: pillars.reduce((a, p) => a + p.tasks.filter((t) => t.status === "In Progress").length, 0), sub: "active tasks" },
          { label: "At risk / blocked",  value: atRiskTasks,  sub: "need attention", warn: true },
          { label: "Open actions",       value: openActions,  sub: "require follow-up" },
        ].map((s) => (
          <div key={s.label} style={{ background: s.warn && atRiskTasks > 0 ? "#FAEEDA" : "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: s.warn && atRiskTasks > 0 ? "0.5px solid #FAC775" : "none" }}>
            <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 500, color: s.warn && atRiskTasks > 0 ? "#854F0B" : "var(--color-text-primary)" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Blocker banner */}
      <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 16px", marginBottom: "0.75rem", fontSize: 13, color: "#A32D2D", display: "flex", gap: 8, alignItems: "flex-start" }}>
        <span style={{ fontWeight: 500, flexShrink: 0 }}>Critical:</span>
        <span>AERO launch date still unconfirmed. Sellers need a concrete date + demo. Rod + Tony working session tomorrow (Mar 26) — narrative direction must be locked at that session.</span>
      </div>

      {/* Recommended check-ins */}
      <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--color-text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Recommended check-ins</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { who: "Anudit", note: "Confirm internal tech roadmap was sent to Rod (Tony asked Mar 24, roundtable managers only)", due: "Today" },
            { who: "Rod",    note: "Confirm narrative pre-read received + Thursday session is set to lock direction", due: "Today" },
            { who: "Kevin / ExCo", note: "Schedule deeper AERO agent session — Nick + Chelsea to be included", due: "This week" },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", color: "var(--color-text-primary)", padding: "2px 10px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap", minWidth: 60, textAlign: "center" }}>{c.who}</span>
              <span style={{ fontSize: 13, color: "var(--color-text-primary)", flex: 1, minWidth: 120 }}>{c.note}</span>
              <span style={{ fontSize: 11, color: c.due === "Today" || c.due === "ASAP" ? "#854F0B" : "var(--color-text-secondary)", background: c.due === "Today" || c.due === "ASAP" ? "#FAEEDA" : "transparent", padding: c.due === "Today" || c.due === "ASAP" ? "2px 8px" : "0", borderRadius: 20, fontWeight: c.due === "Today" || c.due === "ASAP" ? 500 : 400, whiteSpace: "nowrap" }}>{c.due}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, borderBottom: "0.5px solid var(--color-border-tertiary)", marginBottom: "1.5rem" }}>
        {["overview", "actions", "narrative"].map((t) => (
          <button key={t} onClick={() => { setActiveTab(t); setActivePillar(null); }} style={{ fontSize: 12, fontWeight: activeTab === t ? 500 : 400, padding: "8px 14px", background: "transparent", border: "none", borderBottom: activeTab === t ? "2px solid var(--color-text-primary)" : "2px solid transparent", cursor: "pointer", color: activeTab === t ? "var(--color-text-primary)" : "var(--color-text-secondary)", marginBottom: -1, textTransform: "capitalize" }}>
            {t === "actions" ? `open actions (${openActions})` : t}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {activeTab === "overview" && !activePillar && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Select a workstream to drill into its tasks.</p>
          {pillars.map((p) => {
            const done = p.tasks.filter((t) => t.status === "Complete").length;
            const risk = p.tasks.filter((t) => t.status === "At Risk" || t.status === "Blocked").length;
            const pctP = Math.round((done / p.tasks.length) * 100);
            return (
              <div key={p.id} onClick={() => setActivePillar(p.id)}
                style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderLeft: `3px solid ${p.color}`, borderRadius: "0 10px 10px 0", padding: "14px 18px", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background-secondary)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-background-primary)")}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{p.label}</span>
                  <Dot s={p.status} />
                  {risk > 0 && <span style={{ fontSize: 11, background: "#FCEBEB", color: "#A32D2D", padding: "2px 8px", borderRadius: 20 }}>{risk} at risk</span>}
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--color-text-secondary)" }}>Owner: {p.owner}</span>
                </div>
                <p style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "0 0 10px" }}>{p.description}</p>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ flex: 1, height: 4, background: "var(--color-background-secondary)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ width: `${pctP}%`, height: "100%", background: p.color, borderRadius: 4 }} />
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{done}/{p.tasks.length} complete</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PILLAR DRILL DOWN */}
      {activeTab === "overview" && activePillar && pillar && (
        <div>
          <button onClick={() => { setActivePillar(null); setExpandedTask(null); }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "transparent", border: "none", cursor: "pointer", padding: "0 0 12px", display: "flex", alignItems: "center", gap: 4 }}>
            ← back to overview
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: pillar.color, flexShrink: 0 }} />
            <h2 style={{ fontSize: 17, fontWeight: 500, margin: 0 }}>{pillar.label}</h2>
            <Dot s={pillar.status} />
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 1.25rem" }}>{pillar.description} · Owner: {pillar.owner}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pillar.tasks.map((t) => {
              const isOpen = expandedTask === t.id;
              const sc = STATUS[t.status] ?? STATUS["Not Started"];
              return (
                <div key={t.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
                  <div onClick={() => setExpandedTask(isOpen ? null : t.id)}
                    style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-background-secondary)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 400 }}>{t.task}</span>
                    <Dot s={t.status} />
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{t.due}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 16px 14px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          Owner:{" "}
                          {editingField?.type === "task" && editingField.id === t.id && editingField.field === "owner" ? (
                            <InlineEdit
                              value={t.owner}
                              onCommit={v => { updateTask(pillar.id, t.id, { owner: v }); setEditingField(null); }}
                            />
                          ) : (
                            <strong
                              style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }}
                              onClick={e => { e.stopPropagation(); setEditingField({ type: "task", id: t.id, pillarId: pillar.id, field: "owner" }); }}
                            >{t.owner}</strong>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>
                          Due:{" "}
                          {editingField?.type === "task" && editingField.id === t.id && editingField.field === "due" ? (
                            <InlineEdit
                              value={t.due}
                              onCommit={v => { updateTask(pillar.id, t.id, { due: v }); setEditingField(null); }}
                            />
                          ) : (
                            <strong
                              style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }}
                              onClick={e => { e.stopPropagation(); setEditingField({ type: "task", id: t.id, pillarId: pillar.id, field: "due" }); }}
                            >{t.due}</strong>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "8px 0 0", lineHeight: 1.6 }}>{t.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* OPEN ACTIONS */}
      {activeTab === "actions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 0" }}>Items that need someone to move on them now. Click owner or due date to edit.</p>
          {groupedActions.map(group => (
            <div key={group.status}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Dot s={group.status} />
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{group.items.length} item{group.items.length !== 1 ? "s" : ""}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {group.items.map((a) => {
                  const pc = prodColor[a.product] ?? prodColor["Both"];
                  const isUrgent = a.due === "ASAP" || a.due === "Today" || a.due === "Mar 26";
                  return (
                    <div key={a.id} style={{ background: "var(--color-background-primary)", border: `0.5px solid ${isUrgent ? "#FAC775" : "var(--color-border-tertiary)"}`, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ background: pc.bg, color: pc.text, fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" }}>{a.product}</span>
                      <span style={{ flex: 1, fontSize: 13, minWidth: 160 }}>{a.task}</span>
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        Owner:{" "}
                        {editingField?.type === "action" && editingField.id === a.id && editingField.field === "owner" ? (
                          <InlineEdit
                            value={a.owner}
                            onCommit={v => { updateAction(a.id, { owner: v }); setEditingField(null); }}
                          />
                        ) : (
                          <strong
                            style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }}
                            onClick={() => setEditingField({ type: "action", id: a.id, field: "owner" })}
                          >{a.owner}</strong>
                        )}
                      </span>
                      <span style={{ fontSize: 12, color: isUrgent ? "#854F0B" : "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        {editingField?.type === "action" && editingField.id === a.id && editingField.field === "due" ? (
                          <InlineEdit
                            value={a.due}
                            onCommit={v => { updateAction(a.id, { due: v }); setEditingField(null); }}
                          />
                        ) : (
                          <strong
                            style={{ fontWeight: isUrgent ? 500 : 400, color: isUrgent ? "#854F0B" : "var(--color-text-secondary)", background: isUrgent ? "#FAEEDA" : "transparent", padding: isUrgent ? "2px 8px" : "0", borderRadius: isUrgent ? 20 : 0, cursor: "text", display: "inline-block" }}
                            onClick={() => setEditingField({ type: "action", id: a.id, field: "due" })}
                          >{a.due}</strong>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NARRATIVE REFERENCE */}
      {activeTab === "narrative" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Current confirmed direction as of Mar 25. Rod pre-read sent to Tony tonight.</p>
          {[
            { label: "What AERO is",          content: "AERO is NOT a standalone product. It is the horizontal intelligence layer that powers and augments every pillar of IQ Series. IQ Series = what we deliver. AERO = how it's supercharged." },
            { label: "Two workstreams",        content: "(1) Corporate Sales Narrative — leads with 3 core client problems (contextual targeting, brand suitability, ROI) in plain layman's terms, then IQ Series as the 10yr foundation, then AERO as the agentic layer. (2) AERO Marketing Campaign Strategy — external-facing campaign for website, PR, advertising." },
            { label: "Campaign positioning",   content: "Dual-axis anchor: AERO unlocks Suitability + ROI for YouTube and Walled Gardens. Under Suitability: contextual intel, AI slop/content quality, trend detection, brand safety. Under ROI: guaranteed outcomes, cross-platform efficiency, data-driven decisioning, margin + waste reduction." },
            { label: "3 campaign angles (Thu)", content: "'The Unfair Advantage' — AERO as the unfair advantage inside walled gardens. 'Suitability Meets Performance' — first solution to deliver both, counter-positions vs. single-axis competitors. 'Compounding Intelligence' — every dollar through AERO makes the next smarter, appeals to sophisticated buyers + CFOs." },
            { label: "Data moat language",     content: "No longer cite '$4 billion' specifically. All references now use 'billions of dollars of historical campaign performance data.'" },
            { label: "IQ Series structure",    content: "4 pillars: Creative (Generate, Evaluate, Align, Iterate, Measure) · ViewIQ (Classify, Forecast, Target, Enforce, Inspect) · ActivateIQ (Deploy, Validate, Bid, Allocate, Control) · Reporting (Unify, Monitor, Analyze, Model, Learn)" },
            { label: "Key stats",              content: "Avg ROAS 5.96 · 82% outperformance vs native YouTube · 90% reduction in planning cycles · 30+ markets · 600+ employees · YTMP + YTAP accredited · Comscore exclusive partner" },
            { label: "GTM Hub",                content: "demo.channelfactory.com/gtm — CF email login required, desktop only. All AERO assets, decks, demo videos, case studies housed here." },
          ].map((n) => (
            <div key={n.label} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 500, minWidth: 160, flexShrink: 0, color: "var(--color-text-secondary)" }}>{n.label}</div>
              <div style={{ fontSize: 13, flex: 1, lineHeight: 1.6 }}>{n.content}</div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
