// Demo password
const DEMO_PASSWORD = 'demo2024'; // GANTI INI!

// Demo data templates
const DEMO_CANDIDATES = [
    {
        name: 'Budi Santoso',
        photo_url: 'https://i.pravatar.cc/300?img=12',
        vision_mission: 'Membangun RT yang bersih, aman, dan sejahtera. Meningkatkan keamanan lingkungan dan fasilitas umum.'
    },
    {
        name: 'Siti Rahayu',
        photo_url: 'https://i.pravatar.cc/300?img=47',
        vision_mission: 'Menciptakan lingkungan yang harmonis dan peduli sesama. Mengadakan kegiatan sosial rutin untuk warga.'
    },
    {
        name: 'Ahmad Wijaya',
        photo_url: 'https://i.pravatar.cc/300?img=33',
        vision_mission: 'Transparansi dalam pengelolaan keuangan RT. Digitalisasi administrasi untuk kemudahan warga.'
    }
];

// Check if demo is logged in
window.addEventListener('DOMContentLoaded', () => {
    if (checkDemoAuth()) {
        showDemoDashboard();
        refreshDemoStats();
    }
});

function checkDemoAuth() {
    return sessionStorage.getItem('demoAuth') === 'true';
}

function setDemoAuth(value) {
    sessionStorage.setItem('demoAuth', value);
}

function loginDemo() {
    const password = document.getElementById('demo-password').value;
    
    if (password === DEMO_PASSWORD) {
        setDemoAuth('true');
        showDemoDashboard();
    } else {
        showDemoMessage('demo-login-message', 'Password demo salah!', 'error');
    }
}

function showDemoDashboard() {
    document.getElementById('demo-login-section').style.display = 'none';
    document.getElementById('demo-dashboard').style.display = 'block';
    refreshDemoStats();
    loadCandidateVoteControls();
}

function logoutDemo() {
    setDemoAuth('false');
    location.reload();
}

// Tab Management
function showDemoTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById('demo-tab-' + tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'simulate') {
        loadCandidateVoteControls();
    }
    if (tabName === 'control') {
        refreshDemoStats();
    }
}

// ===== QUICK SETUP =====

async function setupDemoCandidates() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Membuat kandidat...';
    
    try {
        // Check if candidates already exist
        const { data: existing } = await supabase
            .from('candidates')
            .select('id');
        
        if (existing && existing.length > 0) {
            if (!confirm('Sudah ada kandidat. Hapus dan buat ulang?')) {
                btn.disabled = false;
                btn.innerHTML = 'Generate Kandidat Demo';
                return;
            }
            await supabase.from('candidates').delete().neq('id', 0);
        }
        
        // Insert demo candidates
        const { error } = await supabase
            .from('candidates')
            .insert(DEMO_CANDIDATES.map(c => ({
                ...c,
                vote_count: 0
            })));
        
        if (error) throw error;
        
        showDemoMessage('setup-message', `✓ Berhasil membuat ${DEMO_CANDIDATES.length} kandidat demo!`, 'success');
        
    } catch (err) {
        showDemoMessage('setup-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Generate Kandidat Demo';
    }
}

