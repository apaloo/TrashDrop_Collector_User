/**
 * TrashDrop Collector - Map Module
 * Handles map functionality and geolocation
 */

// Map instance
let map;
// User marker
let userMarker;
// Request markers array
let requestMarkers = [];
// Radius circle
let radiusCircle;

// Initialize global state if not exists
window.TrashDrop = window.TrashDrop || {};
window.TrashDrop.state = window.TrashDrop.state || {
    currentPosition: null,
    currentRadius: 5,
    currentTrashType: 'all'
};

// Alias for easier access
const state = window.TrashDrop.state;

/**
 * Initialize the map
 * @param {Array} coords - Initial coordinates [latitude, longitude]
 * @returns {Object} - Leaflet map instance
 */
function initMap(coords = [5.6037, -0.1870]) {
    // Check if map container exists and is not already initialized
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map container not found');
        return null;
    }
    
    // If map is already initialized, just update the view and return
    if (mapElement._leaflet_id && map) {
        map.setView(coords, map.getZoom(), { 
            animate: false,
            duration: 0.3
        });
        return Promise.resolve(map);
    }
    
    // Create map instance with optimized settings for mobile and desktop
    const mapOptions = {
        attributionControl: false,  // Disable default attribution control
        zoomControl: false,        // We'll add a custom one
        touchZoom: true,          // Enable touch zoom
        doubleClickZoom: true,    // Enable double click zoom
        scrollWheelZoom: true,    // Enable scroll wheel zoom
        boxZoom: true,            // Enable box zoom
        dragging: true,           // Enable dragging
        keyboard: true,           // Enable keyboard navigation
        tapTolerance: 25,         // Increased tap tolerance for better touch (from 15 to 25)
        preferCanvas: true,       // Better performance for many markers
        zoomSnap: 0.25,           // Smoother zooming
        zoomDelta: 0.5,           // Smoother zoom steps
        wheelPxPerZoomLevel: 60,  // Smoother mouse wheel zoom
        fadeAnimation: true,      // Smoother animations
        markerZoomAnimation: true, // Smoother marker animations
        maxBoundsViscosity: 0.7,  // How much the map stays still when dragging near the edge
        inertia: true,            // Inertia for smoother panning
        inertiaDeceleration: 3000, // Speed of deceleration after panning
        inertiaMaxSpeed: 1500,     // Max speed of the inertial movement
        easeLinearity: 0.3,        // Animation curve for smooth transitions
        worldCopyJump: false,     // Prevent infinite horizontal panning
        maxBounds: [             // Limit map bounds to reasonable values
            [-90, -180],
            [90, 180]
        ]
    };


    try {
        // Initialize the map with the options
        map = L.map('map', mapOptions).setView(coords, 13);
        
        // Store map instance in state
        window.TrashDrop.map = map;
        
        // Initialize current position from state if available
        if (state.currentPosition) {
            coords = [state.currentPosition.lat, state.currentPosition.lng];
            map.setView(coords, 13, { animate: false });
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        throw error; // Re-throw to be caught by the caller
    }
    
    // Add a class to the map container for mobile detection in CSS
    if (L.Browser.mobile) {
        map.getContainer().classList.add('leaflet-touch');
    }
    
    // Add OpenStreetMap tile layer with optimized options
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        detectRetina: true,      // Better rendering on retina displays
        attribution: '',         // Empty attribution to avoid any overlay
        updateWhenIdle: false,   // Only update when panning is done
        updateWhenZooming: false, // Don't update during zoom animation
        reuseTiles: true,       // Reuse tiles to save memory
        updateInterval: 200      // Throttle updates
    }).addTo(map);
    
    // Add user location control with proper error handling
    function setupLocateControl() {
        try {
            // Check if locate control is available
            if (L.control && L.control.locate) {
                const locateControl = L.control.locate({
                    position: 'topleft',
                    drawCircle: false,
                    follow: false,
                    setView: 'once',
                    locateOptions: {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    },
                    onLocationError: function(err) {
                        console.warn('Location error:', err);
                    }
                }).addTo(map);
                return locateControl;
            }
        } catch (error) {
            console.warn('Error initializing locate control:', error);
        }
        return null;
    }
    
    // Initialize locate control
    const locateControl = setupLocateControl();
    
    /**
     * Update the user's location marker on the map
     * @param {Array|Object} coords - Either [lat, lng] or {lat, lng} coordinates
     */
    function updateUserLocationMarker(coords) {
        try {
            const latlng = Array.isArray(coords) 
                ? { lat: coords[0], lng: coords[1] } 
                : coords;
            
            // Ensure we have valid coordinates
            if (isNaN(latlng.lat) || isNaN(latlng.lng)) {
                console.warn('Invalid coordinates:', latlng);
                return;
            }
            
            // Update or create user marker
            if (userMarker) {
                userMarker.setLatLng(latlng);
            } else {
                userMarker = L.marker(latlng, {
                    icon: L.divIcon({
                        className: 'user-location-marker',
                        html: '📍',
                        iconSize: [32, 32],
                        iconAnchor: [16, 32],
                        popupAnchor: [0, -32]
                    }),
                    zIndexOffset: 1000
                }).addTo(map);
            }
            
            // Update radius circle
            if (radiusCircle) {
                radiusCircle.setLatLng(latlng);
            } else {
                radiusCircle = addRadiusCircle(latlng, state.currentRadius);
            }
            
            return latlng;
        } catch (error) {
            console.error('Error updating user location marker:', error);
            return null;
        }
    }
    
    // Fallback to basic geolocation if locate control failed
    // Only attempt if we don't already have a location
    if (!locateControl && navigator.geolocation && !state.currentPosition) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = [pos.coords.latitude, pos.coords.longitude];
                map.setView(coords, 15);
                
                // Update state and UI
                state.currentPosition = { lat: coords[0], lng: coords[1] };
                updateUserLocationMarker(coords);
                
                // Fetch nearby requests
                fetchNearbyRequests(coords, state.currentRadius, state.currentTrashType);
            },
            (err) => {
                // Only log debug info for geolocation errors
                if (err.code === 1) {
                    console.debug('User denied geolocation permission');
                } else {
                    console.debug('Geolocation not available:', err.message);
                }
                // Don't show error notifications for geolocation
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }
    
    // Store locate control for later use if it was created
    if (locateControl) {
        window.TrashDrop.locateControl = locateControl;
    }
    
    // Add zoom controls for all devices but position them appropriately
    const zoomOptions = {
        position: 'topright',
        zoomInTitle: 'Zoom in',
        zoomOutTitle: 'Zoom out'
    };
    
    // Add zoom control for all devices
    L.control.zoom(zoomOptions).addTo(map);
    
    /**
     * Enhanced mobile interaction handling with better touch support
     */
    function setupMobileInteractions() {
        if (!L.Browser.mobile) return;
        
        // Enable all map interactions safely
        const enableInteractions = () => {
            try {
                if (map.dragging) map.dragging.enable();
                if (map.touchZoom) map.touchZoom.enable();
                if (map.doubleClickZoom) map.doubleClickZoom.enable();
                if (map.scrollWheelZoom) map.scrollWheelZoom.enable();
                if (map.boxZoom) map.boxZoom.enable();
                if (map.keyboard) map.keyboard.enable();
            } catch (error) {
                console.warn('Error enabling map interactions:', error);
            }
        };
        
        // Initial setup
        enableInteractions();
        
        // Debounce function to prevent rapid firing
        const debounce = (fn, delay) => {
            let timeout;
            return function() {
                clearTimeout(timeout);
                timeout = setTimeout(() => fn.apply(this, arguments), delay);
            };
        };
        
        // Re-enable interactions with debouncing
        const reEnableInteractions = debounce(() => {
            if (!map) return;
            enableInteractions();
            
            // Additional mobile-specific optimizations
            try {
                // Force hardware acceleration for smoother animations
                const container = map.getContainer();
                if (container) {
                    container.style.transform = 'translateZ(0)';
                    container.style.webkitBackfaceVisibility = 'hidden';
                }
                
                // Ensure touch actions are properly set
                if (map._container) {
                    map._container.style.touchAction = 'pan-x pan-y';
                }
                
                // Add touch-action to map container for better touch handling
                map.getContainer().style.touchAction = 'manipulation';
                
                // Disable double tap zoom on mobile for better performance
                map.tap?.disable();
                
            } catch (e) {
                console.warn('Error optimizing mobile interactions:', e);
            }
        }, 100);
        
        // Re-enable interactions after certain events
        map.on('moveend', reEnableInteractions);
        map.on('zoomend', reEnableInteractions);
        
        // Handle touch events
        map.on('touchstart', (e) => {
            // Enable interactions when user interacts with the map
            enableInteractions();
            
            // Prevent default to avoid text selection and other default behaviors
            if (e.originalEvent.touches.length > 1) {
                e.originalEvent.preventDefault();
            }
        });
        
        // Handle window resize
        const handleResize = debounce(() => {
            map.invalidateSize({ animate: false });
        }, 100);
        
        window.addEventListener('resize', handleResize);
        
        // Cleanup
        map.on('remove', () => {
            window.removeEventListener('resize', handleResize);
        });
    }
    
    // Set up mobile interactions
    setupMobileInteractions();
    
    // Return a promise that resolves when the map is fully initialized
    return new Promise((resolve, reject) => {
        // Auto-start location if possible
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        // Update map view to current position
                        const coords = [position.coords.latitude, position.coords.longitude];
                        map.setView(coords, 15);
                        
                        // Update state and UI
                        state.currentPosition = { lat: coords[0], lng: coords[1] };
                        updateUserLocationMarker(coords);
                        
                        // If locate control is available, start it
                        if (locateControl && typeof locateControl.start === 'function') {
                            try {
                                await locateControl.start();
                            } catch (err) {
                                console.warn('Could not start locate control:', err);
                                // Continue without locate control
                            }
                        }
                        
                        resolve(map);
                    } catch (err) {
                        console.error('Error processing location:', err);
                        resolve(map);
                    }
                },
                (err) => {
                    console.warn('Geolocation permission denied or error:', err);
                    resolve(map);
                },
                { 
                    enableHighAccuracy: true, 
                    timeout: 10000, 
                    maximumAge: 0 
                }
            );
        } else {
            // Geolocation not supported, just resolve with the map
            console.warn('Geolocation is not supported by this browser');
            resolve(map);
        }
    });
}

