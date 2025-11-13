const express = require('express');
const router = express.Router();

// Import các Model cần thiết
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Store = require('../models/Store'); // (Import Store là bắt buộc)

/*
 * @route   GET /api/products
 * @desc    Lấy tất cả SẢN PHẨM GỐC (đã "làm giàu")
 * @access  Public
 *
 * (ĐÂY LÀ LOGIC MỚI ĐỂ SỬA LỖI)
 */
router.get('/', async (req, res) => {
  try {
    // 1. Lấy tất cả SẢN PHẨM GỐC (ví dụ: "Áo Polo", "Áo Sơ Mi")
    const products = await Product.find({}).lean(); // .lean() để lấy object JS thuần túy

    // 2. "Làm giàu" (enrich) từng sản phẩm
    // Chúng ta cần "mượn" giá và ảnh của 1 biến thể con để hiển thị
    const enrichedProducts = await Promise.all(products.map(async (product) => {
      
      // Tìm MỘT biến thể con (inventory) BẤT KỲ của sản phẩm này
      const defaultVariant = await Inventory.findOne({ product: product._id });
      
      return {
        ...product, // Giữ lại thông tin gốc (name, description, _id, category)
        
        // "Mượn" giá và ảnh từ biến thể đầu tiên tìm thấy
        // (Nếu không có biến thể, giá là 0 và ảnh là placeholder)
        price: defaultVariant ? defaultVariant.price : 0,
        imageUrl: defaultVariant ? defaultVariant.imageUrl : 'https://via.placeholder.com/300x300?text=No+Image',
        
        // Quan trọng: _id của object này chính là Product ID
      };
    }));
    
    // 3. Trả về danh sách SẢN PHẨM GỐC đã "làm giàu"
    res.status(200).json(enrichedProducts);

  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm (GET /):', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/*
 * @route   GET /api/products/:id (id ở đây là PRODUCT ID)
 * @desc    Lấy chi tiết một sản phẩm GỐC và TẤT CẢ biến thể của nó
 * @access  Public
 *
 * (LOGIC NÀY ĐÃ ĐÚNG TỪ TRƯỚC)
 */
router.get('/:id', async (req, res) => {
  try {
    // 1. Tìm sản phẩm GỐC bằng ID (Product ID)
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      // (Nếu ID không có trong bảng Product, trả về 404)
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    // 2. Tìm TẤT CẢ các biến thể con (Inventories) của sản phẩm này
    const variants = await Inventory.find({ product: req.params.id })
                            .populate('stock.store'); // Lấy luôn thông tin cửa hàng
    
    // 3. Trả về 1 object chứa cả thông tin gốc VÀ mảng các biến thể
    res.status(200).json({
      product, // Thông tin chung (tên, mô tả)
      variants // Mảng các biến thể (màu, size, giá, tồn kho)
    });
    
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm (GET /:id):', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;