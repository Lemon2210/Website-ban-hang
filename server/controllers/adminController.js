const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
const Review = require('../models/Review');

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

const createProduct = async (req, res) => {
  console.log("------------------------------------------------");
  console.log("🚀 DEBUG: Bắt đầu tạo sản phẩm");
  
  try {
    // 1. Kiểm tra dữ liệu nhận được
    console.log("📦 Body nhận được:", req.body);
    console.log("📂 Files nhận được:", req.files ? req.files.length + " files" : "Không có file");

    const { name, description, gender, mainCategory, subCategory, variants } = req.body;
    
    if (!req.files || req.files.length === 0) {
      console.log("❌ Lỗi: Không có file ảnh");
      return res.status(400).json({ message: 'Vui lòng upload ít nhất một ảnh.' });
    }

    // 2. Parse Biến thể
    let parsedVariants = [];
    try {
      parsedVariants = JSON.parse(variants);
      console.log("✅ Đã parse variants thành công:", parsedVariants.length, "biến thể");
    } catch (e) {
      console.log("❌ Lỗi parse JSON variants:", e.message);
      return res.status(400).json({ message: 'Dữ liệu biến thể không hợp lệ.' });
    }

    // 3. Tạo Sản phẩm Gốc
    console.log("... Đang tạo Product gốc...");
    const newProduct = new Product({
      name, description, gender,
      category: { main: mainCategory, sub: subCategory },
    });
    const savedProduct = await newProduct.save();
    console.log("✅ Đã tạo Product:", savedProduct._id);

    // 4. Tìm cửa hàng
    const firstStore = await Store.findOne();
    if (!firstStore) {
       console.log("❌ Lỗi: Không tìm thấy Store nào trong DB");
       return res.status(400).json({ message: 'Chưa có cửa hàng nào. Vui lòng chạy seeder.' });
    }

    // 5. Tạo Inventory
    console.log("... Đang tạo Inventory...");
    const inventoryPromises = parsedVariants.map((variant) => {
      // Tìm ảnh
      const colorImageFile = req.files.find(
        (file) => file.fieldname === `image_${variant.color}`
      );
      
      // Nếu không tìm thấy ảnh cho màu này, dùng ảnh đầu tiên làm fallback
      const finalImageUrl = colorImageFile ? colorImageFile.path : req.files[0].path;
      console.log(`   - Biến thể ${variant.color}-${variant.size}: Dùng ảnh ${finalImageUrl ? 'OK' : 'MISSING'}`);

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
    console.log("✅ Đã tạo xong tất cả Inventory!");

    res.status(201).json({ message: 'Tạo sản phẩm thành công!', product: savedProduct });

  } catch (error) {
    // IN RA LỖI CHI TIẾT
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

const toggleUserLock = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User không tồn tại' });
    
    if (user.role === 'admin') {
        return res.status(400).json({ message: 'Không thể khóa tài khoản Admin' });
    }

    user.isLocked = !user.isLocked; // Đảo ngược trạng thái
    await user.save();
    
    res.status(200).json({ message: user.isLocked ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', isLocked: user.isLocked });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getUserHistory = async (req, res) => {
  try {
    // Tìm tất cả đơn hàng mà field 'user' trùng với id gửi lên
    const orders = await Order.find({ user: req.params.id }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server' });
  }
};

const getAllReviews = async (req, res) => {
  try {
    const reviews = await Review.find({})
      .populate('user', 'name email') // Lấy tên và email người đánh giá
      .populate('product', 'name')    // Lấy tên sản phẩm
      .sort({ createdAt: -1 });
    res.status(200).json(reviews);
  } catch (error) {
    console.error('Lỗi lấy reviews:', error);
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

    // 1. Lấy đơn hàng & POPULATE Inventory để lấy SKU
    const orders = await Order.find({
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: 'Cancelled' }
    }).populate({
        path: 'orderItems.inventory',
        select: 'sku' // Chỉ cần lấy trường sku
    });

    const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);
    const totalOrders = orders.length;

    // 2. Tính toán Biểu đồ (Giữ nguyên logic cũ)
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

    // 3. Thống kê Top Sản phẩm (Giữ nguyên logic cũ)
    const productSales = {};
    orders.forEach(order => {
        order.orderItems.forEach(item => {
            if (productSales[item.name]) productSales[item.name] += item.quantity;
            else productSales[item.name] = item.quantity;
        });
    });
    const sortedProducts = Object.keys(productSales).map(name => ({ name, sold: productSales[name] })).sort((a, b) => b.sold - a.sold);
    const bestSellers = sortedProducts.slice(0, 5);
    
    // (Phần Top Rated giữ nguyên)
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

    // 4. CHUẨN BỊ DỮ LIỆU XUẤT EXCEL (MỚI)
    // Tạo danh sách phẳng: Mỗi dòng là 1 sản phẩm trong đơn hàng
    const exportData = [];
    let index = 1;

    orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN');
        order.orderItems.forEach(item => {
            exportData.push({
                tt: index++,
                date: orderDate,
                // Nếu inventory bị xóa thì để N/A, nếu còn thì lấy SKU
                sku: item.inventory ? item.inventory.sku : 'N/A', 
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                total: item.price * item.quantity // Thành tiền = Giá * Số lượng
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
        exportData // <-- Trả về dữ liệu này cho Frontend
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server' });
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
  toggleUserLock,
  getUserHistory,
  getAllReviews,
  deleteReview,
  getDashboardStats
};