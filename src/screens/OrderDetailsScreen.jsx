import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  MapPin, 
  Mail, 
  Truck,
  CheckCircle,
  Package,
  RotateCw,
  CircleDashed
} from 'lucide-react';
import { getOrderById, updateOrderStatus } from '../utils/order';
import SkeletonLoader from '../components/SkeletonLoader';

const TRACKING_STEPS = [
  { value: 'Processing', label: 'Order Placed' },
  { value: 'Packed', label: 'Order Packed' },
  { value: 'Shipped', label: 'Order Shipped' },
  { value: 'In Transit', label: 'In Transit' },
  { value: 'Delivered', label: 'Delivered' }
];

const normalizeTrackingStatus = (status = '') => {
  const normalized = status.toLowerCase().trim();

  if (['processing', 'placed', 'order placed'].includes(normalized)) return 'Processing';
  if (['packed', 'order packed'].includes(normalized)) return 'Packed';
  if (['shipped', 'order shipped'].includes(normalized)) return 'Shipped';
  if (['in transit', 'transit'].includes(normalized)) return 'In Transit';
  if (['delivered', 'completed'].includes(normalized)) return 'Delivered';

  return 'Processing';
};

const getTrackingStepIndex = (status) => {
  const normalized = normalizeTrackingStatus(status);
  const index = TRACKING_STEPS.findIndex(step => step.value === normalized);
  return index === -1 ? 0 : index;
};

const getTrackingStepLabel = (status) => {
  const normalized = normalizeTrackingStatus(status);
  const step = TRACKING_STEPS.find(item => item.value === normalized);
  return step ? step.label : 'Order Placed';
};

const OrderDetailsScreen = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tracking inputs for shipping
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierPartner, setCourierPartner] = useState('');
  const [selectedTrackingStatus, setSelectedTrackingStatus] = useState('Packed');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      setIsLoading(true);
      const data = await getOrderById(orderId);
      if (data) {
        setOrder(data);
        const currentIndex = getTrackingStepIndex(data.fulfillment_status);
        setSelectedTrackingStatus(TRACKING_STEPS[Math.min(currentIndex + 1, TRACKING_STEPS.length - 1)].value);
      } else {
        // If order not found or user lacks permission, navigate back
        navigate('/orders');
      }
      setIsLoading(false);
    };
    if (orderId) loadOrder();
  }, [orderId, navigate]);

  useEffect(() => {
    if (!order) return;

    const currentIndex = getTrackingStepIndex(order.fulfillment_status);
    setSelectedTrackingStatus(TRACKING_STEPS[Math.min(currentIndex + 1, TRACKING_STEPS.length - 1)].value);
  }, [order]);

  const handleStatusChange = async (nextStatus) => {
    setIsUpdatingStatus(true);
    try {
      let trackingInfo = null;
      const needsTrackingDetails = nextStatus === 'Shipped' || nextStatus === 'In Transit';

      if (needsTrackingDetails) {
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

      if (needsTrackingDetails) {
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

  const currentTrackingIndex = getTrackingStepIndex(order.fulfillment_status);
  const availableTrackingSteps = TRACKING_STEPS.slice(currentTrackingIndex + 1);

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
                normalizeTrackingStatus(order.fulfillment_status) === 'Delivered' ? 'badge-success' :
                normalizeTrackingStatus(order.fulfillment_status) === 'In Transit' ? 'badge-info' :
                normalizeTrackingStatus(order.fulfillment_status) === 'Packed' ? 'badge-warning' : 'badge-warning'
              }`}>
                {getTrackingStepLabel(order.fulfillment_status)}
              </span>
            </div>

            <div className="tracking-stepper">
              {TRACKING_STEPS.map((step, idx) => {
                const isDone = idx < currentTrackingIndex;
                const isActive = idx === currentTrackingIndex;

                return (
                  <div key={step.value} className={`tracking-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}>
                    <div className="tracking-step-dot">
                      {isDone ? <CheckCircle size={12} /> : isActive ? <CircleDashed size={12} /> : <Package size={12} />}
                    </div>
                    <span>{step.label}</span>
                  </div>
                );
              })}
            </div>
            
            {order.tracking_number && (
              <div className="tracking-details">
                <p><strong>Courier:</strong> {order.courier_partner}</p>
                <p><strong>Tracking #:</strong> {order.tracking_number}</p>
              </div>
            )}

            <div className="payment-flow-updater">
              {availableTrackingSteps.length > 0 && (
                <div className="shipping-input-box">
                  <h5>Update Tracking Status</h5>
                  <select
                    value={selectedTrackingStatus}
                    onChange={(e) => setSelectedTrackingStatus(e.target.value)}
                    className="tracking-input"
                  >
                    {availableTrackingSteps.map(step => (
                      <option key={step.value} value={step.value}>{step.label}</option>
                    ))}
                  </select>
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
                    onClick={() => handleStatusChange(selectedTrackingStatus)} 
                    disabled={isUpdatingStatus}
                    className="btn btn-primary w-full"
                  >
                    {selectedTrackingStatus === 'Packed' ? <Package size={16} /> : selectedTrackingStatus === 'In Transit' ? <RotateCw size={16} /> : <Truck size={16} />}
                    Update to {getTrackingStepLabel(selectedTrackingStatus)}
                  </button>
                </div>
              )}
              {normalizeTrackingStatus(order.fulfillment_status) === 'Shipped' && (
                <button 
                  onClick={() => handleStatusChange('Delivered')} 
                  disabled={isUpdatingStatus}
                  className="btn btn-primary w-full"
                >
                  <CheckCircle size={16} /> Mark as Fully Delivered
                </button>
              )}
              {normalizeTrackingStatus(order.fulfillment_status) === 'Delivered' && (
                <div className="success-delivery-badge">
                  <CheckCircle size={18} /> Payout credited to your balance
                </div>
              )}
              {currentTrackingIndex === 0 && (
                <div className="tracking-hint">
                  <Package size={16} /> Start tracking from Order Placed, then move through packing, shipping, transit, and delivery.
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

        .tracking-stepper {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 0.5rem;
          margin-top: 1rem;
          padding: 1rem;
          border-radius: 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
        }

        .tracking-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.45rem;
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.75rem;
          font-weight: 600;
        }

        .tracking-step-dot {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
        }

        .tracking-step.done .tracking-step-dot {
          background: var(--success-soft);
          color: var(--success);
          border-color: var(--success);
        }

        .tracking-step.active {
          color: var(--text-primary);
        }

        .tracking-step.active .tracking-step-dot {
          background: var(--accent-soft);
          color: var(--accent);
          border-color: var(--accent);
        }

        .tracking-hint {
          margin-top: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
          padding: 0.75rem 1rem;
          border-radius: 10px;
          background: var(--bg-primary);
          border: 1px dashed var(--border);
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

        .shipping-input-box .tracking-input:first-child {
          appearance: none;
          -webkit-appearance: none;
          cursor: pointer;
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

        @media (max-width: 900px) {
          .tracking-stepper {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 520px) {
          .tracking-stepper {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetailsScreen;
