const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // ✅ trim all inputs
    const trimmedName = name?.trim();
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email: trimmedEmail });
    if (existing) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    const user = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
    });

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ trim inputs
    const trimmedEmail = email?.trim().toLowerCase();
    const trimmedPassword = password?.trim();

    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};