import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminCommunitiesSidebar from './AdminCommunitiesSidebar';
import { getSellerSession, logoutSeller } from '../utils/auth';
import { ShieldCheck, UserCog } from 'lucide-react';

const AdminCommunitiesLayout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [showAdminMenu, setShowAdminMenu] = useState(false);

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

          <div className="topbar-actions" style={{ position: 'relative' }}>
            <div 
              className="topbar-profile" 
              onClick={() => setShowAdminMenu(!showAdminMenu)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.5rem', borderRadius: '8px', transition: 'background 0.2s', ...(showAdminMenu ? { background: 'var(--bg-primary)' } : {}) }}
            >
              <div style={{ textAlign: 'right', display: 'none', '@media(minWidth: 768px)': { display: 'block' } }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-primary)' }}>{admin.ownerName || 'Admin'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Super Admin</div>
              </div>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                {admin.ownerName ? admin.ownerName.charAt(0).toUpperCase() : 'A'}
              </div>
            </div>

            {/* Admin Details Dropdown */}
            {showAdminMenu && (
              <div className="admin-dropdown-menu" style={{ 
                position: 'absolute', 
                top: 'calc(100% + 5px)', 
                right: 0, 
                width: '280px', 
                background: 'var(--bg-secondary)', 
                borderRadius: '12px', 
                border: '1px solid var(--border)', 
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', 
                padding: '1.5rem',
                zIndex: 1000
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem', marginBottom: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold' }}>
                    {admin.ownerName ? admin.ownerName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>{admin.ownerName || 'Admin'}</h4>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'inline-block', background: 'rgba(255, 154, 68, 0.1)', color: '#ff9a44', padding: '0.2rem 0.5rem', borderRadius: '4px', marginTop: '0.3rem' }}>Super Admin</span>
                  </div>
                </div>
                
                <div style={{ marginBottom: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Email:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{admin.email || 'admin@marketplace.com'}</span>
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Role ID:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500', fontFamily: 'monospace' }}>{admin.id?.substring(0,8) || 'ADMIN_AUTH'}</span>
                  </p>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                    <span>Access Level:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>Global Management</span>
                  </p>
                </div>
              </div>
            )}
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
      `}</style>
    </div>
  );
};

export default AdminCommunitiesLayout;
