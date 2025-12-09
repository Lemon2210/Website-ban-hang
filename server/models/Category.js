const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  // parent chứa ID của danh mục cha. Nếu null -> Là danh mục chính
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    default: null,
  },
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);