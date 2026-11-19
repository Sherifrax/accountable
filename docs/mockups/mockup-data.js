// Shared sample data and helpers for the three mockups.
// "Today" is fixed at Nov 19, 2026 so the screenshots stay the same.
window.MOCK = (() => {
  const stages = [
    { key: "new", name: "New", prob: 10, color: "var(--stage-new)", ink: "var(--cerulean-ink)" },
    { key: "qualified", name: "Qualified", prob: 25, color: "var(--stage-qualified)", ink: "var(--marigold-ink)" },
    { key: "proposal", name: "Proposal", prob: 50, color: "var(--stage-proposal)", ink: "var(--coral-ink)" },
    { key: "negotiation", name: "Negotiation", prob: 75, color: "var(--stage-negotiation)", ink: "var(--stage-negotiation)" },
    { key: "won", name: "Won", prob: 100, color: "var(--stage-won)", ink: "var(--sea-green-ink)" },
    { key: "lost", name: "Lost", prob: 0, color: "var(--stage-lost)", ink: "var(--ink-muted)" },
  ];

  // Cards on the board. Won and Lost show their most recent few; counts and totals cover all.
  const deals = {
    new: [
      { name: "Clinic scheduling suite", org: "Mapleton Clinics", contact: "Omar Haddad", value: 42000, close: "Feb 26, 2027" },
      { name: "Fleet tracking pilot", org: "Ridgeline Freight", contact: "Dana Whitlock", value: 18000, close: "Jan 29, 2027" },
      { name: "Annual support plan", org: "Bluefin Marine Parts", contact: "Gus Lindqvist", value: 9800, close: "Jan 12, 2027" },
      { name: "Website refresh", org: "Fennel Street Bakery Co.", contact: "Priya Natarajan", value: 6500, close: "Dec 15, 2026" },
    ],
    qualified: [
      { name: "Warehouse sensors", org: "Harbor & Pine Logistics", contact: "Marta Kowalski", value: 27500, close: "Dec 18, 2026" },
      { name: "Guest Wi-Fi upgrade", org: "Copperleaf Hotels", contact: "Elena Brooks", value: 15200, close: "Nov 12, 2026", late: true },
      { name: "Data dashboard setup", org: "Lumen Analytics", contact: "Theo Mensah", value: 11000, close: "Jan 22, 2027" },
    ],
    proposal: [
      { name: "Site survey and quote", org: "Oakfield Builders", contact: "Ray Castellano", value: 33000, close: "Dec 4, 2026", dragging: true },
      { name: "POS rollout, 6 stores", org: "Saltmarsh Outfitters", contact: "Hana Sato", value: 24600, close: "Nov 13, 2026", late: true },
      { name: "Brand photography", org: "Tessellate Studio", contact: "Jules Moreau", value: 7400, close: "Dec 10, 2026" },
    ],
    negotiation: [
      { name: "District licence renewal", org: "Granite Peak Schools", contact: "Carol Pruitt", value: 58000, close: "Dec 1, 2026" },
      { name: "Broker portal", org: "Kestrel Insurance Brokers", contact: "Sam Adeyemi", value: 36500, close: "Nov 6, 2026", late: true },
    ],
    won: [
      { name: "Cold-chain monitoring", org: "Verdant Farms Supply", contact: "Lena Ortiz", value: 21000, close: "Nov 10, 2026" },
      { name: "Patient reminders", org: "Brightwater Dental", contact: "Nadia Petrov", value: 8900, close: "Nov 3, 2026" },
      { name: "Robot cell integration", org: "Calder Robotics", contact: "Iain Mercer", value: 46000, close: "Oct 21, 2026" },
      { name: "Front desk kiosks", org: "Copperleaf Hotels", contact: "Elena Brooks", value: 12400, close: "Oct 8, 2026" },
    ],
    lost: [
      { name: "Route planning tool", org: "Ridgeline Freight", contact: "Dana Whitlock", value: 14000, close: "Oct 30, 2026" },
      { name: "Loyalty app", org: "Fennel Street Bakery Co.", contact: "Priya Natarajan", value: 5200, close: "Sep 24, 2026" },
      { name: "Inventory audit", org: "Bluefin Marine Parts", contact: "Gus Lindqvist", value: 9000, close: "Sep 2, 2026" },
    ],
  };
  // Full column counts and totals (Won and Lost hold more deals than the cards shown).
  const columnTotals = {
    new: { count: 4, value: 76300 },
    qualified: { count: 3, value: 53700 },
    proposal: { count: 3, value: 65000 },
    negotiation: { count: 2, value: 94500 },
    won: { count: 18, value: 307400 },
    lost: { count: 9, value: 96700 },
  };
  stages.forEach(s => { columnTotals[s.key].expected = Math.round(columnTotals[s.key].value * s.prob / 100); });

  const months = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];
  const wonRevenue = [18400, 12000, 26500, 9800, 31200, 14600, 22000, 38400, 17900, 28300, 58400, 29900];
  const wonCount = [1, 1, 2, 1, 2, 1, 1, 2, 1, 2, 2, 2];
  const lostCount = [1, 0, 1, 1, 0, 1, 1, 0, 1, 2, 1, 0];

  const funnel = [
    { key: "new", value: 812000 },
    { key: "qualified", value: 618500 },
    { key: "proposal", value: 512300 },
    { key: "negotiation", value: 431700 },
    { key: "won", value: 307400 },
  ];

  const tiles = {
    openPipeline: { value: 289500, context: "12 open deals" },
    expected: { value: 124430, context: "43% of open pipeline" },
    wonThisMonth: { value: 29900, change: -49, context: "on last month" },
    winRate: { value: 67, context: "18 won, 9 lost in 12 months" },
  };

  const followUps = [
    { text: "Send revised quote", link: "POS rollout, 6 stores", date: "Nov 11, 2026", when: "8 days overdue", overdue: true },
    { text: "Call about licence terms", link: "Carol Pruitt", date: "Nov 14, 2026", when: "5 days overdue", overdue: true },
    { text: "Chase signed order form", link: "Broker portal", date: "Nov 17, 2026", when: "2 days overdue", overdue: true },
    { text: "Book site visit", link: "Ray Castellano", date: "Nov 19, 2026", when: "Today" },
    { text: "Share pilot pricing", link: "Fleet tracking pilot", date: "Nov 21, 2026", when: "in 2 days" },
    { text: "Check in after demo", link: "Theo Mensah", date: "Nov 24, 2026", when: "in 5 days" },
    { text: "Send renewal reminder", link: "Gus Lindqvist", date: "Nov 26, 2026", when: "in 7 days" },
  ];

  const activity = [
    { type: "stage", to: "negotiation", text: "Moved from Proposal to Negotiation", link: "District licence renewal", at: "Nov 19, 2026, 9:42 AM" },
    { type: "call", text: "Talked through rollout timing for the six stores", link: "Hana Sato", at: "Nov 18, 2026, 4:10 PM" },
    { type: "email", text: "Sent case study and pricing sheet", link: "Elena Brooks", at: "Nov 18, 2026, 11:25 AM" },
    { type: "note", text: "Wants a 3-year term with yearly billing", link: "Broker portal", at: "Nov 17, 2026, 3:05 PM" },
    { type: "stage", to: "qualified", text: "Moved from New to Qualified", link: "Data dashboard setup", at: "Nov 17, 2026, 10:00 AM" },
    { type: "call", text: "Intro call, 4 depots to start", link: "Dana Whitlock", at: "Nov 16, 2026, 2:30 PM" },
    { type: "email", text: "Sent the site survey checklist", link: "Ray Castellano", at: "Nov 13, 2026, 9:15 AM" },
    { type: "note", text: "Budget approved for the first quarter", link: "Omar Haddad", at: "Nov 12, 2026, 1:40 PM" },
    { type: "stage", to: "won", text: "Moved from Negotiation to Won", link: "Cold-chain monitoring", at: "Nov 10, 2026, 5:20 PM" },
    { type: "call", text: "Agreed the final price", link: "Lena Ortiz", at: "Nov 10, 2026, 11:00 AM" },
  ];

  const money = n => "$" + Math.round(n).toLocaleString("en-US");
  const short = n => n >= 1e6 ? "$" + (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M"
    : n >= 1e3 ? "$" + (n / 1e3).toFixed(n >= 1e5 ? 0 : 1).replace(/\.0$/, "") + "K" : money(n);
  const stage = key => stages.find(s => s.key === key);
  const initials = name => name.split(" ").map(p => p[0]).join("").slice(0, 2);
  const activityIcon = { stage: "arrow-right", call: "phone", email: "mail", note: "sticky-note" };

  // Smooth line through points (Catmull-Rom converted to cubic Bezier).
  const smooth = pts => pts.reduce((d, p, i, a) => {
    if (i === 0) return `M${p[0]},${p[1]}`;
    const p0 = a[i - 2] || a[i - 1], p1 = a[i - 1], p2 = p, p3 = a[i + 1] || p;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    return d + ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }, "");

  // Fills every <aside class="sidebar" data-active="..."> with the nav from spec 4.3.
  const renderSidebars = () => {
    const items = [["dashboard", "layout-dashboard", "Dashboard"], ["pipeline", "kanban", "Pipeline"],
      ["deals", "handshake", "Deals"], ["organizations", "building-2", "Organizations"], ["contacts", "users", "Contacts"]];
    document.querySelectorAll("aside.sidebar").forEach(el => {
      el.innerHTML = `<div class="wordmark">Accountable</div><div class="tagline">Sales, in order.</div>
        <nav class="nav">${items.map(([k, icon, label]) =>
          `<a class="${el.dataset.active === k ? "active" : ""}"><i data-lucide="${icon}"></i>${label}</a>`).join("")}</nav>`;
    });
  };

  return { renderSidebars, stages, deals, columnTotals, months, wonRevenue, wonCount, lostCount, funnel, tiles,
    followUps, activity, money, short, stage, initials, activityIcon, smooth };
})();
