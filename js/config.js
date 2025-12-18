// Supabase Configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // Ganti dengan URL Supabase Anda
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // Ganti dengan Anon Key Anda

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin Password (Ganti dengan password yang aman)
const ADMIN_PASSWORD = 'admin123'; // GANTI INI!

// Helper Functions
function generateRandomToken() {
    return 'RT-' + Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

function showMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'message ' + type;
    }
}

// Check if user is logged in as admin
function checkAdminAuth() {
    return sessionStorage.getItem('adminAuth') === 'true';
}

function setAdminAuth(value) {
    sessionStorage.setItem('adminAuth', value);
}
