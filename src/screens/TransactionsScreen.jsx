import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ReceiptText,
  IndianRupee,
  Clock3,
  CheckCircle2,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  CreditCard
} from 'lucide-react';
import { getOrders } from '../utils/order';
import { getAnalyticsStats } from '../utils/storage';

const currencyFormat = (value) => `₹${parseFloat(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

const getTransactionStatus = (order) => {
  const paymentStatus = (order.payment_status || '').toLowerCase();
  const fulfillment = (order.fulfillment_status || '').toLowerCase();

  if (paymentStatus === 'refunded' || paymentStatus === 'partial_refund') return 'Refunded';
  if (paymentStatus === 'failed' || fulfillment === 'cancelled') return 'Failed';
  if (paymentStatus === 'pending' || fulfillment === 'processing') return 'Pending';
  return 'Completed';
};

const getStatusBadgeClass = (status) => {
  switch (status) {
    case 'Completed': return 'badge-success';
    case 'Pending': return 'badge-warning';
    case 'Refunded': return 'badge-info';
    case 'Failed': return 'badge-danger';
    default: return 'badge-info';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'Completed': return <CheckCircle2 size={14} />;
    case 'Pending': return <Clock3 size={14} />;
    case 'Refunded': return <ArrowDownRight size={14} />;
    case 'Failed': return <AlertCircle size={14} />;
    default: return <AlertCircle size={14} />;
  }
};

const TransactionsScreen = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      const data = await getOrders();
      setOrders(data);
      setIsLoading(false);
    };

    loadTransactions();
  }, []);

  const transactionRows = [...orders]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .map(order => ({
      id: order.id,
      orderId: order.id,
      customerName: order.customer_name || 'Unknown Customer',
      customerContact: order.customer_email || order.customer_phone || '-',
      amount: parseFloat(order.total_amount || 0),
      status: getTransactionStatus(order),
      paymentMethod: order.payment_method || 'Not specified',
      createdAt: order.created_at,
      fulfillmentStatus: order.fulfillment_status || 'Unknown'
    }));

  const filteredRows = transactionRows.filter((row) => {
    const matchesFilter = activeFilter === 'All' || row.status === activeFilter;
    const haystack = [row.orderId, row.customerName, row.customerContact, row.paymentMethod, row.status, row.fulfillmentStatus]
      .join(' ')
      .toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const summary = transactionRows.reduce((acc, row) => {
    acc.totalTransactions += 1;
    acc.totalAmount += row.amount;
    if (row.status === 'Completed') acc.completedAmount += row.amount;
    if (row.status === 'Pending') acc.pendingAmount += row.amount;
    if (row.status === 'Refunded') acc.refundedAmount += row.amount;
    if (row.status === 'Failed') acc.failedAmount += row.amount;
    return acc;
  }, {
    totalTransactions: 0,
    totalAmount: 0,
    completedAmount: 0,
    pendingAmount: 0,
    refundedAmount: 0,
    failedAmount: 0
  });

  const dashboardStats = getAnalyticsStats([], orders);
  const completedOrdersRevenue = dashboardStats.totalEarnings;

  const summaryCards = [
    {
      label: 'Total Revenue',
      value: currencyFormat(summary.totalAmount),
      icon: IndianRupee,
      className: 'color-accent'
    },
    {
      label: 'Completed Orders Payments',
      value: currencyFormat(completedOrdersRevenue),
      icon: ArrowUpRight,
      className: 'color-success'
    },
    {
      label: 'Pending Payments',
      value: currencyFormat(summary.pendingAmount),
      icon: Clock3,
      className: 'color-warning'
    },
    {
      label: 'Refunded / Failed',
      value: currencyFormat(summary.refundedAmount + summary.failedAmount),
      icon: ArrowDownRight,
      className: 'color-danger'
    }
  ];

  return (
    <div className="transactions-screen">
      <div className="transactions-header">
        <div>
          <h2>Transactions</h2>
          <p>Payment lifecycle history pulled from your existing orders table.</p>
        </div>
        <div className="transactions-header-badge">
          <ReceiptText size={16} />
          <span>{summary.totalTransactions} records</span>
        </div>
      </div>

      <div className="transactions-summary-grid">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="card transaction-summary-card"
            >
              <div className={`summary-icon ${card.className}`}>
                <Icon size={18} />
              </div>
              <div>
                <span>{card.label}</span>
                <h3>{card.value}</h3>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="card transactions-controls-card">
        <div className="transactions-filters-row">
          <div className="transactions-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order, customer, payment method..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="transactions-tabs">
            {['All', 'Completed', 'Pending', 'Refunded', 'Failed'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveFilter(tab)}
                className={`transaction-tab ${activeFilter === tab ? 'active' : ''}`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="card transactions-table-card">
        <div className="transactions-table-header">
          <div>
            <h3>Transaction Log</h3>
            <p>Showing orders that represent payment activity.</p>
          </div>
          <div className="transactions-table-meta">
            <Filter size={14} />
            <span>{filteredRows.length} visible</span>
          </div>
        </div>

        <div className="table-responsive">
          <table className="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Payment Method</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="empty-table-row">Loading transaction history...</td>
                </tr>
              ) : filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-table-row">No transactions found for the selected filter.</td>
                </tr>
              ) : (
                filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="transaction-date-cell">
                        <Calendar size={14} />
                        <span>{new Date(row.createdAt).toLocaleDateString('en-GB')}</span>
                      </div>
                    </td>
                    <td className="order-id-cell">{row.orderId.split('-')[0]}...</td>
                    <td>
                      <div className="customer-cell">
                        <strong>{row.customerName}</strong>
                        <span>{row.customerContact}</span>
                      </div>
                    </td>
                    <td>
                      <div className="payment-method-cell">
                        <CreditCard size={14} />
                        <span>{row.paymentMethod}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(row.status)}`}>
                        {getStatusIcon(row.status)}
                        <span style={{ marginLeft: '4px' }}>{row.status}</span>
                      </span>
                    </td>
                    <td className="amount-cell">{currencyFormat(row.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .transactions-screen {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .transactions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border);
        }

        .transactions-header h2 {
          font-size: 1.75rem;
        }

        .transactions-header p {
          color: var(--text-secondary);
        }

        .transactions-header-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.65rem 1rem;
          border-radius: 999px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-secondary);
          box-shadow: var(--shadow);
          white-space: nowrap;
        }

        .transactions-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
        }

        .transaction-summary-card {
          display: flex;
          align-items: center;
          gap: 0.9rem;
        }

        .transaction-summary-card span {
          display: block;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 700;
          color: var(--text-secondary);
          margin-bottom: 0.2rem;
        }

        .transaction-summary-card h3 {
          font-size: 1.1rem;
          font-family: 'Montserrat', sans-serif;
        }

        .summary-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .color-accent { background: var(--accent-soft); color: var(--accent); }
        .color-success { background: var(--success-soft); color: var(--success); }
        .color-warning { background: var(--warning-soft); color: var(--warning); }
        .color-danger { background: var(--danger-soft); color: var(--danger); }

        .transactions-controls-card {
          padding: 1rem 1.25rem;
        }

        .transactions-filters-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .transactions-search {
          position: relative;
          flex: 1;
          min-width: 280px;
        }

        .transactions-search input {
          width: 100%;
          padding: 0.8rem 1rem 0.8rem 2.6rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          background: var(--bg-primary);
          outline: none;
        }

        .transactions-search input:focus {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px var(--accent-soft);
          background: var(--bg-secondary);
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-secondary);
        }

        .transactions-tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          background: var(--bg-primary);
          padding: 0.35rem;
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .transaction-tab {
          padding: 0.55rem 0.95rem;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .transaction-tab.active {
          background: var(--bg-secondary);
          color: var(--text-primary);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
        }

        .transactions-table-card {
          overflow: hidden;
        }

        .transactions-table-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .transactions-table-header h3 {
          font-size: 1.1rem;
        }

        .transactions-table-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .transactions-table-meta {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .transactions-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .transactions-table th,
        .transactions-table td {
          padding: 1rem 0.9rem;
          border-bottom: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .transactions-table th {
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
        }

        .transaction-date-cell,
        .payment-method-cell {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
        }

        .customer-cell span {
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        .order-id-cell,
        .amount-cell {
          font-weight: 700;
          font-family: 'Montserrat', sans-serif;
        }

        .empty-table-row {
          text-align: center;
          padding: 3rem 1rem !important;
          color: var(--text-secondary);
        }

        @media (max-width: 1100px) {
          .transactions-summary-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 700px) {
          .transactions-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .transactions-table-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .transactions-summary-grid {
            grid-template-columns: 1fr;
          }

          .transactions-filters-row {
            flex-direction: column;
            align-items: stretch;
          }

          .transactions-tabs {
            overflow-x: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default TransactionsScreen;
