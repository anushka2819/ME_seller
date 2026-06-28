import { supabase } from './supabaseClient';

// Fetch notifications for a given seller ID (no internal session call)
export const getNotifications = async (sellerId) => {
  try {
    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('shop_notifications')
      .select('*')
      .eq('seller_id', sellerId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (sellerId, notificationId) => {
  try {
    const { error } = await supabase
      .schema('marketplace_dataspace')
      .from('shop_notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('seller_id', sellerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

export const clearAllNotifications = async (sellerId) => {
  try {
    const { error } = await supabase
      .schema('marketplace_dataspace')
      .from('shop_notifications')
      .delete()
      .eq('seller_id', sellerId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
};
