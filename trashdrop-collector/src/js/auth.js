/**
 * TrashDrop Collector - Authentication Module
 * Handles user authentication with Supabase
 */

// Debug logging function
function debugLog(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// Check if we're in a browser environment
if (typeof window.isBrowser === 'undefined') {
    window.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Use the global isBrowser variable without redeclaring it
// Using var instead of const allows this script to run multiple times without errors
// IIFE to avoid duplicate variable declaration errors
(function() {
  // Skip if we've already processed this code
  if (window._authJsProcessed) {
    console.log('Auth.js already processed, skipping initialization');
    return;
  }

  // Set flag to prevent duplicate initialization
  window._authJsProcessed = true;
  
  // Add redirect monitoring for debugging
  const originalWindowLocationHref = Object.getOwnPropertyDescriptor(window.location, 'href');
  
  // Override window.location.href to catch redirects
  try {
    Object.defineProperty(window.location, 'href', {
      set: function(newHref) {
        // Check if this is a login redirect
        if (newHref.includes('login.html')) {
          console.log('🚫 REDIRECT ATTEMPT TO LOGIN DETECTED');
          console.trace('Redirect call stack:');
          
          // Check for valid session
          if (window.__HAS_VALID_SESSION || localStorage.getItem('sb-mock-auth-token')) {
            console.log('🛡️ PREVENTING REDIRECT - Valid session found');
            return; // Prevent the redirect
          }
        }
        
        // Allow the redirect to proceed
        console.log('🔄 Redirecting to: ' + newHref);
        originalWindowLocationHref.set.call(window.location, newHref);
      },
      get: function() {
        return originalWindowLocationHref.get.call(window.location);
      }
    });
    console.log('🔍 Added redirect monitoring');
  } catch (e) {
    console.warn('⚠️ Failed to add redirect monitoring:', e);
  }

  // Use existing global isBrowser variable
  var isBrowser = window.isBrowser; 
                 (typeof window !== 'undefined' && typeof document !== 'undefined');

// Check if we're in development mode
let isDev = false;

if (isBrowser) {
    isDev = window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' || 
            window.location.port === '3000' ||
            window.location.port === '5500' ||
            window.location.port === '5501';
}

console.log('🔌 auth.js loaded successfully!');

// Use mock auth in development, otherwise use the real implementation
if (isDev) {
    console.log('🔧 Development mode detected - using mock authentication');
    // Mock Supabase client implementation will be used
    debugLog('🚀 Initializing mock Supabase client');
    
    // Simple mock user storage
    window.mockUsers = window.mockUsers || {};
    
    // Only declare currentUser if it doesn't exist (from mock-auth.js)
    if (typeof window.currentUser === 'undefined') {
        window.currentUser = null;
    }
} else {
    console.log('🚀 Initializing production authentication');
    // Real implementation would go here
}

// Safe access to CONFIG with fallbacks
const getConfig = () => {
  if (typeof window.CONFIG !== 'undefined') {
    return window.CONFIG;
  } else {
    console.warn('CONFIG not available for auth.js, using fallback values');
    return {
      dev: {
        testUser: {
          id: 'mock-user-id-123',
          email: 'test@example.com'
        },
        auth: {
          mockTokenAlgo: 'HS256',
          mockExpiry: '7d',
          mockIssuer: 'trashdrop-dev'
        }
      }
    };
  }
};

// Access config safely
const safeConfig = getConfig();

// Mock user data for local development using safeConfig
if (typeof window.MOCK_USER_DATA === 'undefined') {
  window.MOCK_USER_DATA = {
    id: safeConfig.dev.testUser.id,
    email: safeConfig.dev.testUser.email,
    name: 'Test User',
    role: 'collector'
  };
}

// Generate a consistent mock token for development
const generateMockToken = (userData) => {
  // Simple mock token structure that mimics a JWT using centralized config
  const header = btoa(JSON.stringify({ alg: safeConfig.dev.auth.mockTokenAlgo, typ: 'JWT' }));
  const payload = btoa(JSON.stringify({
    sub: userData.id,
    email: userData.email,
    name: userData.name,
    role: userData.role,
    iss: safeConfig.dev.auth.mockIssuer,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 // 7 days
  }));
  // Third part would normally be a signature in a real JWT
  const signature = btoa('mock-signature-for-dev');
  
  return `${header}.${payload}.${signature}`;
};

// Mock sign in with email and password
function signInWithEmail(email, password) {
  debugLog('Mock signInWithEmail called with:', { email });

  // In dev mode, allow any credentials (for testing)
  if (isDev) {
    const mockUser = { ...window.MOCK_USER_DATA, email };
    const mockToken = generateMockToken(mockUser);

    // Create auth data
    const mockAuthData = {
      user: mockUser,
      session: {
        access_token: mockToken,
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
      }
    };

    // Store in localStorage
    localStorage.setItem('auth_user', JSON.stringify(mockUser));
    localStorage.setItem('auth_token', mockToken);
    sessionStorage.setItem('justLoggedIn', 'true');
    
    // Update current user
    window.currentUser = mockUser;
    
    console.log('📱 Mock user login success:', email);
    return Promise.resolve({ data: mockAuthData, error: null });
  } else {
    // In production, check that supabase client exists
    if (window.supabaseClient && window.supabaseClient.auth) {
      // Production implementation using real Supabase
      return window.supabaseClient.auth.signInWithPassword({ email, password });
    } else {
      console.error('❌ Supabase client not initialized');
      return Promise.resolve({ data: null, error: { message: 'Supabase client not initialized' } });
    }
  }
}

// Sign out functionality
function signOut() {
  debugLog('Sign out called');
  
  if (isDev) {
    // Clear auth data regardless of environment
    localStorage.removeItem('auth_user');
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('justLoggedIn');
    
    // Clear current user
    window.currentUser = null;
    
    console.log('👋 User signed out');
    return Promise.resolve({ error: null });
  } else {
    // Production sign out using Supabase
    if (window.supabaseClient && window.supabaseClient.auth) {
      return window.supabaseClient.auth.signOut();
    } else {
      console.error('❌ Supabase client not initialized');
      return Promise.resolve({ error: { message: 'Supabase client not initialized' } });
    }
  }
}

// Mock auto-login for testing in development
function autoLoginForTesting() {
  // Check if we're in test mode - never auto-login in test mode
  if (window.TRASHDROP_TEST_MODE === true) {
    console.log('🧪 Test mode active: Skipping auto-login');
    return false;
  }
  
  // Only auto-login for testing in development mode
  if (!isDev) return false;
  
  // Only auto-login if not already logged in
  if (localStorage.getItem('auth_user')) {
    console.log('🔑 Already logged in, skipping auto-login');
    return false;
  }
  
  // Use the mock user data to auto-login
  const mockUser = window.MOCK_USER_DATA;
  const mockToken = generateMockToken(mockUser);
  
  localStorage.setItem('auth_user', JSON.stringify(mockUser));
  localStorage.setItem('auth_token', mockToken);
  
  // Update current user
  window.currentUser = mockUser;
  
  console.log('🤖 Auto-login for testing as:', mockUser.email);
  return true;
}

// Get current user information
function getCurrentUser() {
  let user = null;
  let token = null;
  
  try {
    // Try to get user from localStorage
    const localUser = localStorage.getItem('auth_user');
    token = localStorage.getItem('auth_token');
    
    if (localUser) {
      user = JSON.parse(localUser);
    }
  } catch (error) {
    console.error('❌ Error getting current user:', error);
  }
  
  return { user, token };
}

// Initialize login form if present
function initializeLoginForm() {
  if (!isBrowser) return;
  
  const loginForm = document.getElementById('login-form');
  if (!loginForm) {
    debugLog('No login form found, skipping initialization');
    return;
  }
  
  debugLog('Initializing login form');
  
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
      console.error('❌ Login form inputs not found');
      return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    try {
      const result = await signInWithEmail(email, password);
      
      if (result.error) {
        console.error('❌ Login error:', result.error);
        alert(`Login failed: ${result.error.message || 'Unknown error'}`);
      } else {
        console.log('✅ Login successful!');
        window.location.href = 'map.html';
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      alert(`Login failed: ${error.message || 'Unknown error'}`);
    }
  });
  
  debugLog('✅ Login form initialized successfully');
}

// Simple auth check
const checkAndRedirect = () => {
  // If we're in test mode, NEVER do any redirects
  if (window.TRASHDROP_TEST_MODE === true) {
    console.log('🧪 Test mode active: Bypassing all auth checks and redirects');
    return false;
  }
  
  // Get current path for checks
  const currentPath = window.location.pathname;
  const isLoginPage = currentPath.endsWith('login.html');
  const isAssignPage = currentPath.endsWith('assign.html');
  const isProtectedPage = !isLoginPage && !currentPath.endsWith('signup.html') && 
                          !currentPath.endsWith('reset-password.html') && 
                          !currentPath.endsWith('email-confirmation.html');
  
  // Check if assign page has been accessed in this session
  const assignPageAccessed = sessionStorage.getItem('assign_page_accessed') === 'true';
  
  // Get user with fallback
  let user = null;
  try {
    // Use getCurrentUser safely
    const userResult = getCurrentUser();
    user = userResult ? userResult.user : null;
  } catch (error) {
    console.warn('⚠️ Auth check error:', error);
    // Create emergency mock user to prevent endless redirects
    if (isAssignPage || assignPageAccessed) {
      const mockUser = {
        id: 'emergency-user-' + Date.now(),
        email: 'test@example.com',
        name: 'Emergency User',
        created_at: new Date().toISOString(),
        role: 'collector'
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      console.info('🔐 Created emergency mock user to prevent redirect loop');
      return false; // Skip redirect
    }
  }
  
  // Special handling for Assign page
  if (isAssignPage) {
    // Force mock user creation for Assign page
    if (!user) {
      console.log('ℹ️ Creating mock user for Assign page access');
      const mockUser = {
        id: 'assign-page-user-' + Date.now(),
        email: 'test@example.com',
        name: 'Assign Page User',
        created_at: new Date().toISOString(),
        role: 'collector'
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
    }
    return false; // Never redirect away from assign page during auth check
  }
  
  // Check for our session flag or mock session before redirecting
  const hasValidSession = window.__HAS_VALID_SESSION || 
                        localStorage.getItem('sb-mock-auth-token') ||
                        (user && user.id);
  
  // Regular auth flow with session check
  if (hasValidSession && isLoginPage) {
    // If user has a valid session and is on login page, redirect to map
    console.log('🔑 Valid session found on login page - redirecting to map');
    window.location.href = 'map.html';
    return true;
  } else if (!hasValidSession && isProtectedPage) {
    // If no valid session and on protected page, check conditions before redirecting
    if (assignPageAccessed) {
      console.log('🔒 Skipping login redirect because assign page was accessed');
      return false;
    }
    
    // Check if we're in development mode or have a mock session
    const isDev = window.location.hostname === 'localhost' || 
                 window.location.hostname === '127.0.0.1' || 
                 window.location.port === '3000' ||
                 window.location.port === '5500' ||
                 window.location.port === '5501';
    
    if (isDev) {
      console.log('🔧 Development mode - skipping login redirect');
      return false;
    }
    
    console.log('🔒 No valid session on protected page - redirecting to login');
    window.location.href = 'login.html';
    return true;
  }
  return false;
};

// Initialize auth and auto-login for testing
function initializeAuth() {
  // Check if we're in test mode - skip all initialization that could cause redirects
  if (window.TRASHDROP_TEST_MODE === true) {
    console.log('🧪 Test mode active: Initializing auth without auto-login or redirects');
    
    // Still initialize login form for form functionality
    initializeLoginForm();
    
    // Debug logs for test mode
    console.log('🔍 Auth module initialized in TEST MODE. Available functions:', {
      signInWithEmail: typeof window.signInWithEmail === 'function',
      signOut: typeof window.signOut === 'function',
      getCurrentUser: typeof window.getCurrentUser === 'function'
    });
    
    return; // Skip the rest in test mode
  }
  
  // Normal initialization for non-test mode
  // Try auto-login first
  if (autoLoginForTesting()) {
    console.log('✅ Auto-logged in as test user');
  }
  
  // Debug log to verify auth functions are available
  console.log('🔍 Auth module initialized. Available functions:', {
    signInWithEmail: typeof window.signInWithEmail === 'function',
    signOut: typeof window.signOut === 'function',
    getCurrentUser: typeof window.getCurrentUser === 'function'
  });
  
  // Initialize login form and check auth
  initializeLoginForm();
  checkAndRedirect();
}

// Expose functions to window object if in browser
if (isBrowser) {
    // Core auth functions
    window.signInWithEmail = signInWithEmail;
    window.signOut = signOut;
    window.getCurrentUser = getCurrentUser;
    window.updateAuthUI = function() {
      console.log('updateAuthUI called');
    };
    window.initializeAuth = initializeAuth;
    
    console.log('🔌 Auth functions exposed to window');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded, initializing auth...');
    initializeAuth();
  });
} else {
  console.log('DOM already loaded, initializing auth immediately');
  setTimeout(initializeAuth, 0);
}

console.log('Auth module loaded and ready');

// Close the IIFE opened at the beginning of the file
})();
