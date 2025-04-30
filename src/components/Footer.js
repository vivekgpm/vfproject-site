import React from 'react';
import './AppStyles.css'; // Import the centralized CSS file

const Footer = () => {
  return (
    <footer className='footer'>
      <p>&copy; {new Date().getFullYear()} Vachana Ventures Pvt ltd. All rights reserved.</p>
    </footer>
  );
};

export default Footer;