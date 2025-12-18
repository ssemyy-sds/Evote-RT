// Supabase Configuration yg lama
//const SUPABASE_URL = 'https://recyuuurbxzczrmnwkzp.supabase.co'; // ← PASTE URL Anda
//const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3l1dXVyYnh6Y3pybW53a3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDczNDEsImV4cCI6MjA4MTYyMzM0MX0.S96kYD64TgolKffPdvLOmKL1Ls5lFgkgk7A_B1g-Asw'; // ← PASTE KEY Anda

// Initialize Supabase Client
//const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// SUPABASE CONFIGURATION
// ============================================

const CONFIG = {
    supabaseUrl: 'https://recyuuurbxzczrmnwkzp.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3l1dXVyYnh6Y3pybW53a3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDczNDEsImV4cCI6MjA4MTYyMzM0MX0.S96kYD64TgolKffPdvLOmKL1Ls5lFgkgk7A_B1g-Asw',
    adminPassword: 'admin123', // GANTI INI!
    demoPassword: 'demo2024',  // GANTI INI!
    storageBucket: 'candidate-photos'
};

// Initialize Supabase Client
const supabase = window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseKey);

// Backward compatibility - untuk code yang masih pakai variable lama
const SUPABASE_URL = CONFIG.supabaseUrl;
const SUPABASE_ANON_KEY = CONFIG.supabaseKey;
const ADMIN_PASSWORD = CONFIG.adminPassword;
const DEMO_PASSWORD = CONFIG.demoPassword;
const STORAGE_BUCKET = CONFIG.storageBucket;

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function checkAdminAuth() {
    return sessionStorage.getItem('adminAuth') === 'true';
}

function setAdminAuth(value) {
    sessionStorage.setItem('adminAuth', value);
}

// ============================================
// IMAGE UPLOAD FUNCTIONS
// ============================================

async function uploadImage(file) {
    try {
        if (!file) {
            throw new Error('Tidak ada file yang dipilih');
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Format file harus JPG, PNG, GIF, atau WebP');
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            throw new Error('Ukuran file maksimal 2MB');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `candidates/${fileName}`;

        const { data, error } = await supabase.storage
            .from(CONFIG.storageBucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(CONFIG.storageBucket)
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function deleteImage(imageUrl) {
    try {
        if (!imageUrl || !imageUrl.includes(CONFIG.storageBucket)) {
            return;
        }

        const urlParts = imageUrl.split(`${CONFIG.storageBucket}/`);
        if (urlParts.length < 2) return;
        
        const filePath = urlParts[1].split('?')[0];

        const { error } = await supabase.storage
            .from(CONFIG.storageBucket)
            .remove([filePath]);

        if (error) throw error;

    } catch (error) {
        console.error('Delete image error:', error);
    }
}

function compressImage(file, maxWidth = 800, maxHeight = 800, quality = 0.8) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        resolve(new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: Date.now()
                        }));
                    },
                    'image/jpeg',
                    quality
                );
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
}

// ============================================
// INITIALIZATION LOG
// ============================================

console.log('✅ Supabase Config Loaded');
console.log('📡 Connected to:', CONFIG.supabaseUrl);
console.log('🗄️ Storage Bucket:', CONFIG.storageBucket);

// Test connection
supabase.from('candidates').select('count', { count: 'exact', head: true })
    .then(({ count, error }) => {
        if (error) {
            console.error('❌ Database connection failed:', error.message);
        } else {
            console.log('✅ Database connected successfully');
            console.log('📊 Total candidates:', count || 0);
        }
    });