/**
 * Get user's current location
 * @returns {Promise} - Promise containing coords or error
 */
async function getUserLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by your browser'));
            return;
        }
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = [position.coords.latitude, position.coords.longitude];
                currentPosition = coords;
                resolve(coords);
            },
            (error) => {
                reject(error);
            },
            { enableHighAccuracy: true }
        );
    });
}

/**
 * Add user marker to map
 * @param {Array} coords - User coordinates [latitude, longitude]
 * @returns {Object} - Leaflet marker instance
 */
function addUserMarker(coords) {
    // Remove existing user marker if it exists
    if (userMarker) {
        map.removeLayer(userMarker);
    }
    
    // Create custom user marker icon
    const userIcon = L.divIcon({
        className: 'user-marker',
        html: '<div class="user-marker-icon">🧑</div>',
        iconSize: [30, 30],
        iconAnchor: [15, 15]
    });
    
    // Create user marker
    userMarker = L.marker(coords, { icon: userIcon })
        .addTo(map)
        .bindPopup('Your location')
        .openPopup();
    
    return userMarker;
}

/**
 * Add a radius circle to the map
 * @param {Array} coords - [lat, lng] coordinates
 * @param {Number} radius - radius in kilometers
 * @returns {Object} - Leaflet circle object
 */
function addRadiusCircle(coords, radius = 5) {
    // Remove existing circle if it exists
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }
    
    // Create new circle with the specified radius
    radiusCircle = L.circle(coords, {
        radius: radius * 1000, // Convert km to meters
        color: '#4CAF50',
        fillColor: '#4CAF50',
        fillOpacity: 0.2, // Increase opacity for better visibility
        weight: 2
    }).addTo(map);
    
    currentRadius = radius;
    
    return radiusCircle;
}

