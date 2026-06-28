import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin, 
  Mail, 
  Truck,
  CheckCircle
} from 'lucide-react';
import { getOrderById, updateOrderStatus } from '../utils/order';
import SkeletonLoader from '../components/SkeletonLoader';

const OrderDetailsScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tracking inputs for shipping
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      const data = await getOrderById(orderId);
      if (data) {
        setOrder(data);
      } else {
        // If order not found or user lacks permission, navigate back
        navigate('/orders');
      }
      setIsLoading(false);
    };
    if (orderId) loadOrder();
  }, [orderId, navigate]);

  const handleStatusChange = async (nextStatus) => {
    setIsUpdatingStatus(true);
    try {
      let trackingInfo = null;
      if (nextStatus === 'Shipped') {
        if (!trackingNumber || !courierPartner) {
          alert("Please enter both courier partner and tracking number.");
          setIsUpdatingStatus(false);
          return;
        }
        trackingInfo = { trackingNumber, courierPartner };
      }

      const updatedData = await updateOrderStatus(order.id, nextStatus, trackingInfo);
      
      setOrder({
        ...order,
        fulfillment_status: nextStatus,
        ...(trackingInfo && {
          tracking_number: trackingInfo.trackingNumber,
          courier_partner: trackingInfo.courierPartner
        })
      });

      if (nextStatus === 'Shipped') {
        setTrackingNumber('');
        setCourierPartner('');
      }
    } catch (error) {
      alert("Failed to update status.");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="order-details-screen">
        <SkeletonLoader />
      </div>
    );
  }

  if (!order) return null; // handled by useEffect redirect

  return (
    <div className="order-details-screen">
      <div className="orders-header">
        <div>
          <button onClick={() => navigate('/orders')} className="btn btn-secondary btn-sm" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ArrowLeft size={16} /> Back to Orders
          </button>
          <h2>Order Details — {order.id.split('-')[0]}</h2>
          <p>Received on {new Date(order.created_at).toLocaleString()}</p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="order-detail-content"
      >
        <div className="detail-section-split">
          {/* Shipping information */}
          <div className="detail-shipping-card">
            <h4>Customer Shipping Address</h4>
            <div className="shipping-info-item">
              <MapPin size={18} className="shipping-icon" />
              <div>
                <strong>{order.customer_name}</strong>
                <p>{order.shipping_address}</p>
                {order.customer_notes && (
                    <p className="order-notes"><strong>Note:</strong> {order.customer_notes}</p>
                )}
              </div>
            </div>
            {order.customer_email && (
              <div className="shipping-info-item">
                <Mail size={18} className="shipping-icon" />
                <p>{order.customer_email}</p>
              </div>
            )}
            {order.customer_phone && (
              <div className="shipping-info-item">
                <span className="shipping-icon">📞</span>
                <p>{order.customer_phone}</p>
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="detail-payment-card">
            <h4>Fulfillment & Payment</h4>
            <div className="payment-row">
              <span>Payment Status:</span>
              <span className="badge badge-success">{order.payment_status || 'Paid'}</span>
            </div>
            {order.payment_method && (
              <div className="payment-row">
                <span>Method:</span>
                <span>{order.payment_method}</span>
              </div>
            )}
            <div className="payment-row">
              <span>Fulfillment Status:</span>
              <span className={`badge ${
                order.fulfillment_status === 'Delivered' ? 'badge-success' :
                order.fulfillment_status === 'Shipped' ? 'badge-info' : 'badge-warning'
              }`}>
                {order.fulfillment_status}
              </span>
            </div>
            
            {order.tracking_number && (
              <div className="tracking-details">
                <p><strong>Courier:</strong> {order.courier_partner}</p>
                <p><strong>Tracking #:</strong> {order.tracking_number}</p>
              </div>
            )}

            <div className="payment-flow-updater">
              {order.fulfillment_status === 'Processing' && (
                <div className="shipping-input-box">
                  <h5>Enter Shipping Details</h5>
                  <input 
                    type="text" 
                    placeholder="Courier Partner (e.g. BlueDart)"
                    value={courierPartner}
                    onChange={e => setCourierPartner(e.target.value)}
                    className="tracking-input"
                  />
                  <input 
                    type="text" 
                    placeholder="Tracking Number"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="tracking-input"
                  />
                  <button 
                    onClick={() => handleStatusChange('Shipped')} 
                    disabled={isUpdatingStatus}
                    className="btn btn-primary w-full"
                  >
                    <Truck size={16} /> Mark as Shipped
                  </button>
                </div>
              )}
              {order.fulfillment_status === 'Shipped' && (
                <button 
                  onClick={() => handleStatusChange('Delivered')} 
                  disabled={isUpdatingStatus}
                  className="btn btn-primary w-full"
                >
                  <CheckCircle size={16} /> Mark as Fully Delivered
                </button>
              )}
              {order.fulfillment_status === 'Delivered' && (
                <div className="success-delivery-badge">
                  <CheckCircle size={18} /> Payout credited to your balance
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Breakdown Table */}
        <div className="order-breakdown-container card">
          <h4>Ordered Products Breakdown</h4>
          <table className="breakdown-table">
            <thead>
              <tr>
                <th>Product Item</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items && order.items.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.productName || item.name}</td>
                  <td>₹{item.price}</td>
                  <td>{item.quantity} units</td>
                  <td>₹{item.price * item.quantity}</td>
                </tr>
              ))}
              {parseFloat(order.shipping_fee || 0) > 0 && (
                <tr className="breakdown-fee-row">
                  <td colSpan="3">Shipping Fee</td>
                  <td>₹{order.shipping_fee}</td>
                </tr>
              )}
              <tr className="breakdown-total-row">
                <td colSpan="3">Total Grand Amount</td>
                <td className="grand-total">₹{order.total_amount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      <style>{`
        .order-details-screen {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 3rem;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .orders-header h2 {
          font-size: 1.75rem;
          margin-top: 0.5rem;
        }

        .orders-header p {
          color: var(--text-secondary);
        }

        .order-detail-content {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .detail-section-split {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 1.5rem;
        }

        @media (max-width: 768px) {
          .detail-section-split {
            grid-template-columns: 1fr;
          }
        }

        .detail-shipping-card, .detail-payment-card {
          background: var(--bg-primary);
          border: 1px solid var(--border);
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }

        .detail-shipping-card h4, .detail-payment-card h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .shipping-info-item {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .shipping-icon {
          color: var(--accent);
          flex-shrink: 0;
          margin-top: 2px;
        }

        .shipping-info-item strong {
          display: block;
          font-size: 1rem;
        }

        .shipping-info-item p {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }

        .payment-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.95rem;
          margin-bottom: 0.75rem;
        }

        .payment-flow-updater {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px dashed var(--border);
        }

        .w-full {
          width: 100%;
        }

        .success-delivery-badge {
          background: var(--success-soft);
          color: var(--success);
          border: 1px solid var(--success);
          border-radius: 8px;
          padding: 0.8rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          font-weight: 700;
        }

        .order-breakdown-container {
          padding: 1.5rem;
        }

        .order-breakdown-container h4 {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 1rem;
          color: var(--text-primary);
          border-bottom: 1px solid var(--border);
          padding-bottom: 0.5rem;
        }

        .breakdown-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.95rem;
        }

        .breakdown-table th, .breakdown-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .breakdown-table th {
          font-weight: 600;
          color: var(--text-secondary);
          background: var(--bg-secondary);
        }

        .breakdown-total-row {
          font-weight: 700;
          background: var(--bg-secondary);
        }

        .grand-total {
          font-size: 1.1rem;
          color: var(--accent);
          font-family: 'Montserrat', sans-serif;
        }

        .shipping-input-box {
          background: var(--bg-secondary);
          padding: 1rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          margin-bottom: 1rem;
        }

        .shipping-input-box h5 {
          margin-bottom: 0.75rem;
          color: var(--text-secondary);
          font-size: 0.85rem;
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
          font-size: 0.95rem;
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

export default OrderDetailsScreen;
