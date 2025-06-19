/**
 * TrashDrop Collector - Fixed Navigation
 * Simple, reliable navigation between pages that works in all browsers
 */

(function() {
    console.log('[Fixed Navigation] Initializing...');
    
    // Safe access to CONFIG with fallbacks
    function getSafeConfig() {
        const fallbackConfig = {
            dev: {
                testUser: {
                    id: 'mock-user-id'
                }
            },
            staticData: {
                emails: {
                    dev: 'test@example.com',
                    mock: 'test@example.com'
                }
            }
        };

        if (typeof window.CONFIG === 'undefined') {
            console.warn('[Fixed Navigation] CONFIG not available, using fallbacks');
            return fallbackConfig;
        }
        
        // Create a safe merged config with fallbacks for missing properties
        return {
            dev: {
                testUser: {
                    id: (window.CONFIG?.dev?.testUser?.id || fallbackConfig.dev.testUser.id)
                }
            },
            staticData: {
                emails: {
                    dev: (window.CONFIG?.staticData?.emails?.dev || fallbackConfig.staticData.emails.dev),
                    mock: (window.CONFIG?.staticData?.emails?.mock || fallbackConfig.staticData.emails.mock)
                }
            }
        };
    }
    
    // Create a mock user for development (won't override existing)
    function ensureMockUser() {
        if (!localStorage.getItem('mockUser')) {
            try {
                // Get config safely
                const safeConfig = getSafeConfig();
                
                // Generate a unique ID safely with fallbacks
                const userId = safeConfig?.dev?.testUser?.id || 'mock-user-id';
                const email = safeConfig?.staticData?.emails?.dev || 'test@example.com';
                
                const mockUser = {
                    id: userId + '-' + Date.now(),
                    email: email,
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
            } catch (error) {
                console.error('[Fixed Navigation] Error creating mock user:', error);
                // Create a basic mock user as fallback
                const fallbackUser = {
                    id: 'mock-user-' + Date.now(),
                    email: 'fallback@example.com',
                    name: 'Fallback User',
                    created_at: new Date().toISOString(),
                    role: 'collector'
                };
                localStorage.setItem('mockUser', JSON.stringify(fallbackUser));
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
