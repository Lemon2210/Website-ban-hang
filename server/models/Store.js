// server/models/Store.js
const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    name: {
      // Ví dụ: "Cửa hàng Quận 1" hoặc "Chi nhánh Hà Nội"
      type: String,
      required: [true, 'Tên cửa hàng không được để trống'],
      trim: true,
    },
    address: {
      // Ví dụ: "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. HCM"
      type: String,
      required: [true, 'Địa chỉ không được để trống'],
      trim: true,
    },
    phone: {
      // Số điện thoại liên hệ của cửa hàng
      type: String,
      trim: true,
    },
    // Chúng ta cũng có thể thêm tọa độ (lat, lng) sau này nếu muốn tích hợp bản đồ
    // location: {
    //   type: { type: String, enum: ['Point'], default: 'Point' },
    //   coordinates: { type: [Number], index: '2dsphere' } // [kinh độ, vĩ độ]
    // }
  },
  {
    timestamps: true,
  }
);

const Store = mongoose.model('Store', storeSchema);

module.exports = Store;