const dialogflow = require('dialogflow');
const uuid = require('uuid');
const path = require('path');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory'); // Đảm bảo đã import model này
const Order = require('../models/Order');
const Coupon = require('../models/Coupon'); // <-- Đảm bảo đường dẫn đúng

// --- CẤU HÌNH DIALOGFLOW ---
const PROJECT_ID = 'ecommercechatbot-ysae'; 

// Cấu hình Credentials
let credentials;
if (process.env.DIALOGFLOW_KEY_JSON) {
    credentials = JSON.parse(process.env.DIALOGFLOW_KEY_JSON);
} else {
    try {
        credentials = require(path.join(__dirname, '../dialogflow-key.json'));
    } catch (e) {
        console.error("Lỗi: Không tìm thấy file key Dialogflow!");
    }
}

const sessionClient = new dialogflow.SessionsClient({
  projectId: PROJECT_ID,
  credentials: credentials,
});

// --- CÁC HÀM HỖ TRỢ ---
const calculateSize = (height, weight) => {
    let size = 'L';
    if (height < 3) height = height * 100;
    if (height < 160 && weight < 53) size = 'XS';
    else if (height < 165 && weight < 60) size = 'S';
    else if (height < 170 && weight < 65) size = 'M';
    else if (height < 175 && weight < 75) size = 'L';
    else if (height < 180 && weight < 85) size = 'XL';
    else size = 'XXL';
    return size;
};

