function saveConfig() {
    const players = [];
    document.querySelectorAll('.player-row').forEach(row => {
        players.push({
            name: row.querySelector('.p-name').value,
            link: row.querySelector('.p-link').value
        });
    });
    const config = {
        server: document.getElementById('ap-server').value,
        slot: document.getElementById('ap-slot').value,
        sounds: document.getElementById('enable-sounds').checked,
        colorAccent: document.getElementById('color-accent').value,
        colorItem: document.getElementById('color-item').value,
        players: players
    };
    localStorage.setItem('apSetupV3', JSON.stringify(config));
}

function loadConfig() {
    const saved = localStorage.getItem('apSetupV3');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('ap-server').value = config.server || '';
        document.getElementById('ap-slot').value = config.slot || '';
        document.getElementById('enable-sounds').checked = config.sounds !== false;
        document.getElementById('color-accent').value = config.colorAccent || '#89b4fa';
        document.getElementById('color-item').value = config.colorItem || '#f9e2af';
        
        if (config.players && config.players.length > 0) {
            config.players.forEach(p => addPlayer(p.name, p.link));
        } else { addPlayer(); }
    } else { addPlayer(); }
}

function addPlayer(name = '', link = '') {
    const div = document.createElement('div');
    div.className = 'player-row';
    div.innerHTML = `
        <input type="text" placeholder="Pseudo exact en jeu" class="p-name" value="${name}" onchange="saveConfig()">
        <input type="text" placeholder="Lien Vidéo" class="p-link" value="${link}" onchange="saveConfig()">
        <button class="btn-remove" onclick="this.parentElement.remove(); saveConfig();">X</button>
    `;
    document.getElementById('players-list').appendChild(div);
}

document.querySelectorAll('input').forEach(input => input.addEventListener('change', saveConfig));
window.onload = loadConfig;

function generateLink() {
    saveConfig();
    const saved = JSON.parse(localStorage.getItem('apSetupV3'));
    saved.server = saved.server.replace('wss://', '').replace('ws://', '');
    const encodedConfig = btoa(encodeURIComponent(JSON.stringify(saved)));
    
    let urlBase = window.location.href.split('?')[0];
    if (!urlBase.includes('index.html')) {
        if (!urlBase.endsWith('/')) urlBase += '/';
        urlBase += 'overlay.html';
    } else {
        urlBase = urlBase.replace('index.html', 'overlay.html');
    }
    document.getElementById('obs-link').value = `${urlBase}?data=${encodedConfig}`;
}