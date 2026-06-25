import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import { getSellerSession } from '../utils/auth';
import { getNotifications, markNotificationAsRead, clearAllNotifications as clearAllDbNotifications } from '../utils/notifications';
import { supabase } from '../utils/supabaseClient';
import { Bell, ShoppingBag, ShieldCheck } from 'lucide-react';

// Helper for relative time
const timeAgo = (dateString) => {
  const diff = Math.floor((new Date() - new Date(dateString)) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} mins ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
  return `${Math.floor(diff / 86400)} days ago`;
};

const DashboardLayout = ({ children, onLogout }) => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  
  // Notification states
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const clearAllNotifications = async (e) => {
    e.stopPropagation();
    if (seller) await clearAllDbNotifications(seller.id);
    setNotifications([]);
    setHasUnread(false);
  };

  const handleNotificationClick = async (notif) => {
    setShowNotifications(false);
    if (!notif.is_read && seller) {
      await markNotificationAsRead(seller.id, notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
      setHasUnread(notifications.some(n => n.id !== notif.id && !n.is_read));
    }
    if (notif.path) {
      navigate(notif.path);
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const session = await getSellerSession();
        if (!session) {
          navigate('/auth');
        } else {
          setSeller(session);
        }
      } catch (err) {
        console.error("Dashboard session error:", err);
        navigate('/auth');
      }
    };
    fetchSession();
  }, [navigate]);

  // Fetch notifications & setup realtime ONLY after seller is loaded
  useEffect(() => {
    if (!seller) return;

    let channel;
    const loadNotifications = async () => {
      const notifs = await getNotifications(seller.id);
      setNotifications(notifs);
      setHasUnread(notifs.some(n => !n.is_read));
    };
    loadNotifications();

    // Realtime subscription for new notifications
    channel = supabase
      .channel('seller_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'marketplace_dataspace', table: 'shop_notifications', filter: `seller_id=eq.${seller.id}` },
        (payload) => {
          setNotifications(current => [payload.new, ...current]);
          setHasUnread(true);
        }
      )
      .subscribe();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [seller]);

  if (!seller) {
    return (
      <div className="layout-loading">
        <div className="loading-branding">
          <img src="/brand/logo.gif" alt="Mind Empowered Logo" className="loading-logo-gif" />
          <p>Verifying Shop Session...</p>
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
          .loading-logo-gif {
            width: 80px;
            height: 80px;
            border-radius: 16px;
            border: 2px solid var(--accent);
            box-shadow: var(--shadow-hover);
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
      <Sidebar onLogout={onLogout} />
      
      <div className="dashboard-main-content">
        {/* Top bar header */}
        <header className="dashboard-topbar">
          <div className="topbar-welcome">
            <span className="badge badge-info">
              <ShieldCheck size={14} style={{ marginRight: '4px' }} /> Verified Seller
            </span>
          </div>
          
          <div className="topbar-actions">
            <div className="topbar-stat">
              <span className="stat-label">Payout Balance</span>
              <span className="stat-value">₹{seller.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            
            <div className="notifications-dropdown-container">
              <button 
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setHasUnread(false);
                }} 
                className="topbar-icon-btn" 
                title="Notifications"
              >
                <Bell size={20} />
                {hasUnread && <span className="notification-indicator"></span>}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    className="notifications-dropdown card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="dropdown-header">
                      <h4>Shop Alerts</h4>
                      <button onClick={clearAllNotifications} className="clear-all-btn">
                        Clear All
                      </button>
                    </div>
                    <div className="dropdown-body">
                      {notifications.length === 0 ? (
                        <p className="no-notifications-text">No new shop notifications.</p>
                      ) : (
                        notifications.map(notif => (
                          <div 
                            key={notif.id} 
                            className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                            onClick={() => handleNotificationClick(notif)}
                          >
                            <span className="item-time">{timeAgo(notif.created_at)}</span>
                            <p>{notif.message}</p>
                          </div>
                        ))
                      )}
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
          margin-left: var(--sidebar-width);
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

        .topbar-stat {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .stat-value {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--accent);
          font-family: 'Montserrat', sans-serif;
        }

        .topbar-icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          color: var(--text-primary);
          position: relative;
          border: 1px solid var(--border);
        }

        .topbar-icon-btn:hover {
          background: var(--border);
        }

        .notification-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          width: 8px;
          height: 8px;
          background-color: var(--me-orange);
          border-radius: 50%;
          border: 1.5px solid var(--bg-secondary);
        }

        .notifications-dropdown-container {
          position: relative;
        }

        .notifications-dropdown {
          position: absolute;
          top: 50px;
          right: 0;
          width: 320px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: var(--shadow-hover);
          z-index: 1000;
          padding: 0 !important;
          overflow: hidden;
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          background: var(--bg-primary);
        }

        .dropdown-header h4 {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .clear-all-btn {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--accent);
        }

        .clear-all-btn:hover {
          color: var(--accent-hover);
        }

        .dropdown-body {
          max-height: 250px;
          overflow-y: auto;
        }

        .notification-item {
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.8rem;
          cursor: pointer;
          transition: var(--transition);
          text-align: left;
        }

        .notification-item:hover {
          background: var(--bg-primary);
        }

        .notification-item.unread {
          background: rgba(255, 118, 18, 0.03);
          border-left: 3px solid var(--accent);
        }

        .item-time {
          font-size: 0.7rem;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 0.15rem;
        }

        .no-notifications-text {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem 1rem;
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

export default DashboardLayout;
