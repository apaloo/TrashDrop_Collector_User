/**
 * TrashDrop Collector - Development Tools
 * Handles development-specific fixes and workarounds
 */

// Flag to determine if we're running in a development server
const isDevelopmentServer = 
    window.location.port === '5500' || 
    window.location.port === '5501' ||
    window.location.hostname.includes('127.0.0.1');

/**
 * Initialize development tools and fixes
 */
function initDevTools() {
    if (!isDevelopmentServer) {
        // Not in development mode, no need to run
        return;
    }
    
    console.log('Development environment detected. Applying fixes...');
    
    // Fix 1: Intercept and mock fiveserver status calls
    interceptFiveServerStatusCalls();
    
    // Fix 2: Handle service worker registration for dev server
    handleServiceWorkerForDev();
    
    console.log('Development fixes applied successfully');
}

/**
 * Intercept and block fiveserver status calls
 */
function interceptFiveServerStatusCalls() {
    // Save the original fetch function
    const originalFetch = window.fetch;
    
    // Override fetch to handle fiveserver status calls
    window.fetch = function(resource, options) {
        // Check if this is a fiveserver status call
        if (resource && resource.toString().includes('fiveserver/status')) {
            console.log('Intercepted fiveserver status call');
            
            // Return a mock successful response
            return Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }));
        }
        
        // For all other requests, use the original fetch
        return originalFetch.apply(this, arguments);
    };
    
    // Also intercept XMLHttpRequest for fiveserver
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url) {
        if (url && url.toString().includes('fiveserver/status')) {
            // Rewrite to a safe URL that should return 200
            url = './manifest.json';
            console.log('Intercepted XMLHttpRequest fiveserver status call');
        }
        return originalOpen.apply(this, arguments);
    };
}

/**
 * Handle service worker registration for development environment
 */
function handleServiceWorkerForDev() {
    // Check if there are any existing service worker registrations
    if ('serviceWorker' in navigator) {
        // Unregister any existing service workers
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                console.log('Unregistering service worker in development mode');
                registration.unregister();
            }
        });
        
        // Mock service worker registration function
        if (window.registerServiceWorker) {
            const originalRegister = window.registerServiceWorker;
            window.registerServiceWorker = function() {
                console.log('Service worker registration skipped in development mode');
                return Promise.resolve(null);
            };
        }
    }
}

// Run initialization when the script loads
initDevTools();

// Export function for explicit initialization
window.initDevTools = initDevTools;
