/**
 * ===============================================
 * File: authenticate.js
 * Created On: 08-June-2025
 * Created By: Gautam Kumar
 * Description:
 *    This middleware verifies JWT tokens for protected routes.
 *
 *    - Checks for Authorization header with 'Bearer <token>'
 *    - Verifies token using JWT_SECRET from environment
 *    - Attaches decoded user info to `req.user` on success
 *    - Returns 401 response on failure or invalid/missing token
 *
 * Dependencies:
 *    - jsonwebtoken: For verifying JWT tokens
 *
 * Purpose:
 *    Ensures that only authenticated users can access specific
 *    endpoints. Used as middleware in route protection.
 * ===============================================
 */

const jwt = require("jsonwebtoken");

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

module.exports = authenticate;
