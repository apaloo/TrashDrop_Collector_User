/**
 * TrashDrop Collector - Assignment Module
 * Handles assignment listing, acceptance, and completion functionality
 */

// Store assignments by status
let availableAssignments = [];
let acceptedAssignments = [];
let completedAssignments = [];
let currentAssignmentId = null;

// Geofencing variables
let geofencingInterval = null;
let isGeofencingEnabled = false;

// DOM Elements
let tabButtons;
let tabContents;
let availableAssignmentsElement;
let acceptedAssignmentsElement;
let completedAssignmentsElement;
let assignmentModal;
let markCompleteModal;
let disposeModal;
let captureButtons;
let capturedPhotos = [];
let submitCompleteBtn;

// Camera elements and variables
let cameraContainer;
let cameraFeed;
let captureCanvas;
let takePictureBtn;
let cancelCaptureBtn;
let currentPhotoId = null;
let cameraStream = null;

// Location elements and variables
let locationMap;
let locationMarker;
let capturedLocation = null;
let useCurrentLocationBtn;
let locationStatus;
let locationAddress;
let locationCoordinates;

/**
 * Wait for Supabase client to be initialized - with timeout fallback
 */
function waitForSupabaseClient(callback, timeout = 5000) {
    if (window.supabaseClient) {
        console.log('Supabase client already available in assign.js');
        setTimeout(callback, 0);
        return;
    }
    
    // Set up a timeout to ensure we don't block forever
    const timeoutId = setTimeout(() => {
        console.warn('Timed out waiting for Supabase client, proceeding with minimal functionality');
        // Create emergency fallback if needed
        if (!window.supabaseClient && window.supabase) {
            try {
                console.log('Creating emergency client in assign.js');
                const config = window.CONFIG || window.SUPABASE_CONFIG || {};
                const url = config.supabase?.url || 'https://example.supabase.co';
                const key = config.supabase?.key || 'public-anon-key';
                window.supabaseClient = window.supabase.createClient(url, key);
            } catch (error) {
                console.error('Failed to create emergency client:', error);
            }
        }
        callback();
    }, timeout);
    
    // Listen for both event names for backward compatibility
    const handleClientReady = () => {
        clearTimeout(timeoutId);
        console.log('Supabase client initialized event received in assign.js');
        callback();
    };
    
    window.addEventListener('supabaseClientInitialized', handleClientReady, {once: true});
    window.addEventListener('supabaseClientReady', handleClientReady, {once: true});
}

/**
 * Fallback implementation of getCurrentUser if the auth module didn't load
 */
async function getCurrentUserFallback() {
    console.warn('Using fallback getCurrentUser - auth.js may not have loaded properly');
    // Check if we can access the Supabase client
    if (window.supabaseClient) {
        try {
            const { data, error } = await window.supabaseClient.auth.getUser();
            if (error) {
                console.error('Auth error:', error.message);
                return null;
            }
            return data?.user || null;
        } catch (err) {
            console.error('Error getting user:', err);
            return null;
        }
    }
    return null;
}

/**
 * Initialize the assignment page
 */
async function initAssignPage() {
    // Check if user is logged in using the global function or fallback
    const getCurrentUserFn = window.getCurrentUser || getCurrentUserFallback;
    const user = await getCurrentUserFn();
    
    if (!user) {
        window.location.href = './login.html';
        return;
    }
    
    // DOM Elements
    const tabs = document.getElementById('assignmentTabs');
    tabButtons = document.querySelectorAll('.tab-button');
    tabContents = document.querySelectorAll('.tab-content');
    availableAssignmentsElement = document.getElementById('availableAssignments');
    acceptedAssignmentsElement = document.getElementById('acceptedAssignments');
    completedAssignmentsElement = document.getElementById('completedAssignments');
    assignmentModal = document.getElementById('assignmentModal');
    markCompleteModal = document.getElementById('markCompleteModal');
    disposeModal = document.getElementById('disposeModal');
    photoUploads = document.querySelectorAll('.photo-upload');
    submitCompleteBtn = document.getElementById('submitCompleteBtn');
    
    // Add event listeners for tabs
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked button and its corresponding tab
            button.classList.add('active');
            const tabId = button.getAttribute('data-tab');
            document.getElementById(tabId + 'Tab').classList.add('active');
        });
    });
    
    // Setup modal close functionality
    setupModals();
    
    // Setup camera capture
    setupCameraCapture();
    
    // Setup location elements
    setupLocationElements();
    
    // Load assignments
    loadAssignments();
    
    // Start geofencing check for completed assignments
    startGeofencingCheck();
}

/**
 * Setup modal close functionality
 */
