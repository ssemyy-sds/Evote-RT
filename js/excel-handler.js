// ============================================
// EXCEL UPLOAD HANDLER
// ============================================

// Load SheetJS library dynamically
function loadSheetJS() {
    return new Promise((resolve, reject) => {
        if (window.XLSX) {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// Download Excel Template
function downloadExcelTemplate() {
    loadSheetJS().then(() => {
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Sample data
        const data = [
            ['Nama', 'Alamat'],
            ['Budi Santoso', 'Blok A-01'],
            ['Siti Rahayu', 'Blok A-02'],
            ['Ahmad Wijaya', 'Blok A-03'],
            ['Dewi Kusuma', 'Blok B-01'],
            ['Eko Prasetyo', 'Blok B-02']
        ];
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(data);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 30 }, // Nama
            { wch: 20 }  // Alamat
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Data Pemilih');
        
        // Generate file
        XLSX.writeFile(wb, 'Template_Pemilih_RT.xlsx');
        
        showExcelMessage('✅ Template berhasil didownload!', 'success');
    }).catch(err => {
        showExcelMessage('❌ Gagal mendownload template: ' + err.message, 'error');
    });
}

// Handle Excel Upload
async function handleExcelUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // Validate file type
    const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
    ];
    
    if (!validTypes.includes(file.type)) {
        showExcelMessage('❌ Format file harus .xlsx atau .xls', 'error');
        event.target.value = '';
        return;
    }
    
    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showExcelMessage('❌ Ukuran file maksimal 5MB', 'error');
        event.target.value = '';
        return;
    }
    
    showExcelMessage('📖 Membaca file Excel...', 'info');
    
    try {
        await loadSheetJS();
        
        const reader = new FileReader();
        
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get first sheet
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                
                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                
                // Remove header row
                jsonData.shift();
                
                // Parse data
                const voters = [];
                const errors = [];
                
                jsonData.forEach((row, index) => {
                    const rowNum = index + 2; // +2 karena header di row 1 dan index mulai dari 0
                    
                    const name = row[0]?.toString().trim();
                    const address = row[1]?.toString().trim();
                    
                    if (!name || !address) {
                        if (name || address) { // Ada data tapi tidak lengkap
                            errors.push(`Baris ${rowNum}: Data tidak lengkap`);
                        }
                        // Skip empty rows
                        return;
                    }
                    
                    voters.push({
                        name: name,
                        address: address,
                        token: generateRandomToken(),
                        has_voted: false
                    });
                });
                
                if (voters.length === 0) {
                    showExcelMessage('❌ Tidak ada data valid di file Excel', 'error');
                    return;
                }
                
                if (voters.length > 500) {
                    showExcelMessage('❌ Maksimal 500 pemilih per upload', 'error');
                    return;
                }
                
                // Show preview
                displayExcelPreview(voters, errors);
                
            } catch (err) {
                showExcelMessage('❌ Gagal membaca file: ' + err.message, 'error');
            }
        };
        
        reader.onerror = () => {
            showExcelMessage('❌ Gagal membaca file', 'error');
        };
        
        reader.readAsArrayBuffer(file);
        
    } catch (err) {
        showExcelMessage('❌ Error: ' + err.message, 'error');
    }
}

// Display Excel Preview
function displayExcelPreview(voters, errors) {
    const previewDiv = document.getElementById('excel-preview');
    
    let html = `
        <div class="demo-card">
            <h4>📋 Preview Data</h4>
            <p><strong>${voters.length}</strong> pemilih akan ditambahkan</p>
    `;
    
    if (errors.length > 0) {
        html += `
            <div style="background: #fadbd8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong style="color: #e74c3c;">⚠️ ${errors.length} Error ditemukan:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    ${errors.slice(0, 10).map(err => `<li>${err}</li>`).join('')}
                    ${errors.length > 10 ? `<li>... dan ${errors.length - 10} error lainnya</li>` : ''}
                </ul>
            </div>
        `;
    }
    
    html += `
            <div style="max-height: 300px; overflow-y: auto; margin: 15px 0;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: var(--primary-color);">
                            <th style="padding: 10px; text-align: left;">No</th>
                            <th style="padding: 10px; text-align: left;">Nama</th>
                            <th style="padding: 10px; text-align: left;">Alamat</th>
                            <th style="padding: 10px; text-align: left;">Token</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    voters.slice(0, 50).forEach((voter, index) => {
        html += `
            <tr style="border-bottom: 1px solid #e0e0e0;">
                <td style="padding: 8px;">${index + 1}</td>
                <td style="padding: 8px;">${voter.name}</td>
                <td style="padding: 8px;">${voter.address}</td>
                <td style="padding: 8px;"><code style="font-size: 0.85em;">${voter.token}</code></td>
            </tr>
        `;
    });
    
    if (voters.length > 50) {
        html += `
            <tr>
                <td colspan="4" style="padding: 10px; text-align: center; color: #7f8c8d;">
                    ... dan ${voters.length - 50} data lainnya
                </td>
            </tr>
        `;
    }
    
    html += `
                    </tbody>
                </table>
            </div>
            
            <button onclick="confirmExcelUpload()" class="btn-primary" id="btn-confirm-upload">
                ✅ Konfirmasi & Upload ke Database
            </button>
            <button onclick="cancelExcelUpload()" class="btn-secondary">
                ❌ Batal
            </button>
        </div>
    `;
    
    previewDiv.innerHTML = html;
    
    // Store voters data for confirmation
    window.excelVotersData = voters;
}

// Confirm and Upload to Database
async function confirmExcelUpload() {
    if (!window.excelVotersData || window.excelVotersData.length === 0) {
        showExcelMessage('❌ Tidak ada data untuk diupload', 'error');
        return;
    }
    
    const voters = window.excelVotersData;
    const btnConfirm = document.getElementById('btn-confirm-upload');
    
    if (btnConfirm) {
        btnConfirm.disabled = true;
        btnConfirm.innerHTML = '<span class="loading"></span> Mengupload...';
    }
    
    showExcelMessage(`📤 Mengupload ${voters.length} pemilih ke database...`, 'info');
    
    try {
        // Upload in batches of 50
        const batchSize = 50;
        let successCount = 0;
        let errorCount = 0;
        const errors = [];
        
        for (let i = 0; i < voters.length; i += batchSize) {
            const batch = voters.slice(i, i + batchSize);
            
            try {
                const { data, error } = await window.supabase
                    .from('voters')
                    .insert(batch)
                    .select();
                
                if (error) {
                    errorCount += batch.length;
                    errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${error.message}`);
                } else {
                    successCount += data.length;
                }
                
                // Update progress
                const progress = Math.round(((i + batch.length) / voters.length) * 100);
                showExcelMessage(
                    `📤 Progress: ${progress}% (${successCount} berhasil, ${errorCount} gagal)`,
                    'info'
                );
                
                // Small delay between batches
                await new Promise(resolve => setTimeout(resolve, 500));
                
            } catch (err) {
                errorCount += batch.length;
                errors.push(`Batch ${Math.floor(i / batchSize) + 1}: ${err.message}`);
            }
        }
        
        // Show results
        displayExcelUploadResults(successCount, errorCount, errors);
        
        // Clear preview
        document.getElementById('excel-preview').innerHTML = '';
        document.getElementById('excel-file').value = '';
        window.excelVotersData = null;
        
        // Refresh voters table
        if (typeof loadVoters === 'function') {
            loadVoters();
        }
        
    } catch (err) {
        showExcelMessage('❌ Gagal mengupload: ' + err.message, 'error');
        
        if (btnConfirm) {
            btnConfirm.disabled = false;
            btnConfirm.innerHTML = '✅ Konfirmasi & Upload ke Database';
        }
    }
}

