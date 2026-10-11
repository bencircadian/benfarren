const { Redis } = require("@upstash/redis");
const m = require("./_marathon");

const redis = Redis.fromEnv();

// Plain-text endpoint for Apple Shortcuts / Apple Watch.
//   GET                     -> next session + countdown
//   POST ?action=done|skip|thu [&id=w3-Tue]  -> act on the next session (or id)
//   POST ?action=undo       -> revert the most recent change
//   POST ?action=log-run    -> mark the session due today done (workout automation)
// Optional ?today=YYYY-MM-DD previews another date.

const isResolved = e => e && (e.status === "done" || e.status === "skipped");
const effDate = (s, log) => ((log[s.id] || {}).thu ? s.thuDate : s.date);
const describe = s => `${m.cap1(s.type)} ${m.fmtMins(s.minutes)}`;

function dayLabel(n, today) {
  if (n === today) return "Today";
  if (n === today + 1) return "Tomorrow";
  return m.fmtDay(n);
}

function nextSession(sessions, log, today) {
  return sessions
    .filter(s => !isResolved(log[s.id]) && effDate(s, log) >= today)
    .sort((a, b) => effDate(a, log) - effDate(b, log))[0] || null;
}

function summary(ctx) {
  const { sessions, week1, race, log, today } = ctx;
  const lines = [];
  const loggedToday = sessions.find(s => effDate(s, log) === today && (log[s.id] || {}).status === "done");
  if (loggedToday) lines.push(`✓ Today's run logged`);

  const next = nextSession(sessions, log, today);
  if (next) lines.push(`${dayLabel(effDate(next, log), today)}: ${describe(next)}`);

  const week = Math.floor((today - week1) / 7) + 1;
  const missed = sessions.filter(s => s.week === week && effDate(s, log) < today && !isResolved(log[s.id]));
  if (missed.length) lines.push(`Not logged: ${missed.map(s => s.day).join(", ")}`);

  const days = race.date - today;
  const total = Math.max(...sessions.map(s => s.week), 1);
  const short = race.name.replace(/\s+marathon$/i, "");
  if (days > 0) lines.push(`${days} day${days === 1 ? "" : "s"} to ${short}${week >= 1 && week <= total ? ` · Wk ${week}/${total}` : ""}`);
  else if (days === 0) lines.push(`Race day. Go get it!`);
  else if (!next) lines.push(`${race.name} done. 🏅`);
  return lines.join("\n");
}

function applyAction(action, ctx, id) {
  const { sessions, log, today } = ctx;
  const now = Date.now();
  const set = (s, patch) => { log[s.id] = { ...(log[s.id] || {}), ...patch, updatedAt: now }; };

  if (action === "undo") {
    const last = Object.entries(log)
      .filter(([, e]) => e && (e.status || e.thu))
      .sort((a, b) => (b[1].updatedAt || 0) - (a[1].updatedAt || 0))[0];
    if (!last) return { msg: "Nothing to undo." };
    const s = sessions.find(x => x.id === last[0]);
    const e = last[1];
    log[last[0]] = { ...e, ...(e.status ? { status: null } : { thu: false }), updatedAt: now };
    return { changed: true, msg: `↩ Undone: ${s ? `${s.day} ${describe(s)}` : last[0]}` };
  }

  if (action === "log-run") {
    const due = sessions.filter(s => effDate(s, log) === today);
    const open = due.find(s => !isResolved(log[s.id]));
    if (open) {
      set(open, { status: "done" });
      return { changed: true, msg: `✓ Logged: ${open.day === m.weekday(today) ? "" : `${open.day} (on ${m.weekday(today)}) `}${describe(open)}` };
    }
    if (due.some(s => (log[s.id] || {}).status === "done")) return { msg: "Today's run is already logged." };
    // A Thursday run with nothing moved yet counts as the missed Tuesday.
    if (m.weekday(today) === m.BACKUP_DAY) {
      const week = sessions.filter(s => s.thuDate === today);
      const missedTue = week.find(s => s.day === "Tue" && !isResolved(log[s.id]));
      if (missedTue && !week.some(s => (log[s.id] || {}).thu)) {
        set(missedTue, { status: "done", thu: true });
        return { changed: true, msg: `✓ Logged: Tue ${describe(missedTue)} (run on Thu)` };
      }
    }
    return { msg: "No session planned today, so this run wasn't logged." };
  }

  const s = id ? sessions.find(x => x.id === id) : nextSession(sessions, log, today);
  if (!s) return { status: 404, msg: id ? `No session "${id}" in the plan.` : "No sessions left to log." };

  if (action === "done") {
    set(s, { status: "done" });
    return { changed: true, msg: `✓ Done: ${s.day} ${describe(s)}` };
  }
  if (action === "skip") {
    set(s, { status: "skipped", thu: false });
    return { changed: true, msg: `Skipped: ${s.day} ${describe(s)}` };
  }
  if (action === "thu") {
    if (!m.MOVABLE_DAYS.includes(s.day)) return { status: 400, msg: `Only Tuesday or Friday runs can move to Thursday (next is ${s.day}).` };
    if ((log[s.id] || {}).thu) return { msg: `${s.day} ${describe(s)} is already on Thursday.` };
    if (sessions.some(x => x.week === s.week && x.id !== s.id && (log[x.id] || {}).thu)) return { status: 409, msg: "Thursday is already used this week." };
    if (s.thuDate < today) return { status: 400, msg: "This week's Thursday has passed." };
    set(s, { thu: true });
    return { changed: true, msg: `→ Moved ${s.day} ${describe(s)} to Thu ${m.fmtDay(s.thuDate).replace(/^\w+ /, "")}` };
  }
  return { status: 400, msg: `Unknown action "${action}". Use done, skip, thu, undo or log-run.` };
}

module.exports = async function handler(req, res) {
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const q = req.query || {};
  const action = String(q.action || (req.body && req.body.action) || "").toLowerCase();
  const id = q.id || (req.body && req.body.id) || "";
  const today = m.dayNum(q.today) ?? m.londonToday();

  try {
    if (req.method === "GET" && action) {
      return res.status(405).send("Use POST to change the log (GET only reads it).");
    }
    if (req.method !== "GET" && req.method !== "POST") return res.status(405).send("Method not allowed");

    const { sessions, week1, race } = m.buildSessions();
    const log = (await redis.get(m.LOG_KEY)) || {};
    const ctx = { sessions, week1, race, log, today };

    if (req.method === "GET") return res.status(200).send(summary(ctx));

    const result = applyAction(action, ctx, id);
    if (result.changed) {
      // Merge against the latest copy in case the website wrote meanwhile.
      const latest = (await redis.get(m.LOG_KEY)) || {};
      await redis.set(m.LOG_KEY, m.mergeLog(latest, log));
    }
    const next = nextSession(sessions, log, today);
    const tail = result.changed && next ? `\nNext: ${dayLabel(effDate(next, log), today)} · ${describe(next)}` : "";
    return res.status(result.status || 200).send(result.msg + tail);
  } catch (err) {
    console.error("Marathon today API error:", err);
    return res.status(500).send("Couldn't reach the training log. Try again in a moment.");
  }
};
