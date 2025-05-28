/**
 * TrashDrop Collector - Geofencing
 * Handles geofencing functionality to activate features within disposal center radius
 */

// Geofencing configuration
const GEOFENCE_CONFIG = {
    radius: 50, // radius in meters
    updateInterval: 10000, // location update interval in ms
    debugMode: false // set to true for testing and development
};

// Store for geofence zones
const geofenceZones = {
    disposalCenters: []
};

// Current state
let watchId = null;
let isTracking = false;
let currentPosition = null;

/**
 * Initialize geofencing functionality
 * @param {Array} disposalCenterLocations - Array of disposal center coordinates [[lat1, lng1], [lat2, lng2], etc.]
 */
function initGeofencing(disposalCenterLocations = []) {
    // Check if geolocation is supported
    if ('geolocation' in navigator) {
        // Store disposal centers
        if (disposalCenterLocations && disposalCenterLocations.length > 0) {
            geofenceZones.disposalCenters = disposalCenterLocations;
        }
        
        // Set up event listeners
        setupGeofenceEventListeners();
        
        console.log('Geofencing initialized successfully');
        return true;
    } else {
        console.error('Geolocation is not supported by this browser');
        if (window.showNotification) {
            window.showNotification('Location services are not supported by your browser', 'error');
        }
        return false;
    }
}

/**
 * Setup event listeners for geofence actions
 */
function setupGeofenceEventListeners() {
    // Find and attach events to all geofence-aware buttons
    const geofenceButtons = document.querySelectorAll('[data-geofence]');
    
    geofenceButtons.forEach(button => {
        // Get the geofence type
        const geofenceType = button.dataset.geofence;
        
        // Disable by default
        button.disabled = true;
        button.classList.add('geofence-disabled');
        
        // Add tooltip
        button.setAttribute('title', 'You must be near a disposal center to use this feature');
        
        // Store original text
        button.dataset.originalText = button.innerText;
        
        // Add event listener to handle geofence zone entry/exit
        document.addEventListener('geofenceUpdate', (event) => {
            const { position, insideZones } = event.detail;
            
            if (insideZones.includes(geofenceType)) {
                // Inside geofence zone - enable
                button.disabled = false;
                button.classList.remove('geofence-disabled');
                button.classList.add('geofence-enabled');
                button.innerText = button.dataset.originalText;
            } else {
                // Outside geofence zone - disable
                button.disabled = true;
                button.classList.remove('geofence-enabled');
                button.classList.add('geofence-disabled');
                button.innerText = `Must be within ${GEOFENCE_CONFIG.radius}m of disposal center`;
            }
        });
    });
}

/**
 * Start tracking location for geofencing
 * @returns {Boolean} - Success status
 */
function startGeofenceTracking() {
    if (!('geolocation' in navigator)) {
        return false;
    }
    
    // Clear any existing watch
    stopGeofenceTracking();
    
    // Set tracking flag
    isTracking = true;
    
    // Start watching position
    watchId = navigator.geolocation.watchPosition(
        handlePositionUpdate,
        handlePositionError,
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 5000
        }
    );
    
    console.log('Geofence tracking started');
    return true;
}

/**
 * Stop tracking location
 */
function stopGeofenceTracking() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
        isTracking = false;
        console.log('Geofence tracking stopped');
    }
}

/**
 * Handle position update from Geolocation API
 * @param {GeolocationPosition} position - Position object
 */
function handlePositionUpdate(position) {
    const { latitude, longitude, accuracy } = position.coords;
    
    // Store current position
    currentPosition = {
        latitude,
        longitude,
        accuracy,
        timestamp: position.timestamp
    };
    
    // Check if inside any geofence zones
    const insideZones = checkGeofenceZones(latitude, longitude);
    
    // Debug logging
    if (GEOFENCE_CONFIG.debugMode) {
        console.log('Current position:', currentPosition);
        console.log('Inside zones:', insideZones);
    }
    
    // Dispatch geofence update event
    dispatchGeofenceEvent(currentPosition, insideZones);
}

