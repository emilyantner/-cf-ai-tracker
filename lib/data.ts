// ─── DATA FILE ──────────────────────────────────────────────────────────────
// Edit this file to update the dashboard. No code changes needed elsewhere.
// ────────────────────────────────────────────────────────────────────────────

export type StatusKey =
  | "Complete"
  | "On Track"
  | "In Progress"
  | "At Risk"
  | "Blocked"
  | "Not Started";

export interface Task {
  id: number;
  task: string;
  status: StatusKey;
  owner: string;
  due: string;
  notes: string;
}

export interface Pillar {
  id: string;
  label: string;
  color: string;
  lightBg: string;
  description: string;
  status: StatusKey;
  owner: string;
  dueDate: string;
  tasks: Task[];
}

export interface Action {
  id: number;
  owner: string;
  due: string;
  product: "AERO" | "IQ Series" | "Both";
  task: string;
  status: StatusKey;
}

export const PILLARS: Pillar[] = [
  {
    id: "narrative",
    label: "GTM Narrative",
    color: "#534AB7",
    lightBg: "#EEEDFE",
    description: "Corporate sales narrative + AERO campaign strategy",
    status: "In Progress",
    owner: "Rod Paolucci",
    dueDate: "Mar 26 session",
    tasks: [
      { id: 1, task: "Corporate Sales Narrative revised + pre-read sent to Tony", status: "In Progress", owner: "Rod Paolucci", due: "Mar 26", notes: "All Tony feedback addressed. Leads with 3 core problems (contextual targeting, brand suitability, ROI) in layman's terms. IQ Series = 10yr foundation. AERO = agentic layer powering it. Tony review session tomorrow." },
      { id: 2, task: "AERO Marketing Campaign Strategy doc delivered", status: "In Progress", owner: "Rod Paolucci", due: "Mar 26", notes: "Dual-axis positioning: AERO unlocks Suitability + ROI. 3 campaign angles for Thu: 'The Unfair Advantage', 'Suitability Meets Performance', 'Compounding Intelligence'. $4B figure removed — now 'billions of dollars of media data'." },
      { id: 3, task: "Tony sign-off on narrative direction — lock it", status: "Not Started", owner: "Tony Chen / Rod", due: "Mar 26", notes: "Thursday session is the decision point. Once approved, direction is locked for execution. Emily to ensure it is treated as final." },
      { id: 4, task: "GTM narrative distributed to full company", status: "Not Started", owner: "Rod / Su", due: "End of Q1", notes: "Full company needs to be in sync by end of Q1 so hard push starts April. Rod + Su managing GTM-tech connectivity." },
      { id: 5, task: "IQ Series vs AERO distinction clarified in video", status: "Not Started", owner: "Rod Paolucci", due: "End of March", notes: "Key message: AERO is the intelligence layer that powers IQ Series — not a replacement. Tony flagged video is still unclear on this." },
    ],
  },
  {
    id: "product",
    label: "Product & Tech",
    color: "#0F6E56",
    lightBg: "#E1F5EE",
    description: "AERO agents, IQ Series pillars, infrastructure",
    status: "In Progress",
    owner: "Anudit Vikram",
    dueDate: "Ongoing",
    tasks: [
      { id: 6,  task: "3 AERO agents demoed at ExCo: Brand Profile, RFP Response, Pricing", status: "Complete", owner: "Anudit / Naga / Praveen", due: "Mar 23", notes: "Built by 2 engineers in 3 weeks. All independently deployable to agencies. Kevin + ExCo reaction very positive." },
      { id: 7,  task: "Suitability extended to CTV via IRIS.TV / Viant", status: "In Progress", owner: "Anudit / Sanjaya", due: "Mid-April", notes: "First cut complete, testing + validating. Once done, YouTube suitability extends into CTV. Next: NEXD exploration." },
      { id: 8,  task: "Reporting agent deployable to any customer (post-GAP pilot)", status: "Complete", owner: "Ryan Bowermaster", due: "Complete", notes: "Rolling out customer by customer. Creative intelligence + Impact Score being added in 2 weeks." },
      { id: 9,  task: "Reddit suitability delivered — first open internet test", status: "Complete", owner: "Anudit team", due: "Complete", notes: "Subreddit-level suitability (text + video) complete. Meta suitability next — pending legal sign-off from Meta." },
      { id: 10, task: "Meta product UI — pending Meta legal approval", status: "At Risk", owner: "Anudit Vikram", due: "Pending Meta", notes: "APIs received. Code ready to spin up. Waiting on Meta lawyers to sign off on proposed approach. No timeline yet." },
      { id: 11, task: "Infrastructure upgrades: vector DB, graph DB, orchestration + auth layer", status: "In Progress", owner: "Anudit / Praveen", due: "TBD", notes: "Current batch-mode systems too slow for agentic AI. Dedicated session with Tony + David to walk through investment ask." },
      { id: 12, task: "IQ Series Products & Components doc → Confluence + Jira", status: "In Progress", owner: "Anudit Vikram", due: "1st week of April", notes: "Doc exists. Being translated into Confluence + Jira so all pillar work is trackable. Shuba pulling weekly updates via Robo AI query." },
      { id: 13, task: "Weekly release cadence established (Silicon Valley-style ops)", status: "In Progress", owner: "Venu / Sanjaya / Ken", due: "Mid-Q2", notes: "Venu = weekly AERO releases. Sanjaya = weekly MiHub. Ken = weekly Data Lake. Business update cadence still being finalised." },
      { id: 14, task: "Anudit pitch: IQ Series + AERO overview for agency/brand", status: "Not Started", owner: "Anudit Vikram", due: "~Mar 25", notes: "Not yet started as of Mar 18. External version being built in parallel with Rod." },
    ],
  },
  {
    id: "gtm",
    label: "Sales & GTM",
    color: "#185FA5",
    lightBg: "#E6F1FB",
    description: "Sales enablement, launch readiness, seller alignment",
    status: "At Risk",
    owner: "Rod Paolucci / Tony Chen",
    dueDate: "End of Q1",
    tasks: [
      { id: 15, task: "Confirm AERO launch date in market", status: "At Risk", owner: "Tony Chen", due: "ASAP", notes: "CRITICAL — still unresolved Mar 25. Sellers have no tangible talking point without a firm date + live demo. Rod flagged risk of strong pushback." },
      { id: 16, task: "Live demo ready for sellers", status: "Not Started", owner: "TBD", due: "TBD", notes: "Must feel concrete. Without live demo + compelling visuals, AERO risks being too abstract for sales conversations." },
      { id: 17, task: "Sales enablement materials complete", status: "In Progress", owner: "Rod Paolucci", due: "End of March", notes: "GTM deck + collaterals in progress. ExCo session Mar 23. Feature videos + sizzle video both in flight." },
      { id: 18, task: "Sizzle video — end-to-end agentic process", status: "At Risk", owner: "Rod Paolucci", due: "End of March", notes: "First version received Mar 16 — needs more iteration before prime time. Rod confident on timing." },
      { id: 19, task: "Feature-focused marketing videos (4 pillars)", status: "In Progress", owner: "Rod Paolucci", due: "End of March", notes: "In development for Curate, Activate, Report, Creative pillars. Speed reduction still needed." },
      { id: 20, task: "AI-generated GTM deck (dynamic, interactive, multilingual)", status: "In Progress", owner: "Rod Paolucci", due: "End of March", notes: "English + French live. Not yet mobile optimised. Latest demo not yet incorporated. Circulating well with Marcy/Horizon, Patrick, Kelsey, Rob Blake." },
      { id: 21, task: "GTM hub live and accessible to all sellers", status: "Complete", owner: "Rod Paolucci", due: "Complete", notes: "Live at demo.channelfactory.com/gtm. CF email login required, desktop only." },
      { id: 22, task: "GTM training on 2 live agents: Reporting + Brand Suitability", status: "Not Started", owner: "Anudit / Tony", due: "TBD", notes: "Tony direction Mar 25: GTM team needs to be trained on the 2 currently customer-facing agents." },
    ],
  },
  {
    id: "competitive",
    label: "Competitive Intel",
    color: "#854F0B",
    lightBg: "#FAEEDA",
    description: "Differentiation, positioning, market research",
    status: "In Progress",
    owner: "Rod / Anudit / Mike Gray",
    dueDate: "This week",
    tasks: [
      { id: 23, task: "Competitive AI positioning landscape doc shared at ExCo", status: "Complete", owner: "Rod Paolucci", due: "Mar 24", notes: "6 competitors covered: Zefr, DV, Pixability, Sightly, MiQ, Zeta. CF white space: AI trained on real campaign outcomes, not just content signals." },
      { id: 24, task: "Define AERO tip-of-the-spear vs. competitors", status: "In Progress", owner: "Tony / Rod / Anudit / Venu", due: "This week", notes: "Tony direction: own the data moat lane — nobody else talking about it. 'Billions of dollars of campaign performance data' is the anchor. Consider 'digital workers' as alternate framing to 'agents'." },
      { id: 25, task: "Rod: competitor press release + positioning deep dive", status: "In Progress", owner: "Rod Paolucci", due: "This week", notes: "Tony asked: go beyond websites, document how competitors are framing AI in PR + market positioning. Feeds Thursday working session." },
      { id: 26, task: "Anudit + Venu: identify what CF does that competitors don't", status: "Not Started", owner: "Anudit / Venu", due: "This week", notes: "Review competitor websites (Zefr, Pixability, DV, MiQ, Zeta). Flag what CF is doing that is distinctively unique or not talked about by others." },
      { id: 27, task: "Mike Gray comprehensive competitive AI analysis", status: "At Risk", owner: "Mike Gray / Tony", due: "ASAP", notes: "Tony asked for this weeks ago. Flagged follow-up needed at ExCo Mar 23. Still outstanding." },
    ],
  },
  {
    id: "org",
    label: "Org & Investment",
    color: "#444441",
    lightBg: "#F1EFE8",
    description: "Team structure, AI investment ask, hiring",
    status: "In Progress",
    owner: "David Hompe / Anudit Vikram",
    dueDate: "TBD",
    tasks: [
      { id: 28, task: "Enterprise AI team restructure presented at ExCo", status: "Complete", owner: "Anudit / David", due: "Mar 23", notes: "Operational AI (Meagan's team) moves under David. AI engineering stays under Anudit with dotted line to David. Testers + scalers embedded in business units to solve adoption gap." },
      { id: 29, task: "Dedicated AI investment + roadmap session: Tony, David, Anudit, Eren", status: "In Progress", owner: "Emily Antner", due: "This week", notes: "Scheduled by Emily. Investment ask is incremental to 2026 operating plan. Tony: try to offset all of it through reduced planned hires elsewhere." },
      { id: 30, task: "Deeper AERO agent session for ExCo — Nick + Chelsea to attend", status: "Not Started", owner: "Emily Antner", due: "This week", notes: "Kevin requested at ExCo Mar 23. Needs to be scheduled. Emily to check in on this." },
      { id: 31, task: "AWS cost reduction + 3P expense audit", status: "Not Started", owner: "Anudit / Eren", due: "TBD", notes: "Tony direction Mar 25: find savings to redirect to higher-priority AI work." },
      { id: 32, task: "Finalise budget for new AI hires (shift from other tech budgets)", status: "Not Started", owner: "Tony / Eren", due: "TBD", notes: "Eren to run the numbers. Tony wants to know how much room is left in budget." },
      { id: 33, task: "Product positioning + training + adoption process", status: "In Progress", owner: "Anudit / Dave", due: "TBD", notes: "Biggest internal problem: good tech getting built but not adopted. Testers + scalers being embedded in business units to solve this." },
    ],
  },
];

