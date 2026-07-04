import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  Search,
  MapPin,
  Mail,
  Calendar,
  ShoppingBag,
  CheckCircle,
  Truck,
  Box,
  X,
  IndianRupee,
  Link
} from 'lucide-react';
import { getOrders, updateOrderStatus } from '../utils/order';
import SkeletonLoader from '../components/SkeletonLoader';

const OrdersScreen = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  async function loadOrders() {
    setIsLoading(true);
    const data = await getOrders();
    setOrders(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, nextStatus) => {
    setIsUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, nextStatus);

      // Update local state to reflect change without refetching immediately
      setOrders(prevOrders => prevOrders.map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            fulfillment_status: nextStatus
          };
        }
        return o;
      }));
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Filter orders by tab and search
  const filteredOrders = orders.filter(order => {
    const matchesTab = activeTab === 'All' || order.fulfillment_status === activeTab;
    const matchesSearch = order.id.toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (order.customer_email || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const getFulfillmentIcon = (status) => {
    const normalized = (status || '').toLowerCase();
    switch (status) {
      case 'Processing': return <Box size={14} />;
      case 'Packed': return <Box size={14} />;
      case 'Shipped': return <Truck size={14} />;
      case 'In Transit': return <Truck size={14} />;
      case 'Delivered': return <CheckCircle size={14} />;
      default:
        if (normalized === 'in transit') return <Truck size={14} />;
        return null;
    }
  };

  const orderStatusTabs = ['All', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Delivered'];

  return (
    <div className="orders-screen">
      <div className="orders-header">
        <div>
          <h2>Manage Shop Orders</h2>
          <p>Review customer purchases, print shipping details, and update fulfillment states.</p>
        </div>
      </div>

      {/* Tabs and Search Bar */}
      <div className="orders-controls card">
        <div className="orders-tabs">
          {orderStatusTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`order-tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="orders-search">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, buyer name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Orders Grid/List */}
      <div className="orders-list-wrapper">
        {isLoading ? (
          <SkeletonLoader />
        ) : filteredOrders.length === 0 ? (
          <div className="card empty-orders-card">
            <ClipboardList size={48} className="empty-icon" />
            <p>No orders found under "{activeTab}" status.</p>
          </div>
        ) : (
          <div className="orders-grid">
            {filteredOrders.map(order => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card order-item-card"
              >
                <div className="order-item-header">
                  <div>
                    <span className="order-badge-id">{order.id.split('-')[0]}...</span>
                    <span className="order-date-label">
                      <Calendar size={12} style={{ marginRight: '4px' }} /> {new Date(order.created_at).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                  <span className={`badge ${order.fulfillment_status === 'Delivered' ? 'badge-success' :
                      order.fulfillment_status === 'Shipped' ? 'badge-info' : 'badge-warning'
                    }`}>
                    {getFulfillmentIcon(order.fulfillment_status)}
                    <span style={{ marginLeft: '4px' }}>{order.fulfillment_status}</span>
                  </span>
                </div>

                <div className="order-item-body">
                  <div className="order-customer-details">
                    <h4>{order.customer_name}</h4>
                    <span>{order.customer_email || order.customer_phone}</span>
                  </div>

                  <div className="order-items-preview">
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className="preview-row">
                        <span>{item.productName || item.name} <strong className="preview-qty">x{item.quantity}</strong></span>
                        <span>₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total-amount">
                    <span>Total Amount</span>
                    <span className="total-val">₹{order.total_amount}</span>
                  </div>
                </div>

                <div className="order-item-footer">
                  <button
                    onClick={() => navigate('/orders/' + order.id)}
                    className="btn btn-secondary btn-sm"
                  >
                    View Details & Address
                  </button>

                  <div className="fulfillment-actions">
                    {order.fulfillment_status === 'Processing' && (
                      <button
                        onClick={() => navigate('/orders/' + order.id)}
                        className="btn btn-primary btn-sm btn-action-ship"
                      >
                        <Truck size={14} /> Ship Order
                      </button>
                    )}
                    {order.fulfillment_status === 'Shipped' && (
                      <button
                        onClick={() => handleStatusChange(order.id, 'Delivered')}
                        disabled={isUpdatingStatus}
                        className="btn btn-primary btn-sm btn-action-deliver"
                      >
                        <CheckCircle size={14} /> Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .orders-screen {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .orders-header h2 {
          font-size: 1.75rem;
        }

        .orders-header p {
          color: var(--text-secondary);
        }

        .orders-controls {
          display: flex;
          flex-wrap: wrap;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
          padding: 1rem 1.5rem;
        }

        .orders-tabs {
          display: flex;
          gap: 0.5rem;
          background: var(--bg-primary);
          padding: 4px;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .order-tab-btn {
          padding: 0.5rem 1rem;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .order-tab-btn.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .orders-search {
          position: relative;
          display: flex;
          align-items: center;
          min-width: 280px;
        }

        .orders-search input {
          width: 100%;
          padding: 0.6rem 1rem 0.6rem 2.5rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 8px;
          outline: none;
        }

        .orders-search input:focus {
          border-color: var(--accent);
          background: var(--bg-secondary);
        }

        .orders-search .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-secondary);
        }

        .orders-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .order-item-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
        }

        .order-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.75rem;
        }

        .order-badge-id {
          font-weight: 700;
          color: var(--me-navy);
          font-size: 0.95rem;
          margin-right: 0.75rem;
        }

        .order-date-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          display: inline-flex;
          align-items: center;
        }

        .order-item-body {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }

        .order-customer-details h4 {
          font-size: 0.95rem;
          color: var(--text-primary);
        }

        .order-customer-details span {
          font-size: 0.75rem;
          color: var(--text-secondary);
        }

        .order-items-preview {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          background: var(--bg-primary);
          padding: 0.75rem;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        .preview-row {
          display: flex;
          justify-content: space-between;
        }

        .preview-qty {
          color: var(--accent);
        }

        .order-total-amount {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          border-top: 1px dashed var(--border);
          padding-top: 0.75rem;
        }

        .total-val {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--text-primary);
          font-family: 'Montserrat', sans-serif;
        }

        .order-item-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid var(--border);
          padding-top: 1rem;
        }

        .btn-sm {
          padding: 0.45rem 0.9rem;
          font-size: 0.8rem;
          border-radius: 6px;
        }

        .fulfillment-actions {
          display: flex;
          gap: 0.5rem;
        }

        .empty-orders-card {
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        /* Modal scroll settings */
        .order-detail-modal {
          max-width: 720px;
        }

        .modal-body-scroll {
          padding: 1.5rem;
          max-height: 480px;
          overflow-y: auto;
        }

        .detail-section-split {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
          margin-bottom: 1.5rem;
        }

        @media (max-width: 600px) {
          .detail-section-split {
            grid-template-columns: 1fr;
          }
        }

        .detail-shipping-card, .detail-payment-card {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          padding: 1.25rem;
          border-radius: 12px;
        }

        .detail-shipping-card h4, .detail-payment-card h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .shipping-info-item {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .shipping-icon {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .shipping-info-item strong {
          display: block;
          font-size: 0.9rem;
        }

        .shipping-info-item p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
          margin-bottom: 0.5rem;
        }

        .payment-flow-updater {
          margin-top: 1rem;
        }

        .w-full {
          width: 100%;
        }

        .success-delivery-badge {
          background: var(--success-soft);
          color: var(--success);
          border: 1px solid var(--success);
          border-radius: 8px;
          padding: 0.6rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .order-breakdown-container h4 {
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--text-primary);
        }

        .breakdown-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }

        .breakdown-table th, .breakdown-table td {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .breakdown-table th {
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-primary);
        }

        .breakdown-total-row {
          font-weight: 700;
          background: var(--bg-primary);
        }

        .grand-total {
          font-size: 1rem;
          color: var(--accent);
          font-family: 'Montserrat', sans-serif;
        }

        .shipping-input-box {
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .shipping-input-box h5 {
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.8rem;
          text-transform: uppercase;
        }

        .tracking-input {
          width: 100%;
          padding: 0.75rem;
          margin-bottom: 0.75rem;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          border-radius: 6px;
          outline: none;
        }

        .tracking-input:focus {
          border-color: var(--accent);
        }

        .tracking-details {
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px dashed var(--border);
          font-size: 0.85rem;
        }
        
        .order-notes {
          margin-top: 0.5rem;
          font-style: italic;
          color: var(--me-brown);
        }
      `}</style>
    </div>
  );
};

export default OrdersScreen;