/**
 * Fetch nearby trash collection requests
 * @param {Array} coords - Center coordinates [latitude, longitude]
 * @param {Number} radius - Search radius in kilometers
 * @param {String} trashType - Type of trash to filter by
 * @returns {Promise} - Promise containing request data or error
 */
async function fetchNearbyRequests(coords, radius = 5, trashType = 'all') {
    try {
        // Clear existing request markers
        clearRequestMarkers();
        
        // Store the latest requests for list view access
        window.currentRequests = [];
        
        // Ensure we have valid coordinates
        let centerLat, centerLng;
        
        if (Array.isArray(coords)) {
            [centerLat, centerLng] = coords;
        } else if (coords && typeof coords === 'object') {
            centerLat = coords.lat || coords.latitude || 5.6037; // Default to Accra coordinates
            centerLng = coords.lng || coords.longitude || -0.1870;
        } else {
            // Fallback to default coordinates if coords is invalid
            centerLat = 5.6037;
            centerLng = -0.1870;
        }
        
        // Ensure coordinates are numbers
        centerLat = parseFloat(centerLat) || 5.6037;
        centerLng = parseFloat(centerLng) || -0.1870;
        
        // Check if we're in development mode (using mock data)
        const isDev = window.isDevelopment && !window.forceDirectConnection && 
                     !window.location.hostname.includes('ngrok-free.app');
        
        let requests = [];
        
        if (isDev) {
            // In development, use mock data
            console.log('🔧 Development mode: Using mock data');
            await new Promise(resolve => setTimeout(resolve, 500));
            requests = generateDummyRequests([centerLat, centerLng], radius, 10);
        } else {
            // In production or ngrok, use real API
            try {
                console.log('🌐 Fetching requests from API...');
                const response = await fetch(window.SUPABASE_CONFIG.getApiUrl('REQUESTS_NEARBY'), {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': window.SUPABASE_CONFIG.key,
                        'Authorization': `Bearer ${window.SUPABASE_CONFIG.key}`
                    },
                    body: JSON.stringify({
                        lat: centerLat,
                        lng: centerLng,
                        radius_km: radius,
                        trash_type: trashType === 'all' ? null : trashType
                    })
                });
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                requests = Array.isArray(data) ? data : [];
                console.log(`✅ Fetched ${requests.length} requests from API`);
                
            } catch (error) {
                console.error('API request failed, falling back to mock data', error);
                // Fall back to mock data if API fails
                requests = generateDummyRequests([centerLat, centerLng], radius, 5);
            }
        }
        
        // Filter requests by trash type if needed
        const filteredRequests = trashType === 'all' 
            ? requests 
            : requests.filter(req => req && req.type === trashType);
        
        // Sort by distance
        filteredRequests.sort((a, b) => {
            const distA = typeof a.distance === 'number' ? a.distance : parseFloat(a.distance) || 0;
            const distB = typeof b.distance === 'number' ? b.distance : parseFloat(b.distance) || 0;
            return distA - distB;
        });
        
        // Store the latest requests for list view access
        window.currentRequests = filteredRequests.filter(Boolean);
        
        // Add markers for each request
        filteredRequests.forEach(request => {
            if (request) {
                addRequestMarker(request);
            }
        });
        
        // Update request count badge
        const badge = document.getElementById('requestCountBadge');
        if (badge) {
            badge.textContent = filteredRequests.length;
        }
        
        return filteredRequests;
    } catch (error) {
        console.error('Error fetching nearby requests:', error);
        throw error;
    }
}

