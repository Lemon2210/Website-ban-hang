const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const dotenv = require('dotenv');

dotenv.config(); // Nạp file .env

// Cấu hình Cloudinary bằng file .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cấu hình nơi lưu trữ (storage)
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'shop-thoi-trang', // Tên thư mục trên Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }] // Tự động resize ảnh
  },
});

// Khởi tạo multer
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Chỉ chấp nhận các loại file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('File không hợp lệ! Chỉ chấp nhận file ảnh.'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Giới hạn 10MB
});

module.exports = upload;