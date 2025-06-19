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
/*const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const OpenAI = require("openai");

// ✅ Setup OpenAI SDK (for v4+) in CommonJS
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =======================
// POST /api/auth/signup
// =======================
exports.signup = async (req, res) => {
  const { user_id, password, qualification, skills } = req.body;

  if (!user_id || !password || !qualification || !skills) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = await User.findOne({ user_id });
  if (existingUser) {
    return res.status(400).json({ message: "User ID already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const prompt = `Generate a short, stylish, professional bio for someone with qualification "${qualification}" and skills "${skills}".`;

  console.log("🟡 Sending prompt to OpenAI:", prompt);  // ✅ Debug prompt
  try {
    const gptRes = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    console.log("🟢 OpenAI response received:", gptRes); // ✅ Debug response

    const bio = gptRes.choices[0].message.content;

    const newUser = new User({
      user_id,
      password: hashedPassword,
      qualification,
      skills,
      bio,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        user_id: savedUser.user_id,
        bio: savedUser.bio,
        qualification: savedUser.qualification,
        skills: savedUser.skills,
      },
    });
  } catch (openaiErr) {
    console.error("❌ OpenAI or signup failure:", openaiErr);  // ✅ Full error
    return res.status(500).json({ message: "Server error during signup (OpenAI)" });
  }
}; // ✅ This was missing!

// =======================
// POST /api/auth/login
// =======================
exports.login = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res
        .status(400)
        .json({ message: "User ID and password are required" });
    }

    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(400).json({ message: "Invalid User ID or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid User ID or password" });
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
        bio: user.bio,
        qualification: user.qualification,
        skills: user.skills,
        website: user.website,
        email: user.email || "", // optional
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
};



//------------------------==============================================================----------------------------------------------
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios"); // ✅ Replaced OpenAI SDK with axios

// =======================
// POST /api/auth/signup
// =======================
exports.signup = async (req, res) => {
  const { user_id, email, password, qualification, skills } = req.body;

  if (!user_id || !password || !qualification || !skills) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingUser = await User.findOne({ user_id });
  if (existingUser) {
    return res.status(400).json({ message: "User ID already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const prompt = `Generate a short, stylish, professional bio for someone with qualification "${qualification}" and skills "${skills}".`;

  console.log("🟡 Sending prompt to OpenAI:", prompt);
  try {
    const gptRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    console.log("🟢 OpenAI response received:", gptRes.data);

    const bio = gptRes.data.choices[0].message.content;

    const newUser = new User({
      user_id,
      email,
      password: hashedPassword,
      qualification,
      skills,
      bio,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        user_id: savedUser.user_id,
        bio: savedUser.bio,
        qualification: savedUser.qualification,
        skills: savedUser.skills,
      },
    });
  } catch (openaiErr) {
    console.error("❌ OpenAI or signup failure:", openaiErr);
    return res.status(500).json({ message: "Server error during signup (OpenAI)" });
  }
};

// =======================
// POST /api/auth/login
// =======================
exports.login = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res
        .status(400)
        .json({ message: "User ID and password are required" });
    }

    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(400).json({ message: "Invalid User ID or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid User ID or password" });
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
        bio: user.bio,
        qualification: user.qualification,
        skills: user.skills,
        website: user.website,
        email: user.email || "", // optional
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
};
*/



const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const axios = require("axios");

// =======================
// POST /api/auth/signup
// =======================
exports.signup = async (req, res) => {
  const { user_id, email, password, qualification, skills } = req.body;

  if (!user_id || !email || !password || !qualification || !skills) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const existingUser = await User.findOne({ user_id });
    if (existingUser) {
      return res.status(400).json({ message: "User ID already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const prompt = `Generate a short, stylish, professional bio for someone with qualification "${qualification}" and skills "${skills}".`;

    console.log("🟡 Sending prompt to OpenAI:", prompt);
    const gptRes = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const bio = gptRes.data.choices[0].message.content;

    const newUser = new User({
      user_id,
      email,
      password: hashedPassword,
      qualification,
      skills,
      bio,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: savedUser._id,
        user_id: savedUser.user_id,
        bio: savedUser.bio,
        qualification: savedUser.qualification,
        skills: savedUser.skills,
      },
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    return res.status(500).json({ message: "Server error during signup" });
  }
};

// =======================
// POST /api/auth/login
// =======================
exports.login = async (req, res) => {
  try {
    const { user_id, password } = req.body;

    if (!user_id || !password) {
      return res.status(400).json({ message: "User ID and password are required" });
    }

    const user = await User.findOne({ user_id });
    if (!user) {
      return res.status(400).json({ message: "Invalid User ID or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
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
        bio: user.bio,
        qualification: user.qualification,
        skills: user.skills,
        website: user.website || "",
        email: user.email || "",
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ message: "Server error during login" });
  }
};

