/**
 * TrashDrop Collector - Mock Authentication for Development
 * This file provides a reliable mock authentication system for development
 */

// Mock user data in memory
let currentUser = null;
let authToken = null;

// Check if we're in development mode
const isDev = window.location.hostname === 'localhost' || 
             window.location.hostname.includes('127.0.0.1') ||
             window.location.port === '5500' ||
             window.location.port === '5501';

if (!isDev) {
    console.log('Production environment detected. Mock auth disabled.');
} else {
    console.log('Development environment detected. Mock authentication enabled.');
}

// Mock user data
const MOCK_USER = {
    id: 'mock-user-12345',
    email: 'test@example.com',
    name: 'Test User',
    role: 'collector',
    created_at: new Date().toISOString()
};

// Initialize mock auth if in development
if (isDev) {
    // Initialize with default user
    currentUser = MOCK_USER;
    authToken = 'mock-token-' + Date.now();
    
    // Override getCurrentUser
    window.getCurrentUser = function() {
        console.log('getCurrentUser called');
        if (currentUser) {
            return { user: currentUser, error: null };
        }
        return { user: null, error: 'Not authenticated' };
    };
    
    // Override signInWithEmail
    window.signInWithEmail = async function(email, password) {
        console.log('Mock signInWithEmail called with:', email);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Set the current user and token
        currentUser = { ...MOCK_USER, email };
        authToken = 'mock-token-' + Date.now();
        
        // Store in sessionStorage to persist across page reloads
        sessionStorage.setItem('mock_user', JSON.stringify(currentUser));
        sessionStorage.setItem('mock_token', authToken);
        
        return {
            user: currentUser,
            session: {
                access_token: authToken,
                refresh_token: 'mock-refresh-token',
                user: currentUser
            },
            error: null
        };
    };
    
    // Override signOut
    window.signOut = async function() {
        console.log('Mock signOut called');
        currentUser = null;
        authToken = null;
        sessionStorage.removeItem('mock_user');
        sessionStorage.removeItem('mock_token');
        return { error: null };
    };
    
    // Check for existing session on page load
    const savedUser = sessionStorage.getItem('mock_user');
    const savedToken = sessionStorage.getItem('mock_token');
    
    if (savedUser && savedToken) {
        try {
            currentUser = JSON.parse(savedUser);
            authToken = savedToken;
            console.log('Restored user session:', currentUser.email);
        } catch (e) {
            console.error('Error parsing saved user:', e);
        }
    }
    
    console.log('Mock authentication initialized');
}