export const ACTIONS: Action[] = [
  { id: 1,  owner: "Tony Chen",         due: "ASAP",         product: "AERO",     status: "Blocked",     task: "Confirm AERO launch date in market" },
  { id: 2,  owner: "Tony Chen / Rod",   due: "Mar 26",       product: "AERO",     status: "In Progress", task: "Lock narrative direction at Thursday session — treat as final" },
  { id: 3,  owner: "Emily Antner",      due: "Today",        product: "Both",     status: "At Risk",     task: "Follow up on deeper AERO agent session — schedule for this week (Nick + Chelsea)" },
  { id: 4,  owner: "Rod Paolucci",      due: "End of March", product: "AERO",     status: "In Progress", task: "Incorporate latest demo into GTM deck" },
  { id: 5,  owner: "Rod Paolucci",      due: "End of March", product: "AERO",     status: "In Progress", task: "Clarify IQ Series vs AERO distinction in video" },
  { id: 6,  owner: "Anudit / Venu",     due: "This week",    product: "AERO",     status: "Not Started", task: "Review competitor websites — identify what CF does that others don't" },
  { id: 7,  owner: "Mike Gray / Tony",  due: "ASAP",         product: "AERO",     status: "At Risk",     task: "Follow up on Mike Gray comprehensive competitive AI analysis" },
  { id: 8,  owner: "Rod / Anudit",      due: "This week",    product: "AERO",     status: "Not Started", task: "Identify mockups for externally deployable agents (Brand Profile, List Building, Reporting)" },
  { id: 9,  owner: "Anudit Vikram",     due: "~Mar 25",      product: "AERO",     status: "Not Started", task: "Complete Anudit pitch: IQ Series + AERO overview for agency/brand" },
  { id: 10, owner: "David / Anudit",    due: "This week",    product: "Both",     status: "Not Started", task: "Brief Rod fully on Impact Score — major marketing opportunity" },
];
