const Order = require('../models/Order');
const User = require('../models/User');
const Inventory = require('../models/Inventory');

/*
 * @route   POST /api/orders
 * @desc    Tạo một đơn hàng mới và TRỪ TỒN KHO
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const userId = req.user._id;
    const { shippingAddress, paymentMethod } = req.body;

    // 1. Lấy user và giỏ hàng
    const user = await User.findById(userId).populate({
      path: 'cart.inventory',
      populate: { path: 'product' },
    });

    if (!user || user.cart.length === 0) {
      return res.status(400).json({ message: 'Không có sản phẩm nào trong giỏ hàng' });
    }

    // --- BƯỚC MỚI: KIỂM TRA TỒN KHO TRƯỚC ---
    // (Chúng ta phải đảm bảo TẤT CẢ sản phẩm đều còn hàng trước khi trừ bất cứ cái nào)
    for (const cartItem of user.cart) {
      const inventoryItem = await Inventory.findById(cartItem.inventory._id);

      if (!inventoryItem) {
        return res.status(404).json({ message: 'Sản phẩm không tồn tại trong kho.' });
      }

      // Giả sử chúng ta lấy hàng từ kho đầu tiên (store[0])
      // Trong thực tế bạn có thể chọn kho gần nhất
      const currentStock = inventoryItem.stock[0].quantity;

      if (currentStock < cartItem.quantity) {
        return res.status(400).json({ 
          message: `Sản phẩm "${inventoryItem.product.name}" (${inventoryItem.attributes.color}-${inventoryItem.attributes.size}) không đủ hàng. Chỉ còn ${currentStock}.` 
        });
      }
    }
    // ----------------------------------------


    // 2. Chuẩn bị orderItems và TRỪ TỒN KHO
    let orderItems = [];
    let totalPrice = 0;

    for (const cartItem of user.cart) {
      const inventoryItem = await Inventory.findById(cartItem.inventory._id).populate('product');
      
      // Tính tiền
      const itemPrice = inventoryItem.price * cartItem.quantity;
      totalPrice += itemPrice;

      // Tạo item cho đơn hàng
      orderItems.push({
        name: inventoryItem.product.name,
        quantity: cartItem.quantity,
        price: inventoryItem.price,
        imageUrl: inventoryItem.imageUrl,
        inventory: inventoryItem._id,
      });

      // --- BƯỚC MỚI: TRỪ TỒN KHO ---
      inventoryItem.stock[0].quantity -= cartItem.quantity;
      await inventoryItem.save(); // Lưu lại số lượng mới vào CSDL
      // -----------------------------
    }

    // 3. Tạo đơn hàng mới
    const order = new Order({
      user: userId,
      orderItems,
      shippingAddress,
      paymentMethod,
      totalPrice: totalPrice + 30000, // Cộng phí ship cứng 30k (hoặc lấy từ frontend)
    });

    // 4. Lưu đơn hàng
    const createdOrder = await order.save();

    // 5. Xóa sạch giỏ hàng của user
    user.cart = [];
    await user.save();

    // 6. Trả về kết quả
    res.status(201).json(createdOrder);

  } catch (error) {
    console.error('Lỗi khi tạo đơn hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};


module.exports = { createOrder };