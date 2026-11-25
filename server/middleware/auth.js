const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User");
dotenv.config();

exports.auth = async (req, res, next) => {
  try {
    const token =
      (req.cookies && req.cookies.token) ||
      (req.body && req.body.token) ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ success: false, message: `Token Missing` });
    }

    try {
      const decode = await jwt.verify(token, process.env.JWT_SECRET);  // ← fixed
      req.user = decode;
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          code: "SESSION_EXPIRED",
          message: "Your session expired. Please log in again.",
        });
      }
      return res.status(401).json({ success: false, message: "token is invalid" });
    }

    // Single-device login: the token's session id must be the user's current one
    const account = await User.findById(req.user.id).select(
      "activeSessionId"
    );
    if (!account) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (account.activeSessionId && account.activeSessionId !== req.user.sid) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REPLACED",
        message: "You were logged out because your account was used on another device.",
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `Something Went Wrong While Validating the Token`,
    });
  }
};

exports.isStudent = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ email: req.user.email });
    if (!userDetails) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (userDetails.accountType !== "Student") {
      return res.status(401).json({ success: false, message: "This is a Protected Route for Students" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: `User Role Can't be Verified` });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ email: req.user.email });
    if (!userDetails) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (userDetails.accountType !== "Admin") {
      return res.status(401).json({ success: false, message: "This is a Protected Route for Admin" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: `User Role Can't be Verified` });
  }
};

exports.isInstructor = async (req, res, next) => {
  try {
    const userDetails = await User.findOne({ email: req.user.email });
    if (!userDetails) {
      return res.status(401).json({ success: false, message: "User not found" });
    }
    if (userDetails.accountType !== "Instructor") {
      return res.status(401).json({ success: false, message: "This is a Protected Route for Instructor" });
    }
    next();
  } catch (error) {
    return res.status(500).json({ success: false, message: `User Role Can't be Verified` });
  }
};