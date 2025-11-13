import React, { useState, useEffect } from 'react';
import { Button } from 'react-bootstrap';
import { ArrowUp } from 'react-bootstrap-icons';

// CSS cho nút scroll
const scrollTopStyle = {
  position: 'fixed',
  bottom: '20px',
  left: '20px',
  zIndex: 1050,
  opacity: 0.7,
  display: 'none', // Sẽ được kiểm soát bởi state
};

function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  // Hàm kiểm tra vị trí cuộn
  const toggleVisibility = () => {
    if (window.pageYOffset > 300) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  };

  // Hàm cuộn lên đầu
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Thêm event listener khi component được mount
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility);
    // Hủy listener khi component unmount
    return () => {
      window.removeEventListener('scroll', toggleVisibility);
    };
  }, []);

  return (
    <Button
      variant="secondary"
      className="rounded-circle"
      style={{ ...scrollTopStyle, display: isVisible ? 'inline-block' : 'none' }}
      onClick={scrollToTop}
    >
      <ArrowUp size={24} />
    </Button>
  );
}

export default ScrollToTopButton;