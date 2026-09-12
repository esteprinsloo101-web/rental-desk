/* Rental Desk — static SA landlord case manager demo
   Botha Rentals · Bloemfontein · localStorage · ZAR
   NOT legal or financial advice · You Approve deposit release */

(function () {
  "use strict";

  const STORAGE_KEY = "rental-desk-v4";
  const PURPOSE_MODULE_PRESETS = {
  "rentals": {
    "units": true,
    "cases": true,
    "money": true,
    "tenants": true,
    "snags": true,
    "docs": true
      },
  "household": {
    "units": false,
    "cases": false,
    "money": true,
    "tenants": false,
    "snags": true,
    "docs": true
      },
  "farm": {
    "units": true,
    "cases": true,
    "money": true,
    "tenants": true,
    "snags": true,
    "docs": true
      },
  "trade": {
    "units": true,
    "cases": true,
    "money": true,
    "tenants": true,
    "snags": true,
    "docs": true
      },
  "stokvel": {
    "units": false,
    "cases": false,
    "money": true,
    "tenants": false,
    "snags": false,
    "docs": true
      },
  "flood": {
    "units": true,
    "cases": false,
    "money": false,
    "tenants": false,
    "snags": true,
    "docs": true
      },
  "decisions": {
    "units": true,
    "cases": true,
    "money": true,
    "tenants": true,
    "snags": false,
    "docs": true
      }
};

  const TZ = "Africa/Johannesburg";

  const PROCESS_TYPES = {
    rent_due: {
      label: "Rent due",
      icon: "R",
      defaultCadenceDays: 30,
      leadDays: 3,
      disclaimer: "NOT legal or financial advice. You chase / collect — app only guides. Does not move money.",
      steps: [
        { key: "review", title: "Review amount due", body: "Confirm rent, utilities and any arrears for this cycle.", checks: ["Amount / period confirmed"] },
        { key: "chase", title: "Send payment link / chase", body: "Open tenant payment / WhatsApp link. Escalate politely if overdue.", checks: ["Reminder / chase sent (by me)"] },
        { key: "confirm", title: "Confirm received", body: "Mark when rent lands in your account. Unlocks next cycle reminder.", checks: ["Rent received / logged"] },
      ],
    },
    inspection: {
      label: "Handover evidence",
      icon: "📷",
      defaultCadenceDays: 0,
      leadDays: 7,
      disclaimer: "Photo slots are ops evidence stubs — not a formal valuation or Tribunal filing. NOT legal advice.",
      steps: [
        { key: "prep", title: "Prep pack", body: "Confirm unit, tenant present, keys and prior inventory.", checks: ["Keys / access confirmed"] },
        { key: "photos", title: "Photo slots (evidence)", body: "Complete each room slot (demo: tap to mark). Same set every exit.", checks: ["Entrance / lounge", "Kitchen", "Bathroom", "Bedroom(s)", "Exterior / garage"] },
        { key: "notes", title: "Snag / wear notes", body: "Note damages / wear. Deductions need evidence on deposit release.", input: "note" },
        { key: "confirm", title: "Close walkthrough", body: "Handover evidence pack ready · unlocks snag chase and deposit close.", checks: ["Walkthrough complete", "Ready for snags / deposit loop"] },
      ],
    },
    snag_close: {
      label: "Snag close",
      icon: "🔧",
      defaultCadenceDays: 7,
      leadDays: 3,
      disclaimer: "Chase contractors yourself. Not a works contract. NOT legal advice.",
      steps: [
        { key: "review", title: "Review snag", body: "Confirm ticket, unit and days open." },
        { key: "chase", title: "Chase contractor", body: "Open plumber / handyman contact.", checks: ["Chase sent (by me)"] },
        { key: "confirm", title: "Close ticket", body: "Mark when work verified. Clears path to deposit release.", checks: ["Snag verified closed"] },
      ],
    },
    deposit_close: {
      label: "Deposit close",
      icon: "🔐",
      defaultCadenceDays: 0,
      leadDays: 14,
      disclaimer: "NOT legal or financial advice. Deductions need evidence. You Approve deductions AND deposit release — irreversible money steps in demo books. App does not move money or file at the Tribunal.",
      steps: [
        { key: "calc", title: "Review deposit calc", body: "Held amount vs proposed deductions with handover photo evidence." },
        { key: "approve", title: "Approve deductions", body: "Human Approve only. App blocks empty deduction ticks.", checks: ["I Approve deduction amounts (or zero)"] },
        { key: "release", title: "Approve deposit release", body: "Irreversible money step: Approve releasing / refunding the net deposit. App does not take or send payment.", checks: ["I Approve deposit release / refund (irreversible in demo books)"] },
        { key: "refund", title: "Refund / close", body: "Open bank note and pay refund yourself.", checks: ["Refund sent / case closed (by me)"] },
      ],
    },
    custom: {
      label: "Custom process",
      icon: "◎",
      defaultCadenceDays: 30,
      leadDays: 5,
      disclaimer: "Demo process — adapt to your portfolio. NOT legal or financial advice.",
      steps: [
        { key: "do", title: "Do the work", body: "Follow your own steps." },
        { key: "confirm", title: "Confirm done", body: "Mark complete.", checks: ["Work completed"] },
      ],
    },
  };

  const DEFAULT_MODULES = {
    units: true, cases: true, money: true, tenants: true, snags: true, docs: true,
  };

  function defaultPrefs() {
    return {
      quietStart: 21,
      quietEnd: 7,
      notificationsEnabled: true,
      lastNotified: {},
      installDismissed: false,
    };
  }

  function seed() {
    const today = startOfDay(new Date());
    return {
      modules: { ...DEFAULT_MODULES },
      profile: { onboarded: false, city: "", purpose: "", updatedAt: null },
      landlord: { name: "Botha Rentals", city: "Bloemfontein" },
      units: [
        { id: "u1", label: "Westdene Flat 3", property: "12 Grey St", beds: 2, rent: 6500, status: "occupied", tenantId: "t1" },
        { id: "u2", label: "Westdene Flat 7", property: "12 Grey St", beds: 1, rent: 4800, status: "occupied", tenantId: "t2" },
        { id: "u3", label: "Universitas Cottage", property: "8 Mimosa Ave", beds: 2, rent: 7200, status: "occupied", tenantId: "t3" },
        { id: "u4", label: "Fichardt Park Room", property: "22 Kolbe Rd", beds: 1, rent: 3500, status: "vacant", tenantId: null },
      ],
      tenants: [
        { id: "t1", name: "Naledi Molefe", unitId: "u1", leaseEnd: isoDate(addDays(today, 45)), phone: "082 300 1100", deposit: 6500 },
        { id: "t2", name: "Jaco van Wyk", unitId: "u2", leaseEnd: isoDate(addDays(today, 210)), phone: "083 200 4400", deposit: 4800 },
        { id: "t3", name: "Priya Naidoo", unitId: "u3", leaseEnd: isoDate(addDays(today, 18)), phone: "072 111 8899", deposit: 7200 },
      ],
      cases: [
        { id: "k1", type: "rent", title: "Rent Sep — Flat 3 Molefe", unitId: "u1", status: "open", amount: 6500, openedAt: isoDate(addDays(today, -2)) },
        { id: "k2", type: "exit", title: "Exit / handover — Naidoo Cottage", unitId: "u3", status: "open", amount: 7200, openedAt: isoDate(addDays(today, -5)) },
        { id: "k3", type: "snag", title: "Leaking basin — Flat 7", unitId: "u2", status: "open", amount: 0, openedAt: isoDate(addDays(today, -9)) },
        { id: "k4", type: "rent", title: "Rent Aug — Flat 7 van Wyk", unitId: "u2", status: "closed", amount: 4800, openedAt: isoDate(addDays(today, -35)) },
        { id: "k5", type: "deposit", title: "Deposit close — Naidoo", unitId: "u3", status: "open", amount: 7200, openedAt: isoDate(addDays(today, -1)) },
      ],
      snags: [
        { id: "sg1", title: "Leaking basin", unitId: "u2", daysOpen: 9, contractor: "Mokoena Plumbing", status: "open" },
        { id: "sg2", title: "Gate motor intermittent", unitId: "u3", daysOpen: 3, contractor: "GateFix BF", status: "open" },
        { id: "sg3", title: "Paint touch-up lounge", unitId: "u1", daysOpen: 20, contractor: "Self", status: "closed" },
      ],
      rentLedger: [
        { id: "r1", at: isoDate(addDays(today, -1)), label: "Flat 7 — Aug rent", amount: 4800, status: "paid" },
        { id: "r2", at: isoDate(today), label: "Flat 3 — Sep rent", amount: 6500, status: "due" },
        { id: "r3", at: isoDate(today), label: "Cottage — Sep rent", amount: 7200, status: "due" },
        { id: "r4", at: isoDate(addDays(today, -32)), label: "Flat 3 — Aug rent", amount: 6500, status: "paid" },
      ],
      docs: [
        { id: "d1", title: "Lease — Molefe Flat 3", category: "Lease", expiresAt: isoDate(addDays(today, 45)) },
        { id: "d2", title: "Lease — Naidoo Cottage", category: "Lease", expiresAt: isoDate(addDays(today, 18)) },
        { id: "d3", title: "Exit inspection pack — Naidoo", category: "Evidence", expiresAt: null },
        { id: "d4", title: "Deposit receipt — van Wyk", category: "Deposit", expiresAt: null },
      ],
      processes: seedProcesses(today),
      history: [],
      caseFilter: "all",
      prefs: defaultPrefs(),
      pipeline: { rentDone: false, handoverDone: false, snagsDone: false, depositDone: false },
    };
  }

  function seedProcesses(today) {
    return [
      {
        id: "pr-rent-t1", type: "rent_due", title: "Rent due — Flat 3 Molefe",
        nextDue: isoDate(addDays(today, -2)), cadenceDays: 30, leadDays: 3, module: "money",
        accountLinks: [
          { label: "WhatsApp tenant", url: "https://wa.me/27823001100" },
          { label: "FNB pay note", url: "https://www.fnb.co.za/" },
        ],
        meta: { caseId: "k1", tenantId: "t1", unitId: "u1", amount: 6500, ledgerId: "r2", loopKey: "rent-u1" },
      },
      {
        id: "pr-rent-t3", type: "rent_due", title: "Rent due — Cottage Naidoo",
        nextDue: isoDate(today), cadenceDays: 30, leadDays: 3, module: "money",
        accountLinks: [{ label: "WhatsApp tenant", url: "https://wa.me/27721118899" }],
        meta: { tenantId: "t3", unitId: "u3", amount: 7200, ledgerId: "r3", loopKey: "exit-u3" },
      },
      {
        id: "pr-insp", type: "inspection", title: "Exit handover — Naidoo Cottage",
        nextDue: isoDate(addDays(today, 2)), cadenceDays: 365, leadDays: 7, module: "cases",
        accountLinks: [{ label: "Unit map", url: "https://maps.google.com/?q=Universitas+Bloemfontein" }],
        meta: { caseId: "k2", unitId: "u3", tenantId: "t3", loopKey: "exit-u3" },
      },
      {
        id: "pr-snag", type: "snag_close", title: "Close snag — leaking basin Flat 7",
        nextDue: isoDate(addDays(today, -1)), cadenceDays: 7, leadDays: 3, module: "snags",
        accountLinks: [{ label: "WhatsApp plumber", url: "https://wa.me/27732001100" }],
        meta: { snagId: "sg1", caseId: "k3", unitId: "u2", loopKey: "snag-u2" },
      },
      {
        id: "pr-snag-u3", type: "snag_close", title: "Close snag — gate motor Cottage",
        nextDue: isoDate(addDays(today, 4)), cadenceDays: 7, leadDays: 3, module: "snags",
        accountLinks: [{ label: "WhatsApp GateFix", url: "https://wa.me/27820001100" }],
        meta: { snagId: "sg2", unitId: "u3", tenantId: "t3", loopKey: "exit-u3" },
      },
      {
        id: "pr-dep", type: "deposit_close", title: "Deposit close — Naidoo",
        nextDue: isoDate(addDays(today, 5)), cadenceDays: 365, leadDays: 14, module: "cases",
        accountLinks: [{ label: "Bank refund note", url: "https://www.standardbank.co.za/" }],
        meta: { caseId: "k5", tenantId: "t3", unitId: "u3", amount: 7200, loopKey: "exit-u3" },
      },
    ];
  }

  function uid(prefix) { return prefix + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
  function addDays(d, n) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
  function isoDate(d) {
    const x = new Date(d);
    return x.getFullYear() + "-" + String(x.getMonth()+1).padStart(2,"0") + "-" + String(x.getDate()).padStart(2,"0");
  }
  function parseISO(s) { const [y,m,d] = s.split("-").map(Number); return new Date(y, m-1, d); }
  function daysUntil(iso) { return Math.round((startOfDay(parseISO(iso)) - startOfDay(new Date())) / 86400000); }
  function fmtDate(iso) {
    try { return parseISO(iso).toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }
  function fmtMoney(n) { return "R" + Number(n).toLocaleString("en-ZA"); }
  function todayLabel() {
    return new Date().toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
  }
  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  }
  function unitLabel(id) { const u = state.units.find((x) => x.id === id); return u ? u.label : "—"; }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return seed();
      const data = JSON.parse(raw);
      data.modules = { ...DEFAULT_MODULES, ...(data.modules || {}) };
      if (!data.profile) data.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
      if (!Array.isArray(data.processes) || !data.processes.length) data.processes = seedProcesses(startOfDay(new Date()));
      if (!Array.isArray(data.history)) data.history = [];
      if (!data.caseFilter) data.caseFilter = "all";
      data.prefs = Object.assign(defaultPrefs(), data.prefs || {});
      if (!data.pipeline) data.pipeline = { rentDone: false, handoverDone: false, snagsDone: false, depositDone: false };
      return data;
    } catch { return seed(); }
  }
  function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  function getPrefs() {
    if (!state.prefs) state.prefs = defaultPrefs();
    return state.prefs;
  }

  let state = load();
  let currentView = "today";

  function processDue(p) { return daysUntil(p.nextDue); }
  function processInQueue(p) {
    if (p.paused) return false;
    if (p.module && state.modules[p.module] === false) return false;
    const lead = p.leadDays != null ? p.leadDays : (PROCESS_TYPES[p.type] || PROCESS_TYPES.custom).leadDays;
    return processDue(p) <= lead;
  }
  function buildQueue() {
    const items = [];
    (state.processes || []).filter(processInQueue).forEach((p) => {
      const due = processDue(p);
      const def = PROCESS_TYPES[p.type] || PROCESS_TYPES.custom;
      items.push({
        processId: p.id, module: p.module || "cases", title: p.title,
        meta: (def.label || p.type) + " · due " + fmtDate(p.nextDue) + (p.accountLinks && p.accountLinks.length ? " · link" : ""),
        severity: due < 0 ? "red" : due <= 2 ? "amber" : "green",
        due, icon: def.icon || "◎",
      });
    });
    items.sort((a,b) => a.due - b.due || a.title.localeCompare(b.title));
    return items;
  }
  function inQuietHours(date) {
    const prefs = getPrefs();
    const h = (date || new Date()).getHours();
    const start = Number(prefs.quietStart);
    const end = Number(prefs.quietEnd);
    if (Number.isNaN(start) || Number.isNaN(end)) return false;
    if (start === end) return false;
    if (start < end) return h >= start && h < end;
    return h >= start || h < end;
  }
  function nextOutsideQuiet(from) {
    const d = new Date(from || Date.now());
    let guard = 0;
    while (inQuietHours(d) && guard < 48) {
      d.setMinutes(0, 0, 0);
      d.setHours(d.getHours() + 1);
      guard++;
    }
    return d;
  }
  function notifPermission() {
    if (!("Notification" in window)) return "unsupported";
    return Notification.permission;
  }
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      toast("Notifications not supported here");
      return Promise.resolve("unsupported");
    }
    if (Notification.permission === "granted") return Promise.resolve("granted");
    if (Notification.permission === "denied") {
      toast("Notifications blocked — enable in browser settings if you want alerts");
      return Promise.resolve("denied");
    }
    return Notification.requestPermission()
      .then(function (p) {
        if (p === "granted") toast("Notifications on");
        else if (p === "denied") toast("Notifications denied — in-app reminders still work");
        else toast("Notifications not enabled");
        render();
        return p;
      })
      .catch(function () {
        toast("Could not request notifications");
        return "denied";
      });
  }
  function fireDueNotification(item) {
    const prefs = getPrefs();
    if (!prefs.notificationsEnabled) return;
    if (notifPermission() !== "granted") return;
    if (inQuietHours(new Date())) return;
    const key = item.processId || item.id;
    const today = isoDate(new Date());
    if (prefs.lastNotified[key] === today) return;
    try {
      const n = new Notification("Rental Desk · due", {
        body: item.title + (item.due < 0 ? " (overdue)" : item.due === 0 ? " (today)" : " · in " + item.due + "d"),
        tag: "rental-desk-" + key,
        icon: "icons/icon-192.png",
      });
      prefs.lastNotified[key] = today;
      save();
      n.onclick = function () {
        window.focus();
        if (item.processId) openProcessRunner(item.processId);
        n.close();
      };
    } catch (e) { /* graceful */ }
  }
  function checkDueNotifications() {
    const prefs = getPrefs();
    if (!prefs.notificationsEnabled) return;
    if (notifPermission() !== "granted") return;
    if (inQuietHours(new Date())) return;
    buildQueue()
      .filter(function (item) { return item.due <= 0; })
      .slice(0, 3)
      .forEach(fireDueNotification);
  }
  var reminderTimers = {};
  function clearReminderTimer(processId) {
    if (reminderTimers[processId]) {
      clearTimeout(reminderTimers[processId]);
      delete reminderTimers[processId];
    }
  }
  function scheduleReminderForProcess(proc) {
    if (!proc || !proc.nextDue) return;
    clearReminderTimer(proc.id);
    const prefs = getPrefs();
    if (!prefs.notificationsEnabled) return;
    if (notifPermission() !== "granted") return;
    const dueDay = startOfDay(parseISO(proc.nextDue));
    const lead = proc.leadDays != null ? proc.leadDays : (PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom).leadDays;
    let fireAt = addDays(dueDay, -Math.min(lead, 1));
    fireAt.setHours(8, 0, 0, 0);
    fireAt = nextOutsideQuiet(fireAt);
    const delay = fireAt.getTime() - Date.now();
    if (delay <= 0) {
      const soon = nextOutsideQuiet(new Date(Date.now() + 1500));
      const d2 = soon.getTime() - Date.now();
      if (d2 < 86400000) {
        reminderTimers[proc.id] = setTimeout(function () {
          fireDueNotification({ processId: proc.id, id: proc.id, title: proc.title, due: processDue(proc) });
        }, Math.max(500, d2));
      }
      return;
    }
    if (delay > 2147483647) return;
    reminderTimers[proc.id] = setTimeout(function () {
      fireDueNotification({ processId: proc.id, id: proc.id, title: proc.title, due: processDue(proc) });
    }, delay);
  }
  function rescheduleAllReminders() {
    (state.processes || []).forEach(scheduleReminderForProcess);
  }
  function buildReminders() {
    const q = buildQueue().slice(0, 8);
    const base = new Date();
    const quietNow = inQuietHours(base);
    return q.map(function (item, i) {
      let fire = new Date(base);
      fire.setMinutes(0, 0, 0);
      if (item.due <= 0) {
        fire = nextOutsideQuiet(new Date(base.getTime() + (quietNow ? 0 : 60 * 1000)));
      } else {
        fire = addDays(startOfDay(base), Math.max(0, item.due));
        fire.setHours(8 + (i % 3), i % 2 === 0 ? 0 : 30, 0, 0);
        fire = nextOutsideQuiet(fire);
      }
      const time = fire.toLocaleTimeString("en-ZA", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
      const day = fire.toLocaleDateString("en-ZA", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" });
      return {
        when: day + " · " + time,
        title: item.title,
        src: item.module + (quietNow && item.due <= 0 ? " · quiet hours" : ""),
        processId: item.processId,
        due: item.due,
        quietShifted: quietNow && item.due <= 0,
      };
    });
  }

  function syncPipelineFromState() {
    const hist = state.history || [];
    const cases = state.cases || [];
    const snags = state.snags || [];
    const rentDone = hist.some((h) => h.type === "rent_due") || cases.some((c) => c.type === "rent" && c.status === "closed");
    const handoverDone = hist.some((h) => h.type === "inspection") || cases.some((c) => c.type === "exit" && c.status === "closed");
    const snagsDone = hist.some((h) => h.type === "snag_close") || (snags.length > 0 && snags.every((s) => s.status === "closed"));
    const depositDone = hist.some((h) => h.type === "deposit_close") || cases.some((c) => c.type === "deposit" && c.status === "closed");
    const prev = state.pipeline || {};
    state.pipeline = {
      rentDone: !!(prev.rentDone || rentDone),
      handoverDone: !!(prev.handoverDone || handoverDone),
      snagsDone: !!(prev.snagsDone || snagsDone),
      depositDone: !!(prev.depositDone || depositDone),
    };
    return state.pipeline;
  }
  function loopStatus() { return syncPipelineFromState(); }
  function renderLoopTrack(el) {
    if (!el) return;
    const L = loopStatus();
    const steps = [
      { key: "rent", label: "Rent", done: L.rentDone, blocked: false, open: !L.rentDone },
      { key: "handover", label: "Handover", done: L.handoverDone, blocked: !L.rentDone && !L.handoverDone, open: L.rentDone && !L.handoverDone },
      { key: "snags", label: "Snags", done: L.snagsDone, blocked: !L.handoverDone && !L.snagsDone, open: L.handoverDone && !L.snagsDone },
      { key: "deposit", label: "Deposit", done: L.depositDone, blocked: !L.snagsDone && !L.depositDone, open: L.snagsDone && !L.depositDone },
    ];
    el.innerHTML = steps.map(function (s) {
      const cls = s.done ? "done" : s.blocked ? "blocked" : s.open ? "open" : "";
      const stateTxt = s.done ? "Done" : s.blocked ? "Gated" : "Next";
      return '<div class="loop-step ' + cls + '"><div class="ls-label">' + esc(s.label) + '</div><div class="ls-state">' + stateTxt + '</div></div>';
    }).join("");
  }

  function ensureFollowOnProcess(fromProc, nextType, title, overrides) {
    const loopKey = (fromProc.meta && fromProc.meta.loopKey) || (fromProc.meta && fromProc.meta.unitId) || fromProc.id;
    let existing = (state.processes || []).find((p) =>
      p.type === nextType && p.meta && (
        (p.meta.loopKey && p.meta.loopKey === loopKey) ||
        (fromProc.meta && fromProc.meta.unitId && p.meta.unitId === fromProc.meta.unitId) ||
        (fromProc.meta && fromProc.meta.caseId && p.meta.caseId === fromProc.meta.caseId)
      )
    );
    const today = isoDate(new Date());
    if (existing) {
      existing.nextDue = today;
      existing.paused = false;
      if (title) existing.title = title;
      Object.assign(existing.meta || (existing.meta = {}), overrides || {});
      if (!existing.meta.loopKey) existing.meta.loopKey = loopKey;
      return existing;
    }
    const def = PROCESS_TYPES[nextType] || PROCESS_TYPES.custom;
    const moduleGuess = nextType === "rent_due" ? "money" : nextType === "snag_close" ? "snags" : "cases";
    const created = {
      id: uid("pr"),
      type: nextType,
      title: title || (def.label + " · follow-on"),
      nextDue: today,
      cadenceDays: def.defaultCadenceDays || 7,
      leadDays: def.leadDays || 2,
      module: moduleGuess,
      accountLinks: (fromProc.accountLinks || []).slice(),
      meta: Object.assign({
        loopKey: loopKey,
        unitId: fromProc.meta && fromProc.meta.unitId,
        tenantId: fromProc.meta && fromProc.meta.tenantId,
        caseId: fromProc.meta && fromProc.meta.caseId,
      }, overrides || {}),
    };
    state.processes.unshift(created);
    return created;
  }

  function $(sel) { return document.querySelector(sel); }
  function toast(msg) {
    const el = $("#toast"); el.textContent = msg; el.classList.add("show");
    clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2200);
  }
  function showView(name) {
    currentView = name;
    document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
    const el = document.getElementById("view-" + name);
    if (el) el.classList.add("active");
    const primary = ["today", "units", "cases", "money", "more"];
    document.querySelectorAll("#bottom-nav button").forEach((b) => {
      if (primary.includes(name)) b.classList.toggle("active", b.dataset.nav === name);
      else b.classList.toggle("active", b.dataset.nav === "more");
    });
    render(); window.scrollTo(0, 0);
  }
  function openModal(title, html) {
    $("#modal-title").textContent = title; $("#modal-body").innerHTML = html;
    $("#modal").classList.add("open"); $("#modal").setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    $("#modal").classList.remove("open"); $("#modal").setAttribute("aria-hidden", "true");
  }
  function renderNavVisibility() {
    document.querySelectorAll("#bottom-nav button[data-mod]").forEach((btn) => {
      btn.classList.toggle("hidden-nav", !state.modules[btn.dataset.mod]);
    });
  }
  function renderHistoryPanel(el, limit) {
    if (!el) return;
    const hist = (state.history || []).slice(0, limit || 8);
    if (!hist.length) { el.innerHTML = '<div class="empty">No completions yet — run a process from the queue</div>'; return; }
    el.innerHTML = hist.map((h) => `
      <div class="history-item"><div><strong>${esc(h.title)}</strong> · done</div>
      <div class="h-meta">${fmtDate(h.completedAt)} · next ${fmtDate(h.nextDueSet)}${h.note ? " · " + esc(h.note) : ""}</div></div>`).join("");
  }

  function renderToday() {
    $("#today-date").textContent = todayLabel();
    const queue = buildQueue();
    $("#today-count").innerHTML = '<span class="dot"></span> ' + queue.length + " due";
    const occ = state.units.filter((u) => u.status === "occupied").length;
    $("#kpi-occ").textContent = Math.round((occ / state.units.length) * 100) + "%";
    const arrears = state.rentLedger.filter((r) => r.status === "due").reduce((s, r) => s + r.amount, 0);
    $("#kpi-arrears").textContent = fmtMoney(arrears);
    const root = $("#today-queue");
    root.innerHTML = queue.length ? queue.map((item) => `
      <button type="button" class="row sev-${item.severity}" data-process="${item.processId}">
        <div class="row-icon">${item.icon}</div>
        <div class="row-body"><div class="row-title">${esc(item.title)}</div><div class="row-meta">${esc(item.meta)}</div></div>
        <div class="row-right"><span class="badge ${item.severity === "red" ? "danger" : item.severity === "amber" ? "warn" : "ok"}">${item.due < 0 ? "Overdue" : item.due === 0 ? "Today" : item.due + "d"}</span></div>
      </button>`).join("") : '<div class="empty">Nothing due — add a process or wait for cadence.</div>';
    renderLoopTrack($("#loop-track"));
    const rem = buildReminders();
    const rp = $("#reminder-panel");
    const rb = $("#reminder-badge");
    if (rb) rb.textContent = rem.length ? rem.length + " queued" : "auto";
    if (rp) {
      rp.innerHTML = rem.length ? rem.map((r) => `
        <button type="button" class="reminder-item ${r.due <= 0 ? "due-now" : ""}" ${r.processId ? 'data-process="' + r.processId + '"' : ""}>
          <div class="r-time">${esc(r.when)}</div>
          <div class="r-body">${esc(r.title)}<div class="r-src ${r.quietShifted ? "quiet" : ""}">${esc(r.src)}</div></div>
        </button>`).join("") : '<div class="empty">No scheduled reminders</div>';
    }
    const en = $("#btn-enable-notifs");
    if (en) {
      const perm = notifPermission();
      if (perm === "granted" && getPrefs().notificationsEnabled) en.textContent = "Notifications on";
      else if (perm === "denied") en.textContent = "Notifications blocked — in-app queue still works";
      else en.textContent = "Enable notifications";
    }
    renderHistoryPanel($("#history-panel"), 5);
  }

  function renderUnits() {
    $("#units-list").innerHTML = state.units.map((u) => `
      <div class="card mb-12 sev-${u.status === "vacant" ? "amber" : "teal"}">
        <div class="card-head"><h3>${esc(u.label)}</h3><span class="badge ${u.status === "occupied" ? "ok" : "warn"}">${esc(u.status)}</span></div>
        <p style="font-size:13px;color:var(--text-dim)">${esc(u.property)} · ${u.beds} bed · ${fmtMoney(u.rent)}/mo</p>
      </div>`).join("");
  }

  function renderCases() {
    const filter = state.caseFilter || "all";
    const types = ["all", "rent", "exit", "snag", "deposit"];
    $("#case-pills").innerHTML = types.map((t) =>
      `<button type="button" class="pill ${filter === t ? "active" : ""}" data-case-filter="${t}">${t}</button>`).join("");
    const list = filter === "all" ? state.cases : state.cases.filter((c) => c.type === filter);
    $("#cases-list").innerHTML = list.map((c) => `
      <div class="card mb-12 sev-${c.status === "open" ? "amber" : "green"}">
        <div class="card-head"><h3>${esc(c.title)}</h3><span class="badge ${c.status === "open" ? "warn" : "ok"}">${esc(c.status)}</span></div>
        <p style="font-size:13px;color:var(--text-dim);margin-bottom:8px">${esc(c.type)} · ${esc(unitLabel(c.unitId))} · opened ${fmtDate(c.openedAt)}${c.amount ? " · " + fmtMoney(c.amount) : ""}</p>
        ${relatedProcessBtn(c.id)}
      </div>`).join("") || '<div class="empty">No cases</div>';
  }
  function relatedProcessBtn(caseId) {
    const p = state.processes.find((x) => x.meta && x.meta.caseId === caseId && processInQueue(x));
    if (!p) return "";
    return `<button type="button" class="btn btn-primary btn-sm" data-process="${p.id}">Run process</button>`;
  }

  function renderMoney() {
    const paid = state.rentLedger.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
    const due = state.rentLedger.filter((r) => r.status === "due").reduce((s, r) => s + r.amount, 0);
    $("#money-collected").textContent = fmtMoney(paid);
    $("#money-due").textContent = fmtMoney(due);
    $("#rent-ledger").innerHTML = state.rentLedger.map((r) => `
      <div class="ledger-row">
        <div><strong>${esc(r.label)}</strong><div class="h-meta">${fmtDate(r.at)} · ${esc(r.status)}</div></div>
        <div class="ledger-amt ${r.status === "paid" ? "pos" : "neg"}">${fmtMoney(r.amount)}</div>
      </div>`).join("");
    $("#deposits-list").innerHTML = state.tenants.map((t) => `
      <div class="ledger-row">
        <div><strong>${esc(t.name)}</strong><div class="h-meta">${esc(unitLabel(t.unitId))}</div></div>
        <div class="ledger-amt pos">${fmtMoney(t.deposit)}</div>
      </div>`).join("");
  }

  function renderMore() {
    const items = [
      { id: "tenants", mod: "tenants", icon: "👥", title: "Tenants / leases", meta: "Active · ending soon" },
      { id: "snags", mod: "snags", icon: "🔧", title: "Snags / repairs", meta: "Open tickets" },
      { id: "docs", mod: "docs", icon: "📄", title: "Docs", meta: "Leases · evidence packs" },
      { id: "settings", mod: null, icon: "⚙", title: "Settings", meta: "Modules · reminders · backup" },
    ];
    $("#more-grid").innerHTML = items.filter((i) => !i.mod || state.modules[i.mod]).map((i) => `
      <button type="button" class="more-item" data-nav="${i.id}">
        <div class="mi-icon">${i.icon}</div>
        <div class="mi-body"><div class="mi-title">${i.title}</div><div class="mi-meta">${i.meta}</div></div>
        <div class="mi-chevron">›</div>
      </button>`).join("");
  }

  function renderTenants() {
    $("#tenants-list").innerHTML = state.tenants.map((t) => {
      const d = daysUntil(t.leaseEnd);
      return `
        <div class="row sev-${d <= 30 ? "amber" : "teal"}">
          <div class="row-icon">👤</div>
          <div class="row-body">
            <div class="row-title">${esc(t.name)}</div>
            <div class="row-meta">${esc(unitLabel(t.unitId))} · lease ends ${fmtDate(t.leaseEnd)} · ${esc(t.phone)}</div>
          </div>
          <div class="row-right"><span class="badge ${d <= 30 ? "warn" : "ok"}">${d}d</span></div>
        </div>`;
    }).join("");
  }

  function renderSnags() {
    $("#snags-list").innerHTML = state.snags.map((s) => `
      <div class="row sev-${s.status === "open" && s.daysOpen > 7 ? "red" : s.status === "open" ? "amber" : "green"}">
        <div class="row-icon">🔧</div>
        <div class="row-body">
          <div class="row-title">${esc(s.title)}</div>
          <div class="row-meta">${esc(unitLabel(s.unitId))} · ${esc(s.contractor)} · ${s.daysOpen}d open</div>
        </div>
        <div class="row-right"><span class="badge ${s.status === "open" ? "warn" : "ok"}">${esc(s.status)}</span></div>
      </div>`).join("");
  }

  function renderDocs() {
    $("#docs-list").innerHTML = state.docs.map((d) => `
      <div class="row">
        <div class="row-icon">📄</div>
        <div class="row-body">
          <div class="row-title">${esc(d.title)}</div>
          <div class="row-meta">${esc(d.category)}${d.expiresAt ? " · exp " + fmtDate(d.expiresAt) : ""}</div>
        </div>
      </div>`).join("");
  }

  function renderSettings() {
    const settingsView = document.getElementById("view-settings");
    if (settingsView && !document.getElementById("profile-card")) {
      const card = document.createElement("div");
      card.className = "card mb-12";
      card.id = "profile-card";
      card.innerHTML = '<div class="card-head"><h3>Location &amp; purpose</h3><span class="badge teal">adapt</span></div><p id="profile-summary" style="font-size:15px;color:var(--text-dim);margin-bottom:10px"></p><button type="button" class="btn btn-ghost btn-block" id="btn-redo-onboard">Change city / purpose</button>';
      const first = settingsView.querySelector(".card, .toggle-list, #module-toggles");
      if (first) {
        const wrap = first.closest(".card") || first;
        settingsView.insertBefore(card, wrap);
      } else settingsView.insertBefore(card, settingsView.firstChild);
      document.getElementById("btn-redo-onboard").addEventListener("click", function () { state.profile.onboarded = false; save(); showOnboarding(); });
    }
    const ps = document.getElementById("profile-summary");
    if (ps && state.profile) ps.textContent = (state.profile.city || "—") + " · " + (state.profile.purpose || "—");

    const labels = { units: "Properties / units", cases: "Cases", money: "Money", tenants: "Tenants / leases", snags: "Snags / repairs", docs: "Docs"
    };
    $("#module-toggles").innerHTML = Object.keys(DEFAULT_MODULES).map((k) => `
      <label class="toggle-row">
        <div><div class="t-label">${labels[k] || k}</div><div class="t-meta">Show in nav / More</div></div>
        <div class="switch"><input type="checkbox" data-mod-toggle="${k}" ${state.modules[k] ? "checked" : ""} /><span class="slider"></span></div>
      </label>`).join("");
    $("#process-list").innerHTML = state.processes.map((p) => {
      const def = PROCESS_TYPES[p.type] || PROCESS_TYPES.custom;
      return `<button type="button" class="row btn-like" data-edit-process="${p.id}">
        <div class="row-icon">${def.icon || "◎"}</div>
        <div class="row-body"><div class="row-title">${esc(p.title)}</div>
        <div class="row-meta">${esc(def.label)} · next ${fmtDate(p.nextDue)} · every ${p.cadenceDays}d</div></div>
        <div class="row-right"><span class="badge muted">edit</span></div></button>`;
    }).join("") || '<div class="empty">No processes</div>';
    renderHistoryPanel($("#history-list-full"), 20);
    const prefs = getPrefs();
    const qs = $("#quiet-start");
    const qe = $("#quiet-end");
    const pn = $("#pref-notifs");
    const ns = $("#notif-status");
    if (qs && document.activeElement !== qs) qs.value = String(prefs.quietStart);
    if (qe && document.activeElement !== qe) qe.value = String(prefs.quietEnd);
    if (pn) pn.checked = !!prefs.notificationsEnabled;
    if (ns) {
      const perm = notifPermission();
      ns.textContent = "Permission: " + perm + (inQuietHours(new Date()) ? " · currently in quiet hours" : " · outside quiet hours");
    }
  }

  function render() {
    renderNavVisibility();
    renderToday();
    if (state.modules.units) renderUnits();
    if (state.modules.cases) renderCases();
    if (state.modules.money) renderMoney();
    renderMore();
    if (state.modules.tenants) renderTenants();
    if (state.modules.snags) renderSnags();
    if (state.modules.docs) renderDocs();
    renderSettings();
  }

  /* ProcessRunner */
  let prState = null;
  function getProcess(id) { return (state.processes || []).find((p) => p.id === id); }
  function prPhases(proc) {
    const def = PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom;
    return ["start", ...(def.steps || []).map((_, i) => "step:" + i), "done", "nextdue"];
  }
  function openProcessRunner(processId) {
    const proc = getProcess(processId);
    if (!proc) { toast("Process not found"); return; }
    prState = { processId, phaseIndex: 0, answers: {}, checks: {} };
    $("#process-runner").classList.add("open");
    $("#process-runner").setAttribute("aria-hidden", "false");
    renderProcessRunner();
  }
  function closeProcessRunner() {
    prState = null;
    $("#process-runner").classList.remove("open");
    $("#process-runner").setAttribute("aria-hidden", "true");
  }
  function suggestNextDue(proc) {
    const days = Number(proc.cadenceDays) || (PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom).defaultCadenceDays || 30;
    return isoDate(addDays(new Date(), Math.max(1, days || 30)));
  }
  function renderAccountLinks(proc) {
    const links = proc.accountLinks || [];
    if (!links.length) return `<div class="pr-card"><p style="font-size:12px;color:var(--muted)">No account link yet — add in Settings.</p></div>`;
    return `<div class="pr-card"><h4>Account links</h4>` + links.map((a) =>
      `<button type="button" class="pr-link-btn" data-open-link="${esc(a.url)}"><span>Open · ${esc(a.label)}</span><span>↗</span></button>`).join("") + `</div>`;
  }
  function renderProcessRunner() {
    if (!prState) return;
    const proc = getProcess(prState.processId);
    if (!proc) return closeProcessRunner();
    const def = PROCESS_TYPES[proc.type] || PROCESS_TYPES.custom;
    const phases = prPhases(proc);
    const phase = phases[prState.phaseIndex];
    $("#pr-title").textContent = proc.title;
    $("#pr-badge").textContent = (prState.phaseIndex + 1) + "/" + phases.length;
    $("#pr-stepper").innerHTML = phases.map((_, i) =>
      `<span class="${i < prState.phaseIndex ? "done" : i === prState.phaseIndex ? "on" : ""}"></span>`).join("");
    const body = $("#pr-body"); const actions = $("#pr-actions");
    let html = "", act = "";
    if (phase === "start") {
      html = `<div class="pr-phase-label">Start</div><div class="pr-title">${esc(proc.title)}</div>
        <div class="pr-meta">${esc(def.label)} · due ${fmtDate(proc.nextDue)} · cadence every ${proc.cadenceDays || "—"} days</div>
        <div class="pr-card"><h4>What happens</h4>
          <p>Guided process (${def.steps.length} steps). Rent → handover → snags → deposit. On complete you confirm next due — returns to Today when due approaches. <strong>Approve</strong> deposit release yourself.</p>
          <p style="margin-top:8px;font-size:12px;color:var(--muted)">${esc(def.disclaimer || "")}</p></div>
        ${renderAccountLinks(proc)}
        ${proc.meta && proc.meta.amount ? `<div class="pr-card"><h4>Amount</h4><p>${fmtMoney(proc.meta.amount)}</p></div>` : ""}`;
      act = `<button type="button" class="btn btn-ghost" id="pr-cancel">Cancel</button><button type="button" class="btn btn-primary" id="pr-next">Start →</button>`;
    } else if (phase.startsWith("step:")) {
      const si = Number(phase.split(":")[1]); const step = def.steps[si];
      const showLinks = ["chase", "refund", "account", "send", "approve", "release"].includes(step.key);
      const isApprove = step.key === "approve" || step.key === "release";
      html = `<div class="pr-phase-label">Step ${si + 1} of ${def.steps.length}</div>
        <div class="pr-title">${esc(step.title)}</div><div class="pr-meta">${esc(step.body)}</div>
        ${isApprove ? `<div class="approve-card"><h3>Human Approve</h3><p>Irreversible money / release step in demo books. App does not move money or file at the Tribunal.</p></div>` : ""}
        ${showLinks ? renderAccountLinks(proc) : ""}
        ${step.checks ? `<div class="pr-card">${step.checks.map((c, i) =>
          `<label class="pr-check"><input type="checkbox" data-pr-check="${si}-${i}" ${prState.checks[si+"-"+i] ? "checked" : ""} /><span>${esc(c)}</span></label>`).join("")}</div>` : ""}
        ${step.key === "photos" ? `<div class="photo-slots">${(step.checks||[]).map((c,i) =>
          `<div class="photo-slot ${prState.checks[si+"-"+i] ? "done" : ""}" data-photo-slot="${si}-${i}">📷 ${esc(c)}</div>`).join("")}</div>` : ""}
        ${step.input === "note" || step.key === "notes" ? `<div class="form-row"><label>Notes</label><textarea id="pr-note">${esc(prState.answers.note || "")}</textarea></div>` : ""}
        <p style="font-size:11px;color:var(--muted);margin-top:8px">${esc(def.disclaimer || "")}</p>`;
      act = `<button type="button" class="btn btn-ghost" id="pr-back">Back</button><button type="button" class="btn btn-primary" id="pr-next">Continue →</button>`;
    } else if (phase === "done") {
      html = `<div class="pr-done-hero"><div class="big">✓</div><h4>Marked done</h4><p class="pr-meta">${esc(proc.title)} complete.</p></div>
        <div class="pr-card"><h4>Next</h4><p>Set next due so this returns to Today. Completing a stage ensures the next ProcessRunner in the loop.</p></div>`;
      act = `<button type="button" class="btn btn-ghost" id="pr-back">Back</button><button type="button" class="btn btn-primary" id="pr-next">Set next due →</button>`;
    } else if (phase === "nextdue") {
      const suggested = prState.suggestedNext || suggestNextDue(proc); prState.suggestedNext = suggested;
      html = `<div class="pr-phase-label">Next due</div><div class="pr-title">When should this return?</div>
        <div class="pr-meta">Suggested from cadence.</div>
        <div class="form-row"><label>Next due date</label><input type="date" id="pr-next-due" value="${suggested}" /></div>
        <div class="form-row"><label>Cadence (days)</label><input type="number" id="pr-cadence" value="${proc.cadenceDays || 30}" min="1" /></div>
        <div class="form-row"><label>Note</label><input type="text" id="pr-final-note" value="${esc(prState.answers.note || "")}" /></div>`;
      act = `<button type="button" class="btn btn-ghost" id="pr-back">Back</button><button type="button" class="btn btn-primary" id="pr-finish">Confirm &amp; close</button>`;
    }
    body.innerHTML = html; actions.innerHTML = act;
    $("#pr-cancel")?.addEventListener("click", closeProcessRunner);
    $("#pr-back")?.addEventListener("click", () => { if (prState.phaseIndex > 0) { prState.phaseIndex--; renderProcessRunner(); } });
    $("#pr-next")?.addEventListener("click", () => {
      if (!validatePrStep(phase, def)) return;
      const note = document.getElementById("pr-note"); if (note) prState.answers.note = note.value.trim();
      prState.phaseIndex++; renderProcessRunner();
    });
    $("#pr-finish")?.addEventListener("click", () => finishProcess(proc));
    body.querySelectorAll("[data-pr-check]").forEach((el) => el.addEventListener("change", () => { prState.checks[el.getAttribute("data-pr-check")] = el.checked; }));
    body.querySelectorAll("[data-photo-slot]").forEach((el) => el.addEventListener("click", () => {
      const k = el.getAttribute("data-photo-slot"); prState.checks[k] = !prState.checks[k];
      const cb = body.querySelector(`[data-pr-check="${k}"]`); if (cb) cb.checked = !!prState.checks[k];
      el.classList.toggle("done", !!prState.checks[k]);
    }));
    body.querySelectorAll("[data-open-link]").forEach((btn) => btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-open-link"); if (url) window.open(url, "_blank", "noopener,noreferrer");
    }));
  }
  function validatePrStep(phase, def) {
    if (!phase.startsWith("step:")) return true;
    const si = Number(phase.split(":")[1]); const step = def.steps[si];
    if (step.checks) {
      for (let i = 0; i < step.checks.length; i++) {
        if (!prState.checks[si + "-" + i]) { toast("Tick all confirmations to continue"); return false; }
      }
    }
    return true;
  }
  function finishProcess(proc) {
    const nextDue = (document.getElementById("pr-next-due") && document.getElementById("pr-next-due").value) || suggestNextDue(proc);
    const cadence = Math.max(1, Number(document.getElementById("pr-cadence") && document.getElementById("pr-cadence").value) || proc.cadenceDays || 30);
    const note = (document.getElementById("pr-final-note") && document.getElementById("pr-final-note").value.trim()) || prState.answers.note || "";
    proc.nextDue = nextDue; proc.cadenceDays = cadence; proc.lastCompletedAt = isoDate(new Date());
    if (!state.pipeline) state.pipeline = { rentDone: false, handoverDone: false, snagsDone: false, depositDone: false };

    if (proc.type === "rent_due") {
      if (proc.meta && proc.meta.ledgerId) {
        const r = state.rentLedger.find((x) => x.id === proc.meta.ledgerId);
        if (r) r.status = "paid";
      }
      if (proc.meta && proc.meta.caseId) {
        const c = state.cases.find((x) => x.id === proc.meta.caseId);
        if (c) c.status = "closed";
      }
      state.pipeline.rentDone = true;
      if (proc.meta && proc.meta.unitId) {
        const exitCase = state.cases.find((c) => c.type === "exit" && c.unitId === proc.meta.unitId && c.status === "open");
        if (exitCase) {
          ensureFollowOnProcess(proc, "inspection", "Exit handover — " + unitLabel(proc.meta.unitId), {
            caseId: exitCase.id,
            unitId: proc.meta.unitId,
            tenantId: proc.meta.tenantId,
          });
        }
      }
    }
    if (proc.type === "inspection") {
      if (proc.meta && proc.meta.caseId) {
        const c = state.cases.find((x) => x.id === proc.meta.caseId);
        if (c) c.status = "closed";
      }
      const docId = "d-insp-done-" + ((proc.meta && proc.meta.unitId) || "x");
      if (!state.docs.find((d) => d.id === docId)) {
        state.docs.unshift({
          id: docId,
          title: "Handover evidence — " + unitLabel(proc.meta && proc.meta.unitId),
          category: "Evidence",
          expiresAt: null,
        });
      }
      state.pipeline.handoverDone = true;
      const unitId = proc.meta && proc.meta.unitId;
      const openSnag = (state.snags || []).find((s) => s.status === "open" && (!unitId || s.unitId === unitId));
      if (openSnag) {
        ensureFollowOnProcess(proc, "snag_close", "Close snag — " + openSnag.title, {
          snagId: openSnag.id,
          unitId: openSnag.unitId,
        });
      } else {
        state.pipeline.snagsDone = true;
        ensureFollowOnProcess(proc, "deposit_close", "Deposit close — " + unitLabel(unitId), {
          amount: (proc.meta && proc.meta.amount) || (state.tenants.find((t) => t.unitId === unitId) || {}).deposit || 0,
        });
      }
    }
    if (proc.type === "snag_close") {
      if (proc.meta && proc.meta.snagId) {
        const s = state.snags.find((x) => x.id === proc.meta.snagId);
        if (s) s.status = "closed";
      }
      if (proc.meta && proc.meta.caseId) {
        const c = state.cases.find((x) => x.id === proc.meta.caseId);
        if (c) c.status = "closed";
      }
      const unitId = proc.meta && proc.meta.unitId;
      const stillOpen = (state.snags || []).some((s) => s.status === "open" && (!unitId || s.unitId === unitId));
      if (!stillOpen) state.pipeline.snagsDone = true;
      if (unitId) {
        const depCase = state.cases.find((c) => c.type === "deposit" && c.unitId === unitId);
        ensureFollowOnProcess(proc, "deposit_close", "Deposit close — " + unitLabel(unitId), {
          caseId: depCase ? depCase.id : (proc.meta && proc.meta.caseId),
          amount: (depCase && depCase.amount) || (state.tenants.find((t) => t.unitId === unitId) || {}).deposit || 0,
        });
      }
    }
    if (proc.type === "deposit_close") {
      if (proc.meta && proc.meta.caseId) {
        const c = state.cases.find((x) => x.id === proc.meta.caseId);
        if (c) c.status = "closed";
      }
      if (proc.meta && proc.meta.tenantId) {
        const t = state.tenants.find((x) => x.id === proc.meta.tenantId);
        if (t) t.deposit = 0;
      }
      state.pipeline.depositDone = true;
      const docId = "d-dep-release-" + ((proc.meta && proc.meta.tenantId) || "x");
      if (!state.docs.find((d) => d.id === docId)) {
        state.docs.unshift({
          id: docId,
          title: "Deposit release Approved — " + ((proc.meta && proc.meta.tenantId) || ""),
          category: "Deposit",
          expiresAt: null,
        });
      }
    }

    state.history.unshift({ id: uid("h"), processId: proc.id, title: proc.title, type: proc.type, completedAt: isoDate(new Date()), nextDueSet: nextDue, note });
    if (state.history.length > 50) state.history.length = 50;
    syncPipelineFromState();
    save();
    scheduleReminderForProcess(proc);
    closeProcessRunner();
    render();
    toast("Done · next due " + fmtDate(nextDue));
  }

  function openAddProcessModal(editId) {
    const editing = editId ? getProcess(editId) : null;
    const types = Object.keys(PROCESS_TYPES).map((k) =>
      `<option value="${k}" ${editing && editing.type === k ? "selected" : ""}>${esc(PROCESS_TYPES[k].label)}</option>`).join("");
    openModal(editing ? "Edit process" : "Add recurring process", `
      <div class="form-row"><label>Title</label><input type="text" id="np-title" value="${editing ? esc(editing.title) : ""}" /></div>
      <div class="form-row"><label>Process type</label><select id="np-type">${types}</select></div>
      <div class="form-row"><label>Next due</label><input type="date" id="np-due" value="${editing ? editing.nextDue : isoDate(addDays(new Date(), 1))}" /></div>
      <div class="form-row"><label>Cadence (days)</label><input type="number" id="np-cadence" min="1" value="${editing ? editing.cadenceDays : 30}" /></div>
      <div class="form-row"><label>Lead days</label><input type="number" id="np-lead" min="0" value="${editing ? editing.leadDays : 3}" /></div>
      <div class="form-row"><label>Account link label</label><input type="text" id="np-link-label" value="${editing && editing.accountLinks && editing.accountLinks[0] ? esc(editing.accountLinks[0].label) : ""}" /></div>
      <div class="form-row"><label>Account link URL</label><input type="url" id="np-link-url" value="${editing && editing.accountLinks && editing.accountLinks[0] ? esc(editing.accountLinks[0].url) : ""}" /></div>
      <div class="btn-row"><button type="button" class="btn btn-primary btn-block" id="np-save">${editing ? "Save" : "Add process"}</button></div>
      ${editing ? `<button type="button" class="btn btn-danger btn-block" id="np-run" style="margin-top:8px">Run wizard now</button>
                   <button type="button" class="btn btn-ghost btn-block" id="np-delete" style="margin-top:8px">Delete</button>` : ""}
      <p style="font-size:11px;color:var(--muted);margin-top:10px">NOT legal or financial advice.</p>`);
    setTimeout(() => {
      $("#np-save")?.addEventListener("click", () => {
        const title = $("#np-title").value.trim(); if (!title) { toast("Enter a title"); return; }
        const type = $("#np-type").value;
        const nextDue = $("#np-due").value || isoDate(addDays(new Date(), 1));
        const cadenceDays = Math.max(1, Number($("#np-cadence").value) || 30);
        const leadDays = Math.max(0, Number($("#np-lead").value) || 3);
        const label = $("#np-link-label").value.trim(); const url = $("#np-link-url").value.trim();
        const links = label && url ? [{ label, url }] : url ? [{ label: "Open", url }] : [];
        const moduleGuess = type === "rent_due" ? "money" : type === "snag_close" ? "snags" : "cases";
        if (editing) Object.assign(editing, { title, type, nextDue, cadenceDays, leadDays, module: moduleGuess, accountLinks: links.length ? links : editing.accountLinks || [] });
        else state.processes.unshift({ id: uid("pr"), type, title, nextDue, cadenceDays, leadDays, module: moduleGuess, accountLinks: links, meta: {} });
        save(); closeModal(); render(); toast(editing ? "Updated" : "Added");
      });
      $("#np-run")?.addEventListener("click", () => { closeModal(); openProcessRunner(editing.id); });
      $("#np-delete")?.addEventListener("click", () => {
        if (!confirm("Delete?")) return;
        state.processes = state.processes.filter((p) => p.id !== editing.id);
        save(); closeModal(); render(); toast("Deleted");
      });
    }, 0);
  }

  
  /* PLATFORM_BAR_2026_09_11 helpers */

  function applyPurposeModules(purpose) {
    const preset = PURPOSE_MODULE_PRESETS[purpose];
    if (!preset || !state.modules) return;
    Object.keys(state.modules).forEach((k) => {
      if (Object.prototype.hasOwnProperty.call(preset, k)) state.modules[k] = !!preset[k];
    });
  }

  function updateBrandLocation() {
    const sub = document.querySelector(".brand-text p");
    if (!sub || !state.profile) return;
    const city = state.profile.city || "";
    const purpose = state.profile.purpose || "";
    if (city || purpose) sub.textContent = [city, purpose].filter(Boolean).join(" · ");
  }

  function showOnboarding() {
    const el = document.getElementById("onboard");
    if (!el) return;
    const city = document.getElementById("ob-city");
    const purpose = document.getElementById("ob-purpose");
    if (city && state.profile) city.value = state.profile.city || "Bloemfontein";
    if (purpose && state.profile) purpose.value = state.profile.purpose || "rentals";
    el.classList.add("open");
    el.setAttribute("aria-hidden", "false");
  }

  function hideOnboarding() {
    const el = document.getElementById("onboard");
    if (!el) return;
    el.classList.remove("open");
    el.setAttribute("aria-hidden", "true");
  }

  function completeOnboarding() {
    const city = (document.getElementById("ob-city") && document.getElementById("ob-city").value || "").trim();
    const purpose = (document.getElementById("ob-purpose") && document.getElementById("ob-purpose").value) || "";
    if (!city) { toast("Enter your city / region"); return; }
    if (!purpose) { toast("Choose what you run"); return; }
    state.profile = { onboarded: true, city: city, purpose: purpose, updatedAt: new Date().toISOString() };
    applyPurposeModules(purpose);
    save();
    hideOnboarding();
    updateBrandLocation();
    render();
    toast("Saved · modules adapted");
  }

  function maybeOnboard() {
    if (!state.profile) state.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
    if (!state.profile.onboarded) showOnboarding();
    else updateBrandLocation();
  }


  function resetDemo() {
    if (!confirm("Reset all Rental Desk demo data?")) return;
    Object.keys(reminderTimers).forEach(clearReminderTimer);
    state = seed();
    save();
    showView("today");
    updateInstallBanner();
    rescheduleAllReminders();
    toast("Demo reset");
  }

  document.getElementById("bottom-nav").addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-nav]"); if (btn) showView(btn.dataset.nav);
  });
  document.getElementById("main").addEventListener("click", (e) => {
    const back = e.target.closest(".back-link[data-nav]"); if (back) { showView(back.dataset.nav); return; }
    const more = e.target.closest(".more-item[data-nav]"); if (more) { showView(more.dataset.nav); return; }
    const procBtn = e.target.closest("[data-process]"); if (procBtn) { openProcessRunner(procBtn.getAttribute("data-process")); return; }
    const editProc = e.target.closest("[data-edit-process]"); if (editProc) { openAddProcessModal(editProc.getAttribute("data-edit-process")); return; }
    const cf = e.target.closest("[data-case-filter]"); if (cf) { state.caseFilter = cf.getAttribute("data-case-filter"); save(); render(); return; }
    const modToggle = e.target.closest("[data-mod-toggle]");
    if (modToggle) { state.modules[modToggle.dataset.modToggle] = !!modToggle.checked; save(); render(); toast((modToggle.checked ? "Enabled " : "Hidden ") + modToggle.dataset.modToggle); }
  });
  $("#btn-reset").addEventListener("click", resetDemo);
  $("#btn-reset-2").addEventListener("click", resetDemo);
  $("#btn-info").addEventListener("click", () => openModal("About Rental Desk",
    `<p><strong>Rental Desk</strong> is a mobile-first demo for a small SA landlord / agent (1–20 units).</p>
     <p>Treat rent, exit/handover, snags and deposit as <strong>cases</strong> with guided ProcessRunner loop: <strong>rent → handover → snags → deposit</strong>.</p>
     <p>Sample: Botha Rentals, Bloemfontein. Installable PWA · JSON backup in Settings.</p>
     <p style="font-size:12px;color:var(--muted)">NOT legal or financial advice. Does not file at the Rental Housing Tribunal or move money — you Approve deposit release.</p>`));
  $("#modal-close").addEventListener("click", closeModal);
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") closeModal(); });
  $("#pr-close").addEventListener("click", closeProcessRunner);
  $("#btn-add-process")?.addEventListener("click", () => openAddProcessModal());
  $("#btn-add-process-today")?.addEventListener("click", () => openAddProcessModal());
  document.getElementById("ob-save") && document.getElementById("ob-save").addEventListener("click", completeOnboarding);

  /* ── backup export / import ── */
  function collectExportPayload() {
    return {
      app: "rental-desk",
      version: 1,
      exportedAt: new Date().toISOString(),
      keys: {
        [STORAGE_KEY]: state,
      },
    };
  }
  function exportJson() {
    const payload = collectExportPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rental-desk-backup-" + isoDate(new Date()) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    toast("Exported JSON backup");
  }
  function applyImportPayload(data) {
    if (!data || typeof data !== "object") throw new Error("Invalid file");
    let next = null;
    if (data.keys && data.keys[STORAGE_KEY]) next = data.keys[STORAGE_KEY];
    else if (data.state && typeof data.state === "object") next = data.state;
    else if (data.processes || data.modules || data.units) next = data;
    else if (data.keys) {
      const vals = Object.keys(data.keys);
      if (vals.length === 1) next = data.keys[vals[0]];
    }
    if (!next || typeof next !== "object") throw new Error("No Rental Desk state in file");
    next.modules = Object.assign({}, DEFAULT_MODULES, next.modules || {});
    next.prefs = Object.assign(defaultPrefs(), next.prefs || {});
    if (!Array.isArray(next.processes)) next.processes = seedProcesses(startOfDay(new Date()));
    if (!Array.isArray(next.history)) next.history = [];
    if (!next.profile) next.profile = { onboarded: false, city: "", purpose: "", updatedAt: null };
    if (!next.pipeline) next.pipeline = { rentDone: false, handoverDone: false, snagsDone: false, depositDone: false };
    if (!next.caseFilter) next.caseFilter = "all";
    Object.keys(reminderTimers).forEach(clearReminderTimer);
    state = next;
    save();
    rescheduleAllReminders();
    render();
    updateInstallBanner();
    toast("Import complete");
  }
  function importJsonFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(String(reader.result || ""));
        applyImportPayload(data);
      } catch (err) {
        toast("Import failed — check JSON");
      }
    };
    reader.onerror = function () { toast("Could not read file"); };
    reader.readAsText(file);
  }

  /* ── PWA install affordance ── */
  var deferredInstall = null;
  function updateInstallBanner() {
    const banner = $("#install-banner");
    if (!banner) return;
    const prefs = getPrefs();
    const standalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    if (standalone || prefs.installDismissed) {
      banner.classList.add("hidden");
      return;
    }
    if (deferredInstall) {
      banner.classList.remove("hidden");
      const btn = $("#btn-install");
      if (btn) btn.textContent = "Install";
    } else {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS && !prefs.installDismissed) {
        banner.classList.remove("hidden");
        const btn = $("#btn-install");
        if (btn) btn.textContent = "How to";
      } else {
        banner.classList.add("hidden");
      }
    }
  }
  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    deferredInstall = e;
    updateInstallBanner();
  });
  window.addEventListener("appinstalled", function () {
    deferredInstall = null;
    getPrefs().installDismissed = true;
    save();
    updateInstallBanner();
    toast("Rental Desk installed");
  });

  $("#btn-install") && $("#btn-install").addEventListener("click", function () {
    if (deferredInstall) {
      deferredInstall.prompt();
      deferredInstall.userChoice.then(function (choice) {
        deferredInstall = null;
        if (choice && choice.outcome === "accepted") {
          getPrefs().installDismissed = true;
          save();
        }
        updateInstallBanner();
      });
      return;
    }
    openModal(
      "Add to Home Screen",
      `<p style="font-size:15px;line-height:1.55">On iPhone/iPad: Safari → Share → <strong>Add to Home Screen</strong>.</p>
       <p style="font-size:15px;line-height:1.55;margin-top:8px">On Android Chrome: menu → <strong>Install app</strong> / Add to Home screen.</p>
       <p style="font-size:13px;color:var(--muted);margin-top:10px">Offline shell caches index, app.js, styles, and manifest. NOT legal or financial advice.</p>`
    );
  });
  $("#btn-install-dismiss") && $("#btn-install-dismiss").addEventListener("click", function () {
    getPrefs().installDismissed = true;
    save();
    updateInstallBanner();
  });

  $("#btn-enable-notifs") && $("#btn-enable-notifs").addEventListener("click", function () {
    getPrefs().notificationsEnabled = true;
    save();
    requestNotificationPermission().then(function () {
      checkDueNotifications();
      rescheduleAllReminders();
    });
  });
  $("#btn-request-notifs") && $("#btn-request-notifs").addEventListener("click", function () {
    getPrefs().notificationsEnabled = true;
    save();
    requestNotificationPermission().then(function () {
      checkDueNotifications();
      rescheduleAllReminders();
      render();
    });
  });
  $("#pref-notifs") && $("#pref-notifs").addEventListener("change", function (e) {
    getPrefs().notificationsEnabled = !!e.target.checked;
    save();
    if (e.target.checked) {
      requestNotificationPermission().then(function () { rescheduleAllReminders(); });
    } else {
      Object.keys(reminderTimers).forEach(clearReminderTimer);
      toast("Reminder alerts off — queue still shows in Today");
    }
    render();
  });
  function saveQuietFromInputs() {
    const prefs = getPrefs();
    const qs = $("#quiet-start");
    const qe = $("#quiet-end");
    if (qs) {
      let v = Math.max(0, Math.min(23, Number(qs.value)));
      if (Number.isNaN(v)) v = 21;
      prefs.quietStart = v;
    }
    if (qe) {
      let v = Math.max(0, Math.min(23, Number(qe.value)));
      if (Number.isNaN(v)) v = 7;
      prefs.quietEnd = v;
    }
    save();
    rescheduleAllReminders();
    toast("Quiet hours saved");
    render();
  }
  $("#quiet-start") && $("#quiet-start").addEventListener("change", saveQuietFromInputs);
  $("#quiet-end") && $("#quiet-end").addEventListener("change", saveQuietFromInputs);

  $("#btn-export-json") && $("#btn-export-json").addEventListener("click", exportJson);
  $("#btn-import-json") && $("#btn-import-json").addEventListener("click", function () {
    const f = $("#import-file");
    if (f) f.click();
  });
  $("#import-file") && $("#import-file").addEventListener("change", function (e) {
    const file = e.target.files && e.target.files[0];
    importJsonFile(file);
    e.target.value = "";
  });

  /* boot */
  maybeOnboard();
  render();
  updateInstallBanner();
  rescheduleAllReminders();
  checkDueNotifications();
  setInterval(function () {
    checkDueNotifications();
  }, 5 * 60 * 1000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") checkDueNotifications();
  });
})();
