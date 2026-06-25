// remove this
export const initStorage = () => {
};

// Analytics helper, calculate stats based on Supabase data
export const getAnalyticsStats = (products = [], orders = []) => {
  const totalEarnings = orders
    .filter(o => o.fulfillment_status === 'Delivered' || o.fulfillment_status === 'Shipped')
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const pendingOrders = orders.filter(o => o.fulfillment_status === 'Processing').length;
  const outOfStockItems = products.filter(p => p.stock === 0).length;
  const totalItemsSold = orders
    .filter(o => o.fulfillment_status === 'Delivered')
    .reduce((sum, o) => sum + (o.items ? o.items.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0) : 0), 0);

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
