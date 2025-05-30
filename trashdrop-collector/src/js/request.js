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
        
        // Start geofencing check after requests are loaded and all functions are defined
        if (typeof startGeofencingCheck === 'function') {
            startGeofencingCheck();
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
        console.log('Loading requests...');
        // In a real app, this would fetch requests from Supabase
        // For now, generate dummy data
        const dummyData = await generateDummyRequests();
        console.log('Generated dummy data:', dummyData);
        
        if (!dummyData || !Array.isArray(dummyData)) {
            throw new Error('Invalid data received from generateDummyRequests');
        }
        
        // Sort requests by status
        availableRequests = dummyData.filter(req => req && req.status === 'pending');
        acceptedRequests = dummyData.filter(req => req && req.status === 'accepted');
        pickedUpRequests = dummyData.filter(req => req && req.status === 'completed');
        
        console.log('Requests by status:', {
            available: availableRequests.length,
            accepted: acceptedRequests.length,
            pickedUp: pickedUpRequests.length
        });
        
        // Sort available requests by distance
        availableRequests.sort((a, b) => {
            const distA = parseFloat(a.distance) || 0;
            const distB = parseFloat(b.distance) || 0;
            return distA - distB;
        });
        
        // Render requests in each tab
        renderAvailableRequests();
        renderAcceptedRequests();
        renderPickedUpRequests();
        
        console.log('Requests loaded successfully');
        return dummyData;
    } catch (error) {
        console.error('Error loading requests:', error);
        showNotification('Error loading requests. Please try again.', 'error');
        return [];
    }
}

/**
 * Load mock requests for development when loadRequests is not available
 */
