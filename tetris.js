const canvas = document.getElementById('tetris-canvas');
const nextPieceCanvas = document.getElementById('next-piece-canvas');
const ctx = canvas.getContext('2d');
const nextCtx = nextPieceCanvas.getContext('2d');
const BLOCK_SIZE = 35;
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const COLORS = [
    null,
    '#FF4D4D', // I - Rojo brillante
    '#4D4DFF', // J - Azul brillante
    '#4DFF4D', // L - Verde brillante
    '#FFD700', // O - Dorado
    '#FF69B4', // S - Rosa
    '#9370DB', // T - Púrpura
    '#00CED1'  // Z - Turquesa
];

// Configurar tamaño del canvas
canvas.width = BLOCK_SIZE * BOARD_WIDTH;
canvas.height = BLOCK_SIZE * BOARD_HEIGHT;

// Configurar tamaño del canvas de siguiente pieza
nextPieceCanvas.width = BLOCK_SIZE * 4;
nextPieceCanvas.height = BLOCK_SIZE * 4;

// Variables globales al inicio
const INITIAL_DROP_INTERVAL = 1000; // 1 segundo inicial
const SPEED_INCREASE_FACTOR = 0.8; // Reducción del 20% del tiempo por nivel

// Variables de estado del juego
let dropCounter = 0;
let dropInterval = INITIAL_DROP_INTERVAL;
let lastTime = 0;
let gameOver = false;
let isPaused = false;
let isGameActive = false;

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
    lines: 0,
    level: 1,
    next: null
};

const arena = createMatrix(BOARD_WIDTH, BOARD_HEIGHT);

// Variables para el control del tiempo
let lastDropTime = 0;
const DROP_INTERVAL = 1000; // 1 segundo entre cada caída

function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0));
    }
    return matrix;
}

function createPiece(type) {
    switch(type) {
        case 'I':
            return [
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
                [0, 1, 0, 0],
            ];
        case 'L':
            return [
                [0, 2, 0],
                [0, 2, 0],
                [0, 2, 2],
            ];
        case 'J':
            return [
                [0, 3, 0],
                [0, 3, 0],
                [3, 3, 0],
            ];
        case 'O':
            return [
                [4, 4],
                [4, 4],
            ];
        case 'Z':
            return [
                [5, 5, 0],
                [0, 5, 5],
                [0, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'T':
            return [
                [0, 7, 0],
                [7, 7, 7],
                [0, 0, 0],
            ];
    }
}

function drawMatrix(matrix, offset, context = ctx) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = COLORS[value];
                context.fillRect(
                    (x + offset.x) * BLOCK_SIZE,
                    (y + offset.y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
                // Añadir efecto de brillo
                context.fillStyle = 'rgba(255, 255, 255, 0.1)';
                context.fillRect(
                    (x + offset.x) * BLOCK_SIZE,
                    (y + offset.y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE / 2
                );
                // Añadir borde
                context.strokeStyle = 'rgba(0, 0, 0, 0.3)';
                context.strokeRect(
                    (x + offset.x) * BLOCK_SIZE,
                    (y + offset.y) * BLOCK_SIZE,
                    BLOCK_SIZE - 1,
                    BLOCK_SIZE - 1
                );
            }
        });
    });
}

function draw() {
    // Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    for (let i = 0; i < BOARD_WIDTH; i++) {
        for (let j = 0; j < BOARD_HEIGHT; j++) {
            ctx.strokeRect(
                i * BLOCK_SIZE,
                j * BLOCK_SIZE,
                BLOCK_SIZE,
                BLOCK_SIZE
            );
        }
    }
    
    drawMatrix(arena, {x: 0, y: 0});
    drawMatrix(player.matrix, player.pos);
    
    // Fondo para siguiente pieza
    const nextGradient = nextCtx.createLinearGradient(0, 0, 0, nextPieceCanvas.height);
    nextGradient.addColorStop(0, '#1a1a2e');
    nextGradient.addColorStop(1, '#16213e');
    nextCtx.fillStyle = nextGradient;
    nextCtx.fillRect(0, 0, nextPieceCanvas.width, nextPieceCanvas.height);
    
    if (player.next) {
        const offset = {
            x: (nextPieceCanvas.width / BLOCK_SIZE - player.next[0].length) / 2,
            y: (nextPieceCanvas.height / BLOCK_SIZE - player.next.length) / 2
        };
        drawMatrix(player.next, offset, nextCtx);
    }
}

