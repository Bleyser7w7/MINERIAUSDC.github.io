document.addEventListener("DOMContentLoaded", function() {
    // Configuración de minado
    const MINING_CONFIG = {
        duration: 300000, // 5 minutos en milisegundos
        rates: {
            perHour: 0.00002500,
            perMinute: 0.00002500 / 60,
            perSecond: 0.00002500 / 3600
        },
        rewards: {
            minMultiplier: 0.8,
            maxMultiplier: 1.2,
            streakBonusPerDay: 0.05 // 5% extra por día
        }
    };

    // Estado del minado
    let miningState = {
        isActive: false,
        interval: null,
        streak: 0
    };

    // Elementos del DOM
    const elements = {
        mineButton: document.getElementById("mineButton"),
        totalMined: document.getElementById("totalMined"),
        balance: document.getElementById("balance"),
        ratePerSecond: document.getElementById("ratePerSecond"),
        ratePerMinute: document.getElementById("ratePerMinute"),
        ratePerHour: document.getElementById("ratePerHour"),
        notificationContainer: document.getElementById("notificationContainer"),
        sidebarToggle: document.getElementById("sidebarToggle"),
        sidebar: document.querySelector(".sidebar"),
        miningContainer: document.querySelector(".mining-container"),
        sidebarProfileImage: document.getElementById('sidebarProfileImage'),
        sidebarUsername: document.getElementById('sidebarUsername'),
        logoutBtn: document.getElementById('logoutBtn')
    };

    // Verificar autenticación
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
            return;
    }

    // Inicializar UI
    function initializeUI() {
        // Actualizar perfil
        if (elements.sidebarProfileImage) {
            elements.sidebarProfileImage.src = currentUser.profileImage || 'default-avatar.png';
        }
        if (elements.sidebarUsername) {
            elements.sidebarUsername.textContent = currentUser.username;
        }
        if (elements.balance) {
            elements.balance.textContent = (currentUser.balance || 0).toFixed(8);
        }
        if (elements.totalMined) {
            elements.totalMined.textContent = (currentUser.totalMined || 0).toFixed(8);
        }

        // Actualizar tasas de minado
        if (elements.ratePerHour) {
            elements.ratePerHour.textContent = MINING_CONFIG.rates.perHour.toFixed(8);
        }
        if (elements.ratePerMinute) {
            elements.ratePerMinute.textContent = MINING_CONFIG.rates.perMinute.toFixed(10);
        }
        if (elements.ratePerSecond) {
            elements.ratePerSecond.textContent = MINING_CONFIG.rates.perSecond.toFixed(10);
        }
    }

    // Función para mostrar notificaciones
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        elements.notificationContainer.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    // Función para actualizar el balance
    function updateBalance(amount) {
        // Usar la función global modifyBalance con el flag isFromMining
        window.modifyBalance(amount, true);
    }

    // Función para manejar la racha de minado
    function updateMiningStreak() {
        const now = new Date();
        const lastMining = currentUser.lastMiningDate ? new Date(currentUser.lastMiningDate) : null;
        
        if (lastMining) {
            const hoursSinceLastMining = (now - lastMining) / (1000 * 60 * 60);
            currentUser.miningStreak = hoursSinceLastMining <= 24 ? 
                (currentUser.miningStreak || 0) + 1 : 1;
        } else {
            currentUser.miningStreak = 1;
        }

        currentUser.lastMiningDate = now.toISOString();
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }

    // Función para calcular recompensa
    function calculateMiningReward() {
        const baseReward = MINING_CONFIG.rates.perHour / 12; // Recompensa base por 5 minutos
        const randomMultiplier = Math.random() * 
            (MINING_CONFIG.rewards.maxMultiplier - MINING_CONFIG.rewards.minMultiplier) + 
            MINING_CONFIG.rewards.minMultiplier;
        const streakBonus = Math.min(currentUser.miningStreak || 1, 7) * 
            MINING_CONFIG.rewards.streakBonusPerDay;
        
        return baseReward * (1 + streakBonus) * randomMultiplier;
    }

    // Función para actualizar el texto del botón
    function updateMiningButtonText(timeLeft) {
        const minutes = Math.floor(timeLeft / 60000);
        const seconds = Math.floor((timeLeft % 60000) / 1000);
        elements.mineButton.innerHTML = 
            `<i class="fas fa-hammer"></i> Minando... ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Función para iniciar el minado
    function startMining() {
        if (miningState.isActive) return;

        miningState.isActive = true;
        elements.mineButton.classList.add('mining');
        const startTime = Date.now();
        let lastUpdateTime = startTime;

        showNotification('¡Comenzando proceso de minado! Duración: 5 minutos', 'info');

        miningState.interval = setInterval(() => {
            const currentTime = Date.now();
            const timeLeft = MINING_CONFIG.duration - (currentTime - startTime);
            
            // Calcular y actualizar la ganancia por segundo
            const secondsElapsed = (currentTime - lastUpdateTime) / 1000;
            const rewardPerSecond = MINING_CONFIG.rates.perSecond;
            const currentReward = rewardPerSecond * secondsElapsed;
            
            if (currentReward > 0) {
                updateBalance(currentReward);
                lastUpdateTime = currentTime;
            }

            if (timeLeft <= 0) {
                finishMining();
            } else {
                updateMiningButtonText(timeLeft);
            }
        }, 1000);
    }

    // Función para finalizar el minado
    function finishMining() {
        clearInterval(miningState.interval);
        updateMiningStreak();
        
        elements.mineButton.innerHTML = '<i class="fas fa-hammer"></i> Minar';
        elements.mineButton.classList.remove('mining');
        miningState.isActive = false;
        
        showNotification('¡Minado completado!', 'success');
    }

    // Event Listeners
    if (elements.mineButton) {
        elements.mineButton.addEventListener('click', startMining);
    }

    // Funcionalidad de la barra lateral
    function toggleSidebar() {
        elements.sidebar.classList.toggle("active");
        elements.miningContainer.classList.toggle("sidebar-active");
        const icon = elements.sidebarToggle.querySelector("i");
        icon.classList.toggle("fa-bars");
        icon.classList.toggle("fa-times");
    }

    // Event listener para el botón de la barra lateral
    elements.sidebarToggle.addEventListener("click", function(e) {
        e.stopPropagation();
        toggleSidebar();
    });

    // Cerrar la barra lateral al hacer clic fuera
    document.addEventListener("click", function(event) {
        const isMobile = window.innerWidth <= 768;
        const clickedOutsideSidebar = !elements.sidebar.contains(event.target);
        const clickedOutsideToggle = !elements.sidebarToggle.contains(event.target);
        
        if (isMobile && clickedOutsideSidebar && clickedOutsideToggle && elements.sidebar.classList.contains("active")) {
            toggleSidebar();
        }
    });

    // Prevenir que los clics dentro de la barra lateral la cierren
    elements.sidebar.addEventListener("click", function(e) {
        e.stopPropagation();
    });

    // Manejar cierre de sesión
    elements.logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });

    // Inicializar la UI
    initializeUI();
});