function setupModals() {
    // Assignment modal
    const closeAssignmentModal = assignmentModal.querySelector('.close-modal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    
    closeAssignmentModal.addEventListener('click', () => {
        assignmentModal.style.display = 'none';
    });
    
    closeModalBtn.addEventListener('click', () => {
        assignmentModal.style.display = 'none';
    });
    
    // Mark complete modal
    const closeCompleteModal = markCompleteModal.querySelector('.close-modal');
    const cancelCompleteBtn = document.getElementById('cancelCompleteBtn');
    
    closeCompleteModal.addEventListener('click', () => {
        markCompleteModal.style.display = 'none';
    });
    
    cancelCompleteBtn.addEventListener('click', () => {
        markCompleteModal.style.display = 'none';
    });
    
    // Dispose modal
    const closeDisposeModal = disposeModal.querySelector('.close-modal');
    const cancelDisposeBtn = document.getElementById('cancelDisposeBtn');
    
    closeDisposeModal.addEventListener('click', () => {
        disposeModal.style.display = 'none';
    });
    
    cancelDisposeBtn.addEventListener('click', () => {
        disposeModal.style.display = 'none';
    });
    
    // Global click event for modals
    window.addEventListener('click', (event) => {
        if (event.target === assignmentModal) {
            assignmentModal.style.display = 'none';
        } else if (event.target === markCompleteModal) {
            markCompleteModal.style.display = 'none';
        } else if (event.target === disposeModal) {
            disposeModal.style.display = 'none';
        }
    });
    
    // Accept assignment button
    const acceptAssignmentBtn = document.getElementById('acceptAssignmentBtn');
    acceptAssignmentBtn.addEventListener('click', () => {
        acceptAssignment(currentAssignmentId);
        assignmentModal.style.display = 'none';
    });
    
    // Submit complete button
    submitCompleteBtn.addEventListener('click', () => {
        completeAssignment(currentAssignmentId);
    });
    
    // Confirm dispose button
    const confirmDisposeBtn = document.getElementById('confirmDisposeBtn');
    confirmDisposeBtn.addEventListener('click', () => {
        processDisposal(currentAssignmentId);
    });
}

/**
 * Setup camera capture functionality
 */
function setupCameraCapture() {
    // Get camera-related elements
    cameraContainer = document.getElementById('cameraContainer');
    cameraFeed = document.getElementById('cameraFeed');
    captureCanvas = document.getElementById('captureCanvas');
    takePictureBtn = document.getElementById('takePictureBtn');
    cancelCaptureBtn = document.getElementById('cancelCaptureBtn');
    
    // Get photo capture buttons
    captureButtons = document.querySelectorAll('.camera-capture-btn');
    
    // Add event listeners to camera capture buttons
    captureButtons.forEach((button) => {
        button.addEventListener('click', () => {
            // Get the photo ID from the button's data attribute
            currentPhotoId = button.getAttribute('data-photo-id');
            
            // Start the camera
            startCamera();
        });
    });
    
    // Add event listener to take picture button
    takePictureBtn.addEventListener('click', () => {
        capturePhoto();
    });
    
    // Add event listener to cancel button
    cancelCaptureBtn.addEventListener('click', () => {
        stopCamera();
    });
}

/**
 * Start the camera
 */
async function startCamera() {
    try {
        // Check if browser supports MediaDevices
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showToast('Your device does not support camera access');
            return;
        }
        
        // Get access to the camera
        const constraints = {
            video: {
                facingMode: 'environment', // Use back camera on mobile
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        // Get the stream
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set the video source to the camera stream
        cameraFeed.srcObject = cameraStream;
        
        // Show the camera container
        cameraContainer.style.display = 'flex';
        
        // Add a class to the body to prevent scrolling
        document.body.classList.add('camera-active');
        
    } catch (error) {
        console.error('Error accessing camera:', error);
        showToast('Could not access camera. Please ensure you have granted camera permissions.');
    }
}

/**
 * Stop the camera
 */
function stopCamera() {
    // Hide the camera container
    cameraContainer.style.display = 'none';
    
    // Stop all tracks in the stream
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    
    // Reset camera feed
    cameraFeed.srcObject = null;
    
    // Remove the class from the body
    document.body.classList.remove('camera-active');
    
    // Reset current photo ID
    currentPhotoId = null;
}

/**
 * Capture a photo from the camera feed
 */
function capturePhoto() {
    if (!cameraStream || !currentPhotoId) return;
    
    // Set canvas dimensions to match the video
    const width = cameraFeed.videoWidth;
    const height = cameraFeed.videoHeight;
    captureCanvas.width = width;
    captureCanvas.height = height;
    
    // Draw the current video frame to the canvas
    const context = captureCanvas.getContext('2d');
    context.drawImage(cameraFeed, 0, 0, width, height);
    
    // Get the image data URL
    const imageDataUrl = captureCanvas.toDataURL('image/jpeg');
    
    // Store the captured photo
    const photoIndex = parseInt(currentPhotoId) - 1;
    capturedPhotos[photoIndex] = {
        dataUrl: imageDataUrl,
        timestamp: new Date().toISOString()
    };
    
    // Update the preview
    updatePhotoPreview(photoIndex, imageDataUrl);
    
    // Stop the camera
    stopCamera();
    
    // Check requirements
    checkRequirements();
    
    // Show success message
    showToast('Photo captured successfully');
}

/**
 * Update the photo preview for a specific slot
 * @param {Number} index - Index of the photo slot
 * @param {String} imageDataUrl - Data URL of the captured image
 */
function updatePhotoPreview(index, imageDataUrl) {
    // Get the preview area for this index
    const previewArea = document.getElementById(`photoPreview${index + 1}`);
    
    // Update the preview with the captured image
    previewArea.innerHTML = `
        <img src="${imageDataUrl}" alt="Preview">
        <div class="photo-controls">
            <span class="photo-number">Photo ${index + 1}</span>
            <button type="button" class="photo-delete" data-index="${index}">
                <span class="material-icons">delete</span>
            </button>
        </div>
    `;
    
    // Show the preview
    previewArea.classList.add('has-image');
    
    // Hide the capture button
    const captureButton = document.querySelector(`.camera-capture-btn[data-photo-id="${index + 1}"]`);
    if (captureButton) {
        captureButton.style.display = 'none';
    }
    
    // Add event listener to delete button
    const deleteButton = previewArea.querySelector('.photo-delete');
    deleteButton.addEventListener('click', () => {
        deletePhoto(index);
    });
}

/**
 * Delete a captured photo
 * @param {Number} index - Index of the photo to delete
 */
function deletePhoto(index) {
    // Reset the captured photo data
    capturedPhotos[index] = null;
    
    // Get the preview area
    const previewArea = document.getElementById(`photoPreview${index + 1}`);
    
    // Clear and hide the preview
    previewArea.innerHTML = '';
    previewArea.classList.remove('has-image');
    
    // Show the capture button again
    const captureButton = document.querySelector(`.camera-capture-btn[data-photo-id="${index + 1}"]`);
    if (captureButton) {
        captureButton.style.display = 'flex';
    }
    
    // Check requirements
    checkRequirements();
    
    // Show message
    showToast('Photo removed');
}

/**
 * Check if all requirements are met for submission
 */
function checkRequirements() {
    const validPhotos = capturedPhotos.filter(photo => photo !== null && photo !== undefined);
    const commentLength = document.getElementById('completionComment').value.trim().length;
    
    // Comment is now optional, so we only need photos and location
    submitCompleteBtn.disabled = validPhotos.length < 3 || !capturedLocation;
    
    // Provide visual feedback on comment length
    const commentCharCount = document.getElementById('commentCharCount');
    if (commentCharCount) {
        commentCharCount.textContent = commentLength;
        
        // Since comment is optional, we'll just show the count without color indication
        commentCharCount.style.color = '#666';
    }
    
    // Update photo status in UI
    updatePhotoStatusDisplay(validPhotos.length);
}

/**
 * Update photo status display in the UI
 * @param {Number} count - Number of valid photos
 */
function updatePhotoStatusDisplay(count) {
    // Add visual feedback on the photo requirement
    const photoSection = document.querySelector('.photo-upload-section h4');
    if (photoSection) {
        if (count < 3) {
            photoSection.innerHTML = `Capture Photos <span class="requirement-count">(${count}/3 required)</span>`;
            photoSection.querySelector('.requirement-count').style.color = '#f44336';
        } else {
            photoSection.innerHTML = `Capture Photos <span class="requirement-count">(${count}/3 complete)</span>`;
            photoSection.querySelector('.requirement-count').style.color = '#4caf50';
        }
    }
}

/**
 * Check if the minimum photo requirement is met
 * @deprecated Use checkRequirements instead
 */
function checkPhotoRequirement() {
    checkRequirements();
}

/**
 * Setup location elements and map functionality
 */
function setupLocationElements() {
    // Get location elements
    useCurrentLocationBtn = document.getElementById('useCurrentLocationBtn');
    locationStatus = document.getElementById('locationStatus');
    locationAddress = document.getElementById('locationAddress');
    locationCoordinates = document.getElementById('locationCoordinates');
    
    // Add event listener to current location button
    useCurrentLocationBtn.addEventListener('click', () => {
        captureCurrentLocation();
    });
}

/**
 * Initialize the location map in the Mark Complete modal
 */
function initLocationMap() {
    try {
        // Default center (San Francisco)
        const defaultCenter = CONFIG.map.locations.cities.sanFrancisco;
        
        // Create a new map if it doesn't exist
        if (!locationMap) {
            // Clear previous map instance if exists
            const mapContainer = document.getElementById('locationMap');
            mapContainer.innerHTML = '';
            
            // Create the map with Leaflet
            locationMap = L.map('locationMap').setView([defaultCenter.lat, defaultCenter.lng], 15);
            
            // Add OpenStreetMap tile layer
            L.tileLayer(CONFIG.map.tileUrl, {
                attribution: CONFIG.staticData.attributions.openStreetMap,
                maxZoom: CONFIG.map.maxZoom
            }).addTo(locationMap);
            
            // Create a marker and add it to the map
            locationMarker = L.marker([defaultCenter.lat, defaultCenter.lng], {
                draggable: true,
                title: 'Your location'
            }).addTo(locationMap);
            
            // Add event listener for when marker is dragged
            locationMarker.on('dragend', function() {
                const position = locationMarker.getLatLng();
                const lat = position.lat;
                const lng = position.lng;
                
                // Update captured location
                capturedLocation = { lat, lng };
                
                // Update UI with new location
                updateLocationUI(lat, lng);
                
                // Re-check requirements
                checkPhotoRequirement();
            });
            
            // Add a click event to the map to allow users to place the marker manually
            locationMap.on('click', function(e) {
                const lat = e.latlng.lat;
                const lng = e.latlng.lng;
                
                // Update marker position
                locationMarker.setLatLng([lat, lng]);
                
                // Update captured location
                capturedLocation = { lat, lng };
                
                // Update UI with new location
                updateLocationUI(lat, lng);
                
                // Re-check requirements
                checkPhotoRequirement();
            });
        }
        
        // Try to capture current location after a short delay to ensure map is visible
        setTimeout(() => {
            captureCurrentLocation();
        }, 500);
    } catch (error) {
        console.error('Error initializing map:', error);
        const mapContainer = document.getElementById('locationMap');
        mapContainer.innerHTML = `
            <div class="map-error">
                <span class="material-icons">error</span>
                <p>Unable to load map. Please ensure you have an internet connection.</p>
            </div>
        `;
    }
}

/**
 * Capture the user's current location
 */
async function captureCurrentLocation() {
    locationStatus.textContent = 'Getting your location...';
    locationStatus.className = 'location-status';
    
    try {
        const position = await getCurrentPosition();
        const { latitude, longitude } = position.coords;
        
        // Update the map and marker
        if (locationMap && locationMarker) {
            // Update map view and marker position
            locationMap.setView([latitude, longitude], 16);
            locationMarker.setLatLng([latitude, longitude]);
            
            // Store the location
            capturedLocation = { lat: latitude, lng: longitude };
            
            // Update UI
            updateLocationUI(latitude, longitude);
            
            // Show success status
            locationStatus.textContent = 'Location captured successfully';
            locationStatus.className = 'location-status success';
            
            // Check if submit button should be enabled
            checkPhotoRequirement();
            
            // Add a small bounce animation to the map
            locationMap.flyTo([latitude, longitude], 16, {
                duration: 1
            });
        }
    } catch (error) {
        console.error('Error getting location:', error);
        locationStatus.textContent = 'Could not get your location. Please manually set your location on the map.';
        locationStatus.className = 'location-status error';
        
        // Show toast with instructions for manual selection
        showToast('Please tap on the map to set your location manually');
    }
}

/**
 * Update location UI elements with address and coordinates
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 */
async function updateLocationUI(lat, lng) {
    // Update coordinates text with more user-friendly format
    locationCoordinates.textContent = `Coordinates: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    
    // Try to get the address from coordinates using OSM Nominatim reverse geocoding
    try {
        // Use OpenStreetMap Nominatim API for reverse geocoding
        const response = await fetch(`${CONFIG.staticData.urls.reverseGeocode}?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'TrashDropCollectorApp' // Identifying the app as per Nominatim usage policy
            }
        });
        
        if (!response.ok) {
            throw new Error('Geocoding service failed');
        }
        
        const data = await response.json();
        
        if (data && data.display_name) {
            // Update address field
            locationAddress.value = data.display_name;
        } else {
            locationAddress.value = 'Address information limited';
        }
    } catch (error) {
        console.error('Geocoding error:', error);
        // Provide more helpful message to user when address lookup fails
        locationAddress.value = 'Location captured, but address lookup unavailable';
    }
}

