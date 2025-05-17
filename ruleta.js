document.addEventListener('DOMContentLoaded', () => {
    // Configuración de la ruleta
    const prizes = [
        { text: '+50%\nMinería\n24h', icon: 'bolt', color: '#e43f5a', probability: 15 },
        { text: '+100%\nMinería\n12h', icon: 'rocket', color: '#ff5733', probability: 10 },
        { text: '+200%\nMinería\n6h', icon: 'fire', color: '#ff3366', probability: 5 },
        { text: 'Giro\nExtra', icon: 'redo', color: '#4CAF50', probability: 15 },
        { text: '-2h\nTiempo', icon: 'clock', color: '#2196F3', probability: 20 },
        { text: 'Bonus\nInstantáneo', icon: 'star', color: '#9C27B0', probability: 15 },
        { text: '+25%\nMinería\n24h', icon: 'tachometer-alt', color: '#795548', probability: 20 }
    ];

    // Referencias DOM
    const wheel = document.querySelector('.wheel');
    const wheelInner = document.querySelector('.wheel-inner');
    const spinButton = document.getElementById('spinButton');
    const spinsCount = document.getElementById('spinsCount');
    let isSpinning = false;

    // Crear segmentos de la ruleta
    const totalProbability = prizes.reduce((sum, prize) => sum + prize.probability, 0);
    let currentRotation = 0;

    prizes.forEach((prize, index) => {
        const segment = document.createElement('div');
        segment.className = 'wheel-segment';
        
        // Calcular el ángulo basado en la probabilidad
        const angle = (prize.probability / totalProbability) * 360;
        
        // Crear el clip-path para el segmento
        const startAngle = currentRotation;
        const endAngle = currentRotation + angle;
        
        // Aplicar transformación y fondo
        segment.style.transform = `rotate(${-startAngle}deg)`;
        segment.style.background = prize.color;
        
        const content = document.createElement('div');
        content.style.transform = `rotate(${startAngle + angle/2}deg)`;
        content.innerHTML = `
            <i class="fas fa-${prize.icon}"></i>
            <span>${prize.text}</span>
        `;
        
        segment.appendChild(content);
        wheelInner.appendChild(segment);
        
        currentRotation += angle;
    });

    // Función para mostrar notificación
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            ${message}
        `;
        
        const container = document.getElementById('notificationContainer');
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Función para aplicar el premio
    function applyPrize(prize) {
        let message = '';
        
        switch(prize.icon) {
            case 'bolt':
                message = '¡Has ganado un aumento del 50% en la tasa de minería por 24 horas!';
                // Aquí iría la lógica para aumentar la tasa de minería
                break;
            case 'rocket':
                message = '¡Has ganado un aumento del 100% en la tasa de minería por 12 horas!';
                break;
            case 'fire':
                message = '¡Has ganado un aumento del 200% en la tasa de minería por 6 horas!';
                break;
            case 'redo':
                message = '¡Has ganado un giro extra!';
                spinsCount.textContent = parseInt(spinsCount.textContent) + 1;
                break;
            case 'clock':
                message = '¡Has reducido el tiempo de minería en 2 horas!';
                break;
            case 'star':
                const bonus = (Math.random() * 0.0001 + 0.00005).toFixed(8);
                message = `¡Has ganado un bonus instantáneo de ${bonus} USDC!`;
                // Actualizar el balance
                const balanceElement = document.getElementById('balance');
                const currentBalance = parseFloat(balanceElement.textContent);
                balanceElement.textContent = (currentBalance + parseFloat(bonus)).toFixed(8);
                break;
            case 'tachometer-alt':
                message = '¡Has ganado un aumento del 25% en la tasa de minería por 24 horas!';
                break;
        }
        
        showNotification(message);
    }

    // Función para girar la ruleta
    function spinWheel() {
        if (isSpinning) return;
        
        const spins = parseInt(spinsCount.textContent);
        if (spins <= 0) {
            showNotification('No tienes giros disponibles', 'error');
            return;
        }
        
        isSpinning = true;
        spinButton.disabled = true;
        spinsCount.textContent = spins - 1;
        
        // Calcular resultado basado en probabilidades
        const random = Math.random() * totalProbability;
        let accumulator = 0;
        let selectedPrize;
        
        for (const prize of prizes) {
            accumulator += prize.probability;
            if (random <= accumulator) {
                selectedPrize = prize;
                break;
            }
        }
        
        // Calcular rotación final
        const extraSpins = 5; // Número de vueltas completas
        const prizeIndex = prizes.indexOf(selectedPrize);
        let prizeAngle = 0;
        
        for (let i = 0; i < prizeIndex; i++) {
            prizeAngle += (prizes[i].probability / totalProbability) * 360;
        }
        prizeAngle += (selectedPrize.probability / totalProbability) * 180; // Mitad del segmento
        
        const finalRotation = 360 * extraSpins + prizeAngle;
        
        // Aplicar animación
        wheel.style.transition = 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
        wheel.style.transform = `rotate(${finalRotation}deg)`;
        
        // Sonido de giro (opcional)
        // const spinSound = new Audio('spin-sound.mp3');
        // spinSound.play();
        
        // Esperar a que termine la animación
        setTimeout(() => {
            isSpinning = false;
            spinButton.disabled = false;
            applyPrize(selectedPrize);
        }, 5000);
    }

    // Event listeners
    spinButton.addEventListener('click', spinWheel);

    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const container = document.querySelector('.wheel-container');

    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        container.classList.toggle('sidebar-active');
    });
}); 