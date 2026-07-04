import { supabase } from "./supabaseClient";
import { createClient } from '@supabase/supabase-js';

// get current session and fetch their seller profile from the database
export const getSellerSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) return null;

    //Fetch the seller's profile from your custom schema
    const { data: sellerData, error: profileError } = await supabase
        .schema('marketplace_dataspace')
        .from('sellers')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

    if (profileError) {
        console.error("Error fecthing seller profile:", profileError);
        return null;
    }


    // Combine auth data and database profile data
    return {
        id: session.user.id,
        email: session.user.email,
        shopName: sellerData.shop_name,
        ownerName: sellerData.owner_name,
        category: sellerData.category,
        balance: sellerData.balance,
        phone: sellerData.phone,
        description: sellerData.description,
        logo: sellerData.logo,
        locationUrl: sellerData.location_url,
        bankName: sellerData.bank_name,
        accountNumber: sellerData.account_number,
        ifsc: sellerData.ifsc,
        aboutSeller: sellerData.about,
        is_admin: sellerData.is_admin || false
    };
};

//Login Seller
export const loginSeller = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;

    // Fetch their profile to return the full session object
    const { data: sellerData, error: profileError } = await supabase
        .schema('marketplace_dataspace')
        .from('sellers')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

    if (profileError) throw profileError;

    return {
        id: data.user.id,
        email: data.user.email,
        shopName: sellerData.shop_name,
        ownerName: sellerData.owner_name,
        category: sellerData.category,
        balance: sellerData.balance,
        phone: sellerData.phone,
        description: sellerData.description,
        logo: sellerData.logo,
        locationUrl: sellerData.location_url,
        bankName: sellerData.bank_name,
        accountNumber: sellerData.account_number,
        ifsc: sellerData.ifsc,
        aboutSeller: sellerData.about,
        is_admin: sellerData.is_admin || false
    };
};

//Register Seller as Admin (without logging out current admin)
export const registerSellerAsAdmin = async (email, password, shopDetails) => {
    // Create a temporary client that doesn't save the session to local storage
    const tempSupabase = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY,
        { auth: { persistSession: false, autoRefreshToken: false } }
    );

    // Sign up using the temp client
    const { data: authData, error: authError } = await tempSupabase.auth.signUp({
        email,
        password,
    });
    if (authError) throw authError;

    // Insert shop details into sellers table using the main admin client
    const { error: insertError } = await supabase
        .schema('marketplace_dataspace')
        .from('sellers')
        .insert([
            {
                id: authData.user.id,
                shop_name: shopDetails.shopName,
                owner_name: shopDetails.ownerName,
                category: shopDetails.category,
                balance: 0.00,
                logo: shopDetails.logo || null
            }
        ]);

    if (insertError) throw insertError;

    return {
        id: authData.user.id,
        email: authData.user.email,
        shopName: shopDetails.shopName,
        ownerName: shopDetails.ownerName,
        category: shopDetails.category,
        balance: 0.00,
        is_admin: false
    };
};

//Register Seller
export const registerSeller = async (email, password, shopDetails) => {
    // Sign up  the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });
    if (authError) throw authError;

    // Insert shop details intp sellers table
    const { error: insertError } = await supabase
        .schema('marketplace_dataspace')
        .from('sellers')
        .insert([
            {
                id: authData.user.id, // Link to the auth user
                shop_name: shopDetails.shopName,
                owner_name: shopDetails.ownerName,
                category: shopDetails.category,
                balance: 0.00
            }
        ]);

    if (insertError) throw insertError;

    return {
        id: authData.user.id,
        email: authData.user.email,
        shopName: shopDetails.shopName,
        ownerName: shopDetails.ownerName,
        category: shopDetails.category,
        balance: 0.00,
        is_admin: false
    };
};

// Logout
export const logoutSeller = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

// Upload a shop logo to the 'shop-logos' bucket
export const uploadShopLogo = async (file) => {
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No active seller session");

        const fileExt = file.name.split('.').pop();
        const fileName = `${session.user.id}/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('shop-logos')
            .upload(fileName, file);

        if (error) throw error;

        const { data: publicUrlData } = supabase.storage
            .from('shop-logos')
            .getPublicUrl(fileName);

        return publicUrlData.publicUrl;
    } catch (error) {
        console.error("Error uploading shop logo:", error);
        throw error;
    }
};

// Update Seller Profile
export const updateSellerProfile = async (updatedDetails) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;

    const { error } = await supabase
        .schema('marketplace_dataspace')
        .from('sellers')
        .update({
            shop_name: updatedDetails.shopName,
            owner_name: updatedDetails.ownerName,
            category: updatedDetails.category,
            phone: updatedDetails.phone,
            description: updatedDetails.description,
            logo: updatedDetails.logo,
            location_url: updatedDetails.locationUrl,
            bank_name: updatedDetails.bankName,
            account_number: updatedDetails.accountNumber,
            ifsc: updatedDetails.ifsc,
            about: updatedDetails.aboutSeller
        })
        .eq('id', session.user.id);

    if (error) throw error;
    return true;
};