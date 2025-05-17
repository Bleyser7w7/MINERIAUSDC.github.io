// Variables globales
let canvas;
let ctx;

// Función para depuración
function debug(message, obj = null) {
    const timestamp = new Date().toISOString().substring(11, 23);
    if (obj) {
        console.log(`[DEBUG ${timestamp}] ${message}`, obj);
    } else {
        console.log(`[DEBUG ${timestamp}] ${message}`);
    }
}

// Configuración del juego
const game = {
    // Propiedades básicas
    width: 800,
    height: 400,
    groundHeight: 50,
    backgroundColor: '#1a1a2e',
    playerSize: 30,
    baseSpeed: 5,
    gravity: 0.5,
    jumpForce: 12,
    
    // Estado del juego
    started: false,
    over: false,
    score: 0,
    highScore: 0,
    totalReward: 0,
    
    // Control de animación
    animationId: null,
    lastTime: 0,
    
    // Velocidad y dificultad
    speed: 5,
    obstacleFrequency: 0.01,
    obstacleMinGap: 300,
    obstacleLastX: 800,
    lastSpeedIncreaseTime: 0,
    speedIncreaseInterval: 10000, // 10 segundos
    
    // Cambio de color de fondo
    backgroundColors: ['#1a1a2e', '#16213e', '#0f3460', '#541690', '#571845', '#900c3f'],
    currentBgColorIndex: 0,
    lastBgColorChangeTime: 0,
    bgColorChangeInterval: 5000, // Cambiar color cada 5 segundos
    
    // Elementos del juego
    player: null,
    obstacles: [],
    buildingBlocks: [],
    saws: [],
    decorations: [],
    particles: [],
    stars: [],
    coins: [],
    powerUps: [],
    
    // Tasas de generación
    spawnRate: {
        coin: 0.005,
        powerUp: 0.002,
        buildingBlock: 0.015,
        saw: 0.008
    },
    
    // Audio
    audio: {
        backgroundMusic: null,
        jump: null,
        gameOver: null,
        coin: null
    }
};

// Verificar si el elemento existe
function elementExists(id, name) {
    const element = document.getElementById(id);
    if (!element) {
        debug(`ERROR: No se encontró el elemento ${name} con ID ${id}`);
        return false;
    }
    debug(`OK: Elemento ${name} encontrado correctamente`);
    return true;
}

// Cuando el DOM esté cargado, configurar todo
document.addEventListener('DOMContentLoaded', function() {
    debug("DOM cargado, iniciando configuración del juego");
    
    // Obtener el canvas y su contexto
    canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        debug("ERROR: No se encontró el elemento canvas con ID 'gameCanvas'");
        alert("Error: No se pudo encontrar el canvas del juego");
        return;
    }
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        debug("ERROR: No se pudo obtener el contexto 2D del canvas");
        alert("Error: No se pudo obtener el contexto del canvas");
        return;
    }
    
    debug("Canvas encontrado y contexto obtenido correctamente");
    
    // Configurar tamaño del canvas
    canvas.width = game.width;
    canvas.height = game.height;
    
    // Cargar récord guardado
    game.highScore = parseInt(localStorage.getItem('geometryRunnerHighScore') || '0');
    
    // Verificar que los elementos necesarios existen
    const elementsToCheck = [
        { id: 'highScore', name: 'Récord' },
        { id: 'score', name: 'Puntuación' },
        { id: 'gameSpeed', name: 'Velocidad del juego' },
        { id: 'gameMenu', name: 'Menú del juego' },
        { id: 'gameOver', name: 'Pantalla de juego terminado' },
        { id: 'startGameBtn', name: 'Botón de inicio' },
        { id: 'restartGameBtn', name: 'Botón de reinicio' }
    ];
    
    let missingElements = false;
    elementsToCheck.forEach(element => {
        if (!elementExists(element.id, element.name)) {
            missingElements = true;
        }
    });
    
    if (missingElements) {
        debug("ERROR: Faltan elementos HTML necesarios para el juego. Verifica la estructura HTML.");
        alert("Error: Faltan elementos HTML necesarios para el juego");
        return;
    }
    
    // Actualizar elementos UI
    document.getElementById('highScore').textContent = game.highScore;
    
    // Inicializar audio
    initAudio();
    
    // Configurar controles
    try {
        debug("Configurando controles del juego");
        setupControls();
        debug("Controles configurados correctamente");
    } catch (error) {
        debug("ERROR al configurar controles:", error);
    }
    
    // Configurar botones del juego con mejor manejo de errores
    const startButton = document.getElementById('startGameBtn');
    startButton.addEventListener('click', function() {
        debug("Botón de inicio presionado");
        try {
            startGame();
        } catch (error) {
            debug("ERROR al iniciar el juego:", error);
            showNotification("Error al iniciar el juego. Consulta la consola para más detalles.", "error");
        }
    });
    
    const restartButton = document.getElementById('restartGameBtn');
    restartButton.addEventListener('click', function() {
        debug("Botón de reinicio presionado");
        try {
            startGame();
        } catch (error) {
            debug("ERROR al reiniciar el juego:", error);
            showNotification("Error al reiniciar el juego. Consulta la consola para más detalles.", "error");
        }
    });
    
    // Inicializar juego
    try {
        debug("Reiniciando juego para la inicialización");
        resetGame();
        debug("Juego reiniciado correctamente");
    } catch (error) {
        debug("ERROR al reiniciar el juego:", error);
    }
    
    // Dibujar pantalla de inicio
    try {
        debug("Dibujando pantalla inicial");
        drawInitialScreen();
        debug("Pantalla inicial dibujada correctamente");
    } catch (error) {
        debug("ERROR al dibujar la pantalla inicial:", error);
    }
    
    debug("Juego inicializado correctamente. Esperando que el usuario inicie el juego.");
    showNotification("Juego cargado correctamente. ¡Presiona Iniciar Juego para comenzar!", "success");
});

// Función para configurar los controles del juego
function setupControls() {
    // Control de teclado (barra espaciadora para saltar)
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space') {
            if (game.started && !game.over) {
                // Juego en curso, hacer saltar al jugador
                game.player.jump();
            }
        }
    });
    
    // Control táctil para dispositivos móviles
    canvas.addEventListener('touchstart', function(event) {
        event.preventDefault(); // Prevenir comportamiento por defecto
        if (game.started && !game.over) {
            game.player.jump();
        }
    });
    
    // Control de ratón para mayor accesibilidad
    canvas.addEventListener('mousedown', function() {
        if (game.started && !game.over) {
            game.player.jump();
        }
    });
}

