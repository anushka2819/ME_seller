import { supabase } from './supabaseClient';
import { getSellerSession } from './auth';

// Fetch all products for the logged-in seller
export const getProducts = async () => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('products')
      .select('*')
      .eq('seller_id', session.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return data ? data.map(p => ({
      ...p,
      salesCount: p.sales_count
    })) : [];
  } catch (error) {
    console.error("Error fetching products:", error);
    return [];
  }
};

// Fetch historical views for all products owned by the seller
export const getProductViews = async (productIds = []) => {
  try {
    if (!productIds || productIds.length === 0) return [];

    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('product_views')
      .select('*')
      .in('product_id', productIds);

    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error fetching product views:", error);
    return [];
  }
};

// Upload a single product image to the 'product-images' bucket
export const uploadProductImage = async (file) => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    // Create a unique file name
    const fileExt = file.name.split('.').pop();
    const fileName = `${session.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, file);

    if (error) throw error;

    // Get the public URL
    const { data: publicUrlData } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};

// Save a product (insert new or update existing)
export const saveProduct = async (productData) => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    // Prepare payload, ensuring seller_id is set
    const payload = {
      ...productData,
      seller_id: session.id,
    };

    let result;

    if (productData.id) {
      // Update existing product
      const updatePayload = { ...payload };
      delete updatePayload.id;

      const { data, error } = await supabase
        .schema('marketplace_dataspace')
        .from('products')
        .update(updatePayload)
        .eq('id', productData.id)
        .eq('seller_id', session.id) // Extra safety check
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Insert new product
      const { data, error } = await supabase
        .schema('marketplace_dataspace')
        .from('products')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result;
  } catch (error) {
    console.error("Error saving product:", error);
    throw error;
  }
};

// Delete a product
export const deleteProduct = async (id) => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    const { error } = await supabase
      .schema('marketplace_dataspace')
      .from('products')
      .delete()
      .eq('id', id)
      .eq('seller_id', session.id); // Extra safety check

    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// Quick-update only the stock for a product
export const updateProductStock = async (productId, newStock) => {
  try {
    const session = await getSellerSession();
    if (!session) throw new Error("No active seller session");

    const { data, error } = await supabase
      .schema('marketplace_dataspace')
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId)
      .eq('seller_id', session.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating product stock:", error);
    throw error;
  }
};
