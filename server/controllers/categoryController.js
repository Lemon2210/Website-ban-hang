const Category = require('../models/Category');

// Tạo danh mục
const createCategory = async (req, res) => {
  try {
    const { name, parent } = req.body;
    const category = new Category({ name, parent: parent || null });
    await category.save();
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy tất cả danh mục
const getCategories = async (req, res) => {
  try {
    // Populate để lấy thông tin của parent nếu có
    const categories = await Category.find().populate('parent');
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Xóa danh mục
const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id);
    // Tùy chọn: Xóa luôn các danh mục con của nó nếu cần
    res.json({ message: 'Đã xóa danh mục' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createCategory, getCategories, deleteCategory };