import React from 'react';
import { Card, Button } from 'react-bootstrap';
// Import Link để click vào thẻ sẽ chuyển trang
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  // BÂY GIỜ: `product` chính là SẢN PHẨM GỐC đã được "làm giàu"
  // Nó có cấu trúc: { _id, name, price, imageUrl, ... }
  
  if (!product) {
    return null; // Tránh lỗi nếu dữ liệu bị thiếu
  }
  
  return (
    // Link đến trang chi tiết SẢN PHẨM (dùng product._id)
    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
      <Card className="h-100 shadow-sm border-0">
        <Card.Img 
          variant="top" 
          src={product.imageUrl} // <-- SỬA LẠI: Lấy trực tiếp
          alt={product.name}      // <-- SỬA LẠI: Lấy trực tiếp
          style={{ height: '300px', objectFit: 'cover' }}
        />
        <Card.Body>
          <Card.Title 
            as="h6" 
            className="text-dark"
            style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}
          >
            {product.name} {/* <-- SỬA LẠI: Lấy trực tiếp */}
          </Card.Title>
          <Card.Text className="fw-bold">
            {/* Lấy giá đã "mượn" */}
            {product.price ? `${product.price.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
          </Card.Text>
          {/* Nút này sẽ dẫn người dùng đến trang chi tiết, 
              vì nó nằm trong <Link> */}
          <Button variant="dark" className="w-100" as="div">
            Xem chi tiết
          </Button>
        </Card.Body>
      </Card>
    </Link>
  );
}

export default ProductCard;