/**
 * TrashDrop Collector - Request Adapter
 * Bridges the complete request model with existing UI and application code
 * without requiring changes to the UI or process flow
 */

/**
 * Request Adapter Module
 * This adapter provides compatibility between the comprehensive Request Model
 * and the existing application code without disrupting the UI or process flow.
 */
(function() {
    // Store original functions that we'll enhance
    const originalFunctions = {
        loadRequests: window.loadRequests,
        generateDummyRequests: window.generateDummyRequests,
        acceptRequest: window.acceptRequest,
        completePickup: window.completePickup
    };
    
    /**
     * Enhanced loadRequests function that uses the new model
     * but maintains the original behavior and interface
     */
    async function enhancedLoadRequests() {
        try {
            // Call original function if it exists
            let requests = [];
            if (typeof originalFunctions.loadRequests === 'function') {
                requests = await originalFunctions.loadRequests();
            } else {
                // If original doesn't exist, use dummy data
                const dummyData = await window.generateDummyRequests();
                requests = dummyData;
            }
            
            // Convert all requests to the new model format
            const enhancedRequests = requests.map(req => window.convertLegacyRequest(req));
            
            // Store enhanced requests but return original format for UI compatibility
            window._enhancedRequests = enhancedRequests;
            
            // Return original-format requests for UI compatibility
            return requests;
        } catch (error) {
            console.error('Error in enhanced loadRequests:', error);
            // Fallback to original behavior
            if (typeof originalFunctions.loadRequests === 'function') {
                return originalFunctions.loadRequests();
            }
            return [];
        }
    }
    
    /**
     * Enhanced generateDummyRequests function that creates
     * model-compliant dummy data while maintaining backward compatibility
     */
    async function enhancedGenerateDummyRequests() {
        try {
            // Get original dummy data
            let dummyRequests = [];
            if (typeof originalFunctions.generateDummyRequests === 'function') {
                dummyRequests = await originalFunctions.generateDummyRequests();
            } else {
                // Create basic dummy data if original function doesn't exist
                dummyRequests = createBasicDummyRequests();
            }
            
            // Enhance each request with additional model fields
            const enhancedRequests = dummyRequests.map(req => {
                // Convert to new model
                const modelRequest = window.convertLegacyRequest(req);
                
                // Add additional fields that would come from a real API
                // but wouldn't affect the UI
                modelRequest.priority = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
                modelRequest.description = `Trash collection request for ${modelRequest.bags} bags of ${modelRequest.type || 'general'} waste.`;
                
                // Add environmental impact data
                modelRequest.environmental_impact = {
                    co2_saved: Math.round(modelRequest.bags * 2.5 * 10) / 10,
                    water_saved: Math.round(modelRequest.bags * 100),
                    trees_saved: Math.round(modelRequest.bags * 0.05 * 100) / 100
                };
                
                return modelRequest;
            });
            
            // Store enhanced requests but return original format for UI compatibility
            window._enhancedDummyRequests = enhancedRequests;
            
            // Return requests in the original format expected by the UI
            return dummyRequests;
        } catch (error) {
            console.error('Error in enhanced generateDummyRequests:', error);
            // Fallback to original behavior
            if (typeof originalFunctions.generateDummyRequests === 'function') {
                return originalFunctions.generateDummyRequests();
            }
            return createBasicDummyRequests();
        }
    }
    
    /**
     * Create basic dummy requests when all else fails
     * @returns {Array} - Array of basic request objects
     */
    function createBasicDummyRequests() {
        const requests = [];
        
        // Generate 5 basic requests
        for (let i = 0; i < 5; i++) {
            requests.push({
                id: 'req-' + Date.now() + '-' + i,
                name: 'Test User ' + i,
                address: i + ' Test Street, Test City',
                timestamp: new Date().toISOString(),
                bags: Math.floor(Math.random() * 5) + 1,
                points: Math.floor(Math.random() * 50) + 10,
                fee: Math.round((Math.random() * 10 + 2) * 100) / 100,
                coordinates: { 
                    lat: 5.6037 + (Math.random() - 0.5) * 0.1, 
                    lng: -0.1870 + (Math.random() - 0.5) * 0.1 
                },
                status: ['pending', 'accepted', 'completed'][Math.floor(Math.random() * 3)]
            });
        }
        
        return requests;
    }
    
    /**
     * Enhanced acceptRequest function that updates model state
     * @param {Number|String} requestId - ID of the request to accept
     * @returns {Promise} - Promise containing success status
     */
    async function enhancedAcceptRequest(requestId) {
        try {
            // Get the enhanced request if available
            let enhancedRequest = null;
            if (window._enhancedRequests) {
                enhancedRequest = window._enhancedRequests.find(req => req.id === requestId);
            }
            
            // Call original function for UI updates
            let result;
            if (typeof originalFunctions.acceptRequest === 'function') {
                result = await originalFunctions.acceptRequest(requestId);
            } else {
                // Basic handling if original doesn't exist
                result = { success: true };
            }
            
            // Update the model state
            if (enhancedRequest) {
                enhancedRequest.status = 'accepted';
                enhancedRequest.accepted_at = new Date().toISOString();
                enhancedRequest.collector_id = getCurrentUserId();
                
                // Update chain of custody
                if (!enhancedRequest.chain_of_custody) {
                    enhancedRequest.chain_of_custody = [];
                }
                
                enhancedRequest.chain_of_custody.push({
                    timestamp: new Date().toISOString(),
                    handler_id: getCurrentUserId(),
                    handler_type: 'collector',
                    action: 'accepted',
                    location: getCurrentLocation()
                });
                
                // Store updated request data
                updateEnhancedRequest(enhancedRequest);
            }
            
            return result;
        } catch (error) {
            console.error('Error in enhanced acceptRequest:', error);
            // Fallback to original behavior
            if (typeof originalFunctions.acceptRequest === 'function') {
                return originalFunctions.acceptRequest(requestId);
            }
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Enhanced completePickup function that updates model state
     * @returns {Promise} - Promise containing success status
     */
    async function enhancedCompletePickup() {
        try {
            // Call original function for UI updates
            let result;
            if (typeof originalFunctions.completePickup === 'function') {
                result = await originalFunctions.completePickup();
            } else {
                // Basic handling if original doesn't exist
                result = { success: true };
            }
            
            // Get the current request ID
            const requestId = window.currentRequestId;
            if (!requestId) return result;
            
            // Get the enhanced request if available
            let enhancedRequest = null;
            if (window._enhancedRequests) {
                enhancedRequest = window._enhancedRequests.find(req => req.id === requestId);
            }
            
            // Update the model state
            if (enhancedRequest) {
                enhancedRequest.status = 'completed';
                enhancedRequest.completed_at = new Date().toISOString();
                
                // Update chain of custody
                if (!enhancedRequest.chain_of_custody) {
                    enhancedRequest.chain_of_custody = [];
                }
                
                enhancedRequest.chain_of_custody.push({
                    timestamp: new Date().toISOString(),
                    handler_id: getCurrentUserId(),
                    handler_type: 'collector',
                    action: 'completed',
                    location: getCurrentLocation()
                });
                
                // Add QR codes from scanned bags
                if (window.scannedBags && window.scannedBags.length > 0) {
                    enhancedRequest.qr_codes = window.scannedBags.map(bag => bag.code);
                }
                
                // Add sorted materials
                enhancedRequest.sorted_materials = {};
                if (window.scannedBags && window.scannedBags.length > 0) {
                    // Calculate weight for each material type
                    window.scannedBags.forEach(bag => {
                        const type = bag.type || 'other';
                        const weight = bag.weight || 5; // Default to 5kg if weight not provided
                        
                        if (!enhancedRequest.sorted_materials[type]) {
                            enhancedRequest.sorted_materials[type] = 0;
                        }
                        
                        enhancedRequest.sorted_materials[type] += weight;
                    });
                }
                
                // Calculate environmental impact based on materials
                updateEnvironmentalImpact(enhancedRequest);
                
                // Update payment status
                enhancedRequest.payment_status = 'pending';
                
                // Store updated request data
                updateEnhancedRequest(enhancedRequest);
            }
            
            return result;
        } catch (error) {
            console.error('Error in enhanced completePickup:', error);
            // Fallback to original behavior
            if (typeof originalFunctions.completePickup === 'function') {
                return originalFunctions.completePickup();
            }
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Helper function to get current user ID
     * @returns {String} - Current user ID
     */
    function getCurrentUserId() {
        // Try to get from app state
        if (window.appState && window.appState.user && window.appState.user.id) {
            return window.appState.user.id;
        }
        
        // Try to get from localStorage
        try {
            const userStr = localStorage.getItem('mockUser');
            if (userStr) {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    return user.id;
                }
            }
        } catch (e) {}
        
        // Default fallback
        return 'unknown-user';
    }
    
    /**
     * Helper function to get current location
     * @returns {Object} - Current location coordinates
     */
    function getCurrentLocation() {
        // Try to get from app state
        if (window.appState && window.appState.lastKnownPosition) {
            return {
                lat: window.appState.lastKnownPosition.latitude,
                lng: window.appState.lastKnownPosition.longitude
            };
        }
        
        // Default location (Accra, Ghana)
        return CONFIG.map.locations.cities.accra;
    }
    
    /**
     * Update enhanced request in storage
     * @param {Object} request - Request to update
     */
    function updateEnhancedRequest(request) {
        if (!window._enhancedRequests) {
            window._enhancedRequests = [];
        }
        
        // Find and update or add to array
        const index = window._enhancedRequests.findIndex(req => req.id === request.id);
        if (index >= 0) {
            window._enhancedRequests[index] = request;
        } else {
            window._enhancedRequests.push(request);
        }
        
        // Store in localStorage for offline access
        try {
            localStorage.setItem('enhancedRequests', JSON.stringify(window._enhancedRequests));
        } catch (e) {
            console.warn('Failed to store enhanced requests in localStorage:', e);
        }
    }
    
    /**
     * Update environmental impact metrics based on sorted materials
     * @param {Object} request - Request to update
     */
    function updateEnvironmentalImpact(request) {
        if (!request.sorted_materials) return;
        
        const impact = {
            co2_saved: 0,
            water_saved: 0,
            trees_saved: 0
        };
        
        // Calculate impact based on material types
        // These are approximate values for demonstration
        for (const [type, weight] of Object.entries(request.sorted_materials)) {
            switch (type) {
                case 'plastic':
                    impact.co2_saved += weight * 2.5;
                    impact.water_saved += weight * 100;
                    break;
                case 'paper':
                    impact.co2_saved += weight * 1.8;
                    impact.water_saved += weight * 50;
                    impact.trees_saved += weight * 0.017;
                    break;
                case 'glass':
                    impact.co2_saved += weight * 0.6;
                    impact.water_saved += weight * 20;
                    break;
                case 'metal':
                    impact.co2_saved += weight * 4.0;
                    impact.water_saved += weight * 40;
                    break;
                case 'organic':
                    impact.co2_saved += weight * 0.5;
                    break;
                default:
                    impact.co2_saved += weight * 1.0;
                    impact.water_saved += weight * 30;
            }
        }
        
        // Round values for readability
        impact.co2_saved = Math.round(impact.co2_saved * 10) / 10;
        impact.water_saved = Math.round(impact.water_saved);
        impact.trees_saved = Math.round(impact.trees_saved * 100) / 100;
        
        request.environmental_impact = impact;
    }
    
    /**
     * Get an enhanced request by ID with all model fields
     * @param {String} requestId - ID of the request to get
     * @returns {Object|null} - Enhanced request object or null if not found
     */
    function getEnhancedRequest(requestId) {
        // Check in-memory storage first
        if (window._enhancedRequests) {
            const request = window._enhancedRequests.find(req => req.id === requestId);
            if (request) return request;
        }
        
        // Try to load from localStorage
        try {
            const storedRequests = localStorage.getItem('enhancedRequests');
            if (storedRequests) {
                const requests = JSON.parse(storedRequests);
                const request = requests.find(req => req.id === requestId);
                if (request) return request;
            }
        } catch (e) {}
        
        return null;
    }
    
    /**
     * Get all enhanced requests with model fields
     * @returns {Array} - Array of enhanced request objects
     */
    function getAllEnhancedRequests() {
        // Check in-memory storage first
        if (window._enhancedRequests) {
            return [...window._enhancedRequests];
        }
        
        // Try to load from localStorage
        try {
            const storedRequests = localStorage.getItem('enhancedRequests');
            if (storedRequests) {
                return JSON.parse(storedRequests);
            }
        } catch (e) {}
        
        return [];
    }
    
    /**
     * Initialize the request adapter module
     */
    function init() {
        console.log('Initializing request adapter...');
        
        try {
            // Store original functions for safe access
            if (typeof window.loadRequests === 'function') {
                originalFunctions.loadRequests = window.loadRequests;
            }
            if (typeof window.generateDummyRequests === 'function') {
                originalFunctions.generateDummyRequests = window.generateDummyRequests;
            }
            if (typeof window.acceptRequest === 'function') {
                originalFunctions.acceptRequest = window.acceptRequest;
            }
            if (typeof window.completePickup === 'function') {
                originalFunctions.completePickup = window.completePickup;
            }
            
            // Enhance original functions with new model functionality
            window.loadRequests = enhancedLoadRequests;
            window.generateDummyRequests = enhancedGenerateDummyRequests;
            window.acceptRequest = enhancedAcceptRequest;
            window.completePickup = enhancedCompletePickup;
            
            // Export new functions to global scope
            window.getEnhancedRequest = getEnhancedRequest;
            window.getAllEnhancedRequests = getAllEnhancedRequests;
            window.convertLegacyRequest = function(request) {
                // Create a model-compliant request
                if (!request) return null;
                try {
                    // Use the correct function name createRequest instead of RequestModel.create
                    return window.createRequest(request);
                } catch (error) {
                    console.error('Error converting legacy request:', error);
                    return request; // Return original if conversion fails
                }
            };
            
            // Load stored enhanced requests
            try {
                const storedRequests = localStorage.getItem('enhancedRequests');
                if (storedRequests) {
                    window._enhancedRequests = JSON.parse(storedRequests);
                } else {
                    window._enhancedRequests = [];
                }
            } catch (e) {
                window._enhancedRequests = [];
            }
            
            // Create fallback functions if needed
            if (!window.loadRequests) {
                console.warn('Creating fallback loadRequests function');
                window.loadRequests = async function() {
                    return createBasicDummyRequests();
                };
            }
            
            console.log('Request adapter initialized successfully');
        } catch (error) {
            console.error('Error initializing request adapter:', error);
            // Provide fallback functionality
            window.loadRequests = async function() {
                return createBasicDummyRequests();
            };
        }
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
