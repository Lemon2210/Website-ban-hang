import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Spinner, Alert, Button, Table, Form } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Download, BarChartLine } from 'react-bootstrap-icons';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import api from '../../api';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AF19FF'];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = outerRadius * 1.1; 
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#333" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" style={{ fontSize: '12px', fontWeight: 'bold' }}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

function DashboardPage() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [reportType, setReportType] = useState('month'); 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 7)); 
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const fetchStats = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      
      let query = `/admin/stats?type=${reportType}`;
      if (reportType === 'month') {
          query += `&date=${selectedDate}-01`;
      } else {
          query += `&date=${selectedYear}-01-01`;
      }

      const { data } = await api.get(query, config);
      setStats(data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      // Nếu lỗi, setStats về object rỗng để tránh crash
      setStats({}); 
      setError('Không thể tải dữ liệu thống kê. Hãy kiểm tra lại Server Backend.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportType, selectedDate, selectedYear, user]);

  const exportToExcel = () => {
    if (!stats || !stats.exportData) return;
    const wb = XLSX.utils.book_new();
    
    const title = [["BÁO CÁO DOANH THU LEMON FASHION"]];
    const headers = [["TT", "Ngày bán", "Mã sản phẩm", "Tên sản phẩm", "Số lượng bán", "Đơn giá (VND)", "Thành tiền (VND)"]];
    
    const dataRows = stats.exportData.map(item => [
        item.tt, item.date, item.sku, item.name, item.quantity, item.price, item.total
    ]);

    const totalQuantity = stats.exportData.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = stats.exportData.reduce((sum, item) => sum + item.total, 0);
    const footerRow = [["TỔNG", "", "", "", totalQuantity, "", totalAmount]];

    const finalData = [...title, [], ...headers, ...dataRows, ...footerRow];
    const ws = XLSX.utils.aoa_to_sheet(finalData);
    ws['!cols'] = [{ wch: 5 }, { wch: 12 }, { wch: 15 }, { wch: 40 }, { wch: 12 }, { wch: 15 }, { wch: 18 }];

    XLSX.utils.book_append_sheet(wb, ws, "Báo Cáo Chi Tiết");
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], {type: 'application/octet-stream'});
    saveAs(data, `BaoCao_LemonFashion_${(stats.period || 'report').replace(/\//g, '-')}.xlsx`);
  };

  if (loading) return <div className="text-center my-5"><Spinner animation="border" /></div>;
  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!stats) return <Alert variant="warning">Không có dữ liệu.</Alert>;

  // --- SAFE DATA ACCESS (Bảo vệ dữ liệu an toàn) ---
  const revenueData = stats.revenueChartData || [];
  const bestSellers = stats.bestSellers || [];
  const slowSellers = stats.slowSellers || [];
  const topRated = stats.topRated || [];
  const lowRated = stats.lowRated || [];

  return (
    <div>
      {/* Toolbar */}
      <Card className="mb-4 shadow-sm border-0">
        <Card.Body>
          <Row className="align-items-center gy-2">
            <Col md={4}>
               <h3 className="mb-0 text-primary d-flex align-items-center">
                 <BarChartLine size={28} className="me-2"/>
                 Thống kê: {stats.period || '...'}
               </h3>
            </Col>
            <Col md={8}>
              <div className="d-flex justify-content-md-end gap-3 align-items-center flex-wrap">
                 <Form.Select 
                    value={reportType} 
                    onChange={(e) => setReportType(e.target.value)}
                    style={{width: 'auto', fontWeight: 'bold'}}
                 >
                    <option value="month">Theo Tháng</option>
                    <option value="year">Theo Năm</option>
                 </Form.Select>

                 {reportType === 'month' ? (
                     <Form.Control type="month" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} style={{maxWidth: '200px'}} />
                 ) : (
                     <Form.Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} style={{maxWidth: '120px'}}>
                        {[0, 1, 2, 3, 4].map(i => {
                            const y = new Date().getFullYear() - i;
                            return <option key={y} value={y}>{y}</option>
                        })}
                     </Form.Select>
                 )}

                 <Button variant="success" onClick={exportToExcel}>
                    <Download className="me-2"/> Xuất Excel
                 </Button>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Thẻ Tổng quan */}
      <Row className="mb-4 g-3">
        <Col md={6} xl={3}>
            <Card className="text-center shadow-sm border-0 text-white h-100" style={{backgroundColor: '#4e73df'}}>
                <Card.Body className="d-flex flex-column justify-content-center">
                    <div className="text-uppercase small fw-bold mb-1" style={{opacity: 0.8}}>Tổng Doanh Thu</div>
                    <h3 className="mb-0 fw-bold">{(stats.totalRevenue || 0).toLocaleString('vi-VN')}₫</h3>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} xl={3}>
            <Card className="text-center shadow-sm border-0 text-white h-100" style={{backgroundColor: '#1cc88a'}}>
                <Card.Body className="d-flex flex-column justify-content-center">
                    <div className="text-uppercase small fw-bold mb-1" style={{opacity: 0.8}}>Tổng Đơn Hàng</div>
                    <h3 className="mb-0 fw-bold">{stats.totalOrders || 0}</h3>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} xl={3}>
            <Card className="text-center shadow-sm border-0 text-white h-100" style={{backgroundColor: '#36b9cc'}}>
                <Card.Body className="d-flex flex-column justify-content-center">
                    <div className="text-uppercase small fw-bold mb-1" style={{opacity: 0.8}}>Sản phẩm Top 1</div>
                    <h5 className="mb-0 text-truncate px-2" title={bestSellers[0]?.name}>{bestSellers.length > 0 ? bestSellers[0].name : 'Chưa có'}</h5>
                    <small style={{opacity: 0.8}}>{bestSellers.length > 0 ? bestSellers[0].sold : 0} đã bán</small>
                </Card.Body>
            </Card>
        </Col>
        <Col md={6} xl={3}>
            <Card className="text-center shadow-sm border-0 text-white h-100" style={{backgroundColor: '#f6c23e'}}>
                <Card.Body className="d-flex flex-column justify-content-center">
                    <div className="text-uppercase small fw-bold mb-1" style={{opacity: 0.8}}>Đánh giá cao nhất</div>
                    <h3 className="mb-0 fw-bold">{topRated.length > 0 ? topRated[0].rating : 0} ⭐</h3>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* Biểu đồ */}
      <Row className="mb-4 g-3">
        <Col lg={8}>
            <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white fw-bold py-3 text-primary border-bottom-0">
                    Biểu đồ Doanh thu ({reportType === 'month' ? 'Theo Ngày' : 'Theo Tháng'})
                </Card.Header>
                <Card.Body>
                    <div style={{ width: '100%', height: 400 }}>
                        <ResponsiveContainer>
                            <BarChart data={revenueData} margin={{top: 20, right: 30, left: 20, bottom: 5}}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                                <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => new Intl.NumberFormat('vi-VN', { notation: "compact" }).format(value)} />
                                <Tooltip formatter={(value) => value.toLocaleString('vi-VN') + '₫'} cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                <Legend />
                                <Bar dataKey="revenue" name="Doanh thu" fill="#4e73df" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </Card.Body>
            </Card>
        </Col>
        <Col lg={4}>
            <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white fw-bold py-3 text-success border-bottom-0">Top 5 Bán chạy (Tỷ trọng)</Card.Header>
                <Card.Body className="d-flex flex-column align-items-center justify-content-center">
                     <div style={{ width: '100%', height: 350 }}>
                        {bestSellers.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={bestSellers}
                                        dataKey="sold"
                                        nameKey="name"
                                        cx="50%" cy="50%"
                                        fill="#8884d8"
                                        label={renderCustomizedLabel} 
                                        labelLine={true}
                                    >
                                        {bestSellers.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => [`${value} sản phẩm (${(props.percent * 100).toFixed(0)}%)`, name]} />
                                    <Legend verticalAlign="bottom" layout="horizontal" align="center" wrapperStyle={{fontSize: '12px', paddingTop: '20px'}}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-muted">Chưa có dữ liệu bán hàng.</p>
                        )}
                    </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>

      {/* Bảng thống kê chi tiết */}
      <Row>
        <Col md={6}>
            <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white fw-bold text-success">Top 5 Sản phẩm Bán chạy</Card.Header>
                <Table striped hover className="mb-0">
                    <thead><tr><th>Tên</th><th>Đã bán</th></tr></thead>
                    <tbody>
                        {bestSellers.map((p, i) => (
                            <tr key={i}><td>{p.name}</td><td className="fw-bold">{p.sold}</td></tr>
                        ))}
                        {bestSellers.length === 0 && <tr><td colSpan="2" className="text-center text-muted">Chưa có dữ liệu</td></tr>}
                    </tbody>
                </Table>
            </Card>
            
            <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white fw-bold text-danger">Top 5 Sản phẩm Bán chậm</Card.Header>
                 <Table striped hover className="mb-0">
                    <thead><tr><th>Tên</th><th>Đã bán</th></tr></thead>
                    <tbody>
                        {slowSellers.map((p, i) => (
                            <tr key={i}><td>{p.name}</td><td className="fw-bold">{p.sold}</td></tr>
                        ))}
                         {slowSellers.length === 0 && <tr><td colSpan="2" className="text-center text-muted">Chưa có dữ liệu</td></tr>}
                    </tbody>
                </Table>
            </Card>
        </Col>

        <Col md={6}>
             <Card className="shadow-sm border-0 mb-4">
                <Card.Header className="bg-white fw-bold text-primary">Top 5 Đánh giá Cao</Card.Header>
                <Table striped hover className="mb-0">
                    <thead><tr><th>Tên</th><th>Sao TB</th><th>Lượt</th></tr></thead>
                    <tbody>
                        {topRated.map((p, i) => (
                            <tr key={i}><td>{p.name}</td><td className="text-warning fw-bold">{p.rating} ⭐</td><td>{p.count}</td></tr>
                        ))}
                         {topRated.length === 0 && <tr><td colSpan="3" className="text-center text-muted">Chưa có dữ liệu</td></tr>}
                    </tbody>
                </Table>
            </Card>

            <Card className="shadow-sm border-0">
                <Card.Header className="bg-white fw-bold text-secondary">Top 5 Đánh giá Thấp</Card.Header>
                <Table striped hover className="mb-0">
                    <thead><tr><th>Tên</th><th>Sao TB</th><th>Lượt</th></tr></thead>
                    <tbody>
                         {lowRated.map((p, i) => (
                            <tr key={i}><td>{p.name}</td><td className="text-secondary fw-bold">{p.rating} ⭐</td><td>{p.count}</td></tr>
                        ))}
                         {lowRated.length === 0 && <tr><td colSpan="3" className="text-center text-muted">Chưa có dữ liệu</td></tr>}
                    </tbody>
                </Table>
            </Card>
        </Col>
      </Row>
    </div>
  );
}

export default DashboardPage;