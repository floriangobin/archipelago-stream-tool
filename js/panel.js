// --- IMPORT DE CONFIGURATION (COOPÉRATIF) ---
// Vérifie si on arrive sur la page avec un lien de partage d'un ami
const urlParams = new URLSearchParams(window.location.search);
const sharedConfig = urlParams.get('config');

if (sharedConfig) {
    try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedConfig)));
        localStorage.setItem('apSetupV4', JSON.stringify(decoded));
        // Nettoie l'URL pour faire propre
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch(e) { console.error("Lien de partage invalide"); }
}

// --- GESTION DES DONNÉES ---
function getConfig() {
    const players = [];
    document.querySelectorAll('.player-row').forEach(row => {
        players.push({
            name: row.querySelector('.p-name').value,
            link: row.querySelector('.p-link').value
        });
    });
    
    return {
        server: document.getElementById('ap-server').value,
        slot: document.getElementById('ap-slot').value,
        colorAccent: document.getElementById('color-accent').value,
        colorItem: document.getElementById('color-item').value,
        opts: {
            sounds: document.getElementById('opt-sounds').checked,
            log: document.getElementById('opt-log').checked,
            focus: document.getElementById('opt-focus').checked,
            hints: document.getElementById('opt-hints').checked,
            deathlink: document.getElementById('opt-deathlink').checked
        },
        players: players
    };
}

function loadConfig() {
    const saved = localStorage.getItem('apSetupV4');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('ap-server').value = config.server || '';
        document.getElementById('ap-slot').value = config.slot || '';
        document.getElementById('color-accent').value = config.colorAccent || '#89b4fa';
        document.getElementById('color-item').value = config.colorItem || '#f9e2af';
        
        if(config.opts) {
            document.getElementById('opt-sounds').checked = config.opts.sounds;
            document.getElementById('opt-log').checked = config.opts.log;
            document.getElementById('opt-focus').checked = config.opts.focus;
            document.getElementById('opt-hints').checked = config.opts.hints;
            document.getElementById('opt-deathlink').checked = config.opts.deathlink;
        }

        if (config.players && config.players.length > 0) {
            config.players.forEach(p => addPlayer(p.name, p.link));
        } else { addPlayer(); }
    } else { addPlayer(); }
    
    updatePreview();
}

function addPlayer(name = '', link = '') {
    const div = document.createElement('div');
    div.className = 'player-row';
    div.innerHTML = `
        <input type="text" placeholder="Pseudo" class="p-name" value="${name}" oninput="debouncePreview()">
        <input type="text" placeholder="Lien Vidéo" class="p-link" value="${link}" oninput="debouncePreview()">
        <button class="btn-danger" onclick="this.parentElement.remove(); updatePreview();">X</button>
    `;
    document.getElementById('players-list').appendChild(div);
}

// --- SYSTÈME DE PREVIEW & LIENS ---
let timeout;
function debouncePreview() {
    clearTimeout(timeout);
    timeout = setTimeout(updatePreview, 500); // Évite de recharger l'iframe à chaque lettre tapée
}

function updatePreview() {
    const config = getConfig();
    localStorage.setItem('apSetupV4', JSON.stringify(config)); // Sauvegarde auto
    
    // Nettoyage de l'adresse pour le lien
    const safeConfig = JSON.parse(JSON.stringify(config));
    safeConfig.server = safeConfig.server.replace('wss://', '').replace('ws://', '');
    
    const encodedConfig = btoa(encodeURIComponent(JSON.stringify(safeConfig)));
    
    // Base URL de l'overlay
    let urlBase = window.location.href.split('?')[0];
    if (!urlBase.includes('index.html')) {
        if (!urlBase.endsWith('/')) urlBase += '/';
        urlBase += 'overlay.html';
    } else {
        urlBase = urlBase.replace('index.html', 'overlay.html');
    }

    const obsLink = `${urlBase}?data=${encodedConfig}`;
    document.getElementById('obs-link').value = obsLink;
    
    // Met à jour la preview (avec un flag preview=true pour couper le son de l'iframe)
    document.getElementById('preview-frame').src = `${obsLink}&preview=true`;
}

// --- COOPÉRATIF ---
function shareConfig() {
    const config = getConfig();
    const encodedConfig = btoa(encodeURIComponent(JSON.stringify(config)));
    
    let urlBase = window.location.href.split('?')[0];
    const shareLink = `${urlBase}?config=${encodedConfig}`;
    
    navigator.clipboard.writeText(shareLink).then(() => {
        alert("Lien copié ! Envoyez-le à vos amis pour qu'ils aient la même configuration instantanément.");
    });
}

window.onload = loadConfig;