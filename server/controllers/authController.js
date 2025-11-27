const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios'); // <-- Import axios để gọi Google

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// --- HÀM PHỤ TRỢ ĐỂ KIỂM TRA CAPTCHA ---
const verifyCaptcha = async (token) => {
  if (!token) return false;
  
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const { data } = await axios.post(url);
    return data.success; // Trả về true nếu Google bảo OK
  } catch (error) {
    console.error("Lỗi verify captcha:", error);
    return false;
  }
};
// ---------------------------------------

const registerUser = async (req, res) => {
  try {
    // 1. Lấy captchaToken từ frontend gửi lên
    const { name, email, password, captchaToken } = req.body;

    // 2. Kiểm tra Captcha
    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: 'Xác thực Robot thất bại!' });
    }

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

const loginUser = async (req, res) => {
  try {
    // 1. Lấy captchaToken
    const { email, password, captchaToken } = req.body;

    // 2. Kiểm tra Captcha
    const isHuman = await verifyCaptcha(captchaToken);
    if (!isHuman) {
      return res.status(400).json({ message: 'Vui lòng xác thực bạn không phải là Robot!' });
    }

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

const checkEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (user) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = { registerUser, loginUser, checkEmail };