async function setupDemoVoters() {
    const count = parseInt(document.getElementById('demo-voters-count').value);
    
    if (count < 5 || count > 100) {
        showDemoMessage('setup-message', 'Jumlah pemilih harus antara 5-100', 'error');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Membuat pemilih...';
    
    try {
        // Check if voters already exist
        const { data: existing } = await supabase
            .from('voters')
            .select('id');
        
        if (existing && existing.length > 0) {
            if (!confirm('Sudah ada pemilih. Hapus dan buat ulang?')) {
                btn.disabled = false;
                btn.innerHTML = 'Generate Pemilih Demo';
                return;
            }
            await supabase.from('voters').delete().neq('id', 0);
        }
        
        // Generate demo voters
        const voters = [];
        const names = ['Agus', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indah', 'Joko'];
        const lastNames = ['Pratama', 'Wijaya', 'Kusuma', 'Santoso', 'Rahayu', 'Utomo', 'Permata', 'Sari'];
        
        for (let i = 1; i <= count; i++) {
            const firstName = names[Math.floor(Math.random() * names.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            voters.push({
                name: `${firstName} ${lastName}`,
                address: `Blok ${String.fromCharCode(65 + Math.floor(i / 10))}-${String(i).padStart(2, '0')}`,
                token: generateRandomToken(),
                has_voted: false
            });
        }
        
        const { error } = await supabase
            .from('voters')
            .insert(voters);
        
        if (error) throw error;
        
        showDemoMessage('setup-message', `✓ Berhasil membuat ${count} pemilih demo!`, 'success');
        
    } catch (err) {
        showDemoMessage('setup-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Generate Pemilih Demo';
    }
}

async function resetAllDemoData() {
    if (!confirm('⚠️ YAKIN INGIN RESET SEMUA DATA?\n\nIni akan menghapus:\n- Semua kandidat\n- Semua pemilih\n- Semua votes\n\nTindakan ini tidak dapat dibatalkan!')) {
        return;
    }
    
    if (!confirm('Konfirmasi sekali lagi: HAPUS SEMUA DATA?')) {
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Menghapus...';
    
    try {
        // Delete in order: votes -> voters -> candidates
        await supabase.from('votes').delete().neq('id', 0);
        await supabase.from('voters').delete().neq('id', 0);
        await supabase.from('candidates').delete().neq('id', 0);
        
        showDemoMessage('setup-message', '✓ Semua data berhasil dihapus!', 'success');
        
    } catch (err) {
        showDemoMessage('setup-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Reset Database';
    }
}

// ===== SIMULATE VOTES =====

async function loadCandidateVoteControls() {
    try {
        const { data: candidates, error } = await supabase
            .from('candidates')
            .select('*')
            .order('id', { ascending: true });
        
        if (error) throw error;
        
        const controlsDiv = document.getElementById('candidate-vote-controls');
        
        if (!candidates || candidates.length === 0) {
            controlsDiv.innerHTML = '<p style="color: #7f8c8d;">Belum ada kandidat. Setup kandidat dulu.</p>';
            return;
        }
        
        controlsDiv.innerHTML = candidates.map(c => `
            <div style="display: flex; align-items: center; gap: 10px; margin: 10px 0;">
                <span style="flex: 1;">${c.name}</span>
                <input type="number" id="vote-${c.id}" value="0" min="0" max="50" style="width: 80px;">
                <button onclick="addVotesToCandidate(${c.id})" class="btn-small" style="background: var(--primary-color);">
                    + Vote
                </button>
            </div>
        `).join('');
        
    } catch (err) {
        console.error('Error:', err);
    }
}

async function simulateRandomVotes() {
    const count = parseInt(document.getElementById('simulate-vote-count').value);
    
    if (count < 1) {
        showDemoMessage('simulate-message', 'Jumlah vote minimal 1', 'error');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Simulasi...';
    
    try {
        // Get available voters (not voted yet)
        const { data: voters, error: voterError } = await supabase
            .from('voters')
            .select('*')
            .eq('has_voted', false)
            .limit(count);
        
        if (voterError) throw voterError;
        
        if (!voters || voters.length === 0) {
            showDemoMessage('simulate-message', 'Tidak ada pemilih yang tersedia', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Simulasi Vote Acak';
            return;
        }
        
        // Get candidates
        const { data: candidates, error: candError } = await supabase
            .from('candidates')
            .select('*');
        
        if (candError) throw candError;
        
        if (!candidates || candidates.length === 0) {
            showDemoMessage('simulate-message', 'Tidak ada kandidat', 'error');
            btn.disabled = false;
            btn.innerHTML = 'Simulasi Vote Acak';
            return;
        }
        
        // Simulate votes
        let successCount = 0;
        for (const voter of voters) {
            const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
            
            // Insert vote
            await supabase.from('votes').insert([{
                voter_id: voter.id,
                candidate_id: randomCandidate.id,
                vote_type: 'normal'
            }]);
            
            // Update voter
            await supabase.from('voters').update({ has_voted: true }).eq('id', voter.id);
            
            // Update candidate count
            await supabase.rpc('increment_vote_count', { candidate_id: randomCandidate.id });
            
            successCount++;
            
            // Small delay for realism
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        showDemoMessage('simulate-message', `✓ Berhasil simulasi ${successCount} vote!`, 'success');
        refreshDemoStats();
        
    } catch (err) {
        showDemoMessage('simulate-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Simulasi Vote Acak';
    }
}

async function addVotesToCandidate(candidateId) {
    const count = parseInt(document.getElementById(`vote-${candidateId}`).value);
    
    if (count < 1) {
        showDemoMessage('simulate-message', 'Jumlah vote minimal 1', 'error');
        return;
    }
    
    try {
        // Get available voters
        const { data: voters, error: voterError } = await supabase
            .from('voters')
            .select('*')
            .eq('has_voted', false)
            .limit(count);
        
        if (voterError) throw voterError;
        
        if (!voters || voters.length < count) {
            showDemoMessage('simulate-message', `Hanya tersedia ${voters ? voters.length : 0} pemilih`, 'error');
            return;
        }
        
        // Add votes
        for (const voter of voters) {
            await supabase.from('votes').insert([{
                voter_id: voter.id,
                candidate_id: candidateId,
                vote_type: 'normal'
            }]);
            
            await supabase.from('voters').update({ has_voted: true }).eq('id', voter.id);
            await supabase.rpc('increment_vote_count', { candidate_id: candidateId });
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        showDemoMessage('simulate-message', `✓ Berhasil menambah ${count} vote!`, 'success');
        document.getElementById(`vote-${candidateId}`).value = 0;
        refreshDemoStats();
        
    } catch (err) {
        showDemoMessage('simulate-message', 'Error: ' + err.message, 'error');
    }
}

async function simulateAbstain() {
    const count = parseInt(document.getElementById('simulate-abstain-count').value);
    
    if (count < 1) {
        showDemoMessage('simulate-message', 'Jumlah abstain minimal 1', 'error');
        return;
    }
    
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Simulasi...';
    
    try {
        const { data: voters, error: voterError } = await supabase
            .from('voters')
            .select('*')
            .eq('has_voted', false)
            .limit(count);
        
        if (voterError) throw voterError;
        
        if (!voters || voters.length < count) {
            showDemoMessage('simulate-message', `Hanya tersedia ${voters ? voters.length : 0} pemilih`, 'error');
            btn.disabled = false;
            btn.innerHTML = 'Simulasi Abstain';
            return;
        }
        
        for (const voter of voters) {
            await supabase.from('votes').insert([{
                voter_id: voter.id,
                candidate_id: null,
                vote_type: 'abstain'
            }]);
            
            await supabase.from('voters').update({ has_voted: true }).eq('id', voter.id);
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        showDemoMessage('simulate-message', `✓ Berhasil simulasi ${count} abstain!`, 'success');
        refreshDemoStats();
        
    } catch (err) {
        showDemoMessage('simulate-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Simulasi Abstain';
    }
}

// ===== CONTROL =====

async function refreshDemoStats() {
    try {
        const { data: candidates } = await supabase.from('candidates').select('*');
        const { data: voters } = await supabase.from('voters').select('has_voted');
        const { data: votes } = await supabase.from('votes').select('vote_type');
        
        const totalCandidates = candidates ? candidates.length : 0;
        const totalVoters = voters ? voters.length : 0;
        const votedCount = voters ? voters.filter(v => v.has_voted).length : 0;
        const abstainCount = votes ? votes.filter(v => v.vote_type === 'abstain').length : 0;
        const normalVotes = votes ? votes.filter(v => v.vote_type === 'normal').length : 0;
        
        const statsDiv = document.getElementById('demo-stats');
        statsDiv.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0;">
                <div class="stat-card">
                    <h3>${totalCandidates}</h3>
                    <p>Kandidat</p>
                </div>
                <div class="stat-card">
                    <h3>${totalVoters}</h3>
                    <p>Total Pemilih</p>
                </div>
                <div class="stat-card">
                    <h3>${votedCount}</h3>
                    <p>Sudah Vote</p>
                </div>
                <div class="stat-card">
                    <h3>${totalVoters - votedCount}</h3>
                    <p>Belum Vote</p>
                </div>
                <div class="stat-card">
                    <h3>${normalVotes}</h3>
                    <p>Vote Normal</p>
                </div>
                <div class="stat-card">
                    <h3>${abstainCount}</h3>
                    <p>Abstain</p>
                </div>
            </div>
        `;
        
    } catch (err) {
        console.error('Error:', err);
    }
}

async function generateDemoToken() {
    try {
        const { data: voters, error } = await supabase
            .from('voters')
            .select('*')
            .eq('has_voted', false)
            .limit(1);
        
        if (error) throw error;
        
        if (!voters || voters.length === 0) {
            showDemoMessage('control-message', 'Tidak ada pemilih yang tersedia. Setup pemilih dulu.', 'error');
            return;
        }
        
        const voter = voters[0];
        const voteUrl = `${window.location.origin}/vote.html?token=${voter.token}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(voteUrl)}`;
        
        const displayDiv = document.getElementById('demo-token-display');
        displayDiv.innerHTML = `
            <div class="token-display" style="margin-top: 20px;">
                <h4>${voter.name} - ${voter.address}</h4>
                <div class="token-value">${voter.token}</div>
                <div class="qr-code">
                    <img src="${qrUrl}" alt="QR Code">
                </div>
                <button onclick="window.open('vote.html?token=${voter.token}', '_blank')" class="btn-primary">
                    🗳️ Buka Halaman Vote
                </button>
            </div>
        `;
        
        showDemoMessage('control-message', '✓ Token demo berhasil dibuat!', 'success');
        
    } catch (err) {
        showDemoMessage('control-message', 'Error: ' + err.message, 'error');
    }
}

function openVotePage() {
    generateDemoToken().then(() => {
        // Token will be displayed, user can click to open
    });
}

function openResultPage() {
    window.open('result.html', '_blank');
}

function openAdminPage() {
    window.open('admin.html', '_blank');
}

// ===== PRESENTATION SCENARIOS =====

async function runScenario1() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Menjalankan...';
    
    try {
        showDemoMessage('presentation-message', '1️⃣ Setup kandidat...', 'info');
        await setupDemoCandidatesAuto();
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showDemoMessage('presentation-message', '2️⃣ Setup pemilih...', 'info');
        await setupDemoVotersAuto(20);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showDemoMessage('presentation-message', '3️⃣ Simulasi voting...', 'info');
        await simulateRandomVotesAuto(15);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showDemoMessage('presentation-message', '4️⃣ Simulasi abstain...', 'info');
        await simulateAbstainAuto(2);
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        showDemoMessage('presentation-message', '✓ Skenario 1 selesai! Membuka hasil...', 'success');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        window.open('presentation.html', '_blank');
        
    } catch (err) {
        showDemoMessage('presentation-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '▶️ Jalankan Skenario 1';
    }
}

async function runScenario2() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Menyiapkan...';
    
    try {
        // Ensure we have candidates
        const { data: candidates } = await supabase.from('candidates').select('id');
        if (!candidates || candidates.length === 0) {
            await setupDemoCandidatesAuto();
        }
        
        // Ensure we have voters
        const { data: voters } = await supabase.from('voters').select('*').eq('has_voted', false).limit(1);
        if (!voters || voters.length === 0) {
            await setupDemoVotersAuto(5);
        }
        
        // Generate token and open vote page
        await generateDemoToken();
        showDemoMessage('presentation-message', '✓ Token siap! Klik tombol "Buka Halaman Vote" di atas.', 'success');
        
    } catch (err) {
        showDemoMessage('presentation-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '▶️ Jalankan Skenario 2';
    }
}

async function runScenario3() {
    const btn = event.target;
    btn.disabled = true;
    btn.innerHTML = '<span class="loading"></span> Menyiapkan...';
    
    try {
        // Ensure we have candidates
        const { data: candidates } = await supabase.from('candidates').select('id');
        if (!candidates || candidates.length === 0) {
            await setupDemoCandidatesAuto();
        }
        
        // Ensure we have voters
        const { data: voters } = await supabase.from('voters').select('*').eq('has_voted', false).limit(1);
        if (!voters || voters.length === 0) {
            await setupDemoVotersAuto(5);
        }
        
        // Generate token
        const { data: voter } = await supabase
            .from('voters')
            .select('*')
            .eq('has_voted', false)
            .limit(1)
            .single();
        
        if (voter) {
            // Open vote page with special timeout mode
            const voteUrl = `vote.html?token=${voter.token}&demo=timeout`;
            window.open(voteUrl, '_blank');
            showDemoMessage('presentation-message', '✓ Halaman vote dibuka. Timer akan dipercepat untuk demo.', 'success');
        }
        
    } catch (err) {
        showDemoMessage('presentation-message', 'Error: ' + err.message, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '▶️ Jalankan Skenario 3';
    }
}

function openPresentationView() {
    window.open('presentation.html', '_blank', 'width=1920,height=1080');
}

// ===== HELPER FUNCTIONS =====

async function setupDemoCandidatesAuto() {
    const { data: existing } = await supabase.from('candidates').select('id');
    if (existing && existing.length > 0) {
        await supabase.from('candidates').delete().neq('id', 0);
    }
    await supabase.from('candidates').insert(DEMO_CANDIDATES.map(c => ({ ...c, vote_count: 0 })));
}

async function setupDemoVotersAuto(count) {
    const { data: existing } = await supabase.from('voters').select('id');
    if (existing && existing.length > 0) {
        await supabase.from('voters').delete().neq('id', 0);
    }
    
    const voters = [];
    const names = ['Agus', 'Budi', 'Citra', 'Dewi', 'Eko', 'Fitri', 'Gita', 'Hadi', 'Indah', 'Joko'];
    const lastNames = ['Pratama', 'Wijaya', 'Kusuma', 'Santoso', 'Rahayu', 'Utomo', 'Permata', 'Sari'];
    
    for (let i = 1; i <= count; i++) {
        const firstName = names[Math.floor(Math.random() * names.length)];
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
        voters.push({
            name: `${firstName} ${lastName}`,
            address: `Blok ${String.fromCharCode(65 + Math.floor(i / 10))}-${String(i).padStart(2, '0')}`,
            token: generateRandomToken(),
            has_voted: false
        });
    }
    
    await supabase.from('voters').insert(voters);
}

async function simulateRandomVotesAuto(count) {
    const { data: voters } = await supabase.from('voters').select('*').eq('has_voted', false).limit(count);
    const { data: candidates } = await supabase.from('candidates').select('*');
    
    for (const voter of voters) {
        const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
        await supabase.from('votes').insert([{
            voter_id: voter.id,
            candidate_id: randomCandidate.id,
            vote_type: 'normal'
        }]);
        await supabase.from('voters').update({ has_voted: true }).eq('id', voter.id);
        await supabase.rpc('increment_vote_count', { candidate_id: randomCandidate.id });
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

async function simulateAbstainAuto(count) {
    const { data: voters } = await supabase.from('voters').select('*').eq('has_voted', false).limit(count);
    
    for (const voter of voters) {
        await supabase.from('votes').insert([{
            voter_id: voter.id,
            candidate_id: null,
            vote_type: 'abstain'
        }]);
        await supabase.from('voters').update({ has_voted: true }).eq('id', voter.id);
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

function showDemoMessage(elementId, message, type) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.className = 'message ' + type;
    }
}
