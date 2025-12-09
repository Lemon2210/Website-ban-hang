const express = require('express');
const router = express.Router();
const { handleChatbotRequest } = require('../controllers/webhookController');

// Route này sẽ được gọi từ Frontend (ChatbotWidget.js)
router.post('/chat', handleChatbotRequest); 

module.exports = router;