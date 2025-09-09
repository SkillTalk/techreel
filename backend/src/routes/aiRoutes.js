const express = require("express");
const router = express.Router();

// Optional dependency: only require if API key exists
let OpenAIClient = null;
try {
  OpenAIClient = require("openai");
} catch (e) {
  // openai not installed – route will gracefully fallback
}

router.get("/snippet", async (_req, res) => {
  const fallback = "// loading…\nconsole.log('Bringing fresh content to your feed!');";
  try {
    if (!OpenAIClient || !process.env.OPENAI_API_KEY) {
      return res.json({ snippet: fallback });
    }
    const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = "Give a tiny (<=10 lines) playful code snippet in any language that prints a motivational one-liner. No explanation, code only.";
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
      max_tokens: 120,
    });
    const text = resp?.choices?.[0]?.message?.content?.trim() || fallback;
    res.json({ snippet: text });
  } catch (err) {
    console.error("AI snippet error:", err?.message || err);
    res.json({ snippet: fallback });
  }
});

module.exports = router;


