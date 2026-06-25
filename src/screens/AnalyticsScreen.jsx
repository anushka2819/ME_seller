import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Award,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { getOrders } from '../utils/order';
import { getProducts } from '../utils/product';
import { getAnalyticsStats } from '../utils/storage';
import SkeletonLoader from '../components/SkeletonLoader';
const AnalyticsScreen = () => {
  const [stats, setStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categoryDistribution, setCategoryDistribution] = useState([]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      const allProducts = await getProducts();
      const allOrders = await getOrders();
      
      const metrics = getAnalyticsStats(allProducts, allOrders);
      setStats(metrics);

      // Calculate top-selling products (sorted by salesCount desc)
      const sortedProducts = [...allProducts]
        .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
      setTopProducts(sortedProducts.slice(0, 5));

      // Calculate category distribution percentage
      const categoryTotals = {};
      let totalSales = 0;

      allProducts.forEach(prod => {
        const sales = prod.salesCount || 0;
        categoryTotals[prod.category] = (categoryTotals[prod.category] || 0) + sales;
        totalSales += sales;
      });

      const distribution = Object.keys(categoryTotals).map(cat => ({
        name: cat,
        sales: categoryTotals[cat],
        percentage: totalSales === 0 ? 0 : Math.round((categoryTotals[cat] / totalSales) * 100)
      }));

      // Sort distribution by percentage
      distribution.sort((a, b) => b.percentage - a.percentage);
      setCategoryDistribution(distribution);
    };

    fetchAnalyticsData();
  }, []);

  if (!stats) {
    return (
      <div className="analytics-screen">
        <div className="analytics-header">
          <div>
            <div className="skeleton skeleton-title" style={{ width: '300px', height: '32px', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '400px' }}></div>
          </div>
        </div>
        
        <div className="analytics-metrics-grid">
          <SkeletonLoader type="card" count={3} />
        </div>

        <div className="analytics-layout-split">
          <div className="card analytics-chart-card">
            <div className="skeleton skeleton-title" style={{ width: '200px', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '150px', marginBottom: '24px' }}></div>
            <div className="chart-grid-bars" style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', height: '200px' }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="skeleton" style={{ flex: 1, height: `${Math.random() * 80 + 20}%`, borderRadius: '4px' }}></div>
              ))}
            </div>
          </div>
          
          <div className="card analytics-category-card">
            <div className="skeleton skeleton-title" style={{ width: '180px', marginBottom: '8px' }}></div>
            <div className="skeleton skeleton-text" style={{ width: '120px', marginBottom: '24px' }}></div>
            <SkeletonLoader type="table-row" count={4} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-screen">
      <div className="analytics-header">
        <div>
          <h2>Sales & Shop Analytics</h2>
          <p>Analyze revenue growth, item distribution, and top performing product metrics.</p>
        </div>
      </div>

      {/* Analytics Overview Metrics */}
      <div className="analytics-metrics-grid">
        <div className="card metric-box">
          <div className="metric-box-icon color-accent">
            <DollarSign size={20} />
          </div>
          <div>
            <span>Net Shop Earnings</span>
            <h3>₹{stats.totalEarnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
            <p className="trend-label positive">
              <TrendingUp size={12} /> +15.8% compared to last month
            </p>
          </div>
        </div>

        <div className="card metric-box">
          <div className="metric-box-icon color-navy">
            <ShoppingBag size={20} />
          </div>
          <div>
            <span>Total Units Sold</span>
            <h3>{stats.totalItemsSold}</h3>
            <p className="trend-label positive">
              <TrendingUp size={12} /> +8.4% month-over-month
            </p>
          </div>
        </div>

        <div className="card metric-box">
          <div className="metric-box-icon color-success">
            <Award size={20} />
          </div>
          <div>
            <span>Conversion Rate</span>
            <h3>{stats.conversionRate}%</h3>
            <p className="trend-label positive">
              <TrendingUp size={12} /> +0.5% optimization increase
            </p>
          </div>
        </div>
      </div>

      <div className="analytics-layout-split">
        {/* Monthly Performance Visual */}
        <div className="card analytics-chart-card">
          <div className="chart-heading-area">
            <h3>Revenue History (2026)</h3>
            <span className="sub">Bar charts indicate sales revenue in rupees.</span>
          </div>

          <div className="chart-grid-bars">
            {stats.monthlyRevenue.map((item, idx) => {
              const maxRevenue = Math.max(...stats.monthlyRevenue.map(m => m.revenue));
              const heightPercentage = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0;
              return (
                <div key={item.name} className="analytics-chart-bar-col">
                  <div className="bar-wrapper">
                    <motion.div 
                      className="bar-filler"
                      initial={{ height: 0 }}
                      animate={{ height: `${heightPercentage}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.1 }}
                    >
                      <span className="tooltip">₹{item.revenue.toLocaleString('en-IN')}</span>
                    </motion.div>
                  </div>
                  <span className="col-label">{item.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Share progress bars */}
        <div className="card analytics-category-card">
          <div className="card-heading-area">
            <h3>Sales Share by Category</h3>
            <p>Breakdown of total item units sold.</p>
          </div>

          <div className="category-shares-list">
            {categoryDistribution.length === 0 ? (
              <p className="empty-text">No category data available.</p>
            ) : (
              categoryDistribution.map((item, index) => (
                <div key={item.name} className="cat-share-item">
                  <div className="cat-share-info">
                    <span>{item.name}</span>
                    <strong>{item.percentage}% ({item.sales} sold)</strong>
                  </div>
                  <div className="progress-bar-bg">
                    <motion.div 
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                    ></motion.div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Top Performing Listings */}
      <div className="card top-listings-card">
        <div className="card-header">
          <h3>Top Performing Listings</h3>
          <p>Products that generated the highest volume of purchases.</p>
        </div>

        <div className="table-responsive">
          <table className="top-listings-table">
            <thead>
              <tr>
                <th>Listing Name</th>
                <th>Price</th>
                <th>Units Sold</th>
                <th>Total Earned Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan="4" className="empty-table-row">No listing records found.</td>
                </tr>
              ) : (
                topProducts.map(prod => (
                  <tr key={prod.id}>
                    <td>
                      <div className="top-product-details">
                        <img 
                          src={(prod.images && prod.images[0]) || 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=400'} 
                          alt={prod.name} 
                          className="top-product-thumb"
                        />
                        <div className="top-product-text">
                          <strong className="name">{prod.name}</strong>
                          <span className="cat">{prod.category}</span>
                        </div>
                      </div>
                    </td>
                    <td>₹{prod.price.toLocaleString('en-IN')}</td>
                    <td className="units-sold-val">{prod.salesCount || 0} units</td>
                    <td className="earned-val">₹{((prod.salesCount || 0) * prod.price).toLocaleString('en-IN')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .analytics-screen {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .analytics-header {
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .analytics-header h2 {
          font-size: 1.75rem;
        }

        .analytics-header p {
          color: var(--text-secondary);
        }

        .analytics-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .metric-box {
          display: flex;
          align-items: center;
          gap: 1.25rem;
        }

        .metric-box-icon {
          width: 48px;
          height: 48px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .metric-box span {
          font-size: 0.85rem;
          color: var(--text-secondary);
          font-weight: 500;
        }

        .metric-box h3 {
          font-size: 1.6rem;
          margin: 0.15rem 0;
          font-family: 'Montserrat', sans-serif;
        }

        .trend-label {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .trend-label.positive {
          color: var(--success);
        }

        .analytics-layout-split {
          display: grid;
          grid-template-columns: 2fr 1.2fr;
          gap: 1.5rem;
        }

        @media (max-width: 1100px) {
          .analytics-layout-split {
            grid-template-columns: 1fr;
          }
        }

        .analytics-chart-card {
          display: flex;
          flex-direction: column;
        }

        .chart-heading-area {
          margin-bottom: 2rem;
        }

        .chart-heading-area h3 {
          font-size: 1.1rem;
        }

        .chart-heading-area .sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .chart-grid-bars {
          height: 260px;
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .analytics-chart-bar-col {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          flex: 1;
        }

        .analytics-chart-bar-col .bar-wrapper {
          flex: 1;
          width: 35%;
          max-width: 32px;
          display: flex;
          align-items: flex-end;
          position: relative;
        }

        .analytics-chart-bar-col .bar-filler {
          width: 100%;
          background: linear-gradient(180deg, var(--me-orange), var(--me-maroon));
          border-radius: 4px 4px 0 0;
          position: relative;
        }

        .analytics-chart-bar-col .bar-filler:hover {
          background: linear-gradient(180deg, var(--accent-hover), var(--me-maroon));
        }

        .analytics-chart-bar-col .tooltip {
          position: absolute;
          top: -26px;
          left: 50%;
          transform: translateX(-50%);
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 1px 4px;
          font-size: 0.75rem;
          font-weight: 700;
          border-radius: 4px;
          white-space: nowrap;
          opacity: 0;
          transition: opacity 0.2s;
          pointer-events: none;
        }

        .analytics-chart-bar-col .bar-filler:hover .tooltip {
          opacity: 1;
        }

        .col-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-top: 0.5rem;
        }

        .analytics-category-card {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .analytics-category-card h3 {
          font-size: 1.1rem;
        }

        .analytics-category-card p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .category-shares-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .cat-share-item {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .cat-share-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .cat-share-info span {
          font-weight: 600;
          color: var(--text-primary);
        }

        .cat-share-info strong {
          color: var(--me-navy);
        }

        .progress-bar-bg {
          height: 8px;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 10px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--me-orange);
          border-radius: 10px;
        }

        .top-listings-card .card-header {
          border-bottom: 1px solid var(--border);
          padding-bottom: 1rem;
          margin-bottom: 1rem;
        }

        .top-listings-card h3 {
          font-size: 1.1rem;
        }

        .top-listings-card p {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .top-listings-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .top-listings-table th, .top-listings-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .top-listings-table th {
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
        }

        .top-product-details {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .top-product-thumb {
          width: 40px;
          height: 40px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--border);
        }

        .top-product-text {
          display: flex;
          flex-direction: column;
        }

        .top-product-text .name {
          font-size: 0.9rem;
          color: var(--text-primary);
        }

        .top-product-text .cat {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .units-sold-val {
          font-weight: 600;
          color: var(--text-primary);
        }

        .earned-val {
          font-weight: 700;
          color: var(--success);
        }
      `}</style>
    </div>
  );
};

export default AnalyticsScreen;
