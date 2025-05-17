document.addEventListener('DOMContentLoaded', function() {
    // Agregar estilos para las notificaciones mejoradas
    const notificationStyles = document.createElement('style');
    notificationStyles.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 15px;
            background-color: #000000;
            color: white;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
            opacity: 0;
            transform: translateY(50px);
            transition: opacity 0.5s, transform 0.5s;
            min-width: 320px;
            max-width: 450px;
            z-index: 9999;
        }
        
        .notification.show {
            opacity: 1;
            transform: translateY(0);
        }
        
        .notification.fade-out {
            opacity: 0;
            transform: translateY(50px);
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .notification-icon {
            font-size: 24px;
            margin-right: 15px;
            color: #00ff7f;
        }
        
        .notification-message {
            font-weight: bold;
            font-size: 18px;
            line-height: 1.4;
            flex-grow: 1;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
            letter-spacing: 0.5px;
        }
        
        .notification-progress {
            height: 6px;
            background-color: #00ff7f;
            border-radius: 3px;
            width: 100%;
        }
        
        .notification.success {
            border-left: 8px solid #00ff7f;
        }
        
        .notification.error {
            border-left: 8px solid #ff3b30;
        }
        
        .notification.error .notification-icon {
            color: #ff3b30;
        }
        
        .notification.error .notification-progress {
            background-color: #ff3b30;
        }
    `;
    document.head.appendChild(notificationStyles);
    
    // Lista de tareas disponibles
    const tasks = [
        {
            id: 1,
            title: "Ver Video Promocional (30s)",
            description: "Mira un video de 30 segundos para ganar una recompensa",
            icon: "fas fa-play-circle",
            reward: 0.001000,
            requirements: ["Ver el video completo", "No cambiar de pestaña durante la reproducción"],
            timeRequired: "30 segundos",
            type: "daily",
            className: "task-video-promo",
            videoUrl: "https://www.youtube.com/embed/x8aogOzak10?si=gquorAdcGfvqUoNn",
            videoDuration: 30
        },
        {
            id: 2,
            title: "Ver Video Promocional (1min)",
            description: "Mira un video de 1 minuto para ganar una mayor recompensa",
            icon: "fas fa-play-circle",
            reward: 0.01,
            requirements: ["Ver el video completo", "No cambiar de pestaña durante la reproducción"],
            timeRequired: "1 minuto",
            type: "daily",
            className: "task-video-promo-long",
            videoUrl: "https://www.youtube.com/embed/jNQXAC9IVRw",
            videoDuration: 60
        },
        {
            id: 3,
            title: "Seguir en Instagram",
            description: "Síguenos en Instagram para recibir recompensa",
            icon: "fab fa-instagram",
            reward: 0.0199,
            requirements: ["Seguir nuestra cuenta oficial", "Mantener el seguimiento por 7 días"],
            timeRequired: "1 minuto",
            type: "social",
            className: "task-instagram",
            socialUrl: "https://www.instagram.com/lbleyser7w7l/"
        },
        {
            id: 4,
            title: "Seguir en Twitter",
            description: "Síguenos en Twitter para recibir recompensa",
            icon: "fab fa-twitter",
            reward: 0.0199,
            requirements: ["Seguir nuestra cuenta oficial", "Dar RT a un post específico"],
            timeRequired: "1 minuto",
            type: "social",
            className: "task-twitter",
            socialUrl: "https://twitter.com/tu_cuenta_twitter"
        },
        {
            id: 5,
            title: "Unirse a Telegram",
            description: "Únete a nuestro canal de Telegram",
            icon: "fab fa-telegram",
            reward: 0.0199,
            requirements: ["Unirse al canal oficial", "Permanecer por al menos 7 días"],
            timeRequired: "1 minuto",
            type: "social",
            className: "task-telegram",
            socialUrl: "https://t.me/tu_canal_telegram"
        },
        {
            id: 6,
            title: "Seguir en TikTok",
            description: "Síguenos en TikTok para recibir recompensa",
            icon: "fab fa-tiktok",
            reward: 0.0199,
            requirements: ["Seguir nuestra cuenta oficial", "Dar like a un video"],
            timeRequired: "1 minuto",
            type: "social",
            className: "task-tiktok",
            socialUrl: "https://www.tiktok.com/@tu_cuenta_tiktok"
        },
        {
            id: 7,
            title: "Seguir en Facebook",
            description: "Síguenos en Facebook para recibir recompensa",
            icon: "fab fa-facebook",
            reward: 0.0199,
            requirements: ["Dar like a nuestra página", "Compartir un post"],
            timeRequired: "1 minuto",
            type: "social",
            className: "task-facebook",
            socialUrl: "https://www.facebook.com/tu_pagina_facebook"
        },
        {
            id: 8,
            title: "Suscribirse en YouTube",
            description: "Suscríbete a nuestro canal de YouTube",
            icon: "fab fa-youtube",
            reward: 0.0199,
            requirements: ["Suscribirse al canal", "Activar notificaciones"],
            timeRequired: "1 minuto",
            type: "social",
            className: "task-youtube",
            socialUrl: "https://www.youtube.com/c/tu_canal_youtube"
        },
        {
            id: 9,
            title: "Desafío Semanal",
            description: "Completa una serie de videos promocionales para obtener una recompensa mayor",
            icon: "fas fa-star",
            reward: 0.39,
            requirements: [
                "Ver 5 videos completos",
                "Completar en un plazo de 7 días",
                "No saltar ningún video"
            ],
            timeRequired: "15 minutos total",
            type: "weekly",
            className: "task-weekly",
            videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ"
        }
    ];
    
    // Cargar tareas en la grid
    function loadTasks(filter = 'all') {
        const tasksGrid = document.getElementById('tasksGrid');
        
        // Filtrar tareas según la categoría seleccionada
        let filteredTasks = tasks;
        if (filter !== 'all') {
            filteredTasks = tasks.filter(task => task.type === filter);
        }
        
        tasksGrid.innerHTML = filteredTasks.map(task => `
            <div class="task-card ${task.className}" data-task-id="${task.id}" data-task-type="${task.type}">
                <div class="task-badge badge-${task.type}">
                    ${getBadgeText(task.type)}
                </div>
                <div class="task-header">
                    <div class="task-icon">
                        <i class="${task.icon}"></i>
                    </div>
                    <div class="task-info">
                        <h3>${task.title}</h3>
                        <div class="task-reward">${task.reward.toFixed(8)} USDC</div>
                    </div>
                </div>
                <p class="task-description">${task.description}</p>
                <div class="task-progress">
                    <div class="progress-bar"></div>
                </div>
            </div>
        `).join('');

        // Añadir event listeners a las tarjetas
        document.querySelectorAll('.task-card').forEach(card => {
            card.addEventListener('click', () => openTaskModal(card.dataset.taskId));
        });
    }

    // Devolver texto para los badges
    function getBadgeText(type) {
        switch(type) {
            case 'daily':
                return 'Diaria';
            case 'social':
                return 'Red Social';
            case 'weekly':
                return 'Semanal';
            default:
                return '';
        }
    }

    // Abrir modal de tarea
    function openTaskModal(taskId) {
        const task = tasks.find(t => t.id === parseInt(taskId));
        if (!task) return; // Verificación para evitar errores
        
        const modal = document.getElementById('taskModal');
        const modalTitle = document.getElementById('modalTaskTitle');
        const modalReward = document.getElementById('modalTaskReward');
        const modalDescription = document.getElementById('modalTaskDescription');
        const modalRequirements = document.getElementById('modalTaskRequirements');
        const startTaskBtn = document.getElementById('startTaskBtn');

        // Configurar el botón según el tipo de tarea
        if (task.videoDuration) {
            startTaskBtn.disabled = false;
            startTaskBtn.innerHTML = '<i class="fas fa-play"></i> Iniciar Video';
            startTaskBtn.setAttribute('data-action', 'start-video');
        } else {
            startTaskBtn.disabled = false;
            startTaskBtn.innerHTML = '<i class="fas fa-play"></i> Comenzar Tarea';
            startTaskBtn.setAttribute('data-action', 'complete-task');
        }

        modalTitle.textContent = task.title;
        modalReward.textContent = `Recompensa: ${task.reward.toFixed(8)} USDC`;
        modalDescription.textContent = task.description;
        
        // Crear el contenedor para el enlace a red social si no existe
        let socialLinkContainer = document.getElementById('socialLinkContainer');
        if (!socialLinkContainer) {
            socialLinkContainer = document.createElement('div');
            socialLinkContainer.id = 'socialLinkContainer';
            socialLinkContainer.className = 'social-link-container';
            modalRequirements.parentNode.insertBefore(socialLinkContainer, modalRequirements);
        }
        
        // Crear el contenedor para el video si no existe
        let videoContainer = document.getElementById('videoContainer');
        if (!videoContainer) {
            videoContainer = document.createElement('div');
            videoContainer.id = 'videoContainer';
            videoContainer.className = 'video-container';
            modalRequirements.parentNode.insertBefore(videoContainer, modalRequirements);
        }
        
        // Mostrar enlace a red social si existe
        if (task.socialUrl) {
            socialLinkContainer.innerHTML = `
                <a href="${task.socialUrl}" target="_blank" class="social-link-button">
                    <i class="${task.icon}"></i>
                    <span>Ir a ${task.title}</span>
                </a>
                <p class="social-hint">Haz clic en el botón para abrir en una nueva pestaña</p>
            `;
            socialLinkContainer.style.display = 'block';
            videoContainer.style.display = 'none';
        } else if (task.videoUrl) {
            // Mostrar video si existe
            videoContainer.innerHTML = `
                <div class="video-wrapper">
                    <iframe id="videoFrame" width="100%" height="250" src="" 
                    data-video-url="${task.videoUrl}" frameborder="0" allowfullscreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
                    ${task.videoDuration ? `
                    <div class="video-timer" id="videoTimer" style="display: none;">
                        <i class="fas fa-hourglass-half"></i>
                        <span id="countdown">${task.videoDuration}</span> segundos restantes
                    </div>
                    <div class="video-complete" id="videoComplete" style="display: none;">
                        <i class="fas fa-check-circle"></i>
                        ¡Video completado! Puedes reclamar tu recompensa.
                    </div>
                    ` : ''}
                </div>
            `;
            videoContainer.style.display = 'block';
            socialLinkContainer.style.display = 'none';
        } else {
            socialLinkContainer.style.display = 'none';
            videoContainer.style.display = 'none';
        }
        
        modalRequirements.innerHTML = `
            <h4>Requisitos:</h4>
            <ul>
                ${task.requirements.map(req => `
                    <li class="requirement-item">
                        <i class="fas fa-check-circle"></i>
                        ${req}
                    </li>
                `).join('')}
            </ul>
            <p><i class="fas fa-clock"></i> Tiempo requerido: ${task.timeRequired}</p>
        `;

        // Asignar el id de tarea al botón
        startTaskBtn.setAttribute('data-task-id', task.id);
        
        modal.style.display = 'flex';
    }

    // Filtrar por categoría
    document.querySelectorAll('.category').forEach(category => {
        category.addEventListener('click', function() {
            // Remover la clase activa de todas las categorías
            document.querySelectorAll('.category').forEach(cat => cat.classList.remove('active'));
            
            // Añadir la clase activa a la categoría seleccionada
            this.classList.add('active');
            
            // Cargar las tareas filtradas
            loadTasks(this.dataset.category);
        });
    });

    // Cerrar modal
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            const modal = document.getElementById('taskModal');
            
            // Limpiar el intervalo si existe
            const intervalId = modal.getAttribute('data-interval');
            if (intervalId) {
                clearInterval(parseInt(intervalId));
                modal.removeAttribute('data-interval');
            }
            
            modal.style.display = 'none';
        });
    }

    // Cerrar modal al hacer clic fuera
    window.addEventListener('click', (e) => {
        const modal = document.getElementById('taskModal');
        if (e.target === modal) {
            // Limpiar el intervalo si existe
            const intervalId = modal.getAttribute('data-interval');
            if (intervalId) {
                clearInterval(parseInt(intervalId));
                modal.removeAttribute('data-interval');
            }
            
            modal.style.display = 'none';
        }
    });

    // Comenzar tarea
    const startTaskBtn = document.getElementById('startTaskBtn');
    if (startTaskBtn) {
        startTaskBtn.addEventListener('click', function() {
            const taskId = parseInt(this.getAttribute('data-task-id'));
            const action = this.getAttribute('data-action');
            
            if (action === 'start-video') {
                // Iniciar el contador de video
                startVideoCountdown(taskId);
                return;
            } else if (action === 'complete-task') {
                // Completar la tarea normalmente
                completeTask(taskId);
                
                // Limpiar el intervalo si existe
                const modal = document.getElementById('taskModal');
                const intervalId = modal.getAttribute('data-interval');
                if (intervalId) {
                    clearInterval(parseInt(intervalId));
                    modal.removeAttribute('data-interval');
                }
                
                modal.style.display = 'none';
            }
        });
    }

    // Función para iniciar el contador de video
    function startVideoCountdown(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (!task || !task.videoDuration) return;
        
        const startTaskBtn = document.getElementById('startTaskBtn');
        const videoTimerElement = document.getElementById('videoTimer');
        const videoCompleteElement = document.getElementById('videoComplete');
        const countdownElement = document.getElementById('countdown');
        const modal = document.getElementById('taskModal');
        const videoFrame = document.getElementById('videoFrame');
        
        // Iniciar la reproducción del video
        if (videoFrame) {
            const videoUrl = videoFrame.getAttribute('data-video-url');
            // Agregar parámetros para forzar la reproducción
            let autoplayUrl = videoUrl;
            
            // Eliminar cualquier parámetro existente si/si= para evitar duplicados
            autoplayUrl = autoplayUrl.replace(/\?si=.*?(&|$)/, '?').replace(/&si=.*?(&|$)/, '&');
            
            // Añadir parámetros necesarios para reproducción automática
            if (autoplayUrl.includes('?')) {
                autoplayUrl += '&autoplay=1&enablejsapi=1&mute=0';
            } else {
                autoplayUrl += '?autoplay=1&enablejsapi=1&mute=0';
            }
            
            console.log("URL de video con autoplay:", autoplayUrl);
            
            // Reemplazar el iframe existente con uno nuevo para asegurar que se carga correctamente
            const videoContainer = document.querySelector('.video-wrapper');
            if (videoContainer) {
                const newIframe = document.createElement('iframe');
                newIframe.id = 'videoFrame';
                newIframe.width = '100%';
                newIframe.height = '250';
                newIframe.src = autoplayUrl;
                newIframe.frameBorder = '0';
                newIframe.allowFullscreen = true;
                newIframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                
                // Reemplazar el iframe existente
                const oldIframe = videoContainer.querySelector('iframe');
                if (oldIframe) {
                    videoContainer.replaceChild(newIframe, oldIframe);
                }
            }
        }
        
        // Mostrar el timer
        videoTimerElement.style.display = 'block';
        
        // Desactivar el botón mientras se reproduce el video
        startTaskBtn.disabled = true;
        startTaskBtn.innerHTML = '<i class="fas fa-clock"></i> Esperando a que termine el video...';
        
        // Configurar el contador
        let timeLeft = task.videoDuration;
        
        // Crear un intervalo para actualizar el contador
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = timeLeft;
            
            // Actualizar el progreso en la barra
            const progressPercentage = 100 - ((timeLeft / task.videoDuration) * 100);
            document.querySelector(`[data-task-id="${task.id}"] .progress-bar`).style.width = `${progressPercentage}%`;
            
            if (timeLeft <= 0) {
                clearInterval(countdownInterval);
                videoTimerElement.style.display = 'none';
                videoCompleteElement.style.display = 'block';
                startTaskBtn.disabled = false;
                startTaskBtn.innerHTML = '<i class="fas fa-check"></i> Reclamar Recompensa';
                startTaskBtn.setAttribute('data-action', 'complete-task');
            }
        }, 1000);
        
        // Guardar el intervalo en el modal para poder limpiarlo al cerrar
        modal.setAttribute('data-interval', countdownInterval);
    }

    // Completar tarea específica o aleatoria
    function completeTask(specificTaskId = null) {
        // Usar tarea específica o aleatoria
        const task = specificTaskId 
            ? tasks.find(t => t.id === specificTaskId) 
            : tasks[Math.floor(Math.random() * tasks.length)];
            
        if (!task) return;
        
        // Guardar en completadas
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');
        completedTasks.unshift({
            id: task.id,
            title: task.title,
            reward: task.reward,
            date: new Date().toLocaleDateString(),
            icon: task.icon
        });
        
        localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
        
        // Actualizar balance
        let balance = parseFloat(localStorage.getItem('userBalance') || '0');
        balance += task.reward;
        localStorage.setItem('userBalance', balance.toFixed(8));
        
        // Actualizar balance en la UI
        const balanceElement = document.getElementById('balance');
        if (balanceElement) {
            balanceElement.textContent = balance.toFixed(8);
        }
        
        // Mostrar notificación más destacada con el título de la tarea
        showNotification(`¡RECOMPENSA OBTENIDA! ${task.title}: +${task.reward.toFixed(8)} USDC`);
        
        // Recargar tareas completadas
        loadCompletedTasks();
    }

    // Mostrar notificaciones
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        // Eliminar notificaciones anteriores para evitar acumulación
        const oldNotifications = container.querySelectorAll('.notification');
        oldNotifications.forEach(notification => notification.remove());
        
        // Formatear el mensaje para separar la recompensa en una línea aparte
        let formattedMessage = message;
        if (message.includes('+')) {
            // Extraer la parte de recompensa
            const parts = message.split('+');
            const titlePart = parts[0].replace(':', ''); // Primera parte del mensaje
            const rewardPart = '+' + parts[1]; // Parte de la recompensa
            
            // Formatear con HTML para mejor visibilidad
            formattedMessage = `
                <div>${titlePart}</div>
                <div style="font-size: 22px; color: #5cefb5; margin-top: 5px; font-weight: bold;">${rewardPart}</div>
            `;
        }
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-trophy notification-icon"></i>
                <span class="notification-message">${formattedMessage}</span>
            </div>
            <div class="notification-progress"></div>
        `;
        
        container.appendChild(notification);
        
        // Mostrar inmediatamente con un efecto
        setTimeout(() => notification.classList.add('show'), 10);
        
        // Iniciar la barra de progreso
        const progressBar = notification.querySelector('.notification-progress');
        progressBar.style.width = '100%';
        progressBar.style.transition = 'width 15000ms linear';
        
        // Emitir un sonido de notificación si es posible
        try {
            const audio = new Audio('./assets/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch(e => console.log('No se pudo reproducir el sonido:', e));
        } catch (e) {
            console.log('Audio no soportado:', e);
        }
        
        setTimeout(() => {
            progressBar.style.width = '0%';
        }, 100);
        
        // Remover después de 15 segundos
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 1000);
        }, 15000);
    }

    // Cargar tareas completadas
    function loadCompletedTasks() {
        const completedTasksList = document.getElementById('completedTasksList');
        if (!completedTasksList) return;
        
        const completedTasks = JSON.parse(localStorage.getItem('completedTasks') || '[]');

        if (completedTasks.length === 0) {
            completedTasksList.innerHTML = '<p class="no-tasks">No has completado ninguna tarea aún.</p>';
            return;
        }

        completedTasksList.innerHTML = completedTasks.map(task => `
            <div class="completed-task-item">
                <div class="completed-task-info">
                    <div class="completed-task-icon">
                        <i class="${task.icon || 'fas fa-check'}"></i>
                    </div>
                    <span>${task.title}</span>
                </div>
                <span class="completed-task-reward">+${task.reward.toFixed(8)} USDC</span>
            </div>
        `).join('');
    }

    // Inicializar
    loadTasks();
    loadCompletedTasks();
});