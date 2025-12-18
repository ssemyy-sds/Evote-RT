// Supabase Configuration
const SUPABASE_URL = 'https://recyuuurbxzczrmnwkzp.supabase.co'; // ← PASTE URL Anda
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3l1dXVyYnh6Y3pybW53a3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDczNDEsImV4cCI6MjA4MTYyMzM0MX0.S96kYD64TgolKffPdvLOmKL1Ls5lFgkgk7A_B1g-Asw'; // ← PASTE KEY Anda

// Initialize Supabase Client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Admin Password (Ganti dengan password yang aman)
const ADMIN_PASSWORD = 'admin123'; // ← GANTI INI!

// Demo Password
const DEMO_PASSWORD = 'demo2024'; // ← GANTI INI!

// Storage bucket name
const STORAGE_BUCKET = 'candidate-photos';

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

