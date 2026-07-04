import React, { useState, useEffect } from 'react';
import { ClipboardList, Filter, Search, Clock, CheckCircle, AlertCircle, TrendingUp, X, ShieldCheck, Package } from 'lucide-react';
import { getAdminReports, updateReportStatus } from '../utils/admin';
import SkeletonLoader from '../components/SkeletonLoader';

const AdminReportsScreen = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [resolutionNote, setResolutionNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    const data = await getAdminReports();
    setReports(data || []);
    setLoading(false);
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!selectedReport) return;
    
    try {
      setUpdating(true);
      const updated = await updateReportStatus(
        selectedReport.id, 
        newStatus, 
        resolutionNote || null
      );
      
      // Also simulate refund processing if applicable (for now just updating state)
      // If there's an actual refund gateway, it would be called here before update
      
      setReports(reports.map(r => r.id === updated.id ? updated : r));
      setSelectedReport(updated);
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved': 
      case 'approved': return <CheckCircle size={14} />;
      case 'rejected': 
      case 'in_review': return <AlertCircle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'resolved': 
      case 'approved': return 'badge-success';
      case 'in_review': return 'badge-warning';
      case 'rejected': return 'badge-danger';
      default: return 'badge-danger'; // pending
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch = r.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.order_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          r.issue_type?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPIs
  const openDisputesCount = reports.filter(r => ['pending', 'in_review'].includes(r.status)).length;
  const resolvedCount = reports.filter(r => ['resolved', 'approved', 'rejected'].includes(r.status)).length;
  const totalRefunded = reports.reduce((acc, r) => acc + (Number(r.refund_amount) || 0), 0);

  return (
    <div className="admin-reports-screen" style={{ padding: '2rem' }}>
      <div className="page-header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <ClipboardList size={28} className="text-accent" />
          Disputes & Reports
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Monitor and resolve customer order disputes.</p>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card kpi-card" style={{ padding: '1.5rem' }}>
          <div className="kpi-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(255,107,107,0.1)', color: '#FF6B6B', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <AlertCircle size={24} />
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Open Disputes</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{openDisputesCount}</p>
        </div>
        <div className="card kpi-card" style={{ padding: '1.5rem' }}>
          <div className="kpi-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(67,233,123,0.1)', color: '#43e97b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <CheckCircle size={24} />
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Resolved</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>{resolvedCount}</p>
        </div>
        <div className="card kpi-card" style={{ padding: '1.5rem' }}>
          <div className="kpi-icon" style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(79,172,254,0.1)', color: '#4facfe', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
            <TrendingUp size={24} />
          </div>
          <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Total Refunded</h3>
          <p style={{ fontSize: '1.75rem', fontWeight: 'bold' }}>₹{totalRefunded.toLocaleString()}</p>
        </div>
      </div>

      <div className="controls-row" style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
        <div className="search-bar" style={{ flex: '1', minWidth: '250px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
          <input 
            type="text" 
            placeholder="Search by Order ID or Issue..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
          />
        </div>
        
        <div className="filter-select" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-secondary)', padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
          <Filter size={16} color="var(--text-secondary)" />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', cursor: 'pointer' }}
          >
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="all">All Status</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="pending">Pending</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="in_review">In Review</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="approved">Approved</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="rejected">Rejected</option>
            <option style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }} value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '2rem' }}>
          <SkeletonLoader count={5} height="60px" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="empty-state card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <ClipboardList size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>No Reports Found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>{searchTerm || statusFilter !== 'all' ? "Try adjusting your search or filters." : "You're all caught up! There are no disputes."}</p>
        </div>
      ) : (
        <div className="table-responsive card" style={{ padding: '0', overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Date</th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Order ID</th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Issue Type</th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Buyer / Seller</th>
                <th style={{ padding: '1.25rem 1rem', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map(report => (
                <tr 
                  key={report.id} 
                  onClick={() => {
                    setSelectedReport(report);
                    setResolutionNote(report.resolution_note || '');
                    setRefundAmount(report.refund_amount || '');
                  }}
                  style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.2s', ':hover': { background: 'var(--bg-secondary)' } }}
                >
                  <td style={{ padding: '1rem', fontSize: '0.9rem' }}>
                    {new Date(report.created_at).toLocaleDateString('en-GB')}
                  </td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {report.order_id?.substring(0, 8).toUpperCase()}...
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.9rem', textTransform: 'capitalize' }}>
                    <div style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{report.issue_type?.replace('_', ' ') || 'Other'}</div>
                  </td>
                  <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>B: {report.buyer_name || (report.buyer_id?.substring(0, 6) + '...')}</div>
                    <div>S: {report.seller_name || (report.seller_id?.substring(0, 6) + '...')}</div>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span className={`badge ${getStatusClass(report.status)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', textTransform: 'capitalize' }}>
                      {getStatusIcon(report.status)}
                      {report.status || 'pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Details Modal */}
      {selectedReport && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '1rem' }}>
          <div className="modal-content card" style={{ width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto', padding: '0' }}>
            
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: 'var(--bg-primary)', zIndex: 10 }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                Dispute Details
                <span className={`badge ${getStatusClass(selectedReport.status)}`} style={{ fontSize: '0.8rem', textTransform: 'uppercase' }}>
                  {selectedReport.status}
                </span>
              </h2>
              <button onClick={() => setSelectedReport(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                {/* Issue Details */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} /> Issue Information
                  </h3>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500', textTransform: 'capitalize' }}>{selectedReport.issue_type?.replace('_', ' ')}</p>
                    <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: 'var(--text-secondary)' }}>{selectedReport.description}</p>
                  </div>
                </div>

                {/* Product/Order Details */}
                <div>
                  <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={16} /> Product Snapshot
                  </h3>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    {selectedReport.item_snapshot ? (
                      <>
                        <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>{selectedReport.item_snapshot.name}</p>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Price: ₹{selectedReport.item_snapshot.price}</p>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Qty: {selectedReport.item_snapshot.quantity}</p>
                      </>
                    ) : (
                      <p style={{ margin: 0, color: 'var(--text-secondary)' }}>No product snapshot available.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Area */}
              <div style={{ background: 'var(--bg-sidebar)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '0.9rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <ShieldCheck size={16} /> Resolution Actions
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Resolution Note</label>
                    <textarea 
                      value={resolutionNote}
                      onChange={(e) => setResolutionNote(e.target.value)}
                      placeholder="Enter admin notes on resolution..."
                      style={{ width: '100%', minHeight: '80px', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button 
                    onClick={() => handleStatusUpdate('in_review')}
                    disabled={updating || selectedReport.status === 'in_review'}
                    className="btn-secondary"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer' }}
                  >
                    Mark In Review
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('approved')}
                    disabled={updating || selectedReport.status === 'approved'}
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--success)', color: 'white', cursor: 'pointer' }}
                  >
                    Approve Dispute
                  </button>
                  <button 
                    onClick={() => handleStatusUpdate('rejected')}
                    disabled={updating || selectedReport.status === 'rejected'}
                    className="btn-primary"
                    style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: 'var(--danger)', color: 'white', cursor: 'pointer' }}
                  >
                    Reject Dispute
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      <style>{`
        .data-table tbody tr:hover { background: rgba(0,0,0,0.02) !important; }
        [data-theme='dark'] .data-table tbody tr:hover { background: rgba(255,255,255,0.02) !important; }
      `}</style>
    </div>
  );
};

export default AdminReportsScreen;
