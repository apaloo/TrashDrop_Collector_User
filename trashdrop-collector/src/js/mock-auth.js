/**
 * TrashDrop Collector - Mock Authentication for Development
 * This file provides a reliable mock authentication system for development
 */

// Always ensure we have a mock user in development mode
(function setupMockAuth() {
    // Check if we're in development mode
    const isDev = window.location.hostname === 'localhost' || 
                 window.location.hostname.includes('127.0.0.1') ||
                 window.location.port === '5500' ||
                 window.location.port === '5501';
    
    if (!isDev) {
        console.log('Production environment detected. Mock auth disabled.');
        return;
    }
    
    console.log('Development environment detected. Setting up mock authentication.');
    
    // Create mock user if it doesn't exist
    if (!localStorage.getItem('mockUser')) {
        const mockUser = {
            id: 'mock-user-' + Date.now(),
            email: 'mockuser@example.com',
            name: 'Mock User',
            created_at: new Date().toISOString(),
            role: 'collector'
        };
        
        // Store user in localStorage
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        console.log('Created mock user:', mockUser.email);
    } else {
        console.log('Using existing mock user');
    }
    
    // Override authentication functions to use mock user
    window.getCurrentUser = function() {
        const mockUserStr = localStorage.getItem('mockUser');
        if (mockUserStr) {
            try {
                return Promise.resolve(JSON.parse(mockUserStr));
            } catch (e) {
                console.error('Error parsing mock user:', e);
            }
        }
        return Promise.resolve(null);
    };
    
    window.signOut = function() {
        console.log('Mock sign out called');
        localStorage.removeItem('mockUser');
        return Promise.resolve({ success: true });
    };
    
    // Skip auth check entirely in development mode
    window.bypassAuthForDev = true;
    
    console.log('Mock authentication setup complete');
})();
