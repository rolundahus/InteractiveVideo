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
const gameFooter = document.getElementById('gameFooter');
const headerProgress = document.getElementById('headerProgress');
const adventureName = document.getElementById('adventureName');
const gameStatus = document.getElementById('gameStatus');
const gameLoader = document.getElementById('gameLoader');
const damageFlash = document.getElementById('damageFlash');
const pauseOverlay = document.getElementById('pauseOverlay');

let currentAdventure = null; 
let currentSceneId = null;
let videoCheckInterval = null;      
let decisionTimeout = null;         
let score = 0;
let lives = 3;
let isPaused = false;

// OPPDATERTE LOKALE FILNAVN
const ADVENTURE_URLS = {
    'skog': { 
        'start': 'SkateIntro.mp4',
        'practice': 'SkateTraining.mp4',
        'fail': 'SkateFail.mp4',
        'sucess': 'SkateSucess.mp4'
    },
    'hav': {
        'start': 'SnowScene1.mp4',
        'practice': 'SnowTraining.mp4',
        'fail': 'SnowFail.mp4',
        'sucess': 'SnowSucess.mp4'
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
        'start': { choices: [{ text: 'Trene først', target: 'practice', pts: 50 }, { text: 'Prøv direkte', target: 'fail', pts: 0 }] },
        'practice': { choices: [{ text: 'Gjør det nå', target: 'sucess', pts: 100 }] },
        'sucess': { isFinal: true, msg: 'Fantastisk! Du landet trikset i snøen!' },
        'fail': { isFinal: true, msg: 'Uff, det ble et hardt fall i snøen.' }
    }
};

window.togglePlayPause = function() {
    if (decisionBox.style.display === 'flex' || resultOverlay.style.display === 'flex') return;

    if (videoPlayer.paused) {
        videoPlayer.play();
        pauseOverlay.style.display = 'none';
        videoPlayer.style.filter = 'brightness(1)';
        isPaused = false;
    } else {
        videoPlayer.pause();
        pauseOverlay.style.display = 'flex';
        videoPlayer.style.filter = 'brightness(0.4)';
        isPaused = true;
    }
}

window.startAdventure = function(type) {
    clearAllIntervals();
    currentAdventure = type;
    score = 0; lives = 3;
    scoreValue.textContent = score;
    updateLivesDisplay();
    adventureName.textContent = type === 'skog' ? 'Skate' : 'Snow';
    gameStatus.textContent = "AKTIV";
    gameStatus.style.color = "#4CAF50";
    
    landingPage.style.display = 'none';
    videoWrapper.style.display = 'block'; 
    gameHeader.style.display = 'flex';
    gameFooter.style.display = 'flex';
    pauseOverlay.style.display = 'none';
    videoPlayer.style.filter = 'brightness(1)';
    
    playScene('start');
}

window.exitToMenu = function() {
    location.reload();
}

function triggerDamage() {
    lives--;
    updateLivesDisplay();
    damageFlash.style.opacity = "1";
    setTimeout(() => { damageFlash.style.opacity = "0"; }, 150);
}

function updateLivesDisplay() {
    let heartIcons = "";
    for (let i = 0; i < 3; i++) { heartIcons += (i < lives) ? "❤️" : "🖤"; }
    livesDisplay.innerHTML = heartIcons;
    if (lives <= 0) {
        gameStatus.textContent = "GAME OVER";
        gameStatus.style.color = "#ff4757";
    }
}

function updateScore(pts) {
    score += pts;
    scoreValue.textContent = score;
}

function playScene(sceneId) {
    if (sceneId === 'restart') { location.reload(); return; }
    currentSceneId = sceneId;
    const url = ADVENTURE_URLS[currentAdventure][sceneId];

    clearAllIntervals();
    resultOverlay.style.display = 'none';
    decisionBox.style.display = 'none';
    pauseOverlay.style.display = 'none';
    videoPlayer.style.filter = 'brightness(1)';
    fadeOverlay.style.opacity = 1;
    if (gameLoader) gameLoader.style.display = 'block';

    videoPlayer.src = url;
    videoPlayer.load();
    videoPlayer.oncanplay = () => {
        if (gameLoader) gameLoader.style.display = 'none';
        fadeOverlay.style.opacity = 0;
        videoPlayer.style.opacity = 1;
        videoPlayer.play().catch(e => console.log("Play failed:", e));
        videoCheckInterval = setInterval(updateFrame, 50);
    };
}

function updateFrame() {
    if (!videoPlayer.duration || isPaused) return;
    const progress = (videoPlayer.currentTime / videoPlayer.duration) * 100;
    headerProgress.style.width = progress + "%";
    const data = ADVENTURE_DATA[currentAdventure][currentSceneId];

    if (videoPlayer.ended) {
        clearInterval(videoCheckInterval);
        if (data.isFinal) showFinalPlacard(currentSceneId);
        else showChoices();
        return;
    }

    // Viser valgmuligheter når det er 2 sekunder igjen, eller ved slutten
    if (!data.isFinal && videoPlayer.currentTime >= (videoPlayer.duration - 2)) {
        clearInterval(videoCheckInterval);
        videoPlayer.pause();
        showChoices();
    }
}

function showChoices() {
    const data = ADVENTURE_DATA[currentAdventure][currentSceneId];
    controlsContainer.innerHTML = '';
    decisionMessage.textContent = "Velg din vei:";
    
    data.choices.forEach(c => {
        const btn = document.createElement('button');
        btn.textContent = c.text;
        btn.onclick = () => {
            if (c.target === 'fail') triggerDamage();
            updateScore(c.pts);
            playScene(c.target);
        };
        controlsContainer.appendChild(btn);
    });

    decisionBox.style.display = 'flex';
    setTimeout(() => decisionBox.style.opacity = 1, 10);
    timerBar.style.animation = `countdown 10s linear forwards`;
    
    decisionTimeout = setTimeout(() => {
        triggerDamage();
        if (lives <= 0) showFinalPlacard('gameover');
        else showFinalPlacard('timeout');
    }, 10000);
}

function showFinalPlacard(sceneId) {
    clearAllIntervals();
    decisionBox.style.display = 'none';
    let title = "RESULTAT"; let msg = ""; let btnText = "Prøv igjen"; let target = "start";
    
    if (sceneId === 'timeout') {
        msg = "Tiden gikk ut!";
        title = "FOR SEINT!";
    } else if (sceneId === 'gameover') {
        title = "GAME OVER";
        msg = "Ingen liv igjen!";
        btnText = "Hovedmeny";
        target = "restart";
    } else {
        const data = ADVENTURE_DATA[currentAdventure][sceneId];
        msg = data.msg;
        if (sceneId === 'sucess') {
            title = "SUKSESS!"; btnText = "Ny utfordring"; target = "restart";
        } else if (sceneId === 'fail') {
            title = "MISLYKKET!";
        }
    }

    resultContent.innerHTML = `
        <h2 style="font-size: 2.5em; margin-bottom: 10px;">${title}</h2>
        <p style="font-size: 1.1em; margin-bottom: 20px;">${msg}</p>
        <p style="font-size: 1.6em; font-weight: 800; margin-bottom: 30px;">TOTAL SCORE: ${score}</p>
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

window.onload = () => {
    const mainLoader = document.getElementById('mainLoader');
    if (mainLoader) mainLoader.style.display = 'none';
    const bgVideo = document.getElementById('backgroundVideo');
    if (bgVideo) bgVideo.style.opacity = '1';
};
