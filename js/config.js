// ============================================
// PEMILIHAN RT - CONFIGURATION
// ============================================

// Supabase Configuration Object
const AppConfig = {
    supabase: {
        url: 'https://recyuuurbxzczrmnwkzp.supabase.co',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3l1dXVyYnh6Y3pybW53a3pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwNDczNDEsImV4cCI6MjA4MTYyMzM0MX0.S96kYD64TgolKffPdvLOmKL1Ls5lFgkgk7A_B1g-Asw'
    },
    passwords: {
        admin: 'admin123',  // GANTI INI!
        demo: 'demo2024'    // GANTI INI!
    },
    storage: {
        bucket: 'candidate-photos'
    }
};

// Initialize Supabase Client
let supabaseClient;

function initializeSupabase() {
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase library not loaded');
        return null;
    }
    
    if (!supabaseClient) {
        supabaseClient = window.supabase.createClient(
            AppConfig.supabase.url, 
            AppConfig.supabase.key
        );
        console.log('✅ Supabase initialized');
    }
    
    return supabaseClient;
}

// Auto-initialize
const supabase = initializeSupabase();

// Backward compatibility
const SUPABASE_URL = AppConfig.supabase.url;
const SUPABASE_ANON_KEY = AppConfig.supabase.key;
const ADMIN_PASSWORD = AppConfig.passwords.admin;
const DEMO_PASSWORD = AppConfig.passwords.demo;
const STORAGE_BUCKET = AppConfig.storage.bucket;

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
    if (!supabase) {
        throw new Error('Supabase not initialized');
    }

    try {
        if (!file) {
            throw new Error('Tidak ada file yang dipilih');
        }

        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Format file harus JPG, PNG, GIF, atau WebP');
        }

        const maxSize = 2 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new Error('Ukuran file maksimal 2MB');
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `candidates/${fileName}`;

        const { data, error } = await supabase.storage
            .from(AppConfig.storage.bucket)
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        const { data: urlData } = supabase.storage
            .from(AppConfig.storage.bucket)
            .getPublicUrl(filePath);

        return urlData.publicUrl;

    } catch (error) {
        console.error('Upload error:', error);
        throw error;
    }
}

async function deleteImage(imageUrl) {
    if (!supabase) return;

    try {
        if (!imageUrl || !imageUrl.includes(AppConfig.storage.bucket)) {
            return;
        }

        const urlParts = imageUrl.split(`${AppConfig.storage.bucket}/`);
        if (urlParts.length < 2) return;
        
        const filePath = urlParts[1].split('?')[0];

        const { error } = await supabase.storage
            .from(AppConfig.storage.bucket)
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
// VERIFICATION
// ============================================

// Verify Supabase connection
if (supabase && supabase.from) {
    console.log('✅ Config loaded successfully');
    console.log('📡 Supabase URL:', AppConfig.supabase.url);
    
    // Test connection
    supabase.from('candidates').select('count', { count: 'exact', head: true })
        .then(({ error }) => {
            if (error) {
                console.warn('⚠️ Database connection issue:', error.message);
            } else {
                console.log('✅ Database connected');
            }
        })
        .catch(err => {
            console.warn('⚠️ Connection test failed:', err.message);
        });
} else {
    console.error('❌ Supabase initialization failed');
}
