/**
 * TrashDrop Collector - Fixed Navigation
 * Simple, reliable navigation between pages that works in all browsers
 */

(function() {
    console.log('[Fixed Navigation] Initializing...');
    
    // Create a mock user for development (won't override existing)
    function ensureMockUser() {
        if (!localStorage.getItem('mockUser')) {
            const mockUser = {
                id: 'mock-user-' + Date.now(),
                email: 'dev@example.com',
                name: 'Development User',
                created_at: new Date().toISOString(),
                role: 'collector'
            };
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            console.log('[Fixed Navigation] Created mock user');
            
            // Also update global app state if it exists
            if (window.appState) {
                window.appState.user = mockUser;
            }
        }
    }
    
    // Fix navigation links without manipulating browser properties
    function fixNavigationLinks() {
        // Ensure we have a mock user for development
        ensureMockUser();
        
        // Handle all navigation links
        setTimeout(function() {
            const navItems = document.querySelectorAll('.bottom-nav .nav-item');
            if (navItems.length === 0) {
                console.log('[Fixed Navigation] No navigation items found yet');
                return;
            }
            
            console.log('[Fixed Navigation] Found navigation links:', navItems.length);
            
            // Process each nav item
            navItems.forEach(item => {
                // Skip already processed items
                if (item.getAttribute('data-fixed') === 'true') return;
                
                // Mark as fixed
                item.setAttribute('data-fixed', 'true');
                
                // Get original href
                const href = item.getAttribute('href');
                if (!href) return;
                
                // Replace with safe navigation
                item.removeAttribute('href');
                item.style.cursor = 'pointer';
                
                // Add click handler
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    console.log('[Fixed Navigation] Navigating to:', href);
                    
                    // Ensure user exists before navigation
                    ensureMockUser();
                    
                    // Navigate safely without page reload if possible
                    try {
                        window.location = href;
                    } catch (err) {
                        // Fallback
                        window.location.replace(href);
                    }
                });
            });
            
            console.log('[Fixed Navigation] Navigation links fixed');
        }, 300);
    }
    
    // Run immediately
    ensureMockUser();
    
    // Also run when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixNavigationLinks);
    } else {
        fixNavigationLinks();
    }
    
    // Run again after a delay to ensure all elements are loaded
    setTimeout(fixNavigationLinks, 500);
    setTimeout(fixNavigationLinks, 1000);
    
    console.log('[Fixed Navigation] Navigation fix applied');
})();
