/**
 * ===============================================
 * File: auth.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    Defines authentication-related routes for the application.
 *
 * Routes:
 *    - POST /api/auth/signup → Registers a new user
 *    - POST /api/auth/login  → Authenticates an existing user
 *
 * Dependencies:
 *    - express: For routing and middleware
 *    - authController: Contains signup and login handler functions
 *
 * Purpose:
 *    Acts as the route-level entry point for authentication
 *    operations and is mounted under `/api/auth` in the main app.
 * ===============================================
 */

// const express = require("express");
// const router = express.Router();
// const { signup, login } = require("../controllers/authController");

// // POST /api/auth/signup
// router.post("/signup", signup);

// // POST /api/auth/login
// router.post("/login", login);

// module.exports = router;

// const express = require("express");
// const router = express.Router();
// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const { Configuration, OpenAIApi } = require("openai");

// const configuration = new Configuration({
//   apiKey: process.env.OPENAI_API_KEY,
// });
// const openai = new OpenAIApi(configuration);

// router.post("/signup", async (req, res) => {
//   const { user_id, email, password, qualification, skills } = req.body;

//   try {
//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Generate stylish bio using GPT
//     const prompt = `Generate a stylish professional bio for someone with qualification "${qualification}" and skills "${skills}".`;

//     const gptRes = await openai.createChatCompletion({
//       model: "gpt-3.5-turbo",
//       messages: [{ role: "user", content: prompt }],
//     });

//     const bio = gptRes.data.choices[0].message.content;

//     const newUser = new User({
//       user_id,
//       email,
//       password: hashedPassword,
//       qualification,
//       skills,
//       bio,
//     });

//     await newUser.save();

//     res.status(201).json({ message: "User created", user: newUser });
//   } catch (err) {
//     console.error("Signup error:", err.message);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

module.exports = router;
