const { Redis } = require("@upstash/redis");

const redis = Redis.fromEnv();
const KEY = "music-quiz-progress";

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
      const progress = req.body;
      await redis.set(KEY, progress);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("Music progress API error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
};
