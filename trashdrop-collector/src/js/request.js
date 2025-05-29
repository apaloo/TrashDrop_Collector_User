/**
 * TrashDrop Collector - Request Module
 * Handles request listing, acceptance, and pickup functionality
 */

// Store requests by status
let availableRequests = [];
let acceptedRequests = [];
let pickedUpRequests = [];
let currentRequestId = null;
let scannedBags = [];

// DOM Elements
let tabElements;
let tabContentElements;
let availableRequestsElement;
let acceptedRequestsElement;
let pickedUpRequestsElement;
let qrScannerModal;
let scanResultElement;
let scannedBagsTable;
let totalPointsElement;
let totalFeeElement;
let completePickupBtn;

/**
 * Initialize the request page
 */
async function initRequestPage() {
    console.log('Initializing request page...');
    
    // *** IMPORTANT: Skip authentication entirely in development ***
    // This ensures the page loads regardless of auth state in development
    const isDevelopment = window.bypassAuthForDev || 
                         window.location.hostname === 'localhost' || 
                         window.location.hostname.includes('127.0.0.1') ||
                         window.location.port === '5500' ||
                         window.location.port === '5501';
    
    if (isDevelopment) {
        console.log('Development mode detected - bypassing authentication checks');
        // Create mock user for development if needed
        if (!localStorage.getItem('mockUser')) {
            const mockUser = {
                id: 'dev-user-' + Date.now(),
                email: 'dev@example.com',
                name: 'Development User',
                created_at: new Date().toISOString(),
                role: 'collector'
            };
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            console.log('Created development mock user');
        }
    } else {
        // Only do minimal auth check in production to avoid redirects
        const hasLocalStorageUser = localStorage.getItem('mockUser') !== null;
        const hasAppStateUser = window.appState && window.appState.user;
        
        if (!hasLocalStorageUser && !hasAppStateUser) {
            console.log('No authentication detected in production mode');
        }
        // Continue without redirecting even if no user found
    }
    
    // Get DOM elements
    tabElements = document.querySelectorAll('.tab');
    tabContentElements = document.querySelectorAll('.tab-content');
    availableRequestsElement = document.getElementById('availableRequests');
    acceptedRequestsElement = document.getElementById('acceptedRequests');
    pickedUpRequestsElement = document.getElementById('pickedUpRequests');
    qrScannerModal = document.getElementById('qrScannerModal');
    scanResultElement = document.getElementById('scanResult');
    scannedBagsTable = document.getElementById('scannedBagsTable');
    totalPointsElement = document.getElementById('totalPoints');
    totalFeeElement = document.getElementById('totalFee');
    completePickupBtn = document.getElementById('completePickupBtn');
    
    // Add event listeners for tabs
    tabElements.forEach(tab => {
        tab.addEventListener('click', () => {
            switchTab(tab.getAttribute('data-tab'));
        });
    });
    
    // Set up modal close button
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            qrScannerModal.style.display = 'none';
        });
    }
    
    // Complete pickup button event listener
    if (completePickupBtn) {
        completePickupBtn.addEventListener('click', completePickup);
    }
    
    // Load requests data
    try {
        // Check if loadRequests exists before calling it
        if (typeof loadRequests === 'function') {
            await loadRequests();
        } else {
            console.warn('loadRequests function not defined');
            // Mock data for development
            if (isDevelopment) {
                await loadMockRequests();
            }
        }
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

/**
 * Switch between tabs
 * @param {String} tabId - ID of the tab to switch to
 */
function switchTab(tabId) {
    // Update active tab
    tabElements.forEach(tab => {
        if (tab.getAttribute('data-tab') === tabId) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update active tab content
    tabContentElements.forEach(content => {
        if (content.id === tabId + 'Tab') {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

/**
 * Load all requests and sort them by status
 */
async function loadRequests() {
    try {
        // In a real app, this would fetch requests from Supabase
        // For now, generate dummy data
        const dummyData = await generateDummyRequests();
        
        // Sort requests by status
        availableRequests = dummyData.filter(req => req.status === 'pending');
        acceptedRequests = dummyData.filter(req => req.status === 'accepted');
        pickedUpRequests = dummyData.filter(req => req.status === 'completed');
        
        // Sort available requests by distance
        availableRequests.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
        
        // Render requests in each tab
        renderAvailableRequests();
        renderAcceptedRequests();
        renderPickedUpRequests();
    } catch (error) {
        console.error('Error loading requests:', error);
    }
}

/**
 * Generate dummy request data for demonstration
 * @returns {Array} - Array of request objects
 */
async function generateDummyRequests() {
    // Get current location for realistic distances
    let center = [5.6037, -0.1870]; // Default: Accra, Ghana
    
    // Use cached position if available instead of requesting new permissions
    if (window.appState && window.appState.lastKnownPosition) {
        center = [window.appState.lastKnownPosition.latitude, window.appState.lastKnownPosition.longitude];
        console.log('Using cached position for request generation');
    } else {
        console.log('No cached position available, using default coordinates');
    }
    
    const requests = [];
    const trashTypes = ['recyclable', 'general', 'hazardous'];
    const statuses = ['pending', 'accepted', 'completed'];
    const streetNames = [
        'Main Street', 'Oak Avenue', 'Maple Road', 'Park Boulevard', 
        'Cedar Lane', 'Pine Street', 'Elm Road', 'River Drive',
        'Lake View', 'Forest Avenue', 'Mountain Drive', 'Valley Road'
    ];
    
    // Generate 15 random requests
    for (let i = 0; i < 15; i++) {
        // Generate random point within 10km
        const angle = Math.random() * 2 * Math.PI;
        const distance = Math.random() * 10;
        
        // Convert distance to latitude/longitude offset
        const latOffset = distance * Math.cos(angle) / 111;
        const lngOffset = distance * Math.sin(angle) / (111 * Math.cos(center[0] * Math.PI / 180));
        
        // Random house number
        const houseNumber = Math.floor(Math.random() * 1000) + 1;
        const streetName = streetNames[Math.floor(Math.random() * streetNames.length)];
        
        // Determine status based on index (for demo distribution)
        const status = i < 8 ? statuses[0] : (i < 12 ? statuses[1] : statuses[2]);
        
        const request = {
            id: i + 1,
            latitude: center[0] + latOffset,
            longitude: center[1] + lngOffset,
            type: trashTypes[Math.floor(Math.random() * trashTypes.length)],
            status: status,
            bags: Math.floor(Math.random() * 5) + 1,
            points: Math.floor(Math.random() * 100) + 50,
            fee: ((Math.random() * 20) + 5).toFixed(2),
            distance: distance.toFixed(1),
            address: `${houseNumber} ${streetName}`,
            timestamp: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
        };
        
        requests.push(request);
    }
    
    return requests;
}

/**
 * Render available requests in the Available tab
 */
function renderAvailableRequests() {
    if (availableRequests.length === 0) {
        availableRequestsElement.innerHTML = '<p class="empty-state">No available requests in your area</p>';
        return;
    }
    
    let html = '';
    
    for (const request of availableRequests) {
        html += `
            <div class="request-item" data-id="${request.id}">
                <div class="request-details">
                    <div>
                        <span class="request-type ${request.type}">${capitalizeFirstLetter(request.type)}</span>
                    </div>
                    <div class="request-distance">${request.distance} km away</div>
                </div>
                <div class="request-address">${request.address}</div>
                <div class="request-info">
                    <div>${request.bags} bag${request.bags > 1 ? 's' : ''}</div>
                    <div>${request.points} points</div>
                    <div>$${request.fee}</div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-primary accept-btn" data-id="${request.id}">
                        <span class="material-icons">check_circle</span> Accept
                    </button>
                </div>
            </div>
        `;
    }
    
    availableRequestsElement.innerHTML = html;
    
    // Add event listeners to accept buttons
    document.querySelectorAll('.accept-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.getAttribute('data-id'));
            acceptRequest(requestId);
        });
    });
}

/**
 * Render accepted requests in the Accepted tab
 */
function renderAcceptedRequests() {
    if (acceptedRequests.length === 0) {
        acceptedRequestsElement.innerHTML = '<p class="empty-state">No accepted requests</p>';
        return;
    }
    
    let html = '';
    
    for (const request of acceptedRequests) {
        html += `
            <div class="request-item" data-id="${request.id}">
                <div class="request-details">
                    <div>
                        <span class="request-type ${request.type}">${capitalizeFirstLetter(request.type)}</span>
                    </div>
                    <div class="request-distance">${request.distance} km away</div>
                </div>
                <div class="request-address">${request.address}</div>
                <div class="request-info">
                    <div>${request.bags} bag${request.bags > 1 ? 's' : ''}</div>
                    <div>${request.points} points</div>
                    <div>$${request.fee}</div>
                </div>
                <div class="request-actions">
                    <button class="btn btn-outline get-direction-btn" data-id="${request.id}" data-lat="${request.latitude}" data-lng="${request.longitude}">
                        <span class="material-icons">directions</span> Get Direction
                    </button>
                    <button class="btn btn-primary scan-qr-btn" data-id="${request.id}">
                        <span class="material-icons">qr_code_scanner</span> Scan QR Code
                    </button>
                </div>
            </div>
        `;
    }
    
    acceptedRequestsElement.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.get-direction-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const lat = e.target.getAttribute('data-lat');
            const lng = e.target.getAttribute('data-lng');
            openDirections(lat, lng);
        });
    });
    
    document.querySelectorAll('.scan-qr-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.getAttribute('data-id'));
            openQrScanner(requestId);
        });
    });
}

