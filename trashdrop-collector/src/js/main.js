/**
 * TrashDrop Collector - Main JavaScript
 * Handles app initialization and global functionality
 */

// App state
const appState = {
    isOnline: false,
    user: null,
    notifications: [],
    lastKnownPosition: null,
    locationPermissionGranted: false
};

/**
 * Initialize the application
 */
async function initApp() {
    try {
        // Make sure we have direct access to the function before calling it
        let user = null;
        if (typeof window.getCurrentUser === 'function') {
            // Try to get user, catch any errors to prevent crashes
            try {
                user = await window.getCurrentUser();
            } catch (error) {
                console.error('Error getting current user:', error);
            }
        } else {
            // Try to get from localStorage as fallback
            const mockUser = localStorage.getItem('mockUser');
            if (mockUser) {
                try {
                    user = JSON.parse(mockUser);
                } catch (e) {}
            }
        }
        
        // Update app state with user info
        appState.user = user;
        
        // Handle navigation based on auth status
        handleAuthNavigation(user);
        
        // Initialize service worker
        registerServiceWorker();
        
        // Add event listeners
        setupEventListeners();
        
        console.log('App initialized successfully');
    } catch (error) {
        console.error('Error during app initialization:', error);
    }
}

/**
 * Handle navigation based on authentication status
 * @param {Object} user - Current user object or null
 */
function handleAuthNavigation(user) {
    // CRITICAL: Check if we're in development mode - NEVER redirect in development
    const isDevelopment = window.isDevelopment || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('127.0.0.1') ||
                         window.location.port === '5500' || 
                         window.location.port === '5501';
    
    // If in development mode, allow all navigation without redirects
    if (isDevelopment) {
        console.log('Development mode detected - skipping authentication navigation redirects');
        return;
    }
    
    // Create development mock user if needed
    if (!user && isDevelopment) {
        console.log('Creating mock user for development');
        const mockUser = {
            id: 'mock-user-' + Date.now(),
            email: 'dev@example.com',
            name: 'Development User',
            created_at: new Date().toISOString()
        };
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        // Update app state
        if (window.appState) window.appState.user = mockUser;
        return; // No redirects needed
    }
    
    // Get current page path (only proceed with redirects in production)
    const currentPath = window.location.pathname;
    const authPages = ['/login.html', '/signup.html', '/reset-password.html', '/email-confirmation.html'];
    const appPages = ['/map.html', '/request.html', '/assign.html', '/earnings.html', '/account.html'];
    
    // Determine if current page is auth page or app page
    const isAuthPage = authPages.some(page => currentPath.endsWith(page));
    const isAppPage = appPages.some(page => currentPath.endsWith(page));
    const isHomePage = currentPath.endsWith('/index.html') || currentPath.endsWith('/');
    
    // Only redirect in production environment
    if (user) {
        // User is logged in
        if (isAuthPage || isHomePage) {
            // Redirect to map page if on auth page or homepage
            window.location.href = './map.html';
        }
    } else {
        // User is not logged in - extra safeguard to avoid unnecessary redirects
        // Check again for local storage user before redirect
        const mockUserStr = localStorage.getItem('mockUser');
        if (mockUserStr) {
            try {
                const mockUser = JSON.parse(mockUserStr);
                if (mockUser && mockUser.id) {
                    console.log('Found user in localStorage, avoiding redirect');
                    return;
                }
            } catch (e) {}
        }
        
        // Only redirect in production and if truly no user is found
        if (isAppPage) {
            console.log('User not authenticated, redirecting to login');
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
    // Only register service worker in production or on localhost (not on 5server/live-server)
    const isProduction = !window.location.hostname.includes('localhost') && 
                        !window.location.hostname.includes('127.0.0.1');
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    if ('serviceWorker' in navigator && (isProduction || isLocalhost)) {
        // For development environment using 5server or similar dev servers
        // don't try to register service worker as it will cause CORS errors
        if (window.location.port === '5500' || window.location.port === '5501') {
            console.log('Development environment detected. Service Worker registration skipped.');
            return;
        }
        
        window.addEventListener('load', () => {
            // Get the correct path based on the environment
            const swPath = './service-worker.js';
            
            navigator.serviceWorker.register(swPath)
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.error('Service Worker registration failed:', error);
                    console.log('Service Worker registration may fail in development. This is normal.');
                });
        });
    } else {
        console.log('Service Workers not supported or disabled in development mode');
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

/**
 * Check and request location permissions
 * @param {Boolean} skipPrompt - Whether to skip the permission prompt if not granted
 * @returns {Promise<Boolean>} - Whether permission is granted
 */
async function checkLocationPermission(skipPrompt = false) {
    // Check if permission is already known
    if (appState.locationPermissionGranted) {
        return true;
    }
    
    // Check if Geolocation API is available
    if (!navigator.geolocation) {
        console.warn('Geolocation is not supported by this browser');
        return false;
    }
    
    if (skipPrompt) {
        // Just return false without prompting
        return false;
    }
    
    try {
        // Request location with a short timeout to see if permission is granted
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve, 
                reject, 
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 
                }
            );
        });
        
        // Store position and update permission status
        updateLastKnownPosition(position.coords);
        appState.locationPermissionGranted = true;
        
        return true;
    } catch (error) {
        console.warn('Location permission not granted or denied:', error.message);
        return false;
    }
}

