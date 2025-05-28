/**
 * TrashDrop Collector - Main JavaScript
 * Handles app initialization and global functionality
 */

// App state
const appState = {
    isOnline: false,
    user: null,
    notifications: []
};

/**
 * Initialize the application
 */
async function initApp() {
    // Check if user is logged in
    const user = await getCurrentUser();
    appState.user = user;
    
    // Handle navigation based on auth status
    handleAuthNavigation(user);
    
    // Initialize service worker
    registerServiceWorker();
    
    // Add event listeners
    setupEventListeners();
}

/**
 * Handle navigation based on authentication status
 * @param {Object} user - Current user object or null
 */
function handleAuthNavigation(user) {
    // Get current page path
    const currentPath = window.location.pathname;
    const authPages = ['/login.html', '/signup.html', '/reset-password.html', '/email-confirmation.html'];
    const appPages = ['/map.html', '/request.html', '/assign.html', '/earnings.html', '/account.html'];
    
    // Determine if current page is auth page or app page
    const isAuthPage = authPages.some(page => currentPath.endsWith(page));
    const isAppPage = appPages.some(page => currentPath.endsWith(page));
    const isHomePage = currentPath.endsWith('/index.html') || currentPath.endsWith('/');
    
    if (user) {
        // User is logged in
        if (isAuthPage || isHomePage) {
            // Redirect to map page if on auth page or homepage
            window.location.href = './map.html';
        }
    } else {
        // User is not logged in
        if (isAppPage) {
            // Redirect to login page if on app page
            window.location.href = './login.html';
        }
    }
}

/**
 * Setup event listeners for global app functionality
 */
function setupEventListeners() {
    // Logout button (if present)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    
    // Emergency logout shortcut (Ctrl+Alt+L)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'l') {
            handleEmergencyLogout();
        }
    });
}

/**
 * Handle normal logout
 */
async function handleLogout() {
    try {
        const { success, error } = await signOut();
        
        if (error) throw error;
        
        // Clear local app state
        appState.user = null;
        appState.isOnline = false;
        
        // Redirect to login page
        window.location.href = './login.html';
    } catch (error) {
        console.error('Logout error:', error);
        showNotification('Failed to log out. Please try again.', 'error');
    }
}

/**
 * Handle emergency logout (force clear all storage and redirect)
 */
function handleEmergencyLogout() {
    try {
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Clear cookies
        document.cookie.split(";").forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        });
        
        // Show visual feedback
        const body = document.body;
        const overlay = document.createElement('div');
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.fontSize = '24px';
        overlay.style.textAlign = 'center';
        overlay.style.padding = '20px';
        overlay.innerHTML = '<div>Emergency Logout<br>Clearing all data...</div>';
        body.appendChild(overlay);
        
        // Redirect to login page after a short delay
        setTimeout(() => {
            window.location.href = './login.html';
        }, 1500);
    } catch (error) {
        console.error('Emergency logout error:', error);
        // Force redirect anyway
        window.location.href = './login.html';
    }
}

/**
 * Register service worker for PWA functionality
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                });
        });
    }
}

/**
 * Show notification to user
 * @param {String} message - Notification message
 * @param {String} type - Notification type (success, error, warning, info)
 * @param {Number} duration - Duration in milliseconds
 */
function showNotification(message, type = 'info', duration = 3000) {
    // Check if notifications container exists
    let notificationsContainer = document.getElementById('notificationsContainer');
    
    // Create container if it doesn't exist
    if (!notificationsContainer) {
        notificationsContainer = document.createElement('div');
        notificationsContainer.id = 'notificationsContainer';
        notificationsContainer.className = 'notifications-container';
        document.body.appendChild(notificationsContainer);
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to container
    notificationsContainer.appendChild(notification);
    
    // Add to app state
    appState.notifications.push({
        id: Date.now(),
        message,
        type
    });
    
    // Remove after duration
    setTimeout(() => {
        notification.classList.add('fade-out');
        
        setTimeout(() => {
            if (notificationsContainer.contains(notification)) {
                notificationsContainer.removeChild(notification);
            }
        }, 300);
    }, duration);
}

/**
 * Format date for display
 * @param {String|Date} date - Date to format
 * @param {Boolean} includeTime - Whether to include time
 * @returns {String} - Formatted date string
 */
function formatDate(date, includeTime = false) {
    const d = new Date(date);
    
    if (isNaN(d.getTime())) {
        return 'Invalid date';
    }
    
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return d.toLocaleDateString('en-US', options);
}

/**
 * Calculate distance between two coordinates
 * @param {Array} coords1 - First coordinates [latitude, longitude]
 * @param {Array} coords2 - Second coordinates [latitude, longitude]
 * @returns {Number} - Distance in kilometers
 */
function calculateDistance(coords1, coords2) {
    const [lat1, lon1] = coords1;
    const [lat2, lon2] = coords2;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance;
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

// Export functions and state to global scope
window.appState = appState;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.calculateDistance = calculateDistance;
window.handleLogout = handleLogout;
window.handleEmergencyLogout = handleEmergencyLogout;