/**
 * Load all assignments and sort them by status
 */
async function loadAssignments() {
    try {
        // Clear current assignments
        availableAssignments = [];
        acceptedAssignments = [];
        completedAssignments = [];
        
        let assignments = [];
        
        try {
            // In a real app, we would fetch from Supabase here
            // For demo purposes, we'll use dummy data
            assignments = generateDummyAssignments();
            
            if (!assignments || !Array.isArray(assignments) || assignments.length === 0) {
                throw new Error('Invalid or empty assignment data');
            }
        } catch (genError) {
            console.warn('Error generating assignments, using fallback:', genError);
            assignments = getFallbackAssignments();
        }
        
        // Sort assignments by status
        assignments.forEach(assignment => {
            if (assignment.status === 'available') {
                availableAssignments.push(assignment);
            } else if (assignment.status === 'accepted') {
                acceptedAssignments.push(assignment);
            } else if (assignment.status === 'completed') {
                completedAssignments.push(assignment);
            }
        });
        
        // Sort available assignments by proximity
        availableAssignments.sort((a, b) => a.distance - b.distance);
        
        // Render assignments
        renderAvailableAssignments();
        renderAcceptedAssignments();
        renderCompletedAssignments();
    } catch (error) {
        console.warn('Error loading assignments, using fallback data:', error);
        
        // Use fallback assignments
        const fallbackData = getFallbackAssignments();
        
        // Sort fallback assignments by status
        availableAssignments = fallbackData.filter(a => a.status === 'available');
        acceptedAssignments = fallbackData.filter(a => a.status === 'accepted');
        completedAssignments = fallbackData.filter(a => a.status === 'completed');
        
        // Sort available assignments by proximity
        availableAssignments.sort((a, b) => a.distance - b.distance);
        
        // Render with fallback data
        renderAvailableAssignments();
        renderAcceptedAssignments();
        renderCompletedAssignments();
    }
}

