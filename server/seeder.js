const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Nạp các biến môi trường
dotenv.config();

// Import 5 model
const User = require('./models/User');
const Product = require('./models/Product');
const Store = require('./models/Store');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');

// --- 1. DỮ LIỆU MẪU ---
// (Chúng ta sẽ tạo inventory sau khi có ID)

const stores = [
  {
    name: 'Cửa hàng Quận 1',
    address: '123 Nguyễn Huệ, P. Bến Nghé, Quận 1, TP. HCM',
    phone: '02811112222',
  },
  {
    name: 'Cửa hàng Hà Nội',
    address: '88 Tràng Tiền, Hoàn Kiếm, Hà Nội',
    phone: '02488889999',
  },
];

const products = [
  {
    name: 'Áo Polo Basic 2025',
    description: 'Áo polo nam cơ bản, chất liệu cotton 100% thoáng mát.',
    category: {
      main: 'Áo',
      sub: 'Áo Polo',
    },
  },
  {
    name: 'Áo Sơ Mi Oxford Dài Tay',
    description: 'Áo sơ mi nam công sở, dáng slim fit, vải Oxford cao cấp.',
    category: {
      main: 'Áo',
      sub: 'Áo Sơ Mi',
    },
  },
];

const users = [
  {
    name: 'Admin',
    email: 'admin@example.com',
    password: 'password123', // Sẽ được mã hóa tự động bởi model
    role: 'admin',
  },
  {
    name: 'Khách Hàng',
    email: 'customer@example.com',
    password: 'password123', // Sẽ được mã hóa tự động
    role: 'user',
  },
];

// --- 2. HÀM KẾT NỐI VÀ THỰC THI ---

// Hàm kết nối DB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB đã kết nối (từ seeder.js)');
  } catch (error) {
    console.error(`❌ Lỗi kết nối MongoDB (từ seeder.js): ${error.message}`);
    process.exit(1);
  }
};

// Hàm xóa sạch dữ liệu
const destroyData = async () => {
  try {
    // Xóa theo thứ tự
    await Order.deleteMany();
    await Inventory.deleteMany();
    await Store.deleteMany();
    await Product.deleteMany();
    await User.deleteMany();

    console.log('--- DỮ LIỆU ĐÃ ĐƯỢC XÓA SẠCH! ---');
  } catch (error) {
    console.error(`❌ Lỗi khi xóa dữ liệu: ${error.message}`);
    process.exit(1);
  }
};

// Hàm nạp dữ liệu mẫu (quan trọng nhất)
const importData = async () => {
  try {
    // 1. Xóa dữ liệu cũ
    await destroyData();

    // 2. Tạo Stores và lấy ID
    const createdStores = await Store.create(stores);
    const storeQ1_ID = createdStores[0]._id;
    const storeHN_ID = createdStores[1]._id;
    console.log('... Cửa hàng đã được tạo.');

    // 3. Tạo Products và lấy ID
    const createdProducts = await Product.create(products);
    const polo_ID = createdProducts[0]._id;
    const somi_ID = createdProducts[1]._id;
    console.log('... Sản phẩm đã được tạo.');

    // 4. Tạo Users (mật khẩu sẽ tự mã hóa)
    await User.create(users);
    console.log('... Users (Admin, Customer) đã được tạo.');

    // 5. Dùng các ID ở trên để tạo Inventory
    const inventoryItems = [
      // --- Biến thể cho Áo Polo ---
      {
        product: polo_ID,
        sku: 'POLO-WHT-S',
        price: 350000,
        attributes: { color: 'Trắng', size: 'S' },
        imageUrl: 'https://placehold.co/600x600/FFFFFF/000000?text=Polo+Trang+S',
        stock: [
          { store: storeQ1_ID, quantity: 50 },
          { store: storeHN_ID, quantity: 30 },
        ],
      },
      {
        product: polo_ID,
        sku: 'POLO-WHT-M',
        price: 350000,
        attributes: { color: 'Trắng', size: 'M' },
        imageUrl: 'https://placehold.co/600x600/FFFFFF/000000?text=Polo+Trang+M',
        stock: [
          { store: storeQ1_ID, quantity: 40 },
          { store: storeHN_ID, quantity: 0 }, // Hết hàng ở HN
        ],
      },
      {
        product: polo_ID,
        sku: 'POLO-BLK-M',
        price: 350000,
        attributes: { color: 'Đen', size: 'M' },
        imageUrl: 'https://placehold.co/600x600/000000/FFFFFF?text=Polo+Den+M',
        stock: [
          { store: storeQ1_ID, quantity: 10 },
          { store: storeHN_ID, quantity: 20 },
        ],
      },
      // --- Biến thể cho Áo Sơ Mi ---
      {
        product: somi_ID,
        sku: 'SOMI-BLU-L',
        price: 550000,
        attributes: { color: 'Xanh nhạt', size: 'L' },
        imageUrl: 'https://placehold.co/600x600/ADD8E6/000000?text=Somi+Xanh+L',
        stock: [
          { store: storeQ1_ID, quantity: 15 },
          { store: storeHN_ID, quantity: 15 },
        ],
      },
    ];

    await Inventory.create(inventoryItems);
    console.log('... Tồn kho (Inventory) đã được tạo.');

    console.log('========================================');
    console.log('✅ NẠP DỮ LIỆU MẪU THÀNH CÔNG!');
    console.log('========================================');
    process.exit(); // Thoát khỏi script
  } catch (error) {
    console.error(`❌ Lỗi khi nạp dữ liệu: ${error.message}`);
    process.exit(1);
  }
};

// --- 3. LOGIC CHẠY SCRIPT ---
// Kết nối CSDL
connectDB().then(() => {
  // Kiểm tra cờ (flag) từ dòng lệnh
  if (process.argv[2] === '-d') {
    // Nếu là 'node seeder.js -d'
    // (hoặc 'npm run data:destroy')
    destroyData().then(() => process.exit());
  } else {
    // Nếu là 'node seeder.js'
    // (hoặc 'npm run data:import')
    importData();
  }
});
