import React from 'react';
import { Tabs, Tab, Row, Col, Card } from 'react-bootstrap';
import aokhoacImg from '../assets/images/categories/nam/aokhoac.png';
import aodaitayImg from '../assets/images/categories/nam/aotaydai.png';
import poloImg from '../assets/images/categories/nam/polo.png';
import somiImg from '../assets/images/categories/nam/somi.png';
import athunImg from '../assets/images/categories/nam/aothun.png';
import hoodieImg from '../assets/images/categories/nam/hoodie.png';

// (Đây là dữ liệu tĩnh, bạn có thể thay thế sau)
const categoriesNam = [
  { name: 'ÁO KHOÁC', img: aokhoacImg },
  { name: 'HOODIE & SWEATER', img: hoodieImg },
  { name: 'ÁO DÀI TAY', img: aodaitayImg },
  { name: 'ÁO POLO', img: poloImg },
  { name: 'SƠ MI', img: somiImg },
  { name: 'ÁO THUN', img: athunImg },
];

const categoriesNu = [
  { name: 'ÁO THỂ THAO', img: 'https://via.placeholder.com/200x250' },
  { name: 'QUẦN THỂ THAO', img: 'https://via.placeholder.com/200x250' },
  { name: 'HOODIE & SWEATER', img: 'https://via.placeholder.com/200x250' },
  { name: 'BRA & LEGGINGS', img: 'https://via.placeholder.com/200x250' },
  { name: 'VÁY THỂ THAO', img: 'https://via.placeholder.com/200x250' },
  { name: 'PHỤ KIỆN', img: 'https://via.placeholder.com/200x250' },
];

function CategoryTabs() {
  return (
    <Tabs defaultActiveKey="nam" id="category-tabs" className="mb-3 justify-content-center border-0">
      <Tab eventKey="nam" title="NAM">
        <Row className="g-3">
          {categoriesNam.map((cat) => (
            <Col key={cat.name} xs={6} md={4} lg={2}>
              {/* (Sau này chúng ta sẽ bọc bằng <Link>) */}
              <a href={`/category/${cat.name.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                <Card className="border-0 text-center">
                  <Card.Img variant="top" src={cat.img} className="rounded-3" />
                  <Card.Body>
                    <Card.Title as="h6" className="text-dark">{cat.name}</Card.Title>
                  </Card.Body>
                </Card>
              </a>
            </Col>
          ))}
        </Row>
      </Tab>
      <Tab eventKey="nu" title="NỮ">
        <Row className="g-3">
          {categoriesNu.map((cat) => (
            <Col key={cat.name} xs={6} md={4} lg={2}>
              <a href={`/category/${cat.name.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                <Card className="border-0 text-center">
                  <Card.Img variant="top" src={cat.img} className="rounded-3" />
                  <Card.Body>
                    <Card.Title as="h6" className="text-dark">{cat.name}</Card.Title>
                  </Card.Body>
                </Card>
              </a>
            </Col>
          ))}
        </Row>
      </Tab>
    </Tabs>
  );
}

export default CategoryTabs;