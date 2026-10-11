// Shared by the marathon endpoints. Files starting with "_" in /api are not
// deployed as functions. Mirrors the date logic in marathon/index.html.
const plan = require("../marathon/plan.json");

const LOG_KEY = "marathon-training-log";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BACKUP_DAY = "Thu";
const MOVABLE_DAYS = ["Tue", "Fri"];
const DAY_MS = 864e5;

// Entries are keyed by session id ("w3-Tue"); the newest updatedAt wins, so
// two devices logging different sessions never overwrite each other.
function mergeLog(a, b) {
  const merged = { ...(a || {}) };
  for (const [id, entry] of Object.entries(b || {})) {
    if (!entry || typeof entry !== "object") continue;
    const prev = merged[id];
    if (!prev || (entry.updatedAt || 0) >= (prev.updatedAt || 0)) merged[id] = entry;
  }
  return merged;
}

// Dates are whole UTC day numbers so the server's own timezone never matters.
function dayNum(str) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(str || "").trim());
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / DAY_MS : null;
}

function londonToday() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date());
  const get = t => parts.find(p => p.type === t).value;
  return dayNum(`${get("year")}-${get("month")}-${get("day")}`);
}

const weekday = n => DAYS[(new Date(n * DAY_MS).getUTCDay() + 6) % 7];
const fmtDay = n => new Date(n * DAY_MS).toLocaleDateString("en-GB", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short" });
const normDay = v => DAYS.find(d => d.toLowerCase() === String(v || "").trim().slice(0, 3).toLowerCase()) || null;
const cap1 = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmtMins = m => (m >= 90 ? `${Math.floor(m / 60)}h${m % 60 ? " " + String(m % 60).padStart(2, "0") : ""}` : `${m} min`);

function buildSessions() {
  const start = dayNum(plan.startDate);
  const week1 = start - DAYS.indexOf(weekday(start));
  const seen = new Map();
  const sessions = [];
  for (const s of plan.sessions || []) {
    const week = Number(s.week);
    const day = normDay(s.day);
    const minutes = Number(s.minutes);
    if (!Number.isInteger(week) || week < 1 || !day || !Number.isFinite(minutes)) continue;
    let id = `w${week}-${day}`;
    const n = (seen.get(id) || 0) + 1;
    seen.set(id, n);
    if (n > 1) id += `-${n}`;
    sessions.push({
      id, week, day, minutes: Math.round(minutes),
      type: String(s.type || "run").trim().toLowerCase(),
      date: week1 + (week - 1) * 7 + DAYS.indexOf(day),
      thuDate: week1 + (week - 1) * 7 + DAYS.indexOf(BACKUP_DAY),
    });
  }
  return { sessions, week1, race: { name: (plan.race && plan.race.name) || "Marathon", date: dayNum(plan.race && plan.race.date) } };
}

module.exports = { plan, LOG_KEY, DAYS, BACKUP_DAY, MOVABLE_DAYS, mergeLog, dayNum, londonToday, weekday, fmtDay, cap1, fmtMins, buildSessions };
