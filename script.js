import { Game } from "./game.js";

// --- RÉFÉRENCES DOM ---
const loaderScreen = document.getElementById('loader-screen');
const landingPage = document.getElementById('landing-page');
const gameScreen = document.getElementById('game-screen');
const startButton = document.getElementById('start-button');
const rulesButton = document.getElementById('rules-button');
const pauseButton = document.getElementById('pause-button');
const backToMenuButton = document.getElementById('back-to-menu');
const colorButtons = document.querySelectorAll('.color-select');
const scoreDisplay = document.getElementById('score-display');
const timeDisplay = document.getElementById('time-display');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Modal références
const rulesModal = document.getElementById('rules-modal');
const closeModalButton = document.getElementById('close-rules-modal');
const startFromModalButton = document.getElementById('start-from-modal');

// --- VARIABLES DE JEU ---
let game = null;
let selectedColor = '#ff4d4d'; 
let gameScore = 0;
let gameTime = 0;
let gameTimeInterval = null;

// Constantes pour la grille et les bulles
const BUBBLE_RADIUS = 20;
const CANVAS_WIDTH = canvas.width;
const CANVAS_HEIGHT = canvas.height;
const COLORS = ['#ff4d4d', '#4d94ff', '#4dff4d', '#ffff4d'];

// initialisation de la grille de bulles
let bubblesGrid = []; 
let currentShotBubble = null;
let gameIsRunning = false;

// --- GESTION DES ÉCRANS ---

/** Masque le loader et affiche la page d'accueil après un délai simulé. */
function hideLoader() {
    loaderScreen.classList.add('hidden');
    landingPage.classList.remove('hidden');
    
    // Animer les panneaux latéraux
    setTimeout(() => {
        document.querySelector('.panel-left').style.opacity = '1';
        document.querySelector('.panel-right').style.opacity = '1';
    }, 100);
}

/** Démarre le jeu et passe à l'écran du Canvas. */
startButton.addEventListener('click', () => {
    landingPage.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    initializeGame();
});

/** Bouton retour au menu */
if (backToMenuButton) {
    backToMenuButton.addEventListener('click', () => {
        gameIsRunning = false;
        if (gameTimeInterval) clearInterval(gameTimeInterval);
        gameScreen.classList.add('hidden');
        landingPage.classList.remove('hidden');
    });
}

/** Bouton pause */
if (pauseButton) {
    pauseButton.addEventListener('click', () => {
        gameIsRunning = !gameIsRunning;
        pauseButton.textContent = gameIsRunning ? '⏸️' : '▶️';
        if (gameIsRunning) {
            gameLoop();
        }
    });
}

/** Bouton règles - Ouvre le modal */
if (rulesButton) {
    rulesButton.addEventListener('click', () => {
        rulesModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Empêche le scroll
    });
}

/** Fermer le modal */
if (closeModalButton) {
    closeModalButton.addEventListener('click', closeRulesModal);
}

/** Fermer le modal en cliquant sur l'overlay */
if (rulesModal) {
    const overlay = rulesModal.querySelector('.modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeRulesModal);
    }
}

/** Fonction pour fermer le modal */
function closeRulesModal() {
    rulesModal.classList.add('hidden');
    document.body.style.overflow = 'auto'; // Réactive le scroll
}

/** Démarrer le jeu depuis le modal */
if (startFromModalButton) {
    startFromModalButton.addEventListener('click', () => {
        closeRulesModal();
        landingPage.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initializeGame();
    });
}

/** Fermer le modal avec la touche Echap */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !rulesModal.classList.contains('hidden')) {
        closeRulesModal();
    }
});


// --- CHOIX DE COULEUR PAR L'UTILISATEUR ---

colorButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Mettre à jour la couleur sélectionnée
        selectedColor = button.getAttribute('data-color');
        
        // Mettre à jour le feedback visuel (bordure or pour la couleur sélectionnée)
        colorButtons.forEach(btn => btn.classList.remove('selected'));
        button.classList.add('selected');
    });
});


// --- LOGIQUE DU JEU ---