async function loadMockRequests() {
    console.log('Loading mock requests...');
    try {
        const mockData = [
            {
                id: 'mock-1',
                status: 'pending',
                type: 'recyclable',
                bags: 2,
                points: 100,
                fee: '10.00',
                distance: '1.5',
                address: '123 Main St',
                timestamp: new Date().toISOString(),
                latitude: 5.6037,
                longitude: -0.1870
            },
            {
                id: 'mock-2',
                status: 'accepted',
                type: 'general',
                bags: 1,
                points: 75,
                fee: '8.50',
                distance: '2.3',
                address: '456 Oak Ave',
                timestamp: new Date().toISOString(),
                latitude: 5.6137,
                longitude: -0.1970
            },
            {
                id: 'mock-3',
                status: 'completed',
                type: 'hazardous',
                bags: 3,
                points: 150,
                fee: '15.00',
                distance: '0.8',
                address: '789 Pine St',
                timestamp: new Date().toISOString(),
                latitude: 5.5937,
                longitude: -0.1770,
                disposedAt: new Date().toISOString()
            }
        ];

        // Sort requests by status
        availableRequests = mockData.filter(req => req && req.status === 'pending');
        acceptedRequests = mockData.filter(req => req && req.status === 'accepted');
        pickedUpRequests = mockData.filter(req => req && req.status === 'completed');

        // Sort available requests by distance
        availableRequests.sort((a, b) => {
            const distA = parseFloat(a.distance) || 0;
            const distB = parseFloat(b.distance) || 0;
            return distA - distB;
        });

        // Render requests in each tab
        renderAvailableRequests();
        renderAcceptedRequests();
        renderPickedUpRequests();

        console.log('Mock requests loaded successfully');
        return mockData;
    } catch (error) {
        console.error('Error loading mock requests:', error);
        showNotification('Error loading mock requests', 'error');
        return [];
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
        availableRequestsElement.innerHTML = '<p class="empty-message">No available requests at this time.</p>';
        return;
    }
    
    const html = availableRequests.map(req => {
        // Get enhanced request if available
        const enhancedReq = window.getEnhancedRequest ? window.getEnhancedRequest(req.id) : null;
        
        // Add priority indicator if available from enhanced request
        const priorityHTML = enhancedReq && enhancedReq.priority ? 
            `<span class="priority-dot ${enhancedReq.priority}"></span>` : '';
        
        // Add trash type if available from enhanced request
        const trashTypeHTML = enhancedReq && enhancedReq.type ? 
            `<span class="trash-type ${enhancedReq.type}">${enhancedReq.type}</span>` : '';
        
        // Status corner for available requests (different color)
        const statusCornerHTML = `<div class="status-corner available"></div>`;
        
        return `
            <div class="request-card" data-id="${req.id}" onclick="viewRequestDetail('${req.id}')">
                ${statusCornerHTML}
                <div class="request-header">
                    <h3>${req.name || 'Anonymous'} ${priorityHTML}</h3>
                    <span class="timestamp">${formatDate(req.timestamp || req.created_at)}</span>
                </div>
                <p class="address">${req.address}</p>
                <div class="request-details">
                    <span class="bags">${req.bags} bag${req.bags !== 1 ? 's' : ''}</span>
                    <span class="points">${req.points} points</span>
                    <span class="fee">$${(typeof req.fee === 'number' ? req.fee.toFixed(2) : req.fee)}</span>
                    ${trashTypeHTML}
                </div>
                <button class="view-more-btn" onclick="toggleRequestDetails(this); event.stopPropagation();">
                    <span class="material-icons">expand_more</span>
                    <span>View More</span>
                </button>
                
                <div class="request-expanded-content">
                    <p><strong>Address:</strong> ${req.address || 'Not specified'}</p>
                    <p><strong>Bags:</strong> ${req.bags} bag${req.bags !== 1 ? 's' : ''}</p>
                    <p><strong>Points:</strong> ${req.points}</p>
                    <p><strong>Fee:</strong> $${typeof req.fee === 'number' ? req.fee.toFixed(2) : req.fee}</p>
                    ${req.distance ? `<p><strong>Distance:</strong> ${req.distance} km away</p>` : ''}
                </div>
                
                <div class="request-actions" style="display:flex;gap:0.5rem;margin-top:0.75rem;">
                    <button class="primary-btn" style="flex:1" data-id="${req.id}" onclick="acceptRequest('${req.id}'); event.stopPropagation();">
                        <span class="material-icons" style="font-size:16px;margin-right:4px;vertical-align:text-bottom;">check_circle</span>
                        Accept
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    availableRequestsElement.innerHTML = html;
}

/**
 * Render accepted requests in the Accepted tab
 */
function renderAcceptedRequests() {
    if (!acceptedRequestsElement) return;
    
    if (acceptedRequests.length === 0) {
        acceptedRequestsElement.innerHTML = '<p class="empty-message">No accepted requests at this time.</p>';
        return;
    }
    
    const html = acceptedRequests.map(req => {
        // Get enhanced request if available
        const enhancedReq = window.getEnhancedRequest ? window.getEnhancedRequest(req.id) : null;
        
        // Add priority indicator if available from enhanced request
        const priorityHTML = enhancedReq && enhancedReq.priority ? 
            `<span class="priority-dot ${enhancedReq.priority}"></span>` : '';
        
        // Add trash type if available from enhanced request
        const trashTypeHTML = enhancedReq && enhancedReq.type ? 
            `<span class="trash-type ${enhancedReq.type}">${enhancedReq.type}</span>` : '';
        
        // Add status corner indicator
        const statusCornerHTML = `<div class="status-corner accepted"></div>`;
        
        // Format accepted date if available
        let acceptedDateHTML = '';
        if (enhancedReq && enhancedReq.accepted_at) {
            const acceptedDate = new Date(enhancedReq.accepted_at);
            acceptedDateHTML = `
                <div class="additional-info">
                    <span>Accepted: ${formatDate(enhancedReq.accepted_at)}</span>
                </div>
            `;
        }
            
        return `
            <div class="request-card" data-id="${req.id}" onclick="viewRequestDetail('${req.id}')">
                ${statusCornerHTML}
                <div class="request-header">
                    <h3>${req.name || 'Anonymous'} ${priorityHTML}</h3>
                    <span class="timestamp">${formatDate(req.timestamp || req.created_at)}</span>
                </div>
                <p class="address">${req.address}</p>
                <div class="request-details">
                    <span class="bags">${req.bags} bag${req.bags !== 1 ? 's' : ''}</span>
                    <span class="points">${req.points} points</span>
                    <span class="fee">$${(typeof req.fee === 'number' ? req.fee.toFixed(2) : req.fee)}</span>
                    ${trashTypeHTML}
                </div>
                ${acceptedDateHTML}
                <div class="request-actions" style="display:flex;gap:0.5rem;margin-top:0.75rem;">
                    <button class="primary-btn" style="flex:1" onclick="openDirections(${req.coordinates ? req.coordinates.lat : req.latitude}, ${req.coordinates ? req.coordinates.lng : req.longitude}); event.stopPropagation();">
                        <span class="material-icons" style="font-size:16px;margin-right:4px;vertical-align:text-bottom;">directions</span> Directions
                    </button>
                    <button class="primary-btn" style="flex:1" onclick="openQrScanner('${req.id}'); event.stopPropagation();">
                        <span class="material-icons" style="font-size:16px;margin-right:4px;vertical-align:text-bottom;">qr_code_scanner</span> Scan QR
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    acceptedRequestsElement.innerHTML = html;
}

function renderPickedUpRequests() {
    if (!pickedUpRequestsElement) return;
    
    if (pickedUpRequests.length === 0) {
        pickedUpRequestsElement.innerHTML = '<p class="empty-message">No picked up requests at this time.</p>';
        return;
    }
    
    const html = pickedUpRequests.map(req => {
        // Ensure we have a valid request ID
        const requestId = req.id || req.requestId;
        if (!requestId) {
            console.error('Invalid request:', req);
            return '';
        }
        
        // Make sure we have required properties
        req.id = requestId; // Ensure consistent ID
        req.isNearDumpingSite = req.isNearDumpingSite !== undefined ? req.isNearDumpingSite : true; // Default to true if not set
        
        // Get enhanced request if available
        const enhancedReq = window.getEnhancedRequest ? window.getEnhancedRequest(requestId) : null;
        
        // Add priority indicator if available from enhanced request
        const priorityHTML = enhancedReq && enhancedReq.priority ? 
            `<span class="priority-dot ${enhancedReq.priority}"></span>` : '';
        
        // Add trash type if available from enhanced request
        const trashTypeHTML = enhancedReq && enhancedReq.type ? 
            `<span class="trash-type ${enhancedReq.type}">${enhancedReq.type}</span>` : '';
            
        // Check if the request has been disposed
        const isDisposed = req.disposedAt !== undefined;
        
        // Status corner for picked up requests (different color)
        const statusCornerHTML = `<div class="status-corner picked-up"></div>`;
        
        // Format timestamps
        const pickedUpDate = formatDate(req.timestamp || req.pickedUpAt);
        const disposedDate = isDisposed ? formatDate(req.disposedAt) : '';
        
        return `
            <div class="request-card" data-id="${req.id}">
                ${statusCornerHTML}
                <div class="request-header">
                    <h3>${req.name || 'Anonymous'} ${priorityHTML}</h3>
                    <span class="timestamp">${pickedUpDate}</span>
                </div>
                <p class="address">${req.address}</p>
                <div class="request-details">
                    <span class="bags">${req.bags} bag${req.bags !== 1 ? 's' : ''}</span>
                    <span class="points">${req.points} points</span>
                    <span class="fee">$${(typeof req.fee === 'number' ? req.fee.toFixed(2) : req.fee)}</span>
                    ${trashTypeHTML}
                </div>
                ${isDisposed ? `
                    <div class="additional-info">
                        <span>Disposed: ${disposedDate}</span>
                    </div>
                ` : ''}
                
                <button class="view-more-btn" onclick="toggleRequestDetails(this); event.stopPropagation();">
                    <span class="material-icons">expand_more</span>
                    <span>View More</span>
                </button>
                
                <div class="request-expanded-content">
                    <p><strong>Address:</strong> ${req.address || 'Not specified'}</p>
                    <p><strong>Picked Up:</strong> ${pickedUpDate}</p>
                    ${isDisposed ? `<p><strong>Disposed:</strong> ${disposedDate}</p>` : ''}
                    <p><strong>Bags:</strong> ${req.bags} bag${req.bags !== 1 ? 's' : ''}</p>
                    <p><strong>Points:</strong> ${req.points}</p>
                    <p><strong>Fee:</strong> $${typeof req.fee === 'number' ? req.fee.toFixed(2) : req.fee}</p>
                    ${req.distance ? `<p><strong>Distance:</strong> ${req.distance} km away</p>` : ''}
                </div>
                
                <div class="request-actions" style="display:flex;gap:0.5rem;margin-top:0.75rem;position:relative;z-index:2;">
                    <button class="primary-btn" style="flex:1;position:relative;z-index:3;" 
                            onclick="event.stopPropagation(); window.locateDumpingSite('${requestId}'); return false;">
                        <span class="material-icons" style="font-size:16px;margin-right:4px;vertical-align:text-bottom;">location_on</span>
                        Locate Site
                    </button>
                    ${isDisposed ? `
                        <button class="secondary-btn" style="flex:1;position:relative;z-index:3;" 
                                onclick="event.stopPropagation(); window.viewDisposalReport('${requestId}'); return false;">
                            <span class="material-icons" style="font-size:16px;margin-right:4px;vertical-align:text-bottom;">description</span>
                            View Report
                        </button>
                    ` : `
                        <button class="secondary-btn ${req.isNearDumpingSite ? '' : 'disabled'}" style="flex:1;position:relative;z-index:3;" 
                                onclick="event.stopPropagation(); if(!this.classList.contains('disabled')) { window.processDisposal('${requestId}'); } return false;"
                                ${req.isNearDumpingSite ? '' : 'disabled'}>
                            <span class="material-icons" style="font-size:16px;margin-right:4px;vertical-align:text-bottom;">delete</span>
                            Dispose Bag
                        </button>
                    `}
                </div>
            </div>
        `;
    }).join('');
    
    pickedUpRequestsElement.innerHTML = html;
    
    // Event listeners are now handled by inline onclick handlers in the HTML
    // No need for additional JavaScript event listeners here
}

/**
 * Accept a request
 * @param {Number} requestId - ID of the request to accept
 */
function acceptRequest(requestId) {
    // Convert ID to appropriate type for comparison (some may be strings, some numbers)
    const requestIdNum = parseInt(requestId, 10);
    
    // Find the request by either string or numeric ID
    const requestIndex = availableRequests.findIndex(req => 
        req.id === requestId || req.id === requestIdNum || req.id === requestId.toString()
    );
    
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
        return false;
    }
    
    if (!currentRequestId) {
        console.error('No current request ID set');
        alert('Error: No active request found. Please try again.');
        return false;
    }
    
    // Try to find the request in acceptedRequests first
    let requestIndex = acceptedRequests.findIndex(req => req.id == currentRequestId);
    let request = null;
    
    // If not found in acceptedRequests, try to find it in other request arrays
    if (requestIndex === -1) {
        // Check if the request exists in other arrays but wasn't in acceptedRequests
        const allRequests = [...acceptedRequests, ...pickedUpRequests, ...availableRequests];
        request = allRequests.find(req => req.id == currentRequestId);
        
        if (!request) {
            console.error('Request not found in any request array', { 
                currentRequestId, 
                acceptedRequests: acceptedRequests.map(r => r.id),
                pickedUpRequests: pickedUpRequests.map(r => r.id),
                availableRequests: availableRequests.map(r => r.id)
            });
            alert('Error: Could not find the request. It may have been cancelled or already completed.');
            return false;
        }
        
        // If we found the request but it's not in acceptedRequests, log a warning
        console.warn(`Request ${currentRequestId} found but not in acceptedRequests. Current status: ${request.status}`);
    } else {
        request = acceptedRequests[requestIndex];
    }
    
    // Update request status
    request.status = 'completed';
    request.timestamp = new Date().toISOString();
    request.scannedBags = [...scannedBags];
    
    // Only remove from acceptedRequests if that's where we found it
    if (requestIndex !== -1) {
        // Move request from accepted to picked up
        pickedUpRequests.push(acceptedRequests[requestIndex]);
        acceptedRequests.splice(requestIndex, 1);
    } else {
        // If it wasn't in acceptedRequests, just add it to pickedUpRequests
        pickedUpRequests.push(request);
        
        // Also remove it from other arrays if it exists there
        const pickedUpIndex = pickedUpRequests.findIndex(req => req.id == currentRequestId);
        if (pickedUpIndex !== -1) {
            pickedUpRequests.splice(pickedUpIndex, 1);
        }
        
        const availableIndex = availableRequests.findIndex(req => req.id == currentRequestId);
        if (availableIndex !== -1) {
            availableRequests.splice(availableIndex, 1);
        }
    }
    
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
 * Show request details in a notification
 * @param {Object} request - The request object
 */
function showRequestDetails(request) {
    // Format the message with request details
    const message = `
        <div style="text-align: left; line-height: 1.5;">
            <div style="font-weight: 500; margin-bottom: 8px;">${request.name || 'Anonymous'}</div>
            <div style="font-size: 0.9em; color: #555; margin-bottom: 8px;">
                ${request.address || 'No address provided'}
            </div>
            <div style="display: flex; gap: 12px; margin-bottom: 8px;">
                <span>${request.bags} bag${request.bags !== 1 ? 's' : ''}</span>
                <span>${request.points} points</span>
                <span>$${typeof request.fee === 'number' ? request.fee.toFixed(2) : request.fee}</span>
            </div>
            <div style="font-size: 0.85em; color: #666;">
                ${request.distance ? `${request.distance} km away` : ''}
            </div>
        </div>
    `;

    // Use the existing notification system if available
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'info', 5000);
    } else {
        // Fallback to alert if notification system isn't available
        alert(`Request Details:\n\n` +
              `Name: ${request.name || 'Anonymous'}\n` +
              `Address: ${request.address || 'No address provided'}\n` +
              `Bags: ${request.bags}\n` +
              `Points: ${request.points}\n` +
              `Fee: $${typeof request.fee === 'number' ? request.fee.toFixed(2) : request.fee}\n` +
              (request.distance ? `Distance: ${request.distance} km away` : ''));
    }
}

