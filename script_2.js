// Hent alle elementer
const videoPlayer = document.getElementById('videoPlayer');
const videoWrapper = document.getElementById('videoWrapper');
const landingPage = document.getElementById('landingPage');
const decisionBox = document.getElementById('decisionBox');
const resultOverlay = document.getElementById('resultOverlay');
const resultContent = document.getElementById('resultContent');
const controlsContainer = document.getElementById('controlsContainer');
const decisionMessage = document.getElementById('decisionMessage');
const timerBar = document.getElementById('timerBar');
const fadeOverlay = document.getElementById('fadeOverlay');
const scoreValue = document.getElementById('scoreValue');
const livesDisplay = document.getElementById('livesDisplay');
const gameHeader = document.getElementById('gameHeader');
const headerProgress = document.getElementById('headerProgress');
const adventureName = document.getElementById('adventureName');
const gameStatus = document.getElementById('gameStatus');
const gameLoader = document.getElementById('gameLoader');

let currentAdventure = null; 
let currentSceneId = null;
let videoCheckInterval = null;      
let decisionTimeout = null;         
let score = 0;
let lives = 3;

// URL-er (Dobbeltsjekket at disse fungerer med raw=1)
const ADVENTURE_URLS = {
    'skog': { 
        'start': 'https://www.dropbox.com/scl/fi/o3nrr05weu2al4uqtziik/Scene1.mp4?rlkey=c7a2wjy3oadxo8ivnmuwca9np&st=tjxvyio0&raw=1',
        'practice': 'https://www.dropbox.com/scl/fi/a4urya8fsf00wiiwjwxy0/ScenePractis.mp4?rlkey=ws8ivc992vtrvhois39q8buw4&st=1fywi0du&raw=1',
        'fail': 'https://www.dropbox.com/scl/fi/stpn568qd45rg3g3cfyvu/SceneFail.mp4?rlkey=472nyimpnm26n7ktro1v4y8t&st=3qas819n&raw=1',
        'sucess': 'https://www.dropbox.com/scl/fi/mxwgreh5cb8quznbizd1q/SceneWin.mp4?rlkey=km8xi2428l3pko5d6rtr5mmex&st=knfbonlu&raw=1'
    },
    'hav': {
        'start': 'https://www.dropbox.com/scl/fi/hd0g9s0vzdsl76pnrulyr/Scene1.mp4?rlkey=dn3ud02urs5d2gb4fau63rv1l&st=1i1on4bo&raw=1',
        'practice': 'https://www.dropbox.com/scl/fi/3wkesqa08rwd3qr4iziy5/Training.mp4?rlkey=z6dgm42wy45rvj9jngg2rhf7f&st=a6cuykrn&raw=1',
        'fail': 'https://www.dropbox.com/scl/fi/wyi207ycmjdafb5cppxhu/Fail.mp4?rlkey=907oxvh71df4xrfvscjzvjuld&st=wgsi69ps&raw=1',
        'sucess': 'https://www.dropbox.com/scl/fi/sdes8rb1vnflazknth5f9/Sucess.mp4?rlkey=hhykpt1t1ovukdsrfu4pl0rku&st=fe2caelz&raw=1'
    }
};

const ADVENTURE_DATA = {
    'skog': {
        'start': { choices: [{ text: 'Trene litt', target: 'practice', pts: 50 }, { text: 'Prøv triks', target: 'fail', pts: 0 }] },
        'practice': { choices: [{ text: 'Gjør trikset nå', target: 'sucess', pts: 100 }] },
        'sucess': { isFinal: true, msg: 'Rått! Du landet trikset perfekt!' },
        'fail': { isFinal: true, msg: 'Det gikk ikke! Du skadet deg litt.' }
    },
    'hav': {
        'start': { choices: [{ text: 'Trene først', target: 'practice', pts: 50 }, { text: 'Prøv trikset', target: 'fail', pts: 0 }] },
        'practice': { choices: [{ text: 'PRøv trikset', target: 'sucess', pts: 100 }] },
        'sucess': { isFinal: true, msg: 'Fantastisk! Du landet trikset i snøen!' },
        'fail': { isFinal: true, msg: 'Uff, det ble et hardt fall i snøen.' }
    }
};

// Funksjon for å starte spillet
window.startAdventure = function(type) {
    currentAdventure = type;
    score = 0; lives = 3;
    scoreValue.textContent = score;
    updateLivesDisplay();
    adventureName.textContent = type === 'skog' ? 'Skate' : 'Snow';
    
    landingPage.style.display = 'none';
    videoWrapper.style.display = 'block'; 
    gameHeader.style.display = 'flex';
    
    playScene('start');
}

