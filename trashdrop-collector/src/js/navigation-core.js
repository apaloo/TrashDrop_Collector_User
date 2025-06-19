/**
 * TrashDrop Collector - Core Navigation System
 * Unified navigation system that replaces fragmented implementations
 */

(function() {
    // Store original navigation methods
    const originalAssign = window.location.assign;
    const originalReplace = window.location.replace;
    let originalHref = Object.getOwnPropertyDescriptor(window.Location.prototype, 'href');
    
    // Configuration
    const config = {
        // Pages that should never redirect to login
        protectedPages: ['assign.html', 'map.html', 'earnings.html', 'request.html'],
        // Pages that are public and don't need authentication
        publicPages: ['login.html', 'signup.html', 'reset-password.html', 'email-confirmation.html'],
        // Debug level: 0=off, 1=basic, 2=verbose
        debugLevel: 2
    };
    
    /**
     * Debug logging with level control
     */
    function debugLog(message, level = 1) {
        if (window.DEBUG_MODE || config.debugLevel >= level) {
            console.log(`[Navigation] ${message}`);
        }
    }
    
    /**
     * Create a mock user for development
     * Centralizes all mock user creation logic
     */
    function createMockUser() {
        try {
            // Get configuration safely
            const appConfig = window.CONFIG || {};
            
            // Generate data with fallbacks
            const userId = (appConfig.dev && appConfig.dev.testUser && appConfig.dev.testUser.id) ? 
                appConfig.dev.testUser.id : 'mock-user-id';
            const email = (appConfig.staticData && appConfig.staticData.emails && appConfig.staticData.emails.mock) ? 
                appConfig.staticData.emails.mock : 'test@example.com';
            
            // Create consistent mock user
            const mockUser = {
                id: userId + '-' + Date.now(),
                email: email,
                name: 'Mock User',
                created_at: new Date().toISOString(),
                role: 'collector',
                app_metadata: { role: 'collector' }
            };
            
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            debugLog(`Created mock user: ${mockUser.email}`, 2);
            return mockUser;
        } catch (error) {
            debugLog(`Error creating mock user: ${error}`, 2);
            
            // Ultra-safe fallback
            const fallbackUser = {
                id: 'emergency-mock-user-' + Date.now(),
                email: 'test@example.com',
                name: 'Emergency User',
                created_at: new Date().toISOString(),
                role: 'collector',
                app_metadata: { role: 'collector' }
            };
            
            localStorage.setItem('mockUser', JSON.stringify(fallbackUser));
            debugLog('Created emergency fallback user', 2);
            return fallbackUser;
        }
    }
    
    /**
     * Check if the current page is protected from redirects
     */
    function isProtectedPage() {
        const currentPath = window.location.pathname;
        return config.protectedPages.some(page => currentPath.includes(page));
    }
    
    /**
     * Check if URL is the login page
     */
    function isLoginPage(url) {
        return typeof url === 'string' && url.includes('login.html');
    }
    
    /**
     * Safe navigate to URL with proper authentication
     */
    function safeNavigate(url) {
        debugLog(`Safe navigating to: ${url}`);
        
        // Ensure user exists before navigation
        if (!localStorage.getItem('mockUser')) {
            createMockUser();
        }
        
        // Special handling for assign.html
        if (url.includes('assign.html')) {
            debugLog('Assign page navigation detected - setting session flag');
            sessionStorage.setItem('assign_page_accessed', 'true');
        }
        
        try {
            debugLog(`Navigating to: ${url}`);
            originalAssign.call(window.location, url);
        } catch (e) {
            debugLog(`Navigation error: ${e}. Falling back to href.`);
            window.location.href = url;
        }
    }
    
    /**
     * Main override for window.location.assign
     */
    window.location.assign = function(url) {
        debugLog(`Intercept location.assign: ${url}`);
        
        // Block redirects to login from protected pages
        if (isLoginPage(url) && isProtectedPage()) {
            debugLog('⛔ Blocked redirect to login', 1);
            return;
        }
        
        return originalAssign.call(window.location, url);
    };
    
    /**
     * Override for window.location.replace
     */
    window.location.replace = function(url) {
        debugLog(`Intercept location.replace: ${url}`);
        
        // Block redirects to login from protected pages
        if (isLoginPage(url) && isProtectedPage()) {
            debugLog('⛔ Blocked redirect to login', 1);
            return;
        }
        
        return originalReplace.call(window.location, url);
    };
    
    /**
     * Override for window.location.href setter
     */
    if (originalHref && originalHref.set) {
        Object.defineProperty(window.location, 'href', {
            get: function() {
                return originalHref.get.call(this);
            },
            set: function(url) {
                debugLog(`Intercept location.href = ${url}`);
                
                // Block redirects to login from protected pages
                if (isLoginPage(url) && isProtectedPage()) {
                    debugLog('⛔ Blocked href change to login', 1);
                    return;
                }
                
                return originalHref.set.call(this, url);
            }
        });
    }
    
    /**
     * Initialize the system
     */
    function init() {
        // Create mock user if needed
        if (!localStorage.getItem('mockUser')) {
            createMockUser();
        }
        
        // Set assign page flag if we're on that page
        if (window.location.pathname.includes('assign.html')) {
            sessionStorage.setItem('assign_page_accessed', 'true');
            debugLog('Set assign page access flag');
        }
        
        // Expose global navigation function
        window.safeNavigate = safeNavigate;
        
        debugLog('Navigation core initialized');
    }
    
    // Initialize on script load
    init();
})();