// Display Upload Results
function displayExcelUploadResults(successCount, errorCount, errors) {
    const resultsDiv = document.getElementById('excel-results');
    
    let html = `
        <div class="demo-card" style="border-left: 4px solid ${errorCount === 0 ? '#27ae60' : '#f39c12'};">
            <h3>${errorCount === 0 ? '✅' : '⚠️'} Hasil Upload</h3>
            <div style="margin: 20px 0;">
                <div class="stat-card" style="display: inline-block; margin: 10px;">
                    <h3 style="color: #27ae60;">${successCount}</h3>
                    <p>Berhasil</p>
                </div>
                <div class="stat-card" style="display: inline-block; margin: 10px;">
                    <h3 style="color: #e74c3c;">${errorCount}</h3>
                    <p>Gagal</p>
                </div>
            </div>
    `;
    
    if (errors.length > 0) {
        html += `
            <div style="background: #fadbd8; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <strong style="color: #e74c3c;">Error Details:</strong>
                <ul style="margin: 10px 0 0 20px;">
                    ${errors.map(err => `<li>${err}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    if (successCount > 0) {
        html += `
            <button onclick="downloadUploadedTokens()" class="btn-primary">
                📥 Download Token yang Berhasil
            </button>
        `;
    }
    
    html += `</div>`;
    
    resultsDiv.innerHTML = html;
    
    showExcelMessage(
        `${errorCount === 0 ? '✅' : '⚠️'} Upload selesai: ${successCount} berhasil, ${errorCount} gagal`,
        errorCount === 0 ? 'success' : 'error'
    );
}

// Download Uploaded Tokens
async function downloadUploadedTokens() {
    try {
        await loadSheetJS();
        
        // Get latest voters (just uploaded)
        const { data, error } = await window.supabase
            .from('voters')
            .select('name, address, token, created_at')
            .order('created_at', { ascending: false })
            .limit(500);
        
        if (error) throw error;
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        
        // Prepare data
        const excelData = [
            ['Nama', 'Alamat', 'Token', 'QR Code URL']
        ];
        
        data.forEach(voter => {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/index.html?token=' + voter.token)}`;
            excelData.push([
                voter.name,
                voter.address,
                voter.token,
                qrUrl
            ]);
        });
        
        // Create worksheet
        const ws = XLSX.utils.aoa_to_sheet(excelData);
        
        // Set column widths
        ws['!cols'] = [
            { wch: 30 }, // Nama
            { wch: 20 }, // Alamat
            { wch: 35 }, // Token
            { wch: 80 }  // QR URL
        ];
        
        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Token Pemilih');
        
        // Generate file
        const timestamp = new Date().toISOString().split('T')[0];
        XLSX.writeFile(wb, `Token_Pemilih_${timestamp}.xlsx`);
        
        showExcelMessage('✅ File token berhasil didownload!', 'success');
        
    } catch (err) {
        showExcelMessage('❌ Gagal mendownload token: ' + err.message, 'error');
    }
}

// Cancel Upload
function cancelExcelUpload() {
    document.getElementById('excel-preview').innerHTML = '';
    document.getElementById('excel-file').value = '';
    window.excelVotersData = null;
    showExcelMessage('Upload dibatalkan', 'info');
}

// Show Excel Message
function showExcelMessage(message, type) {
    const statusDiv = document.getElementById('excel-upload-status');
    statusDiv.textContent = message;
    statusDiv.className = 'message ' + type;
    statusDiv.style.display = 'block';
}
