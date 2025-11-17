const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Store = require('../models/Store'); 

/*
 * @route   GET /api/products
 * @desc    Lấy sản phẩm (Có hỗ trợ lọc ?gender=...)
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { gender } = req.query; // Lấy tham số ?gender=... từ URL

    // 1. Tạo bộ lọc
    let filter = {};
    if (gender) {
      // Nếu lọc theo Men/Women/Kids, luôn lấy thêm cả Unisex
      filter.gender = { $in: [gender, 'Unisex'] };
    }
    

    // 2. Tìm sản phẩm theo bộ lọc
    const products = await Product.find(filter).lean(); 

    // 3. "Làm giàu" thông tin (Lấy ảnh/giá từ biến thể)
    const enrichedProducts = await Promise.all(products.map(async (product) => {
      const defaultVariant = await Inventory.findOne({ product: product._id });
      
      return {
        ...product,
        price: defaultVariant ? defaultVariant.price : 0,
        imageUrl: defaultVariant ? defaultVariant.imageUrl : 'https://via.placeholder.com/300x300?text=No+Image',
      };
    }));
    
    res.status(200).json(enrichedProducts);

  } catch (error) {
    console.error('Lỗi khi lấy sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

/*
 * @route   GET /api/products/:id 
 * (Giữ nguyên logic cũ)
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    const variants = await Inventory.find({ product: req.params.id }).populate('stock.store'); 
    res.status(200).json({ product, variants });
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
});

module.exports = router;