/**
 * ===============================================
 * File: authController.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    This controller handles user authentication,
 *    including signup and login operations.
 *
 *    - signup: Registers a new user, hashes password,
 *              checks for duplicates, and stores data.
 *    - login:  Authenticates user credentials and returns
 *              a JWT token upon successful login.
 *
 * Dependencies:
 *    - bcryptjs: For password hashing
 *    - jsonwebtoken: For JWT generation
 *    - User model: Mongoose model for user schema
 *
 * Purpose:
 *    Core part of the authentication module in a MERN
 *    stack application. This file connects to the
 *    /api/auth/signup and /api/auth/login routes.
 * ===============================================
 */
// backend/src/controllers/authController.js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const User = require("../models/User");

/* ---------------------- helpers ---------------------- */

// Normalize "skills" to an array of strings
function toSkillArray(skills) {
  if (!skills) return [];
  if (Array.isArray(skills)) return skills.map((s) => String(s).trim()).filter(Boolean);
  return String(skills)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// Optional OpenAI-powered bio with safe fallback (never breaks signup)
async function makeBio(qualification, skillsCSV) {
  const defaultBio =
    `Professional with ${qualification || "a solid background"}; ` +
    `skilled in ${skillsCSV || "relevant areas"}. Passionate about shipping useful, user‑focused solutions.`;

  const key = (process.env.OPENAI_API_KEY || "").trim();
  if (!key) return defaultBio;

  const prompt =
    `Write a short (30–40 words), stylish, professional bio for a person.\n` +
    `Qualification: "${qualification || "N/A"}". Skills: "${skillsCSV || "N/A"}".\n` +
    `Tone: concise, confident, friendly. Avoid emojis and buzzwords.`;

  try {
    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 100,
      },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        timeout: 8000,
      }
    );
    const text = resp?.data?.choices?.[0]?.message?.content?.trim();
    return text || defaultBio;
  } catch (e) {
    console.warn("⚠️ OpenAI bio generation failed:", e?.response?.data || e.message);
    return defaultBio;
  }
}

/* ---------------------- controllers ---------------------- */

// POST /auth/signup  (and /api/auth/signup)
exports.signup = async (req, res) => {
  // accept either user_id or username from the client
  const {
    user_id: rawUserId,
    username, // some clients send this instead of user_id
    email,
    password,
    qualification,
    skills,
  } = req.body;

  const user_id = (rawUserId || username || "").trim();
  const skillsArr = toSkillArray(skills);

  if (!user_id || !email || !password) {
    return res
      .status(400)
      .json({ message: "user_id (or username), email and password are required" });
  }

  try {
    // Uniqueness checks
    const byId = await User.findOne({ user_id });
    if (byId) return res.status(409).json({ message: "User ID already exists" });

    if (email) {
      const byEmail = await User.findOne({ email });
      if (byEmail) return res.status(409).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create bio (OpenAI optional)
    const bio = await makeBio(qualification, skillsArr.join(", "));

    // Save user
    const newUser = await User.create({
      user_id,
      email,
      password: hashedPassword,
      qualification,
      skills: skillsArr, // schema accepts array
      bio,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: newUser._id,
        user_id: newUser.user_id,
        email: newUser.email,
        bio: newUser.bio,
        qualification: newUser.qualification,
        skills: newUser.skills,
      },
    });
  } catch (err) {
    // Handle Mongo duplicate key edge case
    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({ message: `${field} already exists` });
    }
    console.error("❌ Signup error:", err);
    return res.status(500).json({ message: "Server error during signup" });
  }
};

// POST /auth/login  (and /api/auth/login)
exports.login = async (req, res) => {
  try {
    const { user_id, username, password } = req.body;
    const finalUserId = (user_id || username || "").trim();

    if (!finalUserId || !password) {
      return res
        .status(400)
        .json({ message: "user_id (or username) and password are required" });
    }

    const user = await User.findOne({ user_id: finalUserId });
    if (!user) {
      return res.status(400).json({ message: "Invalid User ID or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(400).json({ message: "Invalid User ID or password" });
    }

    // ✅ Check if JWT_SECRET is defined
    if (!process.env.JWT_SECRET) {
      console.error("❌ JWT_SECRET is missing in .env");
      return res.status(500).json({ message: "Server configuration error" });
    }

    const token = jwt.sign(
      { userId: user._id, user_id: user.user_id },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        user_id: user.user_id,
        email: user.email || "",
        bio: user.bio || "",
        qualification: user.qualification || "",
        skills: user.skills || [],
        website: user.website || "",
      },
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};
