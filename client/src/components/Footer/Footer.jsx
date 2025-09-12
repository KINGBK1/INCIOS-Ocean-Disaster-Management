import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>INCIOS Ocean Management</h3>
          <p>
            Advanced ocean disaster management and monitoring system for coastal safety and maritime security.
          </p>
          <p>
            Empowering communities with real-time disaster alerts and comprehensive emergency response coordination.
          </p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/alerts">Live Alerts</a></li>
            <li><a href="/reports">Emergency Reports</a></li>
            <li><a href="/resources">Resources</a></li>
            <li><a href="/contact">Contact Support</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Emergency Services</h3>
          <ul>
            <li><a href="tel:112">Emergency: 112</a></li>
            <li><a href="tel:1078">Coast Guard: 1078</a></li>
            <li><a href="tel:101">Fire Service: 101</a></li>
            <li><a href="tel:108">Ambulance: 108</a></li>
            <li><a href="/emergency-contacts">All Emergency Contacts</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Government Partnerships</h3>
          <ul>
            <li><a href="https://ndma.gov.in" target="_blank" rel="noopener noreferrer">NDMA</a></li>
            <li><a href="https://incois.gov.in" target="_blank" rel="noopener noreferrer">INCOIS</a></li>
            <li><a href="https://www.indiancoastguard.gov.in" target="_blank" rel="noopener noreferrer">Indian Coast Guard</a></li>
            <li><a href="https://moes.gov.in" target="_blank" rel="noopener noreferrer">Ministry of Earth Sciences</a></li>
            <li><a href="https://dmi.gov.in" target="_blank" rel="noopener noreferrer">Disaster Management</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; 2025 INCIOS Ocean Disaster Management System. All rights reserved.</p>
        <p>Developed for the safety and security of coastal communities across India.</p>
      </div>
    </footer>
  );
};

export default Footer;
