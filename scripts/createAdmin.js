import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env file in the root directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file.");
  console.error("Please ensure you have added SUPABASE_SERVICE_ROLE_KEY to your .env file.");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];
  const shopName = process.argv[4] || 'Admin Shop';
  const ownerName = process.argv[5] || 'Admin Owner';

  if (!email || !password) {
    console.error("Usage: node scripts/createAdmin.js <email> <password> [shopName] [ownerName]");
    process.exit(1);
  }

  console.log(`Creating admin user: ${email}`);

  // 1. Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Auto-confirm email
  });

  if (authError) {
    console.error("Error creating auth user:", authError.message);
    process.exit(1);
  }

  const userId = authData.user.id;
  console.log(`User created successfully with ID: ${userId}`);

  // 2. Insert into marketplace_dataspace.sellers with is_admin = true
  const { error: insertError } = await supabaseAdmin
    .schema('marketplace_dataspace')
    .from('sellers')
    .insert([
      {
        id: userId,
        shop_name: shopName,
        owner_name: ownerName,
        category: 'Admin',
        balance: 0.00,
        is_admin: true
      }
    ]);

  if (insertError) {
    console.error("Error adding to sellers table:", insertError.message);
    process.exit(1);
  }

  console.log("Admin account successfully created and granted admin privileges!");
}

createAdmin();
