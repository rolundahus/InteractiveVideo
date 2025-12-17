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

// Loaderne
const mainLoader = document.getElementById('mainLoader');
const gameLoader = document.getElementById('gameLoader');
const backgroundVideo = document.getElementById('backgroundVideo');

// Sørg for at landingsside-videoen skjuler loaderen når den er klar
backgroundVideo.oncanplaythrough = () => {
    mainLoader.style.display = 'none';
    backgroundVideo.style.opacity = '1';
};

const VIDEO_PLAYBACK_DURATION = 8; 
const DECISION_DURATION = 10;      

let currentAdventure = null; 
let currentSceneId = null;
let videoCheckInterval = null;      
let decisionTimeout = null;         

const ADVENTURE_URLS = {
    'skog': { 
        'start': 'https://www.dropbox.com/scl/fi/o3nrr05weu2al4uqtziik/Scene1.mp4?rlkey=c7a2wjy3oadxo8ivnmuwca9np&st=tjxvyio0&raw=1',
        'practice': 'https://www.dropbox.com/scl/fi/a4urya8fsf00wiiwjwxy0/ScenePractis.mp4?rlkey=ws8ivc992vtrvhois39q8buw4&st=1fywi0du&raw=1',
        'fail': 'https://www.dropbox.com/scl/fi/stpn568qd45rg3g3cfyvu/SceneFail.mp4?rlkey=472nyimpqnm26n7ktro1v4y8t&st=3qas819n&raw=1',
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
        'start': { choices: [{ text: 'Trene litt', targetScene: 'practice' }, { text: 'Prøv triks', targetScene: 'fail' }] },
        'practice': { choices: [{ text: 'Gjør trikset nå', targetScene: 'sucess' }] },
        'sucess': { isFinal: true, message: 'Rått! Du landet trikset perfekt etter trening!', nextTarget: 'start_landing', buttonText: 'Velg nytt eventyr' },
        'fail': { isFinal: true, message: 'Det gikk ikke! Det er lurt å trene litt først.', nextTarget: 'start', buttonText: 'Prøv igjen' }
    },
    'hav': {
        'start': { choices: [{ text: 'Trene først', targetScene: 'practice' }, { text: 'Prøv direkte', targetScene: 'fail' }] },
        'practice': { choices: [{ text: 'Prøv trikset', targetScene: 'sucess' }] },
        'sucess': { isFinal: true, message: 'Fantastisk! Du klarte det!', nextTarget: 'start_landing', buttonText: 'Velg nytt eventyr' },
        'fail': { isFinal: true, message: 'Det gikk ikke helt etter planen. Kanskje trene litt?', nextTarget: 'start', buttonText: 'Prøv igjen' }
    },
    'time_out': { isFinal: true, message: 'Tiden rant ut!', nextTarget: 'start', buttonText: 'Prøv igjen' }
};

window.startAdventure = function(type) {
    currentAdventure = type;
    landingPage.style.display = 'none';
    videoWrapper.style.display = 'block'; 
    playScene('start');
}

function playScene(sceneId) {
    if (sceneId === 'start_landing') { location.reload(); return; }
    currentSceneId = sceneId;
    const sceneUrl = ADVENTURE_URLS[currentAdventure][sceneId];
    const scene = ADVENTURE_DATA[currentAdventure][sceneId];

    clearAllIntervals();
    resultOverlay.style.display = 'none';
    decisionBox.style.display = 'none';
    fadeOverlay.style.opacity = 1;
    gameLoader.style.display = 'block'; // Vis loader mens video hentes

    videoPlayer.src = sceneUrl;
    videoPlayer.load();
    videoPlayer.oncanplay = () => {
        gameLoader.style.display = 'none'; // Skjul loader når klar
        fadeOverlay.style.opacity = 0;
        videoPlayer.style.opacity = 1;
        videoPlayer.play();
        if (scene && scene.isFinal) {
            videoPlayer.onended = () => showFinalPlacard(currentSceneId);
        } else {
            videoCheckInterval = setInterval(checkVideoTime, 100);
        }
    };
}

function checkVideoTime() {
    if (videoPlayer.currentTime >= VIDEO_PLAYBACK_DURATION) {
        clearInterval(videoCheckInterval);
        videoPlayer.pause();
        showChoices(currentSceneId);
    }
}

function showChoices(sceneId) {
    const scene = ADVENTURE_DATA[currentAdventure][sceneId];
    controlsContainer.innerHTML = '';
    decisionMessage.textContent = scene.message || "Hva gjør du nå?";
    
    scene.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.textContent = choice.text;
        btn.onclick = () => playScene(choice.targetScene);
        controlsContainer.appendChild(btn);
    });

    decisionBox.style.display = 'flex';
    setTimeout(() => decisionBox.style.opacity = 1, 10);
    
    timerBar.style.animation = 'none';
    void timerBar.offsetWidth; 
    timerBar.style.animation = `countdown ${DECISION_DURATION}s linear forwards`;
    decisionTimeout = setTimeout(() => showFinalPlacard('time_out'), DECISION_DURATION * 1000);
}

function showFinalPlacard(sceneId) {
    clearAllIntervals();
    decisionBox.style.display = 'none';
    const sceneData = sceneId === 'time_out' ? ADVENTURE_DATA['time_out'] : ADVENTURE_DATA[currentAdventure][sceneId];
    
    let title = (sceneId === 'sucess' || sceneId === 'slutt_bra') ? "GRATULERER!" : "MISLYKKET!";
    
    resultContent.innerHTML = `
        <h2 style="font-size: 2em; margin-bottom: 15px;">${title}</h2>
        <p style="margin-bottom: 25px;">${sceneData.message}</p>
        <button class="retry-btn" onclick="playScene('${sceneData.nextTarget}')">${sceneData.buttonText}</button>
    `;
    
    resultOverlay.style.display = 'flex';
    setTimeout(() => resultOverlay.style.opacity = 1, 10);
    videoPlayer.pause();
}

function clearAllIntervals() {
    clearInterval(videoCheckInterval);
    clearTimeout(decisionTimeout);
}