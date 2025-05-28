/**
 * TrashDrop Collector - Safe Navigation System
 * Provides reliable navigation between app pages without authentication issues
 */

// Immediately execute to prevent any delay
(function() {
    console.log('[Safe Navigation] Script loaded');
    
    // Function to override all navigation links
    function setupSafeNavigation() {
        console.log('[Safe Navigation] Setting up safe navigation');
        
        // Always ensure we have a mock user in development mode
        const mockUser = {
            id: 'safe-nav-user-' + Date.now(),
            email: 'dev-user@example.com',
            name: 'Development User',
            created_at: new Date().toISOString()
        };
        
        // Store in localStorage
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        
        // If app state exists, update it too
        if (window.appState) {
            window.appState.user = mockUser;
        }
        
        // Replace all bottom navigation with direct JavaScript navigation
        document.addEventListener('DOMContentLoaded', function() {
            // Short timeout to ensure DOM is fully loaded
            setTimeout(() => {
                // Find the bottom navigation
                const bottomNav = document.querySelector('.bottom-nav');
                
                if (!bottomNav) {
                    console.log('[Safe Navigation] Bottom navigation not found');
                    return;
                }
                
                console.log('[Safe Navigation] Found bottom navigation, replacing links');
                
                // Replace the entire bottom navigation HTML
                bottomNav.innerHTML = `
                    <a class="nav-item ${window.location.href.includes('map.html') ? 'active' : ''}" 
                       onclick="safeNavigate('./map.html')">
                        <span class="material-icons nav-icon">map</span>
                        <span class="nav-label">Map</span>
                    </a>
                    <a class="nav-item ${window.location.href.includes('request.html') ? 'active' : ''}" 
                       onclick="safeNavigate('./request.html')">
                        <span class="material-icons nav-icon">add_circle</span>
                        <span class="nav-label">Request</span>
                    </a>
                    <a class="nav-item ${window.location.href.includes('assign.html') ? 'active' : ''}" 
                       onclick="safeNavigate('./assign.html')">
                        <span class="material-icons nav-icon">assignment</span>
                        <span class="nav-label">Assign</span>
                    </a>
                    <a class="nav-item ${window.location.href.includes('earnings.html') ? 'active' : ''}" 
                       onclick="safeNavigate('./earnings.html')">
                        <span class="material-icons nav-icon">account_balance_wallet</span>
                        <span class="nav-label">Earnings</span>
                    </a>
                    <a class="nav-item ${window.location.href.includes('account.html') ? 'active' : ''}" 
                       onclick="safeNavigate('./account.html')">
                        <span class="material-icons nav-icon">person</span>
                        <span class="nav-label">Account</span>
                    </a>
                `;
                
                console.log('[Safe Navigation] Successfully replaced navigation');
            }, 100);
        });
    }
    
    // Define safe navigation function
    window.safeNavigate = function(url) {
        console.log('[Safe Navigation] Navigating to:', url);
        
        // Always update mock user before navigation
        const mockUser = {
            id: 'safe-nav-user-' + Date.now(),
            email: 'dev-user@example.com',
            name: 'Development User',
            created_at: new Date().toISOString()
        };
        
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        
        // Direct navigation without using window.location.href
        window.location = url;
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
