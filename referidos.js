// Sistema de Referidos - JavaScript

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Referencias a elementos del DOM
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const userReferralCode = document.getElementById('userReferralCode');
    const referralLink = document.getElementById('referralLink');
    const referralsTable = document.getElementById('referralsTable');
    const noReferrals = document.getElementById('noReferrals');
    const activeReferrals = document.getElementById('activeReferrals');
    const totalEarnings = document.getElementById('totalEarnings');
    const socialButtons = document.querySelectorAll('.social-btn');

    // Generar o cargar código de referido
    let userCode = getUserReferralCode();
    userReferralCode.textContent = userCode;
    
    // Configurar el enlace de referido
    const baseUrl = window.location.origin;
    const referUrl = `${baseUrl}/registro.html?ref=${userCode}`;
    referralLink.value = referUrl;

    // Inicializar estadísticas
    cargarEstadisticas();
    
    // Cargar lista de referidos
    cargarReferidos();

    // Event Listeners
    copyCodeBtn.addEventListener('click', function() {
        copiarAlPortapapeles(userCode);
        mostrarNotificacion('Código copiado al portapapeles');
        animarElemento(copyCodeBtn);
    });

    copyLinkBtn.addEventListener('click', function() {
        copiarAlPortapapeles(referUrl);
        mostrarNotificacion('Enlace copiado al portapapeles');
        animarElemento(copyLinkBtn);
    });

    // Configurar botones de redes sociales
    socialButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            compartirEnRedSocial(this.classList[1], referUrl);
        });
    });
});

/**
 * Obtiene o genera el código de referido del usuario
 * @returns {string} Código de referido
 */
function getUserReferralCode() {
    // Intentar obtener el código almacenado
    let code = localStorage.getItem('userReferralCode');
    
    // Si no existe, generar uno nuevo
    if (!code) {
        code = generarCodigoReferido();
        localStorage.setItem('userReferralCode', code);
    }
    
    return code;
}

/**
 * Genera un código de referido único
 * @returns {string} Código generado
 */
function generarCodigoReferido() {
    // Obtener identificador de usuario si existe
    const userId = localStorage.getItem('userId') || '';
    
    // Generar un código alfanumérico aleatorio
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let codigo = '';
    
    // Usar parte del ID de usuario si está disponible
    if (userId) {
        codigo = userId.substring(0, 3).toUpperCase();
    }
    
    // Añadir caracteres aleatorios
    for (let i = codigo.length; i < 6; i++) {
        codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    
    return codigo;
}

/**
 * Copia texto al portapapeles
 * @param {string} texto - Texto a copiar
 */
function copiarAlPortapapeles(texto) {
    // Método moderno
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .catch(err => {
                console.error('Error al copiar: ', err);
                copiarAlPortapapelesAntiguo(texto);
            });
    } else {
        // Método alternativo para navegadores que no soportan la API Clipboard
        copiarAlPortapapelesAntiguo(texto);
    }
}

/**
 * Método alternativo para copiar al portapapeles
 * @param {string} texto - Texto a copiar
 */
function copiarAlPortapapelesAntiguo(texto) {
    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.style.position = 'fixed';
    document.body.appendChild(textarea);
    textarea.select();
    
    try {
        document.execCommand('copy');
    } catch (err) {
        console.error('Error al copiar: ', err);
    }
    
    document.body.removeChild(textarea);
}

/**
 * Muestra una notificación temporal
 * @param {string} mensaje - Mensaje a mostrar
 */