/**
 * Handle geolocation errors
 * @param {GeolocationPositionError} error - Error object
 */
function handlePositionError(error) {
    console.error('Geolocation error:', error.message);
    
    let errorMsg = 'Location error: ';
    
    switch (error.code) {
        case error.PERMISSION_DENIED:
            errorMsg += 'Location permission denied';
            break;
        case error.POSITION_UNAVAILABLE:
            errorMsg += 'Location information is unavailable';
            break;
        case error.TIMEOUT:
            errorMsg += 'Location request timed out';
            break;
        default:
            errorMsg += 'Unknown location error';
    }
    
    // Show notification if available
    if (window.showNotification) {
        window.showNotification(errorMsg, 'error');
    }
    
    // Stop tracking on error
    stopGeofenceTracking();
}

/**
 * Check if coordinates are inside any geofence zones
 * @param {Number} latitude - Latitude
 * @param {Number} longitude - Longitude
 * @returns {Array} - Array of zone types the user is inside
 */
function checkGeofenceZones(latitude, longitude) {
    const insideZones = [];
    
    // Check disposal centers
    for (const center of geofenceZones.disposalCenters) {
        const [centerLat, centerLng] = center;
        
        // Calculate distance
        const distance = calculateDistanceInMeters(
            latitude, longitude,
            centerLat, centerLng
        );
        
        // Check if inside radius
        if (distance <= GEOFENCE_CONFIG.radius) {
            insideZones.push('disposalCenter');
            break; // Found one center, no need to check others
        }
    }
    
    return insideZones;
}

/**
 * Calculate distance between two coordinates in meters
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} - Distance in meters
 */
function calculateDistanceInMeters(lat1, lon1, lat2, lon2) {
    // Earth's radius in meters
    const R = 6371000;
    
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

/**
 * Dispatch custom event with geofence data
 * @param {Object} position - Current position object
 * @param {Array} insideZones - Array of zone types the user is inside
 */
function dispatchGeofenceEvent(position, insideZones) {
    const event = new CustomEvent('geofenceUpdate', {
        detail: {
            position,
            insideZones,
            timestamp: Date.now()
        }
    });
    
    document.dispatchEvent(event);
}

/**
 * Add a new geofence zone
 * @param {String} type - Zone type (e.g. 'disposalCenter')
 * @param {Array} coordinates - [latitude, longitude]
 */
function addGeofenceZone(type, coordinates) {
    if (type === 'disposalCenter') {
        geofenceZones.disposalCenters.push(coordinates);
        console.log(`Added ${type} geofence at [${coordinates}]`);
    }
}

/**
 * Check if user is currently inside any specific type of zone
 * @param {String} zoneType - Type of zone to check
 * @returns {Boolean} - Whether user is inside the zone type
 */
function isInsideZoneType(zoneType) {
    if (!currentPosition) return false;
    
    const insideZones = checkGeofenceZones(
        currentPosition.latitude,
        currentPosition.longitude
    );
    
    return insideZones.includes(zoneType);
}

/**
 * Mock location for testing (only in debug mode)
 * @param {Number} latitude - Latitude
 * @param {Number} longitude - Longitude
 */
function mockLocation(latitude, longitude) {
    if (GEOFENCE_CONFIG.debugMode) {
        const mockPosition = {
            coords: {
                latitude,
                longitude,
                accuracy: 10
            },
            timestamp: Date.now()
        };
        
        handlePositionUpdate(mockPosition);
        console.log('Location mocked for testing');
    }
}

// Export functions to global scope
window.initGeofencing = initGeofencing;
window.startGeofenceTracking = startGeofenceTracking;
window.stopGeofenceTracking = stopGeofenceTracking;
window.addGeofenceZone = addGeofenceZone;
window.isInsideZoneType = isInsideZoneType;
window.mockLocation = mockLocation;
