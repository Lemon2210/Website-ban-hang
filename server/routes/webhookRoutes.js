const express = require('express');
const router = express.Router();
const { handleWebhook } = require('../controllers/webhookController');

// Dialogflow sẽ gọi đến đường dẫn này
// URL: POST http://[your-server-address]/api/webhook
router.post('/', handleWebhook);

module.exports = router;