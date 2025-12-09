import React, { useState, useRef, useEffect } from 'react';
import { Button, Card, Form, InputGroup, Spinner } from 'react-bootstrap';
// Sử dụng thư viện icon cũ hoặc thay bằng lucide-react nếu bạn muốn đồng bộ
import { ChatDots, Send, X, Robot } from 'react-bootstrap-icons'; 
import api from '../api'; 

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Xin chào! Mình có thể giúp gì cho bạn? (VD: Tư vấn size, Check hàng...)", isBot: true }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef(null);

  // Tự động cuộn xuống tin nhắn mới nhất
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // 1. Thêm tin nhắn người dùng vào khung chat
    const userMsg = { text: inputValue, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 2. Gọi API Backend (Đã sửa đường dẫn thành /webhook/chat)
      // Lưu ý: Đảm bảo server.js đã khai báo app.use('/api/webhook', webhookRoutes)
      const { data } = await api.post('/webhook/chat', { message: userMsg.text });
      
      // 3. Thêm tin nhắn Bot trả lời vào khung chat
      const botMsg = { text: data.reply, isBot: true };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chatbot Error:", error);
      setMessages(prev => [...prev, { text: "Xin lỗi, server đang bận. Bạn thử lại sau nhé!", isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {/* Nút bật/tắt Chatbot */}
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

      {/* Cửa sổ Chat */}
      {isOpen && (
        <Card className="shadow-lg border-0" style={{ width: '350px', height: '500px', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center py-3">
                <div className="d-flex align-items-center gap-2">
                    <Robot size={24} />
                    <span className="fw-bold">Trợ lý ảo AI</span>
                </div>
                <Button variant="link" className="text-white p-0" onClick={() => setIsOpen(false)}>
                    <X size={28} />
                </Button>
            </Card.Header>

            {/* Body (List tin nhắn) */}
            <Card.Body className="flex-grow-1 overflow-auto bg-light" style={{ padding: '15px' }}>
                {messages.map((msg, index) => (
                    <div key={index} className={`d-flex mb-3 ${msg.isBot ? 'justify-content-start' : 'justify-content-end'}`}>
                        {msg.isBot && (
                            <div className="bg-white rounded-circle p-1 me-2 shadow-sm" style={{width: 32, height: 32, alignSelf: 'end'}}>
                                <Robot className="text-primary m-1"/> 
                            </div>
                        )}
                        <div 
                            className={`p-3 rounded-3 shadow-sm ${msg.isBot ? 'bg-white text-dark' : 'bg-primary text-white'}`}
                            style={{ maxWidth: '80%', fontSize: '0.95rem' }}
                        >
                            {/* Hỗ trợ hiển thị in đậm (từ Dialogflow trả về) */}
                            {msg.text.split('\n').map((line, i) => (
                                <div key={i} dangerouslySetInnerHTML={{ 
                                    __html: line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
                                }} />
                            ))}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="text-start text-muted ms-5 small">
                        <Spinner animation="dots" size="sm" /> AI đang nhập...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </Card.Body>

            {/* Footer (Input) */}
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