/**
 * Generate dummy request data for demonstration
 * @param {Array} center - Center coordinates [latitude, longitude]
 * @param {Number} radius - Maximum radius in kilometers
 * @param {Number} count - Number of points to generate
 * @returns {Array} - Array of request objects
 */
function generateDummyRequests(center, radius = 5, count = 15) {
    const requests = [];
    const trashTypes = ['recyclable', 'general', 'hazardous'];
    const statuses = ['pending', 'accepted', 'completed'];
    
    // Ensure center is in the correct format
    let centerLat, centerLng;
    
    if (Array.isArray(center)) {
        [centerLat, centerLng] = center;
    } else if (center && typeof center === 'object') {
        centerLat = center.lat || center.latitude || 5.6037; // Default to Accra coordinates
        centerLng = center.lng || center.longitude || -0.1870;
    } else {
        // Fallback to default coordinates if center is invalid
        centerLat = 5.6037;
        centerLng = -0.1870;
    }
    
    // Ensure coordinates are numbers
    centerLat = parseFloat(centerLat) || 5.6037;
    centerLng = parseFloat(centerLng) || -0.1870;
    radius = parseFloat(radius) || 5;
    
    // Ensure we have at least 3 of each trash type for better filter demonstration
    for (let i = 0; i < count; i++) {
        try {
            // Generate random point within radius
            const angle = Math.random() * 2 * Math.PI;
            const distance = Math.random() * radius * 0.8; // 80% of radius to keep points inside
            
            // Convert distance to latitude/longitude offset
            const latOffset = (distance * Math.cos(angle)) / 111; // 1 degree lat ≈ 111 km
            const lngOffset = (distance * Math.sin(angle)) / (111 * Math.cos((centerLat * Math.PI) / 180));
            
            // Calculate final coordinates
            const latitude = centerLat + latOffset;
            const longitude = centerLng + lngOffset;
            
            // Skip if coordinates are invalid
            if (isNaN(latitude) || isNaN(longitude)) {
                console.warn('Skipping invalid coordinates');
                continue;
            }
            
            // For first 9 points, ensure even distribution (3 of each type)
            // For remaining points, use random types
            const trashType = i < 9 
                ? trashTypes[Math.min(Math.floor(i / 3), trashTypes.length - 1)] 
                : trashTypes[Math.floor(Math.random() * trashTypes.length)];
            
            const request = {
                id: i + 1,
                latitude,
                longitude,
                type: trashType,
                status: statuses[0], // Always pending for the map view
                bags: Math.floor(Math.random() * 5) + 1,
                points: Math.floor(Math.random() * 100) + 50,
                distance: parseFloat(distance.toFixed(1))
            };
            
            requests.push(request);
        } catch (error) {
            console.error('Error generating request:', error);
        }
    }
    
    return requests;
}