// --- HÀM XỬ LÝ CHÍNH ---
const handleChatbotRequest = async (req, res) => {
  try {
    const { message, sessionId = uuid.v4() } = req.body; 

    const sessionPath = sessionClient.sessionPath(PROJECT_ID, sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: { text: message, languageCode: 'vi-VN' },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    const intentName = result.intent.displayName;
    const parameters = result.parameters.fields;
    const defaultBotReply = result.fulfillmentText;
    
    let finalResponse = defaultBotReply; 
    let recommendedProducts = [];

    // --- XỬ LÝ LOGIC THEO INTENT ---
    switch (intentName) {
        
      case 'check_stock': 
        // Tìm sản phẩm bằng tên (đơn giản hóa)
        const allProds = await Product.find({}).select('name');
        const productFound = allProds.find(p => message.toLowerCase().includes(p.name.toLowerCase()));

        if (productFound) {
            const inventory = await Inventory.find({ product: productFound._id });
            const totalStock = inventory.reduce((acc, item) => 
                acc + item.stock.reduce((sAcc, s) => sAcc + s.quantity, 0), 0
            );
            
            if (totalStock > 0) {
                finalResponse = `Sản phẩm **${productFound.name}** hiện còn **${totalStock}** cái. Bạn đặt ngay kẻo hết nhé!`;
            } else {
                finalResponse = `Tiếc quá, **${productFound.name}** hiện đang tạm hết hàng rồi ạ.`;
            }
        } else {
            finalResponse = "Bạn muốn kiểm tra sản phẩm nào? Vui lòng nhập đúng tên sản phẩm (Ví dụ: Áo Polo).";
        }
        break;

      case 'consult_size': 
        const numbers = message.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
            let height = parseFloat(numbers[0]);
            let weight = parseFloat(numbers[1]);
            if (height < weight && weight > 100) [height, weight] = [weight, height]; 

            const size = calculateSize(height, weight);
            finalResponse = `AI tính toán: Với ${height}cm, ${weight}kg, bạn mặc size **${size}** là đẹp nhất!`;
        } else {
            finalResponse = "Để mình tính size cho, bạn cho mình xin Chiều cao và Cân nặng nhé?";
        }
        break;

      case 'check_order_status':
        const orderIdInput = parameters.order_id ? parameters.order_id.stringValue : '';
        if (orderIdInput) {
            try {
                const order = await Order.findById(orderIdInput);
                if (order) {
                    let statusMsg = order.isDelivered ? "đã giao thành công" : (order.isPaid ? "đã thanh toán" : "đang xử lý");
                    finalResponse = `Đơn hàng **${orderIdInput}** của bạn hiện tại **${statusMsg}**. Tổng tiền: ${order.totalPrice.toLocaleString()}đ.`;
                } else {
                    finalResponse = `Không tìm thấy đơn hàng mã **${orderIdInput}** ạ.`;
                }
            } catch (err) {
                finalResponse = "Mã đơn hàng không hợp lệ.";
            }
        } else {
            finalResponse = "Bạn vui lòng cung cấp Mã đơn hàng để mình kiểm tra nhé.";
        }
        break;

      // --- [CASE SỬA LỖI] GỢI Ý SẢN PHẨM ---
      case 'recommend_product':
        const keyword = parameters.product_type ? parameters.product_type.stringValue : '';
        
        let query = {};
        if (keyword) {
            query = { name: { $regex: keyword, $options: 'i' } };
        }

        // 1. Tìm các sản phẩm trong bảng Product trước
        const rawProducts = await Product.find(query)
                                      .sort({ createdAt: -1 })
                                      .limit(3)
                                      .select('name price image discount _id');

        if (rawProducts.length > 0) {
            finalResponse = `Dạ, shop gửi bạn 3 mẫu ${keyword ? keyword : 'mới nhất'} đang HOT tại shop ạ:`;
            
            // 2. Dùng Promise.all để map và truy vấn Inventory cho TỪNG sản phẩm
            recommendedProducts = await Promise.all(rawProducts.map(async (p) => {
                let displayImage = p.image;
                let displayPrice = p.price;

                // --- LOGIC QUAN TRỌNG: LUÔN TÌM TRONG KHO (INVENTORY) ---
                // Thay vì dựa vào p.price gốc (có thể sai), ta tìm biến thể đại diện trong kho
                // Inventory chứa ảnh và giá thực tế của từng màu
                const inventoryItem = await Inventory.findOne({ product: p._id });
                
                if (inventoryItem) {
                    // Ưu tiên lấy ảnh từ Inventory nếu Product không có hoặc cần ảnh chính xác của biến thể
                    if (!displayImage || displayImage === "") {
                        displayImage = inventoryItem.imageUrl;
                    }
                    // Ưu tiên lấy giá từ Inventory nếu Product giá = 0
                    if (!displayPrice || displayPrice === 0) {
                        displayPrice = inventoryItem.price;
                    }
                }

                // Fallback cuối cùng nếu vẫn không có ảnh
                if (!displayImage) displayImage = 'https://via.placeholder.com/150?text=No+Image';

                return {
                    _id: p._id,
                    name: p.name,
                    discount: p.discount,
                    image: displayImage, 
                    price: displayPrice  
                };
            }));

        } else {
            finalResponse = `Tiếc quá, shop hiện chưa tìm thấy mẫu "${keyword}" nào. Bạn thử tìm từ khóa khác xem sao nhé?`;
        }
        break;

      case 'check_promotion':
        // Tìm 3 sản phẩm có discount > 0
        // Sắp xếp: Giảm giá sâu nhất (discount: -1) lên đầu
        const saleProducts = await Product.find({ discount: { $gt: 0 } })
                                          .sort({ discount: -1, createdAt: -1 })
                                          .limit(3)
                                          .select('name price image discount _id');

        if (saleProducts.length > 0) {
            finalResponse = "Dạ, đây là các sản phẩm đang có KHUYẾN MÃI TỐT NHẤT tại shop ạ. Bạn xem thử nhé:";
            
            // Xử lý hiển thị (Copy logic thông minh từ phần recommend_product xuống)
            recommendedProducts = await Promise.all(saleProducts.map(async (p) => {
                let displayImage = p.image;
                let displayPrice = p.price;

                // Tìm dữ liệu dự phòng trong Inventory nếu Product bị thiếu
                const inventoryItem = await Inventory.findOne({ product: p._id });
                if (inventoryItem) {
                    if (!displayImage || displayImage === "") displayImage = inventoryItem.imageUrl;
                    if (!displayPrice || displayPrice === 0) displayPrice = inventoryItem.price;
                }
                
                if (!displayImage) displayImage = 'https://via.placeholder.com/150?text=Sale';

                return {
                    _id: p._id,
                    name: p.name,
                    discount: p.discount,
                    image: displayImage,
                    price: displayPrice
                };
            }));

        } else {
            finalResponse = "Tiếc quá, hiện tại shop chưa có chương trình khuyến mãi nào. Bạn quay lại sau nhé!";
        }
        break;

      case 'check_coupon':
        try {
            // Tìm 1 mã giảm giá hợp lệ:
            // 1. Hạn sử dụng (expiryDate) phải lớn hơn thời điểm hiện tại (còn hạn)
            // 2. (Tùy chọn) Số lượng (usageLimit) > 0 hoặc chưa bị khóa (isActive: true)
            const activeCoupon = await Coupon.findOne({ 
                expiryDate: { $gt: new Date() }, // Còn hạn
                // isActive: true, // Bỏ comment nếu DB bạn có trường này
            }).sort({ discount: -1 }); // Ưu tiên mã giảm sâu nhất

            if (activeCoupon) {
                // Format lại hạn sử dụng cho đẹp (DD/MM/YYYY)
                const dateStr = new Date(activeCoupon.expiryDate).toLocaleDateString('vi-VN');
                
                finalResponse = `🎁 Tin vui cho bạn! Shop đang có mã **${activeCoupon.code}** giảm **${activeCoupon.discount}%**. Hạn dùng đến ${dateStr}. Bạn nhập mã này ở bước thanh toán nhé!`;
            } else {
                finalResponse = "Tiếc quá, hiện tại shop chưa có mã giảm giá nào công khai. Bạn theo dõi Fanpage để săn mã đợt sau nhé!";
            }
        } catch (err) {
            console.error("Lỗi tìm coupon:", err);
            finalResponse = "Hệ thống đang kiểm tra mã, bạn thử lại sau chút xíu nhé.";
        }
        break;
      // --------------------------------

      default:
        break;
    }

    res.json({ 
        reply: finalResponse,
        products: recommendedProducts 
    });

  } catch (error) {
    console.error('Dialogflow Error:', error);
    res.status(500).json({ reply: "Hệ thống đang bận, bạn thử lại sau nhé!" });
  }
};

module.exports = { handleChatbotRequest };