/** Initialise la grille, le canon et lance la boucle de jeu. */
function initializeGame() {
    gameScore = 0;
    gameTime = 0;
    updateScoreDisplay();
    
    // Démarrer le chronomètre
    if (gameTimeInterval) clearInterval(gameTimeInterval);
    gameTimeInterval = setInterval(() => {
        gameTime++;
        updateTimeDisplay();
    }, 1000);

    // instanciation de ton moteur de jeu
    game = new Game(canvas, ctx, {
        radius: 20,
    });

    gameIsRunning = true;
    gameLoop();
}

/** Met à jour l'affichage du score. */
function updateScoreDisplay() {
    scoreDisplay.textContent = gameScore;
}

/** Met à jour l'affichage du temps. */
function updateTimeDisplay() {
    const minutes = Math.floor(gameTime / 60);
    const seconds = gameTime % 60;
    timeDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/** Logique de mise à jour (mouvement, collisions, match-3). */
function update() {
    if (!gameIsRunning || !game) return;

    const removed = game.update();
    if (removed > 0) {
        gameScore += removed * 10;
        updateScoreDisplay();
    }
}

/** Dessine tous les éléments sur le Canvas. */
function draw() {
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    if (game) {
        game.draw();
    }
}

/** La boucle principale du jeu. */
function gameLoop() {
    update();
    draw();

    if (gameIsRunning) {
        requestAnimationFrame(gameLoop);
    }
}

// --- GESTION DU TIR ---

/** Calcule l'angle entre le canon et la position de la souris. */
function calculateAngle(mouseX, mouseY) {
    const cannonX = CANVAS_WIDTH / 2;
    const cannonY = CANVAS_HEIGHT - BUBBLE_RADIUS * 2; // Position du canon
    
    const dx = mouseX - cannonX;
    const dy = mouseY - cannonY;
    
    // Math.atan2 retourne l'angle en radians
    let angle = Math.atan2(dy, dx);
    
    // Limiter l'angle pour ne pas tirer vers le bas (entre -165° et -15°)
    const minAngle = Math.PI + 0.3; // 165 degrés
    const maxAngle = -0.3;          // -15 degrés
    
    // Inverser l'angle pour travailler dans le repère du Canvas (angle par rapport à l'horizontale positive)
    // Mais pour le tir, nous nous intéressons seulement à l'orientation du canon.
    if (angle > maxAngle && angle < 0) {
        angle = maxAngle;
    } else if (angle < -Math.PI) {
        angle = minAngle;
    }

    return angle;
}


/** Déclenche le tir lors du clic sur le Canvas. */
// canvas.addEventListener('click', (e) => {
//     if (!gameIsRunning || !game) return;

//     const rect = canvas.getBoundingClientRect();
//     const mouseX = e.clientX - rect.left;
//     const mouseY = e.clientY - rect.top;
    
//     // On ne tire que dans la zone supérieure pour ne pas cliquer sur la palette
//     if (mouseY > CANVAS_HEIGHT - 50) return; 

//     const angle = calculateAngle(mouseX, mouseY);

//     // utilisation de ton moteur de jeu
//     game.shoot(angle, selectedColor);
// });

/** Crée et lance la bulle. */
function shootBubble(angle) {
    const speed = 10;
    
    // Vitesse Y doit être négative pour monter !
    // L'angle est calculé en bas/gauche/droite par rapport au canon.
    
    currentShotBubble = {
        x: CANVAS_WIDTH / 2,
        y: CANVAS_HEIGHT - BUBBLE_RADIUS * 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: selectedColor,
        radius: BUBBLE_RADIUS,
    };
}


// --- DÉMARRAGE (après le loader) ---
setTimeout(hideLoader, 2000);

document.addEventListener('keydown', (e) => {
    // On ne tire que si le jeu tourne et que le canvas est affiché
    if (!gameIsRunning || !game) return;

    if (e.code === 'Space' || e.code === 'ArrowUp') {
        // Tir tout droit vers le haut
        const angle = -Math.PI / 2; // -90° en radians

        // Ton moteur de jeu gère déjà angle + couleur
        game.shoot(angle, selectedColor);
    }
});
