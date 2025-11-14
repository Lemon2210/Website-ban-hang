const jwt = require('jsonwebtoken');
const User = require('../models/User');



/*
 * ========================================================
 * VỆ SĨ CẤP 1: protect (Bảo vệ)
 * - Nhiệm vụ: Kiểm tra xem user đã đăng nhập chưa.
 * - Cách dùng: Gắn vào bất kỳ API nào cần đăng nhập (ví dụ: giỏ hàng, đặt hàng).
 * ========================================================
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Kiểm tra xem "vé" (token) có được gửi trong header "Authorization" không
  //    Định dạng chuẩn là: "Bearer [chuỗi_token_dài]"
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 2. Tách lấy chuỗi token (bỏ chữ "Bearer " ở đầu)
      token = req.headers.authorization.split(' ')[1];

      // 3. Giải mã token dùng "chìa khóa bí mật" (JWT_SECRET)
      //    Việc này sẽ trả về payload mà chúng ta đã lưu (chứa 'id' của user)
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Dùng 'id' vừa giải mã để tìm user trong CSDL
      //    Chúng ta "gắn" (attach) thông tin user vào `req` (request)
      //    để các hàm xử lý phía sau (controllers) có thể biết "ai" đang gọi.
      //    '-password' nghĩa là "lấy mọi thứ TRỪ trường password".
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
         return res.status(401).json({ message: 'Không tìm thấy người dùng cho token này' });
      }

      // 5. Nếu mọi thứ OK, cho phép request đi tiếp sang bước tiếp theo (controller)
      next();

    } catch (error) {
      // Lỗi xảy ra nếu token sai, hết hạn, hoặc JWT_SECRET không khớp
      console.error('Lỗi xác thực token:', error.message);
      return res.status(401).json({ message: 'Xác thực thất bại, token không hợp lệ' });
    }
  }

  // 6. Nếu không có header 'Authorization' hoặc không có 'Bearer'
  if (!token) {
    res.status(401).json({ message: 'Không có quyền truy cập, không tìm thấy token' });
  }
};

/*
 * ========================================================
 * VỆ SĨ CẤP 2: admin
 * - Nhiệm vụ: Kiểm tra xem user có phải là Admin không.
 * - Cách dùng: Phải được dùng SAU middleware 'protect'.
 * ========================================================
 */
const admin = (req, res, next) => {
  // Vì 'protect' đã chạy trước, chúng ta tin tưởng 'req.user' đã tồn tại
  if (req.user && req.user.role === 'admin') {
    // Nếu đúng là admin, cho đi tiếp
    next();
  } else {
    // Nếu không, trả về lỗi 403 Forbidden (Cấm)
    // 401 là "Chưa xác thực", 403 là "Đã xác thực nhưng không có quyền"
    res.status(403).json({ message: 'Không có quyền Admin' });
  }
};

// Export cả 2 hàm để các file routes có thể sử dụng
module.exports = { protect, admin };