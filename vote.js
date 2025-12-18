let selectedCandidate = null;
let voterData = null;

// Check authentication
window.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('voterToken');
    
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    await loadVoterData(token);
    await loadCandidates();
    
    // Check if demo timeout mode
    const urlParams = new URLSearchParams(window.location.search);
    const isDemoTimeout = urlParams.get('demo') === 'timeout';
    
    if (isDemoTimeout) {
        // Speed up timer for demo (10 seconds instead of 60)
        timeRemaining = 10;
        showNotification('🎭 Demo Mode: Timer dipercepat (10 detik)');
    }
    
    startCountdown();
});

async function loadVoterData(token) {
    try {
        const { data, error } = await supabase
            .from('voters')
            .select('*')
            .eq('token', token)
            .single();

        if (error || !data) {
            alert('Token tidak valid!');
            localStorage.removeItem('voterToken');
            window.location.href = 'index.html';
            return;
        }

        if (data.has_voted) {
            alert('Anda sudah melakukan pemungutan suara!');
            localStorage.removeItem('voterToken');
            window.location.href = 'index.html';
            return;
        }

        voterData = data;
        displayVoterInfo(data);
    } catch (err) {
        console.error('Error:', err);
        alert('Terjadi kesalahan!');
    }
}

function displayVoterInfo(voter) {
    const infoDiv = document.getElementById('voter-info');
    infoDiv.innerHTML = `
        <h3>Pemilih: ${voter.name}</h3>
        <p>Alamat: ${voter.address}</p>
    `;
}

async function loadCandidates() {
    try {
        const { data, error } = await supabase
            .from('candidates')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        displayCandidates(data);
    } catch (err) {
        console.error('Error:', err);
        showMessage('message', 'Gagal memuat data calon', 'error');
    }
}

function displayCandidates(candidates) {
    const listDiv = document.getElementById('candidates-list');
    
    if (candidates.length === 0) {
        listDiv.innerHTML = '<p>Belum ada calon yang terdaftar.</p>';
        return;
    }

    listDiv.innerHTML = candidates.map(candidate => `
        <div class="candidate-card" onclick="selectCandidate(${candidate.id})">
            <img src="${candidate.photo_url || 'https://via.placeholder.com/100'}" 
                 alt="${candidate.name}" 
                 class="candidate-photo">
            <div class="candidate-info">
                <h3>${candidate.name}</h3>
                <p>${candidate.vision_mission || 'Tidak ada visi & misi'}</p>
            </div>
        </div>
    `).join('');

    // Add vote button
    listDiv.innerHTML += `
        <button onclick="submitVote()" class="btn-primary" id="vote-btn" disabled>
            Pilih Calon Ini
        </button>
    `;
}

function selectCandidate(candidateId) {
    selectedCandidate = candidateId;
    
    // Remove previous selection
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    event.currentTarget.classList.add('selected');
    
    // Enable vote button
    document.getElementById('vote-btn').disabled = false;
}

async function submitVote() {
    if (!selectedCandidate) {
        showMessage('message', 'Silakan pilih calon terlebih dahulu!', 'error');
        return;
    }

    if (!confirm('Apakah Anda yakin dengan pilihan Anda? Pilihan tidak dapat diubah!')) {
        return;
    }

    try {
        // Record vote
        const { error: voteError } = await supabase
            .from('votes')
            .insert([
                { 
                    voter_id: voterData.id,
                    candidate_id: selectedCandidate 
                }
            ]);

        if (voteError) throw voteError;

        // Update voter status
        const { error: updateError } = await supabase
            .from('voters')
            .update({ has_voted: true })
            .eq('id', voterData.id);

        if (updateError) throw updateError;

        // Update candidate vote count
        const { error: countError } = await supabase.rpc('increment_vote_count', {
            candidate_id: selectedCandidate
        });

        if (countError) throw countError;

        showMessage('message', 'Terima kasih! Suara Anda telah tercatat.', 'success');
        
        localStorage.removeItem('voterToken');
        
        setTimeout(() => {
            window.location.href = 'result.html';
        }, 2000);

    } catch (err) {
        console.error('Error:', err);
        showMessage('message', 'Gagal menyimpan suara: ' + err.message, 'error');
    }

}