function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
    dropCounter = 0;
}

function playerMove(offset) {
    player.pos.x += offset;
    if (collide(arena, player)) {
        player.pos.x -= offset;
    }
}

function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

function playerReset() {
    const pieces = 'TJLOSZI';
    if (!player.next) {
        player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]);
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    } else {
        player.matrix = player.next;
        player.next = createPiece(pieces[pieces.length * Math.random() | 0]);
    }
    
    // Posicionar la pieza en la parte superior central
    player.pos.y = 0;
    player.pos.x = Math.floor((arena[0].length - player.matrix[0].length) / 2);
    
    // Verificar Game Over
    if (collide(arena, player)) {
        gameOver = true;
        isGameActive = false;
        showNotification('error', `¡Juego terminado! Puntuación final: ${player.score}`);
    }
}

function collide(arena, player) {
    const m = player.matrix;
    const o = player.pos;
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Función para calcular el intervalo de caída según el nivel
function calculateDropInterval(level) {
    return INITIAL_DROP_INTERVAL * Math.pow(SPEED_INCREASE_FACTOR, level - 1);
}

// Función para actualizar el nivel
function updateLevel() {
    const oldLevel = player.level;
    player.level = Math.floor(player.lines / 10) + 1;
    
    // Si el nivel cambió, actualizar la velocidad
    if (oldLevel !== player.level) {
        dropInterval = calculateDropInterval(player.level);
        showNotification('success', `¡Nivel ${player.level}! ¡La velocidad aumenta!`);
    }
    
    document.getElementById('level').textContent = player.level;
}

// Modificar la función arenaSweep para incluir la actualización de recompensas
function arenaSweep() {
    let rowCount = 1;
    let linesCleared = 0;
    
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }
        
        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;
        
        linesCleared++;
    }
    
    if (linesCleared > 0) {
        player.lines += linesCleared;
        player.score += rowCount * 100 * linesCleared;
        updateScore();
        updateLevel();
    }
}

// Añadir sistema de recompensas
const REWARD_RATE = 0.0001; // 1000 puntos = 0.0001 USDC
let currentReward = 0;
let lastClaimedScore = 0;

function updateScore() {
    document.getElementById('score').textContent = player.score;
    document.getElementById('lines').textContent = player.lines;
    document.getElementById('level').textContent = player.level;
    
    // Calcular recompensa
    currentReward = (player.score - lastClaimedScore) * REWARD_RATE / 1000;
    
    // Actualizar elemento de recompensa si existe
    const rewardElement = document.getElementById('reward');
    if (rewardElement) {
        rewardElement.textContent = currentReward.toFixed(8);
    }

    // Reclamar recompensa automáticamente cada 1000 puntos
    if (player.score - lastClaimedScore >= 1000) {
        claimReward();
    }
}

