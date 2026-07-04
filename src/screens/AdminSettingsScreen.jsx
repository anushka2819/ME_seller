import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldCheck, Mail, Percent, Save, IndianRupee, ToggleLeft, ToggleRight, RefreshCw } from 'lucide-react';
import { getAllSellers } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';
import Toast, { useToast } from '../components/Toast';

const AdminSettingsScreen = () => {
  const [admins, setAdmins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast, showToast } = useToast();

  // ─── Config state (persisted to localStorage) ───────────────────────────
  const [commissionRate, setCommissionRate] = useState(
    () => localStorage.getItem('admin_commission') || '10'
  );
  const [adminEmail, setAdminEmail] = useState(
    () => localStorage.getItem('admin_email') || 'support@mindempowered.org'
  );
  const [allowSelfRegistration, setAllowSelfRegistration] = useState(
    () => localStorage.getItem('admin_self_reg') !== 'false'
  );
  const [payoutLimit, setPayoutLimit] = useState(
    () => localStorage.getItem('admin_payout_limit') || '500'
  );

  // ─── Load admin accounts from Supabase ──────────────────────────────────
  useEffect(() => {
    const loadAdmins = async () => {
      setIsLoading(true);
      try {
        const allSellers = await getAllSellers();
        setAdmins(allSellers.filter(s => s.is_admin));
      } catch (err) {
        console.error('Error loading admin settings data:', err);
        showToast('Failed to load admin accounts.', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadAdmins();
  }, []);

  // ─── Save settings ───────────────────────────────────────────────────────
  const handleSaveSettings = (e) => {
    e.preventDefault();
    setIsSaving(true);

    localStorage.setItem('admin_commission', commissionRate);
    localStorage.setItem('admin_email', adminEmail);
    localStorage.setItem('admin_self_reg', String(allowSelfRegistration));
    localStorage.setItem('admin_payout_limit', payoutLimit);

    setTimeout(() => {
      setIsSaving(false);
      showToast('Platform settings updated successfully!', 'success');
    }, 700);
  };

  return (
    <div className="admin-settings-screen">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div className="page-header-icon"><Settings size={22} /></div>
        <div>
          <h2 className="page-title">Platform Settings</h2>
          <p className="page-subtitle">
            Configure system parameters, commission rates, and manage administrator accounts.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div style={{ padding: '2rem 0' }}>
          <SkeletonLoader type="card" count={2} />
        </div>
      ) : (
        <div className="settings-layout">
          {/* ── Left: Config Form ──────────────────────────────────────────── */}
          <form className="settings-card" onSubmit={handleSaveSettings}>
            <div className="card-title-row">
              <h3 className="card-title">System Parameters</h3>
              <span className="badge-info">Saved locally</span>
            </div>

            {/* Commission Rate */}
            <div className="form-group">
              <label className="form-label">
                <Percent size={15} />
                Commission Rate (%)
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={e => setCommissionRate(e.target.value)}
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  className="form-input"
                  placeholder="10"
                />
                <span className="input-suffix">%</span>
              </div>
              <p className="helper-text">
                Flat fee deducted from every fulfilled transaction as platform revenue.
              </p>
            </div>

            {/* Support Email */}
            <div className="form-group">
              <label className="form-label">
                <Mail size={15} />
                Platform Support Email
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                required
                className="form-input"
                placeholder="support@platform.org"
              />
              <p className="helper-text">
                Contact displayed on buyer/seller invoices and confirmation emails.
              </p>
            </div>

            {/* Minimum Payout Threshold */}
            <div className="form-group">
              <label className="form-label">
                <IndianRupee size={15} />
                Minimum Payout Threshold (₹)
              </label>
              <div className="input-wrapper">
                <span className="input-prefix">₹</span>
                <input
                  type="number"
                  value={payoutLimit}
                  onChange={e => setPayoutLimit(e.target.value)}
                  min="0"
                  required
                  className="form-input padded-left"
                  placeholder="500"
                />
              </div>
              <p className="helper-text">
                Minimum balance a seller must accumulate before admin can process their payout.
              </p>
            </div>

            {/* Toggle: Self-Registration */}
            <div className="toggle-group">
              <div className="toggle-info">
                <p className="toggle-label">Allow Open Seller Registration</p>
                <p className="toggle-desc">When enabled, new NGOs can self-register on the platform.</p>
              </div>
              <button
                type="button"
                className={`toggle-btn ${allowSelfRegistration ? 'on' : 'off'}`}
                onClick={() => setAllowSelfRegistration(prev => !prev)}
                aria-label="Toggle seller registration"
              >
                {allowSelfRegistration
                  ? <ToggleRight size={32} />
                  : <ToggleLeft size={32} />
                }
              </button>
            </div>

            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving
                ? <><RefreshCw size={16} className="spin" /> Saving…</>
                : <><Save size={16} /> Save Settings</>
              }
            </button>
          </form>

          {/* ── Right: Admin Accounts ──────────────────────────────────────── */}
          <div className="settings-card">
            <div className="card-title-row">
              <h3 className="card-title">Administrator Accounts</h3>
              <span className="badge-count">{admins.length}</span>
            </div>
            <p className="card-subtitle">
              Platform owners with full administrative access rights.
            </p>

            {admins.length === 0 ? (
              <div className="empty-state">
                <ShieldCheck size={36} style={{ color: 'var(--text-secondary)', opacity: 0.4 }} />
                <p>No admin accounts found in the database.</p>
              </div>
            ) : (
              <div className="admin-list">
                {admins.map((admin, i) => (
                  <motion.div
                    key={admin.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="admin-item"
                  >
                    <div className="admin-avatar">
                      {(admin.owner_name || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div className="admin-info">
                      <p className="admin-name">{admin.owner_name || 'Admin User'}</p>
                      <p className="admin-shop">{admin.shop_name || '—'}</p>
                      {admin.phone && (
                        <p className="admin-phone">{admin.phone}</p>
                      )}
                    </div>
                    <span className="badge-super">
                      <ShieldCheck size={12} /> Super Admin
                    </span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => showToast('')}
      />

      <style>{`
        .admin-settings-screen {
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
          color: var(--text-primary);
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

        /* ── Layout ──────────────────────────────── */
        .settings-layout {
          display: grid;
          grid-template-columns: 3fr 2fr;
          gap: 1.5rem;
          align-items: start;
        }

        @media (max-width: 1024px) {
          .settings-layout { grid-template-columns: 1fr; }
        }

        /* ── Settings Card ───────────────────────── */
        .settings-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 2rem;
          box-shadow: var(--shadow);
        }

        .card-title-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.75rem;
          gap: 0.75rem;
        }

        .card-title {
          font-size: 1.05rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
          margin: 0;
        }

        .card-subtitle {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin: -1rem 0 1.5rem 0;
        }

        .badge-info {
          font-size: 0.72rem;
          font-weight: 600;
          padding: 0.2rem 0.6rem;
          background: var(--info-soft);
          color: var(--info);
          border-radius: 12px;
        }

        .badge-count {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          font-size: 0.75rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Form Fields ─────────────────────────── */
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.45rem;
          margin-bottom: 1.5rem;
        }

        .form-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-prefix {
          position: absolute;
          left: 0.9rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .input-suffix {
          position: absolute;
          right: 0.9rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          pointer-events: none;
        }

        .form-input {
          width: 100%;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--bg-primary);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: border-color 0.2s, box-shadow 0.2s;
          outline: none;
        }

        .form-input.padded-left { padding-left: 2rem; }

        .form-input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(255, 118, 18, 0.08);
        }

        .helper-text {
          font-size: 0.76rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin: 0;
        }

        /* ── Toggle ──────────────────────────────── */
        .toggle-group {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.25rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 12px;
          margin-bottom: 2rem;
          gap: 1rem;
        }

        .toggle-info { flex: 1; }

        .toggle-label {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.2rem 0;
        }

        .toggle-desc {
          font-size: 0.78rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .toggle-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          transition: opacity 0.2s;
        }

        .toggle-btn.on  { color: var(--success); }
        .toggle-btn.off { color: var(--text-secondary); }
        .toggle-btn:hover { opacity: 0.75; }

        /* ── Save Button ─────────────────────────── */
        .btn-save {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.85rem 1.75rem;
          background: linear-gradient(135deg, var(--me-maroon), var(--me-orange));
          color: white;
          border: none;
          border-radius: 10px;
          font-weight: 700;
          font-size: 0.95rem;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(255, 118, 18, 0.3);
          transition: all 0.2s;
        }

        .btn-save:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(255, 118, 18, 0.4);
        }

        .btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.9s linear infinite; }

        /* ── Admin List ──────────────────────────── */
        .admin-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 0.5rem;
        }

        .admin-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-primary);
          transition: border-color 0.2s;
        }

        .admin-item:hover { border-color: rgba(255, 118, 18, 0.3); }

        .admin-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--me-maroon), var(--me-orange));
          color: white;
          font-size: 1.1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .admin-info { flex: 1; }

        .admin-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0 0 0.1rem 0;
        }

        .admin-shop {
          font-size: 0.76rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .admin-phone {
          font-size: 0.74rem;
          color: var(--text-secondary);
          margin: 0;
        }

        .badge-super {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.22rem 0.6rem;
          background: rgba(255, 118, 18, 0.12);
          color: var(--accent);
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* ── Empty State ─────────────────────────── */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
          padding: 3rem 1rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

export default AdminSettingsScreen;
