import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommunitiesSidebar from './AdminCommunitiesSidebar';
import { getSellerSession, logoutSeller } from '../utils/auth';
import { ShieldCheck, UserCog, LogOut, Mail, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminCommunitiesLayout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [showAdminDropdown, setShowAdminDropdown] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSellerSession();
        if (!session) {
          navigate('/auth');
        } else if (!session.is_admin) {
          setForbidden(true);
        } else {
          setAdmin(session);
        }
      } catch (err) {
        console.error("Admin layout session error:", err);
        navigate('/auth');
      }
    };
    fetchSession();
  }, [navigate]);

  if (forbidden) {
    return (
      <div className="layout-forbidden">
        <div className="forbidden-card">
          <div className="lock-icon-wrapper">
            <span style={{ fontSize: '3rem' }}>🔒</span>
          </div>
          <h2>Access Denied</h2>
          <p>You require Super Admin privileges to access the Communities Admin Dashboard.</p>
          <div className="button-group">
            <button className="nav-btn-home" onClick={() => navigate('/')}>
              Go to Seller Dashboard
            </button>
            <button className="nav-btn-logout" onClick={async () => {
              await logoutSeller();
              if (onLogout) onLogout();
              navigate('/auth');
            }}>
              Sign Out
            </button>
          </div>
        </div>
        <style>{`
          .layout-forbidden {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            padding: 2rem;
          }
          .forbidden-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: 16px;
            padding: 3rem;
            max-width: 460px;
            text-align: center;
            box-shadow: var(--shadow-hover);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1.5rem;
          }
          .lock-icon-wrapper {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.1);
            color: #EF4444;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .forbidden-card h2 {
            font-size: 1.8rem;
            color: var(--text-primary);
            margin: 0;
          }
          .forbidden-card p {
            color: var(--text-secondary);
            font-size: 0.95rem;
            line-height: 1.6;
            margin: 0;
          }
          .button-group {
            display: flex;
            gap: 1rem;
            width: 100%;
            margin-top: 1rem;
          }
          .nav-btn-home {
            flex: 1;
            padding: 0.75rem;
            background: var(--accent);
            color: white;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(255, 118, 18, 0.2);
          }
          .nav-btn-home:hover {
            background: var(--accent-hover);
          }
          .nav-btn-logout {
            padding: 0.75rem 1.25rem;
            border: 1px solid var(--border);
            color: var(--text-primary);
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
          .nav-btn-logout:hover {
            background: rgba(0, 0, 0, 0.02);
            color: var(--danger);
            border-color: var(--danger);
          }
        `}</style>
      </div>
    );
  }

  if (!admin) {
    return (
      <div className="layout-loading">
        <div className="loading-branding">
          <div style={{ width: '80px', height: '80px', borderRadius: '16px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <UserCog size={40} />
          </div>
          <p>Verifying Admin Session...</p>
        </div>
        <style>{`
          .layout-loading {
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
          }
          .loading-branding {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
          }
          .loading-branding p {
            font-size: 0.9rem;
            color: var(--text-secondary);
            font-weight: 500;
            letter-spacing: 0.05em;
            animation: pulse 1.5s infinite ease-in-out;
          }
          @keyframes pulse {
            0%, 100% { opacity: 0.6; }
            50% { opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <AdminCommunitiesSidebar onLogout={onLogout} />

      <div className="dashboard-main-content">
        {/* Top bar header */}
        <header className="dashboard-topbar">
          <div className="topbar-welcome">
            <span className="badge badge-warning" style={{ background: 'rgba(255, 154, 68, 0.1)', color: '#ff9a44', padding: '0.4rem 0.8rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', fontWeight: '600' }}>
              <ShieldCheck size={16} /> Community Admin
            </span>
          </div>

          <div className="topbar-actions">
            <div style={{ position: 'relative' }}>
              <div 
                className="topbar-profile" 
                style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px' }}
                onClick={() => setShowAdminDropdown(!showAdminDropdown)}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{admin.ownerName || 'Admin'}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Super Admin</div>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                  {admin.ownerName ? admin.ownerName.charAt(0).toUpperCase() : 'A'}
                </div>
              </div>

              <AnimatePresence>
                {showAdminDropdown && (
                  <motion.div 
                    className="admin-dropdown card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="admin-dropdown-header">
                      <h4>Admin Details</h4>
                    </div>
                    <div className="admin-dropdown-body">
                      <div className="admin-detail-item">
                        <Store size={16} className="detail-icon" />
                        <span><strong>Shop:</strong> {admin.shopName || 'N/A'}</span>
                      </div>
                      {admin.email && (
                        <div className="admin-detail-item">
                          <Mail size={16} className="detail-icon" />
                          <span><strong>Email:</strong> {admin.email}</span>
                        </div>
                      )}
                    </div>
                    <div className="admin-dropdown-footer">
                      <button 
                        className="logout-btn" 
                        onClick={async () => {
                          await logoutSeller();
                          if (onLogout) onLogout();
                          navigate('/auth');
                        }}
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page body */}
        <main className="dashboard-page-body">
          {children}
        </main>
      </div>

      <style>{`
        .dashboard-main-content {
          flex: 1;
          margin-left: var(--sidebar-width, 260px);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background-color: var(--bg-primary);
        }

        .dashboard-topbar {
          height: 70px;
          background: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .dashboard-page-body {
          flex: 1;
          padding: 2rem;
          overflow-y: auto;
        }

        @media (max-width: 991px) {
          .dashboard-main-content {
            margin-left: 0;
            padding-top: 60px; /* Space for mobile menu topbar */
          }
          
          .dashboard-topbar {
            padding: 0 1rem;
          }
          
          .dashboard-page-body {
            padding: 1.25rem;
          }
        }
        .topbar-profile:hover {
          background-color: var(--bg-primary);
        }

        .admin-dropdown {
          position: absolute;
          top: 120%;
          right: 0;
          width: 260px;
          padding: 0;
          z-index: 1000;
          overflow: hidden;
        }

        .admin-dropdown-header {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          background-color: var(--bg-primary);
        }

        .admin-dropdown-header h4 {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .admin-dropdown-body {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }

        .admin-detail-item {
          display: flex;
          align-items: center;
          gap: 0.8rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
        
        .admin-detail-item .detail-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .admin-dropdown-footer {
          padding: 0.8rem 1rem;
          border-top: 1px solid var(--border);
          background-color: var(--bg-primary);
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.6rem;
          background: var(--danger-soft);
          color: var(--danger);
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 0.85rem;
          transition: var(--transition);
        }

        .logout-btn:hover {
          background: var(--danger);
          color: white;
        }
      `}</style>
    </div>
  );
};

export default AdminCommunitiesLayout;
