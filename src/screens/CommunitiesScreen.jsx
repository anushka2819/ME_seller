import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, IndianRupee, ShoppingBag, PackageCheck, TrendingUp, TrendingDown, MoreVertical, Search, X } from 'lucide-react';
import { getAllSellers, getAllProducts, getAllOrders } from '../utils/admin';
import { supabase } from '../utils/supabaseClient';
import SkeletonLoader from '../components/SkeletonLoader';

const colors = [
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #f83600, #f9d423)',
  'linear-gradient(135deg, #FF6B6B, #FF8E53)',
  'linear-gradient(135deg, #667eea, #764ba2)'
];

const getGradient = (index) => colors[index % colors.length];

const CommunitiesScreen = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showRevenueModal, setShowRevenueModal] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [allSellers, allProducts, allOrders] = await Promise.all([
        getAllSellers(),
        getAllProducts(),
        getAllOrders()
      ]);
      setSellers(allSellers);
      setProducts(allProducts);
      setOrders(allOrders);
    } catch (err) {
      console.error('Error fetching communities data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Subscribe to new sellers (NGOs) registering in realtime
    const channel = supabase
      .channel('sellers-insert')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'marketplace_dataspace',
          table: 'sellers'
        },
        (payload) => {
          console.log('New NGO registered:', payload.new);
          // Re-fetch to seamlessly display the new NGO
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter out admin sellers and process business metrics
  const processedNGOs = sellers
    .filter(s => !s.is_admin)
    .map((s, index) => {
      const sellerProducts = products.filter(p => p.seller_id === s.id);
      const sellerOrders = orders.filter(o => o.seller_id === s.id && (o.fulfillment_status === 'Delivered' || o.fulfillment_status === 'Shipped'));
      const orderRevenue = sellerOrders.reduce((acc, o) => acc + parseFloat(o.total_amount || 0), 0);
      
      const itemsSold = sellerOrders.reduce((total, o) => {
        if (Array.isArray(o.items)) {
          return total + o.items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0);
        }
        return total;
      }, 0);

      const revenue = orderRevenue;

      return {
        id: s.id,
        name: s.shop_name || 'Unnamed NGO',
        owner: s.owner_name || 'N/A',
        revenue,
        itemsSold,
        payoutBalance: s.balance || 0,
        status: sellerProducts.length > 0 ? 'Active' : 'Onboarding',
        category: s.category || 'General',
        logo: s.logo,
        color: getGradient(index)
      };
    });

  const filteredNGOs = processedNGOs.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPlatformRevenue = processedNGOs.reduce((acc, ngo) => acc + ngo.revenue, 0);
  const totalItemsSold = processedNGOs.reduce((acc, ngo) => acc + ngo.itemsSold, 0);
  const totalPendingPayouts = processedNGOs.reduce((acc, ngo) => acc + ngo.payoutBalance, 0);
  const sellersAwaitingPayout = processedNGOs.filter(ngo => ngo.payoutBalance > 0).length;

  return (
    <div className="communities-dashboard">
      <div className="header-section">
        <div>
          <h1 className="page-title">NGOs / Sellers Directory</h1>
          <p className="page-subtitle">Monitor e-commerce performance and payouts across all registered communities.</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : (
        <>
          {/* Global Stats Cards */}
          <div className="stats-grid">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="stat-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/admin/communities/transactions')}
              title="Click to view all transactions"
            >
              <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 172, 254, 0.15)', color: '#4facfe' }}>
                <IndianRupee size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Platform Revenue</p>
                <h3 className="stat-value">₹{totalPlatformRevenue.toLocaleString('en-IN')}</h3>
                <p className="stat-change positive">
                  <TrendingUp size={14} /> Live platform metrics
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="stat-card"
            >
              <div className="stat-icon-wrapper" style={{ background: 'rgba(67, 233, 123, 0.15)', color: '#43e97b' }}>
                <PackageCheck size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Total Items Sold</p>
                <h3 className="stat-value">{totalItemsSold.toLocaleString('en-IN')}</h3>
                <p className="stat-change positive">
                  <TrendingUp size={14} /> Cumulative sales
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="stat-card"
            >
              <div className="stat-icon-wrapper" style={{ background: 'rgba(255, 154, 68, 0.15)', color: '#FF9A44' }}>
                <Building2 size={24} />
              </div>
              <div className="stat-content">
                <p className="stat-label">Pending Payouts</p>
                <h3 className="stat-value">₹{totalPendingPayouts.toLocaleString('en-IN')}</h3>
                <p className="stat-change negative">
                  <TrendingDown size={14} /> {sellersAwaitingPayout} Sellers awaiting
                </p>
              </div>
            </motion.div>
          </div>

          {/* Toolbar */}
          <div className="toolbar">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search NGOs by shop name or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

          </div>

          {/* Communities Grid */}
          {filteredNGOs.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No NGOs or Communities registered on the platform matching search.
            </div>
          ) : (
            <div className="communities-grid">
              {filteredNGOs.map((ngo, index) => (
                <motion.div
                  key={ngo.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="community-card"
                  onClick={() => navigate(`/admin/communities/${ngo.id}`)}
                >
                  <div className="community-card-header" style={{ background: ngo.color }}>
                    <div className="community-status">
                      <span className={`status-dot ${ngo.status === 'Active' ? 'active' : 'warning'}`}></span>
                      {ngo.status}
                    </div>
                  </div>

                  <div className="community-card-body">
                    <div className="community-avatar">
                      {ngo.logo || ngo.name === 'Mind Empowered Crafts' ? (
                        <img src={ngo.logo || "/brand/logo.gif"} alt={`${ngo.name} Logo`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                      ) : (
                        ngo.name.charAt(0)
                      )}
                    </div>
                    <h3 className="community-name">{ngo.name}</h3>
                    <p className="community-category">{ngo.category}</p>

                    <div className="community-metrics">
                      <div className="metric">
                        <span className="metric-label">Revenue</span>
                        <span className="metric-value">₹{(ngo.revenue).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="metric divider"></div>
                      <div className="metric">
                        <span className="metric-label">Items Sold</span>
                        <span className="metric-value">{ngo.itemsSold}</span>
                      </div>
                      <div className="metric divider"></div>
                      <div className="metric">
                        <span className="metric-label">Payout Bal</span>
                        <span className="metric-value warning">₹{(ngo.payoutBalance).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .communities-dashboard {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 2rem;
        }

        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }

        .page-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 0.5rem;
          font-family: 'Montserrat', sans-serif;
        }

        .page-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
        }

        .create-btn {
          background: var(--accent);
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 12px rgba(255, 118, 18, 0.3);
        }

        .create-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(255, 118, 18, 0.4);
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.5rem;
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          box-shadow: var(--shadow-hover);
          transform: translateY(-2px);
        }

        .stat-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          font-family: 'Montserrat', sans-serif;
        }

        .stat-change {
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-weight: 600;
        }

        .stat-change.positive { color: #10B981; }
        .stat-change.negative { color: #EF4444; }

        /* Toolbar */
        .toolbar {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .search-bar {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          color: var(--text-secondary);
        }

        .search-bar input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.8rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: border-color 0.2s ease;
        }

        .search-bar input:focus {
          outline: none;
          border-color: var(--accent);
        }

        .filter-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.8rem 1.25rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: var(--bg-secondary);
          color: var(--text-primary);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          background: var(--bg-primary);
          border-color: var(--accent);
          color: var(--accent);
        }

        /* Communities Grid */
        .communities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .community-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
        }

        .community-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-hover);
          border-color: rgba(255, 118, 18, 0.3);
        }

        .community-card-header {
          height: 100px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          position: relative;
        }

        .community-status {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(4px);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-dot.active { background: #43e97b; }
        .status-dot.warning { background: #f9d423; }

        .more-btn {
          background: rgba(0,0,0,0.2);
          backdrop-filter: blur(4px);
          color: white;
          border: none;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .more-btn:hover {
          background: rgba(0,0,0,0.4);
        }

        .community-card-body {
          padding: 1.5rem;
          padding-top: 0;
          position: relative;
          text-align: center;
        }

        .community-avatar {
          width: 70px;
          height: 70px;
          border-radius: 16px;
          background: var(--bg-primary);
          border: 4px solid var(--bg-secondary);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 800;
          color: var(--accent);
          margin: -35px auto 1rem auto;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
        }

        .community-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 0.25rem;
          font-family: 'Montserrat', sans-serif;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .community-category {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
        }

        .community-metrics {
          display: flex;
          justify-content: space-between;
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .metric {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }

        .metric.divider {
          width: 1px;
          background: var(--border);
        }

        .metric-label {
          font-size: 0.7rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 600;
        }

        .metric-value {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
        }

        .metric-value.warning {
          color: #FF9A44;
        }
      `}</style>
    </div>
  );
};

export default CommunitiesScreen;
