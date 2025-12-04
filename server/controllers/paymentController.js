const crypto = require('crypto');
const axios = require('axios');
const Order = require('../models/Order');

// 1. Tạo URL thanh toán MoMo (Chế độ Thẻ ATM)
const createVnpayUrl = async (req, res) => {
    try {
        const { orderId, amount } = req.body;
        
        // Config
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;
        const endpoint = process.env.MOMO_ENDPOINT;
        const redirectUrl = process.env.MOMO_RETURN_URL;
        const ipnUrl = process.env.MOMO_IPN_URL || redirectUrl;

        const requestId = orderId;
        const orderInfo = "Thanh toan don hang " + orderId;
        
        // --- CHẾ ĐỘ NHẬP THẺ ATM ---
        const requestType = "payWithATM";
        // ---------------------------
        
        const extraData = ""; // Để rỗng

        // 1. Tạo chuỗi chữ ký (Signature)
        // Thứ tự bắt buộc: accessKey, amount, extraData, ipnUrl, orderId, orderInfo, partnerCode, redirectUrl, requestId, requestType
        const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

        // 2. Ký (HMAC SHA256)
        const signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');

        // 3. Body request
        const requestBody = {
            partnerCode: partnerCode,
            accessKey: accessKey,
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            extraData: extraData,
            requestType: requestType,
            signature: signature,
            lang: 'vi'
        };

        // 4. Gửi sang MoMo
        const response = await axios.post(endpoint, requestBody);
        
        if (response.data.resultCode === 0) {
            res.status(200).json({ url: response.data.payUrl });
        } else {
             console.error("MoMo Error:", response.data);
             res.status(500).json({ message: 'Lỗi MoMo: ' + response.data.message });
        }

    } catch (error) {
        console.error("Lỗi tạo thanh toán MoMo:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// 2. Xử lý kết quả trả về
const vnpayReturn = async (req, res) => {
    try {
        const { resultCode, orderId } = req.query;

        // resultCode = 0 là thành công
        if (resultCode == '0') {
            await Order.findByIdAndUpdate(orderId, { 
                paymentStatus: 'Paid',
                paymentMethod: 'MOMO'
            });
            // Trả về JSON để Frontend xử lý hiển thị
            res.status(200).json({ 
                message: 'Giao dịch thành công', 
                code: '00' 
            });
        } else {
            await Order.findByIdAndUpdate(orderId, { paymentStatus: 'Failed' });
            res.status(200).json({ 
                message: 'Giao dịch thất bại', 
                code: resultCode || '99' 
            });
        }
    } catch (error) {
        console.error("Lỗi xử lý kết quả:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

module.exports = { createVnpayUrl, vnpayReturn };