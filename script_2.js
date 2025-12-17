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
        'start': { choices: [{ text: 'Trene først', target: 'practice', pts: 50 }, { text: 'Prøv direkte', target: 'fail', pts: 0 }] },
        'practice': { choices: [{ text: 'Gjør det nå', target: 'sucess', pts: 100 }] },
        'sucess': { isFinal: true, msg: 'Fantastisk! Du landet trikset i snøen!' },
        'fail': { isFinal: true, msg: 'Uff, det ble et hardt fall i snøen.' }
    }
};

window.togglePlayPause = function() {
    // Ikke tillat pause hvis beslutningsboksen eller resultatet er oppe
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

    if (!data.isFinal && videoPlayer.currentTime >= 8) {
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
    document.getElementById('mainLoader').style.display = 'none';
    backgroundVideo.style.opacity = '1';
};
