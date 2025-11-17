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
// ... (Các import và hàm khác giữ nguyên) ...

/*
 * @route   POST /api/admin/products
 * @desc    Tạo sản phẩm Gốc VÀ NHIỀU Biến thể
 * @access  Private/Admin
 */
const createProduct = async (req, res) => {
  try {
    const { name, description, gender, mainCategory, subCategory, variants } = req.body;
    
    // req.files chứa tất cả các file ảnh đã upload (do upload.any() xử lý)
    // Mỗi file sẽ có thuộc tính 'fieldname', ví dụ: 'image_Black', 'image_White'
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng upload ít nhất một ảnh.' });
    }

    let parsedVariants = [];
    try {
      parsedVariants = JSON.parse(variants);
    } catch (e) {
      return res.status(400).json({ message: 'Dữ liệu biến thể không hợp lệ.' });
    }

    // 1. Tạo Sản phẩm Gốc
    const newProduct = new Product({
      name,
      description,
      gender, // <-- LƯU GENDER
      category: {
        main: mainCategory,
        sub: subCategory,
      },
    });
    const savedProduct = await newProduct.save();

    const firstStore = await Store.findOne();
    if (!firstStore) {
       return res.status(400).json({ message: 'Chưa có cửa hàng nào.' });
    }

    // 2. Tạo Biến thể và Gán ảnh theo màu
    const inventoryPromises = parsedVariants.map((variant) => {
      
      // LOGIC MỚI: Tìm ảnh tương ứng với màu của biến thể này
      // Frontend sẽ gửi file với fieldname là: "image_TênMàu" (ví dụ: image_Black)
      const colorImageFile = req.files.find(
        (file) => file.fieldname === `image_${variant.color}`
      );

      // Nếu tìm thấy ảnh riêng cho màu này thì dùng, không thì dùng ảnh đầu tiên làm fallback
      const finalImageUrl = colorImageFile ? colorImageFile.path : req.files[0].path;

      return new Inventory({
        product: savedProduct._id,
        sku: variant.sku,
        price: Number(variant.price),
        imageUrl: finalImageUrl, // <-- URL ảnh đã map theo màu
        attributes: {
          color: variant.color,
          size: variant.size,
        },
        stock: [
          { store: firstStore._id, quantity: Number(variant.quantity) }
        ]
      }).save();
    });

    await Promise.all(inventoryPromises);

    res.status(201).json({ message: 'Tạo sản phẩm thành công!', product: savedProduct });

  } catch (error) {
    console.error('Lỗi khi tạo sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};

const checkSku = async (req, res) => {
  try {
    const { sku } = req.body;
    
    if (!sku) return res.status(200).json({ exists: false });

    // Logic: Kiểm tra xem có bất kỳ Inventory nào có SKU BẮT ĐẦU bằng chuỗi này không
    // Ví dụ: Nếu DB có 'POLO-01-BLK-S', mà user nhập 'POLO-01', nó sẽ báo trùng.
    const exists = await Inventory.findOne({ 
      sku: { $regex: new RegExp(`^${sku}`, 'i') } 
    });

    if (exists) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    console.error('Check SKU error:', error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// ... (module.exports giữ nguyên) ...
// --- (HẾT HÀM MỚI) ---


// --- (CẬP NHẬT DÒNG EXPORT) ---
module.exports = {
  getAllOrders,
  getAllProductsAdmin,
  createProduct, // <-- Thêm hàm mới vào
  checkSku, // <-- Thêm hàm checkSku vào
};