function claimReward() {
    if (currentReward > 0) {
        // Usar la función modifyBalance del sistema
        if (typeof window.modifyBalance === 'function') {
            try {
                window.modifyBalance(currentReward);
                
                // Guardar en el historial
                const history = JSON.parse(localStorage.getItem('withdrawalHistory') || '[]');
                history.unshift({
                    date: new Date().toISOString(),
                    amount: currentReward,
                    status: 'COMPLETED',
                    transactionId: 'TX' + Date.now().toString(36).toUpperCase()
                });
                localStorage.setItem('withdrawalHistory', JSON.stringify(history));
                
                // Mostrar notificación
                showNotification('success', `¡Felicidades! Has ganado ${currentReward.toFixed(8)} USDC`);
                
                // Actualizar último puntaje reclamado
                lastClaimedScore = player.score;
                currentReward = 0;
                
                // Actualizar elemento de recompensa
                const rewardElement = document.getElementById('reward');
                if (rewardElement) {
                    rewardElement.textContent = '0.00000000';
                }

                // Actualizar el balance mostrado
                const balanceElement = document.getElementById('balance');
                if (balanceElement) {
                    const currentBalance = parseFloat(balanceElement.textContent);
                    const newBalance = currentBalance + currentReward;
                    balanceElement.textContent = newBalance.toFixed(8);
                    localStorage.setItem('currentBalance', newBalance.toString());
                }
            } catch (error) {
                console.error('Error al reclamar recompensa:', error);
                showNotification('error', 'Error al reclamar la recompensa. Por favor, intenta de nuevo.');
            }
        } else {
            console.error('La función modifyBalance no está disponible');
            showNotification('error', 'Error: No se puede conectar con el sistema de recompensas.');
        }
    }
}

function showNotification(type, message) {
    const container = document.getElementById('notificationContainer');
    if (container) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

function update(time = 0) {
    if (!isGameActive || gameOver || isPaused) return;

    const deltaTime = time - lastTime;
    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        playerDrop();
        dropCounter = 0;
    }

    lastTime = time;
    draw();
    requestAnimationFrame(update);
}

// Función para manejar el movimiento de las piezas
function handleKeyPress(event) {
    if (!isGameActive) return;
    
    switch (event.key) {
        case 'ArrowLeft':
        case 'Left':
            event.preventDefault();
            playerMove(-1);
            break;
        case 'ArrowRight':
        case 'Right':
            event.preventDefault();
            playerMove(1);
            break;
        case 'ArrowUp':
        case 'Up':
            event.preventDefault();
            playerRotate(1);
            break;
        case 'ArrowDown':
        case 'Down':
            event.preventDefault();
            playerDrop();
            break;
        case ' ':
        case 'Spacebar':
            event.preventDefault();
            hardDrop();
            break;
    }
    draw();
}

// Función para el bucle principal del juego
function gameLoop(timestamp) {
    if (!gameOver && !isPaused) {
        // Controlar la caída automática de las piezas
        if (timestamp - lastDropTime >= DROP_INTERVAL) {
            playerDrop();
            lastDropTime = timestamp;
        }
        draw();
        requestAnimationFrame(gameLoop);
    }
    
    // Asegurar que los controles táctiles permanezcan visibles en dispositivos móviles
    if (isMobileDevice()) {
        const touchControls = document.querySelector('.touch-controls');
        if (touchControls && touchControls.style.display !== 'grid') {
            touchControls.style.display = 'grid';
        }
    }
}

// Función para mover la pieza hacia abajo
function moveDown() {
    if (!collide(arena, player)) {
        player.pos.y++;
        draw();
    } else {
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
    }
}

