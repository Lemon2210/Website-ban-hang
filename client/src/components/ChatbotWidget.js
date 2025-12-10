import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Form, InputGroup, Spinner, Image } from 'react-bootstrap';
import { ChatDots, Send, X, Robot } from 'react-bootstrap-icons';
import { useNavigate } from 'react-router-dom'; // <--- 1. Import useNavigate
import api from '../api'; 

export default function ChatbotWidget() {
  const navigate = useNavigate(); // <--- 2. Khởi tạo navigate
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Xin chào! Mình có thể giúp gì cho bạn? (VD: Tìm áo polo, check đơn hàng...)", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg = { text: inputValue, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      const { data } = await api.post('/webhook/chat', { message: userMsg.text });
      
      // <--- 3. NHẬN CẢ TEXT VÀ PRODUCTS ---
      const botMsg = { 
          text: data.reply, 
          isBot: true,
          products: data.products || [] // Lưu mảng sản phẩm vào tin nhắn
      };
      setMessages(prev => [...prev, botMsg]);
      // ------------------------------------

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { text: "Lỗi kết nối server.", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 4. HÀM CHUYỂN HƯỚNG KHI CLICK SẢN PHẨM ---
  const handleProductClick = (productId) => {
      navigate(`/product/${productId}`); // Chuyển sang trang chi tiết
      // setIsOpen(false); // Có thể đóng chat hoặc không tùy bạn
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {!isOpen && (
        <Button 
            variant="primary" 
            className="rounded-circle shadow-lg d-flex align-items-center justify-content-center"
            style={{ width: '60px', height: '60px' }}
            onClick={() => setIsOpen(true)}
        >
            <ChatDots size={30} />
        </Button>
      )}

      {isOpen && (
        <Card className="shadow-lg border-0" style={{ width: '360px', height: '550px', display: 'flex', flexDirection: 'column' }}>
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                <div className="d-flex align-items-center gap-2">
                    <Robot size={24} />
                    <span className="fw-bold">Trợ lý ảo AI</span>
                </div>
                <Button variant="link" className="text-white p-0" onClick={() => setIsOpen(false)}>
                    <X size={28} />
                </Button>
            </Card.Header>

            <Card.Body className="flex-grow-1 overflow-auto bg-light" style={{ padding: '15px' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`d-flex flex-column mb-3 ${msg.isBot ? 'align-items-start' : 'align-items-end'}`}>
                        {/* Bong bóng chat */}
                        <div className={`d-flex ${msg.isBot ? 'flex-row' : 'flex-row-reverse'} w-100`}>
                            {msg.isBot && (
                                <div className="bg-white rounded-circle p-1 me-2 shadow-sm flex-shrink-0" style={{width: 32, height: 32}}>
                                    <Robot className="text-primary m-1"/> 
                                </div>
                            )}
                            <div 
                                className={`p-3 rounded-3 shadow-sm ${msg.isBot ? 'bg-white text-dark' : 'bg-primary text-white'}`}
                                style={{ maxWidth: '85%', fontSize: '0.95rem' }}
                            >
                                <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />
                            </div>
                        </div>

                        {/* --- 5. HIỂN THỊ DANH SÁCH SẢN PHẨM (NẾU CÓ) --- */}
                        {msg.isBot && msg.products && msg.products.length > 0 && (
                            <div className="mt-2 ms-5" style={{width: '85%'}}>
                                {msg.products.map(prod => (
                                    <div 
                                        key={prod._id} 
                                        className="bg-white p-2 mb-2 rounded border shadow-sm d-flex align-items-center"
                                        style={{cursor: 'pointer', transition: '0.2s'}}
                                        onClick={() => handleProductClick(prod._id)}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                    >
                                        <Image 
                                            src={prod.image || 'https://via.placeholder.com/50'} 
                                            rounded 
                                            style={{width: '50px', height: '50px', objectFit: 'cover'}}
                                        />
                                        <div className="ms-2 flex-grow-1" style={{minWidth: 0}}>
                                            <div className="fw-bold text-truncate" style={{fontSize: '0.9rem'}}>{prod.name}</div>
                                            <div className="text-danger small fw-bold">
                                                {prod.price.toLocaleString('vi-VN')}₫
                                                {prod.discount > 0 && <span className="text-muted ms-1 text-decoration-line-through" style={{fontSize: '0.8em'}}>-{prod.discount}%</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* ----------------------------------------------- */}
                    </div>
                ))}
                
                {isLoading && (
                    <div className="text-start text-muted ms-5 small">
                        <Spinner animation="dots" size="sm" /> AI đang tìm kiếm...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </Card.Body>

            <Card.Footer className="bg-white p-2">
                <Form onSubmit={handleSendMessage}>
                    <InputGroup>
                        <Form.Control 
                            placeholder="Nhập tin nhắn..." 
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            className="border-0 bg-light"
                            style={{boxShadow: 'none'}}
                        />
                        <Button variant="white" type="submit" disabled={!inputValue.trim() || isLoading}>
                            <Send className="text-primary"/>
                        </Button>
                    </InputGroup>
                </Form>
            </Card.Footer>
        </Card>
      )}
    </div>
  );
}