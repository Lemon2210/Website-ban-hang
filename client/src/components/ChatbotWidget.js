import React, { useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';
import { ChatDots, X } from 'react-bootstrap-icons';

// (CSS nội tuyến để tạo kiểu cho các nút nổi)
const widgetStyle = {
  position: 'fixed',
  bottom: '20px',
  right: '20px',
  zIndex: 1050, // Đảm bảo nó nổi trên mọi thứ
};

const chatWindowStyle = {
  position: 'fixed',
  bottom: '90px', // Nằm ngay trên nút tròn
  right: '20px',
  width: '350px',
  height: '450px',
  zIndex: 1049,
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
};

function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Cửa sổ Chat (chỉ hiện khi isOpen) */}
      {isOpen && (
        <Card style={chatWindowStyle}>
          <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
            <span>Chat Support</span>
            <X size={24} onClick={() => setIsOpen(false)} style={{ cursor: 'pointer' }} />
          </Card.Header>
          <Card.Body className="overflow-auto d-flex flex-column">
            {/* Tin nhắn chào mừng */}
            <div className="p-2 bg-light rounded align-self-start mb-3">
              👋 Xin chào! Mình có thể giúp gì cho bạn?
            </div>
            {/* (Nội dung chat sẽ ở đây) */}
          </Card.Body>
          <Card.Footer>
            <Form>
              <Form.Control type="text" placeholder="Type your message..." />
            </Form>
          </Card.Footer>
        </Card>
      )}

      {/* Nút Tròn (luôn hiện) */}
      <Button
        variant="dark"
        className="rounded-circle"
        style={widgetStyle}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X size={24} /> : <ChatDots size={24} />}
      </Button>
    </>
  );
}

export default ChatbotWidget;