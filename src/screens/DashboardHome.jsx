import React, { useState, useEffect } from 'react';
import SkeletonLoader from '../components/SkeletonLoader';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  IndianRupee, 
  ShoppingBag, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  PackageCheck
} from 'lucide-react';
import { getAnalyticsStats } from '../utils/storage';
import { getOrders } from '../utils/order';
import { getSellerSession } from '../utils/auth';
import { getProducts } from '../utils/product';

const DashboardHome = () => {
  const navigate = useNavigate();
  const [seller, setSeller] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch seller session
      const session = await getSellerSession();
      setSeller(session);

      // Fetch products
      const allProducts = await getProducts();
      
      // Fetch and sort recent orders (last 5)
      const allOrders = await getOrders();
      const sorted = [...allOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setRecentOrders(sorted.slice(0, 5));

      // Fetch dashboard statistics using both products and orders
      const metrics = getAnalyticsStats(allProducts, allOrders);
      setStats(metrics);

      // Fetch low stock items
      const lowStock = allProducts.filter(p => p.stock <= 5);
      setLowStockItems(lowStock);
    };

    fetchData();
  }, []);

  if (!stats) {
    return (
      <div className="dashboard-home">    
        <div className="dashboard-welcome-banner">
          <div>
            <div className="skeleton skeleton-title" style={{ width: '300px', height: '32px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '200px' }}></div>
          </div>
        </div>

        <div className="stats-grid">
          <SkeletonLoader type="card" count={4} />
        </div>

        <div className="dashboard-widgets-row">
          <div className="widget-card orders-widget">
             <div className="skeleton skeleton-title" style={{ width: '150px' }}></div>
             <SkeletonLoader type="table-row" count={3} />
          </div>
          <div className="widget-card inventory-widget">
             <div className="skeleton skeleton-title" style={{ width: '150px' }}></div>
             <SkeletonLoader type="card" count={1} />
          </div>
        </div>
      </div>
    );
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: 'easeOut'
      }
    })
  };

  return (
    <div className="dashboard-home">    
      <div className="dashboard-welcome-banner">
        <div>
          <h2>Welcome back to {seller ? seller.shopName : 'Your Marketplace'}</h2>
          <p>Here is your shop's performance overview for today.</p>
        </div>
        <div className="banner-date">
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="stats-grid">
        {[
          { 
            title: 'Total Revenue', 
            value: `₹${stats.totalEarnings.toLocaleString('en-IN')}`, 
            sub: 'From completed orders', 
            icon: IndianRupee,
            color: 'accent',
            action: () => navigate('/analytics')
          },
          { 
            title: 'Items Sold', 
            value: stats.totalItemsSold, 
            sub: 'Products delivered', 
            icon: PackageCheck,
            color: 'navy',
            action: () => navigate('/analytics')
          },
          { 
            title: 'Pending Fulfillment', 
            value: stats.pendingOrders, 
            sub: 'Requires attention', 
            icon: Clock,
            color: 'warning',
            action: () => navigate('/orders')
          },
          { 
            title: 'No Stock Items', 
            value: stats.outOfStockItems, 
            sub: 'Need restocking', 
            icon: AlertTriangle,
            color: stats.outOfStockItems > 0 ? 'danger' : 'success',
            action: () => navigate('/products')
          }
        ].map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div 
              key={card.title}
              custom={index}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="card stat-card"
              onClick={card.action}
            >
              <div className="stat-card-main">
                <div className="stat-card-details">
                  <span className="stat-title">{card.title}</span>
                  <h3 className="stat-value">{card.value}</h3>
                  <span className="stat-sub">{card.sub}</span>
                </div>
                <div className={`stat-card-icon-container color-${card.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="dashboard-visuals-grid">
        {/* Sales Chart Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="card chart-card"
        >
          <div className="chart-header">
            <div>
              <h3>Monthly Performance</h3>
              <p>Combined store revenue trend</p>
            </div>
            <span className="chart-badge">
              <TrendingUp size={14} /> +12.5%
            </span>
          </div>

          <div className="revenue-chart-container">
            <div className="bar-chart-visual">
              {stats.monthlyRevenue.map((item, idx) => {
                const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue));
                const barHeight = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
                
                return (
                  <div key={item.name} className="chart-column">
                    <div className="chart-column-bar-wrapper">
                      <motion.div 
                        className="chart-column-bar"
                        initial={{ height: 0 }}
                        animate={{ height: `${barHeight}%` }}
                        transition={{ duration: 1, delay: idx * 0.1, ease: 'easeOut' }}
                      >
                        <span className="chart-bar-value">₹{item.revenue.toLocaleString('en-IN')}</span>
                      </motion.div>
                    </div>
                    <span className="chart-column-label">{item.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="card stock-alert-card"
        >
          <div className="alert-card-header">
            <h3>Inventory Restock Alerts</h3>
            <button onClick={() => navigate('/products')} className="view-link">
              Inventory <ArrowRight size={14} />
            </button>
          </div>

          <div className="stock-alerts-list">
            {lowStockItems.length === 0 ? (
              <div className="no-alerts-placeholder">
                <PackageCheck size={36} className="placeholder-icon" />
                <p>All listings are well-stocked!</p>
              </div>
            ) : (
              lowStockItems.map(item => (
                <div key={item.id} className="stock-alert-item">
                  <div className="alert-item-info">
                    <h4>{item.name}</h4>
                    <span>Category: {item.category}</span>
                  </div>
                  <div className="alert-item-status">
                    <span className={`badge ${item.stock === 0 ? 'badge-danger' : 'badge-warning'}`}>
                      {item.stock === 0 ? 'Out of Stock' : `${item.stock} left`}
                    </span>
                    <button 
                      onClick={() => navigate('/products')} 
                      className="restock-action-btn"
                    >
                      Update
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* Recent Orders Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="card recent-orders-card"
      >
        <div className="card-header">
          <h3>Recent Customer Purchases</h3>
          <button onClick={() => navigate('/orders')} className="btn btn-secondary btn-sm">
            View All Orders
          </button>
        </div>

        <div className="table-responsive">
          <table className="recent-orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Purchaser</th>
                <th>Purchase Date</th>
                <th>Items Count</th>
                <th>Total Price</th>
                <th>Fulfillment</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-row">No orders received yet.</td>
                </tr>
              ) : (
                recentOrders.map(order => (
                  <tr key={order.id}>
                    <td className="order-id">{order.id.split('-')[0]}...</td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{order.customer_name}</span>
                        <span className="customer-email">{order.customer_email || order.customer_phone}</span>
                      </div>
                    </td>
                    <td>{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td>{order.items ? order.items.reduce((sum, item) => sum + item.quantity, 0) : 0} items</td>
                    <td className="order-amount">₹{parseFloat(order.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td>
                      <span className={`badge ${
                        order.fulfillment_status === 'Delivered' ? 'badge-success' :
                        order.fulfillment_status === 'Shipped' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {order.fulfillment_status}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => navigate('/orders')} 
                        className="btn-text-link"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <style>{`
        .dashboard-home {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .dashboard-welcome-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .dashboard-welcome-banner h2 {
          font-size: 1.75rem;
          color: var(--text-primary);
        }

        .dashboard-welcome-banner p {
          color: var(--text-secondary);
        }

        .banner-date {
          background: var(--bg-secondary);
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          cursor: pointer;
        }

        .stat-card-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .stat-card-details {
          display: flex;
          flex-direction: column;
        }

        .stat-title {
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .stat-value {
          font-size: 2rem;
          font-family: 'Montserrat', sans-serif;
          color: var(--text-primary);
          margin: 0.25rem 0;
        }

        .stat-sub {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .stat-card-icon-container {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .color-accent { background: var(--accent-soft); color: var(--accent); }
        .color-navy { background: rgba(10, 46, 92, 0.1); color: var(--me-navy); }
        .color-warning { background: var(--warning-soft); color: var(--warning); }
        .color-danger { background: var(--danger-soft); color: var(--danger); }
        .color-success { background: var(--success-soft); color: var(--success); }

        .dashboard-visuals-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 1200px) {
          .dashboard-visuals-grid {
            grid-template-columns: 1fr;
          }
        }

        .chart-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .chart-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: var(--success-soft);
          color: var(--success);
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .revenue-chart-container {
          height: 250px;
          position: relative;
          padding-top: 1rem;
        }

        .bar-chart-visual {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          height: 100%;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .chart-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          gap: 0.5rem;
        }

        .chart-column-bar-wrapper {
          flex: 1;
          width: 50%;
          max-width: 40px;
          display: flex;
          align-items: flex-end;
          position: relative;
        }

        .chart-column-bar {
          width: 100%;
          background: linear-gradient(to top, var(--me-maroon), var(--me-orange));
          border-radius: 6px 6px 0 0;
          position: relative;
          display: flex;
          justify-content: center;
          transition: background 0.3s;
        }

        .chart-column-bar:hover {
          background: linear-gradient(to top, var(--me-maroon), var(--accent-hover));
        }

        .chart-bar-value {
          position: absolute;
          top: -24px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 1px 4px;
          border-radius: 4px;
          opacity: 0;
          transform: translateY(5px);
          transition: opacity 0.2s, transform 0.2s;
          pointer-events: none;
        }

        .chart-column-bar:hover .chart-bar-value {
          opacity: 1;
          transform: translateY(0);
        }

        .chart-column-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .stock-alert-card {
          display: flex;
          flex-direction: column;
        }

        .alert-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .view-link {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          color: var(--accent);
          font-size: 0.85rem;
          font-weight: 600;
        }

        .view-link:hover {
          color: var(--accent-hover);
        }

        .stock-alerts-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          flex: 1;
          overflow-y: auto;
          max-height: 240px;
        }

        .no-alerts-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          height: 100%;
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem 0;
        }

        .placeholder-icon {
          color: var(--success);
          opacity: 0.6;
        }

        .stock-alert-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--bg-primary);
          border-radius: 10px;
          border: 1px solid var(--border);
        }

        .alert-item-info h4 {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .alert-item-info span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .alert-item-status {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .restock-action-btn {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--me-navy);
          text-decoration: underline;
        }

        .restock-action-btn:hover {
          color: var(--accent);
        }

        .recent-orders-card .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .table-responsive {
          overflow-x: auto;
          width: 100%;
        }

        .recent-orders-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .recent-orders-table th, 
        .recent-orders-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .recent-orders-table th {
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .order-id {
          font-weight: 700;
          color: var(--me-navy);
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
        }

        .customer-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .customer-email {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .order-amount {
          font-weight: 700;
        }

        .btn-text-link {
          color: var(--accent);
          font-weight: 700;
          font-size: 0.85rem;
        }

        .btn-text-link:hover {
          color: var(--accent-hover);
        }

        .empty-table-row {
          text-align: center;
          color: var(--text-secondary);
          padding: 2rem 0;
        }

        .loading-placeholder {
          height: 400px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
};

export default DashboardHome;