// Función para dibujar la pantalla inicial
function drawInitialScreen() {
    // Fondo
    ctx.fillStyle = game.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dibujar algunas decoraciones
    game.decorations.forEach(decoration => decoration.draw());
    
    // Dibujar estrellas
    drawStars();
    
    // Dibujar suelo
    drawGround();
    
    // Dibujar jugador en posición inicial
    game.player.draw();
    
    // Instrucciones (opcional, ya que existe el menú del juego)
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Presiona el botón "Iniciar Juego" para comenzar', canvas.width / 2, canvas.height - 20);
}

// Función para dibujar las estrellas del fondo
function drawStars() {
    ctx.fillStyle = '#ffffff';
    game.stars.forEach(star => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Función para dibujar el suelo
function drawGround() {
    const groundY = game.height - game.groundHeight;
    
    // Dibujar superficie del suelo con estilo Impossible Dash
    ctx.fillStyle = '#111111'; // Negro para el suelo
    ctx.fillRect(0, groundY, game.width, game.groundHeight);
    
    // Dibujar línea de límite brillante
    ctx.fillStyle = '#ffffff'; // Blanco para la línea brillante
    ctx.fillRect(0, groundY, game.width, 2);
    
    // Dibujar líneas de cuadrícula en el suelo (estilo Impossible Dash)
    ctx.strokeStyle = '#333333'; // Gris oscuro para las líneas
    ctx.lineWidth = 1;
    
    // Líneas verticales
    for (let x = 0; x < game.width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, groundY);
        ctx.lineTo(x, game.height);
        ctx.stroke();
    }
    
    // Líneas horizontales
    for (let y = groundY + 25; y < game.height; y += 25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(game.width, y);
        ctx.stroke();
    }
}

// Función para inicializar el audio simplificada
function initAudio() {
    debug("Inicializando archivos de audio...");
    
    try {
        // Usar el elemento de audio HTML que ya está en la página
        game.audio.backgroundMusic = document.getElementById('backgroundMusic');
        
        // Agregar evento para reiniciar la música al terminar
        if (game.audio.backgroundMusic) {
            game.audio.backgroundMusic.addEventListener('ended', function() {
                debug("La música ha terminado, reiniciando reproducción...");
                this.currentTime = 0;
                this.play()
                    .catch(e => {
                        debug("Error al reiniciar música:", e);
                    });
            });
        }
        
        // Sonido de salto
        game.audio.jump = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-quick-jump-arcade-game-239.mp3');
        game.audio.jump.volume = 0.3;
        
        // Sonido de game over
        game.audio.gameOver = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-player-losing-or-failing-2042.mp3');
        game.audio.gameOver.volume = 0.5;
        
        // Sonido de moneda
        game.audio.coin = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-coin-collecting-sound-2004.mp3');
        game.audio.coin.volume = 0.3;
        
        debug("Audio inicializado correctamente");
    } catch (error) {
        debug("ERROR al inicializar el audio:", error);
    }
}

// Función para mostrar notificaciones
function showNotification(type, message) {
    const container = document.getElementById('notificationContainer');
    if (container) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Añadir icono según el tipo
        const icon = document.createElement('i');
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        notification.prepend(icon);
        
        container.appendChild(notification);
        
        // Efecto de desvanecimiento
        setTimeout(() => {
            notification.classList.add('hiding');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Función para actualizar el color de fondo
function updateBackgroundColor() {
    const currentTime = Date.now();
    
    // Cambiar color cada cierto tiempo
    if (currentTime - game.lastBgColorChangeTime > game.bgColorChangeInterval) {
        // Avanzar al siguiente color
        game.currentBgColorIndex = (game.currentBgColorIndex + 1) % game.backgroundColors.length;
        game.backgroundColor = game.backgroundColors[game.currentBgColorIndex];
        
        // Actualizar tiempo del último cambio
        game.lastBgColorChangeTime = currentTime;
        
        debug(`Color de fondo cambiado a: ${game.backgroundColor}`);
    }
}

// Clase Jugador
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = game.playerSize;
        this.height = game.playerSize;
        this.velocityY = 0;
        this.isJumping = false;
        this.jumpCount = 0;
        this.maxJumps = 1; // Por defecto, solo un salto
        this.invulnerable = true; // Invulnerable al inicio
        this.blinkCount = 0;
        this.rotation = 0; // Ángulo de rotación para el cubo
        this.borderRadius = 5; // Radio de los bordes redondeados
        this.colors = {
            main: '#ff5722', // Naranja
            border: '#e64a19', // Naranja más oscuro para el borde
            details: '#ffffff' // Blanco para detalles
        };
        
        // Dar invulnerabilidad temporal al inicio
        setTimeout(() => {
            this.invulnerable = false;
            console.log("Invulnerabilidad inicial del jugador terminada");
        }, 1000);
        
        console.log(`Jugador creado en posición (${x}, ${y})`);
    }
    
    update() {
        // Aplicar gravedad
        this.velocityY += game.gravity;
        this.y += this.velocityY;
        
        // Actualizar rotación cuando salta
        if (this.isJumping) {
            // Rotar el cubo cuando está en el aire
            this.rotation += 0.1;
        }
        
        // Comprobar si está en el suelo
        const groundY = game.height - game.groundHeight;
        if (this.y >= groundY - this.height) {
            this.y = groundY - this.height;
            this.velocityY = 0;
            this.isJumping = false;
            this.jumpCount = 0;
            
            // Asegurar que la rotación sea un múltiplo de 90 grados cuando aterriza
            this.rotation = Math.round(this.rotation / (Math.PI/2)) * (Math.PI/2);
        }
        
        // Actualizar contador de parpadeo para efecto visual de invulnerabilidad
        this.blinkCount += 0.1;
    }
    
    draw() {
        ctx.save();
        
        // Si es invulnerable, aplicar efecto de parpadeo
        if (this.invulnerable) {
            const alpha = Math.abs(Math.sin(this.blinkCount * 10)) * 0.5 + 0.5;
            ctx.globalAlpha = alpha;
        }
        
        // Transformar contexto para rotar el cubo
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rotation);
        
        // Dibujar jugador (un cubo con bordes redondeados estilo Impossible Dash)
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, this.borderRadius);
        ctx.fillStyle = this.colors.main;
        ctx.fill();
        
        // Borde
        ctx.strokeStyle = this.colors.border;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Detalles internos (líneas/patrones)
        ctx.fillStyle = this.colors.details;
        
        // Detalles del cubo (diseño de estilo Impossible Dash)
        // Patrón diagonal
        ctx.beginPath();
        ctx.moveTo(-this.width / 4, -this.height / 4);
        ctx.lineTo(this.width / 4, this.height / 4);
        ctx.strokeStyle = this.colors.details;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(this.width / 4, -this.height / 4);
        ctx.lineTo(-this.width / 4, this.height / 4);
        ctx.strokeStyle = this.colors.details;
        ctx.stroke();
        
        // Pequeño círculo en el centro
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 8, 0, Math.PI * 2);
        ctx.fillStyle = this.colors.details;
        ctx.fill();
        
        // Restaurar contexto
        ctx.restore();
    }
    
    jump() {
        // Solo saltar si no está saltando o si tiene saltos múltiples disponibles
        if (!this.isJumping || this.jumpCount < this.maxJumps) {
            this.velocityY = -game.jumpForce;
            this.isJumping = true;
            this.jumpCount++;
            
            // Reproducir sonido de salto
            if (game.audio.jump) {
                game.audio.jump.currentTime = 0;
                game.audio.jump.play()
                    .catch(e => console.warn("No se pudo reproducir el sonido de salto:", e));
            }
            
            // Crear partículas de salto
            this.createJumpParticles();
        }
    }
    
    createJumpParticles() {
        // Crear 5-10 partículas cuando el jugador salta
        const particleCount = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < particleCount; i++) {
            const particle = {
                x: this.x + this.width / 2,
                y: this.y + this.height,
                size: Math.random() * 5 + 2,
                color: '#ffffff',
                speedX: (Math.random() - 0.5) * 3,
                speedY: Math.random() * 2 + 1,
                life: 30 + Math.random() * 20
            };
            
            game.particles.push(particle);
        }
    }
    
    checkCollision(obstacle) {
        // Si el jugador es invulnerable, no hay colisión
        if (this.invulnerable) return false;
        
        // Comprobación de colisión básica
        return (
            this.x < obstacle.x + obstacle.width &&
            this.x + this.width > obstacle.x &&
            this.y < obstacle.y + obstacle.height &&
            this.y + this.height > obstacle.y
        );
    }
}

