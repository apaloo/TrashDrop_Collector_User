/**
 * TrashDrop Collector - Bottom Navigation Fix
 * Fixes navigation issues without affecting existing functionality
 */

// Execute immediately when script loads
(function() {
    // Function to fix bottom navigation after DOM is loaded
    function fixBottomNavigation() {
        // Find all navigation links in the bottom nav
        const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
        
        if (!navLinks || navLinks.length === 0) {
            console.log('[Bottom Nav Fix] No navigation links found');
            return;
        }
        
        console.log('[Bottom Nav Fix] Found navigation links:', navLinks.length);
        
        // Process each navigation link
        navLinks.forEach(link => {
            // Store the original href
            const originalHref = link.getAttribute('href');
            
            // Skip if link doesn't have an href
            if (!originalHref) return;
            
            // Mark this link as processed to avoid double processing
            if (link.hasAttribute('data-nav-fixed')) return;
            link.setAttribute('data-nav-fixed', 'true');
            
            // Override click behavior
            link.addEventListener('click', function(event) {
                // Prevent the default navigation
                event.preventDefault();
                
                console.log('[Bottom Nav Fix] Navigation clicked:', originalHref);
                
                // Ensure we have a mock user for development - without affecting production
                if (window.location.hostname === 'localhost' || 
                    window.location.hostname.includes('127.0.0.1') ||
                    window.location.port === '5500' ||
                    window.location.port === '5501') {
                    
                    // Create a temporary user for navigation
                    const tempUser = {
                        id: 'nav-user-' + Date.now(),
                        email: CONFIG.staticData.emails.temp, // Using centralized email configuration
                        role: 'collector',
                        created_at: new Date().toISOString()
                    };
                    
                    // Store in localStorage without affecting existing user if present
                    if (!localStorage.getItem('mockUser')) {
                        localStorage.setItem('mockUser', JSON.stringify(tempUser));
                    }
                }
                
                // Navigate safely using direct assignment to location
                window.location = originalHref;
            });
            
            console.log('[Bottom Nav Fix] Fixed navigation for:', originalHref);
        });
    }
    
    // Run on DOM content loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixBottomNavigation);
    } else {
        // DOM already loaded, run immediately
        fixBottomNavigation();
    }
    
    // Also run after a short delay to ensure everything is loaded
    setTimeout(fixBottomNavigation, 200);
    
    console.log('[Bottom Nav Fix] Navigation fix installed');
})();
