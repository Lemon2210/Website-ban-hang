import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import api from '../../api';
import ProductCard from '../../components/ProductCard';

// Thêm prop 'category' vào component
export function CategoryPage({ gender, category, title }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        
        // Xây dựng URL query string
        let query = '/products?';
        if (gender) query += `gender=${gender}&`;
        if (category) query += `category=${category}`; // Thêm tham số category
        
        const { data } = await api.get(query);
        setProducts(data);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách sản phẩm.');
        setLoading(false);
      }
    };

    fetchProducts();
  }, [gender, category]); // Chạy lại khi gender HOẶC category thay đổi

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <div className="container mt-4"><Alert variant="danger">{error}</Alert></div>;

  return (
    <Container className="py-5">
      <h1 className="mb-4 border-bottom pb-3">{title}</h1>
      
      {products.length === 0 ? (
        <div className="text-center py-5">
            <p className="text-muted">Chưa có sản phẩm nào phù hợp.</p>
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

export default CategoryPage;