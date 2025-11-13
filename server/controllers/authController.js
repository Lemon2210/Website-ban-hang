const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Hàm trợ giúp (giữ nguyên)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Hàm registerUser (giữ nguyên)
const registerUser = async (req, res) => {
  // ... (giữ nguyên code của bạn)
  try {
    const { name, email, password } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    const user = await User.create({ name, email, password });
    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Thông tin người dùng không hợp lệ' });
    }
  } catch (error) {
    console.error('Lỗi đăng ký:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// Hàm loginUser (giữ nguyên)
const loginUser = async (req, res) => {
  // ... (giữ nguyên code của bạn)
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Email hoặc mật khẩu sai' });
    }
  } catch (error) {
    console.error('Lỗi đăng nhập:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// --- (THÊM HÀM MỚI NÀY VÀO) ---
/*
 * @route   POST /api/auth/check-email
 * @desc    Kiểm tra xem email đã tồn tại chưa
 * @access  Public
 */
const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    // Kiểm tra xem có email nào khớp không (không phân biệt hoa/thường)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (user) {
      // Nếu tìm thấy, báo là đã tồn tại
      res.status(200).json({ exists: true });
    } else {
      // Nếu không, báo là an toàn
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
// --- (HẾT HÀM MỚI) ---


// --- (CẬP NHẬT DÒNG NÀY) ---
module.exports = { registerUser, loginUser, checkEmail }; // Thêm checkEmail vào