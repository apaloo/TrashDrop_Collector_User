/**
 * TrashDrop Collector - Bottom Navigation Component
 * Creates a consistent bottom navigation across all pages
 */

(function() {
    console.log('🧭 Bottom Navigation: Initializing');
    
    // Create bottom navigation immediately and again on DOM load to ensure it exists
    initializeBottomNav();
    
    // Also initialize on DOM load for more reliable loading
    document.addEventListener('DOMContentLoaded', function() {
        initializeBottomNav();
    });
    
    // Also add a delayed initialization to ensure CSS is fully loaded
    setTimeout(initializeBottomNav, 500);

    // Initialize bottom navigation bars across the app
    function initializeBottomNav() {
        console.log('🧭 Bottom Navigation: Setting up navigation bar');
        
        // Get current page path to highlight active tab
        const currentPath = window.location.pathname;
        
        // Define safeNavigate if it doesn't exist yet
        if (typeof window.safeNavigate !== 'function') {
            window.safeNavigate = function(url) {
                console.log('🧭 Bottom Navigation: Safe navigating to', url);
                // Plain direct navigation
                window.location = url;
            };
        }
        
        // Create navigation HTML using onclick instead of href for more reliable navigation
        const navHTML = `
        <div class="bottom-nav">
            <a onclick="safeNavigate('./map.html')" class="nav-item ${currentPath.includes('map.html') ? 'active' : ''}">
                <i class="material-icons">map</i>
                <span>Map</span>
            </a>
            <a onclick="safeNavigate('./request.html')" class="nav-item ${currentPath.includes('request.html') ? 'active' : ''}">
                <i class="material-icons">add_circle</i>
                <span>Request</span>
            </a>
            <a onclick="directAssignNavigation()" class="nav-item ${currentPath.includes('assign.html') ? 'active' : ''}" id="assign-tab">
                <i class="material-icons">assignment</i>
                <span>Assign</span>
            </a>
            <a onclick="safeNavigate('./earnings.html')" class="nav-item ${currentPath.includes('earnings.html') ? 'active' : ''}">
                <i class="material-icons">account_balance_wallet</i>
                <span>Earnings</span>
            </a>
        </div>
        `;
        
        // Special handler for assign navigation
        window.directAssignNavigation = function() {
            console.log('🔍 Direct navigation to assign page...');
            
            // Create a mock user first to ensure authentication
            const mockUser = {
                id: 'assign-nav-user-' + Date.now(),
                email: 'test@example.com',
                name: 'Direct Navigation User',
                created_at: new Date().toISOString(),
                role: 'collector'
            };
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
            
            // Set session flag to indicate we're accessing assign page
            sessionStorage.setItem('assign_page_accessed', 'true');
            
            try {
                // Use direct location change instead of safeNavigate
                console.log('🚀 Direct navigation to assign.html');
                window.location.href = './assign.html';
            } catch (e) {
                console.error('❌ Error navigating to assign page:', e);
                alert('Could not navigate to Assign page. Please try again.');
            }
        };
        
        // Find existing navigation or create new one
        let bottomNavContainer = document.querySelector('.bottom-nav');
        
        if (!bottomNavContainer) {
            // Find any bottom navigation implementation
            bottomNavContainer = document.querySelector('[style*="position:fixed;bottom:0"]');
            
            if (bottomNavContainer) {
                console.log('🧭 Bottom Navigation: Replacing existing navigation');
                bottomNavContainer.outerHTML = navHTML;
            } else {
                console.log('🧭 Bottom Navigation: Creating new navigation');
                const navElement = document.createElement('div');
                navElement.innerHTML = navHTML;
                document.body.appendChild(navElement.firstElementChild);
            }
        } else {
            console.log('🧭 Bottom Navigation: Updating existing navigation');
            bottomNavContainer.outerHTML = navHTML;
        }
        
        // Add styles if needed
        if (!document.getElementById('bottom-nav-styles')) {
            const navStyles = document.createElement('style');
            navStyles.id = 'bottom-nav-styles';
            navStyles.textContent = `
                .bottom-nav {
                    position: fixed !important;
                    bottom: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                    height: 60px !important;
                    background-color: #ffffff !important;
                    display: flex !important;
                    justify-content: space-around !important;
                    align-items: center !important;
                    box-shadow: 0 -2px 10px rgba(0,0,0,0.1) !important;
                    z-index: 1001 !important;
                    padding-bottom: calc(0.5rem + env(safe-area-inset-bottom, 0)) !important;
                    border-top: 1px solid rgba(0,0,0,0.1) !important;
                }
                .bottom-nav .nav-item,
                .bottom-nav a.nav-item {
                    flex: 1 !important;
                    display: flex !important;
                    flex-direction: column !important;
                    align-items: center !important;
                    justify-content: center !important;
                    text-decoration: none !important;
                    color: #757575 !important;
                    cursor: pointer !important;
                    min-height: 44px !important;
                    margin: 0 2px !important;
                    padding: 4px 0 !important;
                }
                .bottom-nav .nav-item.active,
                .bottom-nav a.nav-item.active {
                    color: #4CAF50 !important;
                }
                .bottom-nav .nav-item i,
                .bottom-nav a.nav-item i {
                    font-size: 24px !important;
                    display: block !important;
                    margin-bottom: 4px !important;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
                }
                .bottom-nav .nav-item i.material-icons,
                .bottom-nav a.nav-item i.material-icons {
                    font-family: 'Material Icons' !important;
                    visibility: visible !important;
                    opacity: 1 !important;
                }
                .bottom-nav .nav-item span,
                .bottom-nav a.nav-item span {
                    font-size: 12px !important;
                    margin-top: 2px !important;
                    display: block !important;
                    text-align: center !important;
                }
            `;
            document.head.appendChild(navStyles);
        }
    }
    
    // Expose the initialization function globally
    window.initializeBottomNav = initializeBottomNav;
})();
