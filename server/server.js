const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Đã import

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
dotenv.config();
const app = express();

app.use(express.json());

// --- 2. CẤU HÌNH CORS (ĐÃ CẬP NHẬT) ---
// Thêm TẤT CẢ các frontend URL vào đây
const allowedOrigins = [
  'http://localhost:3000', // Cho máy local
  'https://dh52200455.site', // Domain chính của bạn (HTTPS)
  'https://www.dh52200455.site', // Domain chính có www
  'https://website-ban-hang-mu.vercel.app' // Domain Vercel (từ log image_09d8a5.png)
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Domain này không được phép truy cập (CORS)'));
    }
  }
}));
// --- HẾT CẤU HÌNH CORS ---


// --- 3. KẾT NỐI CƠ SỞ DỮ LIỆU MONGODB ---
// (Code kết nối MongoDB của bạn giữ nguyên...)
const dbURI = process.env.MONGODB_URI;
if (!dbURI) {
  console.error('❌ LỖI NGHIÊM TRỌNG: MONGODB_URI không được tìm thấy trong file .env');
  process.exit(1);
}
mongoose
  .connect(dbURI)
  .then(() => {
    console.log(`✅ Đã kết nối thành công tới MongoDB!`);
    console.log(`-----------------------------------------------`);
  })
  .catch((err) => {
    console.error('❌ LỖI KẾT NỐI MONGODB:', err.message);
    process.exit(1);
  });


// --- 4. ĐỊNH NGHĨA CÁC TUYẾN ĐƯỜNG API (ROUTES) ---

// (Route gốc để kiểm tra)
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Chào mừng đến với API Shop Thời Trang!',
    status: 'success',
  });
});

// (Import và .use() các routes khác giữ nguyên)
const productRoutes = require('./routes/productRoutes');
const authRoutes = require('./routes/authRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const adminRoutes = require('./routes/adminRoutes');

app.use('/api/products', productRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/admin', adminRoutes);

// --- 5. KHỞI CHẠY SERVER ---
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`-----------------------------------------------`);
  console.log(`🚀 Server đang chạy (listening) trên cổng ${PORT}`);
});