/**
 * Render picked up requests in the Picked Up tab
 */
function renderPickedUpRequests() {
    if (pickedUpRequests.length === 0) {
        pickedUpRequestsElement.innerHTML = '<p class="empty-state">No picked up requests</p>';
        return;
    }
    
    let html = '';
    
    for (const request of pickedUpRequests) {
        // Check if the request has been disposed
        const isDisposed = request.disposedAt !== undefined;
        
        html += `
            <div class="request-item" data-id="${request.id}">
                <div class="request-details">
                    <div>
                        <span class="request-type ${request.type}">${capitalizeFirstLetter(request.type)}</span>
                    </div>
                    <div class="request-distance">${request.distance} km away</div>
                </div>
                <div class="request-address">${request.address}</div>
                <div class="request-info">
                    <div>${request.bags} bag${request.bags > 1 ? 's' : ''}</div>
                    <div>${request.points} points</div>
                    <div>$${request.fee}</div>
                </div>
                <div class="request-info">
                    <div>Picked up: ${formatDate(request.timestamp)}</div>
                    ${isDisposed ? `<div>Disposed: ${formatDate(request.disposedAt)}</div>` : ''}
                </div>
                <div class="request-actions">
                    <button class="btn btn-outline locate-site-btn" data-id="${request.id}">
                        <span class="material-icons">location_on</span> Locate Dumping Site
                    </button>
                    ${isDisposed ? 
                        `<button class="btn btn-primary view-report-btn" data-id="${request.id}">
                            <span class="material-icons">description</span> View Report
                         </button>` : 
                        `<button class="btn btn-primary dispose-btn ${request.isNearDumpingSite ? '' : 'disabled'}" 
                                data-id="${request.id}" ${request.isNearDumpingSite ? '' : 'disabled'}>
                            <span class="material-icons">delete</span> Dispose Bag Now
                         </button>`
                    }
                </div>
            </div>
        `;
    }
    
    pickedUpRequestsElement.innerHTML = html;
    
    // Add event listeners to buttons
    document.querySelectorAll('.locate-site-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.getAttribute('data-id'));
            locateDumpingSite(requestId);
        });
    });
    
    document.querySelectorAll('.dispose-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.getAttribute('data-id'));
            openDisposeModal(requestId);
        });
    });
    
    document.querySelectorAll('.view-report-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const requestId = parseInt(e.target.getAttribute('data-id'));
            viewDisposalReport(requestId);
        });
    });
    
    // Check for nearby dumping sites every 30 seconds
    startGeofencingCheck();
}

