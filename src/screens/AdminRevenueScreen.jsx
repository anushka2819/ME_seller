import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, IndianRupee, TrendingUp, Percent, Store, BarChart3 } from 'lucide-react';
import { getAllOrders, getAllSellers, getAllProducts } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';

const COMMISSION_RATE = 0.10; // 10% platform commission

// ─── Compute last-N-months monthly revenue from real orders ─────────────────
const buildMonthlyRevenue = (orders, monthCount = 6) => {
  const now = new Date();
  const months = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-IN', { month: 'short' }),
      total: 0,
    });
  }

  orders.forEach(order => {
    if (!['Delivered', 'Shipped'].includes(order.fulfillment_status)) return;
    const d = new Date(order.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = months.find(m => m.key === key);
    if (bucket) bucket.total += parseFloat(order.total_amount || 0);
  });

  return months;
};

const AdminRevenueScreen = () => {
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const [allOrders, allSellers, allProducts] = await Promise.all([
          getAllOrders(),
          getAllSellers(),
          getAllProducts(),
        ]);
        setOrders(allOrders);
        setSellers(allSellers.filter(s => !s.is_admin));
        setProducts(allProducts);
      } catch (err) {
        console.error('Error loading revenue analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ─── Platform-wide aggregates ──────────────────────────────────────────────
  const completedOrders = orders.filter(
    o => o.fulfillment_status === 'Delivered' || o.fulfillment_status === 'Shipped'
  );
  const totalGMV = completedOrders.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
  const displayGMV = totalGMV;

  const totalCommission = displayGMV * COMMISSION_RATE;
  const netSellersShare = displayGMV - totalCommission;

  // ─── Monthly bar-chart data ────────────────────────────────────────────────
  const monthlyData = buildMonthlyRevenue(orders, 6);
  const maxMonthly = Math.max(...monthlyData.map(m => m.total), 1);

  // ─── Per-seller revenue breakdown ─────────────────────────────────────────
  const sellerRevenue = sellers.map(seller => {
    const so = orders.filter(
      o => o.seller_id === seller.id &&
           ['Delivered', 'Shipped'].includes(o.fulfillment_status)
    );
    
    const gross = so.reduce((s, o) => s + parseFloat(o.total_amount || 0), 0);
    
    // Calculate items sold from real order items
    const itemsSold = so.reduce((total, o) => {
      if (Array.isArray(o.items)) {
        return total + o.items.reduce((s, i) => s + (parseInt(i.quantity) || 1), 0);
      }
      return total;
    }, 0);

    return {
      id:         seller.id,
      shopName:   seller.shop_name || 'Unnamed NGO',
      category:   seller.category  || 'General',
      itemsSold,
      gross,
      commission: gross * COMMISSION_RATE,
      net:        gross * (1 - COMMISSION_RATE),
    };
  }).sort((a, b) => b.gross - a.gross);

  // Revenue share % for progress bars
  const topRevenue = sellerRevenue[0]?.gross || 1;

  return (
    <div className="admin-revenue-screen">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-icon"><BarChart3 size={22} /></div>
        <div>
          <h2 className="page-title">Revenue Analytics</h2>
          <p className="page-subtitle">
            Track Gross Merchandise Value, platform commissions, and per-NGO financial breakdown.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : (
        <>
          {/* ── KPI Cards ───────────────────────────────────────────────────── */}
          <div className="kpi-grid">
            {[
              {
                label: 'Total Platform GMV',
                value: `₹${displayGMV.toLocaleString('en-IN')}`,
                sub: `${completedOrders.length} completed orders`,
                icon: <IndianRupee size={22} />,
                color: 'accent',
              },
              {
                label: 'Platform Commission (10%)',
                value: `₹${totalCommission.toLocaleString('en-IN')}`,
                sub: 'Flat rate on all transactions',
                icon: <Percent size={22} />,
                color: 'success',
              },
              {
                label: 'Net Sellers Share',
                value: `₹${netSellersShare.toLocaleString('en-IN')}`,
                sub: `Distributed to ${sellers.length} NGOs`,
                icon: <Activity size={22} />,
                color: 'warning',
              },
            ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`kpi-card kpi-${kpi.color}`}
              >
                <div className={`kpi-icon ${kpi.color}`}>{kpi.icon}</div>
                <div className="kpi-body">
                  <p className="kpi-label">{kpi.label}</p>
                  <h3 className="kpi-value">{kpi.value}</h3>
                  <p className="kpi-sub">{kpi.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* ── Chart + Rules ────────────────────────────────────────────────── */}
          <div className="visuals-grid">
            {/* Monthly Revenue Bar Chart */}
            <div className="chart-card">
              <div className="chart-head">
                <div>
                  <h3 className="section-title">Monthly Platform Revenue</h3>
                  <p className="section-sub">Completed order revenue for the last 6 months</p>
                </div>
                <div className={`trend-pill ${totalGMV > 0 ? 'up' : 'neutral'}`}>
                  <TrendingUp size={13} />
                  {totalGMV > 0 ? 'Real data' : 'Estimated'}
                </div>
              </div>

              <div className="bar-chart">
                {monthlyData.map((m, i) => {
                  const pct = maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
                  return (
                    <div key={m.key} className="bar-col">
                      <div className="bar-tooltip">
                        ₹{m.total.toLocaleString('en-IN')}
                      </div>
                      <div className="bar-track">
                        <motion.div
                          className="bar-fill"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(pct, pct > 0 ? 4 : 0)}%` }}
                          transition={{ delay: i * 0.07, duration: 0.5, ease: 'easeOut' }}
                        />
                      </div>
                      <span className="bar-label">{m.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commission Rules */}
            <div className="rules-card">
              <h3 className="section-title" style={{ marginBottom: '1.5rem' }}>Commission Rules</h3>
              {[
                {
                  title: 'Standard Commission',
                  desc: 'A flat 10% platform service fee is collected on all successfully fulfilled e-commerce orders.',
                  accent: 'var(--accent)',
                },
                {
                  title: 'Social Cause Exemption',
                  desc: 'Verified NGO partners receive 90% direct payouts with zero hidden fee deductions.',
                  accent: 'var(--success)',
                },
                {
                  title: 'Fulfillment & Settlement',
                  desc: 'Balances accumulate upon marking an order "Delivered". Admins can clear at any time.',
                  accent: 'var(--warning)',
                },
              ].map(r => (
                <div key={r.title} className="rule-item" style={{ borderLeftColor: r.accent }}>
                  <h4 className="rule-title">{r.title}</h4>
                  <p className="rule-desc">{r.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Per-Seller Breakdown ──────────────────────────────────────────── */}
          <div className="table-section">
            <div className="table-section-head">
              <h3 className="section-title">NGO Revenue Breakdown</h3>
              <span className="badge-count">{sellerRevenue.length} NGOs</span>
            </div>

            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop / NGO</th>
                    <th>Category</th>
                    <th>Items Sold</th>
                    <th>Gross Revenue</th>
                    <th>Commission</th>
                    <th>Net Earnings</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerRevenue.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-row">
                        <Store size={28} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                        <div>No NGO revenue data available.</div>
                      </td>
                    </tr>
                  ) : (
                    sellerRevenue.map((s, i) => {
                      const sharePct = displayGMV > 0 ? ((s.gross / displayGMV) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={s.id} className={i % 2 === 1 ? 'row-alt' : ''}>
                          <td>
                            <div className="shop-cell">
                              <div className="shop-avatar">{s.shopName.charAt(0)}</div>
                              <span className="shop-name">{s.shopName}</span>
                            </div>
                          </td>
                          <td className="text-muted">{s.category}</td>
                          <td className="text-muted">{s.itemsSold} units</td>
                          <td className="text-bold">₹{s.gross.toLocaleString('en-IN')}</td>
                          <td className="text-danger">₹{s.commission.toLocaleString('en-IN')}</td>
                          <td className="text-success">₹{s.net.toLocaleString('en-IN')}</td>
                          <td>
                            <div className="share-bar-wrapper">
                              <div
                                className="share-bar-fill"
                                style={{ width: `${Math.max(parseFloat(sharePct), s.gross > 0 ? 4 : 0)}%` }}
                              />
                              <span className="share-pct">{sharePct}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style>{`
        .admin-revenue-screen {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 3rem;
        }

        /* ── Page Header ─────────────────────────── */
        .page-header {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .page-header-icon {
          width: 48px;
          height: 48px;
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

        /* ── KPI Cards ───────────────────────────── */
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
        }

        .kpi-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 18px;
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1.1rem;
          box-shadow: var(--shadow);
          transition: var(--transition);
          border-left: 4px solid transparent;
        }

        .kpi-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-hover);
        }

        .kpi-accent { border-left-color: var(--accent); }
        .kpi-success { border-left-color: var(--success); }
        .kpi-warning { border-left-color: var(--warning); }

        .kpi-icon {
          width: 46px;
          height: 46px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .kpi-icon.accent  { background: var(--accent-soft);  color: var(--accent);  }
        .kpi-icon.success { background: var(--success-soft); color: var(--success); }
        .kpi-icon.warning { background: var(--warning-soft); color: var(--warning); }

        .kpi-body { flex: 1; }

        .kpi-label {
          font-size: 0.78rem;
          color: var(--text-secondary);
          font-weight: 600;
          margin: 0 0 0.3rem 0;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .kpi-value {
          font-size: 1.7rem;
          font-weight: 800;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
          margin: 0 0 0.2rem 0;
        }

        .kpi-sub {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }

        /* ── Two-column Visuals ──────────────────── */
        .visuals-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.5rem;
        }

        @media (max-width: 991px) {
          .visuals-grid { grid-template-columns: 1fr; }
        }

        .chart-card, .rules-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 1.75rem;
          box-shadow: var(--shadow);
        }

        .chart-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
        }

        .section-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
          margin: 0;
        }

        .section-sub {
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin: 0.25rem 0 0 0;
        }

        .trend-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.3rem 0.75rem;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .trend-pill.up      { background: rgba(16, 185, 129, 0.12); color: #10B981; }
        .trend-pill.neutral { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }

        /* ── Bar Chart ───────────────────────────── */
        .bar-chart {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 0.5rem;
          height: 220px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .bar-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100%;
          position: relative;
          gap: 0.5rem;
        }

        .bar-col:hover .bar-tooltip { opacity: 1; transform: translateY(0); }

        .bar-tooltip {
          position: absolute;
          top: -2rem;
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: var(--text-primary);
          color: var(--bg-secondary);
          font-size: 0.7rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 6px;
          white-space: nowrap;
          opacity: 0;
          transition: all 0.2s;
          pointer-events: none;
          z-index: 10;
        }

        .bar-track {
          flex: 1;
          width: 100%;
          max-width: 36px;
          background: var(--chart-bar-track);
          border-radius: 6px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .bar-fill {
          width: 100%;
          background: var(--chart-bar);
          border-radius: 6px;
          min-height: 0;
        }

        .bar-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* ── Commission Rules ────────────────────── */
        .rule-item {
          border-left: 3px solid;
          padding: 0.75rem 0 0.75rem 1rem;
          margin-bottom: 1.25rem;
        }

        .rule-title {
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0 0 0.3rem 0;
        }

        .rule-desc {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        /* ── Revenue Table ───────────────────────── */
        .table-section {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: var(--shadow);
        }

        .table-section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .badge-count {
          padding: 0.2rem 0.65rem;
          background: var(--accent-soft);
          color: var(--accent);
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 700;
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
          font-size: 0.9rem;
        }

        .data-table th {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          color: var(--text-secondary);
          font-weight: 700;
          background: rgba(0,0,0,0.015);
        }

        .data-table td { color: var(--text-primary); }

        .row-alt td { background: rgba(0,0,0,0.015); }

        .data-table tr:last-child td { border-bottom: none; }

        .shop-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }

        .shop-avatar {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .shop-name { font-weight: 600; }

        .text-muted   { color: var(--text-secondary); }
        .text-bold    { font-weight: 700; }
        .text-danger  { color: var(--danger);  font-weight: 600; }
        .text-success { color: var(--success); font-weight: 700; }

        /* ── Share Progress Bar ──────────────────── */
        .share-bar-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          min-width: 100px;
        }

        .share-bar-fill {
          height: 6px;
          background: linear-gradient(90deg, var(--me-maroon), var(--me-orange));
          border-radius: 4px;
          max-width: 80px;
          transition: width 0.4s ease;
        }

        .share-pct {
          font-size: 0.78rem;
          font-weight: 600;
          color: var(--text-secondary);
          white-space: nowrap;
        }

        .empty-row {
          text-align: center;
          padding: 3rem !important;
          color: var(--text-secondary);
          font-size: 0.9rem;
          display: table-cell;
        }
      `}</style>
    </div>
  );
};

export default AdminRevenueScreen;
