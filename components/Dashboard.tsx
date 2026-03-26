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

const STATUS_OPTIONS: StatusKey[] = ["Not Started", "In Progress", "On Track", "At Risk", "Blocked", "Complete"];
const STATUS_ORDER:   StatusKey[] = ["Blocked", "At Risk", "In Progress", "Not Started", "On Track", "Complete"];

const prodColor: Record<string, { bg: string; text: string }> = {
  "AERO":     { bg: "#EEEDFE", text: "#3C3489" },
  "IQ Series":{ bg: "#E1F5EE", text: "#085041" },
  "Both":     { bg: "#F1EFE8", text: "#444441" },
};

interface ReferenceDoc {
  id: number;
  name: string;
  summary: string;
  content: string;
  uploadedAt: string;
}

type SuggestionKind =
  | { kind: "task_status";  pillarId: string; taskId: number; taskLabel: string; newStatus: StatusKey; reason: string }
  | { kind: "task_owner";   pillarId: string; taskId: number; taskLabel: string; newOwner: string; reason: string }
  | { kind: "task_due";     pillarId: string; taskId: number; taskLabel: string; newDue: string; reason: string }
  | { kind: "action_status"; actionId: number; actionLabel: string; newStatus: StatusKey; reason: string }
  | { kind: "action_owner";  actionId: number; actionLabel: string; newOwner: string; reason: string }
  | { kind: "action_due";    actionId: number; actionLabel: string; newDue: string; reason: string }
  | { kind: "new_action"; owner: string; due: string; product: "AERO" | "IQ Series" | "Both"; task: string; reason: string };

interface SuggestionsResponse {
  summary: string;
  suggestions: SuggestionKind[];
}

function suggestionLabel(s: SuggestionKind): string {
  switch (s.kind) {
    case "task_status":   return `${s.taskLabel} → status: ${s.newStatus}`;
    case "task_owner":    return `${s.taskLabel} → owner: ${s.newOwner}`;
    case "task_due":      return `${s.taskLabel} → due: ${s.newDue}`;
    case "action_status": return `Action: "${s.actionLabel}" → status: ${s.newStatus}`;
    case "action_owner":  return `Action: "${s.actionLabel}" → owner: ${s.newOwner}`;
    case "action_due":    return `Action: "${s.actionLabel}" → due: ${s.newDue}`;
    case "new_action":    return `New action: "${s.task}" (${s.owner}, ${s.due})`;
  }
}

function Dot({ s }: { s: StatusKey }) {
  const c = STATUS[s] ?? STATUS["Not Started"];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: c.bg, color: c.text, fontSize: 11, padding: "2px 9px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: c.dot, flexShrink: 0 }} />
      {s}
    </span>
  );
}

