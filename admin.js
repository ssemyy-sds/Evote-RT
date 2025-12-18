// Check if admin is logged in
window.addEventListener('DOMContentLoaded', () => {
    if (checkAdminAuth()) {
        showDashboard();
    }
});

function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    
    if (password === ADMIN_PASSWORD) {
        setAdminAuth('true');
        showDashboard();
    } else {
        showMessage('login-message', 'Password salah!', 'error');
    }
}

function showDashboard() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('admin-dashboard').style.display = 'block';
    
    loadCandidates();
    loadVoters();
}

function logout() {
    setAdminAuth('false');
    location.reload();
}

// Tab Management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById('tab-' + tabName).classList.add('active');
    event.target.classList.add('active');
    
    // Load data for specific tabs
    if (tabName === 'candidates') loadCandidates();
    if (tabName === 'voters') loadVoters();
    if (tabName === 'results') loadResults();
}

// Candidates Management
async function loadCandidates() {
    try {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        displayCandidatesTable(data);
    } catch (err) {
        console.error('Error:', err);
    }
}

function displayCandidatesTable(candidates) {
    const tableDiv = document.getElementById('candidates-table');
    
    if (candidates.length === 0) {
        tableDiv.innerHTML = '<p>Belum ada calon.</p>';
        return;
    }

    tableDiv.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nama</th>
                    <th>Visi & Misi</th>
                    <th>Jumlah Suara</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${candidates.map(c => `
                    <tr>
                        <td>${c.name}</td>
                        <td>${c.vision_mission || '-'}</td>
                        <td>${c.vote_count || 0}</td>
                        <td>
                            <button class="btn-small btn-delete" onclick="deleteCandidate(${c.id})">
                                Hapus
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function addCandidate() {
    const name = document.getElementById('candidate-name').value.trim();
    const photo = document.getElementById('candidate-photo').value.trim();
    const vision = document.getElementById('candidate-vision').value.trim();

    if (!name) {
        showMessage('admin-message', 'Nama calon harus diisi!', 'error');
        return;
    }

    try {
        const { error } = await supabase
            .from('candidates')
            .insert([
                {
                    name: name,
                    photo_url: photo,
                    vision_mission: vision,
                    vote_count: 0
                }
            ]);

        if (error) throw error;

        showMessage('admin-message', 'Calon berhasil ditambahkan!', 'success');
        
        // Clear form
        document.getElementById('candidate-name').value = '';
        document.getElementById('candidate-photo').value = '';
        document.getElementById('candidate-vision').value = '';
        
        loadCandidates();
    } catch (err) {
        showMessage('admin-message', 'Gagal menambahkan calon: ' + err.message, 'error');
    }
}

async function deleteCandidate(id) {
    if (!confirm('Yakin ingin menghapus calon ini?')) return;

    try {
        const { error } = await supabase
            .from('candidates')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showMessage('admin-message', 'Calon berhasil dihapus!', 'success');
        loadCandidates();
    } catch (err) {
        showMessage('admin-message', 'Gagal menghapus calon: ' + err.message, 'error');
    }
}

// Voters Management
async function loadVoters() {
    try {
        const { data, error } = await supabase
            .from('voters')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        displayVotersTable(data);
    } catch (err) {
        console.error('Error:', err);
    }
}

function displayVotersTable(voters) {
    const tableDiv = document.getElementById('voters-table');
    
    if (voters.length === 0) {
        tableDiv.innerHTML = '<p>Belum ada pemilih terdaftar.</p>';
        return;
    }

    tableDiv.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>Token</th>
                    <th>Status</th>
                    <th>Aksi</th>
                </tr>
            </thead>
            <tbody>
                ${voters.map(v => `
                    <tr>
                        <td>${v.name}</td>
                        <td>${v.address}</td>
                        <td><code>${v.token}</code></td>
                        <td>${v.has_voted ? '✅ Sudah Memilih' : '⏳ Belum Memilih'}</td>
                        <td>
                            <button class="btn-small btn-delete" onclick="deleteVoter(${v.id})">
                                Hapus
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

async function deleteVoter(id) {
    if (!confirm('Yakin ingin menghapus pemilih ini?')) return;

    try {
        const { error } = await supabase
            .from('voters')
            .delete()
            .eq('id', id);

        if (error) throw error;

        showMessage('admin-message', 'Pemilih berhasil dihapus!', 'success');
        loadVoters();
    } catch (err) {
        showMessage('admin-message', 'Gagal menghapus pemilih: ' + err.message, 'error');
    }
}

// Token Generation
async function generateToken() {
    const name = document.getElementById('voter-name').value.trim();
    const address = document.getElementById('voter-address').value.trim();

    if (!name || !address) {
        showMessage('admin-message', 'Nama dan alamat harus diisi!', 'error');
        return;
    }

    const token = generateRandomToken();

    try {
        const { data, error } = await supabase
            .from('voters')
            .insert([
                {
                    name: name,
                    address: address,
                    token: token,
                    has_voted: false
                }
            ])
            .select();

        if (error) throw error;

        // Clear form
        document.getElementById('voter-name').value = '';
        document.getElementById('voter-address').value = '';

        // Display token with QR code
        displayToken(data[0]);
        
        showMessage('admin-message', 'Token berhasil dibuat!', 'success');
    } catch (err) {
        showMessage('admin-message', 'Gagal membuat token: ' + err.message, 'error');
    }
}

async function generateBulkTokens() {
    const bulkText = document.getElementById('bulk-voters').value.trim();
    
    if (!bulkText) {
        showMessage('admin-message', 'Masukkan data pemilih!', 'error');
        return;
    }

    const lines = bulkText.split('\n').filter(line => line.trim());
    const voters = [];

    for (let line of lines) {
        const parts = line.split('|');
        if (parts.length === 2) {
            voters.push({
                name: parts[0].trim(),
                address: parts[1].trim(),
                token: generateRandomToken(),
                has_voted: false
            });
        }
    }

    if (voters.length === 0) {
        showMessage('admin-message', 'Format data tidak valid!', 'error');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('voters')
            .insert(voters)
            .select();

        if (error) throw error;

        document.getElementById('bulk-voters').value = '';
        
        // Display all tokens
        displayBulkTokens(data);
        
        showMessage('admin-message', `${data.length} token berhasil dibuat!`, 'success');
    } catch (err) {
        showMessage('admin-message', 'Gagal membuat token: ' + err.message, 'error');
    }
}

function displayToken(voter) {
    const resultDiv = document.getElementById('token-result');
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/index.html?token=' + voter.token)}`;
    
    resultDiv.innerHTML = `
        <div class="token-display">
            <h3>${voter.name} - ${voter.address}</h3>
            <div class="token-value">${voter.token}</div>
            <div class="qr-code">
                <img src="${qrUrl}" alt="QR Code">
                <p>Scan QR Code atau gunakan token di atas</p>
            </div>
            <button onclick="printToken('${voter.name}', '${voter.address}', '${voter.token}')" class="btn-primary">
                🖨️ Print Token
            </button>
        </div>
    `;
}

function displayBulkTokens(voters) {
    const resultDiv = document.getElementById('token-result');
    
    resultDiv.innerHTML = '<h3>Token yang Dibuat:</h3>' + voters.map(voter => {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + '/index.html?token=' + voter.token)}`;
        
        return `
            <div class="token-display">
                <h3>${voter.name} - ${voter.address}</h3>
                <div class="token-value">${voter.token}</div>
                <div class="qr-code">
                    <img src="${qrUrl}" alt="QR Code">
                </div>
            </div>
        `;
    }).join('');

    resultDiv.innerHTML += `
        <button onclick="printAllTokens()" class="btn-primary">
            🖨️ Print Semua Token
        </button>
    `;
}

function printToken(name, address, token) {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(window.location.origin + '/index.html?token=' + token)}`;
    
    const printWindow = window.open('', '', 'width=600,height=800');
    printWindow.document.write(`
        <html>
        <head>
            <title>Token Pemilihan RT</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    text-align: center;
                    padding: 20px;
                }
                .token-print {
                    border: 3px solid #92DE26;
                    padding: 20px;
                    max-width: 400px;
                    margin: 0 auto;
                }
                h2 { color: #2c3e50; }
                .token { 
                    background: #f0f0f0;
                    padding: 10px;
                    margin: 15px 0;
                    font-family: monospace;
                    font-size: 14px;
                    word-break: break-all;
                }
                img { margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="token-print">
                <h2>🗳️ TOKEN PEMILIHAN RT</h2>
                <p><strong>${name}</strong></p>
                <p>${address}</p>
                <img src="${qrUrl}" alt="QR Code">
                <div class="token">${token}</div>
                <p style="font-size: 12px; color: #7f8c8d;">
                    Scan QR Code atau masukkan token secara manual
                </p>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
        printWindow.print();
    }, 500);
}

function printAllTokens() {
    window.print();
}

// Results
async function loadResults() {
    try {
        const { data: candidates, error: candError } = await supabase
            .from('candidates')
            .select('*')
            .order('vote_count', { ascending: false });

        if (candError) throw candError;

        const { data: voters, error: voterError } = await supabase
            .from('voters')
            .select('has_voted');

        if (voterError) throw voterError;

        displayResults(candidates, voters);
    } catch (err) {
        console.error('Error:', err);
        showMessage('admin-message', 'Gagal memuat hasil', 'error');
    }
}

function displayResults(candidates, voters) {
    const resultsDiv = document.getElementById('results-display');
    const totalVoters = voters.length;
    const votedCount = voters.filter(v => v.has_voted).length;
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);

    let html = `
        <div class="stats-summary">
            <div class="stat-card">
                <h3>${totalVoters}</h3>
                <p>Total Pemilih</p>
            </div>
            <div class="stat-card">
                <h3>${votedCount}</h3>
                <p>Sudah Memilih</p>
            </div>
            <div class="stat-card">
                <h3>${totalVoters - votedCount}</h3>
                <p>Belum Memilih</p>
            </div>
        </div>
        <h3>Perolehan Suara:</h3>
    `;

    candidates.forEach(candidate => {
        const percentage = totalVotes > 0 ? ((candidate.vote_count || 0) / totalVotes * 100).toFixed(1) : 0;
        html += `
            <div class="result-bar">
                <div class="result-bar-header">
                    <span>${candidate.name}</span>
                    <span>${candidate.vote_count || 0} suara (${percentage}%)</span>
                </div>
                <div class="result-bar-fill" style="width: ${percentage}%">
                    ${percentage}%
                </div>
            </div>
        `;
    });

    resultsDiv.innerHTML = html;
}