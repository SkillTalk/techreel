const express = require("express");
const router = express.Router();

// Optional dependency: only require if API key exists
let OpenAIClient = null;
try {
  OpenAIClient = require("openai");
} catch (e) {
  // openai not installed – route will gracefully fallback
}

// Optional parsers for resume uploads
let multer, pdfParse, mammoth;
try { multer = require("multer"); } catch {}
try { pdfParse = require("pdf-parse"); } catch {}
try { mammoth = require("mammoth"); } catch {}

router.get("/snippet", async (_req, res) => {
  const fallback = "// loading…\nconsole.log('Bringing fresh content to your feed!');";
  try {
    if (!OpenAIClient || !process.env.OPENAI_API_KEY) {
      return res.json({ snippet: fallback });
    }
    const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
    const prompt = "Give a tiny (<=10 lines) playful interview level code snippet in any language that prints a output. No explanation, code only.";
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

// --- helper to generate portfolio JSON from plain text content ---
async function generatePortfolioFromContent(content) {
  const fallback = {
    headline: "Professional",
    about: "Experienced professional.",
    skills: [],
    experience: [],
    projects: [],
    education: []
  };
  if (!OpenAIClient || !process.env.OPENAI_API_KEY || !content) return fallback;

  const openai = new OpenAIClient({ apiKey: process.env.OPENAI_API_KEY });
  const system = "You are a resume-to-portfolio formatter. Return STRICT JSON only.";
  const prompt = `Extract a structured portfolio from this resume text. Return JSON with keys:\n- headline (short),\n- about (2-3 sentences),\n- skills (array of strings),\n- experience (array of {company, role, start, end, duration, description, tools}),\n- projects (array of {name, company, role, duration, summary, impact, tools, link}),\n- education (array of {degree, school, year}).\nResume:\n${content}`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: prompt }
    ],
    temperature: 0.4,
    response_format: { type: "json_object" },
    max_tokens: 1200,
  });
  const text = resp?.choices?.[0]?.message?.content || "";
  try { return JSON.parse(text); } catch { return fallback; }
}

// Build portfolio from raw text
router.post("/portfolio", async (req, res) => {
  try {
    const { text = "", html = "" } = req.body || {};
    const content = text || html || "";
    const portfolio = await generatePortfolioFromContent(content);
    return res.json({ portfolio });
  } catch (err) {
    console.error("AI portfolio text error:", err?.message || err);
    res.json({ portfolio: await generatePortfolioFromContent("") });
  }
});

// Build portfolio from uploaded resume (pdf/docx/txt)
if (multer) {
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
  router.post("/portfolio/upload", upload.single("resume"), async (req, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: "No file uploaded" });
      const name = (file.originalname || "").toLowerCase();
      const mime = (file.mimetype || "").toLowerCase();
      let text = "";
      if ((mime.includes("pdf") || name.endsWith(".pdf")) && pdfParse) {
        const out = await pdfParse(file.buffer);
        text = out?.text || "";
      } else if (((mime.includes("word") && name.endsWith(".docx")) || name.endsWith(".docx")) && mammoth) {
        const out = await mammoth.extractRawText({ buffer: file.buffer });
        text = out?.value || "";
      } else {
        text = file.buffer.toString("utf-8");
      }
      const portfolio = await generatePortfolioFromContent(text);
      return res.json({ portfolio });
    } catch (err) {
      console.error("AI portfolio upload error:", err?.message || err);
      res.json({ portfolio: await generatePortfolioFromContent("") });
    }
  });
}

module.exports = router;

