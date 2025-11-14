import React, { useState, useEffect } from 'react';
import { Table, Button, Image, Spinner, Alert, Badge, Row, Col, InputGroup, FormControl } from 'react-bootstrap';
import { PencilSquare, Trash, PlusLg, Search, Filter } from 'react-bootstrap-icons';
import { Link } from 'react-router-dom';
import api from '../../api'; // "Bộ não" API
import { useAuth } from '../../context/AuthContext'; // (Chúng ta cần cái này cho API Admin)

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user } = useAuth(); // Lấy thông tin user (để lấy token)

  // Hàm tải dữ liệu
  const fetchProductsAdmin = async () => {
    // Phải có user và token mới gọi được API admin
    if (!user || !user.token) {
        setError('Cần có quyền Admin để xem trang này.');
        setLoading(false);
        return;
    }
    
    try {
      setLoading(true);
      
      // Cấu hình để gửi token
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      // Gọi API ADMIN MỚI
      const { data } = await api.get('/admin/products', config);
      
      // API này trả về mảng các BIẾN THỂ (Inventories)
      setProducts(data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách sản phẩm. Lỗi từ server.');
      setLoading(false);
      console.error("Lỗi khi fetch sản phẩm (Admin):", err);
    }
  };

  // Gọi API khi trang được tải
  useEffect(() => {
    fetchProductsAdmin();
  }, [user]); // Chạy lại nếu user thay đổi

  // --- Logic cho Trạng thái (Status) theo yêu cầu của bạn ---
  const getStockInfo = (stockArray) => {
    // Tính tổng tồn kho từ tất cả các cửa hàng
    const totalStock = stockArray.reduce((acc, store) => acc + store.quantity, 0);
    
    let variant, text, status;

    if (totalStock > 50) {
      variant = "success"; // Nền xanh
      status = "Còn hàng";
    } else if (totalStock > 0 && totalStock <= 20) {
      variant = "warning"; // Nền vàng
      text = "dark"; // Chữ đen
      status = "SL thấp";
    } else if (totalStock === 0) {
      variant = "danger"; // Nền đỏ
      status = "Hết hàng";
    } else {
      // (Trường hợp từ 21-50)
      variant = "success";
      status = "Còn hàng";
    }
    
    return { totalStock, status, variant, text };
  };

  // Hàm xóa (giả lập)
  const handleDeleteProduct = (id) => {
     if (window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
       alert("Chức năng Xóa đang được phát triển!");
       // (Sau này chúng ta sẽ gọi: await api.delete(`/admin/products/${id}`, config);)
     }
  };

  // Render nội dung
  const renderContent = () => {
    if (loading) {
      return <div className="text-center my-5"><Spinner animation="border" /></div>;
    }
    if (error) {
      return <Alert variant="danger">{error}</Alert>;
    }
    return (
      <Table striped bordered hover responsive>
        <thead className="table-dark">
          <tr>
            <th>Sản phẩm</th>
            <th>Mã sản phẩm (SKU)</th>
            <th>Loại sản phẩm</th>
            <th>Giá (VND)</th>
            <th>Số lượng</th>
            <th>Trạng thái</th>
            <th className="text-center">Chức năng</th>
          </tr>
        </thead>
        <tbody>
          {products.map((item) => {
            // `item` là một Inventory (Biến thể)
            // `item.product` là Product Gốc (đã được populate)
            
            // Lấy thông tin trạng thái
            const { totalStock, status, variant, text } = getStockInfo(item.stock);

            return (
              <tr key={item._id}>
                {/* Cột 1: Ảnh + Tên */}
                <td className="align-middle">
                  <Image 
                    src={item.imageUrl} 
                    alt={item.product.name}
                    rounded 
                    style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                  />
                  {item.product.name} ({item.attributes.color}, {item.attributes.size})
                </td>
                {/* Cột 2: SKU */}
                <td className="align-middle">{item.sku}</td>
                {/* Cột 3: Category */}
                <td className="align-middle">{item.product.category.sub}</td>
                {/* Cột 4: Giá */}
                <td className="align-middle">{item.price.toLocaleString('vi-VN')}₫</td>
                {/* Cột 5: Số lượng (Tổng tồn kho) */}
                <td className="align-middle">{totalStock}</td>
                {/* Cột 6: Trạng thái (Logic màu) */}
                <td className="align-middle">
                  <Badge bg={variant} text={text || null}>{status}</Badge>
                </td>
                {/* Cột 7: Chức năng */}
                <td className="align-middle text-center">
                  <Button variant="outline-primary" size="sm" className="me-2">
                    <PencilSquare />
                  </Button>
                  <Button 
                    variant="outline-danger" 
                    size="sm"
                    onClick={() => handleDeleteProduct(item._id)}
                  >
                    <Trash />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  return (
    <div>
      {/* TIÊU ĐỀ VÀ NÚT THÊM SẢN PHẨM */}
      <Row className="align-items-center mb-4">
        <Col>
          <h1>Quản lý Sản phẩm</h1>
          <p className="text-muted">Quản lý danh mục sản phẩm của bạn</p>
        </Col>
        <Col xs="auto">
          <Button as={Link} to="/admin/products/add" variant="dark">
            <PlusLg size={20} className="me-2" />
            Thêm Sản phẩm
          </Button>
        </Col>
      </Row>

      {/* THANH TÌM KIẾM VÀ FILTER */}
      <Row className="mb-3">
        <Col md={8}>
          <InputGroup>
            <InputGroup.Text><Search /></InputGroup.Text>
            <FormControl placeholder="Tìm kiếm sản phẩm theo tên hoặc SKU..." />
          </InputGroup>
        </Col>
        <Col md={4} className="d-flex justify-content-end">
          <Button variant="outline-secondary">
            <Filter className="me-2" />
            Lọc
          </Button>
        </Col>
      </Row>

      {/* BẢNG DỮ LIỆU (7 cột, Tiếng Việt) */}
      {renderContent()}

      {/* PHÂN TRANG (Tạm thời vô hiệu hóa) */}
      <div className="d-flex justify-content-between align-items-center mt-3">
         <span className="text-muted">Đang hiển thị 1 đến {products.length} của {products.length} sản phẩm</span>
         <div>
            <Button variant="outline-secondary" size="sm" disabled>Trước</Button>
            <Button variant="outline-secondary" size="sm" className="ms-2">Sau</Button>
         </div>
      </div>
    </div>
  );
}

export default ProductListPage;