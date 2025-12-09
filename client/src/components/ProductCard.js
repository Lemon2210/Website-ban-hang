import React from 'react';
import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function ProductCard({ product }) {
  if (!product) {
    return null; 
  }

  // --- LOGIC TÍNH TOÁN GIÁ ---
  const originalPrice = product.price || 0;
  const discount = product.discount || 0; // Lấy % giảm giá từ DB
  const hasDiscount = discount > 0;
  
  // Tính giá sau khi giảm
  const finalPrice = hasDiscount 
    ? originalPrice * (1 - discount / 100) 
    : originalPrice;
  // ---------------------------

  return (
    <Link to={`/product/${product._id}`} style={{ textDecoration: 'none' }}>
      {/* Thêm position-relative để căn chỉnh Badge giảm giá */}
      <Card className="h-100 shadow-sm border-0 position-relative">
        
        {/* --- BADGE GIẢM GIÁ (HIỂN THỊ NẾU CÓ DISCOUNT) --- */}
        {hasDiscount && (
            <div 
                className="position-absolute bg-danger text-white fw-bold px-2 py-1 rounded"
                style={{ 
                    top: '10px', 
                    right: '10px', 
                    fontSize: '0.85rem', 
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}
            >
                -{discount}%
            </div>
        )}
        {/* ------------------------------------------------ */}

        <Card.Img 
          variant="top" 
          src={product.imageUrl || product.image} // Fallback phòng khi tên trường ảnh khác nhau
          alt={product.name}
          style={{ height: '300px', objectFit: 'cover' }}
        />
        
        <Card.Body className="d-flex flex-column">
          <Card.Title 
            as="h6" 
            className="text-dark"
            style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}
            title={product.name} // Tooltip khi hover tên dài
          >
            {product.name}
          </Card.Title>
          
          {/* --- KHU VỰC HIỂN THỊ GIÁ (ĐÃ SỬA) --- */}
          <div className="mt-1 mb-3">
            {hasDiscount ? (
                // Trường hợp có giảm giá: Hiện giá mới + Giá cũ gạch ngang
                <div className="d-flex align-items-center gap-2">
                    <span className="fw-bold text-danger fs-5">
                        {finalPrice.toLocaleString('vi-VN')}₫
                    </span>
                    <span className="text-muted text-decoration-line-through small">
                        {originalPrice.toLocaleString('vi-VN')}₫
                    </span>
                </div>
            ) : (
                // Trường hợp bình thường
                <span className="fw-bold text-dark fs-5">
                    {originalPrice > 0 ? `${originalPrice.toLocaleString('vi-VN')}₫` : 'Liên hệ'}
                </span>
            )}
          </div>
          {/* ------------------------------------ */}

          <Button variant="dark" className="w-100 mt-auto" as="div">
            Xem chi tiết
          </Button>
        </Card.Body>
      </Card>
    </Link>
  );
}

export default ProductCard;