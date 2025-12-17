const video = document.getElementById('videoPlayer');
const landingPage = document.getElementById('landingPage');
const videoWrapper = document.getElementById('videoWrapper');
const decisionBox = document.getElementById('decisionBox');
const controlsContainer = document.getElementById('controlsContainer');
const gameHeader = document.getElementById('gameHeader');
const gameFooter = document.getElementById('gameFooter');
const headerProgress = document.getElementById('headerProgress');
const scoreValue = document.getElementById('scoreValue');
const loader = document.getElementById('mainLoader');

let currentMode = '';
let score = 0;

// FILNAVN OVERSIKT
const MOVIE_DATA = {
    'skog': { // Skateboard
        'start': 'SkateIntro.mp4',
        'practice': 'SkateTraining.mp4',
        'fail': 'SkateFail.mp4',
        'win': 'SkateSucess.mp4'
    },
    'hav': { // Snowboard
        'start': 'SnowScene1.mp4',
        'practice': 'SnowTraining.mp4',
        'fail': 'SnowFail.mp4',
        'win': 'SnowSucess.mp4'
    }
};

// VALG-LOGIKK
const DECISIONS = {
    'start': [
        { text: 'Trene litt først', next: 'practice', pts: 50 },
        { text: 'Gå for trikset!', next: 'fail', pts: 0 }
    ],
    'practice': [
        { text: 'Nå er jeg klar!', next: 'win', pts: 100 }
    ]
};

// Skjul loader når siden er klar
window.onload = () => {
    if(loader) loader.style.display = 'none';
};

// Funksjon for å starte eventyret
window.startAdventure = function(mode) {
    currentMode = mode;
    landingPage.style.display = 'none';
    videoWrapper.style.display = 'block';
    gameHeader.style.display = 'flex';
    gameFooter.style.display = 'block';
    playScene('start');
};

function playScene(sceneId) {
    video.src = MOVIE_DATA[currentMode][sceneId];
    video.load();
    video.play();
    
    const timer = setInterval(() => {
        if (!video.paused) {
            const p = (video.currentTime / video.duration) * 100;
            headerProgress.style.width = p + "%";
        }
        
        if(video.ended) {
            clearInterval(timer);
            handleSceneEnd(sceneId);
        }
    }, 100);
}

function handleSceneEnd(sceneId) {
    if(sceneId === 'win' || sceneId === 'fail') {
        setTimeout(() => {
            alert("Eventyret er slutt! Poengsum: " + score);
            location.reload();
        }, 500);
    } else {
        showChoices(sceneId);
    }
}

function showChoices(sceneId) {
    controlsContainer.innerHTML = '';
    decisionBox.style.opacity = "0";
    decisionBox.style.display = 'flex';
    
    // Enkel fade-in effekt
    setTimeout(() => { decisionBox.style.opacity = "1"; }, 10);
    
    DECISIONS[sceneId].forEach(opt => {
        const btn = document.createElement('button');
        btn.innerText = opt.text;
        btn.onclick = () => {
            score += opt.pts;
            scoreValue.innerText = score;
            decisionBox.style.display = 'none';
            playScene(opt.next);
        };
        controlsContainer.appendChild(btn);
    });
}
