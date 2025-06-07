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

const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");

// POST /api/auth/signup
router.post("/signup", signup);

// POST /api/auth/login
router.post("/login", login);

module.exports = router;
