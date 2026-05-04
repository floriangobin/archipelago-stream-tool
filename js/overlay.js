const urlParams = new URLSearchParams(window.location.search);
const encodedData = urlParams.get('data');
if (!encodedData) throw new Error("No data");

const config = JSON.parse(decodeURIComponent(atob(encodedData)));
const grid = document.getElementById('video-grid');
const logBox = document.getElementById('log-box');
const itemCounts = {}; // Dictionnaire pour le tracker

// Application des couleurs personnalisées
document.documentElement.style.setProperty('--accent', config.colorAccent || '#89b4fa');
document.documentElement.style.setProperty('--item', config.colorItem || '#f9e2af');

// Audio
const sfxItem = new Audio('https://actions.google.com/sounds/v1/cartoon/magic_chime.ogg');
const sfxDeath = new Audio('https://actions.google.com/sounds/v1/alarms/spaceship_alarm.ogg');
sfxItem.volume = 0.5; sfxDeath.volume = 0.6;

function playSound(type) {
    if (!config.sounds) return;
    if (type === 'item') { sfxItem.currentTime = 0; sfxItem.play().catch(()=>{}); }
    if (type === 'death') { sfxDeath.currentTime = 0; sfxDeath.play().catch(()=>{}); }
}

function sanitizeId(name) { return 'p-' + name.replace(/[^a-zA-Z0-9]/g, '-'); }

function getIframeSrc(link) {
    if (!link) return null;
    if (link.includes('twitch.tv')) {
        const channel = link.split('/').pop().split('?')[0];
        return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname || 'localhost'}&muted=true`;
    }
    if (link.includes('youtube.com') || link.includes('youtu.be')) {
        let id = link.includes('v=') ? link.split('v=')[1].split('&')[0] : link.split('/').pop();
        return `https://www.youtube.com/embed/${id}?autoplay=1&controls=0&mute=1`;
    }
    return link;
}

// Génération de la grille et du Tracker
config.players.forEach(player => {
    if(!player.name) return;
    itemCounts[player.name] = 0; // Initialise le compteur à 0
    const imgSrc = getIframeSrc(player.link);
    const content = imgSrc ? `<iframe src="${imgSrc}" allow="autoplay"></iframe>` : `<div style="display:flex; height:100%; align-items:center; justify-content:center;">Pas de flux vidéo</div>`;
    const playerId = sanitizeId(player.name);
    
    grid.innerHTML += `
        <div class="video-box" id="box-${playerId}">
            <div class="video-header">
                <div class="player-info">
                    <span>${player.name}</span>
                    <span class="item-counter" id="counter-${playerId}">0 🎁</span>
                </div>
                <span class="status-dot" id="status-${playerId}"></span>
            </div>
            <div class="iframe-container">${content}</div>
        </div>
    `;
});

function addLog(message, color = "var(--accent)") {
    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.style.borderLeftColor = color;
    entry.innerHTML = message;
    logBox.appendChild(entry);
    setTimeout(() => { entry.style.opacity = "0"; setTimeout(() => entry.remove(), 1000); }, 10000);
}

function updateTracker(playerName) {
    if (itemCounts[playerName] !== undefined) {
        itemCounts[playerName]++;
        document.getElementById(`counter-${sanitizeId(playerName)}`).innerText = `${itemCounts[playerName]} 🎁`;
        
        const box = document.getElementById(`box-${sanitizeId(playerName)}`);
        box.classList.add('highlight');
        setTimeout(() => box.classList.remove('highlight'), 4000);
    }
}

function triggerDeathLink() {
    playSound('death');
    const dl = document.getElementById('deathlink-overlay');
    dl.style.display = 'flex';
    dl.style.animation = 'flash 4s ease-out forwards';
    setTimeout(() => { dl.style.display = 'none'; dl.style.animation = ''; }, 4000);
}

// WebSocket
let ws;
let reconnectTimeout;
function connectAP() {
    if (!config.server || !config.slot) return;
    const wsURL = config.server.startsWith('ws') ? config.server : `wss://${config.server}`;
    ws = new WebSocket(wsURL);

    ws.onopen = () => {
        addLog("🟢 Connecté au serveur Archipelago", "var(--success)");
        clearTimeout(reconnectTimeout);
        ws.send(JSON.stringify([{
            cmd: 'Connect', password: '', name: config.slot,
            version: { major: 0, minor: 4, build: 4, class: 'Version' },
            tags: ['Tracker', 'DeathLink'], items_handling: 0
        }]));
    };

    ws.onmessage = (event) => {
        const packets = JSON.parse(event.data);
        packets.forEach(packet => {
            if (packet.cmd === 'PrintJSON') {
                let textMessage = "";
                if(packet.data) packet.data.forEach(part => { textMessage += part.text || ""; });
                else if (packet.text) textMessage = packet.text;
                
                if(textMessage && !textMessage.startsWith("Connection")) {
                    let isItem = textMessage.includes("found");
                    addLog(textMessage, isItem ? "var(--item)" : "var(--text)");
                    
                    if (isItem) {
                        playSound('item');
                        config.players.forEach(p => {
                            if (textMessage.includes(p.name)) updateTracker(p.name);
                        });
                    }
                }
            }
            if (packet.cmd === 'Bounced' && packet.tags && packet.tags.includes('DeathLink')) {
                const source = packet.data ? packet.data.source : "Quelqu'un";
                addLog(`💀 <b>${source}</b> a déclenché un DeathLink !`, "var(--danger)");
                triggerDeathLink();
            }
        });
    };

    ws.onclose = () => {
        addLog("🔴 Déconnecté. Reconnexion dans 5s...", "var(--danger)");
        reconnectTimeout = setTimeout(connectAP, 5000);
    };
    ws.onerror = () => { ws.close(); };
}

connectAP();