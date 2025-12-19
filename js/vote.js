// ============================================
// VOTE.JS - V2
// Pemilihan RT - Voting Page Logic
// ============================================

let selectedCandidate = null;
let voterData = null;
let countdownTimer = null;
let timeRemaining = 60; // 60 seconds
let hasVoted = false;
let timerStarted = false;

// Audio notifications (using Web Audio API for beep sounds)
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playBeep(frequency = 800, duration = 200) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);
}

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
    
    // Start countdown after everything is loaded
    startCountdown();
});

async function loadVoterData(token) {
    try {
        const { data, error } = await window.supabase
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
        <p style="color: #7f8c8d; font-size: 0.9em; margin-top: 10px;">
            ⚠️ Anda memiliki waktu 60 detik untuk memilih
        </p>
    `;
}

async function loadCandidates() {
    try {
        const { data, error } = await window.supabase
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
                 class="candidate-photo"
                 onerror="this.src='https://via.placeholder.com/100?text=No+Photo'">
            <div class="candidate-info">
                <h3>${candidate.name}</h3>
                <p>${candidate.vision_mission || 'Tidak ada visi & misi'}</p>
            </div>
        </div>
    `).join('');

    // Add vote button
    listDiv.innerHTML += `
        <button onclick="submitVote()" class="btn-primary" id="vote-btn" disabled>
            ✓ Pilih Calon Ini
        </button>
    `;
}

function selectCandidate(candidateId) {
    if (hasVoted) return;
    
    selectedCandidate = candidateId;
    
    // Remove previous selection
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selection to clicked card
    event.currentTarget.classList.add('selected');
    
    // Enable vote button
    document.getElementById('vote-btn').disabled = false;
    
    // Play selection sound
    playBeep(600, 100);
}

// ===== COUNTDOWN TIMER FUNCTIONS =====

function startCountdown() {
    timerStarted = true;
    updateTimerDisplay();
    
    countdownTimer = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        
        // Warning at 30 seconds
        if (timeRemaining === 30) {
            showNotification('⚠️ Sisa waktu 30 detik!');
            playBeep(700, 200);
        }
        
        // Warning state at 20 seconds
        if (timeRemaining === 20) {
            document.getElementById('timer-container').classList.add('warning');
            playBeep(700, 200);
        }
        
        // Show warning message at 15 seconds
        if (timeRemaining === 15) {
            document.getElementById('timer-warning').style.display = 'block';
            playBeep(800, 300);
        }
        
        // Danger state at 10 seconds
        if (timeRemaining === 10) {
            document.getElementById('timer-container').classList.remove('warning');
            document.getElementById('timer-container').classList.add('danger');
            showNotification('🚨 Waktu hampir habis!');
            playBeep(900, 300);
        }
        
        // Beep every second when < 10 seconds
        if (timeRemaining < 10 && timeRemaining > 0) {
            playBeep(1000, 100);
        }
        
        // Time's up!
        if (timeRemaining <= 0) {
            clearInterval(countdownTimer);
            handleTimeout();
        }
    }, 1000);
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('timer-value').textContent = timeString;
    
    // Update progress bar
    const percentage = (timeRemaining / 60) * 100;
    document.getElementById('timer-bar-fill').style.width = percentage + '%';
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'sound-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

async function handleTimeout() {
    if (hasVoted) return;
    
    // Stop all interactions
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.classList.add('disabled');
    });
    
    const voteBtn = document.getElementById('vote-btn');
    if (voteBtn) voteBtn.disabled = true;
    
    // Show timeout modal
    const modal = document.getElementById('timeout-modal');
    modal.classList.add('active');
    
    // Play timeout sound
    playBeep(400, 500);
    
    // Record as abstain
    await recordAbstain();
}

