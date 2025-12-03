const express = require('express');
const router = express.Router();
const { createReview, getProductReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

// URL: POST /api/reviews
router.post('/', protect, createReview);

// URL: GET /api/reviews/:id (id là product id)
router.get('/:id', getProductReviews);

module.exports = router;