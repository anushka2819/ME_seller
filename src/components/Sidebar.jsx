import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  ClipboardList, 
  ReceiptText,
  BarChart3, 
  Settings, 
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';
import { getSellerSession, logoutSeller } from '../utils/auth';

const Sidebar = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [seller, setSeller] = useState(null);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSellerSession();
        setSeller(session);
      } catch (err) {
        console.error("Sidebar session error:", err);
      }
    };
    fetchSession();
  }, [location]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'My Products', path: '/products', icon: ShoppingBag },
    { name: 'Orders', path: '/orders', icon: ClipboardList },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Shop Settings', path: '/settings', icon: Settings },
  ];

  const handleNav = (path) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleLogoutClick = async () => {
    try {
      await logoutSeller();
      if (onLogout) onLogout();
      navigate('/auth');
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <img src="/brand/logo.jpeg" alt="ME" className="mobile-logo-img" />
          <span className="logo-text">Seller</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="mobile-menu-btn">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo">
            <img src="/brand/logo.jpeg" alt="Mind Empowered Logo" className="brand-logo-img" />
            <div className="brand-title">
              <h3>Mind Empowered</h3>
              <span>Seller Hub</span>
            </div>
          </div>
        </div>

        {seller && (
          <div className="sidebar-profile">
            {seller.logo ? (
              <img src={seller.logo} alt={seller.shopName} className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar">
                {seller.shopName ? seller.shopName.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <div className="profile-info">
              <h4>{seller.shopName}</h4>
              <span>{seller.ownerName}</span>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          <ul>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <ul key={item.name}>
                  <button 
                    onClick={() => handleNav(item.path)} 
                    className={`nav-link ${isActive ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.name}</span>
                  </button>
                </ul>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? (
              <>
                <Moon size={18} />
                <span>Dark Mode</span>
              </>
            ) : (
              <>
                <Sun size={18} />
                <span>Light Mode</span>
              </>
            )}
          </button>
          
          <button onClick={handleLogoutClick} className="logout-btn">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* CSS Styles for Sidebar (scoped specifically within CSS but kept simple here) */}
      <style>{`
        .mobile-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 60px;
          background: var(--bg-sidebar);
          color: var(--text-sidebar);
          padding: 0 1.5rem;
          align-items: center;
          justify-content: space-between;
          z-index: 1000;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .mobile-logo {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .logo-me {
          background: var(--accent);
          color: white;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 4px;
        }
        
        .logo-text {
          font-family: 'Montserrat', sans-serif;
          font-weight: 700;
        }
        
        .mobile-menu-btn {
          color: var(--text-sidebar);
        }

        .sidebar {
          position: fixed;
          top: 0;
          bottom: 0;
          left: 0;
          width: var(--sidebar-width);
          background: var(--bg-sidebar);
          color: var(--text-sidebar);
          display: flex;
          flex-direction: column;
          z-index: 999;
          transition: transform 0.3s ease;
          border-right: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .sidebar-brand {
          padding: 1.5rem 1.25rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        
        .brand-logo-img {
          width: 42px;
          height: 42px;
          border-radius: 8px;
          object-fit: cover;
          border: 1.5px solid var(--accent);
        }

        .mobile-logo-img {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--accent);
        }
        
        .brand-title h3 {
          font-size: 1.05rem;
          color: white;
          font-family: 'Montserrat', sans-serif;
        }
        
        .brand-title span {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          display: block;
        }
        
        .sidebar-profile {
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        
        .profile-avatar, .profile-avatar-img {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent-soft);
          border: 2px solid var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          color: var(--accent);
          font-size: 1.1rem;
          object-fit: cover;
        }
        
        .profile-info h4 {
          font-size: 0.9rem;
          color: white;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 150px;
        }
        
        .profile-info span {
          font-size: 0.75rem;
          color: rgba(255, 255, 255, 0.5);
          display: block;
        }
        
        .sidebar-nav {
          flex: 1;
          padding: 1.5rem 1rem;
          overflow-y: auto;
        }
        
        .sidebar-nav ul {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .nav-link {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.85rem 1rem;
          border-radius: 8px;
          color: rgba(255, 255, 255, 0.7);
          font-weight: 500;
          font-size: 0.95rem;
          text-align: left;
        }
        
        .nav-link:hover {
          background: var(--bg-sidebar-hover);
          color: white;
        }
        
        .nav-link.active {
          background: var(--accent);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 118, 18, 0.2);
        }
        
        .sidebar-footer {
          padding: 1rem;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .theme-toggle, .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.6);
          text-align: left;
        }
        
        .theme-toggle:hover, .logout-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }
        
        .logout-btn:hover {
          color: var(--danger);
          background: rgba(239, 68, 68, 0.1);
        }

        @media (max-width: 991px) {
          .mobile-header {
            display: flex;
          }
          
          .sidebar {
            transform: translateX(-100%);
            top: 60px;
          }
          
          .sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
