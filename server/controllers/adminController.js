const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const Review = require('../models/Review');

const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user', 'id name email');
    res.status(200).json(orders);
  } catch (error) {
    console.error('Lỗi khi Admin lấy đơn hàng:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getAllProductsAdmin = async (req, res) => {
   try {
    const products = await Inventory.find({})
      .populate({
          path: 'product',
          // Populate lồng nhau để lấy tên danh mục từ ID
          populate: [
              { path: 'category', select: 'name' },     // Lấy tên cấp 1
              { path: 'subCategory', select: 'name' },  // Lấy tên cấp 2
              { path: 'brand', select: 'name' }         // Lấy tên cấp 3
          ]
      }) 
      .populate('stock.store'); 
    res.status(200).json(products);
  } catch (error) {
    console.error('Lỗi khi Admin lấy sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

// --- HÀM TẠO SẢN PHẨM (ĐÃ SỬA) ---
const createProduct = async (req, res) => {
  console.log("------------------------------------------------");
  console.log("🚀 DEBUG: Bắt đầu tạo sản phẩm");
  
  try {
    // 1. Kiểm tra dữ liệu nhận được
    // Nhận category (cấp 1), subCategory (cấp 2), brand (cấp 3)
    const { name, description, gender, category, subCategory, brand, variants } = req.body;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'Vui lòng upload ít nhất một ảnh.' });
    }

    // 2. Parse Biến thể
    let parsedVariants = [];
    try {
      parsedVariants = JSON.parse(variants);
    } catch (e) {
      return res.status(400).json({ message: 'Dữ liệu biến thể không hợp lệ.' });
    }

    // 3. Tạo Sản phẩm Gốc
    console.log("... Đang tạo Product gốc...");
    const newProduct = new Product({
      user: req.user._id, // Người tạo là Admin đang đăng nhập
      name, 
      description, 
      gender,
      // --- SỬA ĐỔI QUAN TRỌNG: GÁN ID TRỰC TIẾP ---
      category,       // Cấp 1 (Bắt buộc)
      subCategory: subCategory || null, // Cấp 2 (Tùy chọn)
      brand: brand || null,             // Cấp 3 (Tùy chọn)
      // -------------------------------------------
      // Lưu luôn biến thể vào Product để hiển thị ở trang chi tiết (theo Schema mới)
      variants: parsedVariants.map(v => ({
          sku: v.sku,
          price: Number(v.price),
          quantity: Number(v.quantity), // Tổng kho tạm tính
          attributes: { color: v.color, size: v.size },
          // Ảnh sẽ được cập nhật ở bước sau khi có Inventory hoặc gán tạm
          imageUrl: '' 
      }))
    });
    
    // Gán giá cơ bản từ biến thể đầu tiên
    if (parsedVariants.length > 0) {
        newProduct.price = Number(parsedVariants[0].price);
    }

    const savedProduct = await newProduct.save();
    console.log("✅ Đã tạo Product:", savedProduct._id);

    // 4. Tìm cửa hàng
    const firstStore = await Store.findOne();
    if (!firstStore) {
       return res.status(400).json({ message: 'Chưa có cửa hàng nào. Vui lòng chạy seeder.' });
    }

    // 5. Tạo Inventory (Quản lý tồn kho chi tiết)
    console.log("... Đang tạo Inventory...");
    const inventoryPromises = parsedVariants.map((variant, index) => {
      // Tìm ảnh
      const colorImageFile = req.files.find(
        (file) => file.fieldname === `image_${variant.color}`
      );
      
      const finalImageUrl = colorImageFile ? colorImageFile.path : req.files[0].path;

      // Cập nhật lại URL ảnh vào mảng variants trong Product gốc
      savedProduct.variants[index].imageUrl = finalImageUrl;

      return new Inventory({
        product: savedProduct._id,
        sku: variant.sku,
        price: Number(variant.price),
        imageUrl: finalImageUrl,
        attributes: { color: variant.color, size: variant.size },
        stock: [{ store: firstStore._id, quantity: Number(variant.quantity) }]
      }).save();
    });

    await Promise.all(inventoryPromises);
    
    // Lưu lại Product gốc lần nữa để cập nhật ảnh
    savedProduct.image = req.files[0].path; // Ảnh đại diện chính
    await savedProduct.save();

    console.log("✅ Đã tạo xong tất cả Inventory!");

    res.status(201).json({ message: 'Tạo sản phẩm thành công!', product: savedProduct });

  } catch (error) {
    console.error("❌ LỖI SERVER CHI TIẾT:", error);
    res.status(500).json({ 
        message: 'Lỗi máy chủ: ' + (error.message || JSON.stringify(error)) 
    });
  }
};

const checkSku = async (req, res) => {
  try {
    const { sku } = req.body;
    if (!sku) return res.status(200).json({ exists: false });
    const exists = await Inventory.findOne({ 
      sku: { $regex: new RegExp(`^${sku}`, 'i') } 
    });
    if (exists) {
      res.status(200).json({ exists: true });
    } else {
      res.status(200).json({ exists: false });
    }
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const deletedItem = await Inventory.findByIdAndDelete(inventoryId);

    if (!deletedItem) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để xóa.' });
    }

    const remainingVariants = await Inventory.find({ product: deletedItem.product });
    if (remainingVariants.length === 0) {
        await Product.findByIdAndDelete(deletedItem.product);
    }

    res.status(200).json({ message: 'Đã xóa sản phẩm thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};

// --- HÀM CẬP NHẬT SẢN PHẨM (ĐÃ SỬA) ---
// --- 2. HÀM CẬP NHẬT SẢN PHẨM (ĐÃ FIX LỖI USER REQUIRED) ---
const updateProduct = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, gender, category, subCategory, brand, variants } = req.body;
    
    // 1. Parse danh sách biến thể
    let parsedVariants = [];
    try {
      parsedVariants = JSON.parse(variants);
    } catch (e) {
      return res.status(400).json({ message: 'Dữ liệu biến thể không hợp lệ.' });
    }

    // 2. Tìm Sản phẩm Gốc
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    // --- CẬP NHẬT THÔNG TIN ---
    product.name = name;
    product.description = description;
    product.gender = gender;
    
    // Cập nhật danh mục 3 cấp
    if (category) product.category = category;
    if (subCategory !== undefined) product.subCategory = subCategory || null;
    if (brand !== undefined) product.brand = brand || null;

    // --- [QUAN TRỌNG] FIX LỖI "Path `user` is required" ---
    // Nếu sản phẩm cũ bị thiếu trường user, gán luôn cho Admin đang thực hiện sửa đổi
    if (!product.user) {
        product.user = req.user._id;
    }
    // -----------------------------------------------------

    // 3. Xử lý Biến thể (Inventory)
    // Xóa hết cũ -> Tạo lại mới để đồng bộ
    await Inventory.deleteMany({ product: productId });
    const firstStore = await Store.findOne();

    const inventoryPromises = parsedVariants.map((variant) => {
      let finalImageUrl = variant.imageUrl; 
      
      // Kiểm tra xem có file ảnh mới upload lên không
      if (req.files && req.files.length > 0) {
        const newImageFile = req.files.find(
          (file) => file.fieldname === `image_${variant.color}`
        );
        if (newImageFile) {
          finalImageUrl = newImageFile.path; 
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
    
    // Lưu lại Product (Lúc này validate user sẽ pass vì ta đã gán ở trên)
    await product.save();

    res.status(200).json({ message: 'Cập nhật sản phẩm thành công!', product });

  } catch (error) {
    console.error('Lỗi khi cập nhật sản phẩm:', error.message);
    res.status(500).json({ message: 'Lỗi máy chủ: ' + error.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'Người dùng không tồn tại' });

    user.role = req.body.role;
    const updatedUser = await user.save();

    res.status(200).json({ 
        message: `Đã cập nhật quyền thành công cho ${updatedUser.name}`, 
        user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body; 
    const orderId = req.params.id;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: 'Đơn hàng không tồn tại' });

    order.status = status;
    if (status === 'Delivered') {
        order.isPaid = true;
        order.paidAt = Date.now();
    }

    const updatedOrder = await order.save();
    res.status(200).json(updatedOrder);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const toggleUserLock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });
    if (user.role === 'admin') return res.status(400).json({ message: 'Không thể khóa tài khoản Admin' });

    user.isLocked = !user.isLocked; 
    await user.save();
    res.status(200).json({ message: user.isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', isLocked: user.isLocked });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getUserHistory = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name email') 
      .populate('product', 'name')    
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Đã xóa đánh giá' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ' });
  }
};

const getDashboardStats = async (req, res) => {
  try {
    const { type, date } = req.query; 
    let startDate, endDate;
    const selectedDate = new Date(date || Date.now());
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth(); 

    if (type === 'year') {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31, 23, 59, 59);
    } else {
        startDate = new Date(year, month, 1);
        endDate = new Date(year, month + 1, 0, 23, 59, 59);
    }

    const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'Cancelled' }
    }).populate({
        path: 'orderItems.inventory',
        select: 'sku'
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    const totalOrders = orders.length;

    let revenueChartData = [];
    if (type === 'year') {
        const monthlyData = Array(12).fill(0);
        orders.forEach(order => monthlyData[new Date(order.createdAt).getMonth()] += order.totalPrice);
        revenueChartData = monthlyData.map((rev, i) => ({ name: `Tháng ${i + 1}`, revenue: rev }));
    } else {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const dailyData = Array(daysInMonth).fill(0);
        orders.forEach(order => dailyData[new Date(order.createdAt).getDate() - 1] += order.totalPrice);
        revenueChartData = dailyData.map((rev, i) => ({ name: `${i + 1}`, revenue: rev }));
    }

    const productSales = {};
    orders.forEach(order => {
        order.orderItems.forEach(item => {
            if (productSales[item.name]) productSales[item.name] += item.quantity;
            else productSales[item.name] = item.quantity;
        });
    });
    const sortedProducts = Object.keys(productSales).map(name => ({ name, sold: productSales[name] })).sort((a, b) => b.sold - a.sold);
    const bestSellers = sortedProducts.slice(0, 5);
    
    const reviews = await Review.find({}).populate('product', 'name');
    const productRatings = {};
    reviews.forEach(review => {
        const prodName = review.product?.name || 'Unknown';
        if (!productRatings[prodName]) productRatings[prodName] = { total: 0, count: 0 };
        productRatings[prodName].total += review.rating;
        productRatings[prodName].count += 1;
    });
    const ratedProducts = Object.keys(productRatings).map(name => ({
        name, rating: (productRatings[name].total / productRatings[name].count).toFixed(1), count: productRatings[name].count
    })).sort((a, b) => b.rating - a.rating);

    const exportData = [];
    let index = 1;
    orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
        order.orderItems.forEach(item => {
            exportData.push({
                tt: index++,
                date: orderDate,
                sku: item.inventory ? item.inventory.sku : 'N/A', 
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity 
            });
        });
    });

    res.status(200).json({
        period: type === 'year' ? `Năm ${year}` : `Tháng ${month + 1}/${year}`,
        totalRevenue,
        totalOrders,
        revenueChartData,
        bestSellers,
        topRated: ratedProducts.slice(0, 5),
        lowRated: ratedProducts.slice(-5).reverse(),
        exportData 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
  }
};

module.exports = {
  getAllOrders,
  getAllProductsAdmin,
  createProduct, 
  checkSku, 
  deleteInventory, 
  updateProduct,
  getAllUsers,
  updateUserRole,
  updateOrderStatus,
  toggleUserLock,
  getUserHistory,
  getAllReviews,
  deleteReview,
  getDashboardStats
};