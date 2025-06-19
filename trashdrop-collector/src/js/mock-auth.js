/**
 * TrashDrop Collector - Mock Authentication for Development
 * This file provides a reliable mock authentication system for development
 */

(function() {

// Initialize TrashDrop namespace if not exists
window.TrashDrop = window.TrashDrop || {};
window.TrashDrop.auth = window.TrashDrop.auth || {};

// Safe CONFIG access
function getSafeConfig() {
    return window.CONFIG || {
        dev: {
            testUser: {
                id: 'mock-user-123',
                email: 'demo@trashdrop.com',
                name: 'Demo User',
                role: 'collector'
            },
            auth: {
                mockTokenPrefix: 'mock_token_'
            }
        }
    };
}

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

// Get CONFIG safely
const safeConfig = getSafeConfig();

// Mock user data using centralized config
const MOCK_USER = {
    id: safeConfig.dev?.testUser?.id || 'mock-user-123',
    email: safeConfig.dev?.testUser?.email || 'demo@trashdrop.com',
    name: safeConfig.dev?.testUser?.name || 'Demo User',
    role: safeConfig.dev?.testUser?.role || 'collector',
    created_at: new Date().toISOString()
};

// Initialize mock auth if in development
if (isDev) {
    // Initialize with default user
    currentUser = MOCK_USER;
    
    // Handle case where CONFIG is not available yet
    let tokenPrefix = 'mock-token-';
    try {
        if (window.CONFIG && window.CONFIG.dev && window.CONFIG.dev.auth) {
            tokenPrefix = window.CONFIG.dev.auth.mockTokenPrefix || tokenPrefix;
        }
    } catch (err) {
        console.warn('CONFIG not fully loaded for mock-auth.js, using fallback token prefix');
    }
    
    authToken = tokenPrefix + Date.now();
    
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
        authToken = CONFIG.dev.auth.mockTokenPrefix + Date.now();
        
        // Store in sessionStorage to persist across page reloads
        sessionStorage.setItem('mock_user', JSON.stringify(currentUser));
        sessionStorage.setItem('mock_token', authToken);
        
        return {
            user: currentUser,
            session: {
                access_token: authToken,
                refresh_token: CONFIG.dev.auth.mockRefreshToken,
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
    
    console.log('Mock authentication initialized successfully!');
}

})(); // Close IIFE