/**
 * Accept a request
 * @param {Number} requestId - ID of the request to accept
 */
function acceptRequest(requestId) {
    // Find the request
    const requestIndex = availableRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
        console.error('Request not found');
        return;
    }
    
    // Update request status
    availableRequests[requestIndex].status = 'accepted';
    
    // Move request from available to accepted
    acceptedRequests.push(availableRequests[requestIndex]);
    availableRequests.splice(requestIndex, 1);
    
    // Re-render both lists
    renderAvailableRequests();
    renderAcceptedRequests();
    
    // Switch to Accepted tab
    switchTab('accepted');
    
    // Show confirmation message
    alert('Request accepted successfully!');
}

/**
 * Open map directions to a location
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 */
function openDirections(lat, lng) {
    // Check if the platform is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    // Construct the appropriate maps URL
    let url;
    if (isIOS) {
        url = `maps://maps.apple.com/?ll=${lat},${lng}&dirflg=d`;
    } else {
        url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    
    // Open the URL in a new tab
    window.open(url, '_blank');
}

/**
 * Open the QR scanner modal
 * @param {Number} requestId - ID of the request
 */
function openQrScanner(requestId) {
    currentRequestId = requestId;
    scannedBags = [];
    
    // Reset scanner UI
    scanResultElement.innerHTML = '';
    scannedBagsTable.innerHTML = '';
    totalPointsElement.textContent = '0';
    totalFeeElement.textContent = '$0.00';
    
    // Show modal
    qrScannerModal.style.display = 'block';
    
    // In a real app, this would initialize a QR scanner
    // For this demo, we'll simulate scanning with buttons
    
    // For demonstration purposes, add some test scan buttons
    let testScanUI = '<div style="text-align: center; margin-bottom: 20px;">';
    testScanUI += '<p>Demo Mode: Click buttons to simulate scanning QR codes</p>';
    testScanUI += '<button id="scanBag1" class="btn btn-outline">Scan Recyclable Bag</button> ';
    testScanUI += '<button id="scanBag2" class="btn btn-outline">Scan General Waste Bag</button> ';
    testScanUI += '<button id="scanBag3" class="btn btn-outline">Scan Hazardous Waste Bag</button>';
    testScanUI += '</div>';
    
    document.getElementById('qrScanner').innerHTML = testScanUI;
    
    // Add event listeners to test buttons
    document.getElementById('scanBag1').addEventListener('click', () => simulateQrScan('recyclable'));
    document.getElementById('scanBag2').addEventListener('click', () => simulateQrScan('general'));
    document.getElementById('scanBag3').addEventListener('click', () => simulateQrScan('hazardous'));
}

/**
 * Simulate scanning a QR code
 * @param {String} bagType - Type of bag
 */
function simulateQrScan(bagType) {
    // Generate a random bag ID
    const bagId = `BAG${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    
    // Generate random points and fee based on bag type
    let points, fee;
    
    switch (bagType) {
        case 'recyclable':
            points = Math.floor(Math.random() * 50) + 50;
            fee = ((Math.random() * 5) + 5).toFixed(2);
            break;
        case 'general':
            points = Math.floor(Math.random() * 30) + 20;
            fee = ((Math.random() * 3) + 2).toFixed(2);
            break;
        case 'hazardous':
            points = Math.floor(Math.random() * 100) + 100;
            fee = ((Math.random() * 10) + 10).toFixed(2);
            break;
        default:
            points = Math.floor(Math.random() * 50) + 10;
            fee = ((Math.random() * 5) + 1).toFixed(2);
    }
    
    // Add bag to scanned bags list
    scannedBags.push({
        bagId,
        type: bagType,
        points,
        fee
    });
    
    // Show success message
    scanResultElement.innerHTML = `<div class="alert alert-success">Successfully scanned bag ${bagId}</div>`;
    
    // Update table
    updateScannedBagsTable();
}

/**
 * Update the scanned bags table
 */
function updateScannedBagsTable() {
    let html = '';
    let totalPoints = 0;
    let totalFee = 0;
    
    for (const bag of scannedBags) {
        html += `
            <tr>
                <td>${bag.bagId}</td>
                <td>${capitalizeFirstLetter(bag.type)}</td>
                <td>${bag.points}</td>
                <td>$${bag.fee}</td>
            </tr>
        `;
        
        totalPoints += bag.points;
        totalFee += parseFloat(bag.fee);
    }
    
    scannedBagsTable.innerHTML = html;
    totalPointsElement.textContent = totalPoints;
    totalFeeElement.textContent = `$${totalFee.toFixed(2)}`;
}

/**
 * Complete the pickup process
 */
function completePickup() {
    if (scannedBags.length === 0) {
        alert('Please scan at least one bag before completing pickup');
        return;
    }
    
    // Find the request
    const requestIndex = acceptedRequests.findIndex(req => req.id === currentRequestId);
    
    if (requestIndex === -1) {
        console.error('Request not found');
        return;
    }
    
    // Update request status
    acceptedRequests[requestIndex].status = 'completed';
    acceptedRequests[requestIndex].timestamp = new Date().toISOString();
    acceptedRequests[requestIndex].scannedBags = [...scannedBags];
    
    // Move request from accepted to picked up
    pickedUpRequests.push(acceptedRequests[requestIndex]);
    acceptedRequests.splice(requestIndex, 1);
    
    // Close modal
    qrScannerModal.style.display = 'none';
    
    // Re-render both lists
    renderAcceptedRequests();
    renderPickedUpRequests();
    
    // Switch to Picked Up tab
    switchTab('pickedUp');
    
    // Show confirmation message
    alert('Pickup completed successfully!');
}

/**
 * Format a date string
 * @param {String} dateString - ISO date string
 * @returns {String} - Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Capitalize the first letter of a string
 * @param {String} string - String to capitalize
 * @returns {String} - Capitalized string
 */
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Locate the nearest dumping site
 * @param {Number} requestId - ID of the request
 */
function locateDumpingSite(requestId) {
    // Find the request
    const request = pickedUpRequests.find(req => req.id === requestId);
    
    if (!request) {
        console.error('Request not found');
        return;
    }
    
    // In a real application, you would query your database for the nearest dumping site
    // For this demo, we'll use a hardcoded dumping site location
    const nearestDumpingSite = getNearestDumpingSite(request.latitude, request.longitude);
    
    // Open map directions
    openDirections(nearestDumpingSite.latitude, nearestDumpingSite.longitude);
}

/**
 * Get the nearest dumping site
 * @param {Number} lat - Current latitude
 * @param {Number} lng - Current longitude
 * @returns {Object} - Nearest dumping site object
 */
function getNearestDumpingSite(lat, lng) {
    // In a real app, this would query a backend API for nearby dumping sites
    // For demo purposes, we'll use a few hardcoded sites
    const dumpingSites = [
        { id: 1, name: 'Central Recycling Center', latitude: lat + 0.01, longitude: lng + 0.01, type: 'recyclable' },
        { id: 2, name: 'West Waste Management', latitude: lat - 0.01, longitude: lng + 0.015, type: 'general' },
        { id: 3, name: 'North Hazardous Disposal', latitude: lat + 0.02, longitude: lng - 0.01, type: 'hazardous' }
    ];
    
    // Return a random site for demo purposes
    return dumpingSites[Math.floor(Math.random() * dumpingSites.length)];
}

/**
 * Dispose modal
 * @param {Number} requestId - ID of the request
 */
function openDisposeModal(requestId) {
    const request = pickedUpRequests.find(req => req.id === requestId);
    
    if (!request) {
        console.error('Request not found');
        return;
    }
    
    if (!request.isNearDumpingSite) {
        alert('You must be within 50 meters of a dumping site to dispose bags.');
        return;
    }
    
    // Create and show the dispose modal
    const modalHtml = `
        <div id="disposeModal" class="modal">
            <div class="modal-content">
                <span class="close-dispose-btn">&times;</span>
                <h2>Confirm Disposal</h2>
                <p>You are about to dispose ${request.bags} bag${request.bags > 1 ? 's' : ''} of ${request.type} waste at ${getNearestDumpingSite(request.latitude, request.longitude).name}.</p>
                
                <div class="request-info">
                    <div>${request.bags} bag${request.bags > 1 ? 's' : ''}</div>
                    <div>${request.points} points</div>
                    <div>$${request.fee}</div>
                </div>
                
                <button id="confirmDisposeBtn" class="btn btn-primary">Confirm Disposal</button>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    const disposeModal = document.getElementById('disposeModal');
    const closeBtn = document.querySelector('.close-dispose-btn');
    const confirmBtn = document.getElementById('confirmDisposeBtn');
    
    // Show the modal
    disposeModal.style.display = 'block';
    
    // Close modal event
    closeBtn.addEventListener('click', () => {
        disposeModal.style.display = 'none';
        document.body.removeChild(disposeModal);
    });
    
    // Confirm disposal event
    confirmBtn.addEventListener('click', () => {
        // Process the disposal
        processDisposal(requestId);
        
        // Close and remove the modal
        disposeModal.style.display = 'none';
        document.body.removeChild(disposeModal);
    });
}

/**
 * Process the disposal and credit the user's account
 * @param {Number} requestId - ID of the request
 */
function processDisposal(requestId) {
    // Find the request
    const requestIndex = pickedUpRequests.findIndex(req => req.id === requestId);
    
    if (requestIndex === -1) {
        console.error('Request not found');
        return;
    }
    
    // Update request status to disposed
    pickedUpRequests[requestIndex].disposedAt = new Date().toISOString();
    
    // Credit the user's account (in a real app, this would talk to the backend)
    const points = pickedUpRequests[requestIndex].points;
    const fee = parseFloat(pickedUpRequests[requestIndex].fee);
    
    // Update the user's account balance (simulated)
    const currentBalance = parseFloat(localStorage.getItem('userBalance') || '0');
    localStorage.setItem('userBalance', (currentBalance + fee).toFixed(2));
    
    // Update the user's points (simulated)
    const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
    localStorage.setItem('userPoints', currentPoints + points);
    
    // Re-render the picked up requests
    renderPickedUpRequests();
    
    // Show confirmation message
    alert(`Disposal successful! Your account has been credited with $${fee.toFixed(2)} and ${points} points.`);
}

/**
 * View the disposal report
 * @param {Number} requestId - ID of the request
 */
function viewDisposalReport(requestId) {
    const request = pickedUpRequests.find(req => req.id === requestId);
    
    if (!request) {
        console.error('Request not found');
        return;
    }
    
    if (!request.disposedAt) {
        alert('This request has not been disposed yet.');
        return;
    }
    
    // Create and show the report modal
    const modalHtml = `
        <div id="reportModal" class="modal">
            <div class="modal-content">
                <span class="close-report-btn">&times;</span>
                <h2>Disposal Report</h2>
                
                <div class="report-section">
                    <h3>Request Details</h3>
                    <p><strong>Type:</strong> ${capitalizeFirstLetter(request.type)}</p>
                    <p><strong>Location:</strong> ${request.address}</p>
                    <p><strong>Picked up:</strong> ${formatDate(request.timestamp)}</p>
                    <p><strong>Disposed:</strong> ${formatDate(request.disposedAt)}</p>
                </div>
                
                <div class="report-section">
                    <h3>Earnings</h3>
                    <p><strong>Bags:</strong> ${request.bags}</p>
                    <p><strong>Points earned:</strong> ${request.points}</p>
                    <p><strong>Fee earned:</strong> $${request.fee}</p>
                </div>
                
                <div class="report-section">
                    <h3>Environmental Impact</h3>
                    <p><strong>CO2 Saved:</strong> ${(Math.random() * 5).toFixed(2)} kg</p>
                    <p><strong>Water Saved:</strong> ${(Math.random() * 100).toFixed(2)} liters</p>
                </div>
                
                <button class="btn btn-primary close-report">Close Report</button>
            </div>
        </div>
    `;
    
    // Add the modal to the document
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    const reportModal = document.getElementById('reportModal');
    const closeBtn = document.querySelector('.close-report-btn');
    const closeReportBtn = document.querySelector('.close-report');
    
    // Show the modal
    reportModal.style.display = 'block';
    
    // Close modal events
    const closeModalFunction = () => {
        reportModal.style.display = 'none';
        document.body.removeChild(reportModal);
    };
    
    closeBtn.addEventListener('click', closeModalFunction);
    closeReportBtn.addEventListener('click', closeModalFunction);
}

// Geofencing variables
let geofencingInterval = null;

/**
 * Start checking for nearby dumping sites
 */
function startGeofencingCheck() {
    // Clear any existing interval
    if (geofencingInterval) {
        clearInterval(geofencingInterval);
    }
    
    // Immediately check once
    checkNearbyDumpingSites();
    
    // Then set up interval to check every 30 seconds
    geofencingInterval = setInterval(checkNearbyDumpingSites, 30000);
}

/**
 * Check if the user is near any dumping sites
 */
async function checkNearbyDumpingSites() {
    // Only proceed if we have picked-up requests
    if (pickedUpRequests.length === 0) {
        return;
    }
    
    try {
        // Use cached position if available instead of requesting new permissions
        let userLat, userLng;
        
        if (window.appState && window.appState.lastKnownPosition) {
            userLat = window.appState.lastKnownPosition.latitude;
            userLng = window.appState.lastKnownPosition.longitude;
            console.log('Using cached position for geofencing');
        } else {
            // Use default coordinates instead of requesting permissions
            userLat = 5.6037; // Default: Accra, Ghana
            userLng = -0.1870;
            console.log('No cached position available, using default coordinates for geofencing');
        }
        
        // Get nearby dumping sites
        const dumpingSites = [
            { id: 1, name: 'Central Recycling Center', latitude: userLat + 0.0004, longitude: userLng + 0.0004, type: 'recyclable' },
            { id: 2, name: 'West Waste Management', latitude: userLat - 0.0003, longitude: userLng + 0.0006, type: 'general' },
            { id: 3, name: 'North Hazardous Disposal', latitude: userLat + 0.0008, longitude: userLng - 0.0004, type: 'hazardous' }
        ];
        
        // For demo purposes, randomly choose one site to be nearby (50% chance)
        const isNearSite = Math.random() > 0.5;
        
        // Update each request's nearness status
        let anyRequestUpdated = false;
        
        for (const request of pickedUpRequests) {
            if (!request.disposedAt) { // Only update if not already disposed
                const wasNear = request.isNearDumpingSite || false;
                request.isNearDumpingSite = isNearSite;
                
                if (wasNear !== isNearSite) {
                    anyRequestUpdated = true;
                }
            }
        }
        
        // Re-render if any request's status changed
        if (anyRequestUpdated) {
            renderPickedUpRequests();
            
            if (isNearSite) {
                // Show a user-friendly notification when they come within range of a disposal site
                const nearestSite = dumpingSites[Math.floor(Math.random() * dumpingSites.length)];
                
                // Use showNotification if available instead of alert
                if (typeof window.showNotification === 'function') {
                    window.showNotification(`You are now within 50 meters of ${nearestSite.name}. You can now dispose your bags!`, 'info');
                } else {
                    // Create a non-blocking toast notification
                    const toast = document.createElement('div');
                    toast.className = 'toast-notification';
                    toast.textContent = `You are now within 50 meters of ${nearestSite.name}. You can now dispose your bags!`;
                    document.body.appendChild(toast);
                    
                    // Remove after 5 seconds
                    setTimeout(() => {
                        if (document.body.contains(toast)) {
                            document.body.removeChild(toast);
                        }
                    }, 5000);
                }
            }
        }
    } catch (error) {
        console.warn('Could not check for nearby dumping sites:', error);
    }
}

// Initialize the request page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initRequestPage);
