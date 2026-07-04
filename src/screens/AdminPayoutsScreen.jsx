import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  IndianRupee, CheckCircle2, User, Search, Store, Building, 
  AlertTriangle, X, Check, CreditCard 
} from 'lucide-react';
import { getAllSellers, processSellerPayout } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';

const AdminPayoutsScreen = () => {
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Custom modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  
  // Custom toast notifications
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadSellers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllSellers();
      // Filter out admin users
      setSellers(data.filter(s => !s.is_admin));
    } catch (err) {
      console.error("Error loading sellers for payouts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSellers();
  }, []);

  const openPayoutConfirm = (seller) => {
    setSelectedSeller(seller);
    setShowConfirmModal(true);
  };

  const handlePayoutProcess = async () => {
    if (!selectedSeller) return;
    
    setIsProcessing(true);
    try {
      await processSellerPayout(selectedSeller.id);
      
      // Trigger dynamic toast message
      setToastMessage(`Successfully processed ₹${selectedSeller.balance.toLocaleString('en-IN')} payout for ${selectedSeller.shop_name}!`);
      setShowConfirmModal(false);
      setShowToast(true);
      
      // Reload lists
      await loadSellers();
      
      // Dismiss toast after 4 seconds
      setTimeout(() => {
        setShowToast(false);
      }, 4000);
    } catch (err) {
      console.error("Payout error:", err);
      alert("Failed to process payout. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedSeller(null);
    }
  };

  const filteredSellers = sellers.filter(s => 
    (s.shop_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.owner_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.bank_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPendingAmount = sellers.reduce((sum, s) => sum + parseFloat(s.balance || 0), 0);
  const sellersAwaitingCount = sellers.filter(s => parseFloat(s.balance || 0) > 0).length;

  return (
    <div className="admin-payouts-screen">
      <div className="header-section">
        <div>
          <h2 className="page-title">Payouts Processing</h2>
          <p className="page-subtitle">Manage, verify, and process bank payouts to registered NGO and community shops.</p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="card" count={3} />
        </div>
      ) : (
        <>
          {/* Stats Bar */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper color-warning"><IndianRupee size={24} /></div>
              <div className="stat-content">
                <p className="stat-label">Total Outstanding Balance</p>
                <h3 className="stat-value">₹{totalPendingAmount.toLocaleString('en-IN')}</h3>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon-wrapper color-accent"><Store size={24} /></div>
              <div className="stat-content">
                <p className="stat-label">Sellers Awaiting Payout</p>
                <h3 className="stat-value">{sellersAwaitingCount} shops</h3>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper color-success"><CheckCircle2 size={24} /></div>
              <div className="stat-content">
                <p className="stat-label">Verification Status</p>
                <h3 className="stat-value">All Secured</h3>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="payout-controls card">
            <div className="search-bar">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by shop name, owner, or bank..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Payouts table */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Shop / NGO</th>
                    <th>Owner</th>
                    <th>Bank Details</th>
                    <th>Current Balance</th>
                    <th>Payout Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
                        No registered shops found.
                      </td>
                    </tr>
                  ) : (
                    filteredSellers.map(seller => {
                      const balanceVal = parseFloat(seller.balance || 0);
                      const hasBankDetails = seller.bank_name && seller.account_number;
                      return (
                        <tr key={seller.id}>
                          <td>
                            <div className="shop-cell">
                              <span className="avatar-char">{seller.shop_name ? seller.shop_name.charAt(0) : 'S'}</span>
                              <div>
                                <span className="shop-title">{seller.shop_name}</span>
                                <span className="shop-category">{seller.category}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                              <User size={14} style={{ color: 'var(--text-secondary)' }} />
                              {seller.owner_name || 'N/A'}
                            </div>
                          </td>
                          <td>
                            {hasBankDetails ? (
                              <div className="bank-info">
                                <div className="bank-name"><Building size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {seller.bank_name}</div>
                                <div className="bank-acc">Acc: •••• {seller.account_number.slice(-4)}</div>
                                <div className="bank-ifsc">IFSC: {seller.ifsc}</div>
                              </div>
                            ) : (
                              <div className="no-bank-details">
                                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                Missing bank details
                              </div>
                            )}
                          </td>
                          <td className="font-semibold">
                            ₹{balanceVal.toLocaleString('en-IN')}
                          </td>
                          <td>
                            <span className={`status-badge ${balanceVal > 0 ? 'warning' : 'active'}`}>
                              {balanceVal > 0 ? 'Pending Payout' : 'Paid / Settled'}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={() => openPayoutConfirm(seller)}
                              disabled={isProcessing || balanceVal <= 0 || !hasBankDetails}
                              className={`payout-action-btn ${balanceVal > 0 && hasBankDetails ? 'active' : ''}`}
                            >
                              Process Payout
                            </button>
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

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedSeller && (
          <div className="modal-overlay">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content card"
            >
              <div className="modal-header">
                <div className="modal-title-wrapper">
                  <WalletCard size={20} className="text-warning" />
                  <h4>Confirm Payout Settlement</h4>
                </div>
                <button className="close-btn" onClick={() => setShowConfirmModal(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <p className="description">You are about to authorize a manual settlement to the bank details registered for this community shop.</p>
                
                <div className="payout-details-box">
                  <div className="payout-row">
                    <span className="label">Settling To</span>
                    <span className="value font-semibold">{selectedSeller.shop_name}</span>
                  </div>
                  <div className="payout-row">
                    <span className="label">Bank Name</span>
                    <span className="value">{selectedSeller.bank_name}</span>
                  </div>
                  <div className="payout-row">
                    <span className="label">Account Number</span>
                    <span className="value">•••• {selectedSeller.account_number.slice(-4)}</span>
                  </div>
                  <div className="payout-row">
                    <span className="label">IFSC Code</span>
                    <span className="value">{selectedSeller.ifsc}</span>
                  </div>
                  <div className="payout-row amount-row">
                    <span className="label">Settlement Amount</span>
                    <span className="value amount">₹{selectedSeller.balance.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <div className="notice-box">
                  <AlertTriangle size={16} className="text-warning" />
                  <span>Important: Ensure you have manually executed this transaction on your corporate banking gateway before marking it completed.</span>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowConfirmModal(false)} disabled={isProcessing}>
                  Cancel
                </button>
                <button className="btn-confirm" onClick={handlePayoutProcess} disabled={isProcessing}>
                  {isProcessing ? "Settling Balance..." : "Confirm & Settle Balance"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="success-toast"
          >
            <div className="toast-content">
              <div className="toast-icon"><Check size={18} /></div>
              <span>{toastMessage}</span>
            </div>
            <button className="toast-close" onClick={() => setShowToast(false)}><X size={16} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .admin-payouts-screen {
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

        /* Stats Card Section */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .stat-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
          display: flex;
          align-items: center;
          gap: 1.25rem;
          box-shadow: var(--shadow-sm);
        }

        .stat-icon-wrapper {
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

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          font-weight: 500;
          margin-bottom: 0.25rem;
        }

        .stat-value {
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
        }

        /* Search input controls */
        .payout-controls {
          display: flex;
          flex-direction: column;
        }

        .search-bar {
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

        /* Table CSS */
        .table-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th, .data-table td {
          padding: 1.1rem 1.5rem;
          text-align: left;
          border-bottom: 1px solid var(--border);
        }

        .data-table th {
          font-size: 0.8rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          font-weight: 600;
          background: rgba(0,0,0,0.01);
        }

        .data-table td {
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .shop-cell {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .avatar-char {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: var(--accent-soft);
          color: var(--accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.1rem;
        }

        .shop-title {
          font-weight: 600;
          display: block;
          color: var(--text-primary);
        }

        .shop-category {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: block;
        }

        .bank-info {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }

        .bank-name {
          font-weight: 600;
          color: var(--text-primary);
        }

        .no-bank-details {
          color: var(--danger);
          font-size: 0.8rem;
          font-weight: 500;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          padding: 0.25rem 0.75rem;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .status-badge.active { background: rgba(16, 185, 129, 0.12); color: #10B981; }
        .status-badge.warning { background: rgba(245, 158, 11, 0.12); color: #F59E0B; }

        .payout-action-btn {
          background: var(--border);
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: not-allowed;
          transition: all 0.2s;
        }

        .payout-action-btn.active {
          background: var(--accent);
          color: white;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 118, 18, 0.2);
        }

        .payout-action-btn.active:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .font-semibold {
          font-weight: 600;
        }

        .card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 1.5rem;
        }

        /* Modal Overlay & Card CSS */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(70, 23, 17, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
          padding: 1.5rem;
        }

        .modal-content {
          width: 100%;
          max-width: 500px;
          border-radius: 20px;
          overflow: hidden;
          padding: 0;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-title-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .modal-title-wrapper h4 {
          margin: 0;
          font-size: 1.15rem;
          font-weight: 700;
        }

        .close-btn {
          color: var(--text-secondary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0,0,0,0.02);
        }

        .close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .modal-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .modal-body .description {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .payout-details-box {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .payout-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .payout-row .value {
          color: var(--text-primary);
          text-align: right;
        }

        .amount-row {
          border-top: 1px dashed var(--border);
          padding-top: 0.75rem;
          margin-top: 0.25rem;
          align-items: center;
        }

        .amount-row .amount {
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--me-orange);
          font-family: 'Montserrat', sans-serif;
        }

        .notice-box {
          display: flex;
          gap: 0.5rem;
          background: var(--warning-soft);
          border: 1px solid rgba(245, 158, 11, 0.2);
          padding: 0.85rem;
          border-radius: 10px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .text-warning {
          color: var(--warning);
          flex-shrink: 0;
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          padding: 1.5rem;
          border-top: 1px solid var(--border);
          background: rgba(0,0,0,0.01);
        }

        .btn-cancel {
          flex: 1;
          padding: 0.8rem;
          border: 1px solid var(--border);
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-cancel:hover {
          background: rgba(0,0,0,0.02);
        }

        .btn-confirm {
          flex: 2;
          padding: 0.8rem;
          background: var(--accent);
          color: white;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255, 118, 18, 0.2);
        }

        .btn-confirm:hover {
          background: var(--accent-hover);
        }

        /* Success Toast style */
        .success-toast {
          position: fixed;
          bottom: 2rem;
          right: 2rem;
          background: var(--bg-secondary);
          border: 1px solid var(--success);
          box-shadow: var(--shadow-hover);
          padding: 1rem 1.5rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1.5rem;
          z-index: 1100;
          max-width: 420px;
        }

        .toast-content {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          color: var(--text-primary);
          font-weight: 500;
        }

        .toast-icon {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--success-soft);
          color: var(--success);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .toast-close {
          color: var(--text-secondary);
          cursor: pointer;
        }

        .toast-close:hover {
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default AdminPayoutsScreen;
