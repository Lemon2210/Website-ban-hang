import React from 'react';
import { Container, Row, Col, Card, Table, Tab, Tabs, Image, Alert } from 'react-bootstrap';
import { Ruler, Info, CheckCircle } from 'lucide-react';

export default function SizeGuidePage() {
  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h2 className="fw-bold text-uppercase">Hướng dẫn chọn kích cỡ (Size Guide)</h2>
        <p className="text-muted">
          Bảng thông số kích thước chuẩn dành cho người Việt Nam. <br/>
          Nếu bạn nằm giữa 2 size, hãy chọn size lớn hơn để mặc thoải mái.
        </p>
      </div>

      <Row className="justify-content-center">
        <Col lg={10}>
          <Card className="shadow-sm border-0">
            <Card.Body className="p-4">
              <Tabs defaultActiveKey="men" id="size-guide-tabs" className="mb-4" fill justify>
                
                {/* --- TAB NAM --- */}
                <Tab eventKey="men" title={<span className="fw-bold">DÀNH CHO NAM</span>}>
                  <Alert variant="info" className="d-flex align-items-center">
                    <Info size={20} className="me-2" />
                    <strong>Mẹo:</strong> Với nam giới, thông số <strong>Chiều cao</strong> và <strong>Vòng ngực</strong> là quan trọng nhất khi chọn áo.
                  </Alert>
                  
                  <h5 className="mt-4 mb-3 text-primary fw-bold">1. Áo (T-shirt, Polo, Shirt, Jacket)</h5>
                  <Table striped bordered hover responsive className="text-center align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Size</th>
                        <th>Chiều cao (cm)</th>
                        <th>Cân nặng (kg)</th>
                        <th>Vòng ngực (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>XS</strong></td><td>155 - 160</td><td>45 - 53</td><td>82 - 86</td></tr>
                      <tr><td><strong>S</strong></td><td>160 - 167</td><td>53 - 60</td><td>86 - 90</td></tr>
                      <tr><td><strong>M</strong></td><td>165 - 172</td><td>60 - 68</td><td>90 - 94</td></tr>
                      <tr><td><strong>L</strong></td><td>170 - 178</td><td>68 - 76</td><td>94 - 98</td></tr>
                      <tr><td><strong>XL</strong></td><td>175 - 182</td><td>76 - 85</td><td>98 - 102</td></tr>
                      <tr><td><strong>XXL</strong></td><td>180 - 190</td><td>85 - 95</td><td>102 - 108</td></tr>
                    </tbody>
                  </Table>

                  <h5 className="mt-5 mb-3 text-primary fw-bold">2. Quần (Jeans, Kaki, Short)</h5>
                  <Table striped bordered hover responsive className="text-center align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Size</th>
                        <th>Chiều cao (cm)</th>
                        <th>Cân nặng (kg)</th>
                        <th>Vòng eo (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>29 (S)</strong></td><td>160 - 165</td><td>50 - 55</td><td>70 - 73</td></tr>
                      <tr><td><strong>30 (M)</strong></td><td>164 - 169</td><td>55 - 60</td><td>73 - 76</td></tr>
                      <tr><td><strong>31 (L)</strong></td><td>168 - 174</td><td>60 - 65</td><td>76 - 79</td></tr>
                      <tr><td><strong>32 (XL)</strong></td><td>170 - 176</td><td>65 - 72</td><td>79 - 82</td></tr>
                      <tr><td><strong>34 (XXL)</strong></td><td>175 - 180</td><td>72 - 80</td><td>82 - 87</td></tr>
                    </tbody>
                  </Table>
                </Tab>

                {/* --- TAB NỮ --- */}
                <Tab eventKey="women" title={<span className="fw-bold">DÀNH CHO NỮ</span>}>
                  <Alert variant="warning" className="d-flex align-items-center">
                    <Info size={20} className="me-2" />
                    <strong>Mẹo: </strong> Với nữ giới, thông số <strong>Vòng eo</strong> và <strong>Vòng mông</strong> quyết định độ vừa vặn của quần/váy.
                  </Alert>

                  <h5 className="mt-4 mb-3 text-danger fw-bold">1. Áo (T-shirt, Croptop, Shirt)</h5>
                  <Table striped bordered hover responsive className="text-center align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Size</th>
                        <th>Chiều cao (cm)</th>
                        <th>Cân nặng (kg)</th>
                        <th>Vòng 1 (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>XS</strong></td><td>148 - 153</td><td>38 - 42</td><td>76 - 80</td></tr>
                      <tr><td><strong>S</strong></td><td>153 - 158</td><td>42 - 47</td><td>80 - 84</td></tr>
                      <tr><td><strong>M</strong></td><td>156 - 162</td><td>47 - 54</td><td>84 - 88</td></tr>
                      <tr><td><strong>L</strong></td><td>160 - 166</td><td>54 - 60</td><td>88 - 92</td></tr>
                      <tr><td><strong>XL</strong></td><td>164 - 170</td><td>60 - 68</td><td>92 - 96</td></tr>
                    </tbody>
                  </Table>

                  <h5 className="mt-5 mb-3 text-danger fw-bold">2. Quần & Váy</h5>
                  <Table striped bordered hover responsive className="text-center align-middle">
                    <thead className="bg-light">
                      <tr>
                        <th>Size</th>
                        <th>Vòng eo (cm)</th>
                        <th>Vòng mông (cm)</th>
                        <th>Dài quần (cm)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr><td><strong>26 (S)</strong></td><td>60 - 64</td><td>82 - 86</td><td>90</td></tr>
                      <tr><td><strong>27 (M)</strong></td><td>64 - 68</td><td>86 - 90</td><td>91</td></tr>
                      <tr><td><strong>28 (L)</strong></td><td>68 - 72</td><td>90 - 94</td><td>92</td></tr>
                      <tr><td><strong>29 (XL)</strong></td><td>72 - 76</td><td>94 - 98</td><td>93</td></tr>
                    </tbody>
                  </Table>
                </Tab>
              </Tabs>

              {/* --- HƯỚNG DẪN ĐO --- */}
              <div className="mt-5 pt-4 border-top">
                <h4 className="fw-bold mb-3"><Ruler className="me-2 mb-1"/>Cách lấy số đo cơ thể</h4>
                <Row className="g-4">
                    <Col md={6}>
                        <ul className="list-unstyled text-muted">
                            <li className="mb-2 d-flex"><CheckCircle size={18} className="text-success me-2 mt-1"/> <strong>Vòng ngực:</strong> Đo quanh phần ngực nở nhất.</li>
                            <li className="mb-2 d-flex"><CheckCircle size={18} className="text-success me-2 mt-1"/> <strong>Vòng eo:</strong> Đo quanh phần eo nhỏ nhất (thường trên rốn 2-3cm).</li>
                            <li className="mb-2 d-flex"><CheckCircle size={18} className="text-success me-2 mt-1"/> <strong>Vòng mông:</strong> Đo quanh phần mông nở nhất.</li>
                            <li className="mb-2 d-flex"><CheckCircle size={18} className="text-success me-2 mt-1"/> <strong>Chiều dài áo:</strong> Đo từ điểm cao nhất của vai xuống lai áo.</li>
                        </ul>
                    </Col>
                    <Col md={6} className="bg-light rounded p-4 text-center">
                       {/* Bạn có thể thêm hình ảnh minh họa cách đo ở đây nếu có */}
                       <p className="mb-0 text-muted fst-italic">"Sự vừa vặn là chìa khóa của phong cách."</p>
                    </Col>
                </Row>
              </div>

            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}