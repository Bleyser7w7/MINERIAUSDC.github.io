document.addEventListener('DOMContentLoaded', function() {
    const withdrawalForm = document.getElementById('withdrawalForm');
    const withdrawalAmountInput = document.getElementById('withdrawalAmount');
    const walletAddressInput = document.getElementById('walletAddress');
    
    // Inicializar el historial si no existe
    if (!localStorage.getItem('withdrawalHistory')) {
        localStorage.setItem('withdrawalHistory', JSON.stringify([]));
    }

    // Cargar historial de retiros
    function loadWithdrawalHistory() {
        const withdrawalHistory = document.getElementById('withdrawalHistory');
        const history = JSON.parse(localStorage.getItem('withdrawalHistory') || '[]');
        
        withdrawalHistory.innerHTML = history.map(item => `
            <tr>
                <td>${item.date}</td>
                <td>${item.amount} USDC</td>
                <td>${formatWalletAddress(item.wallet)}</td>
                <td><span class="status-badge status-${item.status}">${item.status}</span></td>
            </tr>
        `).join('');
    }

    // Formatear dirección de wallet
    function formatWalletAddress(address) {
        if (address.length > 12) {
            return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
        }
        return address;
    }

    // Mostrar notificaciones
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        const container = document.getElementById('notificationContainer');
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }, 100);
    }

    // Manejar el envío del formulario
    withdrawalForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const amount = parseFloat(withdrawalAmountInput.value);
        const wallet = walletAddressInput.value.trim();
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const currentBalance = currentUser ? parseFloat(currentUser.balance) : 0;

        // Validaciones
        if (amount < 1) {
            showNotification('El monto mínimo de retiro es 1 USDC', 'error');
            return;
        }

        if (amount > currentBalance) {
            showNotification('Saldo insuficiente', 'error');
            return;
        }

        // Procesar el retiro
        const history = JSON.parse(localStorage.getItem('withdrawalHistory') || '[]');
        history.unshift({
            date: new Date().toLocaleDateString(),
            amount: amount.toFixed(8),
            wallet: wallet,
            status: 'pending'
        });
        
        localStorage.setItem('withdrawalHistory', JSON.stringify(history));
        
        // Actualizar balance usando la función global
        window.modifyBalance(-amount);
        
        // Actualizar historial
        loadWithdrawalHistory();
        
        showNotification('Solicitud de retiro enviada correctamente');
        withdrawalForm.reset();
    });

    // Inicializar la página
    loadWithdrawalHistory();
});