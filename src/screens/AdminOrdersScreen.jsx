import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Search, Calendar, User, CheckCircle,
  Truck, Box, IndianRupee, Store, RefreshCw, ExternalLink,
  ChevronRight
} from 'lucide-react';
import { getAllOrders, getAllSellers } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';

// ─── Status configuration ────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Processing:  { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: <Box size={12} /> },
  Pending:     { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  icon: <Box size={12} /> },
  Packed:      { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)',  icon: <Box size={12} /> },
  Shipped:     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  icon: <Truck size={12} /> },
  'In Transit':{ color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)',  icon: <Truck size={12} /> },
  Delivered:   { color: '#10B981', bg: 'rgba(16,185,129,0.12)',  icon: <CheckCircle size={12} /> },
};

const getStatusStyle = (status) =>
  STATUS_CONFIG[status] || { color: '#6B7280', bg: 'rgba(107,114,128,0.12)', icon: null };

const STATUS_TABS = ['All', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Delivered'];

const AdminOrdersScreen = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');

  const loadData = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [allOrders, allSellers] = await Promise.all([
        getAllOrders(),
        getAllSellers(),
      ]);
      setOrders(allOrders);
      setSellers(allSellers);
    } catch (err) {
      console.error('Error loading platform orders:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // ─── Computed values ───────────────────────────────────────────────────────
  const sellerMap = Object.fromEntries(sellers.map(s => [s.id, s.shop_name || 'Unknown']));

  const enriched = orders.map(o => ({
    ...o,
    sellerName: sellerMap[o.seller_id] || 'Unknown NGO',
    itemCount: Array.isArray(o.items)
      ? o.items.reduce((s, i) => s + (i.quantity || 1), 0)
      : 0,
  }));

  const filtered = enriched.filter(o => {
    const matchTab = activeTab === 'All' || o.fulfillment_status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      (o.id || '').toLowerCase().includes(q) ||
      (o.customer_name || '').toLowerCase().includes(q) ||
      (o.customer_email || '').toLowerCase().includes(q) ||
      o.sellerName.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  // Tab counts
  const countFor = (tab) =>
    tab === 'All'
      ? orders.length
      : orders.filter(o => o.fulfillment_status === tab).length;

  const totalRevenue = orders
    .filter(o => ['Delivered', 'Shipped'].includes(o.fulfillment_status))
    .reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);

  return (
    <div className="admin-orders-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-icon"><ClipboardList size={22} /></div>
        <div style={{ flex: 1 }}>
          <h2 className="page-title">Platform Orders</h2>
          <p className="page-subtitle">
            Monitor and review all purchase orders across every registered NGO.
          </p>
        </div>
        <button
          className={`btn-refresh ${isRefreshing ? 'spinning' : ''}`}
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          title="Refresh orders"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : (
        <>
          {/* ── KPI Strip ──────────────────────────────────────────────────── */}
          <div className="kpi-strip">
            {[
              { label: 'Total Orders',      value: orders.length,           color: 'accent',  icon: <ClipboardList size={20} /> },
              { label: 'Processing/Packed', value: countFor('Processing') + countFor('Packed'), color: 'warning', icon: <Box size={20} /> },
              { label: 'In Transit',        value: countFor('Shipped') + countFor('In Transit'), color: 'info',    icon: <Truck size={20} /> },
              { label: 'Delivered',         value: countFor('Delivered'),   color: 'success', icon: <CheckCircle size={20} /> },
              { label: 'Completed GMV',     value: `₹${totalRevenue.toLocaleString('en-IN')}`, color: 'purple', icon: <IndianRupee size={20} /> },
            ].map((k, i) => (
              <motion.div
                key={k.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`kpi-chip kpi-${k.color}`}
              >
                <div className={`kpi-chip-icon ${k.color}`}>{k.icon}</div>
                <div>
                  <p className="kpi-chip-label">{k.label}</p>
                  <p className="kpi-chip-value">{k.value}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Filters ────────────────────────────────────────────────────── */}
          <div className="controls-card">
            {/* Status Tabs */}
            <div className="tab-row">
              {STATUS_TABS.map(tab => {
                const cnt = countFor(tab);
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`tab-pill ${activeTab === tab ? 'active' : ''}`}
                  >
                    {tab}
                    <span className="tab-badge">{cnt}</span>
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="search-row">
              <Search size={17} className="search-icon" />
              <input
                type="text"
                placeholder="Search by order ID, buyer name, email, or NGO…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
              {search && (
                <button className="clear-search" onClick={() => setSearch('')}>✕</button>
              )}
            </div>
          </div>

          {/* ── Orders Table ───────────────────────────────────────────────── */}
          <div className="table-card">
            <div className="table-head-bar">
              <span className="table-count">
                {filtered.length} order{filtered.length !== 1 ? 's' : ''}
                {activeTab !== 'All' ? ` · ${activeTab}` : ''}
                {search ? ` matching "${search}"` : ''}
              </span>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>NGO / Seller</th>
                    <th>Customer</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <AnimatePresence mode="wait">
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="empty-row">
                          <ClipboardList size={32} style={{ opacity: 0.25, marginBottom: '0.5rem' }} />
                          <div>No orders found{activeTab !== 'All' ? ` with status "${activeTab}"` : ''}.</div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((order, i) => {
                        const s = getStatusStyle(order.fulfillment_status);
                        const shortId = (order.id || '').split('-')[0].toUpperCase();
                        return (
                          <motion.tr
                            key={order.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className={i % 2 === 1 ? 'row-alt' : ''}
                          >
                            <td>
                              <span className="order-id">#{shortId}</span>
                            </td>
                            <td>
                              <div className="date-cell">
                                <Calendar size={13} />
                                {new Date(order.created_at).toLocaleDateString('en-IN', {
                                  day: '2-digit', month: 'short', year: 'numeric'
                                })}
                              </div>
                            </td>
                            <td>
                              <div className="shop-cell">
                                <div className="mini-avatar">{order.sellerName.charAt(0)}</div>
                                <span className="shop-name-text">{order.sellerName}</span>
                              </div>
                            </td>
                            <td>
                              <div className="customer-cell">
                                <span className="customer-name">{order.customer_name || '—'}</span>
                                {order.customer_email && (
                                  <span className="customer-email">{order.customer_email}</span>
                                )}
                              </div>
                            </td>
                            <td className="text-center">
                              <span className="items-badge">{order.itemCount}</span>
                            </td>
                            <td className="text-bold">
                              ₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}
                            </td>
                            <td>
                              <span
                                className="status-pill"
                                style={{ background: s.bg, color: s.color }}
                              >
                                {s.icon}
                                {order.fulfillment_status || 'Pending'}
                              </span>
                            </td>
                            <td>
                              <button
                                className="btn-view"
                                onClick={() => navigate(`/orders/${order.id}`)}
                                title="View order details"
                              >
                                <ChevronRight size={16} />
                              </button>
                            </td>
                          </motion.tr>
                        );
                      })
                    )}
                  </tbody>
                </AnimatePresence>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        .admin-orders-screen {
          display: flex;
          flex-direction: column;
          gap: 1.75rem;
          padding-bottom: 3rem;
        }

        /* ── Header ──────────────────────────────── */
        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .page-header-icon {
          width: 48px; height: 48px;
          border-radius: 12px;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .page-title {
          font-size: 1.7rem;
          font-weight: 800;
          font-family: 'Montserrat', sans-serif;
          margin: 0 0 0.2rem 0;
          background: linear-gradient(135deg, var(--me-maroon), var(--me-orange));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .page-subtitle {
          color: var(--text-secondary);
          font-size: 0.9rem;
          margin: 0;
        }

        .btn-refresh {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
          flex-shrink: 0;
        }

        .btn-refresh:hover { color: var(--accent); border-color: var(--accent); }
        .btn-refresh.spinning svg { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* ── KPI Strip ───────────────────────────── */
        .kpi-strip {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 1rem;
        }

        .kpi-chip {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.1rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          border-left: 4px solid transparent;
          transition: var(--transition);
        }

        .kpi-chip:hover { transform: translateY(-2px); box-shadow: var(--shadow-hover); }

        .kpi-chip.kpi-accent  { border-left-color: var(--accent); }
        .kpi-chip.kpi-warning { border-left-color: var(--warning); }
        .kpi-chip.kpi-info    { border-left-color: #3B82F6; }
        .kpi-chip.kpi-success { border-left-color: var(--success); }
        .kpi-chip.kpi-purple  { border-left-color: #8B5CF6; }

        .kpi-chip-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-chip-icon.accent  { background: var(--accent-soft);         color: var(--accent);  }
        .kpi-chip-icon.warning { background: var(--warning-soft);         color: var(--warning); }
        .kpi-chip-icon.info    { background: rgba(59,130,246,0.12);       color: #3B82F6; }
        .kpi-chip-icon.success { background: var(--success-soft);         color: var(--success); }
        .kpi-chip-icon.purple  { background: rgba(139,92,246,0.12);       color: #8B5CF6; }

        .kpi-chip-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin: 0 0 0.15rem 0;
        }

        .kpi-chip-value {
          font-size: 1.2rem;
          font-weight: 800;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
          margin: 0;
        }

        /* ── Controls Card ───────────────────────── */
        .controls-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.25rem 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: var(--shadow);
        }

        .tab-row {
          display: flex;
          gap: 0.4rem;
          overflow-x: auto;
          padding-bottom: 0.1rem;
        }

        .tab-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.45rem 0.9rem;
          border-radius: 20px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-secondary);
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.18s;
        }

        .tab-pill:hover {
          border-color: var(--accent);
          color: var(--accent);
        }

        .tab-pill.active {
          background: var(--accent);
          border-color: var(--accent);
          color: white;
        }

        .tab-badge {
          background: rgba(255,255,255,0.25);
          padding: 0.05rem 0.4rem;
          border-radius: 10px;
          font-size: 0.72rem;
        }

        .tab-pill.active .tab-badge {
          background: rgba(255,255,255,0.3);
          color: white;
        }

        .tab-pill:not(.active) .tab-badge {
          background: var(--bg-primary);
          color: var(--text-secondary);
        }

        .search-row {
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .search-input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 2.75rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.9rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .search-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(255,118,18,0.08);
        }

        .clear-search {
          position: absolute;
          right: 1rem;
          color: var(--text-secondary);
          cursor: pointer;
          background: none;
          border: none;
          font-size: 0.85rem;
        }

        /* ── Orders Table ────────────────────────── */
        .table-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .table-head-bar {
          padding: 1rem 1.5rem;
          border-bottom: 1px solid var(--border);
          background: rgba(0,0,0,0.01);
        }

        .table-count {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .table-responsive { overflow-x: auto; }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th,
        .data-table td {
          padding: 1rem 1.25rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          font-weight: 700;
          background: rgba(0,0,0,0.015);
        }

        .data-table td { font-size: 0.88rem; color: var(--text-primary); }

        .row-alt td { background: rgba(0,0,0,0.015); }
        .data-table tr:last-child td { border-bottom: none; }
        .data-table tr:hover td { background: rgba(255,118,18,0.03); }

        .order-id {
          font-family: 'Courier New', monospace;
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--accent);
          background: var(--accent-soft);
          padding: 0.15rem 0.5rem;
          border-radius: 6px;
        }

        .date-cell {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          color: var(--text-secondary);
          font-size: 0.82rem;
        }

        .shop-cell {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }

        .mini-avatar {
          width: 30px;
          height: 30px;
          border-radius: 6px;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.9rem;
          flex-shrink: 0;
        }

        .shop-name-text { font-weight: 600; font-size: 0.88rem; }

        .customer-cell {
          display: flex;
          flex-direction: column;
          gap: 0.1rem;
        }

        .customer-name { font-weight: 600; }

        .customer-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .text-center { text-align: center; }

        .items-badge {
          display: inline-block;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 0.1rem 0.5rem;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .text-bold { font-weight: 700; }

        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-size: 0.76rem;
          font-weight: 700;
          white-space: nowrap;
        }

        .btn-view {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.15s;
        }

        .btn-view:hover {
          border-color: var(--accent);
          color: var(--accent);
          background: var(--accent-soft);
        }

        .empty-row {
          text-align: center;
          padding: 3.5rem !important;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
};

export default AdminOrdersScreen;