/**
 * Add request marker to map
 * @param {Object} request - Request data object
 * @returns {Object} - Leaflet marker instance
 */
function addRequestMarker(request) {
    try {
        // Validate request and coordinates
        if (!request || (isNaN(parseFloat(request.latitude)) || isNaN(parseFloat(request.longitude)))) {
            console.warn('Invalid request or coordinates:', request);
            return null;
        }
        
        // Parse coordinates to ensure they are numbers
        const lat = parseFloat(request.latitude);
        const lng = parseFloat(request.longitude);
        
        // Skip if coordinates are invalid
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.warn('Invalid coordinates:', { lat, lng });
            return null;
        }
        
        // Define marker icon based on trash type
        let iconHtml;
        let iconColor;
        
        switch (request.type) {
            case 'recyclable':
                iconHtml = '♻️';
                iconColor = '#4CAF50';
                break;
            case 'hazardous':
                iconHtml = '⚠️';
                iconColor = '#F44336';
                break;
            case 'general':
            default:
                iconHtml = '🗑️';
                iconColor = '#2196F3';
        }
        
        // Create custom icon
        const requestIcon = L.divIcon({
            className: 'request-marker',
            html: `<div class="request-marker-icon" style="background-color:${iconColor}">${iconHtml}</div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 18]
        });
        
        // Create marker with validated coordinates
        const marker = L.marker([lat, lng], { icon: requestIcon })
        .addTo(map)
        .bindPopup(`
            <div class="request-popup">
                <h3>Request #${request.id}</h3>
                <p><strong>Type:</strong> ${request.type.charAt(0).toUpperCase() + request.type.slice(1)}</p>
                <p><strong>Bags:</strong> ${request.bags}</p>
                <p><strong>Points:</strong> ${request.points}</p>
                <p><strong>Distance:</strong> ${request.distance} km</p>
                <button class="btn btn-small btn-primary accept-btn" data-id="${request.id}">Accept Request</button>
            </div>
        `);
    
    // Add event listener to accept button in popup
    marker.on('popupopen', () => {
        const acceptBtn = document.querySelector(`.accept-btn[data-id="${request.id}"]`);
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => acceptRequest(request.id));
        }
    });
    
    // Store marker in array
    requestMarkers.push(marker);
    
    return marker;
    } catch (error) {
        console.error('Error adding request marker:', error);
        return null;
    }
}

/**
 * Clear all request markers from map
 */
function clearRequestMarkers() {
    requestMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    
    requestMarkers = [];
}

/**
 * Accept a trash collection request
 * @param {Number} requestId - ID of the request to accept
 * @returns {Promise} - Promise containing success status or error
 */
async function acceptRequest(requestId) {
    try {
        // Check if we're in development mode (using mock data)
        const isDev = window.isDevelopment && !window.forceDirectConnection && 
                    !window.location.hostname.includes('ngrok-free.app');
        
        if (isDev) {
            // In development, simulate API call delay
            console.log('🔧 Development mode: Simulating request acceptance');
            await new Promise(resolve => setTimeout(resolve, 800));
        } else {
            // In production or ngrok, use real API
            console.log(`🌐 Accepting request #${requestId} via API...`);
            const response = await fetch(window.SUPABASE_CONFIG.getApiUrl('ACCEPT_REQUEST'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_CONFIG.key,
                    'Authorization': `Bearer ${window.SUPABASE_CONFIG.key}`
                },
                body: JSON.stringify({
                    request_id: requestId,
                    collector_id: window.currentUser?.id || 'anonymous-collector'
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API request failed with status ${response.status}`);
            }
            
            console.log(`✅ Request #${requestId} accepted successfully`);
        }
        
        // Show success notification
        window.showNotification(`Request #${requestId} accepted successfully!`, 'success');
        
        // Redirect to request page with accepted tab active
        window.location.href = './request.html?tab=accepted';
        
        return {
            success: true,
            message: `Request #${requestId} accepted successfully!`
        };
    } catch (error) {
        console.error('Error accepting request:', error);
        window.showNotification(`Failed to accept request #${requestId}`, 'error');
        throw error;
    }
}

/**
 * Filter requests by trash type
 * @param {String} trashType - Type of trash to filter by
 */
function filterRequestsByType(trashType) {
    console.log('Filtering by trash type:', trashType);
    const state = window.TrashDrop.state;
    state.currentTrashType = trashType;
    
    if (state.currentPosition) {
        try {
            // Clear existing markers first
            clearRequestMarkers();
            
            // Add/update radius circle with current radius
            if (radiusCircle) {
                radiusCircle.remove();
            }
            radiusCircle = addRadiusCircle(
                [state.currentPosition.lat, state.currentPosition.lng], 
                state.currentRadius
            );
            
            // Fetch new requests with the applied filter
            return fetchNearbyRequests(
                state.currentPosition,
                state.currentRadius,
                trashType
            );
        } catch (error) {
            console.error('Error applying filter:', error);
            return Promise.reject(error);
        }
    } else {
        console.log('Current position not available, saving filter preference only');
        return Promise.resolve();
    }
}

/**
 * Update map when radius changes
 * @param {Number} radius - New radius in kilometers
 */
function updateRadius(radius) {
    const state = window.TrashDrop.state;
    state.currentRadius = parseInt(radius);
    
    if (state.currentPosition) {
        try {
            // Update radius circle
            if (radiusCircle) {
                radiusCircle.remove();
            }
            radiusCircle = addRadiusCircle(
                [state.currentPosition.lat, state.currentPosition.lng],
                state.currentRadius
            );
            
            // Fetch requests with new radius
            return fetchNearbyRequests(
                state.currentPosition,
                state.currentRadius,
                state.currentTrashType
            );
        } catch (error) {
            console.error('Error updating radius:', error);
            return Promise.reject(error);
        }
    } else {
        console.log('Current position not available, saving radius preference only');
        return Promise.resolve();
    }
}

/**
 * Navigate to list view with current filters
 */
function navigateToListView() {
    // Save current position in sessionStorage
    if (currentPosition) {
        sessionStorage.setItem('mapLatitude', currentPosition[0]);
        sessionStorage.setItem('mapLongitude', currentPosition[1]);
    }

    // Navigate to request page with filters as URL parameters
    window.location.href = `./request.html?tab=available&radius=${currentRadius}&type=${currentTrashType}`;
}

/**
 * Update user online/offline status in database
 * @param {Boolean} isOnline - User's online status
 * @returns {Promise} - Promise containing success status or error
 */
async function updateUserStatus(isOnline) {
    try {
        // Check if we're in development mode (using mock data)
        const isDev = window.isDevelopment && !window.forceDirectConnection && 
                    !window.location.hostname.includes('ngrok-free.app');
        
        if (isDev) {
            // In development, simulate API call
            console.log(`🔧 Development mode: Simulating status update to ${isOnline ? 'online' : 'offline'}`);
            await new Promise(resolve => setTimeout(resolve, 300));
        } else {
            // In production or ngrok, use real API
            console.log(`🌐 Updating collector status to ${isOnline ? 'online' : 'offline'}...`);
            const response = await fetch(window.SUPABASE_CONFIG.getApiUrl('UPDATE_STATUS'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_CONFIG.key,
                    'Authorization': `Bearer ${window.SUPABASE_CONFIG.key}`
                },
                body: JSON.stringify({
                    collector_id: window.currentUser?.id || 'anonymous-collector',
                    is_online: isOnline,
                    last_active: new Date().toISOString()
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Failed to update status: ${response.status}`);
            }
            
            console.log(`✅ Collector status updated to ${isOnline ? 'online' : 'offline'}`);
        }
        
        // Store status in localStorage for persistence across page loads
        localStorage.setItem('collectorOnlineStatus', isOnline ? 'online' : 'offline');
        
        return {
            success: true,
            isOnline
        };
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    }
}

// Export functions
window.initMap = initMap;
window.getUserLocation = getUserLocation;
window.addUserMarker = addUserMarker;
window.addRadiusCircle = addRadiusCircle;
window.fetchNearbyRequests = fetchNearbyRequests;
window.addRequestMarker = addRequestMarker;
window.clearRequestMarkers = clearRequestMarkers;
window.acceptRequest = acceptRequest;
window.filterRequestsByType = filterRequestsByType;
window.updateRadius = updateRadius;
window.navigateToListView = navigateToListView;
window.updateUserStatus = updateUserStatus;

// Initialize global state if not already done
if (!window.TrashDrop) {
    window.TrashDrop = {
        state: {
            currentPosition: null,
            currentRadius: 5,
            currentTrashType: 'all',
            mapInitialized: false,
            filtersInitialized: false
        },
        map: null,
        locateControl: null
    };
}