/**
 * Get hardcoded fallback assignment data when dynamic generation fails
 * @returns {Array} - Array of assignment objects
 */
function getFallbackAssignments() {
    return [
        {
            id: 'fallback-a1',
            status: 'available',
            location_name: 'Accra Beach Area',
            address: '15 Coastal Road, Accra',
            distance: 0.7,
            earnings: 45,
            description: 'Beach cleanup - plastic and general waste',
            time_estimate: '2 hours',
            location: { lat: 5.5913, lng: -0.1969 }
        },
        {
            id: 'fallback-a2',
            status: 'accepted',
            location_name: 'Legon Campus',
            address: 'University of Ghana, Legon',
            distance: 1.5,
            earnings: 35,
            description: 'Post-event cleanup and waste sorting',
            time_estimate: '3 hours',
            location: { lat: 5.6502, lng: -0.1871 }
        },
        {
            id: 'fallback-a3',
            status: 'completed',
            location_name: 'Makola Market',
            address: 'Makola Market, Accra Central',
            distance: 0.9,
            earnings: 55,
            description: 'Market waste collection and recycling',
            time_estimate: '4 hours',
            completed_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            location: { lat: 5.5478, lng: -0.2166 }
        }
    ];
}

/**
 * Generate dummy assignment data for demonstration
 * @returns {Array} - Array of assignment objects
 */
function generateDummyAssignments() {
    const locations = [
        { name: CONFIG.map.locations.pointsOfInterest.park.name, lat: CONFIG.map.locations.pointsOfInterest.park.lat, lng: CONFIG.map.locations.pointsOfInterest.park.lng, distance: 0.5 },
        { name: CONFIG.map.locations.pointsOfInterest.beach.name, lat: CONFIG.map.locations.pointsOfInterest.beach.lat, lng: CONFIG.map.locations.pointsOfInterest.beach.lng, distance: 1.2 },
        { name: CONFIG.map.locations.pointsOfInterest.highway.name, lat: CONFIG.map.locations.pointsOfInterest.highway.lat, lng: CONFIG.map.locations.pointsOfInterest.highway.lng, distance: 0.8 },
        { name: CONFIG.map.locations.pointsOfInterest.school.name, lat: CONFIG.map.locations.pointsOfInterest.school.lat, lng: CONFIG.map.locations.pointsOfInterest.school.lng, distance: 1.5 },
        { name: CONFIG.map.locations.pointsOfInterest.garden.name, lat: CONFIG.map.locations.pointsOfInterest.garden.lat, lng: CONFIG.map.locations.pointsOfInterest.garden.lng, distance: 0.3 }
    ];
    
    return [
        {
            id: 1,
            title: 'Park Cleanup',
            description: 'Clean up litter and debris in Golden Gate Park.',
            location: locations[0],
            authority: 'San Francisco Parks & Rec',
            status: 'available',
            reward: 25,
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            type: 'cleanup',
            wasteVolume: 'Medium',
            timeEstimate: '2 hours'
        },
        {
            id: 2,
            title: 'Beach Restoration',
            description: 'Remove plastic waste from Ocean Beach shoreline.',
            location: locations[1],
            authority: 'California Coastal Commission',
            status: 'available',
            reward: 35,
            createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            type: 'cleanup',
            wasteVolume: 'Large',
            timeEstimate: '3 hours'
        },
        {
            id: 3,
            title: 'Highway Median Cleanup',
            description: 'Remove trash from Highway 101 median.',
            location: locations[2],
            authority: 'Caltrans',
            status: 'accepted',
            reward: 30,
            createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            type: 'cleanup',
            wasteVolume: 'Medium',
            timeEstimate: '2.5 hours'
        },
        {
            id: 4,
            title: 'School Grounds Cleanup',
            description: 'Clean up Lincoln High School grounds after the weekend.',
            location: locations[3],
            authority: 'SF Unified School District',
            status: 'completed',
            reward: 20,
            createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
            completedAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            type: 'cleanup',
            wasteVolume: 'Small',
            timeEstimate: '1.5 hours',
            photos: ['./public/images/sample-cleanup-1.jpg', './public/images/sample-cleanup-2.jpg', './public/images/sample-cleanup-3.jpg'],
            comment: 'Removed 3 bags of trash and recycled materials.'
        },
        {
            id: 5,
            title: 'Community Garden Maintenance',
            description: 'Clear debris and prepare garden beds for planting.',
            location: locations[4],
            authority: 'Urban Farmers Collective',
            status: 'available',
            reward: 15,
            createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
            type: 'cleanup',
            wasteVolume: 'Small',
            timeEstimate: '1 hour'
        }
    ];
}

