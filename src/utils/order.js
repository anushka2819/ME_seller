import { supabase } from './supabaseClient';
import { getSellerSession } from './auth';

// Fetch all orders for the logged-in seller
export const getOrders = async () => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('orders')
      .select('*')
      .eq('seller_id', session.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
};

// Update an order's fulfillment status and optional tracking info
export const updateOrderStatus = async (orderId, newStatus, trackingInfo = null) => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    const updatePayload = {
      fulfillment_status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (trackingInfo && trackingInfo.trackingNumber && trackingInfo.courierPartner) {
      updatePayload.tracking_number = trackingInfo.trackingNumber;
      updatePayload.courier_partner = trackingInfo.courierPartner;
    }

    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      // Extra safety check in case RLS is disabled, to ensure sellers only update their own orders
      .eq('seller_id', session.id) 
      .select()
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// Fetch a single order by ID
export const getOrderById = async (orderId) => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .eq('seller_id', session.id)
      .single();

    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Error fetching single order:", error);
    return null;
  }
};
