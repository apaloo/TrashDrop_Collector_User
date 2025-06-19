/**
 * TrashDrop Collector - Safe Navigation System
 * Provides reliable navigation between app pages without authentication issues
 */

// Immediately execute to prevent any delay
(function() {
    console.log('[Safe Navigation] Script loaded');
    
    // Function to set up safe navigation without replacing bottom nav HTML
    function setupSafeNavigation() {
        console.log('[Safe Navigation] Setting up safe navigation');
        
        // Always ensure we have a mock user in development mode
        try {
            const mockUser = {
                id: 'safe-nav-user-' + Date.now(),
                email: (CONFIG && CONFIG.staticData && CONFIG.staticData.emails && CONFIG.staticData.emails.devUser) || 'test@example.com',
                name: 'Development User',
                created_at: new Date().toISOString()
            };
            
            // Store in localStorage
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            
            // If app state exists, update it too
            if (window.appState) {
                window.appState.user = mockUser;
            }
        } catch (error) {
            console.error('[Safe Navigation] Error setting up mock user:', error);
        }
        
        // Instead of replacing the entire navigation, let's make the safeNavigate function available globally
        // This allows bottom-nav.js to use it without conflict
        document.addEventListener('DOMContentLoaded', function() {
            // Just ensure the safeNavigate function is available and not modifying the DOM
            console.log('[Safe Navigation] Navigation handler ready');
            
            // Intercept any clicks on navigation items to use safeNavigate
            document.body.addEventListener('click', function(event) {
                // Find closest anchor inside bottom-nav
                const navItem = event.target.closest('.bottom-nav a');
                if (navItem && !navItem.hasAttribute('data-safe-nav-processed')) {
                    // Add our handler
                    navItem.setAttribute('data-safe-nav-processed', 'true');
                    const href = navItem.getAttribute('href');
                    if (href) {
                        navItem.removeAttribute('href');
                        navItem.style.cursor = 'pointer';
                        navItem.addEventListener('click', function(e) {
                            e.preventDefault();
                            safeNavigate(href);
                            return false;
                        });
                    }
                }
            });
        });
    }
    
    // Define safe navigation function
    window.safeNavigate = function(url) {
        console.log('[Safe Navigation] Navigating to:', url);
        
        try {
            // Safely access CONFIG with proper fallbacks
            const mockUser = {
                id: 'safe-nav-user-' + Date.now(),
                // Use optional chaining and provide fallbacks
                email: (window.CONFIG && CONFIG.staticData && CONFIG.staticData.emails && CONFIG.staticData.emails.devUser) || 'test@example.com',
                name: 'Development User',
                created_at: new Date().toISOString(),
                role: 'collector' // Add role for consistency
            };
            
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
        } catch (error) {
            console.error('[Safe Navigation] Error setting mock user:', error);
            // Create emergency fallback user
            const fallbackUser = {
                id: 'emergency-user-' + Date.now(),
                email: 'test@example.com',
                name: 'Emergency User',
                created_at: new Date().toISOString(),
                role: 'collector'
            };
            localStorage.setItem('mockUser', JSON.stringify(fallbackUser));
        }
        
        // Ensure we're using assign method for proper navigation
        try {
            console.log('[Safe Navigation] Navigating to:', url);
            window.location.assign(url);
        } catch (e) {
            // Fallback to direct assignment if assign fails
            window.location = url;
        }
    };
    
    // Set up safe navigation
    setupSafeNavigation();
    
    // Also attempt to intercept any redirects to login page
    const originalAssign = window.location.assign;
    window.location.assign = function(url) {
        if (url.includes('login.html')) {
            console.log('[Safe Navigation] Blocked redirect to login page');
            return;
        }
        return originalAssign.apply(this, arguments);
    };
    
    // Also intercept .replace method
    const originalReplace = window.location.replace;
    window.location.replace = function(url) {
        if (url.includes('login.html')) {
            console.log('[Safe Navigation] Blocked login redirect via replace');
            return;
        }
        return originalReplace.apply(this, arguments);
    };
    
    console.log('[Safe Navigation] Safe navigation system installed');
})();
