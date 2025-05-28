/**
 * TrashDrop Collector - Mock Data
 * Provides mock data for development environment
 */

// Mock requests data
const mockAvailableRequests = [
    {
        id: 'req-001',
        name: 'John Doe',
        address: '123 Main St, Anytown',
        timestamp: new Date().toISOString(),
        bags: 2,
        points: 20,
        fee: 5.00,
        coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    {
        id: 'req-002',
        name: 'Jane Smith',
        address: '456 Elm St, Otherville',
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        bags: 1,
        points: 10,
        fee: 2.50,
        coordinates: { lat: 37.7833, lng: -122.4167 }
    },
    {
        id: 'req-003',
        name: 'Bob Johnson',
        address: '789 Oak St, Somewhere',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        bags: 3,
        points: 30,
        fee: 7.50,
        coordinates: { lat: 37.7694, lng: -122.4862 }
    }
];

const mockAcceptedRequests = [
    {
        id: 'req-004',
        name: 'Alice Williams',
        address: '321 Pine St, Nowhere',
        timestamp: new Date(Date.now() - 10800000).toISOString(),
        bags: 2,
        points: 20,
        fee: 5.00,
        coordinates: { lat: 37.7815, lng: -122.4158 }
    }
];

const mockPickedUpRequests = [
    {
        id: 'req-005',
        name: 'Charlie Brown',
        address: '654 Maple St, Elsewhere',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        bags: 1,
        points: 10,
        fee: 2.50,
        coordinates: { lat: 37.7857, lng: -122.4057 }
    }
];

/**
 * Load mock requests data
 */
async function loadMockRequests() {
    console.log('Loading mock requests data');
    
    // Populate global variables with mock data
    if (typeof window.availableRequests !== 'undefined') {
        window.availableRequests = mockAvailableRequests;
    }
    
    if (typeof window.acceptedRequests !== 'undefined') {
        window.acceptedRequests = mockAcceptedRequests;
    }
    
    if (typeof window.pickedUpRequests !== 'undefined') {
        window.pickedUpRequests = mockPickedUpRequests;
    }
    
    // Render mock data to the UI if displaying elements exist
    setTimeout(() => {
        renderMockRequests();
    }, 100);
    
    return { available: mockAvailableRequests, accepted: mockAcceptedRequests, pickedUp: mockPickedUpRequests };
}

/**
 * Render mock requests to the UI
 */
function renderMockRequests() {
    // Available requests
    const availableEl = document.getElementById('availableRequests');
    if (availableEl) {
        availableEl.innerHTML = mockAvailableRequests.map(req => `
            <div class="request-card" data-id="${req.id}">
                <div class="request-header">
                    <h3>${req.name}</h3>
                    <span class="timestamp">${formatTimestamp(req.timestamp)}</span>
                </div>
                <p class="address">${req.address}</p>
                <div class="request-details">
                    <span class="bags">${req.bags} bag${req.bags !== 1 ? 's' : ''}</span>
                    <span class="points">${req.points} points</span>
                    <span class="fee">$${req.fee.toFixed(2)}</span>
                </div>
                <button class="btn primary-btn accept-btn">Accept</button>
            </div>
        `).join('');
    }
    
    // Accepted requests
    const acceptedEl = document.getElementById('acceptedRequests');
    if (acceptedEl) {
        acceptedEl.innerHTML = mockAcceptedRequests.map(req => `
            <div class="request-card" data-id="${req.id}">
                <div class="request-header">
                    <h3>${req.name}</h3>
                    <span class="timestamp">${formatTimestamp(req.timestamp)}</span>
                </div>
                <p class="address">${req.address}</p>
                <div class="request-details">
                    <span class="bags">${req.bags} bag${req.bags !== 1 ? 's' : ''}</span>
                    <span class="points">${req.points} points</span>
                    <span class="fee">$${req.fee.toFixed(2)}</span>
                </div>
                <button class="btn primary-btn scan-btn">Scan QR</button>
                <button class="btn secondary-btn map-btn">View on Map</button>
            </div>
        `).join('');
    }
    
    // Picked up requests
    const pickedUpEl = document.getElementById('pickedUpRequests');
    if (pickedUpEl) {
        pickedUpEl.innerHTML = mockPickedUpRequests.map(req => `
            <div class="request-card" data-id="${req.id}">
                <div class="request-header">
                    <h3>${req.name}</h3>
                    <span class="timestamp">${formatTimestamp(req.timestamp)}</span>
                </div>
                <p class="address">${req.address}</p>
                <div class="request-details">
                    <span class="bags">${req.bags} bag${req.bags !== 1 ? 's' : ''}</span>
                    <span class="points">${req.points} points</span>
                    <span class="fee">$${req.fee.toFixed(2)}</span>
                </div>
            </div>
        `).join('');
    }
    
    console.log('Mock requests rendered to UI');
}

/**
 * Format timestamp to readable string
 * @param {String} timestamp - ISO timestamp
 * @returns {String} - Formatted time string
 */
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
        return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    }
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
        return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
}

// Make functions available globally
window.loadMockRequests = loadMockRequests;
window.renderMockRequests = renderMockRequests;
