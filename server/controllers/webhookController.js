const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Store = require('../models/Store');

/*
 * @route   POST /api/webhook
 * @desc    Endpoint cho Dialogflow gọi để kiểm tra tồn kho
 * @access  Public (Dialogflow không cần token)
 */
const handleWebhook = async (req, res) => {
  try {
    // 1. Lấy thông tin đã được "bóc tách" từ Dialogflow
    // (Tên các tham số này phải khớp với tên bạn đặt trong Dialogflow)
    const { productName, color, size, storeName } = req.body.queryResult.parameters;

    // --- 2. Xây dựng logic truy vấn ---
    // Vì thông tin từ người dùng có thể không đầy đủ (ví dụ: "áo polo", "q1")
    // Chúng ta cần tìm kiếm một cách "mềm" (flexible)

    // 2a. Tìm Store
    // Tìm cửa hàng có tên chứa chuỗi 'storeName' (không phân biệt hoa/thường)
    const store = await Store.findOne({ 
      name: { $regex: new RegExp(storeName, 'i') } 
    });
    
    if (!store) {
      const reply = `Xin lỗi, tôi không tìm thấy cửa hàng nào có tên "${storeName}".`;
      return res.json({ fulfillmentText: reply });
    }

    // 2b. Tìm Product (sản phẩm gốc)
    // Tìm sản phẩm có tên chứa 'productName' VÀ danh mục phụ cũng chứa 'productName'
    const product = await Product.findOne({
      $or: [
        { name: { $regex: new RegExp(productName, 'i') } },
        { 'category.sub': { $regex: new RegExp(productName, 'i') } }
      ]
    });

    if (!product) {
      const reply = `Xin lỗi, tôi không tìm thấy sản phẩm nào có tên "${productName}".`;
      return res.json({ fulfillmentText: reply });
    }

    // 2c. Tìm Biến thể (Inventory)
    // Đây là truy vấn cốt lõi:
    const inventoryItem = await Inventory.findOne({
      product: product._id, // Của sản phẩm gốc đã tìm thấy
      'attributes.color': { $regex: new RegExp(color, 'i') }, // Khớp màu
      'attributes.size': { $regex: new RegExp(size, 'i') },  // Khớp size
      'stock.store': store._id // VÀ có tồn kho tại cửa hàng đã tìm thấy
    }).populate('stock.store'); // Lấy thông tin cửa hàng

    // --- 3. Trả lời ---
    if (!inventoryItem) {
      const reply = `Xin lỗi, sản phẩm ${product.name} màu ${color} size ${size} đã hết hàng tại ${store.name}.`;
      return res.json({ fulfillmentText: reply });
    }

    // 4. Lấy đúng số lượng tồn kho tại cửa hàng đó
    const stockAtStore = inventoryItem.stock.find(
      (s) => s.store._id.toString() === store._id.toString()
    );

    if (stockAtStore && stockAtStore.quantity > 0) {
      const reply = `Tuyệt vời! Sản phẩm ${product.name} (${color} - ${size}) đang còn ${stockAtStore.quantity} cái tại ${store.name} (Địa chỉ: ${store.address}).`;
      return res.json({ fulfillmentText: reply });
    } else {
      const reply = `Rất tiếc, sản phẩm ${product.name} (${color} - ${size}) đã hết hàng tại ${store.name}.`;
      return res.json({ fulfillmentText: reply });
    }

  } catch (error) {
    console.error('Lỗi Webhook:', error.message);
    const reply = 'Đã có lỗi xảy ra với bot, vui lòng thử lại sau.';
    res.status(500).json({ fulfillmentText: reply });
  }
};

module.exports = { handleWebhook };