/**
 * Toggle the visibility of request details
 * @param {HTMLElement} button - The button that was clicked
 */
function toggleRequestDetails(button) {
    const card = button.closest('.request-card');
    const content = card.querySelector('.request-expanded-content');
    const icon = button.querySelector('.material-icons');
    
    // Toggle the expanded state
    content.classList.toggle('visible');
    button.classList.toggle('expanded');
    
    // Update the icon and text
    if (content.classList.contains('visible')) {
        button.querySelector('span:last-child').textContent = 'View Less';
    } else {
        button.querySelector('span:last-child').textContent = 'View More';
    }
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
 * @param {Number|String} requestId - ID of the request
 */
function locateDumpingSite(requestId) {
    console.log('Locating dumping site for request ID:', requestId);
    
    // Try to find the request in all request arrays
    let request = null;
    
    // First try to find in pickedUpRequests
    request = pickedUpRequests.find(req => 
        String(req.id) === String(requestId) || 
        String(req.requestId) === String(requestId)
    );
    
    // If not found, try in acceptedRequests
    if (!request) {
        request = acceptedRequests.find(req => 
            String(req.id) === String(requestId) || 
            String(req.requestId) === String(requestId)
        );
    }
    
    // If still not found, try in availableRequests
    if (!request) {
        request = availableRequests.find(req => 
            String(req.id) === String(requestId) || 
            String(req.requestId) === String(requestId)
        );
    }
    
    if (!request) {
        console.error('Request not found in any request array. ID:', requestId);
        console.log('Available request IDs:', {
            pickedUp: pickedUpRequests.map(r => r.id || r.requestId),
            accepted: acceptedRequests.map(r => r.id || r.requestId),
            available: availableRequests.map(r => r.id || r.requestId)
        });
        showNotification('Error: Could not find request details', 'error');
        return;
    }
    
    // Get coordinates from the request
    const lat = request.latitude || 0;
    const lng = request.longitude || 0;
    
    console.log('Using coordinates:', { lat, lng });
    
    // Get nearest dumping site (in a real app, this would be from your database)
    const nearestDumpingSite = getNearestDumpingSite(lat, lng);
    
    if (nearestDumpingSite && nearestDumpingSite.latitude && nearestDumpingSite.longitude) {
        console.log('Opening directions to:', nearestDumpingSite);
        openDirections(nearestDumpingSite.latitude, nearestDumpingSite.longitude);
    } else {
        console.error('Could not determine dumping site location');
        // Fallback to user's current location if available
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                openDirections(userLat, userLng);
            }, () => {
                // If geolocation fails, use the request location
                openDirections(lat, lng);
            });
        } else {
            // If geolocation is not available, use the request location
            openDirections(lat, lng);
        }
    }
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
 * Find a request by ID in any request array
 * @param {Number|String} requestId - ID of the request to find
 * @returns {Object|null} - The found request or null
 */
