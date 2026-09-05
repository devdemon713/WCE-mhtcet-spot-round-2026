import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import LiveIndicator from './LiveIndicator';

function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { connected, clientsCount } = useSocket();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-top">
        <Link to="/" className="navbar-brand">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <circle cx="18" cy="18" r="17" stroke="white" strokeWidth="1.5" fill="rgba(255,255,255,0.1)"/>
            <text x="18" y="14" textAnchor="middle" fill="white" fontSize="7" fontWeight="700" fontFamily="serif">WCE</text>
            <text x="18" y="22" textAnchor="middle" fill="white" fontSize="4.5" fontWeight="400" fontFamily="serif">SANGLI</text>
            <text x="18" y="28" textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize="3.5" fontFamily="serif">EST. 1947</text>
          </svg>
          <div>
            <div>Walchand College of Engineering, Sangli</div>
            <div className="navbar-badge">Autonomous Institute · Government Aided</div>
          </div>
        </Link>

        <div className="navbar-links">
          <LiveIndicator connected={connected} clientsCount={clientsCount} />
          
          {!isAuthenticated ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              {isAdmin ? (
                <Link to="/admin">Admin Panel</Link>
              ) : (
                <Link to="/student">My Dashboard</Link>
              )}
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {user?.fullName}
              </span>
              <button onClick={handleLogout} className="btn-logout">Logout</button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
