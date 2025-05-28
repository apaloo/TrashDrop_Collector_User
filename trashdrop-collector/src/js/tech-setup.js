/**
 * TrashDrop Collector - Technical Setup Integration
 * Integrates and initializes all technical components
 */

// Technical components state
const techState = {
    mapInitialized: false,
    qrScannerInitialized: false,
    geofencingInitialized: false,
    notificationsInitialized: false,
    pwaInitialized: false
};

/**
 * Initialize all technical components
 */
async function initTechSetup() {
    console.log('Initializing Technical Setup...');
    
    try {
        // Initialize components based on the current page
        const currentPath = window.location.pathname;
        
        // Register service worker for all pages (already in main.js)
        if ('serviceWorker' in navigator) {
            // Service worker should already be registered in main.js
            techState.pwaInitialized = true;
        }
        
        // Initialize PWA install functionality for all pages
        if (typeof window.initPWAInstall === 'function') {
            window.initPWAInstall();
            console.log('PWA install functionality initialized');
        }
        
        // Initialize notifications for all pages, but skip permission prompt
        // User will need to explicitly enable notifications through a UI control
        if (typeof window.initNotifications === 'function') {
            // Always pass true to skip the permission prompt on page load
            await window.initNotifications(true);
            techState.notificationsInitialized = true;
            console.log('Notifications initialized (permission prompt skipped)');
            
            // Find notification permission buttons if they exist and attach event handlers
            const notificationButtons = document.querySelectorAll('[data-action="enable-notifications"]');
            if (notificationButtons.length > 0) {
                notificationButtons.forEach(button => {
                    button.addEventListener('click', async () => {
                        // Only request permission when user explicitly clicks the notification button
                        const granted = await window.requestNotificationPermission();
                        if (granted) {
                            window.showNotification('Notifications enabled successfully!', 'success');
                        } else {
                            window.showNotification('Notification permission denied. You can enable it in your browser settings.', 'warning');
                        }
                    });
                });
                console.log('Notification permission buttons configured');
            }
        }
        
        // Initialize map for map.html - WITH explicit location permission handling
        if (currentPath.endsWith('/map.html') && typeof window.initMap === 'function') {
            // Check if map container exists
            const mapContainer = document.getElementById('map');
            if (mapContainer) {
                try {
                    // Default coordinates (Accra, Ghana)
                    let coords = [5.6037, -0.1870];
                    
                    // Add location permission request button to the map
                    const locationBtn = document.createElement('button');
                    locationBtn.id = 'requestLocationBtn';
                    locationBtn.className = 'request-location-btn';
                    locationBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="1"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12" y2="8"></line>
                        </svg>
                        Use My Location
                    `;
                    locationBtn.style.position = 'fixed';
                    locationBtn.style.bottom = '70px';
                    locationBtn.style.right = '10px';
                    locationBtn.style.zIndex = '1000';
                    locationBtn.style.padding = '10px 16px';
                    locationBtn.style.backgroundColor = '#4CAF50';
                    locationBtn.style.color = 'white';
                    locationBtn.style.border = 'none';
                    locationBtn.style.borderRadius = '4px';
                    locationBtn.style.display = 'flex';
                    locationBtn.style.alignItems = 'center';
                    locationBtn.style.gap = '8px';
                    locationBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                    
                    // Check if we have a cached position
                    if (window.appState && window.appState.lastKnownPosition) {
                        coords = [window.appState.lastKnownPosition.latitude, window.appState.lastKnownPosition.longitude];
                        console.log('Using cached position for map initialization');
                    }
                    
                    // Initialize the map with default or cached coords
                    const map = window.initMap(coords);
                    
                    // Add user marker
                    window.addUserMarker(coords);
                    
                    // Add radius circle
                    window.addRadiusCircle(coords, 5);
                    
                    // Fetch nearby requests
                    window.fetchNearbyRequests(coords, 5, 'all');
                    
                    techState.mapInitialized = true;
                    console.log('Map initialized successfully');
                    
                    // Add location request button to body
                    document.body.appendChild(locationBtn);
                    
                    // Add click listener to request location permission with user interaction
                    locationBtn.addEventListener('click', async () => {
                        if (typeof window.requestLocationPermission === 'function') {
                            const granted = await window.requestLocationPermission();
                            
                            if (granted && window.appState.lastKnownPosition) {
                                // Update map with user's actual location
                                const userCoords = [window.appState.lastKnownPosition.latitude, window.appState.lastKnownPosition.longitude];
                                map.setView(userCoords, 15);
                                
                                // Update user marker
                                if (typeof window.addUserMarker === 'function') {
                                    window.addUserMarker(userCoords);
                                }
                                
                                // Update radius circle
                                if (typeof window.addRadiusCircle === 'function') {
                                    window.addRadiusCircle(userCoords, 5);
                                }
                                
                                // Refresh nearby requests
                                if (typeof window.fetchNearbyRequests === 'function') {
                                    window.fetchNearbyRequests(userCoords, 5, 'all');
                                }
                                
                                // Hide the button
                                locationBtn.style.display = 'none';
                                
                                // Start location tracking if available
                                if (typeof window.startLocationTracking === 'function') {
                                    window.startLocationTracking();
                                }
                            }
                        }
                    });
                    
                    // Initialize geofencing with disposal center locations, but don't start tracking until permission is granted
                    if (typeof window.initGeofencing === 'function') {
                        // Sample disposal center locations - these should come from the database in production
                        const disposalCenters = [
                            [5.6050, -0.1875], // Sample disposal center 1
                            [5.6100, -0.1800], // Sample disposal center 2
                            [5.5980, -0.1920]  // Sample disposal center 3
                        ];
                        
                        // Initialize but don't start geofence tracking yet - wait for user permission
                        window.initGeofencing(disposalCenters);
                        techState.geofencingInitialized = true;
                        console.log('Geofencing initialized (waiting for location permission)');
                        
                        // Only start tracking if permission already granted
                        if (window.appState && window.appState.locationPermissionGranted) {
                            window.startGeofenceTracking();
                            console.log('Geofencing tracking started');
                        }
                    }
                } catch (error) {
                    console.error('Error initializing map:', error);
                }
            }
        }
        
        // Initialize QR scanner functionality for request.html
        if ((currentPath.endsWith('/request.html') || currentPath.endsWith('/assign.html')) && 
            typeof window.openQRScannerModal === 'function') {
            
            // Find QR scan buttons
            const qrScanButtons = document.querySelectorAll('[data-action="scan-qr"]');
            
            if (qrScanButtons.length > 0) {
                qrScanButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        window.openQRScannerModal((qrData) => {
                            console.log('QR code scanned:', qrData);
                            
                            // Parse QR data (expected format: JSON string)
                            try {
                                const bagData = JSON.parse(qrData);
                                handleScannedBag(bagData);
                            } catch (error) {
                                console.error('Invalid QR code data:', error);
                                window.showNotification('Invalid QR code format', 'error');
                            }
                        });
                    });
                });
                
                techState.qrScannerInitialized = true;
                console.log('QR scanner functionality initialized');
            }
        }
        
        console.log('Technical setup complete!', techState);
    } catch (error) {
        console.error('Error during technical setup initialization:', error);
    }
}

/**
 * Handle scanned bag data
 * @param {Object} bagData - Parsed bag data from QR code
 */
function handleScannedBag(bagData) {
    // Validate bag data
    if (!bagData || !bagData.id) {
        window.showNotification('Invalid bag data', 'error');
        return;
    }
    
    // Check if we have a function to handle the bag in the current page context
    if (typeof window.processBagScan === 'function') {
        window.processBagScan(bagData);
    } else {
        // Default implementation if no specific handler exists
        const bagInfo = {
            id: bagData.id,
            type: bagData.type || 'general',
            weight: bagData.weight || '0',
            fee: bagData.fee || '0',
            points: bagData.points || '0',
            timestamp: new Date().toISOString()
        };
        
        // Store scanned bag in session
        const scannedBags = JSON.parse(sessionStorage.getItem('scannedBags') || '[]');
        scannedBags.push(bagInfo);
        sessionStorage.setItem('scannedBags', JSON.stringify(scannedBags));
        
        // Show success notification
        window.showNotification(`Bag ${bagInfo.id} (${bagInfo.type}) scanned successfully!`, 'success');
        
        // Trigger custom event for other components that might be listening
        document.dispatchEvent(new CustomEvent('bagScanned', { detail: bagInfo }));
    }
}

// Initialize tech setup when DOM is ready
document.addEventListener('DOMContentLoaded', initTechSetup);

// Export functions to global scope
window.initTechSetup = initTechSetup;
window.handleScannedBag = handleScannedBag;

// Check if we need to use location services without triggering the permission prompt
if (typeof window.checkLocationPermission === 'function') {
    window.checkLocationPermission(true); // true = skip prompt
}