function findRequestById(requestId) {
    if (!requestId) return null;
    
    // Try to find in all request arrays
    const allRequests = [...pickedUpRequests, ...acceptedRequests, ...availableRequests];
    return allRequests.find(req => 
        (req.id !== undefined && String(req.id) === String(requestId)) || 
        (req.requestId !== undefined && String(req.requestId) === String(requestId))
    ) || null;
}

/**
 * Process disposal of a request
 * @param {Number|String} requestId - ID of the request to process
 */
function processDisposal(requestId) {
    const request = findRequestById(requestId);
    if (!request) {
        console.error('Request not found:', requestId);
        showNotification('Error: Request not found', 'error');
        return;
    }
    
    // Check if already disposed
    if (request.disposedAt) {
        console.log('Request already disposed at:', request.disposedAt);
        showNotification('This request has already been processed', 'info');
        return;
    }
    
    // Find the request index in pickedUpRequests
    const requestIndex = pickedUpRequests.findIndex(req => 
        (req.id !== undefined && String(req.id) === String(requestId)) || 
        (req.requestId !== undefined && String(req.requestId) === String(requestId))
    );
    
    if (requestIndex === -1) {
        console.error('Request not found in pickedUpRequests:', requestId);
        showNotification('Error: Request not in picked up list', 'error');
        return;
    }
    
    // Update request status to disposed
    request.disposedAt = new Date().toISOString();
    
    // In a real application, you would update the server here
    console.log(`Processing disposal for request ${requestId}`);
    
    // Update the request in the array
    pickedUpRequests[requestIndex] = { ...request };
    
    // Get points and fee
    const points = request.points || 0;
    const fee = parseFloat(request.fee || '0');
    
    // Update the user's balance (simulated)
    const currentBalance = parseFloat(localStorage.getItem('userBalance') || '0');
    localStorage.setItem('userBalance', (currentBalance + fee).toFixed(2));
    
    // Show success message
    showNotification(`Disposal completed! You earned ${points} points and $${fee.toFixed(2)}`, 'success');
    
    // Refresh the UI
    renderPickedUpRequests();
    
    console.log(`Request ${requestId} marked as disposed at ${request.disposedAt}`);
    // Show confirmation message
    alert(`Disposal successful! Your account has been credited with $${(typeof fee === 'number' ? fee.toFixed(2) : fee)} and ${points} points.`);
}

