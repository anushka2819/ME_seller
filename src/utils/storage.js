// Storage Utility for ME Seller Dashboard

const SELLER_KEY = 'me_seller_session';
const PRODUCTS_KEY = 'me_seller_products';
const ORDERS_KEY = 'me_seller_orders';

// Initial mock orders
const DEFAULT_ORDERS = [
  {
    id: 'ORD-8924',
    date: '2026-06-18',
    customerName: 'Meera Surendran',
    customerEmail: 'meerasurendran2326@gmail.com',
    shippingAddress: 'Flat 4B, Emerald Heights, Marine Drive, Kochi, Kerala - 682031',
    items: [
      { productId: 'prod_1', productName: 'Mindful Journal', quantity: 2, price: 450 },
      { productId: 'prod_2', productName: 'Empowerment Tote Bag', quantity: 1, price: 320 }
    ],
    totalAmount: 1220,
    paymentStatus: 'paid',
    fulfillmentStatus: 'Processing'
  },
  {
    id: 'ORD-8920',
    date: '2026-06-17',
    customerName: 'Arjun Nair',
    customerEmail: 'arjun.nair@outlook.com',
    shippingAddress: 'House No. 12, Rose Gardens, Aluva, Ernakulam - 683101',
    items: [
      { productId: 'prod_7', productName: 'ME Community Hoodie', quantity: 1, price: 1200 }
    ],
    totalAmount: 1200,
    paymentStatus: 'paid',
    fulfillmentStatus: 'Shipped'
  },
  {
    id: 'ORD-8912',
    date: '2026-06-15',
    customerName: 'Anjali Menon',
    customerEmail: 'anjali.m@gmail.com',
    shippingAddress: '43/2901, Green Valley Apartments, Kakkanad, Kochi - 682030',
    items: [
      { productId: 'prod_3', productName: 'Self-Care Kit', quantity: 2, price: 280 }
    ],
    totalAmount: 560,
    paymentStatus: 'paid',
    fulfillmentStatus: 'Delivered'
  },
  {
    id: 'ORD-8898',
    date: '2026-06-12',
    customerName: 'Rohan Sharma',
    customerEmail: 'rohan.sharma@yahoo.com',
    shippingAddress: 'Block C, Sector 15, Dwarka, New Delhi - 110075',
    items: [
      { productId: 'prod_1', productName: 'Mindful Journal', quantity: 1, price: 450 },
      { productId: 'prod_4', productName: 'Mental Health Planner', quantity: 1, price: 550 }
    ],
    totalAmount: 1000,
    paymentStatus: 'paid',
    fulfillmentStatus: 'Delivered'
  }
];

// Initialization check
export const initStorage = () => {
  if (!localStorage.getItem(ORDERS_KEY)) {
    localStorage.setItem(ORDERS_KEY, JSON.stringify(DEFAULT_ORDERS));
  }
};

// Product management functions moved to product.js

// Order management functions
export const getOrders = () => {
  initStorage();
  return JSON.parse(localStorage.getItem(ORDERS_KEY)) || [];
};

export const updateOrderStatus = (orderId, newStatus) => {
  const orders = getOrders();
  const idx = orders.findIndex(o => o.id === orderId);
  if (idx !== -1) {
    orders[idx].fulfillmentStatus = newStatus;
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  }
  return orders;
};

// Analytics helper
export const getAnalyticsStats = (products = []) => {
  const orders = getOrders();

  const totalEarnings = orders
    .filter(o => o.fulfillmentStatus === 'Delivered' || o.fulfillmentStatus === 'Shipped')
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrders = orders.filter(o => o.fulfillmentStatus === 'Processing').length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  const totalItemsSold = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);

  // Generate some monthly earnings data for chart
  const monthlyRevenue = [
    { name: 'Jan', revenue: 4000 },
    { name: 'Feb', revenue: 5000 },
    { name: 'Mar', revenue: 8000 },
    { name: 'Apr', revenue: 7500 },
    { name: 'May', revenue: 11000 },
    { name: 'Jun', revenue: totalEarnings + 8000 } // current month plus previous mock base
  ];

  return {
    totalEarnings,
    totalItemsSold,
    pendingOrders,
    outOfStockItems,
    monthlyRevenue,
    activeListingsCount: products.filter(p => p.status === 'active').length
  };
};
