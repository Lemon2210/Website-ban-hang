const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Đã import

// --- 1. CẤU HÌNH VÀ KHỞI TẠO ---
dotenv.config();
const app = express();

app.use(express.json());

// --- 2. CẤU HÌNH CORS (PHƯƠNG PHÁP MỚI ĐỂ DEBUG) ---

// (Tạm thời "mở toang" cửa cho mọi domain)
// BẰNG CÁCH GỌI app.use(cors()) MÀ KHÔNG CẦN TÙY CHỌN
app.use(cors());

// *** LƯU Ý BẢO MẬT ***
// Dòng 'app.use(cors())' ở trên cho phép MỌI TÊN MIỀN gọi API của bạn.
// Điều này là TỐT cho việc debug ở localhost,
// nhưng là một RỦI RO BẢO MẬT LỚN khi deploy.
//
// => SAU KHI chúng ta sửa xong, chúng ta SẼ quay lại
//    cấu hình "danh sách khách mời" (allowedOrigins)
//    một cách chính xác.
// --- HẾT CẤU HÌNH CORS ---


// --- 3. KẾT NỐI CƠ SỞ DỮ LIỆU MONGODB ---
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
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Chào mừng đến với API Shop Thời Trang!',
    status: 'success',
  });
});

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