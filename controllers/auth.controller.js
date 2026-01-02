const bcrypt = require("bcrypt");
const users = require("../data/users");
const generateToken = require("../utils/generateToken");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // 2️⃣ Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // 4️⃣ Generate JWT
    const token = generateToken(user);

    // 5️⃣ Success response
    return res.status(200).json({
      success: true,
      message: "Login successful",
      token
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
