import { supabase } from './supabaseClient.js';

// Fetch all registered sellers/NGOs
export const getAllSellers = async () => {
  try {
    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('sellers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all sellers:", error);
    return [];
  }
};

// Fetch all products across all sellers
export const getAllProducts = async () => {
  try {
    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all products:", error);
    return [];
  }
};

// Fetch all orders across the entire platform
export const getAllOrders = async () => {
  try {
    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching all orders:", error);
    return [];
  }
};

// Fetch a single seller's profile, products, and orders
export const getSellerDetails = async (sellerId) => {
  try {
    // 1. Fetch seller profile
    const { data: seller, error: sellerError } = await supabase
      .schema('marketplace_dataspace')
      .from('sellers')
      .select('*')
      .eq('id', sellerId)
      .maybeSingle();

    if (sellerError) throw sellerError;
    if (!seller) return null;

    // 2. Fetch seller's products
    const { data: products, error: productsError } = await supabase
      .schema('marketplace_dataspace')
      .from('products')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (productsError) throw productsError;

    // 3. Fetch seller's orders
    const { data: orders, error: ordersError } = await supabase
      .schema('marketplace_dataspace')
      .from('orders')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false });

    if (ordersError) throw ordersError;

    return {
      seller: {
        id: seller.id,
        shopName: seller.shop_name,
        ownerName: seller.owner_name,
        category: seller.category,
        balance: seller.balance,
        phone: seller.phone,
        description: seller.description,
        logo: seller.logo,
        locationUrl: seller.location_url,
        bankName: seller.bank_name,
        accountNumber: seller.account_number,
        ifsc: seller.ifsc,
        aboutSeller: seller.about,
        is_admin: seller.is_admin || false,
        createdAt: seller.created_at
      },
      products: products || [],
      orders: orders || []
    };
  } catch (error) {
    console.error(`Error fetching details for seller ${sellerId}:`, error);
    return null;
  }
};

// Process a seller payout by resetting their balance to 0
export const processSellerPayout = async (sellerId) => {
  try {
    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('sellers')
      .update({ balance: 0.00 })
      .eq('id', sellerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error processing payout for seller ${sellerId}:`, error);
    throw error;
  }
};