/**
 * Request location permission with user interaction
 * @returns {Promise<Boolean>} - Whether permission was granted
 */
async function requestLocationPermission() {
    try {
        // Show a notification to explain why location is needed
        showNotification(
            'TrashDrop needs your location to find nearby requests and check if you are near disposal sites.',
            'info',
            5000
        );
        
        // Request location with user interaction
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
                resolve, 
                reject, 
                { 
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 60000 
                }
            );
        });
        
        // Store position and update permission status
        updateLastKnownPosition(position.coords);
        appState.locationPermissionGranted = true;
        
        showNotification('Location access granted!', 'success');
        return true;
    } catch (error) {
        console.warn('Location permission denied:', error.message);
        showNotification(
            'Location access denied. Some features may have limited functionality.',
            'warning',
            5000
        );
        return false;
    }
}

/**
 * Update the last known position
 * @param {GeolocationCoordinates} coords - Coordinates object
 */
function updateLastKnownPosition(coords) {
    if (coords && coords.latitude && coords.longitude) {
        appState.lastKnownPosition = {
            latitude: coords.latitude,
            longitude: coords.longitude,
            accuracy: coords.accuracy,
            timestamp: Date.now()
        };
    }
}

/**
 * Start background location tracking
 * @param {Boolean} highAccuracy - Whether to use high accuracy
 */
function startLocationTracking(highAccuracy = false) {
    // Only start tracking if permission is granted
    if (!appState.locationPermissionGranted) {
        return false;
    }
    
    // Return if already tracking
    if (appState.locationWatchId) {
        return true;
    }
    
    // Start watching position
    appState.locationWatchId = navigator.geolocation.watchPosition(
        (position) => {
            updateLastKnownPosition(position.coords);
        },
        (error) => {
            console.warn('Location tracking error:', error.message);
        },
        {
            enableHighAccuracy: highAccuracy,
            timeout: 10000,
            maximumAge: 60000
        }
    );
    
    return true;
}

/**
 * Stop background location tracking
 */
function stopLocationTracking() {
    if (appState.locationWatchId) {
        navigator.geolocation.clearWatch(appState.locationWatchId);
        appState.locationWatchId = null;
    }
}

// Export functions and state to global scope
window.appState = appState;
window.showNotification = showNotification;
window.formatDate = formatDate;
window.calculateDistance = calculateDistance;
window.handleLogout = handleLogout;
window.handleEmergencyLogout = handleEmergencyLogout;
window.checkLocationPermission = checkLocationPermission;
window.requestLocationPermission = requestLocationPermission;
window.startLocationTracking = startLocationTracking;
window.stopLocationTracking = stopLocationTracking;
