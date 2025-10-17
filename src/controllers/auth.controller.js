const User = require("../models/User");
const GuestSession = require("../models/GuestSession");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();

// Register
exports.register = async (req, res) => {
  const { username, fullName, email, phone, password, region } = req.body;
  if (!username || !fullName || !email || !phone || !password)
    return res
      .status(400)
      .json({
        error:
          "All required fields: username, fullName, email, phone, password",
      });

  // Check uniqueness for username, email, phone
  const existingUsername = await User.findOne({ username });
  if (existingUsername)
    return res.status(409).json({ error: "Username already registered" });
  const existingEmail = await User.findOne({ email });
  if (existingEmail)
    return res.status(409).json({ error: "Email already registered" });
  const existingPhone = await User.findOne({ phone });
  if (existingPhone)
    return res.status(409).json({ error: "Phone number already registered" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    username,
    fullName,
    email,
    phone,
    password: hashed,
    region,
    isVerified: true,
    role: "citizen",
  });

  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      region: user.region,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
};

// Login
exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: "Username and password required" });

  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      region: user.region,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    },
  });
};

// Guest Login
exports.guestLogin = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "Name is required" });

  const guest = await GuestSession.create({ name });
  const token = jwt.sign(
    { id: guest._id, role: "guest" },
    process.env.JWT_SECRET,
    { expiresIn: "2d" }
  );
  return res.json({
    token,
    user: {
      id: guest._id,
      name: guest.name,
      isVerified: false,
      role: "guest",
    },
  });
};

// Me (get current authenticated user)
exports.me = async (req, res) => {
  // req.user is set by auth.middleware.js
  // For registered users, fetch from User model; for guests, fetch from GuestSession
  try {
    if (req.user.role === 'citizen' || req.user.role === 'admin') {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({
        user: {
          id: user._id,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          region: user.region,
          address: user.address,
          avatar: user.avatar,
          role: user.role,
          isVerified: user.isVerified,
          createdAt: user.createdAt,
        }
      });
    } else if (req.user.role === 'guest') {
      const guest = await GuestSession.findById(req.user.id);
      if (!guest) return res.status(404).json({ error: 'Guest session not found' });
      return res.json({
        user: {
          id: guest._id,
          name: guest.name,
          isVerified: false,
          role: 'guest',
          createdAt: guest.createdAt,
        }
      });
    } else {
      return res.status(400).json({ error: 'Unknown user role' });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Logout
exports.logout = (req, res) => {
  return res.json({ message: "Logged out successfully" });
};