async function recordAbstain() {
    try {
        const token = localStorage.getItem('voterToken');
        
        // Call the record_abstain function
        const { error } = await window.supabase.rpc('record_abstain', {
            voter_token: token
        });

        if (error) throw error;

        // Save voter info for thank you page
        localStorage.setItem('voterName', voterData.name);
        localStorage.setItem('voterAddress', voterData.address);

        // Wait 2 seconds then redirect
        setTimeout(() => {
            localStorage.removeItem('voterToken');
            window.location.href = 'thankyou.html?abstain=true';
        }, 2000);

    } catch (err) {
        console.error('Error recording abstain:', err);
        
        // Fallback: manual record
        try {
            // Insert abstain vote
            const { error: voteError } = await window.supabase
                .from('votes')
                .insert([
                    { 
                        voter_id: voterData.id,
                        candidate_id: null,
                        vote_type: 'abstain'
                    }
                ]);

            if (voteError) throw voteError;

            // Update voter status
            const { error: updateError } = await window.supabase
                .from('voters')
                .update({ has_voted: true })
                .eq('id', voterData.id);

            if (updateError) throw updateError;

            // Save voter info for thank you page
            localStorage.setItem('voterName', voterData.name);
            localStorage.setItem('voterAddress', voterData.address);

            setTimeout(() => {
                localStorage.removeItem('voterToken');
                window.location.href = 'thankyou.html?abstain=true';
            }, 2000);

        } catch (fallbackErr) {
            console.error('Fallback error:', fallbackErr);
            alert('Terjadi kesalahan saat menyimpan data');
        }
    }
}

async function submitVote() {
    if (!selectedCandidate) {
        showMessage('message', 'Silakan pilih calon terlebih dahulu!', 'error');
        return;
    }

    if (hasVoted) return;

    if (!confirm('Apakah Anda yakin dengan pilihan Anda? Pilihan tidak dapat diubah!')) {
        return;
    }

    hasVoted = true;
    
    // Stop timer
    if (countdownTimer) {
        clearInterval(countdownTimer);
    }

    // Disable all interactions
    document.querySelectorAll('.candidate-card').forEach(card => {
        card.classList.add('disabled');
    });
    
    const voteBtn = document.getElementById('vote-btn');
    voteBtn.disabled = true;
    voteBtn.innerHTML = '<span class="loading"></span> Menyimpan...';

    try {
        // Record vote
        const { error: voteError } = await window.supabase
            .from('votes')
            .insert([
                { 
                    voter_id: voterData.id,
                    candidate_id: selectedCandidate,
                    vote_type: 'normal'
                }
            ]);

        if (voteError) throw voteError;

        // Update voter status
        const { error: updateError } = await window.supabase
            .from('voters')
            .update({ has_voted: true })
            .eq('id', voterData.id);

        if (updateError) throw updateError;

        // Update candidate vote count
        const { error: countError } = await window.supabase.rpc('increment_vote_count', {
            candidate_id: selectedCandidate
        });

        if (countError) throw countError;

        showMessage('message', '✓ Terima kasih! Suara Anda telah tercatat.', 'success');
        playBeep(600, 500);
        
        // Save voter info for thank you page
        localStorage.setItem('voterName', voterData.name);
        localStorage.setItem('voterAddress', voterData.address);
        
        setTimeout(() => {
            localStorage.removeItem('voterToken');
            window.location.href = 'thankyou.html';
        }, 2000);

    } catch (err) {
        console.error('Error:', err);
        showMessage('message', 'Gagal menyimpan suara: ' + err.message, 'error');
        hasVoted = false;
        voteBtn.disabled = false;
        voteBtn.innerHTML = '✓ Pilih Calon Ini';
        
        // Restart timer
        if (timeRemaining > 0) {
            startCountdown();
        }
    }
}

function showMessage(elementId, msg, type) {
    const messageDiv = document.getElementById(elementId);
    messageDiv.textContent = msg;
    messageDiv.className = 'message ' + type;
}

// Prevent page close/refresh during voting
window.addEventListener('beforeunload', (e) => {
    if (timerStarted && !hasVoted && timeRemaining > 0) {
        e.preventDefault();
        e.returnValue = 'Anda sedang dalam proses pemilihan. Yakin ingin keluar?';
        return e.returnValue;
    }
});

// Prevent back button
window.history.pushState(null, null, window.location.href);
window.addEventListener('popstate', () => {
    if (timerStarted && !hasVoted && timeRemaining > 0) {
        if (confirm('Anda sedang dalam proses pemilihan. Yakin ingin keluar?')) {
            window.history.back();
        } else {
            window.history.pushState(null, null, window.location.href);
        }
    }
});
