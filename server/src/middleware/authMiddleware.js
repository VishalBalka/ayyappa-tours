const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  // Read from HttpOnly cookie first, fallback to Authorization header
  const token =
    req.cookies?.adminToken ||
    req.headers.authorization?.replace("Bearer ", "");

  if (!token)
    return res.status(401).json({ error: "Authentication required" });

  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    // Clear bad cookie if present
    if (req.cookies?.adminToken) {
      res.clearCookie("adminToken", { httpOnly: true, sameSite: "strict" });
    }
    return res.status(401).json({ error: "Session expired. Please login again." });
  }
};