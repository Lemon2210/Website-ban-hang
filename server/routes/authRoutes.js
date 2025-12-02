const express = require('express');
const router = express.Router();
// --- (CẬP NHẬT DÒNG NÀY) ---
const { registerUser, loginUser, checkEmail , updateUserProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// URL: POST /api/auth/register
router.post('/register', registerUser);

// URL: POST /api/auth/login
router.post('/login', loginUser);

// --- (THÊM ROUTE MỚI NÀY VÀO) ---
// URL: POST /api/auth/check-email
router.post('/check-email', checkEmail);

router.put('/profile', protect, updateUserProfile);

module.exports = router;