const express = require("express");
const loginRateLimiter = require("../middlewares/loginRateLimiter");
const { login } = require("../controllers/auth.controller");

const router = express.Router();

// POST /api/auth/login
router.post("/login", loginRateLimiter, login);

module.exports = router;
