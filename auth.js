document.addEventListener("DOMContentLoaded", function() {
    // Función para actualizar el balance en toda la aplicación
    function updateBalance() {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) return;

        // Actualizar todos los elementos de balance
        const balanceElements = document.querySelectorAll("#balance");
        const formattedBalance = currentUser.balance.toFixed(8);
        balanceElements.forEach(element => {
            element.textContent = formattedBalance;
        });

        // Actualizar elementos de total minado
        const totalMinedElements = document.querySelectorAll("#totalMined");
        if (totalMinedElements.length > 0 && currentUser.totalMined !== undefined) {
            const formattedTotalMined = currentUser.totalMined.toFixed(8);
            totalMinedElements.forEach(element => {
                element.textContent = formattedTotalMined;
            });
        }

        // Actualizar en el array de usuarios
        const users = JSON.parse(localStorage.getItem("users") || "[]");
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex].balance = currentUser.balance;
            users[userIndex].totalMined = currentUser.totalMined;
            localStorage.setItem("users", JSON.stringify(users));
        }

        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
            detail: {
                balance: formattedBalance,
                totalMined: currentUser.totalMined?.toFixed(8)
            }
        }));
    }

    // Función para modificar el balance
    window.modifyBalance = function(amount, isFromMining = false) {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) return 0;

        // Actualizar balance
        currentUser.balance = parseFloat((parseFloat(currentUser.balance || 0) + amount).toFixed(8));
        
        // Si es de minería, actualizar también el total minado
        if (isFromMining) {
            currentUser.totalMined = parseFloat((parseFloat(currentUser.totalMined || 0) + amount).toFixed(8));
        }

        // Actualizar en localStorage
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        localStorage.setItem("userBalance", currentUser.balance.toString());
        localStorage.setItem("withdrawableBalance", currentUser.balance.toString());

        // Actualizar todos los elementos de balance en la página
        const balanceElements = document.querySelectorAll("#balance");
        balanceElements.forEach(element => {
            element.textContent = currentUser.balance.toFixed(8);
        });

        // Actualizar también el balance en el sidebar
        const sidebarBalanceElements = document.querySelectorAll(".sidebar .balance-amount");
        sidebarBalanceElements.forEach(element => {
            element.textContent = currentUser.balance.toFixed(8);
        });

        // Disparar evento de actualización
        window.dispatchEvent(new CustomEvent('balanceUpdated', {
            detail: {
                balance: currentUser.balance.toFixed(8),
                totalMined: currentUser.totalMined?.toFixed(8)
            }
        }));

        // Registrar la transacción en el historial
        const transactionHistory = JSON.parse(localStorage.getItem('transactionHistory') || '[]');
        transactionHistory.unshift({
            type: isFromMining ? 'mining' : 'game_reward',
            amount: amount.toFixed(8),
            date: new Date().toISOString(),
            game: window.location.pathname.includes('game') ? window.location.pathname.split('/').pop().replace('.html', '') : null
        });
        localStorage.setItem('transactionHistory', JSON.stringify(transactionHistory));

        return currentUser.balance;
    }

    // Función para inicializar el balance en la página actual
    function initializeBalance() {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (currentUser) {
            updateBalance();
        }
    }

    // Escuchar cambios en localStorage
    window.addEventListener('storage', function(e) {
        if (e.key === 'currentUser') {
            updateBalance();
        }
    });

    // Escuchar eventos de actualización de balance
    window.addEventListener('balanceUpdated', function(e) {
        const balanceElements = document.querySelectorAll("#balance");
        balanceElements.forEach(element => {
            element.textContent = e.detail.balance;
        });

        const totalMinedElements = document.querySelectorAll("#totalMined");
        if (totalMinedElements.length > 0 && e.detail.totalMined !== undefined) {
            totalMinedElements.forEach(element => {
                element.textContent = e.detail.totalMined;
            });
        }
    });

    // Inicializar el balance al cargar la página
    initializeBalance();

    // Función para manejar la imagen de perfil
    function updateProfileImage() {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        const profileImages = document.querySelectorAll("#sidebarProfileImage");
        
        profileImages.forEach(img => {
            img.onerror = function() {
                this.src = 'perfil.png';
                // Actualizar la imagen en localStorage si falló
                if (currentUser) {
                    currentUser.profileImage = 'perfil.png';
                    localStorage.setItem("currentUser", JSON.stringify(currentUser));
                }
            };
            
            if (currentUser && currentUser.profileImage) {
                img.src = currentUser.profileImage;
            } else {
                img.src = 'perfil.png';
            }
        });
    }

    // Verificar si estamos en la página de registro
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        // Manejar la vista previa de la imagen de perfil
        const profileImage = document.getElementById("profileImage");
        const profilePreview = document.getElementById("profilePreview");

        profileImage?.addEventListener("change", function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showNotification('La imagen no debe superar los 5MB', 'error');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });

        // Función para registrar usuario
        async function registerUser(userData) {
            try {
                const response = await fetch('https://tu-api.com/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(userData)
                });

                if (!response.ok) {
                    throw new Error('Error en el registro');
                }

                const data = await response.json();
                return data;
            } catch (error) {
                console.error('Error:', error);
                throw error;
            }
        }

        // Modificar el evento de registro
        registerForm.addEventListener("submit", async function(e) {
            e.preventDefault();
            
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPassword = document.getElementById("confirmPassword").value;
            const birthdate = document.getElementById("birthdate").value;

            // Validaciones
            if (username.length < 3) {
                showNotification('El nombre de usuario debe tener al menos 3 caracteres', 'error');
                return;
            }

            if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                showNotification('Por favor ingresa un email válido', 'error');
                return;
            }

            if (!validateAge(birthdate)) {
                showNotification('Debes ser mayor de 18 años para registrarte', 'error');
                return;
            }

            const passwordValidation = validatePassword(password);
            if (!passwordValidation.valid) {
                showNotification(passwordValidation.message, 'error');
                return;
            }

            if (password !== confirmPassword) {
                showNotification('Las contraseñas no coinciden', 'error');
                return;
            }

            try {
                const userData = {
                    username,
                    email,
                    password,
                    birthdate,
                    profileImage: profilePreview.src || 'perfil.png'
                };

                const result = await registerUser(userData);
                
                // Guardar token de sesión
                localStorage.setItem('authToken', result.token);
                
                showNotification('¡Registro exitoso! Redirigiendo...', 'success');
                setTimeout(() => {
                    window.location.href = "index.html";
                }, 1500);
            } catch (error) {
                showNotification('Error al procesar el registro. Por favor, intenta nuevamente.', 'error');
            }
        });
    }

    // Verificar si estamos en la página de inicio de sesión
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;

            if (!email || !password) {
                showNotification('Por favor completa todos los campos', 'error');
                return;
            }

            try {
                // Obtener usuarios registrados
                const users = JSON.parse(localStorage.getItem("users") || "[]");
                
                // Buscar usuario
                const user = users.find(u => u.email === email && atob(u.password) === password);
                
                if (user) {
                    // Actualizar última fecha de inicio de sesión
                    user.lastLoginDate = new Date().toISOString();
                    localStorage.setItem("users", JSON.stringify(users));
                    
                    // Guardar usuario actual
                    localStorage.setItem("currentUser", JSON.stringify(user));
                    
                    showNotification('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
                    setTimeout(() => {
                        window.location.href = "index.html";
                    }, 1500);
                } else {
                    showNotification('Credenciales incorrectas', 'error');
                }
            } catch (error) {
                console.error('Error during login:', error);
                showNotification('Error al procesar el inicio de sesión. Por favor, intenta nuevamente.', 'error');
            }
        });
    }

    // Verificar si estamos en la página principal
    if (window.location.pathname.includes('index.html')) {
        // Verificar si el usuario está autenticado
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        if (!currentUser) {
            window.location.href = "login.html";
            return;
        }

        // Actualizar información del perfil
        const profileImage = document.querySelector(".profile img");
        const username = document.querySelector(".profile h3");
        const balance = document.getElementById("balance");

        if (profileImage) profileImage.src = currentUser.profileImage;
        if (username) username.textContent = currentUser.username;
        if (balance) balance.textContent = currentUser.balance.toFixed(8);

        // Agregar botón de cerrar sesión
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", function(e) {
                e.preventDefault();
                localStorage.removeItem("currentUser");
                window.location.href = "login.html";
            });
        }
    }

    // Verificar si estamos en cualquier página con barra lateral
    if (document.querySelector('.sidebar')) {
        const currentUser = JSON.parse(localStorage.getItem("currentUser"));
        
        // Actualizar nombre de usuario
        const usernameElement = document.getElementById("sidebarUsername");
        if (usernameElement) {
            usernameElement.textContent = currentUser ? currentUser.username : 'Usuario';
        }
        
        // Actualizar balance e imagen de perfil
        updateBalance();
        updateProfileImage();
    }
});

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) {
        console.error('Notification container not found');
        return;
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        <span>${message}</span>
    `;
    
    container.appendChild(notification);

    // Animación de entrada
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remover después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Función para validar la edad
function validateAge(birthdate) {
    if (!birthdate) return false;
    
    const today = new Date();
    const birthDate = new Date(birthdate);
    
    if (isNaN(birthDate.getTime())) return false;
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    return age >= 18;
}

// Función para validar contraseña
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, message: 'La contraseña debe tener al menos 8 caracteres' };
    }
    if (!/[A-Z]/.test(password)) {
        return { valid: false, message: 'La contraseña debe contener al menos una mayúscula' };
    }
    if (!/[a-z]/.test(password)) {
        return { valid: false, message: 'La contraseña debe contener al menos una minúscula' };
    }
    if (!/[0-9]/.test(password)) {
        return { valid: false, message: 'La contraseña debe contener al menos un número' };
    }
    return { valid: true };
} 