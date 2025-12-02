const Coupon = require('../models/Coupon');

// 1. Tạo mã giảm giá (Admin)
const createCoupon = async (req, res) => {
  try {
    const newCoupon = new Coupon(req.body);
    const savedCoupon = await newCoupon.save();
    res.status(201).json(savedCoupon);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Lấy tất cả mã (Admin)
const getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.status(200).json(coupons);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Xóa mã (Admin)
const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã xóa mã giảm giá.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Kiểm tra mã giảm giá (Customer - Public/Protected)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderTotal } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    // Các bước kiểm tra logic
    if (!coupon) {
      return res.status(404).json({ message: 'Mã giảm giá không tồn tại.' });
    }
    if (!coupon.isActive) {
      return res.status(400).json({ message: 'Mã này đang tạm khóa.' });
    }
    if (new Date() > new Date(coupon.expirationDate)) {
      return res.status(400).json({ message: 'Mã này đã hết hạn.' });
    }
    if (orderTotal < coupon.minOrderValue) {
      return res.status(400).json({ 
        message: `Đơn hàng phải từ ${coupon.minOrderValue.toLocaleString('vi-VN')}₫ để dùng mã này.` 
      });
    }

    // Tính toán số tiền giảm
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = (orderTotal * coupon.value) / 100;
    } else {
      discountAmount = coupon.value;
    }

    // Đảm bảo không giảm quá giá trị đơn hàng
    if (discountAmount > orderTotal) discountAmount = orderTotal;

    res.status(200).json({
      success: true,
      couponCode: coupon.code,
      discountAmount: discountAmount,
      message: 'Áp dụng mã thành công!'
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCoupon, getAllCoupons, deleteCoupon, validateCoupon };