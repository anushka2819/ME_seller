// remove this
export const initStorage = () => {
};

// Analytics helper, calculate stats based on Supabase data
export const getAnalyticsStats = (products = [], orders = []) => {
  const validEarningsOrders = orders
    .filter(o => o.fulfillment_status === 'Delivered' || o.fulfillment_status === 'Shipped');

  const totalEarnings = validEarningsOrders
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  // Calculate earnings trend
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const earningsThisMonth = validEarningsOrders
    .filter(o => new Date(o.created_at) >= currentMonthStart)
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  const earningsLastMonth = validEarningsOrders
    .filter(o => {
      const d = new Date(o.created_at);
      return d >= lastMonthStart && d <= lastMonthEnd;
    })
    .reduce((sum, o) => sum + parseFloat(o.total_amount || 0), 0);

  let earningsTrend = 0;
  if (earningsLastMonth > 0) {
    earningsTrend = parseFloat((((earningsThisMonth - earningsLastMonth) / earningsLastMonth) * 100).toFixed(1));
  } else if (earningsThisMonth > 0) {
    earningsTrend = 100;
  }

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

  const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
  let conversionRate = 0;
  if (totalViews > 0) {
    conversionRate = ((totalItemsSold / totalViews) * 100).toFixed(1);
  }

  return {
    totalEarnings,
    totalItemsSold,
    pendingOrders,
    outOfStockItems,
    monthlyRevenue,
    activeListingsCount: products.filter(p => p.status === 'active').length,
    totalViews,
    conversionRate,
    earningsTrend
  };
};
