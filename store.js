/**
 * Funcionalidad para la tienda de MIMERUSDC
 */

document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos DOM
    const categoryButtons = document.querySelectorAll('.category-btn');
    const productCards = document.querySelectorAll('.product-card');
    const buyButtons = document.querySelectorAll('.buy-button');
    const modal = document.getElementById('purchaseModal');
    const closeModal = document.querySelector('.close-modal');
    const cancelPurchase = document.getElementById('cancelPurchase');
    const confirmPurchase = document.getElementById('confirmPurchase');
    const modalProductName = document.getElementById('modalProductName');
    const modalProductPrice = document.getElementById('modalProductPrice');
    
    // Catálogo de productos
    const products = {
        booster1: {
            name: 'Booster 2x Minado',
            price: 0.0005,
            description: 'Duplica tu velocidad de minado durante 24 horas',
            type: 'booster',
            duration: 86400000 // 24 horas en ms
        },
        booster2: {
            name: 'Booster 5x Minado',
            price: 0.001,
            description: 'Quintuplica tu velocidad de minado durante 12 horas',
            type: 'booster',
            duration: 43200000 // 12 horas en ms
        },
        skin1: {
            name: 'Skin Minero de Oro',
            price: 0.002,
            description: 'Personaliza tu perfil con este exclusivo diseño dorado',
            type: 'skin',
            image: 'images/skin1.png'
        },
        skin2: {
            name: 'Skin Minero Neón',
            price: 0.0015,
            description: 'Un estilo futurista para destacar entre los mineros',
            type: 'skin',
            image: 'images/skin2.png'
        },
        vip1: {
            name: 'Membresía Plata',
            price: 0.005,
            description: '+10% en todas tus ganancias durante 1 mes',
            type: 'vip',
            multiplier: 1.1,
            duration: 2592000000 // 30 días en ms
        },
        vip2: {
            name: 'Membresía Oro',
            price: 0.01,
            description: '+25% en todas tus ganancias durante 1 mes',
            type: 'vip',
            multiplier: 1.25,
            duration: 2592000000 // 30 días en ms
        }
    };
    
    let selectedProduct = null;
    
    /**
     * Filtrado por categorías
     */
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Marcar botón activo
            categoryButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const category = btn.dataset.category;
            
            // Mostrar/ocultar productos según categoría
            productCards.forEach(card => {
                if (category === 'all' || card.dataset.category === category) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
    
    /**
     * Proceso de compra
     */
    buyButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const productId = btn.dataset.id;
            const product = products[productId];
            
            if (!product) {
                mostrarNotificacion('Producto no encontrado', 'error');
                return;
            }
            
            // Verificar si el usuario tiene saldo suficiente
            const currentBalance = parseFloat(localStorage.getItem('balance') || '0');
            
            if (currentBalance < product.price) {
                mostrarNotificacion('Saldo insuficiente para realizar esta compra', 'error');
                return;
            }
            
            // Configurar modal
            selectedProduct = productId;
            modalProductName.textContent = product.name;
            modalProductPrice.textContent = product.price;
            
            // Mostrar modal
            modal.classList.add('show');
            setTimeout(() => {
                modal.querySelector('.modal-content').style.opacity = '1';
                modal.querySelector('.modal-content').style.transform = 'translateY(0)';
            }, 10);
        });
    });
    
    /**
     * Cerrar modal
     */
    function closeModalHandler() {
        modal.querySelector('.modal-content').style.opacity = '0';
        modal.querySelector('.modal-content').style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            modal.classList.remove('show');
            selectedProduct = null;
        }, 300);
    }
    
    closeModal.addEventListener('click', closeModalHandler);
    cancelPurchase.addEventListener('click', closeModalHandler);
    
    // Cerrar al hacer clic fuera del modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeModalHandler();
        }
    });
    
    /**
     * Confirmar compra
     */
    confirmPurchase.addEventListener('click', () => {
        if (!selectedProduct || !products[selectedProduct]) {
            mostrarNotificacion('Error al procesar la compra', 'error');
            closeModalHandler();
            return;
        }
        
        const product = products[selectedProduct];
        const currentBalance = parseFloat(localStorage.getItem('balance') || '0');
        
        // Verificar saldo nuevamente
        if (currentBalance < product.price) {
            mostrarNotificacion('Saldo insuficiente para realizar esta compra', 'error');
            closeModalHandler();
            return;
        }
        
        // Actualizar saldo
        const newBalance = (currentBalance - product.price).toFixed(8);
        localStorage.setItem('balance', newBalance);
        document.getElementById('balance').textContent = newBalance;
        
        // Aplicar efecto según tipo de producto
        switch (product.type) {
            case 'booster':
                aplicarBooster(product);
                break;
                
            case 'skin':
                aplicarSkin(product);
                break;
                
            case 'vip':
                aplicarMembresiaVIP(product);
                break;
        }
        
        // Registrar en historial
        registrarCompra(product);
        
        // Cerrar modal
        closeModalHandler();
        
        // Mostrar notificación
        mostrarNotificacion(`¡Has comprado ${product.name} con éxito!`, 'success');
    });
    
    /**
     * Aplicar un booster de minado
     */
    function aplicarBooster(product) {
        const boosterEndTime = Date.now() + product.duration;
        const currentMultiplier = parseFloat(localStorage.getItem('miningMultiplier') || '1');
        
        // Si ya hay un booster, tomar el valor mayor
        const newMultiplier = product.name.includes('2x') ? 2 : 5;
        const finalMultiplier = Math.max(currentMultiplier, newMultiplier);
        
        localStorage.setItem('miningMultiplier', finalMultiplier.toString());
        localStorage.setItem('boosterEndTime', boosterEndTime.toString());
        
        console.log(`Booster aplicado: x${finalMultiplier} hasta ${new Date(boosterEndTime).toLocaleString()}`);
    }
    
    /**
     * Aplicar un skin al perfil
     */
    function aplicarSkin(product) {
        // Guardar la imagen del skin como imagen de perfil
        localStorage.setItem('profileImage', product.image);
        document.getElementById('sidebarProfileImage').src = product.image;
        
        // Guardar en inventario
        let inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
        inventory.push({
            type: 'skin',
            name: product.name,
            image: product.image,
            purchaseDate: Date.now()
        });
        localStorage.setItem('inventory', JSON.stringify(inventory));
    }
    
    /**
     * Aplicar membresía VIP
     */
    function aplicarMembresiaVIP(product) {
        const vipEndTime = Date.now() + product.duration;
        localStorage.setItem('vipMultiplier', product.multiplier.toString());
        localStorage.setItem('vipEndTime', vipEndTime.toString());
        localStorage.setItem('vipType', product.name);
        
        console.log(`Membresía VIP aplicada: ${product.name} (x${product.multiplier}) hasta ${new Date(vipEndTime).toLocaleString()}`);
    }
    
    /**
     * Registrar la compra en el historial
     */
    function registrarCompra(product) {
        let historial = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
        historial.push({
            type: 'purchase',
            item: product.name,
            price: product.price,
            date: Date.now()
        });
        localStorage.setItem('transactionHistory', JSON.stringify(historial));
    }
    
    /**
     * Mostrar notificación
     */
    function mostrarNotificacion(mensaje, tipo = 'info') {
        const container = document.getElementById('notificationContainer');
        
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `notification ${tipo}`;
        
        let icon = 'info-circle';
        if (tipo === 'success') icon = 'check-circle';
        if (tipo === 'error') icon = 'exclamation-circle';
        
        notification.innerHTML = `<i class="fas fa-${icon}"></i> ${mensaje}`;
        
        // Añadir al contenedor
        container.appendChild(notification);
        
        // Animar entrada
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Remover después de un tiempo
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Comprobar si hay un booster o membresía activa y mostrar indicador
     */
    function verificarBoostersActivos() {
        const now = Date.now();
        const boosterEndTime = parseInt(localStorage.getItem('boosterEndTime') || '0');
        const vipEndTime = parseInt(localStorage.getItem('vipEndTime') || '0');
        
        // Verificar booster
        if (boosterEndTime > now) {
            const multiplier = localStorage.getItem('miningMultiplier');
            mostrarNotificacion(`Tienes un booster x${multiplier} activo`, 'info');
        }
        
        // Verificar VIP
        if (vipEndTime > now) {
            const vipType = localStorage.getItem('vipType');
            mostrarNotificacion(`Membresía ${vipType} activa`, 'info');
        }
    }
    
    // Verificar boosters al cargar la página
    verificarBoostersActivos();
}); 