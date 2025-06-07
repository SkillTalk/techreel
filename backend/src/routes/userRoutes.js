/**
 * ===============================================
 * File: profile.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    Defines protected user profile-related route(s).
 *
 * Routes:
 *    - GET /api/profile → Returns authenticated user details
 *
 * Middleware:
 *    - authenticate: Verifies JWT token and attaches user info to request
 *
 * Purpose:
 *    Provides a secured endpoint that can only be accessed by
 *    authenticated users. Useful for testing auth flow and building
 *    user-specific dashboard views or profile pages.
 * ===============================================
 */

const express = require("express");
const router = express.Router();
const authenticate = require("../middlewares/authMiddleware");

router.get("/profile", authenticate, (req, res) => {
  res.json({
    message: "Protected route accessed",
    user: req.user,
  });
});

module.exports = router;
