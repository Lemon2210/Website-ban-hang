const Review = require('../models/Review');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory'); // Cần để tìm Product gốc từ Inventory

// Tạo đánh giá mới
const createReview = async (req, res) => {
  const { rating, comment, inventoryId, orderId } = req.body;

  try {
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }
    const productId = inventory.product;

    const alreadyReviewed = await Review.findOne({
      user: req.user._id,
      product: productId,
      order: orderId
    });

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    const review = new Review({
      name: req.user.name,
      rating: Number(rating),
      comment,
      user: req.user._id,
      product: productId,
      order: orderId
    });

    await review.save();
    res.status(201).json({ message: 'Đánh giá đã được thêm' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

// 2. Lấy đánh giá của một sản phẩm (PUBLIC)
const getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ product: req.params.id })
            .populate('user', 'name') // <-- QUAN TRỌNG: Lấy tên người dùng để hiển thị
            .sort({ createdAt: -1 }); // Mới nhất lên đầu
            
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
}

module.exports = { createReview, getProductReviews };