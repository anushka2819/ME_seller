import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IndianRupee, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAllOrders, getAllSellers } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';

const AdminTransactionsScreen = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [allOrders, allSellers] = await Promise.all([
          getAllOrders(),
          getAllSellers()
        ]);
        setOrders(allOrders);
        setSellers(allSellers);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const completedTransactions = orders
    .filter(o => ['Delivered', 'Shipped'].includes(o.fulfillment_status))
    .map(o => {
      const seller = sellers.find(s => s.id === o.seller_id);
      const amount = parseFloat(o.total_amount || 0);
      return {
        id: o.id,
        date: new Date(o.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        shopName: seller ? (seller.shop_name || 'Unknown') : 'Unknown NGO',
        amount: amount,
        adminCut: amount * 0.10,
        sellerCut: amount * 0.90,
        sortDate: new Date(o.created_at).getTime()
      };
    })
    .sort((a, b) => b.sortDate - a.sortDate);

  const totalPlatformRevenue = completedTransactions.reduce((acc, tx) => acc + tx.amount, 0);

  return (
    <div className="admin-transactions-screen" style={{ padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button className="back-navigation-btn" onClick={() => navigate('/admin/communities')}>
          <ArrowLeft size={18} /> Back
        </button>
        <div>
          <h2 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="stat-icon-wrapper" style={{ background: 'rgba(79, 172, 254, 0.15)', color: '#4facfe', padding: '0.5rem', borderRadius: '8px', display: 'inline-flex' }}>
              <IndianRupee size={22} />
            </div>
            Platform Transactions
          </h2>
          <p className="page-subtitle" style={{ margin: 0, marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
            Complete list of all processed orders and platform revenue splits.
          </p>
        </div>
      </div>

      {!isLoading && (
        <div className="kpi-strip" style={{ marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
          <div className="kpi-chip kpi-accent" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <p className="kpi-chip-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Transactions</p>
            <h3 className="kpi-chip-value" style={{ margin: 0, fontSize: '1.8rem' }}>{completedTransactions.length}</h3>
          </div>
          <div className="kpi-chip kpi-info" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <p className="kpi-chip-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Gross Merchandise Value</p>
            <h3 className="kpi-chip-value" style={{ margin: 0, fontSize: '1.8rem', color: '#4facfe' }}>₹{totalPlatformRevenue.toLocaleString('en-IN')}</h3>
          </div>
          <div className="kpi-chip kpi-success" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <p className="kpi-chip-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Platform Revenue (10%)</p>
            <h3 className="kpi-chip-value" style={{ margin: 0, fontSize: '1.8rem', color: '#10B981' }}>₹{(totalPlatformRevenue * 0.10).toLocaleString('en-IN')}</h3>
          </div>
          <div className="kpi-chip kpi-warning" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <p className="kpi-chip-label" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Sellers Net (90%)</p>
            <h3 className="kpi-chip-value" style={{ margin: 0, fontSize: '1.8rem', color: '#F59E0B' }}>₹{(totalPlatformRevenue * 0.90).toLocaleString('en-IN')}</h3>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader type="card" count={3} />
      ) : (
        <div className="card table-card" style={{ background: 'var(--bg-secondary)', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div className="table-responsive" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Transaction ID</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Date</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Seller (NGO)</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Gross Amount</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Admin (10%)</th>
                  <th style={{ padding: '1rem', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Seller (90%)</th>
                </tr>
              </thead>
              <tbody>
                {completedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                      No completed transactions yet.
                    </td>
                  </tr>
                ) : (
                  completedTransactions.map(tx => (
                    <tr key={tx.id} style={{ transition: 'background 0.2s', borderBottom: '1px solid var(--border)' }}>
                      <td className="font-medium" style={{ padding: '1rem', color: 'var(--text-secondary)' }}>#{tx.id.substring(0,8).toUpperCase()}</td>
                      <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{tx.date}</td>
                      <td className="font-medium" style={{ padding: '1rem' }}>{tx.shopName}</td>
                      <td className="font-bold" style={{ padding: '1rem' }}>₹{tx.amount.toLocaleString('en-IN')}</td>
                      <td style={{ padding: '1rem' }}>
                        <span className="status-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                          +₹{tx.adminCut.toLocaleString('en-IN')}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="status-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                          ₹{tx.sellerCut.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsScreen;