/**
 * Render available assignments in the Available tab
 */
function renderAvailableAssignments() {
    if (availableAssignments.length === 0) {
        availableAssignmentsElement.innerHTML = '<p class="empty-message">No available assignments at this time.</p>';
        return;
    }
    
    const html = availableAssignments.map(assignment => {
        // Format the reward amount
        const rewardAmount = typeof assignment.reward === 'number' ? 
            assignment.reward.toFixed(2) : 
            (assignment.reward || '0.00');
        
        // Status corner for available assignments (different color)
        const statusCornerHTML = `<div class="status-corner available"></div>`;
        
        // Format the distance
        const distance = assignment.location?.distance ? 
            `${assignment.location.distance} mi` : 'N/A';
        
        // Get enhanced assignment if available
        const enhancedAssignment = window.getEnhancedRequest ? window.getEnhancedRequest(assignment.id) : null;
        
        // Add priority indicator if available from enhanced assignment
        const priorityHTML = enhancedAssignment && enhancedAssignment.priority ? 
            `<span class="priority-dot ${enhancedAssignment.priority}"></span>` : '';
        
        // Add trash type if available from enhanced assignment
        const trashTypeHTML = enhancedAssignment && enhancedAssignment.type ? 
            `<span class="trash-type ${enhancedAssignment.type}">${enhancedAssignment.type}</span>` : '';
        
        return `
            <div class="request-card" data-id="${assignment.id}" onclick="viewAssignmentDetails(${assignment.id})">
                ${statusCornerHTML}
                <div class="request-header">
                    <h3>${assignment.title} ${priorityHTML}</h3>
                    <span class="timestamp">${formatDate(assignment.timestamp || assignment.created_at || new Date().toISOString())}</span>
                </div>
                <p class="address">${assignment.location?.address || 'Location not specified'}</p>
                <div class="request-details">
                    <span class="distance">${distance}</span>
                    <span class="reward">$${rewardAmount}</span>
                    ${trashTypeHTML}
                </div>
                
                <button class="view-more-btn" onclick="toggleRequestDetails(this); event.stopPropagation();">
                    <span class="material-icons">expand_more</span>
                    <span>View More</span>
                </button>
                
                <div class="request-expanded-content">
                    ${assignment.authority ? `<p><strong>Authority:</strong> ${assignment.authority}</p>` : ''}
                    ${assignment.timeEstimate ? `<p><strong>Time Estimate:</strong> ${assignment.timeEstimate}</p>` : ''}
                    <p><strong>Type:</strong> ${capitalizeFirstLetter(assignment.type || 'general')}</p>
                    ${assignment.location?.distance ? `<p><strong>Distance:</strong> ${assignment.location.distance} mi away</p>` : ''}
                </div>
                
                <div class="request-actions">
                    <button class="view-details-btn" data-id="${assignment.id}" onclick="viewAssignmentDetails(${assignment.id}); event.stopPropagation();">
                        <span class="material-icons">visibility</span>
                        <span>View Details</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    availableAssignmentsElement.innerHTML = html;
    
    // Add click handler for the entire card
    const cards = availableAssignmentsElement.querySelectorAll('.request-card');
    cards.forEach(card => {
        card.addEventListener('click', (event) => {
            // Only trigger if the click wasn't on a button or view-more button
            if (!event.target.closest('button') && !event.target.closest('.view-more-btn')) {
                const assignmentId = parseInt(card.getAttribute('data-id'));
                viewAssignmentDetails(assignmentId);
            }
        });
    });
}

/**
 * Render accepted assignments in the Accepted tab
 */
function renderAcceptedAssignments() {
    if (acceptedAssignments.length === 0) {
        acceptedAssignmentsElement.innerHTML = '<p class="empty-message">No accepted assignments found</p>';
        return;
    }
    
    let html = '';
    
    acceptedAssignments.forEach(assignment => {
        const formattedDate = formatDate(assignment.acceptedAt || new Date().toISOString());
        const rewardAmount = assignment.reward || 0;
        const trashType = assignment.type || 'General Waste';
        
        html += `
            <div class="request-card" data-id="${assignment.id}">
                <div class="status-corner accepted"></div>
                <div class="request-header">
                    <h3>${assignment.title || 'Assignment'} <span class="priority-dot priority-${assignment.priority || 'medium'}"></span></h3>
                    <span class="timestamp">${formattedDate}</span>
                </div>
                <p class="address">${assignment.location?.name || 'Location not specified'}</p>
                <div class="request-details">
                    <span class="distance">${assignment.distance ? `${assignment.distance} mi` : 'N/A'}</span>
                    <span class="reward">$${rewardAmount.toFixed(2)}</span>
                    <span class="trash-type">${trashType}</span>
                </div>
                
                <button class="view-more-btn" onclick="toggleRequestDetails(this); event.stopPropagation();">
                    <span class="material-icons">expand_more</span>
                    <span>View More</span>
                </button>
                
                <div class="request-expanded-content">
                    ${assignment.authority ? `<p><strong>Authority:</strong> ${assignment.authority}</p>` : ''}
                    ${assignment.estimatedTime ? `<p><strong>Estimated Time:</strong> ${assignment.estimatedTime} minutes</p>` : ''}
                    ${assignment.description ? `<p><strong>Description:</strong> ${assignment.description}</p>` : ''}
                </div>
                
                <div class="request-actions">
                    <button class="view-details-btn get-directions-btn" data-id="${assignment.id}" data-lat="${assignment.location?.lat}" data-lng="${assignment.location?.lng}">
                        <span class="material-icons">directions</span>
                        <span>Get Directions</span>
                    </button>
                    <button class="view-details-btn mark-complete-btn" data-id="${assignment.id}">
                        <span class="material-icons">check_circle</span>
                        <span>Mark Complete</span>
                    </button>
                </div>
            </div>
        `;
    });
    
    acceptedAssignmentsElement.innerHTML = html;
    
    // Add event listeners to action buttons
    const directionsButtons = acceptedAssignmentsElement.querySelectorAll('.get-directions-btn');
    directionsButtons.forEach(button => {
        button.addEventListener('click', () => {
            const lat = parseFloat(button.getAttribute('data-lat'));
            const lng = parseFloat(button.getAttribute('data-lng'));
            openDirections(lat, lng);
        });
    });
    
    const markCompleteButtons = acceptedAssignmentsElement.querySelectorAll('.mark-complete-btn');
    markCompleteButtons.forEach(button => {
        button.addEventListener('click', () => {
            const assignmentId = parseInt(button.getAttribute('data-id'));
            openMarkCompleteModal(assignmentId);
        });
    });
}

/**
 * Render completed assignments in the Completed tab
 */
function renderCompletedAssignments() {
    if (completedAssignments.length === 0) {
        completedAssignmentsElement.innerHTML = '<p class="empty-message">No completed assignments found</p>';
        return;
    }
    
    let html = '';
    
    completedAssignments.forEach(assignment => {
        const formattedDate = formatDate(assignment.completedAt || new Date().toISOString());
        const rewardAmount = assignment.reward || 0;
        const trashType = assignment.type || 'General Waste';
        
        html += `
            <div class="request-card" data-id="${assignment.id}">
                <div class="status-corner completed"></div>
                <div class="request-header">
                    <h3>${assignment.title || 'Assignment'}</h3>
                    <span class="timestamp">${formattedDate}</span>
                </div>
                <p class="address">${assignment.location?.name || 'Location not specified'}</p>
                <div class="request-details">
                    <span class="reward">$${rewardAmount.toFixed(2)}</span>
                    <span class="trash-type">${trashType}</span>
                </div>
                
                <div class="request-actions">
                    <button class="view-details-btn locate-dumping-btn" data-id="${assignment.id}" data-lat="${assignment.location?.lat}" data-lng="${assignment.location?.lng}">
                        <span class="material-icons">location_on</span>
                        <span>View Dumping Site</span>
                    </button>
                    <button class="view-details-btn dispose-now-btn" data-id="${assignment.id}" style="background-color: #f5f5f5; color: #333;" disabled>
                        <span class="material-icons">delete</span>
                        <span>Dispose Now</span>
                    </button>
                </div>
                
                <div class="request-expanded-content">
                    ${assignment.authority ? `<p><strong>Authority:</strong> ${assignment.authority}</p>` : ''}
                    <p><strong>Completed:</strong> ${formattedDate}</p>
                    ${assignment.description ? `<p><strong>Description:</strong> ${assignment.description}</p>` : ''}
                </div>
            </div>
        `;
    });
    
    completedAssignmentsElement.innerHTML = html;
    
    // Add event listeners to action buttons
    const locateDumpingButtons = completedAssignmentsElement.querySelectorAll('.locate-dumping-btn');
    locateDumpingButtons.forEach(button => {
        button.addEventListener('click', () => {
            const assignmentId = parseInt(button.getAttribute('data-id'));
            locateDumpingSite(assignmentId);
        });
    });
}

/**
 * View assignment details in a modal
 * @param {Number} assignmentId - ID of the assignment to view
 */
function viewAssignmentDetails(assignmentId) {
    const assignment = availableAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Set current assignment ID for the accept button
    currentAssignmentId = assignmentId;
    
    // Update the modal content
    const assignmentDetails = document.getElementById('assignmentDetails');
    assignmentDetails.innerHTML = `
        <div class="assignment-detail-header">
            <h4>${assignment.title}</h4>
            <span class="badge badge-${assignment.status}">${capitalizeFirstLetter(assignment.status)}</span>
        </div>
        <p>${assignment.description}</p>
        <div class="assignment-info-grid">
            <div class="info-item">
                <span class="info-label">Authority</span>
                <span class="info-value">${assignment.authority}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Location</span>
                <span class="info-value">${assignment.location.name}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Distance</span>
                <span class="info-value">${assignment.location.distance} miles</span>
            </div>
            <div class="info-item">
                <span class="info-label">Type</span>
                <span class="info-value">${capitalizeFirstLetter(assignment.type)}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Waste Volume</span>
                <span class="info-value">${assignment.wasteVolume}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Time Estimate</span>
                <span class="info-value">${assignment.timeEstimate}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Reward</span>
                <span class="info-value">$${assignment.reward}</span>
            </div>
            <div class="info-item">
                <span class="info-label">Posted</span>
                <span class="info-value">${formatDate(assignment.createdAt)}</span>
            </div>
        </div>
    `;
    
    // Update button text and show the modal
    const acceptBtn = document.getElementById('acceptAssignmentBtn');
    acceptBtn.textContent = 'Accept Assignment';
    assignmentModal.style.display = 'block';
}

/**
 * Accept an assignment
 * @param {Number} assignmentId - ID of the assignment to accept
 */
function acceptAssignment(assignmentId) {
    const assignment = availableAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Update assignment status
    assignment.status = 'accepted';
    
    // Move assignment from available to accepted
    availableAssignments = availableAssignments.filter(a => a.id !== assignmentId);
    acceptedAssignments.push(assignment);
    
    // Re-render both lists
    renderAvailableAssignments();
    renderAcceptedAssignments();
    
    // Show success message
    showToast('Assignment accepted successfully');
}

/**
 * Open directions to a location
 * @param {Number} lat - Latitude
 * @param {Number} lng - Longitude
 */
function openDirections(lat, lng) {
    // Check if device is mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    let url;
    if (isMobile) {
        // Mobile devices - open in maps app
        if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            // iOS
            url = `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`;
        } else {
            // Android
            url = `geo:${lat},${lng}?q=${lat},${lng}`;
        }
    } else {
        // Desktop - open in Google Maps
        url = `${CONFIG.staticData.urls.googleMapsDirections}?api=1&destination=${lat},${lng}&travelmode=driving`;
    }
    
    // Open in new tab/window
    window.open(url, '_blank');
}

/**
 * Open the mark complete modal
 * @param {Number} assignmentId - ID of the assignment to mark complete
 */
function openMarkCompleteModal(assignmentId) {
    const assignment = acceptedAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Set current assignment ID
    currentAssignmentId = assignmentId;
    
    // Reset captured photos
    capturedPhotos = [];
    
    // Reset location data
    capturedLocation = null;
    
    // Reset photo capture UI
    for (let i = 1; i <= 3; i++) {
        // Reset preview areas
        const previewArea = document.getElementById(`photoPreview${i}`);
        if (previewArea) {
            previewArea.innerHTML = '';
            previewArea.classList.remove('has-image');
        }
        
        // Show camera capture buttons
        const captureButton = document.querySelector(`.camera-capture-btn[data-photo-id="${i}"]`);
        if (captureButton) {
            captureButton.style.display = 'flex';
        }
    }
    
    // Reset photo counter in the UI
    updatePhotoStatusDisplay(0);
    
    // Make sure camera is stopped
    if (cameraStream) {
        stopCamera();
    }
    
    // Reset comments
    const commentInput = document.getElementById('completionComment');
    commentInput.value = '';
    
    // Set up comment character count and event listener
    const commentCharCount = document.getElementById('commentCharCount');
    if (commentCharCount) {
        commentCharCount.textContent = '0';
        
        // Add input event listener for real-time character counting
        commentInput.addEventListener('input', function() {
            const length = this.value.trim().length;
            commentCharCount.textContent = length;
            
            // Update color based on minimum requirement (20 chars)
            if (length < 20) {
                commentCharCount.style.color = '#f44336'; // Red for invalid
            } else {
                commentCharCount.style.color = '#4caf50'; // Green for valid
            }
            
            // Check all requirements for submission
            checkRequirements();
        });
    }
    
    // Reset location fields
    if (locationAddress) locationAddress.value = '';
    if (locationCoordinates) locationCoordinates.textContent = 'Coordinates: --';
    if (locationStatus) {
        locationStatus.textContent = 'Waiting for location...';
        locationStatus.className = 'location-status';
    }
    
    // Disable submit button
    submitCompleteBtn.disabled = true;
    
    // Show modal with assignment title
    const modalTitle = markCompleteModal.querySelector('.modal-header h3');
    modalTitle.textContent = `Mark Complete: ${assignment.title}`;
    
    // Show modal
    markCompleteModal.style.display = 'block';
    
    // Initialize the location map with a slight delay to ensure the modal is visible
    setTimeout(() => {
        initLocationMap();
    }, 300);
    
    // Show camera instruction toast
    setTimeout(() => {
        showToast('Please use your camera to take photos of the cleaned area');
    }, 500);
}

/**
 * Complete an assignment
 * @param {Number} assignmentId - ID of the assignment to complete
 */
function completeAssignment(assignmentId) {
    const assignment = acceptedAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Ensure we have location data
    if (!capturedLocation) {
        showToast('Please capture your location before completing');
        return;
    }
    
    // Get comment
    const comment = document.getElementById('completionComment').value.trim();
    
    // Get address (if available)
    const address = document.getElementById('locationAddress').value;
    
    // Update assignment
    assignment.status = 'completed';
    assignment.completedAt = new Date().toISOString();
    assignment.comment = comment;
    assignment.photos = capturedPhotos.filter(photo => photo !== null).map(photo => photo.dataUrl);
    
    // Add location data
    assignment.completionLocation = {
        coordinates: capturedLocation,
        address: address || 'Address not available',
        capturedAt: new Date().toISOString()
    };
    
    // Move assignment from accepted to completed
    acceptedAssignments = acceptedAssignments.filter(a => a.id !== assignmentId);
    completedAssignments.push(assignment);
    
    // Re-render both lists
    renderAcceptedAssignments();
    renderCompletedAssignments();
    
    // Close modal
    markCompleteModal.style.display = 'none';
    
    // Reset uploaded photos and location
    uploadedPhotos = [];
    capturedLocation = null;
    
    // Show success message
    showToast('Assignment completed successfully with location verified');
    
    // Log the completed assignment with location for debugging
    console.log('Completed assignment with location:', assignment);
}

/**
 * Locate the nearest dumping site
 * @param {Number} assignmentId - ID of the assignment
 */
function locateDumpingSite(assignmentId) {
    const assignment = completedAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Get the nearest dumping site
    getCurrentPosition()
        .then(position => {
            const { latitude, longitude } = position.coords;
            const dumpingSite = getNearestDumpingSite(latitude, longitude);
            
            // Open directions to the dumping site
            openDirections(dumpingSite.lat, dumpingSite.lng);
        })
        .catch(error => {
            console.error('Error getting current position:', error);
            showToast('Unable to get your location. Please enable location services.');
        });
}

/**
 * Get the nearest dumping site
 * @param {Number} lat - Current latitude
 * @param {Number} lng - Current longitude
 * @returns {Object} - Nearest dumping site object
 */
function getNearestDumpingSite(lat, lng) {
    // In a real app, this would query a database of dumping sites
    // For demo purposes, we'll return a hardcoded site
    return {
        id: 1,
        name: 'City Recycling Center',
        address: '501 Tunnel Ave, San Francisco, CA 94134',
        lat: 37.7123,
        lng: -122.3789,
        type: 'recycling'
    };
}

/**
 * Open the dispose modal
 * @param {Number} assignmentId - ID of the assignment
 */
function openDisposeModal(assignmentId) {
    const assignment = completedAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Set current assignment ID
    currentAssignmentId = assignmentId;
    
    // Get the nearest dumping site
    const dumpingSite = getNearestDumpingSite(0, 0); // Using placeholder coords
    
    // Update modal content
    document.getElementById('disposeSiteName').textContent = dumpingSite.name;
    document.getElementById('disposeSiteAddress').textContent = dumpingSite.address;
    document.getElementById('disposeAssignmentId').textContent = assignmentId;
    
    // Show modal
    disposeModal.style.display = 'block';
}

/**
 * Process the disposal and credit the user's account
 * @param {Number} assignmentId - ID of the assignment
 */
function processDisposal(assignmentId) {
    const assignment = completedAssignments.find(a => a.id === assignmentId);
    
    if (!assignment) {
        console.error('Assignment not found');
        return;
    }
    
    // Update assignment
    assignment.disposedAt = new Date().toISOString();
    assignment.disposalComplete = true;
    
    // Close modal
    disposeModal.style.display = 'none';
    
    // Re-render completed assignments
    renderCompletedAssignments();
    
    // Show success message
    showToast('Disposal confirmed successfully. Payment has been processed.');
}

/**
 * Format a date string
 * @param {String} dateString - ISO date string
 * @returns {String} - Formatted date string
 */
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
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
 * Show a toast message
 * @param {String} message - Message to display
 */
function showToast(message) {
    // Check if toast container exists, if not, create it
    let toastContainer = document.querySelector('.toast-container');
    
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove toast after timeout
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.remove();
        }, 300);
    }, 3000);
}

/**
 * Get current position promise
 * @returns {Promise} - Promise that resolves with position
 */
function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            console.warn('Geolocation is not supported by your browser');
            // Default to New York coordinates as fallback
            resolve({
                coords: {
                    latitude: 40.7128,
                    longitude: -74.0060,
                    accuracy: 10000 // Low accuracy since it's a fallback
                },
                timestamp: Date.now()
            });
            return;
        }
        
        const options = {
            enableHighAccuracy: true,
            timeout: 10000, // 10 seconds
            maximumAge: 0 // Force fresh position
        };
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                console.log('Geolocation successful:', position);
                resolve(position);
            },
            (error) => {
                console.warn('Geolocation error:', error);
                // Provide fallback coordinates if geolocation fails
                resolve({
                    coords: {
                        latitude: 40.7128, // Default to New York
                        longitude: -74.0060,
                        accuracy: 10000 // Low accuracy since it's a fallback
                    },
                    timestamp: Date.now()
                });
            },
            options
        );
    });
}

/**
 * Start checking for nearby dumping sites
 */
function startGeofencingCheck() {
    // Don't start geofencing if it's already running
    if (isGeofencingEnabled) {
        console.log('Geofencing is already running');
        return;
    }
    
    // Clear any existing interval
    if (geofencingInterval) {
        clearInterval(geofencingInterval);
    }
    
    // Check geolocation permission
    if (navigator.permissions) {
        navigator.permissions.query({name: 'geolocation'})
            .then(permissionStatus => {
                console.log('Geolocation permission state:', permissionStatus.state);
                if (permissionStatus.state === 'granted') {
                    startGeofencing();
                } else if (permissionStatus.state === 'prompt') {
                    // Request permission
                    getCurrentPosition()
                        .then(() => startGeofencing())
                        .catch(() => console.warn('Geolocation permission was denied'));
                } else {
                    console.warn('Geolocation permission was denied');
                    // Start with fallback coordinates
                    startGeofencing();
                }
                
                // Listen for permission changes
                permissionStatus.onchange = () => {
                    console.log('Geolocation permission changed to:', permissionStatus.state);
                    if (permissionStatus.state === 'granted') {
                        startGeofencing();
                    }
                };
            })
            .catch((error) => {
                console.warn('Error checking geolocation permission:', error);
                // Fallback if permissions API is not supported
                startGeofencing();
            });
    } else {
        // Fallback for browsers that don't support permissions API
        console.log('Permissions API not supported, starting geofencing with fallback');
        startGeofencing();
    }
    
    function startGeofencing() {
        console.log('Starting geofencing service');
        // Check every 30 seconds
        geofencingInterval = setInterval(checkNearbyDumpingSites, 30000);
        isGeofencingEnabled = true;
        
        // Initial check
        checkNearbyDumpingSites();
    }
}

/**
 * Start checking for nearby dumping sites
 */
function startGeofencingCheck() {
    // Clear any existing interval
    if (geofencingInterval) {
        clearInterval(geofencingInterval);
    }
    
    // Check immediately
    checkNearbyDumpingSites();
    
    // Set interval to check every 30 seconds
    geofencingInterval = setInterval(checkNearbyDumpingSites, 30000);
}

/**
 * Check if the user is near any dumping sites
 */
function checkNearbyDumpingSites() {
    // Only proceed if there are completed assignments
    if (completedAssignments.length === 0) {
        return;
    }
    
    // Get current position
    getCurrentPosition()
        .then(position => {
            const { latitude, longitude } = position.coords;
            const dumpingSite = getNearestDumpingSite(latitude, longitude);
            
            // Calculate distance to the dumping site
            const distance = calculateDistance(
                latitude, longitude,
                dumpingSite.lat, dumpingSite.lng
            );
            
            // If within 50 meters, enable the Dispose Now buttons
            const isNearby = distance <= 0.05; // 0.05 km = 50 meters
            const disposeButtons = document.querySelectorAll('.dispose-now-btn');
            
            disposeButtons.forEach(button => {
                button.disabled = !isNearby;
                
                // Add click event if nearby
                if (isNearby) {
                    button.addEventListener('click', () => {
                        const assignmentId = parseInt(button.getAttribute('data-id'));
                        openDisposeModal(assignmentId);
                    });
                }
            });
            
            // Show toast if newly in range
            if (isNearby && disposeButtons.length > 0 && disposeButtons[0].disabled) {
                showToast('You are near a disposal site. You can now dispose of collected waste.');
            }
        })
        .catch(error => {
            console.error('Error getting current position:', error);
        });
}

/**
 * Calculate distance between two points in km using Haversine formula
 * @param {Number} lat1 - Latitude of first point
 * @param {Number} lon1 - Longitude of first point
 * @param {Number} lat2 - Latitude of second point
 * @param {Number} lon2 - Longitude of second point
 * @returns {Number} - Distance in kilometers
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c; // Distance in km
    return distance;
}

/**
 * Convert degrees to radians
 * @param {Number} deg - Degrees
 * @returns {Number} - Radians
 */
function deg2rad(deg) {
    return deg * (Math.PI/180);
}

/**
 * Toggle the visibility of request details
 * @param {HTMLElement} button - The button that was clicked
 */
function toggleRequestDetails(button) {
    const card = button.closest('.request-card');
    if (!card) return;
    
    const content = card.querySelector('.request-expanded-content');
    const icon = button.querySelector('.material-icons');
    
    if (content && icon) {
        const isExpanded = content.style.display === 'block';
        content.style.display = isExpanded ? 'none' : 'block';
        icon.textContent = isExpanded ? 'expand_more' : 'expand_less';
    }
}

/**
 * Initialize the Assign UI components
 * This is the function called by assign.html
 */
function initializeAssignUI() {
    console.log('✅ initializeAssignUI called, forwarding to initAssignPage');
    // Simply forward to our existing initialization function
    initAssignPage();
}

// Initialize the assignment page when the DOM is loaded
// Both entry points are maintained for compatibility
document.addEventListener('DOMContentLoaded', initAssignPage);
