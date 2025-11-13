const User = require('../models/User');
const Inventory = require('../models/Inventory');

/*
 * @route   POST /api/cart/add
 * @desc    Thêm sản phẩm vào giỏ hàng (hoặc cập nhật số lượng)
 * @access  Private (Cần "vệ sĩ" protect)
 */
const addOrUpdateToCart = async (req, res) => {
  try {
    const { inventoryId, quantity } = req.body;
    // req.user._id được "gắn" vào bởi middleware "protect"
    const userId = req.user._id;

    // 1. Kiểm tra xem biến thể (inventory) có tồn tại không
    const itemExists = await Inventory.findById(inventoryId);
    if (!itemExists) {
      return res.status(404).json({ message: 'Sản phẩm không tồn tại' });
    }

    // 2. Lấy thông tin user (bao gồm giỏ hàng)
    const user = await User.findById(userId);

    // 3. Kiểm tra xem sản phẩm đã có trong giỏ hàng chưa
    const existingCartItemIndex = user.cart.findIndex(
      (item) => item.inventory.toString() === inventoryId
    );

    if (existingCartItemIndex > -1) {
      // 3a. Nếu có rồi -> cập nhật số lượng
      user.cart[existingCartItemIndex].quantity = quantity;
    } else {
      // 3b. Nếu chưa có -> thêm mới vào mảng
      user.cart.push({ inventory: inventoryId, quantity: quantity });
    }

    // 4. Lưu lại user (và giỏ hàng đã cập nhật)
    await user.save();

    // 5. Trả về giỏ hàng mới nhất (với đầy đủ thông tin chi tiết)
    const updatedUser = await User.findById(userId).populate({
      path: 'cart.inventory',
      populate: { path: 'product' }, // Lồng populate để lấy cả thông tin Product
    });

    res.status(200).json(updatedUser.cart);
  } catch (error) {
    console.error('Lỗi khi thêm vào giỏ hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/*
 * @route   GET /api/cart
 * @desc    Lấy giỏ hàng của người dùng
 * @access  Private
 */
const getCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'cart.inventory',
      populate: { path: 'product' }, // Lấy cả thông tin sản phẩm gốc
    });

    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    res.status(200).json(user.cart);
  } catch (error) {
    console.error('Lỗi khi lấy giỏ hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

/*
 * @route   DELETE /api/cart/:id (id ở đây là inventoryId)
 * @desc    Xóa sản phẩm khỏi giỏ hàng
 * @access  Private
 */
const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    // Lấy ID từ URL (ví dụ: /api/cart/ABCXYZ)
    const inventoryIdToRemove = req.params.id; 

    // 1. Lấy user và giỏ hàng
    const user = await User.findById(userId);

    // 2. Lọc ra giỏ hàng mới (loại bỏ sản phẩm cần xóa)
    // Giữ lại tất cả item KHÔNG CÓ inventoryId bằng với cái cần xóa
    user.cart = user.cart.filter(
      (item) => item.inventory.toString() !== inventoryIdToRemove
    );

    // 3. Lưu lại giỏ hàng mới
    await user.save();

    // 4. Trả về giỏ hàng mới nhất (đã populate)
    const updatedUser = await User.findById(userId).populate({
      path: 'cart.inventory',
      populate: { path: 'product' },
    });

    res.status(200).json(updatedUser.cart);
  } catch (error) {
    console.error('Lỗi khi xóa khỏi giỏ hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};


// Đảm bảo export đầy đủ cả 3 hàm
module.exports = { addOrUpdateToCart, getCart, removeFromCart };