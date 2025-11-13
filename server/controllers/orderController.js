const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

/*
 * @route   POST /api/orders
 * @desc    Tạo một đơn hàng mới từ giỏ hàng
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.body;

    // 1. Lấy user và giỏ hàng (với đầy đủ thông tin sản phẩm)
    const user = await User.findById(userId).populate({
      path: 'cart.inventory',
      populate: { path: 'product' },
    });

    if (!user || user.cart.length === 0) {
      return res.status(400).json({ message: 'Không có sản phẩm nào trong giỏ hàng' });
    }

    // 2. Chuẩn bị "orderItems" và tính "totalPrice"
    // Rất quan trọng: Chúng ta "sao chép" dữ liệu vào orderItems
    // để đơn hàng không bị ảnh hưởng nếu sản phẩm gốc bị sửa/xóa
    let orderItems = [];
    let totalPrice = 0;

    for (const cartItem of user.cart) {
      const inventoryItem = cartItem.inventory;
      const product = inventoryItem.product;
      
      const itemPrice = inventoryItem.price * cartItem.quantity;
      totalPrice += itemPrice;

      orderItems.push({
        name: product.name,
        quantity: cartItem.quantity,
        price: inventoryItem.price,
        imageUrl: inventoryItem.imageUrl,
        inventory: inventoryItem._id,
      });

      // --- (Tùy chọn nâng cao - Sẽ làm sau): Cập nhật tồn kho
      // Ví dụ: inventoryItem.stock.quantity -= cartItem.quantity;
      // await inventoryItem.save();
      // (Hiện tại chúng ta bỏ qua bước này để đơn giản hóa)
    }

    // 3. Tạo đơn hàng mới
    const order = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice,
      // Các trường isPaid, status, v.v. sẽ dùng giá trị default
    });

    // 4. Lưu đơn hàng vào CSDL
    const createdOrder = await order.save();

    // 5. Xóa sạch giỏ hàng của user
    user.cart = [];
    await user.save();

    // 6. Trả về đơn hàng đã tạo
    res.status(201).json(createdOrder);

  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};


module.exports = { createOrder };