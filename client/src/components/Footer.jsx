function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logos">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="22" stroke="#8B1A1A" strokeWidth="1.5" fill="rgba(139,26,26,0.05)"/>
          <text x="24" y="18" textAnchor="middle" fill="#8B1A1A" fontSize="9" fontWeight="700" fontFamily="serif">WCE</text>
          <text x="24" y="28" textAnchor="middle" fill="#8B1A1A" fontSize="6" fontWeight="400" fontFamily="serif">SANGLI</text>
          <text x="24" y="36" textAnchor="middle" fill="rgba(139,26,26,0.5)" fontSize="4.5" fontFamily="serif">EST. 1947</text>
        </svg>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="4" y="4" width="40" height="40" rx="6" stroke="#8B1A1A" strokeWidth="1.5" fill="rgba(139,26,26,0.05)"/>
          <text x="24" y="18" textAnchor="middle" fill="#8B1A1A" fontSize="10" fontWeight="800" fontFamily="sans-serif">75</text>
          <text x="24" y="27" textAnchor="middle" fill="#8B1A1A" fontSize="5.5" fontWeight="600" fontFamily="sans-serif">YEARS</text>
          <text x="24" y="35" textAnchor="middle" fill="#D4A843" fontSize="5" fontWeight="700" fontFamily="serif">WCE</text>
        </svg>
      </div>
      <div className="footer-college">Walchand College of Engineering, Sangli</div>
      <div className="footer-portal">Spot Admission Management Portal · Office of Admissions</div>
      <div className="footer-contact">
        Have any queries? <a href="mailto:admissions@walchandsangli.ac.in">Contact WCE Administration</a>
      </div>
    </footer>
  );
}

export default Footer;
