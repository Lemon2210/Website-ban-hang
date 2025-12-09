const dialogflow = require('dialogflow');
const uuid = require('uuid');
const path = require('path');
const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');

// --- CẤU HÌNH DIALOGFLOW ---
// Đường dẫn đến file JSON bạn vừa tải về
const KEY_FILE_PATH = path.join(__dirname, '../dialogflow-key.json'); 
const PROJECT_ID = 'ecommercechatbot-ysae'; // Xem trong file JSON dòng "project_id"

const sessionClient = new dialogflow.SessionsClient({
  keyFilename: KEY_FILE_PATH,
});

// --- HÀM HỖ TRỢ LOGIC CŨ (GIỮ NGUYÊN) ---
const calculateSize = (height, weight) => {
    let size = 'L';
    if (height < 3) height = height * 100; // Đổi m ra cm
    if (height < 160 && weight < 53) size = 'XS';
    else if (height < 165 && weight < 60) size = 'S';
    else if (height < 170 && weight < 65) size = 'M';
    else if (height < 175 && weight < 75) size = 'L';
    else if (height < 180 && weight < 85) size = 'XL';
    else size = 'XXL';
    return size;
};

const findProductInMessage = async (message) => {
    const products = await Product.find({}).select('name');
    const sortedProducts = products.sort((a, b) => b.name.length - a.name.length);
    for (let p of sortedProducts) {
        if (message.toLowerCase().includes(p.name.toLowerCase())) {
            return p;
        }
    }
    return null;
};

// --- HÀM XỬ LÝ CHÍNH ---
const handleChatbotRequest = async (req, res) => {
  try {
    const { message, sessionId = uuid.v4() } = req.body; // Frontend nên gửi kèm sessionId nếu muốn nhớ ngữ cảnh

    // 1. Gửi tin nhắn lên Dialogflow để lấy Intent
    const sessionPath = sessionClient.sessionPath(PROJECT_ID, sessionId);
    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: 'vi-VN', // Tiếng Việt
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;
    
    // Lấy tên Intent và câu trả lời mặc định từ Dialogflow
    const intentName = result.intent.displayName;
    const parameters = result.parameters.fields;
    const defaultBotReply = result.fulfillmentText;
    
    let finalResponse = defaultBotReply; // Mặc định dùng câu trả lời từ Google

    console.log(`🤖 User: ${message} | Intent: ${intentName}`);

    // 2. Xử lý Logic Database dựa trên Intent
    switch (intentName) {
        
      case 'check_stock': // Tên Intent bạn đặt trên Dialogflow
        const productFound = await findProductInMessage(message);
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
            finalResponse = "Bạn muốn kiểm tra sản phẩm nào? Vui lòng nhập đúng tên sản phẩm (Ví dụ: Áo Polo Coolmate).";
        }
        break;

      case 'consult_size': // Tên Intent bạn đặt trên Dialogflow
        // Trích xuất số từ tin nhắn (Logic cũ vẫn hiệu quả)
        const numbers = message.match(/\d+(\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
            let height = parseFloat(numbers[0]);
            let weight = parseFloat(numbers[1]);
            if (height < weight && weight > 100) [height, weight] = [weight, height]; // Swap

            const size = calculateSize(height, weight);
            finalResponse = `AI tính toán: Với ${height}cm, ${weight}kg, bạn mặc size **${size}** là đẹp nhất!`;
        } else {
            finalResponse = "Để mình tính size cho, bạn cho mình xin Chiều cao và Cân nặng nhé?";
        }
        break;

      case 'check_order_status': 
        // Lấy mã đơn hàng mà khách đã nhập (được Dialogflow trích xuất)
        const orderIdInput = parameters.order_id.stringValue; 

        if (orderIdInput) {
            try {
                // Tìm đơn hàng trong DB (Giả sử bạn tìm theo _id hoặc mã code riêng)
                // Lưu ý: Nếu DB dùng _id là ObjectId thì orderIdInput phải đúng format 24 ký tự
                // Hoặc nếu bạn có trường 'orderCode' riêng thì tìm theo nó:
                // const order = await Order.findOne({ orderCode: orderIdInput });
                
                // Ví dụ tìm theo ID (cần try catch vì ID sai format sẽ crash)
                const order = await Order.findById(orderIdInput);

                if (order) {
                    let statusMsg = "";
                    if(order.isDelivered) statusMsg = "đã giao thành công";
                    else if(order.isPaid) statusMsg = "đã thanh toán và đang xử lý";
                    else statusMsg = "đang chờ xử lý";

                    finalResponse = `Đơn hàng **${orderIdInput}** của bạn hiện tại **${statusMsg}**. Tổng tiền: ${order.totalPrice.toLocaleString()}đ.`;
                } else {
                    finalResponse = `Hệ thống không tìm thấy đơn hàng nào có mã **${orderIdInput}**. Bạn kiểm tra lại giúp mình nhé!`;
                }
            } catch (err) {
                finalResponse = "Mã đơn hàng bạn cung cấp không hợp lệ.";
            }
        } else {
            finalResponse = "Bạn vui lòng cung cấp Mã đơn hàng để mình kiểm tra nhé.";
        }
        break;

      default:
        // Nếu không khớp logic nào, giữ nguyên câu trả lời bạn đã soạn sẵn trên Dialogflow
        // Ví dụ: "Chào bạn", "Cảm ơn"...
        break;
    }

    res.json({ reply: finalResponse });

  } catch (error) {
    console.error('Dialogflow Error:', error);
    res.status(500).json({ reply: "Hệ thống đang bảo trì một chút, bạn chờ xíu nhé!" });
  }
};

module.exports = { handleChatbotRequest };