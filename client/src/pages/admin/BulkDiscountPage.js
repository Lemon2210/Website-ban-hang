import React, { useState, useEffect } from 'react';
import { Table, Button, Form, Row, Col, Card, Spinner, InputGroup, Alert, Image, Badge } from 'react-bootstrap';
import { Search, Save, Funnel, ArrowClockwise, Tools, CheckSquare } from 'react-bootstrap-icons';
import api from '../../api';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export default function BulkDiscountPage() {
    const { user } = useAuth();
    
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    
    const [selectedCategory, setSelectedCategory] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [bulkValue, setBulkValue] = useState('');
    const [editedDiscounts, setEditedDiscounts] = useState({});

    // --- STATE QUẢN LÝ CHECKBOX ---
    const [selectedIds, setSelectedIds] = useState(new Set()); // Lưu danh sách ID đã chọn
    // ------------------------------

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        if (!user || !user.token) return;
        setLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const [prodRes, catRes] = await Promise.all([
                api.get('/admin/products', config), 
                api.get('/categories')
            ]);
            setProducts(prodRes.data);
            setCategories(catRes.data);
            setSelectedIds(new Set()); // Reset selection khi load lại
        } catch (error) {
            console.error(error);
            toast.error('Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC LỌC ---
    const filteredProducts = products.filter(item => {
        const prod = item.product;
        if (!prod) return false;

        const term = searchTerm.toLowerCase();
        const name = prod.name ? prod.name.toLowerCase() : '';
        const sku = item.sku ? item.sku.toLowerCase() : '';
        const matchesSearch = name.includes(term) || sku.includes(term);

        let matchesCategory = true;
        if (selectedCategory) {
            const catId = typeof prod.category === 'object' ? prod.category?._id : prod.category;
            const subId = typeof prod.subCategory === 'object' ? prod.subCategory?._id : prod.subCategory;
            const brandId = typeof prod.brand === 'object' ? prod.brand?._id : prod.brand;

            matchesCategory = 
                String(catId) === selectedCategory || 
                String(subId) === selectedCategory || 
                String(brandId) === selectedCategory;
        }

        return matchesSearch && matchesCategory;
    });

    // --- LOGIC CHECKBOX ---
    
    // 1. Chọn/Bỏ chọn 1 sản phẩm
    const toggleSelect = (id) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    // 2. Chọn/Bỏ chọn TẤT CẢ (trong danh sách đang lọc)
    const toggleSelectAll = (e) => {
        if (e.target.checked) {
            // Chọn hết các item đang hiển thị
            const allIds = filteredProducts.map(item => item.product._id);
            setSelectedIds(new Set(allIds));
        } else {
            // Bỏ chọn hết
            setSelectedIds(new Set());
        }
    };

    // Kiểm tra xem checkbox tổng có nên được tick không
    const isAllSelected = filteredProducts.length > 0 && filteredProducts.every(item => selectedIds.has(item.product._id));
    // ----------------------

    const renderCategoryOptions = () => {
        const roots = categories.filter(c => !c.parent);
        return roots.map(root => {
            const subs = categories.filter(c => c.parent && String(c.parent._id) === String(root._id));
            return (
                <optgroup key={root._id} label={`📂 ${root.name}`}>
                    <option value={root._id}>Tất cả {root.name}</option>
                    {subs.map(sub => {
                        const brands = categories.filter(b => b.parent && String(b.parent._id) === String(sub._id));
                        return (
                            <React.Fragment key={sub._id}>
                                <option value={sub._id}>&nbsp;&nbsp;↳ {sub.name}</option>
                                {brands.map(brand => (
                                    <option key={brand._id} value={brand._id}>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• {brand.name}</option>
                                ))}
                            </React.Fragment>
                        );
                    })}
                </optgroup>
            );
        });
    };

    const handleDiscountChange = (productId, value) => {
        const numVal = Math.max(0, Math.min(100, Number(value)));
        setEditedDiscounts(prev => ({ ...prev, [productId]: numVal }));
    };

    // --- ÁP DỤNG HÀNG LOẠT (LOGIC MỚI: CHỈ CHO CHECKED ITEMS) ---
    const applyBulkValue = () => {
        if (!bulkValue && bulkValue !== 0) return;
        
        // Kiểm tra xem có chọn sản phẩm nào chưa
        if (selectedIds.size === 0) {
            toast.warning("Vui lòng tích chọn ít nhất một sản phẩm bên dưới!");
            return;
        }

        const numVal = Math.max(0, Math.min(100, Number(bulkValue)));
        const newDiscounts = { ...editedDiscounts };
        
        // Chỉ lặp qua các ID đã chọn
        selectedIds.forEach(id => {
            newDiscounts[id] = numVal;
        });
        
        setEditedDiscounts(newDiscounts);
        toast.success(`Đã áp dụng giảm ${numVal}% cho ${selectedIds.size} sản phẩm đã chọn.`);
    };
    // -------------------------------------------------------------

    const handleSaveChanges = async () => {
        const updates = Object.entries(editedDiscounts).map(([id, discount]) => ({ id, discount }));
        if (updates.length === 0) {
            toast.warning("Chưa có thay đổi nào.");
            return;
        }

        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            await api.put('/admin/products/bulk-discount', { updates }, config);
            
            toast.success("Cập nhật thành công!");
            fetchData();
            setEditedDiscounts({});
            setBulkValue('');
        } catch (error) {
            toast.error("Lỗi: " + (error.response?.data?.message || error.message));
        }
    };

    const handleFixData = async () => {
        if(!window.confirm("Hành động này sẽ quét và sửa các trường dữ liệu bị lỗi. Tiếp tục?")) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await api.get('/admin/fix-data', config);
            alert(res.data.message);
            window.location.reload();
        } catch (e) {
            alert("Lỗi: " + (e.response?.data?.message || e.message));
        }
    }

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Thiết lập Khuyến mãi</h2>
                <Button variant="outline-danger" size="sm" onClick={handleFixData}>
                    <Tools className="me-2"/> Quét & Sửa lỗi Data
                </Button>
            </div>

            <Card className="mb-4 shadow-sm border-0">
                <Card.Body>
                    <Row className="g-3 align-items-end">
                        <Col md={3}>
                            <Form.Label className="fw-bold"><Funnel className="me-1"/> Lọc Danh mục</Form.Label>
                            <Form.Select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                <option value="">-- Tất cả --</option>
                                {renderCategoryOptions()}
                            </Form.Select>
                        </Col>

                        <Col md={3}>
                            <Form.Label className="fw-bold"><Search className="me-1"/> Tìm kiếm</Form.Label>
                            <Form.Control 
                                type="text" 
                                placeholder="Tên, SKU..." 
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </Col>

                        <Col md={4} className="border-start ps-4">
                            <Form.Label className="fw-bold text-danger">⚡ Set nhanh % (Cho mục đã chọn)</Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type="number" 
                                    placeholder="VD: 20" 
                                    value={bulkValue}
                                    onChange={e => setBulkValue(e.target.value)}
                                />
                                <Button variant="danger" onClick={applyBulkValue}>
                                    Áp dụng
                                </Button>
                            </InputGroup>
                            <Form.Text className="text-muted">
                                {selectedIds.size > 0 
                                    ? `Đang chọn: ${selectedIds.size} sản phẩm` 
                                    : "Vui lòng tích ô bên dưới để chọn"}
                            </Form.Text>
                        </Col>

                        <Col md={2} className="text-end">
                             <Button variant="light" onClick={fetchData} title="Tải lại dữ liệu">
                                <ArrowClockwise/>
                             </Button>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {Object.keys(editedDiscounts).length > 0 && (
                <Alert variant="warning" className="d-flex justify-content-between align-items-center sticky-top shadow" style={{top: 20, zIndex: 999}}>
                    <span>Đang sửa <strong>{Object.keys(editedDiscounts).length}</strong> sản phẩm.</span>
                    <Button variant="primary" size="lg" onClick={handleSaveChanges}>
                        <Save className="me-2"/> LƯU THAY ĐỔI
                    </Button>
                </Alert>
            )}

            <Card className="shadow-sm border-0">
                <Table hover responsive className="align-middle mb-0">
                    <thead className="bg-light">
                        <tr>
                            {/* CỘT CHECKBOX HEADER */}
                            <th style={{width: '50px'}} className="text-center">
                                <Form.Check 
                                    type="checkbox" 
                                    checked={isAllSelected}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            {/* ------------------- */}
                            <th style={{width: '45%'}}>Sản phẩm</th>
                            <th>Giá gốc</th>
                            <th>Giá sau giảm</th>
                            <th style={{width: '15%'}}>% Giảm giá</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="text-center py-5"><Spinner animation="border"/></td></tr>
                        ) : filteredProducts.length === 0 ? (
                            <tr><td colSpan="5" className="text-center py-5">Không tìm thấy sản phẩm nào phù hợp.</td></tr>
                        ) : (
                            filteredProducts.map((item) => {
                                const prod = item.product;
                                if (!prod) return null;
                                
                                const currentDiscount = editedDiscounts[prod._id] !== undefined ? editedDiscounts[prod._id] : (prod.discount || 0);
                                const finalPrice = item.price * (1 - currentDiscount / 100);
                                
                                // Kiểm tra xem dòng này có được chọn không
                                const isChecked = selectedIds.has(prod._id);

                                return (
                                    <tr key={item._id} className={isChecked ? "table-active" : ""}>
                                        {/* CỘT CHECKBOX ROW */}
                                        <td className="text-center">
                                            <Form.Check 
                                                type="checkbox" 
                                                checked={isChecked}
                                                onChange={() => toggleSelect(prod._id)}
                                            />
                                        </td>
                                        {/* ---------------- */}
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Image 
                                                    src={item.imageUrl} 
                                                    alt={item.sku}
                                                    rounded 
                                                    style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '15px' }}
                                                />
                                                <div>
                                                    <div className="fw-bold text-dark">{prod.name}</div>
                                                    <div className="small text-muted">
                                                        <Badge bg="light" text="dark" className="border me-2">{item.sku}</Badge>
                                                        {item.attributes?.color} - {item.attributes?.size}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.price.toLocaleString()}đ</td>
                                        <td>
                                            {currentDiscount > 0 ? (
                                                <span className="fw-bold text-success">
                                                    {finalPrice.toLocaleString()}đ
                                                </span>
                                            ) : (
                                                <span className="text-muted">-</span>
                                            )}
                                        </td>
                                        <td>
                                            <InputGroup size="sm">
                                                <Form.Control
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={currentDiscount}
                                                    onChange={(e) => handleDiscountChange(prod._id, e.target.value)}
                                                    className={`fw-bold text-center ${currentDiscount > 0 ? 'text-danger' : ''}`}
                                                />
                                                <InputGroup.Text>%</InputGroup.Text>
                                            </InputGroup>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </Table>
            </Card>
        </div>
    );
}