function playScene(sceneId) {
    if (sceneId === 'restart') { location.reload(); return; }
    currentSceneId = sceneId;
    const url = ADVENTURE_URLS[currentAdventure][sceneId];

    clearAllIntervals();
    resultOverlay.style.display = 'none';
    decisionBox.style.display = 'none';
    fadeOverlay.style.opacity = 1;
    
    // Vis loader hvis den eksisterer
    if (gameLoader) gameLoader.style.display = 'block';

    videoPlayer.src = url;
    videoPlayer.load();

    // Når videoen kan spille
    videoPlayer.oncanplay = () => {
        if (gameLoader) gameLoader.style.display = 'none';
        fadeOverlay.style.opacity = 0;
        videoPlayer.style.opacity = 1;
        videoPlayer.play().catch(e => console.log("Auto-play blocked:", e));
        
        // Start sjekk av tid
        videoCheckInterval = setInterval(updateFrame, 50);
    };

    // Feilhåndtering hvis video ikke laster
    videoPlayer.onerror = () => {
        console.error("Kunne ikke laste video:", url);
        alert("Video kunne ikke lastes. Sjekk internett eller Dropbox-linken.");
    };
}

function updateFrame() {
    if (!videoPlayer.duration) return;
    
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    headerProgress.style.width = progress + "%";
    
    const data = ADVENTURE_DATA[currentAdventure][currentSceneId];

    // Hvis filmen er ferdig
    if (videoPlayer.ended) {
        clearInterval(videoCheckInterval);
        if (data.isFinal) {
            showFinalPlacard(currentSceneId);
        } else {
            // Hvis en ikke-final film slutter uventet, vis valgene
            showChoices();
        }
        return;
    }

    // Hvis det ikke er en final-film, sjekk 8-sekunders grense
    if (!data.isFinal && videoPlayer.currentTime >= 8) {
        clearInterval(videoCheckInterval);
        videoPlayer.pause();
        showChoices();
    }
}

// HJELPEFUNKSJONER (LIV, SCORE, TIMEOUT)
function updateLivesDisplay() {
    let heartIcons = "";
    for (let i = 0; i < 3; i++) { heartIcons += (i < lives) ? "❤️" : "🖤"; }
    livesDisplay.innerHTML = heartIcons;
}

function updateScore(pts) {
    score += pts;
    scoreValue.textContent = score;
}

function showChoices() {
    const data = ADVENTURE_DATA[currentAdventure][currentSceneId];
    controlsContainer.innerHTML = '';
    decisionMessage.textContent = "Velg din vei:";
    
    data.choices.forEach(c => {
        const btn = document.createElement('button');
        btn.textContent = c.text;
        btn.onclick = () => {
            updateScore(c.pts);
            playScene(c.target);
        };
        controlsContainer.appendChild(btn);
    });

    decisionBox.style.display = 'flex';
    setTimeout(() => decisionBox.style.opacity = 1, 10);
    
    timerBar.style.animation = `countdown 10s linear forwards`;
    decisionTimeout = setTimeout(() => {
        lives--;
        updateLivesDisplay();
        showFinalPlacard('timeout');
    }, 10000);
}

function showFinalPlacard(sceneId) {
    clearAllIntervals();
    decisionBox.style.display = 'none';
    
    let title = "RESULTAT"; let msg = ""; let btnText = "Prøv igjen"; let target = "start";
    
    if (sceneId === 'timeout') {
        msg = "Du brukte for lang tid!";
        title = "FOR SEINT!";
    } else {
        const data = ADVENTURE_DATA[currentAdventure][sceneId];
        msg = data.msg;
        if (sceneId === 'sucess') {
            title = "SUKSESS!"; btnText = "Nytt eventyr"; target = "restart";
        } else if (sceneId === 'fail') {
            lives--; updateLivesDisplay(); title = "FEIL!";
        }
    }

    if (lives <= 0) {
        title = "GAME OVER"; msg = "Ingen liv igjen!"; btnText = "Start på nytt"; target = "restart";
    }

    resultContent.innerHTML = `
        <h2 style="font-size: 3em;">${title}</h2>
        <p style="font-size: 1.2em;">${msg}</p>
        <p style="font-size: 1.5em; font-weight: 800;">SCORE: ${score}</p>
        <button class="retry-btn" onclick="playScene('${target}')">${btnText}</button>
    `;
    resultOverlay.style.display = 'flex';
    setTimeout(() => resultOverlay.style.opacity = 1, 10);
}

function clearAllIntervals() {
    clearInterval(videoCheckInterval);
    clearTimeout(decisionTimeout);
    timerBar.style.animation = 'none';
}

// Fjern mainLoader når siden er klar
window.onload = () => {
    document.getElementById('mainLoader').style.display = 'none';
    backgroundVideo.style.opacity = '1';
};