function mostrarNotificacion(mensaje) {
    // Buscar si ya existe una notificación
    let notificacion = document.querySelector('.notificacion');
    
    // Si no existe, crear una nueva
    if (!notificacion) {
        notificacion = document.createElement('div');
        notificacion.className = 'notificacion';
        document.body.appendChild(notificacion);
        
        // Estilos para la notificación
        notificacion.style.position = 'fixed';
        notificacion.style.bottom = '20px';
        notificacion.style.right = '20px';
        notificacion.style.backgroundColor = 'var(--primary-color)';
        notificacion.style.color = 'white';
        notificacion.style.padding = '10px 20px';
        notificacion.style.borderRadius = 'var(--border-radius)';
        notificacion.style.boxShadow = 'var(--shadow)';
        notificacion.style.zIndex = '1000';
        notificacion.style.transition = 'opacity 0.3s, transform 0.3s';
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateY(20px)';
    }
    
    // Actualizar mensaje y mostrar
    notificacion.textContent = mensaje;
    setTimeout(() => {
        notificacion.style.opacity = '1';
        notificacion.style.transform = 'translateY(0)';
    }, 10);
    
    // Ocultar después de 3 segundos
    clearTimeout(notificacion.hideTimeout);
    notificacion.hideTimeout = setTimeout(() => {
        notificacion.style.opacity = '0';
        notificacion.style.transform = 'translateY(20px)';
        
        // Remover después de la transición
        setTimeout(() => {
            if (notificacion.parentNode) {
                notificacion.parentNode.removeChild(notificacion);
            }
        }, 300);
    }, 3000);
}

/**
 * Aplica una animación a un elemento
 * @param {HTMLElement} elemento - Elemento a animar
 */
function animarElemento(elemento) {
    elemento.classList.add('highlight');
    setTimeout(() => {
        elemento.classList.remove('highlight');
    }, 2000);
}

/**
 * Compartir en redes sociales
 * @param {string} red - Nombre de la red social
 * @param {string} url - URL para compartir
 */
