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
  if (!token) {
    console.log("❌ Lỗi: Không nhận được token từ Frontend");
    return false;
  }
  
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  
  // Kiểm tra xem đã đọc được key từ .env chưa
  if (!secretKey) {
    console.log("❌ Lỗi: Server chưa đọc được RECAPTCHA_SECRET_KEY từ file .env");
    return false;
  }

  console.log("... Đang gửi yêu cầu xác thực tới Google...");
  
  const url = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${token}`;

  try {
    const { data } = await axios.post(url);
    
    console.log("✅ Google phản hồi:", data); // <-- QUAN TRỌNG: Xem dòng này in ra gì

    return data.success; 
  } catch (error) {
    console.error("❌ Lỗi kết nối tới Google:", error.message);
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
      if (user.isLocked) {
        return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });
      }
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

const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      if (req.body.password) {
        user.password = req.body.password; // Pre-save hook sẽ tự mã hóa
      }

      const updatedUser = await user.save();

      // Trả về token mới (để cập nhật thông tin ở frontend ngay lập tức)
      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = { registerUser, loginUser, checkEmail , updateUserProfile };