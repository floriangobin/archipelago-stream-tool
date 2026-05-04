const urlParams = new URLSearchParams(window.location.search);
const sharedConfig = urlParams.get('config');

if (sharedConfig) {
    try {
        const decoded = JSON.parse(decodeURIComponent(atob(sharedConfig)));
        localStorage.setItem('apSetupV5', JSON.stringify(decoded));
        window.history.replaceState({}, document.title, window.location.pathname);
    } catch(e) { console.error("Lien invalide"); }
}

function getConfig() {
    const players = [];
    document.querySelectorAll('.player-row').forEach(row => {
        players.push({ name: row.querySelector('.p-name').value, link: row.querySelector('.p-link').value });
    });
    
    return {
        server: document.getElementById('ap-server').value,
        slot: document.getElementById('ap-slot').value,
        design: {
            layout: document.getElementById('ui-layout').value,
            font: document.getElementById('ui-font').value,
            radius: document.getElementById('ui-radius').value,
            bgImage: document.getElementById('ui-bg').value,
            colorAccent: document.getElementById('color-accent').value,
            colorItem: document.getElementById('color-item').value
        },
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
    const saved = localStorage.getItem('apSetupV5');
    if (saved) {
        const config = JSON.parse(saved);
        document.getElementById('ap-server').value = config.server || '';
        document.getElementById('ap-slot').value = config.slot || '';
        
        if(config.design) {
            document.getElementById('ui-layout').value = config.design.layout || 'layout-grid';
            document.getElementById('ui-font').value = config.design.font || "'Segoe UI', sans-serif";
            document.getElementById('ui-radius').value = config.design.radius || '12';
            document.getElementById('ui-bg').value = config.design.bgImage || '';
            document.getElementById('color-accent').value = config.design.colorAccent || '#89b4fa';
            document.getElementById('color-item').value = config.design.colorItem || '#f9e2af';
        }
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
        <input type="text" placeholder="Vidéo (URL)" class="p-link" value="${link}" oninput="debouncePreview()">
        <button class="btn-danger" onclick="this.parentElement.remove(); updatePreview();">X</button>
    `;
    document.getElementById('players-list').appendChild(div);
}

let timeout;
function debouncePreview() {
    clearTimeout(timeout);
    timeout = setTimeout(updatePreview, 500); 
}

function updatePreview() {
    const config = getConfig();
    localStorage.setItem('apSetupV5', JSON.stringify(config)); 
    const safeConfig = JSON.parse(JSON.stringify(config));
    safeConfig.server = safeConfig.server.replace('wss://', '').replace('ws://', '');
    const encodedConfig = btoa(encodeURIComponent(JSON.stringify(safeConfig)));
    
    let urlBase = window.location.href.split('?')[0];
    if (!urlBase.includes('index.html')) {
        if (!urlBase.endsWith('/')) urlBase += '/'; urlBase += 'overlay.html';
    } else { urlBase = urlBase.replace('index.html', 'overlay.html'); }

    const obsLink = `${urlBase}?data=${encodedConfig}`;
    document.getElementById('obs-link').value = obsLink;
    document.getElementById('preview-frame').src = `${obsLink}&preview=true`;
}

function shareConfig() {
    const config = getConfig();
    const encodedConfig = btoa(encodeURIComponent(JSON.stringify(config)));
    let urlBase = window.location.href.split('?')[0];
    navigator.clipboard.writeText(`${urlBase}?config=${encodedConfig}`).then(() => {
        alert("Lien copié !");
    });
}

window.onload = loadConfig;