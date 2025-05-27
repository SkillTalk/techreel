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
