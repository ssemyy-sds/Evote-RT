window.addEventListener('DOMContentLoaded', () => {
    loadResults();
    
    // Auto refresh every 30 seconds
    setInterval(loadResults, 30000);
});

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
    }
}

function displayResults(candidates, voters) {
    const totalVoters = voters.length;
    const votedCount = voters.filter(v => v.has_voted).length;
    const totalVotes = candidates.reduce((sum, c) => sum + (c.vote_count || 0), 0);
    
    // Stats Summary
    const statsDiv = document.getElementById('stats-summary');
    statsDiv.innerHTML = `
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
        <div class="stat-card">
            <h3>${((votedCount/totalVoters)*100).toFixed(1)}%</h3>
            <p>Partisipasi</p>
        </div>
    `;

    // Results Chart
    const chartDiv = document.getElementById('results-chart');
    let html = '<h2>Perolehan Suara</h2>';

    candidates.forEach((candidate, index) => {
        const percentage = totalVotes > 0 ? ((candidate.vote_count || 0) / totalVotes * 100).toFixed(1) : 0;
        const isWinner = index === 0 && candidate.vote_count > 0;
        
        html += `
            <div class="result-bar">
                <div class="result-bar-header">
                    <span>${isWinner ? '👑 ' : ''}${candidate.name}</span>
                    <span>${candidate.vote_count || 0} suara (${percentage}%)</span>
                </div>
                <div class="result-bar-fill" style="width: ${percentage}%">
                    ${percentage}%
                </div>
            </div>
        `;
    });

    chartDiv.innerHTML = html;
}