function compartirEnRedSocial(red, url) {
    const titulo = 'Únete a Geometry Runner y gana recompensas';
    const mensaje = '¡Regístrate con mi código de referido y comienza a ganar recompensas jugando!';
    let shareUrl;
    
    // Configurar URL según la red social
    switch(red) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(mensaje)}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(mensaje)}&url=${encodeURIComponent(url)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://wa.me/?text=${encodeURIComponent(mensaje + ' ' + url)}`;
            break;
        case 'telegram':
            shareUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(mensaje)}`;
            break;
        default:
            shareUrl = url;
    }
    
    // Abrir ventana para compartir
    window.open(shareUrl, '_blank', 'width=600,height=600');
}

/**
 * Carga las estadísticas del usuario
 */
function cargarEstadisticas() {
    // Simular datos (en producción, esto vendría de una API/backend)
    const datos = obtenerDatosReferidos();
    
    // Actualizar contadores
    activeReferrals.textContent = datos.cantidadReferidos;
    totalEarnings.textContent = datos.gananciasTotal.toFixed(8) + ' USDC';
}

/**
 * Carga la lista de referidos
 */
function cargarReferidos() {
    // Obtener datos de referidos
    const datos = obtenerDatosReferidos();
    const listaReferidos = datos.referidos;
    
    // Mostrar mensaje si no hay referidos
    if (listaReferidos.length === 0) {
        referralsTable.style.display = 'none';
        noReferrals.style.display = 'block';
        return;
    }
    
    // Ocultar mensaje y mostrar tabla
    referralsTable.style.display = 'table';
    noReferrals.style.display = 'none';
    
    // Limpiar tabla
    const tbody = referralsTable.querySelector('tbody');
    tbody.innerHTML = '';
    
    // Añadir referidos a la tabla
    listaReferidos.forEach(referido => {
        const fila = document.createElement('tr');
        
        const celdaUsuario = document.createElement('td');
        celdaUsuario.textContent = referido.usuario;
        
        const celdaFecha = document.createElement('td');
        celdaFecha.textContent = new Date(referido.fecha).toLocaleDateString();
        
        const celdaEstado = document.createElement('td');
        const estadoSpan = document.createElement('span');
        estadoSpan.textContent = referido.activo ? 'Activo' : 'Inactivo';
        estadoSpan.className = referido.activo ? 'estado-activo' : 'estado-inactivo';
        estadoSpan.style.backgroundColor = referido.activo ? 'var(--accent-color)' : 'var(--dark-gray)';
        estadoSpan.style.color = 'white';
        estadoSpan.style.padding = '3px 8px';
        estadoSpan.style.borderRadius = '4px';
        estadoSpan.style.fontSize = '0.8rem';
        celdaEstado.appendChild(estadoSpan);
        
        const celdaGanancias = document.createElement('td');
        celdaGanancias.textContent = referido.ganancias.toFixed(8) + ' USDC';
        
        fila.appendChild(celdaUsuario);
        fila.appendChild(celdaFecha);
        fila.appendChild(celdaEstado);
        fila.appendChild(celdaGanancias);
        
        tbody.appendChild(fila);
    });
}

/**
 * Obtiene datos de referidos
 * @returns {Object} Datos de referidos
 */
function obtenerDatosReferidos() {
    // Simular datos (en producción, esto vendría de una API/backend)
    const datosGuardados = localStorage.getItem('datosReferidos');
    
    if (datosGuardados) {
        return JSON.parse(datosGuardados);
    }
    
    // Datos de ejemplo
    const datosPorDefecto = {
        cantidadReferidos: 0,
        gananciasTotal: 0,
        referidos: []
    };
    
    // Guardar datos por defecto
    localStorage.setItem('datosReferidos', JSON.stringify(datosPorDefecto));
    
    return datosPorDefecto;
}

/**
 * Procesa un nuevo referido cuando alguien se registra
 * @param {string} codigo - Código de referido usado
 * @param {string} usuario - Nombre de usuario del nuevo referido
 */
function procesarNuevoReferido(codigo, usuario) {
    // Verificar que el código existe y pertenece a un usuario
    // En un sistema real, esto se haría en el backend
    
    // Crear objeto de referido
    const nuevoReferido = {
        usuario: usuario,
        fecha: new Date().toISOString(),
        activo: true,
        ganancias: 0
    };
    
    // Obtener datos actuales
    const datos = obtenerDatosReferidos();
    
    // Añadir nuevo referido
    datos.referidos.push(nuevoReferido);
    datos.cantidadReferidos = datos.referidos.length;
    
    // Guardar datos actualizados
    localStorage.setItem('datosReferidos', JSON.stringify(datos));
    
    // Notificar al referente (en un sistema real, esto se haría por email/notificación)
    console.log(`Nuevo referido registrado: ${usuario} con código ${codigo}`);
}

/**
 * Obtiene el código de referido desde la URL
 * @returns {string|null} Código de referido o null
 */
function obtenerCodigoReferidoDeURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('ref');
}

// Si estamos en la página de registro, verificar si hay código de referido
if (window.location.pathname.includes('registro')) {
    const codigoReferido = obtenerCodigoReferidoDeURL();
    
    if (codigoReferido) {
        // Almacenar el código para usarlo durante el registro
        sessionStorage.setItem('codigoReferido', codigoReferido);
        
        // Mostrar mensaje indicando el código
        const contenedorRef = document.createElement('div');
        contenedorRef.className = 'referido-info';
        contenedorRef.innerHTML = `<p>Registrándote con el código de referido: <strong>${codigoReferido}</strong></p>`;
        
        // Insertar después del h1 o al principio del formulario
        document.querySelector('form').prepend(contenedorRef);
    }
}

// Interceptar el formulario de registro para procesar el código de referido
if (window.location.pathname.includes('registro')) {
    document.querySelector('form').addEventListener('submit', function(e) {
        // No detener el envío normal del formulario, solo añadir funcionalidad
        
        const codigoReferido = sessionStorage.getItem('codigoReferido');
        const nombreUsuario = document.querySelector('input[name="username"]').value;
        
        if (codigoReferido) {
            // Procesaríamos el referido (en un sistema real, esto se haría en el backend)
            procesarNuevoReferido(codigoReferido, nombreUsuario);
            
            // Limpiar el código almacenado
            sessionStorage.removeItem('codigoReferido');
        }
    });
} 