/**
 * View the disposal report
 * @param {Number|String} requestId - ID of the request
 */
function viewDisposalReport(requestId) {
    console.log('Viewing disposal report for request ID:', requestId);
    
    // Find the request using our helper function
    const request = findRequestById(requestId);
    
    if (!request) {
        console.error('Request not found in any request array. ID:', requestId);
        showNotification('Error: Could not find request details', 'error');
        return;
    }
    
    // Check if the request has been disposed
    if (!request.disposedAt) {
        console.log('Request has not been disposed yet. ID:', requestId);
        showNotification('This request has not been disposed yet', 'info');
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

/**
 * View detailed information about a request
 * @param {String} requestId - ID of the request to view
 */
function viewRequestDetail(requestId) {
    console.log('Opening detail view for request:', requestId);
    
    // Check if the detail view component exists
    if (window.requestDetailView) {
        // Show the detail view
        window.requestDetailView.show(requestId);
    } else {
        console.error('Request detail view component not found');
    }
}

// Make functions available globally for button click handlers
window.locateDumpingSite = locateDumpingSite;
window.viewDisposalReport = viewDisposalReport;
window.processDisposal = processDisposal;
window.toggleRequestDetails = toggleRequestDetails;

// Initialize the request page when the DOM is loaded
document.addEventListener('DOMContentLoaded', initRequestPage);
