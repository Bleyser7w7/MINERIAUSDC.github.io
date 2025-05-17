document.addEventListener('DOMContentLoaded', function() {
    // Elementos del DOM
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const currentScoreElement = document.getElementById('current-score');
    const bestScoreElement = document.getElementById('best-score');
    const startButton = document.getElementById('startButton');
    const pauseButton = document.getElementById('pauseButton');

    // Verificar que todos los elementos existen
    if (!canvas || !startButton || !pauseButton || !currentScoreElement || !bestScoreElement) {
        console.error('No se pudieron encontrar todos los elementos necesarios');
        return;
    }

    // Configuración del juego
    canvas.width = 800;  // Duplicamos el ancho
    canvas.height = 1200; // Duplicamos el alto
    const GAME_WIDTH = canvas.width;
    const GAME_HEIGHT = canvas.height;
    const GRAVITY = 0.8;  // Ajustamos la gravedad para el nuevo tamaño
    const JUMP_FORCE = -15;  // Ajustamos la fuerza de salto
    const PIPE_SPEED = 4;  // Ajustamos la velocidad de las tuberías
    const PIPE_SPAWN_INTERVAL = 2000;
    const PIPE_GAP = 300;  // Ajustamos el espacio entre tuberías
    const PIPE_WIDTH = 120;  // Ajustamos el ancho de las tuberías
    const GROUND_HEIGHT = 200;  // Ajustamos la altura del suelo

    // Verificar que el canvas se haya creado correctamente
    console.log('Canvas dimensions:', canvas.width, canvas.height);
    console.log('Canvas context:', ctx !== null);

    // Estado del juego
    let gameRunning = false;
    let gamePaused = false;
    let score = 0;
    let highScore = parseInt(localStorage.getItem('flappyHighScore') || '0');
    let lastRewardScore = 0;
    let balance = parseFloat(localStorage.getItem('userBalance') || '0');

    // Objetos del juego
    let bird = {
        x: GAME_WIDTH / 4,
        y: GAME_HEIGHT / 2,
        velocity: 0,
        width: 80,  // Ajustamos el tamaño del pájaro
        height: 60,
        rotation: 0
    };

    let pipes = [];
    let lastPipeSpawn = 0;

    // Cargar imágenes localmente
    const images = {
        background: new Image(),
        bird: new Image(),
        pipe: new Image()
    };

    // Cargar sonido
    const sounds = {
        tuberia: new Audio('sonidotuberia.mp3')
    };

    // Función para cargar una imagen
    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Error loading image: ${src}`));
            img.src = src;
        });
    }

    // Cargar todas las imágenes antes de iniciar el juego
    Promise.all([
        loadImage('fondoflappy.png'),
        loadImage('pajaro.png'),
        loadImage('tuberia.png')
    ]).then(([bgImg, birdImg, pipeImg]) => {
        images.background = bgImg;
        images.bird = birdImg;
        images.pipe = pipeImg;
        console.log('Todas las imágenes cargadas correctamente');
        
        // Iniciar el juego una vez que las imágenes estén cargadas
        draw();
    }).catch(error => {
        console.error('Error al cargar las imágenes:', error);
        // Usar colores sólidos como fallback
        draw();
    });

    function createPipe() {
        const minGapStart = 100;
        const maxGapStart = GAME_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 100;
        const gapStart = Math.random() * (maxGapStart - minGapStart) + minGapStart;
        
        return {
            x: GAME_WIDTH,
            gapY: gapStart,
            passed: false
        };
    }

    function jump() {
        bird.velocity = JUMP_FORCE;
        bird.rotation = -30;
    }

    function updateBird() {
        bird.velocity += GRAVITY;
        bird.y += bird.velocity;
        bird.rotation = Math.min(90, Math.max(-30, bird.rotation + bird.velocity * 2));

        // Colisiones con el suelo y el techo
        if (bird.y + bird.height > GAME_HEIGHT - GROUND_HEIGHT || bird.y < 0) {
            gameOver();
        }
    }

    function updatePipes() {
        const currentTime = Date.now();
        
        // Generar nuevos tubos
        if (currentTime - lastPipeSpawn > PIPE_SPAWN_INTERVAL) {
            pipes.push(createPipe());
            lastPipeSpawn = currentTime;
        }

        // Mover y eliminar tubos
        pipes = pipes.filter(pipe => {
            pipe.x -= PIPE_SPEED;
            
            // Verificar colisiones
            if (bird.x + bird.width > pipe.x && 
                bird.x < pipe.x + PIPE_WIDTH) {
                if (bird.y < pipe.gapY || 
                    bird.y + bird.height > pipe.gapY + PIPE_GAP) {
                    gameOver();
                }
            }

            // Puntuación y sonido
            if (!pipe.passed && pipe.x < bird.x) {
                pipe.passed = true;
                score++;
                // Reproducir sonido
                try {
                    sounds.tuberia.currentTime = 0; // Reiniciar el sonido si ya estaba reproduciéndose
                    sounds.tuberia.play().catch(error => console.error('Error al reproducir sonido:', error));
                } catch (error) {
                    console.error('Error al manipular el sonido:', error);
                }
                updateScore();
            }

            return pipe.x > -PIPE_WIDTH;
        });
    }

    function drawBackground() {
        try {
            if (images.background.complete && images.background.naturalHeight !== 0) {
                // Usar mejor calidad de renderizado
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(images.background, 0, 0, GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
            } else {
                ctx.fillStyle = '#87CEEB';
                ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT - GROUND_HEIGHT);
            }

            const grassGradient = ctx.createLinearGradient(0, GAME_HEIGHT - GROUND_HEIGHT, 0, GAME_HEIGHT);
            grassGradient.addColorStop(0, '#90EE90');
            grassGradient.addColorStop(1, '#228B22');

            ctx.fillStyle = grassGradient;
            ctx.fillRect(0, GAME_HEIGHT - GROUND_HEIGHT, GAME_WIDTH, GROUND_HEIGHT);

            // Mejoramos el detalle del césped
            ctx.fillStyle = '#228B22';
            for (let i = 0; i < GAME_WIDTH; i += 30) {
                ctx.beginPath();
                ctx.moveTo(i, GAME_HEIGHT - GROUND_HEIGHT);
                ctx.lineTo(i + 15, GAME_HEIGHT - GROUND_HEIGHT - 20);
                ctx.lineTo(i + 30, GAME_HEIGHT - GROUND_HEIGHT);
                ctx.fill();
            }
        } catch (error) {
            console.error('Error al dibujar el fondo:', error);
        }
    }

    function drawBird() {
        try {
            ctx.save();
            ctx.translate(bird.x + bird.width/2, bird.y + bird.height/2);
            ctx.rotate(bird.rotation * Math.PI / 180);
            
            if (images.bird.complete && images.bird.naturalHeight !== 0) {
                ctx.drawImage(
                    images.bird,
                    -bird.width/2,
                    -bird.height/2,
                    bird.width,
                    bird.height
                );
            } else {
                ctx.fillStyle = '#ff5733';
                ctx.beginPath();
                ctx.arc(0, 0, bird.width/2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        } catch (error) {
            console.error('Error al dibujar el pájaro:', error);
        }
    }

    function drawPipes() {
        try {
            pipes.forEach(pipe => {
                if (images.pipe.complete && images.pipe.naturalHeight !== 0) {
                    ctx.save();
                    ctx.translate(pipe.x + PIPE_WIDTH, pipe.gapY);
                    ctx.rotate(Math.PI);
                    ctx.drawImage(
                        images.pipe,
                        0,
                        0,
                        PIPE_WIDTH,
                        pipe.gapY
                    );
                    ctx.restore();
                    
                    ctx.drawImage(
                        images.pipe,
                        pipe.x,
                        pipe.gapY + PIPE_GAP,
                        PIPE_WIDTH,
                        GAME_HEIGHT - (pipe.gapY + PIPE_GAP) - GROUND_HEIGHT
                    );
                } else {
                    ctx.fillStyle = '#1e88e5';
                    ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
                    ctx.fillRect(pipe.x, pipe.gapY + PIPE_GAP, PIPE_WIDTH, GAME_HEIGHT - (pipe.gapY + PIPE_GAP) - GROUND_HEIGHT);
                }
            });
        } catch (error) {
            console.error('Error al dibujar las tuberías:', error);
        }
    }

    function drawScore() {
        ctx.fillStyle = '#ffffff';
        ctx.font = '48px Arial';  // Aumentamos el tamaño de la fuente
        ctx.textAlign = 'center';
        ctx.fillText(score, GAME_WIDTH/2, 80);
    }

    function draw() {
        if (!ctx) {
            console.error('No se pudo obtener el contexto del canvas');
            return;
        }

        // Limpiar canvas
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Dibujar elementos
        drawBackground();
        drawPipes();
        drawBird();
        drawScore();

        // Debug: dibujar un borde para ver los límites del canvas
        ctx.strokeStyle = '#ff0000';
        ctx.strokeRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Si el juego no está corriendo, mostrar mensaje de fin de juego
        if (!gameRunning && !gamePaused) {
            // Fondo semi-transparente
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

            // Título
            ctx.fillStyle = '#00ff00';
            ctx.font = 'bold 30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('¡Juego Terminado!', GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);

            // Puntuación
            ctx.fillStyle = '#ffffff';
            ctx.font = '20px Arial';
            ctx.fillText(`Puntuación: ${score}`, GAME_WIDTH / 2, GAME_HEIGHT / 2);

            // Recompensa
            const rewardAmount = Math.floor(score / 10) * 0.0001;
            ctx.fillText(`Recompensa: ${rewardAmount.toFixed(4)} USDC`, GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30);

            // Instrucción para reiniciar
            ctx.font = '16px Arial';
            ctx.fillText('Presiona "Reiniciar" para jugar de nuevo', GAME_WIDTH / 2, GAME_HEIGHT / 2 + 70);
        }

        // Solicitar el siguiente frame si el juego está corriendo
        if (gameRunning && !gamePaused) {
            requestAnimationFrame(draw);
        }
    }

    function update() {
        if (!gameRunning || gamePaused) return;

        updateBird();
        updatePipes();
        draw();
        requestAnimationFrame(update);
    }

    function updateScore() {
        currentScoreElement.textContent = score;
        
        // Actualizar high score
        if (score > highScore) {
            highScore = score;
            bestScoreElement.textContent = highScore;
            localStorage.setItem('flappyHighScore', highScore);
        }

        // Sistema de recompensas
        // Se otorga 0.0001 USDC por cada 10 puntos
        const rewardThreshold = 10;
        const rewardAmount = 0.0001;

        if (score >= lastRewardScore + rewardThreshold) {
            const rewardsEarned = Math.floor((score - lastRewardScore) / rewardThreshold);
            const totalReward = rewardsEarned * rewardAmount;

            // Usar la función centralizada para actualizar el balance
            window.modifyBalance(totalReward);

            // Actualizar último puntaje recompensado
            lastRewardScore = Math.floor(score / rewardThreshold) * rewardThreshold;

            // Registrar recompensa
            const rewardHistory = JSON.parse(localStorage.getItem('rewardHistory') || '[]');
            rewardHistory.push({
                game: 'Flappy Bird',
                amount: totalReward,
                score: score,
                date: new Date().toISOString()
            });
            localStorage.setItem('rewardHistory', JSON.stringify(rewardHistory));

            // Mostrar notificación
            showRewardNotification(totalReward);
        }
    }

    function showRewardNotification(amount) {
        const notification = document.createElement('div');
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.backgroundColor = '#00c853';
        notification.style.color = 'white';
        notification.style.padding = '15px 20px';
        notification.style.borderRadius = '8px';
        notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
        notification.style.zIndex = '9999';
        notification.textContent = `¡Has ganado ${amount.toFixed(8)} USDC!`;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    function startGame() {
        if (!gameRunning) {
            resetGame();
            gameRunning = true;
            gamePaused = false;
            update();
            startButton.textContent = 'Reiniciar';
            pauseButton.disabled = false;
        } else {
            resetGame();
        }
    }

    function pauseGame() {
        if (!gameRunning) return;
        
        gamePaused = !gamePaused;
        
        if (!gamePaused) {
            update();
            pauseButton.textContent = 'Pausar';
        } else {
            pauseButton.textContent = 'Reanudar';
            
            // Dibujar mensaje de pausa
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
            
            ctx.font = '20px Arial';
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSA', GAME_WIDTH / 2, GAME_HEIGHT / 2);
        }
    }

    function resetGame() {
        bird.y = GAME_HEIGHT / 2;
        bird.velocity = 0;
        bird.rotation = 0;
        pipes = [];
        score = 0;
        lastPipeSpawn = Date.now();
        lastRewardScore = 0;
        updateScore();
        pauseButton.textContent = 'Pausar';
        pauseButton.disabled = false;
        draw();
    }

    function gameOver() {
        gameRunning = false;
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('flappyHighScore', highScore);
        }
        
        // Calcular recompensa
        const rewardAmount = Math.floor(score / 10) * 0.0001;
        
        // Usar la función centralizada para actualizar el balance
        window.modifyBalance(rewardAmount);

        // Registrar recompensa en el historial
        const rewardHistory = JSON.parse(localStorage.getItem('rewardHistory') || '[]');
        rewardHistory.push({
            game: 'Flappy Bird',
            amount: rewardAmount,
            score: score,
            date: new Date().toISOString()
        });
        localStorage.setItem('rewardHistory', JSON.stringify(rewardHistory));

        // Mostrar notificación
        showRewardNotification(rewardAmount);
    }

    // Event Listeners
    startButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
    
    // Añadir soporte para mouse
    canvas.addEventListener('click', function(event) {
        if (gameRunning && !gamePaused) {
            event.preventDefault();
            jump();
        }
    });
    
    // Añadir soporte para teclado
    document.addEventListener('keydown', function(event) {
        if (event.code === 'Space' && gameRunning && !gamePaused) {
            event.preventDefault();
            jump();
        }
    });
    
    // Añadir soporte para pantallas táctiles
    canvas.addEventListener('touchstart', function(event) {
        if (gameRunning && !gamePaused) {
            event.preventDefault();
            jump();
        }
    }, { passive: false });

    // Dibujar pantalla inicial
    console.log('Initial canvas size:', canvas.width, 'x', canvas.height);
    draw();
}); 