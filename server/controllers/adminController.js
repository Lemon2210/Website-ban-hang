const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Store = require('../models/Store'); // <-- THÊM DÒNG NÀY (Rất quan trọng)

/*
 * (Hàm getAllOrders giữ nguyên)
 */
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Lỗi khi Admin lấy đơn hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/*
 * (Hàm getAllProductsAdmin giữ nguyên)
 */
const getAllProductsAdmin = async (req, res) => {
   try {
    const products = await Inventory.find({})
      .populate('product') 
      .populate('stock.store'); 
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi Admin lấy sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// --- (THÊM HÀM MỚI NÀY VÀO) ---
/*
 * @route   POST /api/admin/products
 * @desc    Tạo sản phẩm Gốc VÀ Biến thể đầu tiên
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    // 1. Lấy dữ liệu JSON từ req.body (do Form gửi lên)
    const { 
      name, description, mainCategory, subCategory, // (Product)
      sku, price, color, size, quantity // (Inventory)
    } = req.body;

    // 2. Lấy URL ảnh từ Cloudinary (do 'uploadMiddleware' cung cấp)
    if (!req.file) {
      return res.status(400).json({ message: 'Vui lòng upload ảnh sản phẩm.' });
    }
    const imageUrl = req.file.path; // URL an toàn từ Cloudinary

    // 3. Tạo Sản phẩm Gốc (Product)
    const newProduct = new Product({
      name,
      description,
      category: {
        main: mainCategory,
        sub: subCategory,
      },
    });
    const savedProduct = await newProduct.save();

    // 4. Tạo Biến thể đầu tiên (Inventory)
    // (Tìm một cửa hàng bất kỳ để gán tồn kho)
    const firstStore = await Store.findOne();
    if (!firstStore) {
      return res.status(400).json({ message: 'Không tìm thấy cửa hàng nào để gán tồn kho.' });
    }

    const newInventory = new Inventory({
      product: savedProduct._id, // Liên kết với Product vừa tạo
      sku,
      price: Number(price),
      imageUrl,
      attributes: {
        color,
        size,
      },
      stock: [ // Gán số lượng tồn kho đầu tiên
        {
          store: firstStore._id,
          quantity: Number(quantity)
        }
      ]
    });
    
    await newInventory.save();

    res.status(201).json({ message: 'Tạo sản phẩm thành công!', product: savedProduct });

  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};
// --- (HẾT HÀM MỚI) ---


// --- (CẬP NHẬT DÒNG EXPORT) ---
module.exports = {
  getAllOrders,
  getAllProductsAdmin,
  createProduct, // <-- Thêm hàm mới vào
};