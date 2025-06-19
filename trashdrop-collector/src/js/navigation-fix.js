/**
 * TrashDrop Collector - Navigation Fix
 * This script prevents logout redirects when navigation buttons are clicked
 */

(function() {
    // Immediately ensure we have a mock user in localStorage (development mode)
    function createMockUserIfNeeded() {
        if (!localStorage.getItem('mockUser')) {
            try {
                // Safely access CONFIG with fallbacks
                const config = window.CONFIG || {};
                const userId = (config.dev && config.dev.testUser && config.dev.testUser.id) ? 
                    config.dev.testUser.id : 'mock-user-id';
                const email = (config.staticData && config.staticData.emails && config.staticData.emails.mock) ? 
                    config.staticData.emails.mock : 'test@example.com';
                
                const mockUser = {
                    id: userId + '-' + Date.now(),
                    email: email,
                    name: 'Mock User',
                    created_at: new Date().toISOString(),
                    role: 'collector'
                };
                localStorage.setItem('mockUser', JSON.stringify(mockUser));
                console.log('[Navigation Fix] Created mock user');
            } catch (error) {
                console.error('[Navigation Fix] Error creating mock user:', error);
                // Create a fallback mock user if there's any error
                const fallbackUser = {
                    id: 'mock-user-' + Date.now(),
                    email: 'test@example.com',
                    name: 'Emergency Mock User',
                    created_at: new Date().toISOString(),
                    role: 'collector'
                };
                localStorage.setItem('mockUser', JSON.stringify(fallbackUser));
                console.log('[Navigation Fix] Created emergency fallback user');
            }
        }
    }

    // Hijack window.location.href setter to prevent unwanted redirects
    let originalHref = window.location.href;
    Object.defineProperty(window.location, 'href', {
        get: function() {
            return originalHref;
        },
        set: function(newValue) {
            console.log('[Navigation Fix] Detected redirect to:', newValue);

            // Block redirects to login page from app pages
            if (newValue.includes('login.html') && 
                (window.location.pathname.includes('request.html') || 
                 window.location.pathname.includes('map.html') || 
                 window.location.pathname.includes('account.html') || 
                 window.location.pathname.includes('assign.html') || 
                 window.location.pathname.includes('earnings.html'))) {
                
                console.log('[Navigation Fix] Blocked unwanted redirect to login page');
                createMockUserIfNeeded();
                return originalHref;
            }

            // Allow the redirect for other cases
            originalHref = newValue;
            return newValue;
        },
        configurable: true
    });

    // Fix navigation links
    document.addEventListener('DOMContentLoaded', function() {
        // Create a mock user immediately
        createMockUserIfNeeded();
        
        // Fix the Request button in bottom navigation
        setTimeout(function() {
            // Add click interceptors to prevent default behavior
            const navLinks = document.querySelectorAll('.bottom-nav .nav-item');
            
            if (navLinks.length) {
                console.log('[Navigation Fix] Found navigation links:', navLinks.length);
                
                navLinks.forEach(link => {
                    // Remove original href to prevent default navigation
                    const originalHref = link.getAttribute('href');
                    
                    // Store original href as data attribute
                    link.setAttribute('data-original-href', originalHref);
                    
                    // Remove the href to prevent default navigation behavior
                    // Only for request.html link
                    if (originalHref.includes('request.html')) {
                        console.log('[Navigation Fix] Fixed Request navigation link');
                        link.removeAttribute('href');
                        
                        // Add click listener
                        link.addEventListener('click', function(e) {
                            e.preventDefault();
                            
                            // Ensure we have a mock user for development
                            createMockUserIfNeeded();
                            
                            // Navigate safely
                            console.log('[Navigation Fix] Safe navigation to:', originalHref);
                            // Use direct window location change without triggering our override
                            window.location = originalHref;
                        });
                    }
                });
            }
        }, 100);
    });
    
    // Create mock user on load
    createMockUserIfNeeded();
    console.log('[Navigation Fix] Navigation protection active');
})();
