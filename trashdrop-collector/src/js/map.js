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
// Current position
let currentPosition = null;
// Current radius in km
let currentRadius = 5;
// Current trash type filter
let currentTrashType = 'all';

/**
 * Initialize the map
 * @param {Array} coords - Initial coordinates [latitude, longitude]
 * @returns {Object} - Leaflet map instance
 */
function initMap(coords = [5.6037, -0.1870]) {
    // Create map instance
    map = L.map('map').setView(coords, 13);
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    return map;
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
 * Add radius circle around user
 * @param {Array} coords - Center coordinates [latitude, longitude]
 * @param {Number} radius - Circle radius in kilometers
 * @returns {Object} - Leaflet circle instance
 */
function addRadiusCircle(coords, radius = 5) {
    // Remove existing radius circle if it exists
    if (radiusCircle) {
        map.removeLayer(radiusCircle);
    }
    
    // Create radius circle
    radiusCircle = L.circle(coords, {
        color: '#4CAF50',
        fillColor: '#4CAF50',
        fillOpacity: 0.1,
        radius: radius * 1000 // Convert to meters
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
        
        // In production, this would be a Supabase query like:
        // const { data, error } = await supabase
        //    .from('requests')
        //    .select('*')
        //    .eq('status', 'pending')
        //    .filter('type', trashType === 'all' ? 'neq' : 'eq', trashType === 'all' ? null : trashType)
        //    .filter('distance_from_point', 'lt', radius)
        //    .order('distance', { ascending: true });
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Generate random points within the radius
        const dummyRequests = generateDummyRequests(coords, radius, 10);
        
        // Filter requests by trash type if needed
        const filteredRequests = trashType === 'all' 
            ? dummyRequests 
            : dummyRequests.filter(req => req.type === trashType);
            
        // Sort by distance
        filteredRequests.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        
        // Store the latest requests for list view access
        window.currentRequests = filteredRequests;
        
        // Add markers for each request
        filteredRequests.forEach(addRequestMarker);
        
        // Update request count badge
        document.getElementById('requestCountBadge').textContent = filteredRequests.length;
        
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
function generateDummyRequests(center, radius, count = 10) {
    const requests = [];
    const trashTypes = ['recyclable', 'general', 'hazardous'];
    const statuses = ['pending', 'accepted', 'completed'];
    
    for (let i = 0; i < count; i++) {
        // Generate random point within radius
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * radius * 0.8; // 80% of radius to keep points inside
        
        // Convert distance to latitude/longitude offset
        const latOffset = distance * Math.cos(angle) / 111; // 1 degree lat ≈ 111 km
        const lngOffset = distance * Math.sin(angle) / (111 * Math.cos(center[0] * Math.PI / 180));
        
        const request = {
            id: i + 1,
            latitude: center[0] + latOffset,
            longitude: center[1] + lngOffset,
            type: trashTypes[Math.floor(Math.random() * trashTypes.length)],
            status: statuses[0], // Always pending for the map view
            bags: Math.floor(Math.random() * 5) + 1,
            points: Math.floor(Math.random() * 100) + 50,
            distance: (distance).toFixed(1)
        };
        
        requests.push(request);
    }
    
    return requests;
}

/**
 * Add request marker to map
 * @param {Object} request - Request data object
 * @returns {Object} - Leaflet marker instance
 */
function addRequestMarker(request) {
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
    
    // Create marker
    const marker = L.marker([request.latitude, request.longitude], { icon: requestIcon })
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
        // In production, this would be a Supabase query like:
        // const { data, error } = await supabase
        //    .from('requests')
        //    .update({ status: 'accepted', collector_id: user.id })
        //    .eq('id', requestId);
        
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
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
    currentTrashType = trashType;
    
    if (currentPosition) {
        fetchNearbyRequests(currentPosition, currentRadius, trashType);
        
        // Save current filter settings in sessionStorage for list view access
        sessionStorage.setItem('currentTrashType', trashType);
    }
}

/**
 * Update map when radius changes
 * @param {Number} radius - New radius in kilometers
 */
function updateRadius(radius) {
    currentRadius = radius;
    
    if (currentPosition) {
        addRadiusCircle(currentPosition, radius);
        fetchNearbyRequests(currentPosition, radius, currentTrashType);
        
        // Save current filter settings in sessionStorage for list view access
        sessionStorage.setItem('currentRadius', radius);
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
        // In production, this would be a Supabase query like:
        // const { data, error } = await supabase
        //    .from('collectors')
        //    .update({ is_online: isOnline, last_active: new Date() })
        //    .eq('user_id', user.id);

        // For demo, just simulate success
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Store status in localStorage for persistence across page loads
        localStorage.setItem('collectorOnlineStatus', isOnline ? 'online' : 'offline');
        
        return {
            success: true
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
window.filterRequestsByType = filterRequestsByType;
window.updateRadius = updateRadius;
window.acceptRequest = acceptRequest;
window.navigateToListView = navigateToListView;
window.updateUserStatus = updateUserStatus;
