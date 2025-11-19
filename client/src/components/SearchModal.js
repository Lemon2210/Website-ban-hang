import React, { useState, useEffect } from 'react';
import { Modal, InputGroup, Form, Button, Row, Col, Card } from 'react-bootstrap';
import { Search, X } from 'react-bootstrap-icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function SearchModal({ show, onHide }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState([]); // Lưu toàn bộ sản phẩm để lọc
  const [filteredProducts, setFilteredProducts] = useState([]); // Kết quả lọc
  const [searchHistory, setSearchHistory] = useState([]);
  const navigate = useNavigate();

  // --- 1. KHI MODAL MỞ: TẢI LỊCH SỬ & SẢN PHẨM ---
  useEffect(() => {
    if (show) {
      // Lấy lịch sử từ bộ nhớ trình duyệt
      const history = JSON.parse(localStorage.getItem('searchHistory')) || [];
      setSearchHistory(history);

      // Tải trước toàn bộ sản phẩm để tìm kiếm cho nhanh (Client-side filtering)
      const fetchProducts = async () => {
        try {
          const { data } = await api.get('/products');
          setAllProducts(data);
        } catch (error) {
          console.error("Lỗi tải sản phẩm tìm kiếm:", error);
        }
      };
      fetchProducts();
      
      // Reset từ khóa
      setSearchTerm('');
      setFilteredProducts([]);
    }
  }, [show]);

  // --- 2. KHI NGƯỜI DÙNG GÕ: LỌC REALTIME ---
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts([]);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    // Lọc sản phẩm có tên chứa từ khóa
    const results = allProducts.filter(product =>
      product.name.toLowerCase().includes(lowerTerm)
    );

    // Lấy ngẫu nhiên 4 sản phẩm từ kết quả tìm được
    // (Xáo trộn mảng rồi lấy 4 cái đầu)
    const shuffled = [...results].sort(() => 0.5 - Math.random());
    setFilteredProducts(shuffled.slice(0, 4));

  }, [searchTerm, allProducts]);

  // --- 3. XỬ LÝ KHI NHẤN TÌM KIẾM (ENTER HOẶC NÚT) ---
  const handleSearchSubmit = (e) => {
    e?.preventDefault(); // Ngăn form reload
    if (!searchTerm.trim()) return;

    // Cập nhật lịch sử (Logic FIFO: Mới nhất lên đầu, tối đa 5)
    // Lọc bỏ từ khóa trùng lặp cũ trước khi thêm mới
    let newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)];
    if (newHistory.length > 5) {
      newHistory = newHistory.slice(0, 5); // Chỉ giữ 5 cái đầu
    }

    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));

    // Chuyển đến trang kết quả tìm kiếm (Chúng ta sẽ tạo trang này sau nếu cần)
    // navigate(`/search?q=${searchTerm}`);
    
    // Tạm thời đóng modal
    onHide();
  };

  // Xử lý khi click vào từ khóa trong lịch sử
  const handleHistoryClick = (term) => {
    setSearchTerm(term);
  };

  // Xóa 1 mục lịch sử
  const removeHistoryItem = (e, term) => {
    e.stopPropagation();
    const newHistory = searchHistory.filter(h => h !== term);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered className="search-modal">
      <Modal.Header className="border-bottom-0 pb-0">
        <InputGroup className="mb-2">
            <InputGroup.Text className="bg-white border-0 ps-0">
                <Search size={20} />
            </InputGroup.Text>
            <Form.Control
                placeholder="Tìm kiếm sản phẩm..."
                className="border-0 shadow-none fs-5 ps-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit(e)}
                autoFocus
            />
            {/* Nút đóng modal */}
            <Button variant="link" className="text-dark text-decoration-none pe-0" onClick={onHide}>
                <X size={28}/>
            </Button>
        </InputGroup>
      </Modal.Header>
      
      <Modal.Body className="pt-0 pb-4 px-4">
        <hr className="mt-0 mb-4"/>
        
        {/* TRƯỜNG HỢP 1: CHƯA NHẬP GÌ -> HIỆN LỊCH SỬ */}
        {!searchTerm && (
            <div>
                <h6 className="text-muted mb-3 small fw-bold">LỊCH SỬ TÌM KIẾM</h6>
                <div className="d-flex flex-wrap gap-2">
                    {searchHistory.length === 0 && <p className="text-muted small">Chưa có lịch sử tìm kiếm.</p>}
                    {searchHistory.map((term, index) => (
                        <Button 
                            key={index} 
                            variant="light" 
                            className="rounded-pill d-flex align-items-center px-3 py-1 border"
                            style={{backgroundColor: '#f8f9fa', fontSize: '0.9rem'}}
                            onClick={() => handleHistoryClick(term)}
                        >
                            {term}
                            <X 
                                className="ms-2 text-muted" 
                                size={14} 
                                onClick={(e) => removeHistoryItem(e, term)}
                            />
                        </Button>
                    ))}
                </div>
            </div>
        )}

        {/* TRƯỜNG HỢP 2: ĐANG NHẬP -> HIỆN KẾT QUẢ REALTIME */}
        {searchTerm && (
            <div>
                 <h6 className="text-muted mb-3 small fw-bold">KẾT QUẢ TÌM KIẾM</h6>
                 
                 {filteredProducts.length === 0 ? (
                     <p className="text-center text-muted py-4">Không tìm thấy sản phẩm nào phù hợp.</p>
                 ) : (
                     <Row className="g-3">
                         {filteredProducts.map(product => (
                             <Col xs={6} md={3} key={product._id}>
                                 <Link to={`/product/${product._id}`} onClick={onHide} className="text-decoration-none text-dark">
                                     <Card className="border-0 h-100">
                                         <div className="position-relative bg-light rounded overflow-hidden" style={{paddingTop: '125%'}}>
                                            <Card.Img 
                                                src={product.imageUrl} 
                                                variant="top" 
                                                className="position-absolute top-0 start-0 w-100 h-100"
                                                style={{objectFit: 'cover'}}
                                            />
                                         </div>
                                         <Card.Body className="px-0 py-2">
                                             <Card.Title className="text-truncate" style={{fontSize: '0.9rem'}}>
                                                 {product.name}
                                             </Card.Title>
                                             <Card.Text className="fw-bold small">
                                                 {product.price.toLocaleString('vi-VN')}₫
                                             </Card.Text>
                                         </Card.Body>
                                     </Card>
                                 </Link>
                             </Col>
                         ))}
                     </Row>
                 )}

                 {/* Button Xem tất cả */}
                 {filteredProducts.length > 0 && (
                     <div className="text-center mt-4">
                         <Button variant="dark" className="rounded-pill px-4" onClick={handleSearchSubmit}>
                             Xem tất cả kết quả "{searchTerm}"
                         </Button>
                     </div>
                 )}
            </div>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default SearchModal;