// Función para la caída instantánea
function hardDrop() {
    let dropDistance = 0;
    while (!collide(arena, player)) {
        player.pos.y++;
        dropDistance++;
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
}

// Función para detectar si es un dispositivo móvil
function isMobileDevice() {
    return window.innerWidth <= 768 || 
           /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Función para ajustar el juego según el dispositivo
function adjustForDevice() {
    const isMobile = isMobileDevice();
    
    // Ajustar tamaño del canvas para dispositivos móviles
    if (isMobile) {
        const container = document.querySelector('.game-container');
        if (container) {
            container.style.width = '100%';
            container.style.maxWidth = '100%';
            container.style.flexDirection = 'column';
            container.style.alignItems = 'center';
        }
        
        // Ajustar tamaño del canvas principal
        const canvas = document.getElementById('tetris-canvas');
        if (canvas) {
            const containerWidth = canvas.parentElement.clientWidth;
            const newBlockSize = Math.floor(containerWidth / BOARD_WIDTH);
            canvas.width = newBlockSize * BOARD_WIDTH;
            canvas.height = newBlockSize * BOARD_HEIGHT;
            
            // Actualizar BLOCK_SIZE global
            BLOCK_SIZE = newBlockSize;
        }
        
        // Ajustar tamaño del canvas de siguiente pieza
        const nextCanvas = document.getElementById('next-piece-canvas');
        if (nextCanvas) {
            nextCanvas.width = BLOCK_SIZE * 4;
            nextCanvas.height = BLOCK_SIZE * 4;
        }
        
        // Mostrar controles táctiles
        const touchControls = document.querySelector('.touch-controls');
        if (touchControls) {
            touchControls.style.display = 'grid';
        }
        
        // Ocultar controles de teclado en la información
        const keyboardControls = document.querySelector('.controls');
        if (keyboardControls) {
            keyboardControls.style.display = 'none';
        }
    } else {
        // Ocultar controles táctiles en dispositivos de escritorio
        const touchControls = document.querySelector('.touch-controls');
        if (touchControls) {
            touchControls.style.display = 'none';
        }
    }
    
    // Redibujar el juego
    draw();
}

// Función para iniciar el juego
function initGame() {
    // Reiniciar variables del juego
    arena.forEach(row => row.fill(0));
    player.score = 0;
    player.lines = 0;
    player.level = 1;
    dropInterval = INITIAL_DROP_INTERVAL;
    dropCounter = 0;
    lastTime = 0;
    gameOver = false;
    isPaused = false;
    isGameActive = true;
    
    // Inicializar el juego
    updateScore();
    playerReset();
    draw();
    
    // Configurar eventos de teclado
    document.removeEventListener('keydown', handleKeyPress);
    document.addEventListener('keydown', handleKeyPress);
    
    // Iniciar el bucle del juego
    requestAnimationFrame(update);
    
    // Mostrar mensaje de inicio
    showNotification('info', '¡Juego iniciado!');
}

// Un solo event listener para DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Configurar el botón de inicio
    const startButton = document.getElementById('start-button');
    if (startButton) {
        startButton.onclick = function() {
            initGame();
        };
    }
    
    // Configurar el botón de pausa
    const pauseButton = document.getElementById('pause-button');
    if (pauseButton) {
        pauseButton.onclick = function() {
            if (!isGameActive) return;
            
            isPaused = !isPaused;
            if (!isPaused) {
                lastTime = performance.now();
                dropCounter = 0;
                requestAnimationFrame(update);
            }
            pauseButton.textContent = isPaused ? 'Continuar' : 'Pausar';
            
            // Mostrar mensaje de pausa
            showNotification('info', isPaused ? 'Juego pausado' : 'Juego continuado');
        };
    }

    // Configurar controles táctiles
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    const downBtn = document.getElementById('down-btn');
    const spaceBtn = document.getElementById('space-btn');

    if (leftBtn) leftBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameActive && !isPaused) playerMove(-1); });
    if (rightBtn) rightBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameActive && !isPaused) playerMove(1); });
    if (rotateBtn) rotateBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameActive && !isPaused) playerRotate(1); });
    if (downBtn) downBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameActive && !isPaused) playerDrop(); });
    if (spaceBtn) spaceBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (isGameActive && !isPaused) hardDrop(); });

    // Añadir soporte para clic en dispositivos de escritorio
    if (leftBtn) leftBtn.addEventListener('click', () => { if (isGameActive && !isPaused) playerMove(-1); });
    if (rightBtn) rightBtn.addEventListener('click', () => { if (isGameActive && !isPaused) playerMove(1); });
    if (rotateBtn) rotateBtn.addEventListener('click', () => { if (isGameActive && !isPaused) playerRotate(1); });
    if (downBtn) downBtn.addEventListener('click', () => { if (isGameActive && !isPaused) playerDrop(); });
    if (spaceBtn) spaceBtn.addEventListener('click', () => { if (isGameActive && !isPaused) hardDrop(); });
    
    // Dibujar el tablero inicial
    draw();
}); 