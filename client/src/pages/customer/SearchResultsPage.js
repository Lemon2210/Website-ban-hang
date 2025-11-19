import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../../api';
import ProductCard from '../../components/ProductCard';

export function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || ''; // Lấy từ khóa 'q' từ URL

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query.trim()) {
        setProducts([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Gọi API lấy toàn bộ sản phẩm (hoặc API search nếu backend hỗ trợ)
        // Ở đây ta dùng cách lọc Client-side cho đồng bộ với Modal
        const { data } = await api.get('/products');
        
        const lowerTerm = query.toLowerCase();
        const results = data.filter(product =>
          product.name.toLowerCase().includes(lowerTerm)
        );
        
        setProducts(results);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải kết quả tìm kiếm.');
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query]); // Chạy lại mỗi khi từ khóa thay đổi

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container className="py-5">
      <div className="d-flex align-items-center mb-4">
        <h1 className="mb-0 me-2">Sản phẩm</h1>
        <span className="text-muted fs-4 border px-3 py-1 rounded-pill bg-light">
            {query}
        </span>
      </div>
      
      <h4 className="mb-4">Kết quả ({products.length})</h4>

      {products.length === 0 ? (
        <div className="text-center py-5">
            <p className="text-muted">Không tìm thấy sản phẩm nào phù hợp với từ khóa "{query}".</p>
        </div>
      ) : (
        <Row>
          {products.map((product) => (
            <Col key={product._id} xs={6} md={4} lg={3} className="mb-4">
              <ProductCard product={product} />
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default SearchResultsPage;