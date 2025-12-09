import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Breadcrumb, Form } from 'react-bootstrap';
import api from '../../api';
import ProductCard from '../../components/ProductCard';
import { Search, Tag, FilterX } from 'lucide-react';

// --- HÀM HỖ TRỢ: XÓA DẤU TIẾNG VIỆT ---
const removeAccents = (str) => {
    if (!str) return '';
    return str.normalize('NFD')
              .replace(/[\u0300-\u036f]/g, '')
              .replace(/đ/g, 'd').replace(/Đ/g, 'D')
              .toLowerCase()
              .trim(); // Cắt khoảng trắng thừa 2 đầu
};

function SearchResultsPage() {
  const location = useLocation();
  
  // 1. LẤY THAM SỐ TỪ URL (Hỗ trợ cả 'keyword' và 'q')
  const searchParams = new URLSearchParams(location.search);
  const keyword = searchParams.get('keyword') || searchParams.get('q') || ''; 
  const isSale = searchParams.get('sale') === 'true'; 

  const [products, setProducts] = useState([]); // Dữ liệu gốc
  const [loading, setLoading] = useState(true);
  const [sortType, setSortType] = useState('default');

  // 2. TẢI DỮ LIỆU TỪ API (Chỉ chạy 1 lần khi vào trang)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/products');
        setProducts(data);
      } catch (err) {
        console.error("Lỗi tải sản phẩm:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // 3. LOGIC LỌC DỮ LIỆU (Sử dụng useMemo để tính toán tức thì)
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    return products.filter(item => {
        // Chuẩn hóa dữ liệu (Product hoặc Inventory)
        const prod = item.product || item; 
        
        // --- A. LỌC THEO KHUYẾN MÃI ---
        if (isSale) {
            const discount = Number(prod.discount || 0);
            if (discount <= 0) return false; // Loại ngay nếu không giảm giá
        }

        // --- B. LỌC THEO TỪ KHÓA ---
        if (keyword && keyword.trim() !== '') {
            const term = removeAccents(keyword);
            
            // Lấy thông tin sản phẩm và xóa dấu
            const name = removeAccents(prod.name);
            const sku = removeAccents(item.sku || prod.sku || ''); // Tìm cả SKU
            
            // Xử lý danh mục an toàn (Tránh lỗi nếu category chưa populate)
            const catName = (prod.category && typeof prod.category === 'object') ? removeAccents(prod.category.name) : '';
            const subName = (prod.subCategory && typeof prod.subCategory === 'object') ? removeAccents(prod.subCategory.name) : '';
            const brandName = (prod.brand && typeof prod.brand === 'object') ? removeAccents(prod.brand.name) : '';

            // Logic tìm kiếm: Từ khóa phải xuất hiện trong Tên HOẶC SKU HOẶC Danh mục
            const isMatch = name.includes(term) || sku.includes(term) || catName.includes(term) || subName.includes(term) || brandName.includes(term);
            
            if (!isMatch) return false;
        }

        return true;
    }).sort((a, b) => {
        // --- C. SẮP XẾP ---
        const pA = (a.product || a).price * (1 - ((a.product || a).discount || 0)/100);
        const pB = (b.product || b).price * (1 - ((b.product || b).discount || 0)/100);

        if (sortType === 'price-asc') return pA - pB;
        if (sortType === 'price-desc') return pB - pA;
        return 0; // Mặc định (thường là theo ID hoặc ngày tạo từ DB)
    });

  }, [products, keyword, isSale, sortType]); // Tự động chạy lại khi các biến này đổi

  
  // --- UI TIÊU ĐỀ ---
  let pageTitle = "Tất cả sản phẩm";
  if (isSale && keyword) pageTitle = `Khuyến mãi cho "${keyword}"`;
  else if (isSale) pageTitle = "Sản phẩm đang Khuyến mãi (Sale)";
  else if (keyword) pageTitle = `Kết quả tìm kiếm: "${keyword}"`;

  return (
    <Container className="py-4" style={{ minHeight: '60vh' }}>
      <Breadcrumb className="mb-4">
        <Breadcrumb.Item linkAs={Link} linkProps={{ to: "/" }}>Trang chủ</Breadcrumb.Item>
        <Breadcrumb.Item active>Tìm kiếm</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 border-bottom pb-3">
        <h2 className="fw-bold mb-3 mb-md-0 d-flex align-items-center text-uppercase fs-4">
            {isSale ? <Tag className="me-2 text-danger"/> : <Search className="me-2"/>}
            {pageTitle}
            <span className="text-muted ms-2 fs-6 fw-normal">({filteredProducts.length} kết quả)</span>
        </h2>
        
        <div className="d-flex align-items-center">
            <span className="me-2 text-muted text-nowrap small">Sắp xếp theo:</span>
            <Form.Select 
                size="sm" 
                value={sortType} 
                onChange={(e) => setSortType(e.target.value)}
                style={{width: '180px', borderRadius: '20px'}}
            >
                <option value="default">Mặc định</option>
                <option value="price-asc">Giá: Thấp đến Cao</option>
                <option value="price-desc">Giá: Cao đến Thấp</option>
            </Form.Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5"><Spinner animation="border" variant="primary" /></div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-5 bg-light rounded">
            <div className="mb-3 text-muted"><FilterX size={48}/></div>
            <h4>Không tìm thấy sản phẩm nào.</h4>
            <p className="text-muted">
                {keyword ? `Không có kết quả nào cho "${keyword}".` : "Danh sách trống."}
            </p>
            <Link to="/" className="btn btn-dark mt-2 rounded-pill px-4">Về trang chủ</Link>
        </div>
      ) : (
        <Row>
            {filteredProducts.map(item => (
                <Col key={item._id || (item.product && item.product._id)} xs={6} md={4} lg={3} className="mb-4">
                    {/* Truyền đúng object product vào ProductCard */}
                    <ProductCard product={item.product || item} />
                </Col>
            ))}
        </Row>
      )}
    </Container>
  );
}

export default SearchResultsPage;