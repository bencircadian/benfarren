const { Redis } = require("@upstash/redis");

const redis = Redis.fromEnv();
const { LOG_KEY: KEY, mergeLog } = require("./_marathon");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const data = await redis.get(KEY);
      return res.status(200).json(data || {});
    }

    if (req.method === "POST") {
      const incoming = req.body;
      if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
        return res.status(400).json({ error: "Expected an object of log entries" });
      }
      const merged = mergeLog(await redis.get(KEY), incoming);
      await redis.set(KEY, merged);
      return res.status(200).json(merged);
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Marathon log API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
