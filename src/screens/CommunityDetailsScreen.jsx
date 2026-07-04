import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, IndianRupee, PackageCheck, AlertTriangle, Store, Settings, AlertCircle,
  TrendingUp, Clock, Package, ShoppingCart, Search, Building, ShieldCheck
} from 'lucide-react';
import { getSellerDetails, processSellerPayout } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';
import Toast, { useToast } from '../components/Toast';

const colors = [
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #f83600, #f9d423)',
  'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  'linear-gradient(135deg, #667eea, #764ba2)'
];

const getGradient = (index) => colors[index % colors.length];

const getStringHash = (str) => {
  let hash = 0;
  if (!str) return hash;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const CommunityDetailsScreen = () => {
  const { communityId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [ngo, setNgo] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const { toast, showToast } = useToast();

  const loadDetails = async () => {
    setIsLoading(true);
    try {
      const data = await getSellerDetails(communityId);
      if (data) {
        const sellerProducts = data.products || [];
        const sellerOrders = data.orders || [];

        const itemsSold = sellerProducts.reduce((acc, p) => acc + (p.sales_count || 0), 0);
        const orderRevenue = sellerOrders
          .filter(o => o.fulfillment_status === 'Delivered' || o.fulfillment_status === 'Shipped')
          .reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
        const fallbackRevenue = sellerProducts.reduce((acc, p) => acc + (p.sales_count || 0) * (p.price || 0), 0);
        const revenue = orderRevenue || fallbackRevenue;

        const pendingOrders = sellerOrders.filter(o => o.fulfillment_status === 'Processing' || o.fulfillment_status === 'Pending').length;
        const lowStock = sellerProducts.filter(p => (p.stock || 0) <= 5).length;

        setNgo({
          ...data.seller,
          revenue,
          itemsSold,
          payoutBalance: data.seller.balance || 0,
          pendingOrders,
          lowStock,
          status: sellerProducts.length > 0 ? 'Active' : 'Onboarding',
          color: getGradient(getStringHash(data.seller.id))
        });
        setProducts(sellerProducts);
        setOrders(sellerOrders);
      }
    } catch (err) {
      console.error("Error loading NGO details:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (communityId) {
      loadDetails();
    }
  }, [communityId]);

  const handleProcessPayout = async () => {
    if (!ngo || ngo.payoutBalance <= 0) return;
    setIsProcessingPayout(true);
    try {
      await processSellerPayout(ngo.id);
      showToast(`Payout of ₹${ngo.payoutBalance.toLocaleString('en-IN')} processed for ${ngo.shopName}!`, 'success');
      await loadDetails();
    } catch (err) {
      console.error('Failed to process payout:', err);
      showToast('Error processing payout. Please try again.', 'error');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ padding: '2rem 0' }}>
        <SkeletonLoader type="card" count={3} />
      </div>
    );
  }

  if (!ngo) {
    return (
      <div className="not-found">
        <AlertCircle size={48} className="error-icon" />
        <h2>NGO Not Found</h2>
        <button onClick={() => navigate('/admin/communities')} className="back-navigation-btn">
          Back to Directory
        </button>
      </div>
    );
  }

  const filteredProducts = products.filter(p =>
    (p.name || '').toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category || '').toLowerCase().includes(productSearch.toLowerCase())
  );

  const filteredOrders = orders.filter(o =>
    (o.id || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase()) ||
    (o.customer_email || '').toLowerCase().includes(orderSearch.toLowerCase())
  );

  return (
    <div className="community-details">
      {/* Header Profile Section */}
      <button className="back-navigation-btn" style={{ marginBottom: '1.25rem' }} onClick={() => navigate('/admin/communities')}>
        <ArrowLeft size={18} /> Back to NGOs
      </button>

      <div className="details-header">

        <div className="banner" style={{ background: ngo.color }}>
        </div>

        <div className="profile-info-section">
          <div className="profile-avatar-large">
            {ngo.logo || ngo.shopName === 'Mind Empowered Crafts' ? (
              <img src={ngo.logo || "/brand/logo.gif"} alt={`${ngo.shopName} Logo`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '16px' }} />
            ) : (
              ngo.shopName.charAt(0)
            )}
          </div>
          <div className="profile-text">
            <div className="title-row">
              <h1 className="community-title">{ngo.shopName}</h1>
              <span className={`status-badge ${ngo.status.toLowerCase()}`}>{ngo.status}</span>
            </div>
            <p className="community-category">
              <Store size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {ngo.category} • Operated by {ngo.ownerName || 'N/A'} • Joined {new Date(ngo.createdAt).toLocaleDateString('en-GB')}
            </p>
          </div>
        </div>

        <div className="tabs-container">
          <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
            Overview
          </button>
          <button className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`} onClick={() => setActiveTab('products')}>
            <Package size={16} /> Products ({products.length})
          </button>
          <button className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')}>
            <ShoppingCart size={16} /> Orders ({orders.length})
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            {/* Analytics Overview */}
            <div className="analytics-grid">
              <div className="analytic-card">
                <div className="analytic-icon color-accent"><IndianRupee size={24} /></div>
                <div>
                  <p className="analytic-label">Total Revenue Generated</p>
                  <h4 className="analytic-value">₹{ngo.revenue.toLocaleString('en-IN')}</h4>
                  <span className="analytic-trend positive"><TrendingUp size={12} /> Live business earnings</span>
                </div>
              </div>

              <div className="analytic-card">
                <div className="analytic-icon color-success"><PackageCheck size={24} /></div>
                <div>
                  <p className="analytic-label">Items Successfully Sold</p>
                  <h4 className="analytic-value">{ngo.itemsSold.toLocaleString('en-IN')}</h4>
                  <span className="analytic-trend positive"><TrendingUp size={12} /> Product units sold</span>
                </div>
              </div>

              <div className="analytic-card">
                <div className="analytic-icon color-warning"><Clock size={24} /></div>
                <div>
                  <p className="analytic-label">Pending Fulfillment</p>
                  <h4 className="analytic-value">{ngo.pendingOrders}</h4>
                  <span className="analytic-trend warning">Orders waiting to ship</span>
                </div>
              </div>
            </div>

            <div className="dashboard-visuals-grid">
              <div className="card chart-card">
                <div className="chart-header">
                  <div>
                    <h3>Monthly Sales Revenue</h3>
                    <p>Store performance over last 6 months</p>
                  </div>
                </div>
                <div className="revenue-chart-container">
                  <div className="bar-chart-visual">
                    {(() => {
                      const now = new Date();
                      const monthlyData = [];
                      
                      for (let i = 5; i >= 0; i--) {
                        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                        monthlyData.push({
                          month: d.getMonth(),
                          year: d.getFullYear(),
                          label: d.toLocaleDateString('en-GB', { month: 'short' }),
                          total: 0
                        });
                      }
                      
                      orders.forEach(order => {
                        if (!['Delivered', 'Shipped'].includes(order.fulfillment_status)) return;
                        const d = new Date(order.created_at);
                        const bucket = monthlyData.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
                        if (bucket) {
                          bucket.total += parseFloat(order.total_amount || 0);
                        }
                      });
                      
                      const maxTotal = Math.max(...monthlyData.map(m => m.total), 1);
                      
                      return monthlyData.map((data, idx) => {
                        const barHeight = Math.max((data.total / maxTotal) * 100, 2); // minimum 2% for visibility
                        return (
                          <div key={data.label + idx} className="chart-column">
                            <div className="chart-column-bar-wrapper">
                              <div 
                                className="chart-column-bar" 
                                style={{ height: `${barHeight}%` }} 
                                title={`₹${data.total.toLocaleString('en-IN')}`}
                              ></div>
                            </div>
                            <span className="chart-column-label">{data.label}</span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              <div className="card payout-card">
                <h3 className="payout-card-title">Financial Overview</h3>
                <div className="payout-details">
                  {/* Balance display */}
                  <div className="payout-balance-box">
                    <span className="balance-label">Current Payout Balance</span>
                    <h2 className="balance-amount">₹{parseFloat(ngo.payoutBalance || 0).toLocaleString('en-IN')}</h2>
                  </div>

                  {/* Bank details */}
                  <div className="bank-details-block">
                    <div className="bank-details-head">
                      <Building size={14} />
                      <span>Registered Bank Account</span>
                    </div>
                    <div className="bank-row"><span>Bank</span><strong>{ngo.bankName || 'Not set'}</strong></div>
                    <div className="bank-row">
                      <span>Account No.</span>
                      <strong>{ngo.accountNumber ? `•••• ${ngo.accountNumber.slice(-4)}` : 'Not set'}</strong>
                    </div>
                    <div className="bank-row"><span>IFSC</span><strong>{ngo.ifsc || 'Not set'}</strong></div>
                    {ngo.bankName && ngo.accountNumber && (
                      <div className="bank-verified">
                        <ShieldCheck size={12} /> Verified
                      </div>
                    )}
                  </div>

                  {/* Process payout button */}
                  <button
                    className={`btn-payout ${ngo.payoutBalance > 0 && ngo.bankName ? 'enabled' : 'disabled'}`}
                    onClick={handleProcessPayout}
                    disabled={isProcessingPayout || ngo.payoutBalance <= 0 || !ngo.bankName}
                  >
                    {isProcessingPayout ? 'Processing…' : ngo.payoutBalance <= 0 ? 'No Balance' : 'Process Payout'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'products' && (
          <motion.div key="products" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="table-card">
            <div className="table-toolbar">
              <h3>Community Products</h3>
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Stock Level</th>
                    <th>Total Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No products found.</td>
                    </tr>
                  ) : (
                    filteredProducts.map(product => (
                      <tr key={product.id}>
                        <td className="font-medium" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {product.images && product.images.length > 0 ? (
                            <img src={product.images[0]} alt={product.name} style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                          )}
                          <span>{product.name}</span>
                        </td>
                        <td>₹{product.price.toLocaleString('en-IN')}</td>
                        <td>
                          <span className={`status-badge ${product.stock > 10 ? 'active' : product.stock > 0 ? 'warning' : 'danger'}`}>
                            {product.stock} in stock
                          </span>
                        </td>
                        <td>{product.sales_count || 0} units</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'orders' && (
          <motion.div key="orders" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="table-card">
            <div className="table-toolbar">
              <h3>Community Orders</h3>
              <div className="search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Items Count</th>
                    <th>Total Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>No orders found.</td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => {
                      const totalQty = order.items ? order.items.reduce((sum, item) => sum + (item.quantity || 1), 0) : 0;
                      return (
                        <tr key={order.id}>
                          <td className="font-medium color-accent" onClick={() => navigate(`/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                            {order.id.split('-')[0]}...
                          </td>
                          <td>{new Date(order.created_at).toLocaleDateString('en-GB')}</td>
                          <td>{order.customer_name || 'N/A'}</td>
                          <td>{totalQty} items</td>
                          <td>₹{(order.total_amount || 0).toLocaleString('en-IN')}</td>
                          <td>
                            <span className={`status-badge ${order.fulfillment_status === 'Delivered' ? 'active' : order.fulfillment_status === 'Shipped' ? 'info' : 'warning'}`}>
                              {order.fulfillment_status || 'Pending'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .community-details {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 2rem;
        }

        .back-nav-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: none;
          border: none;
          color: var(--text-secondary);
          font-weight: 600;
          cursor: pointer;
          margin-bottom: 1rem;
          transition: color 0.2s;
        }

        .back-nav-btn:hover {
          color: var(--accent);
        }

        .details-header {
          background: var(--bg-secondary);
          border-radius: 16px;
          border: 1px solid var(--border);
          overflow: hidden;
        }

        .banner {
          height: 140px;
          position: relative;
        }

        .banner-actions {
          position: absolute;
          top: 1rem;
          right: 1rem;
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          background: rgba(0,0,0,0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          color: white;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: rgba(0,0,0,0.5);
        }

        .profile-info-section {
          padding: 0 2rem 1.5rem 2rem;
          position: relative;
          display: flex;
          gap: 1.5rem;
        }

        .profile-avatar-large {
          width: 100px;
          height: 100px;
          border-radius: 20px;
          background: var(--bg-primary);
          border: 4px solid var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: 800;
          color: var(--accent);
          margin-top: -40px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        }

        .profile-text {
          flex: 1;
          padding-top: 1rem;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.25rem;
        }

        .community-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
        }

        .status-badge {
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
        }

        .status-badge.active { background: rgba(67, 233, 123, 0.1); color: #43e97b; }
        .status-badge.warning { background: rgba(249, 212, 35, 0.1); color: #f9d423; }
        .status-badge.danger { background: rgba(239, 68, 68, 0.1); color: #EF4444; }
        .status-badge.info { background: rgba(79, 172, 254, 0.1); color: #4facfe; }

        .community-category {
          color: var(--text-secondary);
          font-weight: 500;
          font-size: 0.9rem;
        }

        .tabs-container {
          display: flex;
          gap: 2rem;
          padding: 0 2rem;
          border-top: 1px solid var(--border);
        }

        .tab-btn {
          background: none;
          border: none;
          padding: 1rem 0;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.95rem;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          transition: color 0.2s;
        }

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--accent);
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent);
          border-radius: 3px 3px 0 0;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 1.5rem;
        }

        .analytic-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .analytic-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .color-accent { background: var(--accent-soft); color: var(--accent); }
        .color-success { background: var(--success-soft); color: var(--success); }
        .color-warning { background: var(--warning-soft); color: var(--warning); }
        .color-danger { background: var(--danger-soft); color: var(--danger); }

        .analytic-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 0.25rem;
        }

        .analytic-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          font-family: 'Montserrat', sans-serif;
        }

        .analytic-trend {
          font-size: 0.75rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.2rem;
        }
        .analytic-trend.positive { color: #10B981; }
        .analytic-trend.negative { color: #EF4444; }
        .analytic-trend.warning { color: #F59E0B; }

        .dashboard-visuals-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }

        @media (max-width: 1024px) {
          .dashboard-visuals-grid {
            grid-template-columns: 1fr;
          }
        }

        .card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .chart-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .chart-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
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
          background: var(--chart-bar-track);
          border-radius: 6px;
          overflow: hidden;
        }

        .chart-column-bar {
          width: 100%;
          background: var(--chart-bar);
          border-radius: 6px 6px 0 0;
        }

        .chart-column-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .payout-card {
          display: flex;
          flex-direction: column;
        }

        .payout-card .card-header h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
        }

        .payout-details {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          flex: 1;
        }

        .payout-balance-box {
          background: var(--bg-primary);
          border: 1px solid var(--accent);
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
        }

        .payout-balance-box span {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .payout-balance-box h2 {
          font-size: 2rem;
          font-family: 'Montserrat', sans-serif;
          color: var(--text-primary);
          margin-top: 0.5rem;
        }

        .payout-history h4 {
          font-size: 0.9rem;
          color: var(--text-primary);
          margin-bottom: 1rem;
        }

        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 0;
          border-bottom: 1px solid var(--border);
        }

        .history-info {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .history-date {
          font-size: 0.85rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .history-status {
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .history-status.success { color: #10B981; }

        .history-amount {
          font-weight: 700;
          color: var(--text-primary);
        }

        .btn-full-width {
          width: 100%;
          padding: 0.8rem;
          background: var(--accent);
          border: none;
          color: white;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: auto;
        }

        .btn-full-width:hover {
          background: var(--accent-hover);
        }

        /* Tables */
        .table-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 6px;
          cursor: pointer;
        }

        .manage-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
          width: 200px;
          padding: 0.5rem;
          z-index: 100;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .dropdown-item {
          padding: 0.75rem 1rem;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 0.9rem;
          font-weight: 500;
          text-align: left;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .dropdown-item:hover {
          background: var(--bg-secondary);
        }

        .dropdown-item.danger {
          color: #EF4444;
        }

        .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .dropdown-divider {
          height: 1px;
          background: var(--border);
          margin: 0.25rem 0;
        }

        .profile-info-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .table-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .table-toolbar h3 {
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .search-box {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: 8px;
        }

        .search-box input {
          background: none;
          border: none;
          color: var(--text-primary);
          outline: none;
          font-size: 0.9rem;
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th, .data-table td {
          padding: 1rem 1.5rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 600;
          background: rgba(0,0,0,0.02);
        }

        .data-table td {
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .font-medium {
          font-weight: 600;
        }

        .icon-btn {
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
        }
        
        .icon-btn:hover {
          color: var(--text-primary);
        }

        /* Payout Card */
        .payout-card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
          margin: 0 0 1.25rem 0;
        }

        .balance-label {
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
          color: var(--text-secondary);
          display: block;
          margin-bottom: 0.4rem;
        }

        .balance-amount {
          font-size: 2.2rem;
          font-weight: 800;
          font-family: 'Montserrat', sans-serif;
          color: var(--text-primary);
          margin: 0 0 1.25rem 0;
        }

        .bank-details-block {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          font-size: 0.85rem;
          margin-bottom: 1.25rem;
        }

        .bank-details-head {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-weight: 700;
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.04em;
          margin-bottom: 0.25rem;
        }

        .bank-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-secondary);
        }

        .bank-row strong {
          color: var(--text-primary);
          font-weight: 600;
        }

        .bank-verified {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          color: var(--success);
          font-size: 0.76rem;
          font-weight: 700;
          margin-top: 0.25rem;
        }

        .btn-payout {
          width: 100%;
          padding: 0.85rem;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-payout.enabled {
          background: linear-gradient(135deg, var(--me-maroon), var(--me-orange));
          color: white;
          box-shadow: 0 4px 14px rgba(255, 118, 18, 0.3);
        }

        .btn-payout.enabled:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 118, 18, 0.4);
        }

        .btn-payout.disabled {
          background: var(--border);
          color: var(--text-secondary);
          cursor: not-allowed;
        }
      `}</style>

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => showToast('')}
      />
    </div>
  );
};

export default CommunityDetailsScreen;
