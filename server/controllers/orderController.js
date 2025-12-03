const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');
const Coupon = require('../models/Coupon');
const Review = require('../models/Review');

// 1. Tạo đơn hàng (Giữ nguyên)
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod, couponCode } = req.body;

    const user = await User.findById(userId).populate('cart.inventory');
    if (!user || user.cart.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }

    // Kiểm tra tồn kho
    for (const cartItem of user.cart) {
      const inventoryItem = await Inventory.findById(cartItem.inventory._id);
      if (!inventoryItem || inventoryItem.stock[0].quantity < cartItem.quantity) {
        return res.status(400).json({ message: 'Sản phẩm không đủ hàng.' });
      }
    }

    let orderItems = [];
    let itemsPrice = 0;

    for (const cartItem of user.cart) {
      const inventoryItem = await Inventory.findById(cartItem.inventory._id).populate('product');
      const itemPrice = inventoryItem.price * cartItem.quantity;
      itemsPrice += itemPrice;

      orderItems.push({
        name: inventoryItem.product.name,
        quantity: cartItem.quantity,
        price: inventoryItem.price,
        imageUrl: inventoryItem.imageUrl,
        inventory: inventoryItem._id,
      });

      // Trừ tồn kho
      inventoryItem.stock[0].quantity -= cartItem.quantity;
      await inventoryItem.save();
    }

    const shippingPrice = 30000;
    let discountAmount = 0;

    if (couponCode) {
        const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
        if (coupon && coupon.isActive && new Date() <= new Date(coupon.expirationDate)) {
            if (itemsPrice >= coupon.minOrderValue) {
                if (coupon.type === 'percent') {
                    discountAmount = (itemsPrice * coupon.value) / 100;
                } else {
                    discountAmount = coupon.value;
                }
                if (discountAmount > itemsPrice) discountAmount = itemsPrice;
            }
        }
    }

    const finalTotalPrice = itemsPrice + shippingPrice - discountAmount;

    const order = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      couponCode: couponCode || null,
      discountAmount: discountAmount,
      totalPrice: finalTotalPrice,
    });

    const createdOrder = await order.save();

    user.cart = [];
    await user.save();

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// 2. Lấy danh sách đơn hàng của tôi (Giữ nguyên)
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// --- (HÀM MỚI) 3. Lấy chi tiết 1 đơn hàng ---
const getOrderById = async (req, res) => {
  try {
    // 1. Tìm đơn hàng
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
                             .populate({
                                path: 'orderItems.inventory',
                                populate: { path: 'product' }
                             });

    if (order) {
      // 2. Tìm tất cả đánh giá của user này cho đơn hàng này
      const reviews = await Review.find({ order: order._id, user: req.user._id });

      // 3. Trả về object kết hợp: Đơn hàng + Danh sách đánh giá
      // (Dùng .toObject() để biến document Mongoose thành object JS thường để có thể gán thêm field)
      const orderWithReviews = {
          ...order.toObject(),
          reviews: reviews
      };

      res.json(orderWithReviews);
    } else {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// --- (HÀM MỚI) 4. Hủy đơn hàng ---
const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    // CHỈ CHO PHÉP HỦY NẾU ĐANG Ở TRẠNG THÁI 'Pending'
    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Không thể hủy đơn hàng đã được xử lý hoặc đang giao.' });
    }

    // 1. Hoàn trả lại số lượng tồn kho
    for (const item of order.orderItems) {
      const inventory = await Inventory.findById(item.inventory);
      if (inventory) {
        // Giả sử kho chính là phần tử đầu tiên
        inventory.stock[0].quantity += item.quantity;
        await inventory.save();
      }
    }

    // 2. Cập nhật trạng thái
    order.status = 'Cancelled';
    const updatedOrder = await order.save();

    res.json({ message: 'Đã hủy đơn hàng thành công.', order: updatedOrder });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById, // <-- Export
  cancelOrder   // <-- Export
};