// Clase Obstáculo
class Obstacle {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type || 'spike'; // spike, block, platform
    }
    
    update() {
        // Mover a la izquierda según la velocidad del juego
        this.x -= game.speed;
    }
    
    draw() {
        if (this.type === 'spike') {
            // Dibujar un pico
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + this.height);
            ctx.lineTo(this.x + this.width / 2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.fill();
        } else if (this.type === 'block') {
            // Dibujar un bloque
            ctx.fillStyle = '#8e44ad';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        } else if (this.type === 'platform') {
            // Dibujar una plataforma
            ctx.fillStyle = '#27ae60';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

// Clase BuildingBlock (bloques con los que el jugador puede interactuar)
class BuildingBlock {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.width = size;
        this.height = size;
        this.color = '#3498db';
    }
    
    update() {
        // Mover a la izquierda según la velocidad del juego
        this.x -= game.speed;
    }
    
    draw() {
        // Dibujar un cubo
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Detalles del cubo
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(this.x + 5, this.y + 5, 5, 5);
        ctx.fillRect(this.x + this.width - 10, this.y + 5, 5, 5);
    }
    
    checkCollision(player) {
        // Comprobación de colisión
        return (
            player.x < this.x + this.width &&
            player.x + player.width > this.x &&
            player.y < this.y + this.height &&
            player.y + player.height > this.y
        );
    }
}

// Clase Saw (sierra que mata al jugador)
class Saw {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 40;
        this.rotation = 0;
    }
    
    update() {
        // Mover a la izquierda según la velocidad del juego
        this.x -= game.speed;
        
        // Rotar la sierra
        this.rotation += 0.1;
    }
    
    draw() {
        ctx.save();
        
        // Transformar contexto para rotar la sierra
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        
        // Dibujar sierra
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dientes de la sierra
        ctx.fillStyle = '#ff0000';
        for (let i = 0; i < 8; i++) {
            const angle = i * Math.PI / 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * this.size / 2, Math.sin(angle) * this.size / 2);
            ctx.lineTo(Math.cos(angle + 0.2) * this.size / 2, Math.sin(angle + 0.2) * this.size / 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    checkCollision(player) {
        // Si el jugador es invulnerable, no hay colisión
        if (player.invulnerable) return false;
        
        // Calcular distancia entre centros
        const dx = (this.x + this.size / 2) - (player.x + player.width / 2);
        const dy = (this.y + this.size / 2) - (player.y + player.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Colisión si la distancia es menor que la suma de los radios
        return distance < (this.size / 2 + player.width / 2 - 5); // -5 para tolerancia
    }
}

// Clase Decoration (elementos de fondo)
class Decoration {
    constructor(x, y, size, type) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.type = type; // mountain, cloud, etc.
    }
    
    update() {
        // Mover a la izquierda según la velocidad del juego
        // Las decoraciones se mueven más lento para efecto parallax
        this.x -= game.speed * (this.type === 'cloud' ? 0.2 : 0.5);
    }
    
    draw() {
        if (this.type === 'mountain') {
            // Dibujar montaña
            const groundY = game.height - game.groundHeight;
            ctx.fillStyle = '#6f4e37';
            ctx.beginPath();
            ctx.moveTo(this.x, groundY); // Asegurar que comienza en el suelo
            ctx.lineTo(this.x + this.size / 2, groundY - this.size / 1.5); // Pico de la montaña
            ctx.lineTo(this.x + this.size, groundY); // Termina en el suelo
            ctx.fill();
            
            // Nieve en la cima
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.moveTo(this.x + this.size / 2, groundY - this.size / 1.5); // Pico
            ctx.lineTo(this.x + this.size / 3, groundY - this.size / 2); // Punto izquierdo
            ctx.lineTo(this.x + 2 * this.size / 3, groundY - this.size / 2); // Punto derecho
            ctx.fill();
        } else if (this.type === 'cloud') {
            // Dibujar nube
            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 3, 0, Math.PI * 2);
            ctx.arc(this.x + this.size / 3, this.y + this.size / 3, this.size / 4, 0, Math.PI * 2);
            ctx.arc(this.x + 2 * this.size / 3, this.y + this.size / 3, this.size / 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// Clase Coin (monedas que el jugador puede recoger)
class Coin {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.rotation = 0;
        this.collected = false;
    }
    
    update() {
        // Mover a la izquierda según la velocidad del juego
        this.x -= game.speed;
        
        // Animar la moneda
        this.rotation += 0.05;
    }
    
    draw() {
        if (this.collected) return;
        
        ctx.save();
        
        // Transformar contexto para rotar la moneda
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        ctx.scale(Math.abs(Math.sin(this.rotation * 2)), 1); // Efecto 3D
        
        // Dibujar moneda
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Símbolo de la moneda
        ctx.fillStyle = '#ffaa00';
        ctx.beginPath();
        ctx.arc(0, 0, this.size / 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    checkCollision(player) {
        if (this.collected) return false;
        
        // Comprobación de colisión
        const collision = (
            player.x < this.x + this.size &&
            player.x + player.width > this.x &&
            player.y < this.y + this.size &&
            player.y + player.height > this.y
        );
        
        if (collision) {
            this.collected = true;
            
            // Reproducir sonido de moneda
            if (game.audio.coin) {
                game.audio.coin.currentTime = 0;
                game.audio.coin.play()
                    .catch(e => console.warn("No se pudo reproducir el sonido de moneda:", e));
            }
            
            // Incrementar puntuación
            game.score += 10;
            document.getElementById('score').textContent = game.score;
            
            // Crear partículas
            this.createCollectParticles();
        }
        
        return collision;
    }
    
    createCollectParticles() {
        // Crear partículas al recoger la moneda
        for (let i = 0; i < 10; i++) {
            const particle = {
                x: this.x + this.size / 2,
                y: this.y + this.size / 2,
                size: Math.random() * 4 + 2,
                color: '#ffd700',
                speedX: (Math.random() - 0.5) * 4,
                speedY: (Math.random() - 0.5) * 4,
                life: 30 + Math.random() * 20
            };
            
            game.particles.push(particle);
        }
    }
}

// Clase PowerUp (potenciadores para el jugador)
class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.size = 25;
        this.type = type || 'shield'; // shield, doubleJump, speedBoost, etc.
        this.collected = false;
    }
    
    update() {
        // Mover a la izquierda según la velocidad del juego
        this.x -= game.speed;
    }
    
    draw() {
        if (this.collected) return;
        
        ctx.save();
        
        // Dibujar fondo del power-up
        ctx.fillStyle = '#9b59b6';
        ctx.beginPath();
        ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Dibujar ícono según el tipo
        ctx.fillStyle = '#ffffff';
        
        if (this.type === 'shield') {
            // Escudo
            ctx.beginPath();
            ctx.arc(this.x + this.size / 2, this.y + this.size / 2, this.size / 3, 0, Math.PI * 2);
            ctx.stroke();
        } else if (this.type === 'doubleJump') {
            // Doble salto
            ctx.beginPath();
            ctx.moveTo(this.x + this.size / 4, this.y + this.size / 2);
            ctx.lineTo(this.x + 3 * this.size / 4, this.y + this.size / 2);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(this.x + this.size / 4, this.y + this.size / 3);
            ctx.lineTo(this.x + 3 * this.size / 4, this.y + this.size / 3);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    checkCollision(player) {
        if (this.collected) return false;
        
        // Comprobación de colisión
        const collision = (
            player.x < this.x + this.size &&
            player.x + player.width > this.x &&
            player.y < this.y + this.size &&
            player.y + player.height > this.y
        );
        
        if (collision) {
            this.collected = true;
            
            // Aplicar efecto según el tipo
            if (this.type === 'shield') {
                player.invulnerable = true;
                setTimeout(() => {
                    player.invulnerable = false;
                }, 5000); // 5 segundos de invulnerabilidad
            } else if (this.type === 'doubleJump') {
                player.maxJumps = 2;
                setTimeout(() => {
                    player.maxJumps = 1;
                }, 10000); // 10 segundos de doble salto
            }
            
            // Mostrar notificación
            showNotification(`¡Power-up recogido: ${this.type}!`, 'success');
            
            // Crear partículas
            this.createCollectParticles();
        }
        
        return collision;
    }
    
    createCollectParticles() {
        // Crear partículas al recoger el power-up
        for (let i = 0; i < 15; i++) {
            const particle = {
                x: this.x + this.size / 2,
                y: this.y + this.size / 2,
                size: Math.random() * 5 + 3,
                color: '#9b59b6',
                speedX: (Math.random() - 0.5) * 5,
                speedY: (Math.random() - 0.5) * 5,
                life: 40 + Math.random() * 20
            };
            
            game.particles.push(particle);
        }
    }
}

// Función para actualizar las partículas
function updateParticles() {
    // Actualizar partículas existentes
    for (let i = 0; i < game.particles.length; i++) {
        const particle = game.particles[i];
        
        // Mover partícula
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Reducir vida
        particle.life -= 1;
        
        // Remover partículas muertas
        if (particle.life <= 0) {
            game.particles.splice(i, 1);
            i--;
        }
    }
}

// Función para dibujar partículas
function drawParticles() {
    ctx.save();
    
    // Dibujar cada partícula
    for (const particle of game.particles) {
        // La opacidad se reduce con el tiempo
        const opacity = particle.life / 30;
        
        ctx.globalAlpha = opacity;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.restore();
}

// Función para aumentar la velocidad del juego con el tiempo
function increaseSpeed() {
    const currentTime = Date.now();
    
    // Aumentar la velocidad cada 10 segundos
    if (currentTime - game.lastSpeedIncreaseTime > game.speedIncreaseInterval) {
        game.speed += 0.2; // Aumento más notable
        game.obstacleFrequency += 0.001;
        
        // Limitar la velocidad y frecuencia máximas
        game.speed = Math.min(game.speed, 20); // Permitir mayor velocidad máxima
        game.obstacleFrequency = Math.min(game.obstacleFrequency, 0.05);
        
        // Actualizar UI
        const speedMultiplier = (game.speed / game.baseSpeed).toFixed(1);
        document.getElementById('gameSpeed').textContent = `${speedMultiplier}x`;
        
        // Mostrar notificación de aumento de velocidad
        showNotification(`¡Velocidad aumentada a ${speedMultiplier}x!`, "info");
        
        // Actualizar tiempo del último aumento
        game.lastSpeedIncreaseTime = currentTime;
        
        debug(`Velocidad aumentada a ${game.speed.toFixed(1)} (${speedMultiplier}x)`);
    }
}

// Función para crear monedas
function generateCoins() {
    // Generar monedas ocasionalmente
    if (Math.random() < game.spawnRate.coin) {
        const groundY = game.height - game.groundHeight;
        
        // Determinar posición vertical (altura)
        let y;
        const positionType = Math.random();
        
        if (positionType < 0.7) {
            // A media altura
            y = groundY - 80 - Math.random() * 100;
        } else {
            // Altura superior
            y = groundY - 200 - Math.random() * 50;
        }
        
        // Crear moneda
        game.coins.push(new Coin(game.width + 50, y));
    }
}

// Función para generar power-ups
function generatePowerUps() {
    // Generar power-ups muy ocasionalmente
    if (Math.random() < game.spawnRate.powerUp) {
        const groundY = game.height - game.groundHeight;
        
        // Determinar posición vertical (altura)
        const y = groundY - 100 - Math.random() * 100;
        
        // Determinar tipo de power-up
        const types = ['shield', 'doubleJump'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Crear power-up
        game.powerUps.push(new PowerUp(game.width + 50, y, type));
    }
}

// Función principal del bucle de juego
function gameLoop(timestamp) {
    // Calcular delta time para animaciones suaves
    const deltaTime = timestamp - (game.lastTime || timestamp);
    game.lastTime = timestamp;
    
    // Actualizar color de fondo periódicamente
    updateBackgroundColor();
    
    // Limpiar canvas con el color de fondo actual
    ctx.fillStyle = game.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Si el juego no está iniciado o está terminado, no actualizar
    if (!game.started || game.over) {
        return;
    }
    
    // Actualizar estrellas
    game.stars.forEach(star => {
        star.x -= star.speed;
        if (star.x < -star.size) {
            star.x = canvas.width + star.size;
            star.y = Math.random() * (game.height - game.groundHeight);
        }
    });
    
    // Dibujar estrellas
    drawStars();
    
    // Actualizar y dibujar decoraciones
    game.decorations.forEach(decoration => {
        decoration.update();
        decoration.draw();
        
        // Si la decoración sale de la pantalla, moverla al final
        if (decoration.x + decoration.size < 0) {
            decoration.x = game.width + Math.random() * 100;
        }
    });
    
    // Generar nuevos obstáculos
    generateObstacles();
    
    // Generar monedas
    generateCoins();
    
    // Generar power-ups
    generatePowerUps();
    
    // Aumentar la velocidad con el tiempo
    increaseSpeed();
    
    // Actualizar y dibujar obstáculos
    game.obstacles.forEach(obstacle => {
        obstacle.update();
        obstacle.draw();
    });
    
    // Actualizar y dibujar bloques
    game.buildingBlocks.forEach(block => {
        block.update();
        block.draw();
    });
    
    // Actualizar y dibujar sierras
    game.saws.forEach(saw => {
        saw.update();
        saw.draw();
    });
    
    // Actualizar y dibujar monedas
    game.coins.forEach(coin => {
        coin.update();
        coin.draw();
        
        // Verificar colisión con jugador
        coin.checkCollision(game.player);
    });
    
    // Actualizar y dibujar power-ups
    game.powerUps.forEach(powerUp => {
        powerUp.update();
        powerUp.draw();
        
        // Verificar colisión con jugador
        powerUp.checkCollision(game.player);
    });
    
    // Variable para rastrear si el jugador está sobre un bloque
    let playerOnBlock = false;
    
    // Comprobar colisiones con bloques
    game.buildingBlocks.forEach(block => {
        // Si el jugador está encima de un bloque
        if (block.checkCollision(game.player)) {
            const blockTop = block.y;
            const playerBottom = game.player.y + game.player.height;
            
            // Si el jugador está cayendo sobre el bloque
            if (game.player.velocityY > 0 && playerBottom - 10 < blockTop) {
                game.player.y = blockTop - game.player.height;
                game.player.velocityY = 0;
                game.player.isJumping = false;
                game.player.jumpCount = 0;
                playerOnBlock = true;
                
                // Efecto de partículas al aterrizar
                if (Math.random() < 0.5) {
                    // Crear partículas de polvo
                    for (let i = 0; i < 5; i++) {
                        game.particles.push({
                            x: game.player.x + Math.random() * game.player.width,
                            y: game.player.y + game.player.height,
                            size: Math.random() * 3 + 1,
                            color: '#cccccc',
                            speedX: (Math.random() - 0.5) * 2,
                            speedY: -Math.random() * 1,
                            life: 10 + Math.random() * 10
                        });
                    }
                }
            }
        }
    });
    
    // Actualizar jugador
    game.player.update();
    
    // Si el jugador no está sobre un bloque, aplicar gravedad normalmente
    if (!playerOnBlock) {
        // Comprobar colisiones con obstáculos
        for (const obstacle of game.obstacles) {
            // Para plataformas, permitir que el jugador se pare encima
            if (obstacle.type === 'platform') {
                const playerBottom = game.player.y + game.player.height;
                const platformTop = obstacle.y;
                
                // Si el jugador está cayendo sobre la plataforma
                if (game.player.velocityY > 0 && 
                    game.player.x + game.player.width > obstacle.x &&
                    game.player.x < obstacle.x + obstacle.width &&
                    playerBottom - 10 < platformTop &&
                    playerBottom + game.player.velocityY >= platformTop) {
                    
                    game.player.y = platformTop - game.player.height;
                    game.player.velocityY = 0;
                    game.player.isJumping = false;
                    game.player.jumpCount = 0;
                    playerOnBlock = true;
                }
            } 
            // Para otros obstáculos, comprobar colisión para fin de juego
            else if (game.player.checkCollision(obstacle)) {
                if (obstacle.type === 'spike' || obstacle.type === 'block') {
                    // Crear partículas de explosión
                    for (let i = 0; i < 20; i++) {
                        game.particles.push({
                            x: game.player.x + game.player.width / 2,
                            y: game.player.y + game.player.height / 2,
                            size: Math.random() * 5 + 2,
                            color: '#ff5722',
                            speedX: (Math.random() - 0.5) * 8,
                            speedY: (Math.random() - 0.5) * 8,
                            life: 30 + Math.random() * 20
                        });
                    }
                    
                    // Fin del juego
                    console.log("Colisión con obstáculo detectada. Fin del juego.");
                    gameOver();
                    return;
                }
            }
        }
    }
    
    // Comprobar colisiones con sierras
    for (const saw of game.saws) {
        if (saw.checkCollision(game.player)) {
            // Crear partículas de explosión
            for (let i = 0; i < 25; i++) {
                game.particles.push({
                    x: game.player.x + game.player.width / 2,
                    y: game.player.y + game.player.height / 2,
                    size: Math.random() * 6 + 2,
                    color: '#ff5722',
                    speedX: (Math.random() - 0.5) * 10,
                    speedY: (Math.random() - 0.5) * 10,
                    life: 40 + Math.random() * 20
                });
            }
            
            // Fin del juego
            console.log("Colisión con sierra detectada. Fin del juego.");
            gameOver();
            return;
        }
    }
    
    // Dibujar suelo
    drawGround();
    
    // Dibujar jugador
    game.player.draw();
    
    // Actualizar y dibujar partículas
    updateParticles();
    drawParticles();
    
    // Incrementar puntuación
    game.score += 1;
    document.getElementById('score').textContent = game.score;
    
    // Continuar el bucle de juego
    game.animationId = requestAnimationFrame(gameLoop);
}

// Función para fin de juego
function gameOver() {
    // Marcar el juego como terminado
    game.over = true;
    game.started = false;
    
    // Mostrar pantalla de fin de juego
    showGameOver();
}

function startGame() {
    debug("Iniciando juego...");
    
    try {
        // Detener cualquier animación en curso
        if (game.animationId) {
            cancelAnimationFrame(game.animationId);
            game.animationId = null;
            debug("Animación anterior cancelada");
        }
        
        // Ocultar menú y pantalla de juego terminado
        const gameMenu = document.getElementById('gameMenu');
        const gameOver = document.getElementById('gameOver');
        
        if (gameMenu) {
            gameMenu.style.display = 'none';
            debug("Menú del juego ocultado");
        } else {
            debug("ERROR: No se encontró el elemento 'gameMenu'");
        }
        
        if (gameOver) {
            gameOver.style.display = 'none';
            debug("Pantalla de juego terminado ocultada");
        } else {
            debug("ERROR: No se encontró el elemento 'gameOver'");
        }
        
        // Reiniciar juego
        resetGame();
        debug("Juego reiniciado correctamente");
        
        // Iniciar cuenta regresiva y luego comenzar el juego
        debug("Mostrando cuenta regresiva...");
        
        showStartingCountdown().then(() => {
            debug("Cuenta regresiva finalizada, iniciando juego...");
            
            // Establecer el estado del juego
            game.started = true;
            game.over = false;
            
            // Reproducir música directamente
            if (game.audio.backgroundMusic) {
                game.audio.backgroundMusic.currentTime = 0;
                game.audio.backgroundMusic.play()
                    .catch(e => {
                        debug("Error al reproducir música:", e);
                    });
            }
            
            // Iniciar bucle de juego
            debug("Iniciando bucle de juego...");
            game.lastSpeedIncreaseTime = Date.now(); // Reiniciar tiempo de aumento de velocidad
            game.animationId = requestAnimationFrame(gameLoop);
            
            debug("¡Juego iniciado correctamente!");
        }).catch(error => {
            debug("ERROR durante la cuenta regresiva:", error);
            showNotification("Error al iniciar el juego", "error");
        });
    } catch (error) {
        debug("ERROR crítico al iniciar el juego:", error);
        showNotification("Error crítico al iniciar el juego. Verifica la consola.", "error");
    }
}

// Función para mostrar una cuenta regresiva antes de iniciar
function showStartingCountdown() {
    console.log("Iniciando cuenta regresiva");
    
    // Crear contenedor principal para la cuenta regresiva
    const countdownContainer = document.createElement('div');
    countdownContainer.id = 'countdown-container';
    countdownContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 10;
        font-family: 'Arial', sans-serif;
    `;
    
    // Crear elemento para mostrar el número
    const countdownNumber = document.createElement('div');
    countdownNumber.style.cssText = `
        font-size: 100px;
        color: #fff;
        font-weight: bold;
        text-shadow: 0 0 10px #ff0000, 0 0 20px #ff0000;
        animation: pulse 0.5s infinite alternate;
    `;
    
    // Crear estilos para la animación
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            from { transform: scale(1); }
            to { transform: scale(1.2); }
        }
    `;
    document.head.appendChild(style);
    
    // Agregar el número al contenedor
    countdownContainer.appendChild(countdownNumber);
    
    // Encontrar el contenedor del juego
    const gameContainer = document.querySelector('.game-area-wrapper');
    if (gameContainer) {
        gameContainer.appendChild(countdownContainer);
    } else {
        document.body.appendChild(countdownContainer);
    }
    
    // Definir una promesa para la cuenta regresiva
    return new Promise((resolve) => {
        // Secuencia de cuenta regresiva
        let count = 3;
        
        countdownNumber.textContent = count.toString();
        
        const interval = setInterval(() => {
            count--;
            
            if (count > 0) {
                countdownNumber.textContent = count.toString();
            } else if (count === 0) {
                countdownNumber.textContent = "¡SALTA!";
                countdownNumber.style.fontSize = "80px";
            } else {
                clearInterval(interval);
                countdownContainer.remove();
                resolve();
            }
        }, 1000);
    });
}

function resetGame() {
    debug("Reseteando juego completamente...");
    
    // Asegurar que game.baseSpeed está definido
    if (typeof game.baseSpeed !== 'number' || isNaN(game.baseSpeed)) {
        debug("Advertencia: game.baseSpeed no está definido correctamente, usando valor por defecto 5");
        game.baseSpeed = 5;
    }
    
    // Detener animación si existe
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
        game.animationId = null;
    }
    
    // Resetear variables de juego
    game.speed = game.baseSpeed;
    game.obstacleFrequency = 0.01;
    game.obstacleLastX = game.width + 300; // Evitar obstáculos inmediatos
    game.score = 0;
    game.lastSpeedIncreaseTime = Date.now();
    game.lastBgColorChangeTime = Date.now(); // Inicializar tiempo de cambio de color
    game.currentBgColorIndex = 0; // Comenzar con el primer color
    game.backgroundColor = game.backgroundColors[0];
    game.obstacles = [];
    game.buildingBlocks = [];
    game.saws = [];
    game.particles = [];
    game.stars = [];
    game.decorations = [];
    game.coins = [];
    game.powerUps = [];
    game.started = false;
    game.over = false;
    
    // Actualizar UI con manejo de errores
    try {
        document.getElementById('score').textContent = game.score;
        document.getElementById('gameSpeed').textContent = '1x';
    } catch (error) {
        debug("ERROR al actualizar UI en resetGame:", error);
    }
    
    // Definir posición del suelo
    const groundY = game.height - game.groundHeight;
    
    // Crear jugador justo por encima del suelo
    try {
        game.player = new Player(100, groundY - game.playerSize - 5);
        debug(`Jugador posicionado en: (${game.player.x}, ${game.player.y})`);
    } catch (error) {
        debug("ERROR al crear jugador:", error);
    }
    
    // Crear estrellas de fondo
    try {
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * game.width;
            const y = Math.random() * (game.height - game.groundHeight);
            const size = Math.random() * 2 + 1;
            const speed = Math.random() * 0.5 + 0.1;
            game.stars.push({ x, y, size, speed });
        }
    } catch (error) {
        debug("ERROR al crear estrellas:", error);
    }
    
    // Crear algunas decoraciones iniciales
    try {
        // Montañas siempre en el suelo
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * game.width;
            const size = Math.random() * 200 + 100;
            // La y se maneja en el método draw para estar siempre al nivel del suelo
            game.decorations.push(new Decoration(x, 0, size, 'mountain'));
        }
        
        // Nubes aleatorias en el cielo
        for (let i = 0; i < 5; i++) {
            const x = Math.random() * game.width;
            const y = Math.random() * 150 + 50;
            const size = Math.random() * 60 + 30;
            game.decorations.push(new Decoration(x, y, size, 'cloud'));
        }
    } catch (error) {
        debug("ERROR al crear decoraciones:", error);
    }
}

function showGameOver() {
    console.log("Mostrando pantalla de juego terminado");
    
    // Detener música de fondo
    if (game.audio.backgroundMusic) {
        game.audio.backgroundMusic.pause();
    }
    
    // Reproducir sonido de game over
    if (game.audio.gameOver) {
        game.audio.gameOver.currentTime = 0;
        game.audio.gameOver.play()
            .catch(e => console.warn("No se pudo reproducir el sonido de fin de juego:", e));
    }
    
    // Detener la animación
    if (game.animationId) {
        cancelAnimationFrame(game.animationId);
        game.animationId = null;
    }
    
    // Actualizar récord si es necesario
    if (game.score > game.highScore) {
        game.highScore = game.score;
        localStorage.setItem('geometryRunnerHighScore', game.highScore);
        document.getElementById('highScore').textContent = game.highScore;
    }
    
    // Calcular y otorgar recompensa
    const reward = calculateReward(game.score);
    game.totalReward = reward;
    
    // Actualizar el balance solo si hay una recompensa
    if (reward > 0) {
        updateBalance(reward);
    }
    
    // Mostrar pantalla de juego terminado
    const gameOverScreen = document.getElementById('gameOver');
    const finalScoreElement = document.getElementById('finalScore');
    const finalHighScoreElement = document.getElementById('finalHighScore');
    const rewardAmountElement = document.getElementById('rewardAmount');
    
    if (gameOverScreen) {
        finalScoreElement.textContent = game.score;
        finalHighScoreElement.textContent = game.highScore;
        rewardAmountElement.textContent = reward.toFixed(8);
        gameOverScreen.style.display = 'flex';
        
        // Mostrar notificación con el resumen
        showNotification('info', `¡Juego terminado! Puntuación: ${game.score} - Recompensa: ${reward.toFixed(8)} USDC`);
    } else {
        console.error("No se encontró el elemento de pantalla de juego terminado");
    }
}

// Función para generar obstáculos
function generateObstacles() {
    // Verificar si el juego está activo
    if (!game.started) return;
    
    // Verificar los últimos obstáculos generados
    const lastObstacle = game.obstacles[game.obstacles.length - 1];
    const lastBuildingBlock = game.buildingBlocks[game.buildingBlocks.length - 1];
    const lastSaw = game.saws[game.saws.length - 1];
    
    // Calcular distancia mínima segura (aumenta con la velocidad)
    const minDistance = game.obstacleMinGap + game.speed * 15;
    const safeDistance = game.width / 2; // Mitad de la pantalla como mínimo
    
    // Verificar si es momento de generar un nuevo obstáculo
    const canGenerateObstacle = !lastObstacle || 
                               (game.width - (lastObstacle.x + lastObstacle.width) > Math.max(minDistance, safeDistance));
    
    if (canGenerateObstacle && Math.random() < game.obstacleFrequency) {
        const groundY = game.height - game.groundHeight;
        
        // Tipos de obstáculos y configuraciones
        const obstacleTypes = ['spike', 'block', 'platform'];
        const selectedType = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        
        let obstacleConfig;
        
        if (selectedType === 'spike') {
            // Picos de diferentes tamaños
            const height = Math.random() * 20 + 30;
            obstacleConfig = {
                x: game.width + 50, // Asegurar que comience fuera de la pantalla
                y: groundY - height,
                width: height / 2,
                height: height,
                type: 'spike'
            };
        } else if (selectedType === 'block') {
            // Bloques de diferentes tamaños
            const height = Math.random() * 30 + 30;
            const width = Math.random() * 20 + 30;
            obstacleConfig = {
                x: game.width + 50,
                y: groundY - height,
                width: width,
                height: height,
                type: 'block'
            };
        } else if (selectedType === 'platform') {
            // Plataformas flotantes
            const width = Math.random() * 100 + 50;
            const height = 20;
            const y = groundY - Math.random() * 150 - 50;
            obstacleConfig = {
                x: game.width + 50,
                y: y,
                width: width,
                height: height,
                type: 'platform'
            };
        }
        
        // Crear y añadir el obstáculo
        game.obstacles.push(new Obstacle(
            obstacleConfig.x,
            obstacleConfig.y,
            obstacleConfig.width,
            obstacleConfig.height,
            obstacleConfig.type
        ));
        
        // Ocasionalmente añadir decoraciones
        if (Math.random() < 0.2) {
            const decorX = game.width + Math.random() * 200;
            const decorSize = Math.random() * 200 + 100;
            // No necesitamos la y para montañas, se calculará en el método draw
            game.decorations.push(new Decoration(decorX, 0, decorSize, 'mountain'));
        }
        
        if (Math.random() < 0.1) {
            const decorX = game.width + Math.random() * 200;
            const decorY = Math.random() * 150 + 50;
            const decorSize = Math.random() * 60 + 30;
            game.decorations.push(new Decoration(decorX, decorY, decorSize, 'cloud'));
        }
    }
    
    // Verificar si es seguro generar un bloque
    const canGenerateBlock = !lastBuildingBlock || 
                           (game.width - (lastBuildingBlock.x + lastBuildingBlock.width) > safeDistance);
    
    // Generar bloques para construir plataformas
    if (canGenerateBlock && Math.random() < game.spawnRate.buildingBlock) {
        const groundY = game.height - game.groundHeight;
        
        // Determinar posición vertical
        let y;
        const positionType = Math.random();
        
        if (positionType < 0.6) {
            // En el suelo
            y = groundY - 40;
        } else if (positionType < 0.8) {
            // A media altura
            y = groundY - 120 - Math.random() * 30;
        } else {
            // Altura superior
            y = groundY - 200 - Math.random() * 50;
        }
        
        // A veces crear plataformas de varios bloques juntos
        const blockCount = Math.random() < 0.3 ? Math.floor(Math.random() * 3) + 2 : 1;
        
        for (let i = 0; i < blockCount; i++) {
            game.buildingBlocks.push(
                new BuildingBlock(
                    game.width + 50 + i * 40,
                    y,
                    40
                )
            );
        }
    }
    
    // Verificar si es seguro generar una sierra
    const canGenerateSaw = !lastSaw || 
                          (game.width - (lastSaw.x + lastSaw.size) > safeDistance);
    
    // Generar sierras
    if (canGenerateSaw && Math.random() < game.spawnRate.saw) {
        const groundY = game.height - game.groundHeight;
        
        // Determinar posición vertical
        let y;
        const positionType = Math.random();
        
        if (positionType < 0.5) {
            // En el suelo
            y = groundY - 50;
        } else if (positionType < 0.8) {
            // A media altura
            y = groundY - 120 - Math.random() * 50;
        } else {
            // Altura superior
            y = groundY - 220;
        }
        
        game.saws.push(new Saw(game.width + 50, y));
    }
    
    // Eliminar obstáculos que salieron de la pantalla
    game.obstacles = game.obstacles.filter(obstacle => obstacle.x + obstacle.width > -100);
    
    // Eliminar bloques que salieron de la pantalla
    game.buildingBlocks = game.buildingBlocks.filter(block => block.x + block.width > -100);
    
    // Eliminar sierras que salieron de la pantalla
    game.saws = game.saws.filter(saw => saw.x + saw.size > -100);
    
    // Eliminar decoraciones que salieron de la pantalla
    game.decorations = game.decorations.filter(decor => decor.x + decor.size > -100);
}

// Función para calcular la recompensa del jugador
function calculateReward(score) {
    // Base de recompensa: 1000 puntos = 0.0001 USDC
    const REWARD_RATE = 0.0001;
    const POINTS_PER_REWARD = 1000;
    
    // Calcular recompensa basada en la puntuación
    const reward = (score / POINTS_PER_REWARD) * REWARD_RATE;
    
    // Limitar la recompensa máxima a 0.005 USDC por partida
    const MAX_REWARD = 0.005;
    return Math.min(reward, MAX_REWARD);
}

// Función para actualizar el saldo del usuario
function updateBalance(amount) {
    try {
        // Verificar que la función modifyBalance esté disponible
        if (typeof window.modifyBalance !== 'function') {
            console.error('La función modifyBalance no está disponible');
            showNotification('error', 'Error: No se puede conectar con el sistema de recompensas. Por favor, recarga la página.');
            return 0;
        }
        
        // Usar la función global modifyBalance para actualizar el balance
        const newBalance = window.modifyBalance(amount);
        
        if (typeof newBalance !== 'number') {
            throw new Error('Error al actualizar el balance');
        }
        
        // Mostrar notificación de éxito
        showNotification('success', `¡Felicidades! Has ganado ${amount.toFixed(8)} USDC`);
        
        return newBalance;
    } catch (error) {
        console.error('Error al actualizar el balance:', error);
        showNotification('error', 'Error al procesar la recompensa: ' + error.message);
        return 0;
    }
}

// Añadir event listener global para asegurar que los botones funcionen
window.addEventListener('load', function() {
    debug("Window load event - Asegurando que los botones funcionen");
    
    // Botón de inicio con manejo directo
    const startGameBtn = document.getElementById('startGameBtn');
    if (startGameBtn) {
        debug("Añadiendo evento de clic al botón de inicio (fuera del DOMContentLoaded)");
        
        // Remover eventos previos para evitar duplicados
        const newBtn = startGameBtn.cloneNode(true);
        startGameBtn.parentNode.replaceChild(newBtn, startGameBtn);
        
        // Añadir nuevo evento
        newBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            debug("Botón de inicio clickeado (evento global)");
            showNotification("Iniciando juego...", "info");
            try {
                startGame();
            } catch (error) {
                debug("ERROR al iniciar el juego (desde evento global):", error);
                showNotification("Error al iniciar el juego. Consulta la consola.", "error");
            }
            return false;
        });
    } else {
        debug("ERROR: No se pudo encontrar el botón de inicio (en window.onload)");
    }
    
    // Botón de reinicio con manejo directo
    const restartGameBtn = document.getElementById('restartGameBtn');
    if (restartGameBtn) {
        debug("Añadiendo evento de clic al botón de reinicio (fuera del DOMContentLoaded)");
        
        // Remover eventos previos para evitar duplicados
        const newBtn = restartGameBtn.cloneNode(true);
        restartGameBtn.parentNode.replaceChild(newBtn, restartGameBtn);
        
        // Añadir nuevo evento
        newBtn.addEventListener('click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            debug("Botón de reinicio clickeado (evento global)");
            showNotification("Reiniciando juego...", "info");
            try {
                startGame();
            } catch (error) {
                debug("ERROR al reiniciar el juego (desde evento global):", error);
                showNotification("Error al reiniciar el juego. Consulta la consola.", "error");
            }
            return false;
        });
    } else {
        debug("ERROR: No se pudo encontrar el botón de reinicio (en window.onload)");
    }
});