function StatusSelect({ value, onChange }: { value: StatusKey; onChange: (s: StatusKey) => void }) {
  const c = STATUS[value];
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as StatusKey)}
      onClick={e => e.stopPropagation()}
      style={{ fontSize: 11, fontFamily: "inherit", border: "0.5px solid var(--color-border-secondary)", borderRadius: 4, padding: "2px 6px", background: c.bg, color: c.text, cursor: "pointer", outline: "none", fontWeight: 500 }}
    >
      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
    </select>
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
  const [activeTab, setActiveTab]       = useState("overview");
  const [activePillar, setActivePillar] = useState<string | null>(null);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusKey[] | null>(null);
  const [pillars, setPillars]           = useState<Pillar[]>(PILLARS);
  const [actions, setActions]           = useState<Action[]>(ACTIONS);
  const [editingField, setEditingField] = useState<{
    type: "task" | "action";
    id: number;
    pillarId?: string;
    field: "owner" | "due";
  } | null>(null);
  const [uploadState, setUploadState]     = useState<"idle" | "loading" | "error">("idle");
  const [uploadError, setUploadError]     = useState<string | null>(null);
  const [suggestions, setSuggestions]     = useState<SuggestionsResponse | null>(null);
  const [accepted, setAccepted]           = useState<Set<number>>(new Set());
  const [showUploadPicker, setShowUploadPicker] = useState(false);
  const [uploadMode, setUploadMode]       = useState<"analyze" | "reference" | null>(null);
  const [references, setReferences]       = useState<ReferenceDoc[]>([]);
  const [expandedRef, setExpandedRef]     = useState<number | null>(null);
  const fileInputRef                       = useRef<HTMLInputElement>(null);

  function updateTask(pillarId: string, taskId: number, patch: Partial<Task>) {
    setPillars(prev => prev.map(p =>
      p.id !== pillarId ? p : { ...p, tasks: p.tasks.map(t => t.id !== taskId ? t : { ...t, ...patch }) }
    ));
  }

  function updateAction(actionId: number, patch: Partial<Action>) {
    setActions(prev => prev.map(a => a.id !== actionId ? a : { ...a, ...patch }));
  }

  function goToFilter(filter: StatusKey[]) {
    setActiveTab("overview");
    setActivePillar(null);
    setExpandedTask(null);
    setStatusFilter(filter);
  }

  function pickUploadMode(mode: "analyze" | "reference") {
    setUploadMode(mode);
    setShowUploadPicker(false);
    fileInputRef.current?.click();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadState("loading");
    setUploadError(null);
    const form = new FormData();
    form.append("file", file);
    try {
      if (uploadMode === "reference") {
        const res = await fetch("/api/reference", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as { name: string; summary: string; content: string };
        setReferences(prev => [...prev, {
          id: Date.now(),
          name: data.name,
          summary: data.summary,
          content: data.content,
          uploadedAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        }]);
        setActiveTab("references");
      } else {
        setSuggestions(null);
        setAccepted(new Set());
        const res = await fetch("/api/analyze", { method: "POST", body: form });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Unknown error" }));
          throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
        }
        const data: SuggestionsResponse = await res.json();
        setSuggestions(data);
      }
      setUploadState("idle");
    } catch (err: unknown) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setUploadState("error");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setUploadMode(null);
    }
  }

  function applyAccepted() {
    if (!suggestions) return;
    const newActions: Action[] = [];
    suggestions.suggestions.forEach((s, i) => {
      if (!accepted.has(i)) return;
      if (s.kind === "task_status") updateTask(s.pillarId, s.taskId, { status: s.newStatus });
      if (s.kind === "task_owner")  updateTask(s.pillarId, s.taskId, { owner: s.newOwner });
      if (s.kind === "task_due")    updateTask(s.pillarId, s.taskId, { due: s.newDue });
      if (s.kind === "action_status") updateAction(s.actionId, { status: s.newStatus });
      if (s.kind === "action_owner")  updateAction(s.actionId, { owner: s.newOwner });
      if (s.kind === "action_due")    updateAction(s.actionId, { due: s.newDue });
      if (s.kind === "new_action") newActions.push({ id: 0, owner: s.owner, due: s.due, product: s.product, task: s.task, status: "Not Started" });
    });
    if (newActions.length > 0) {
      setActions(prev => {
        const maxId = Math.max(0, ...prev.map(a => a.id));
        return [...prev, ...newActions.map((a, idx) => ({ ...a, id: maxId + idx + 1 }))];
      });
    }
    setSuggestions(null);
    setAccepted(new Set());
  }

  const pillar        = pillars.find(p => p.id === activePillar);
  const totalTasks    = pillars.reduce((a, p) => a + p.tasks.length, 0);
  const doneTasks     = pillars.reduce((a, p) => a + p.tasks.filter(t => t.status === "Complete").length, 0);
  const inProgress    = pillars.reduce((a, p) => a + p.tasks.filter(t => t.status === "In Progress").length, 0);
  const priorityCount = pillars.reduce((a, p) => a + p.tasks.filter(t => t.status === "At Risk" || t.status === "Blocked").length, 0);
  const pct           = Math.round((doneTasks / totalTasks) * 100);

  const flaggedTasks = pillars.flatMap(p =>
    p.tasks.filter(t => t.status === "Blocked" || t.status === "At Risk")
      .map(t => ({ ...t, pillarLabel: p.label, pillarColor: p.color, pillarId: p.id }))
  );
  const flaggedActions = actions.filter(a => a.status === "Blocked" || a.status === "At Risk");
  const hasFlagged     = flaggedTasks.length > 0 || flaggedActions.length > 0;

  const groupedActions = STATUS_ORDER
    .map(s => ({ status: s, items: actions.filter(a => a.status === s) }))
    .filter(g => g.items.length > 0);

  const filteredTasks = statusFilter
    ? pillars.flatMap(p => p.tasks.filter(t => statusFilter.includes(t.status)).map(t => ({ ...t, pillarId: p.id, pillarLabel: p.label, pillarColor: p.color })))
    : [];

  return (
    <div style={{ fontFamily: "var(--font-sans)", padding: "1.5rem 1rem", color: "var(--color-text-primary)", maxWidth: 1000, margin: "0 auto" }} onClick={() => setShowUploadPicker(false)}>

      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
          <h1 style={{ fontSize: 21, fontWeight: 600, margin: 0, fontFamily: "var(--font-heading)", color: "var(--color-brand-navy)" }}>AI Initiatives Tracker</h1>
          <span style={{ fontSize: 11, color: "#ffffff", background: "var(--color-brand-navy)", padding: "2px 10px", borderRadius: 20 }}>Channel Factory</span>
          <span style={{ fontSize: 11, color: "#854F0B", background: "#FAEEDA", padding: "2px 10px", borderRadius: 20 }}>Mar 25, 2026</span>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.txt" style={{ display: "none" }} onChange={handleFileUpload} />
            <button
              onClick={() => setShowUploadPicker(p => !p)}
              disabled={uploadState === "loading"}
              style={{ fontSize: 11, padding: "4px 12px", borderRadius: 20, border: "none", background: "var(--color-brand-red)", color: "#ffffff", cursor: uploadState === "loading" ? "not-allowed" : "pointer", fontFamily: "inherit", fontWeight: 500 }}
            >
              {uploadState === "loading" ? "Uploading…" : "Upload"}
            </button>
            {showUploadPicker && (
              <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.1)", zIndex: 50, minWidth: 200, overflow: "hidden" }}>
                <button onClick={() => pickUploadMode("analyze")} style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, background: "transparent", border: "none", borderBottom: "0.5px solid var(--color-border-tertiary)", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-primary)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>Analyze for updates</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Claude suggests tracker changes</div>
                </button>
                <button onClick={() => pickUploadMode("reference")} style={{ width: "100%", textAlign: "left", padding: "10px 14px", fontSize: 13, background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", color: "var(--color-text-primary)" }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ fontWeight: 500, marginBottom: 2 }}>Save as reference</div>
                  <div style={{ fontSize: 11, color: "var(--color-text-secondary)" }}>Add to References tab</div>
                </button>
              </div>
            )}
          </div>
        </div>
        {uploadError && (
          <div style={{ fontSize: 12, color: "#A32D2D", marginTop: 4 }}>Error: {uploadError}</div>
        )}
        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>AERO + IQ Series · All sources integrated through Mar 25</p>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: "1.25rem" }}>
        <div onClick={() => { setActiveTab("overview"); setActivePillar(null); setStatusFilter(null); }} style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Overall progress</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{pct}%</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>{doneTasks} of {totalTasks} tasks complete</div>
        </div>
        <div onClick={() => goToFilter(["In Progress"])} style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>In progress</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{inProgress}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>active tasks</div>
        </div>
        <div onClick={() => goToFilter(["At Risk", "Blocked"])} style={{ background: priorityCount > 0 ? "#FAEEDA" : "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", border: priorityCount > 0 ? "0.5px solid #FAC775" : "none", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Priority</div>
          <div style={{ fontSize: 24, fontWeight: 500, color: priorityCount > 0 ? "#854F0B" : "var(--color-text-primary)" }}>{priorityCount}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>need attention</div>
        </div>
        <div onClick={() => { setActiveTab("actions"); setActivePillar(null); setStatusFilter(null); }} style={{ background: "var(--color-background-secondary)", borderRadius: 10, padding: "12px 14px", cursor: "pointer" }} onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")} onMouseLeave={e => (e.currentTarget.style.opacity = "1")}>
          <div style={{ fontSize: 11, color: "var(--color-text-secondary)", marginBottom: 4 }}>Open actions</div>
          <div style={{ fontSize: 24, fontWeight: 500 }}>{actions.length}</div>
          <div style={{ fontSize: 11, color: "var(--color-text-tertiary)", marginTop: 2 }}>action items</div>
        </div>
      </div>

      {/* Flag banner — dynamic */}
      {hasFlagged && (
        <div style={{ background: "#FCEBEB", border: "0.5px solid #F09595", borderRadius: 10, padding: "10px 16px", marginBottom: "0.75rem", fontSize: 13, color: "#A32D2D" }}>
          <div style={{ fontWeight: 500, marginBottom: 6 }}>Flag:</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {flaggedTasks.map(t => (
              <div key={`task-${t.id}`} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, background: STATUS[t.status].bg, color: STATUS[t.status].text, padding: "1px 7px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" }}>{t.status}</span>
                <span style={{ fontSize: 11, opacity: 0.7, whiteSpace: "nowrap" }}>{t.pillarLabel}</span>
                <span>{t.task}</span>
              </div>
            ))}
            {flaggedActions.map(a => (
              <div key={`action-${a.id}`} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, background: STATUS[a.status].bg, color: STATUS[a.status].text, padding: "1px 7px", borderRadius: 20, fontWeight: 500, whiteSpace: "nowrap" }}>{a.status}</span>
                <span style={{ fontSize: 11, opacity: 0.7, whiteSpace: "nowrap" }}>Action</span>
                <span>{a.task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended check-ins */}
      <div style={{ background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "var(--color-brand-navy)", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.07em", fontFamily: "var(--font-heading)" }}>Recommended check-ins</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {[
            { who: "Anudit",       note: "Confirm internal tech roadmap was sent to Rod (Tony asked Mar 24, roundtable managers only)", due: "Today" },
            { who: "Rod",          note: "Confirm narrative pre-read received + Thursday session is set to lock direction",              due: "Today" },
            { who: "Kevin / ExCo", note: "Schedule deeper AERO agent session — Nick + Chelsea to be included",                         due: "This week" },
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
        {["overview", "actions", "narrative", "references"].map((t) => (
          <button key={t} onClick={() => { setActiveTab(t); setActivePillar(null); setStatusFilter(null); setShowUploadPicker(false); }}
            style={{ fontSize: 12, fontWeight: activeTab === t ? 600 : 400, padding: "8px 14px", background: "transparent", border: "none", borderBottom: activeTab === t ? "2px solid var(--color-brand-red)" : "2px solid transparent", cursor: "pointer", color: activeTab === t ? "var(--color-brand-navy)" : "var(--color-text-secondary)", marginBottom: -1, textTransform: "capitalize", fontFamily: "var(--font-heading)" }}>
            {t === "actions" ? `open actions (${actions.length})` : t === "references" && references.length > 0 ? `references (${references.length})` : t}
          </button>
        ))}
      </div>

      {/* FILTERED TASK VIEW */}
      {activeTab === "overview" && !activePillar && statusFilter && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => setStatusFilter(null)} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>← all workstreams</button>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>·</span>
            <div style={{ display: "flex", gap: 6 }}>{statusFilter.map(s => <Dot key={s} s={s} />)}</div>
            <span style={{ fontSize: 12, color: "var(--color-text-tertiary)" }}>{filteredTasks.length} task{filteredTasks.length !== 1 ? "s" : ""}</span>
          </div>
          {filteredTasks.length === 0 ? (
            <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No tasks match this filter.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredTasks.map(t => {
                const sc = STATUS[t.status] ?? STATUS["Not Started"];
                const isOpen = expandedTask === t.id;
                return (
                  <div key={t.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderLeft: `3px solid ${t.pillarColor}`, borderRadius: "0 10px 10px 0", overflow: "hidden" }}>
                    <div onClick={() => setExpandedTask(isOpen ? null : t.id)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: 13 }}>{t.task}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)", padding: "2px 8px", borderRadius: 20 }}>{t.pillarLabel}</span>
                      <Dot s={t.status} />
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{t.due}</span>
                      <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                    {isOpen && (
                      <div style={{ padding: "0 16px 14px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                        <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Status: <StatusSelect value={t.status} onChange={v => updateTask(t.pillarId, t.id, { status: v })} /></div>
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Owner:{" "}
                            {editingField?.type === "task" && editingField.id === t.id && editingField.field === "owner"
                              ? <InlineEdit value={t.owner} onCommit={v => { updateTask(t.pillarId, t.id, { owner: v }); setEditingField(null); }} />
                              : <strong style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }} onClick={e => { e.stopPropagation(); setEditingField({ type: "task", id: t.id, pillarId: t.pillarId, field: "owner" }); }}>{t.owner}</strong>}
                          </div>
                          <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Due:{" "}
                            {editingField?.type === "task" && editingField.id === t.id && editingField.field === "due"
                              ? <InlineEdit value={t.due} onCommit={v => { updateTask(t.pillarId, t.id, { due: v }); setEditingField(null); }} />
                              : <strong style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }} onClick={e => { e.stopPropagation(); setEditingField({ type: "task", id: t.id, pillarId: t.pillarId, field: "due" }); }}>{t.due}</strong>}
                          </div>
                        </div>
                        <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "8px 0 0", lineHeight: 1.6 }}>{t.notes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* OVERVIEW — pillar list */}
      {activeTab === "overview" && !activePillar && !statusFilter && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 4px" }}>Select a workstream to drill into its tasks.</p>
          {pillars.map((p) => {
            const done = p.tasks.filter(t => t.status === "Complete").length;
            const risk = p.tasks.filter(t => t.status === "At Risk" || t.status === "Blocked").length;
            const pctP = Math.round((done / p.tasks.length) * 100);
            return (
              <div key={p.id} onClick={() => setActivePillar(p.id)} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderLeft: `3px solid ${p.color}`, borderRadius: "0 10px 10px 0", padding: "14px 18px", cursor: "pointer", transition: "background 0.1s" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")} onMouseLeave={e => (e.currentTarget.style.background = "var(--color-background-primary)")}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 600, fontFamily: "var(--font-heading)", color: "var(--color-brand-navy)" }}>{p.label}</span>
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
            <h2 style={{ fontSize: 17, fontWeight: 600, margin: 0, fontFamily: "var(--font-heading)", color: "var(--color-brand-navy)" }}>{pillar.label}</h2>
            <Dot s={pillar.status} />
          </div>
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 1.25rem" }}>{pillar.description} · Owner: {pillar.owner}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pillar.tasks.map((t) => {
              const isOpen = expandedTask === t.id;
              const sc = STATUS[t.status] ?? STATUS["Not Started"];
              return (
                <div key={t.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
                  <div onClick={() => setExpandedTask(isOpen ? null : t.id)} style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }} onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: sc.dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 400 }}>{t.task}</span>
                    <Dot s={t.status} />
                    <span style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>{t.due}</span>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 16px 14px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                      <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Status: <StatusSelect value={t.status} onChange={v => updateTask(pillar.id, t.id, { status: v })} /></div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Owner:{" "}
                          {editingField?.type === "task" && editingField.id === t.id && editingField.field === "owner"
                            ? <InlineEdit value={t.owner} onCommit={v => { updateTask(pillar.id, t.id, { owner: v }); setEditingField(null); }} />
                            : <strong style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }} onClick={e => { e.stopPropagation(); setEditingField({ type: "task", id: t.id, pillarId: pillar.id, field: "owner" }); }}>{t.owner}</strong>}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>Due:{" "}
                          {editingField?.type === "task" && editingField.id === t.id && editingField.field === "due"
                            ? <InlineEdit value={t.due} onCommit={v => { updateTask(pillar.id, t.id, { due: v }); setEditingField(null); }} />
                            : <strong style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }} onClick={e => { e.stopPropagation(); setEditingField({ type: "task", id: t.id, pillarId: pillar.id, field: "due" }); }}>{t.due}</strong>}
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
          <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>Items that need someone to move on them now. Click owner, due date, or status to edit.</p>
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
                      <StatusSelect value={a.status} onChange={v => updateAction(a.id, { status: v })} />
                      <span style={{ fontSize: 12, color: "var(--color-text-secondary)", whiteSpace: "nowrap" }}>Owner:{" "}
                        {editingField?.type === "action" && editingField.id === a.id && editingField.field === "owner"
                          ? <InlineEdit value={a.owner} onCommit={v => { updateAction(a.id, { owner: v }); setEditingField(null); }} />
                          : <strong style={{ fontWeight: 500, color: "var(--color-text-primary)", cursor: "text" }} onClick={() => setEditingField({ type: "action", id: a.id, field: "owner" })}>{a.owner}</strong>}
                      </span>
                      <span style={{ fontSize: 12, color: isUrgent ? "#854F0B" : "var(--color-text-secondary)", whiteSpace: "nowrap" }}>
                        {editingField?.type === "action" && editingField.id === a.id && editingField.field === "due"
                          ? <InlineEdit value={a.due} onCommit={v => { updateAction(a.id, { due: v }); setEditingField(null); }} />
                          : <strong style={{ fontWeight: isUrgent ? 500 : 400, color: isUrgent ? "#854F0B" : "var(--color-text-secondary)", background: isUrgent ? "#FAEEDA" : "transparent", padding: isUrgent ? "2px 8px" : "0", borderRadius: isUrgent ? 20 : 0, cursor: "text", display: "inline-block" }} onClick={() => setEditingField({ type: "action", id: a.id, field: "due" })}>{a.due}</strong>}
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
            { label: "What AERO is",           content: "AERO is NOT a standalone product. It is the horizontal intelligence layer that powers and augments every pillar of IQ Series. IQ Series = what we deliver. AERO = how it's supercharged." },
            { label: "Two workstreams",         content: "(1) Corporate Sales Narrative — leads with 3 core client problems (contextual targeting, brand suitability, ROI) in plain layman's terms, then IQ Series as the 10yr foundation, then AERO as the agentic layer. (2) AERO Marketing Campaign Strategy — external-facing campaign for website, PR, advertising." },
            { label: "Campaign positioning",    content: "Dual-axis anchor: AERO unlocks Suitability + ROI for YouTube and Walled Gardens. Under Suitability: contextual intel, AI slop/content quality, trend detection, brand safety. Under ROI: guaranteed outcomes, cross-platform efficiency, data-driven decisioning, margin + waste reduction." },
            { label: "3 campaign angles (Thu)", content: "'The Unfair Advantage' — AERO as the unfair advantage inside walled gardens. 'Suitability Meets Performance' — first solution to deliver both, counter-positions vs. single-axis competitors. 'Compounding Intelligence' — every dollar through AERO makes the next smarter, appeals to sophisticated buyers + CFOs." },
            { label: "Data moat language",      content: "No longer cite '$4 billion' specifically. All references now use 'billions of dollars of historical campaign performance data.'" },
            { label: "IQ Series structure",     content: "4 pillars: Creative (Generate, Evaluate, Align, Iterate, Measure) · ViewIQ (Classify, Forecast, Target, Enforce, Inspect) · ActivateIQ (Deploy, Validate, Bid, Allocate, Control) · Reporting (Unify, Monitor, Analyze, Model, Learn)" },
            { label: "Key stats",               content: "Avg ROAS 5.96 · 82% outperformance vs native YouTube · 90% reduction in planning cycles · 30+ markets · 600+ employees · YTMP + YTAP accredited · Comscore exclusive partner" },
            { label: "GTM Hub",                 content: "demo.channelfactory.com/gtm — CF email login required, desktop only. All AERO assets, decks, demo videos, case studies housed here." },
          ].map((n) => (
            <div key={n.label} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, padding: "12px 16px", display: "flex", gap: 16, flexWrap: "wrap" }}>
              <div style={{ fontSize: 12, fontWeight: 500, minWidth: 160, flexShrink: 0, color: "var(--color-text-secondary)" }}>{n.label}</div>
              <div style={{ fontSize: 13, flex: 1, lineHeight: 1.6 }}>{n.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* REFERENCES */}
      {activeTab === "references" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {references.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-secondary)" }}>
              <div style={{ fontSize: 13, marginBottom: 8 }}>No reference documents yet.</div>
              <div style={{ fontSize: 12 }}>Click <strong>Upload → Save as reference</strong> to add core material here.</div>
            </div>
          ) : (
            references.map(r => (
              <div key={r.id} style={{ background: "var(--color-background-primary)", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, overflow: "hidden" }}>
                <div onClick={() => setExpandedRef(expandedRef === r.id ? null : r.id)}
                  style={{ padding: "12px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--color-background-secondary)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{r.name}</div>
                    {r.summary && <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{r.summary}</div>}
                  </div>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", whiteSpace: "nowrap" }}>{r.uploadedAt}</span>
                  <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{expandedRef === r.id ? "▲" : "▼"}</span>
                </div>
                {expandedRef === r.id && (
                  <div style={{ padding: "0 16px 16px", borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                    <pre style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: "12px 0 0", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{r.content}</pre>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* AI Suggestions review panel */}
      {suggestions && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)", zIndex: 100, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setSuggestions(null)}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 1000, background: "var(--color-background-primary)", borderRadius: "14px 14px 0 0", padding: "20px 24px 32px", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 -4px 24px rgba(0,0,0,0.12)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>AI Suggestions</div>
                <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: 0 }}>{suggestions.summary}</p>
              </div>
              <button onClick={() => setSuggestions(null)} style={{ fontSize: 20, lineHeight: 1, background: "none", border: "none", cursor: "pointer", color: "var(--color-text-tertiary)", padding: 4 }}>×</button>
            </div>
            {suggestions.suggestions.length === 0 ? (
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)" }}>No tracker updates found in this document.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {suggestions.suggestions.map((s, i) => {
                  const isOn = accepted.has(i);
                  return (
                    <div key={i} onClick={() => setAccepted(prev => { const next = new Set(prev); isOn ? next.delete(i) : next.add(i); return next; })}
                      style={{ display: "flex", alignItems: "flex-start", gap: 12, background: isOn ? "#E1F5EE" : "var(--color-background-secondary)", border: `0.5px solid ${isOn ? "#1D9E75" : "var(--color-border-tertiary)"}`, borderRadius: 10, padding: "10px 14px", cursor: "pointer" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, flexShrink: 0, marginTop: 2, border: `1.5px solid ${isOn ? "#1D9E75" : "var(--color-border-secondary)"}`, background: isOn ? "#1D9E75" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        {isOn && <span style={{ color: "#fff", fontSize: 10, lineHeight: 1 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 2 }}>{suggestionLabel(s)}</div>
                        <div style={{ fontSize: 12, color: "var(--color-text-secondary)" }}>{s.reason}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setAccepted(new Set(suggestions.suggestions.map((_, i) => i)))} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", fontFamily: "inherit" }}>Select all</button>
              <button onClick={() => setSuggestions(null)} style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: "0.5px solid var(--color-border-secondary)", background: "var(--color-background-secondary)", cursor: "pointer", fontFamily: "inherit" }}>Dismiss</button>
              <button onClick={applyAccepted} disabled={accepted.size === 0}
                style={{ fontSize: 12, padding: "6px 14px", borderRadius: 20, border: "none", background: accepted.size > 0 ? "#0F6E56" : "var(--color-border-secondary)", color: accepted.size > 0 ? "#fff" : "var(--color-text-tertiary)", cursor: accepted.size > 0 ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                Apply{accepted.size > 0 ? ` (${accepted.size})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
