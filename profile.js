document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticación
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        window.location.href = 'login.html';
        return;
    }

    // Funcionalidad de la barra lateral
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebar = document.querySelector('.sidebar');
    const profileContainer = document.querySelector('.profile-container');

    sidebarToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
        profileContainer.classList.toggle('sidebar-active');
    });

    // Cerrar sidebar al hacer clic fuera en dispositivos móviles
    document.addEventListener('click', function(e) {
        const isMobile = window.innerWidth <= 768;
        if (isMobile && !sidebar.contains(e.target) && e.target !== sidebarToggle) {
            sidebar.classList.remove('active');
            profileContainer.classList.remove('sidebar-active');
        }
    });

    // Actualizar información del perfil en la barra lateral
    const sidebarProfileImage = document.getElementById('sidebarProfileImage');
    const sidebarUsername = document.getElementById('sidebarUsername');
    const balanceElement = document.getElementById('balance');

    sidebarProfileImage.src = currentUser.profileImage || 'default-avatar.png';
    sidebarUsername.textContent = currentUser.username;
    balanceElement.textContent = currentUser.balance.toFixed(8);

    // Actualizar información del perfil principal
    const profileImage = document.getElementById('profileImage');
    const profileUsername = document.getElementById('profileUsername');
    const memberSince = document.getElementById('memberSince');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    const birthdateInput = document.getElementById('birthdate');
    const totalMined = document.getElementById('totalMined');
    const miningStreak = document.getElementById('miningStreak');
    const lastMining = document.getElementById('lastMining');

    profileImage.src = currentUser.profileImage || 'default-avatar.png';
    profileUsername.textContent = currentUser.username;
    memberSince.textContent = new Date(currentUser.createdAt).toLocaleDateString();
    usernameInput.value = currentUser.username;
    emailInput.value = currentUser.email;
    birthdateInput.value = currentUser.birthdate;
    totalMined.textContent = `${currentUser.totalMined.toFixed(8)} USDC`;
    miningStreak.textContent = `${currentUser.miningStreak} días`;
    lastMining.textContent = currentUser.lastMiningDate ? 
        new Date(currentUser.lastMiningDate).toLocaleDateString() : 'Nunca';

    // Manejar cambio de imagen de perfil
    const changeImageBtn = document.getElementById('changeImageBtn');
    
    changeImageBtn.addEventListener('click', function() {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    showNotification('La imagen no debe superar los 5MB', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = function(e) {
                    const imageData = e.target.result;
                    
                    // Actualizar imagen en el perfil
                    profileImage.src = imageData;
                    // Actualizar imagen en la barra lateral
                    sidebarProfileImage.src = imageData;
                    
                    // Actualizar en localStorage
                    currentUser.profileImage = imageData;
                    localStorage.setItem('currentUser', JSON.stringify(currentUser));
                    
                    // Actualizar en la lista de usuarios
                    const users = JSON.parse(localStorage.getItem('users') || '[]');
                    const userIndex = users.findIndex(u => u.email === currentUser.email);
                    if (userIndex !== -1) {
                        users[userIndex].profileImage = imageData;
                        localStorage.setItem('users', JSON.stringify(users));
                    }

                    showNotification('Imagen de perfil actualizada correctamente', 'success');
                };
                reader.readAsDataURL(file);
            }
        };
        
        fileInput.click();
    });

    // Manejar guardado de cambios en el perfil
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    const countryInput = document.getElementById('country');
    const cityInput = document.getElementById('city');

    saveProfileBtn.addEventListener('click', function() {
        // Actualizar datos adicionales
        currentUser.country = countryInput.value;
        currentUser.city = cityInput.value;
        currentUser.birthdate = birthdateInput.value;

        // Actualizar en localStorage
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Actualizar en la lista de usuarios
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex(u => u.email === currentUser.email);
        if (userIndex !== -1) {
            users[userIndex] = {...users[userIndex], ...currentUser};
            localStorage.setItem('users', JSON.stringify(users));
        }

        showNotification('Perfil actualizado correctamente', 'success');
    });

    // Manejar cierre de sesión
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
    });
}); 