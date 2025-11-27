const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');

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

const deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    
    // 1. Tìm và xóa biến thể
    const deletedItem = await Inventory.findByIdAndDelete(inventoryId);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa.' });
    }

    // (Tùy chọn nâng cao: Kiểm tra xem Product gốc còn biến thể nào không, nếu không thì xóa luôn Product gốc)
    const remainingVariants = await Inventory.find({ product: deletedItem.product });
    if (remainingVariants.length === 0) {
        await Product.findByIdAndDelete(deletedItem.product);
    }

    res.status(200).json({ message: 'Đã xóa sản phẩm thành công.' });
  } catch (error) {
    console.error('Lỗi khi xóa sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, gender, mainCategory, subCategory, variants } = req.body;
    
    // 1. Parse danh sách biến thể từ JSON string
    let parsedVariants = [];
    try {
      parsedVariants = JSON.parse(variants);
    } catch (e) {
      return res.status(400).json({ message: 'Dữ liệu biến thể không hợp lệ.' });
    }

    // 2. Cập nhật Sản phẩm Gốc (Product)
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        name,
        description,
        gender,
        category: { main: mainCategory, sub: subCategory },
      },
      { new: true } // Trả về dữ liệu mới sau khi update
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    // 3. Xử lý Biến thể (Inventory)
    // Chiến lược: Xóa hết cũ -> Tạo lại mới (để đảm bảo đồng bộ)
    await Inventory.deleteMany({ product: productId });

    // Tìm cửa hàng (để gán lại tồn kho)
    const firstStore = await Store.findOne();

    // 4. Tạo lại các biến thể
    const inventoryPromises = parsedVariants.map((variant) => {
      // XỬ LÝ ẢNH:
      // - Nếu có file mới upload (req.files có fieldname tương ứng) -> Dùng file mới
      // - Nếu không -> Dùng lại URL cũ (variant.imageUrl) gửi từ frontend lên
      
      let finalImageUrl = variant.imageUrl; // Mặc định dùng URL cũ
      
      // Kiểm tra xem có file mới cho màu này không
      if (req.files && req.files.length > 0) {
        const newImageFile = req.files.find(
          (file) => file.fieldname === `image_${variant.color}`
        );
        if (newImageFile) {
          finalImageUrl = newImageFile.path; // Dùng URL mới từ Cloudinary
        }
      }

      return new Inventory({
        product: productId,
        sku: variant.sku,
        price: Number(variant.price),
        imageUrl: finalImageUrl,
        attributes: {
          color: variant.color,
          size: variant.size,
        },
        stock: [
          {
            store: firstStore._id,
            quantity: Number(variant.quantity)
          }
        ]
      }).save();
    });

    await Promise.all(inventoryPromises);

    res.status(200).json({ message: 'Cập nhật sản phẩm thành công!', product: updatedProduct });

  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    // Lấy tất cả user nhưng TRỪ trường password ra
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách user:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
        return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    // Cập nhật role mới từ body (ví dụ: 'admin' hoặc 'user')
    user.role = req.body.role;
    
    const updatedUser = await user.save();

    res.status(200).json({ 
        message: `Đã cập nhật quyền thành công cho ${updatedUser.name}`, 
        user: {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role
        }
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật quyền:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; // Lấy trạng thái mới (ví dụ: 'Shipping')
    const orderId = req.params.id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
    }

    // Cập nhật trạng thái
    order.status = status;

    // (Tùy chọn: Nếu trạng thái là 'Delivered', cập nhật luôn isPaid = true nếu muốn)
    if (status === 'Delivered') {
        order.isPaid = true;
        order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);

  } catch (error) {
    console.error('Lỗi cập nhật trạng thái:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};


// --- (CẬP NHẬT DÒNG EXPORT) ---
module.exports = {
  getAllOrders,
  getAllProductsAdmin,
  createProduct, // <-- Thêm hàm mới vào
  checkSku, // <-- Thêm hàm checkSku vào
  deleteInventory, // <-- Thêm hàm xóa biến thể vào
  updateProduct,
  getAllUsers,
  updateUserRole,
  updateOrderStatus,
};