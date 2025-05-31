/**
 * TrashDrop Collector - Authentication Module
 * Handles user authentication with Supabase
 */

// Check if we're in a browser environment
if (typeof window.isBrowser === 'undefined') {
    window.isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Debug logging function
function debugLog(...args) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]`, ...args);
}

// Check if we're in development mode
let isDev = false;
if (window.isBrowser) {
    isDev = window.location.hostname === 'localhost' || 
            window.location.hostname.includes('127.0.0.1') ||
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

// Test user for development
const TEST_USER = {
  id: 'test-user-123',
  email: 'test@example.com',
  created_at: new Date().toISOString(),
  name: 'Test User',
  role: 'user',
  aud: 'authenticated',
  app_metadata: { provider: 'email' },
  user_metadata: { 
    name: 'Test User',
    full_name: 'Test User',
    avatar_url: 'https://ui-avatars.com/api/?name=Test+User&background=random'
  },
  role: 'authenticated',
  last_sign_in_at: new Date().toISOString()
};

// Auto-login for testing
function autoLoginForTesting() {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    debugLog('🔓 Auto-login enabled for testing');
    window.currentUser = TEST_USER;
    window.mockUsers[TEST_USER.email] = TEST_USER;
    
    // Create and store session
    const session = {
      access_token: `test-token-${Date.now()}`,
      token_type: 'bearer',
      user: window.currentUser,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600
    };
    
    localStorage.setItem('auth_token', session.access_token);
    localStorage.setItem('auth_user', JSON.stringify(window.currentUser));
    
    // Update UI
    updateAuthUI(window.currentUser);
    return true;
  }
  return false;
}

// Create mock Supabase client
window.supabase = window.supabaseClient = {
  auth: {
    signInWithPassword: async ({ email, password }) => {
      try {
        debugLog('🔑 Mock signInWithPassword called with:', { email });
        
        if (!email) {
          throw new Error('Email is required');
        }
        
        // Use the main signInWithEmail function to handle the actual login
        const result = await signInWithEmail(email, password);
        
        if (result.error) {
          return { error: result.error };
        }
        
        // Create a session object
        const session = {
          access_token: 'mock-token',
          refresh_token: 'mock-refresh-token',
          user: result.user,
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer'
        };
        
        // Store the user and token in localStorage
        localStorage.setItem('auth_token', session.access_token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));
        
        // Update the current user
        window.currentUser = result.user;
        
        return {
          data: {
            user: result.user,
            session: session
          },
          error: null
        };
      } catch (error) {
        console.error('❌ Error in signInWithPassword:', error);
        return { error };
      }
    },
    
    signOut: async () => {
      debugLog('👋 Signing out user');
      window.currentUser = null;
      return { error: null };
    },
    
    getSession: async () => {
      debugLog('🔒 Checking for active session...');
      
      // First check if we have a user in memory
      if (window.currentUser) {
        debugLog('✅ Session found in memory for user:', window.currentUser.email);
        return {
          data: {
            session: {
              access_token: localStorage.getItem('auth_token') || `mock-access-token-${Date.now()}`,
              user: window.currentUser,
              expires_in: 3600,
              expires_at: Math.floor(Date.now() / 1000) + 3600
            }
          },
          error: null
        };
      }
      
      // Try to restore session from localStorage
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          debugLog('🔑 Restored session from localStorage for user:', user.email);
          window.currentUser = user;
          
          return {
            data: {
              session: {
                access_token: storedToken,
                user,
                expires_in: 3600,
                expires_at: Math.floor(Date.now() / 1000) + 3600
              }
            },
            error: null
          };
        }
      } catch (error) {
        debugLog('❌ Error restoring session from localStorage:', error);
      }
      
      debugLog('⚠️ No active session found');
      return { 
        data: { session: null }, 
        error: { message: 'No active session' } 
      };
    },
    
    getUser: async () => {
      debugLog('🔍 Checking for current user...');
      
      // Check if we have a user in memory
      if (window.currentUser) {
        debugLog('✅ User found in memory:', window.currentUser.email);
        return {
          data: { user: window.currentUser },
          error: null
        };
      }
      
      // Try to restore from localStorage
      try {
        const storedUser = localStorage.getItem('auth_user');
        const storedToken = localStorage.getItem('auth_token');
        
        if (storedUser && storedToken) {
          const user = JSON.parse(storedUser);
          debugLog('🔑 Restored user from localStorage:', user.email);
          currentUser = user;
          return {
            data: { user },
            error: null
          };
        }
      } catch (error) {
        debugLog('❌ Error restoring user from localStorage:', error);
      }
      
      debugLog('⚠️ No authenticated user found');
      return {
        data: { user: null },
        error: { message: 'No user logged in' }
      };
    },
    
    onAuthStateChange: (callback) => ({
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    })
  }
};

// Simple auth functions
window.getCurrentUser = () => {
  console.group('🔍 getCurrentUser()');
  try {
    if (!isBrowser) {
      console.log('⚠️ Not in browser environment');
      return { user: null, error: 'Not in browser environment' };
    }

    // Check if we have a valid token and user in localStorage
    const token = localStorage.getItem('auth_token');
    const userJson = localStorage.getItem('auth_user');
    const justLoggedIn = sessionStorage.getItem('justLoggedIn') === 'true' || 
                        localStorage.getItem('justLoggedIn') === 'true';
    
    console.log('🔍 Auth check:', { 
      hasToken: !!token, 
      hasUserData: !!userJson,
      justLoggedIn: justLoggedIn,
      fromSessionStorage: sessionStorage.getItem('justLoggedIn'),
      fromLocalStorage: localStorage.getItem('justLoggedIn')
    });
    
    // If we just logged in, trust the session
    if (justLoggedIn) {
      console.log('✅ Just logged in, trusting session');
      try {
        if (!userJson) {
          throw new Error('No user data found despite justLoggedIn flag');
        }
        const user = JSON.parse(userJson);
        return { user, error: null };
      } catch (e) {
        console.error('❌ Error parsing user data after login:', e);
        // Clear invalid data
        sessionStorage.removeItem('justLoggedIn');
        localStorage.removeItem('justLoggedIn');
        return { user: null, error: 'Invalid user data after login: ' + e.message };
      }
    }
    
    // Regular session check
    if (!userJson || !token) {
      return { user: null, error: 'No active session' };
    }
    
    let user;
    try {
      user = JSON.parse(userJson);
    } catch (e) {
      console.error('❌ Error parsing user data:', e);
      return { user: null, error: 'Invalid user data' };
    }
    
    // Verify token expiration if we have it
    const sessionJson = localStorage.getItem('auth_session');
    if (sessionJson) {
      try {
        const session = JSON.parse(sessionJson);
        const now = Math.floor(Date.now() / 1000);
        
        if (session.expires_at && session.expires_at < now) {
          console.log('⚠️ Session expired');
          return { user: null, error: 'Session expired' };
        }
      } catch (e) {
        console.error('❌ Error checking session:', e);
      }
    }
    
    console.log('✅ Valid session found for user:', user.email);
    console.log('✅ Authentication successful');
    return { user, error: null };
    
  } catch (error) {
    console.error('❌ Auth error:', error);
    // Clear invalid auth data
    if (isBrowser) {
      console.log('🧹 Clearing invalid auth data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_session');
    }
    return { user: null, error: error.message };
  } finally {
    console.groupEnd();
  }
};

// Simple email/password authentication
window.signInWithEmail = async function(email, password) {
  console.group('🔑 signInWithEmail()');
  try {
    console.log('📧 Email:', email);
    
    // Input validation
    if (!email || !password) {
      const error = new Error('Email and password are required');
      console.error('❌ Validation error:', error.message);
      throw error;
    }

    // Email validation
    email = email.toLowerCase().trim();
    if (!email.includes('@') || !email.includes('.')) {
      const error = new Error('Please enter a valid email address');
      console.error('❌ Invalid email format:', email);
      throw error;
    }

    // Initialize mock users if needed
    if (!window.mockUsers) {
      console.log('📝 Initializing mock users storage');
      window.mockUsers = {};
    }
    
    // Create user data
    const userId = `user-${Date.now()}`;
    const userData = {
      id: userId,
      email: email,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      aud: 'authenticated',
      role: 'authenticated',
      user_metadata: { 
        name: email.split('@')[0],
        avatar_url: '',
        email: email
      },
      app_metadata: { provider: 'email' },
      last_sign_in_at: new Date().toISOString()
    };

    // Store user in mock storage
    window.mockUsers[email] = userData;
    console.log('Created/updated user:', userData);
    
    // Create session
    const session = {
      access_token: `mock-token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      token_type: 'bearer',
      user: userData,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      refresh_token: `mock-refresh-token-${Date.now()}`,
      token_type: 'bearer'
    };

    // Store in localStorage if in browser
    if (isBrowser) {
      try {
        console.log('💾 Storing auth data in localStorage...');
        
        // Store all necessary data
        localStorage.setItem('auth_token', session.access_token);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('auth_session', JSON.stringify(session));
        
        // Set a flag that we just logged in (use both sessionStorage and localStorage for redundancy)
        sessionStorage.setItem('justLoggedIn', 'true');
        localStorage.setItem('justLoggedIn', 'true');
        
        // Verify storage
        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');
        const storedJustLoggedIn = sessionStorage.getItem('justLoggedIn');
        
        console.log('✅ Auth data stored:', {
          tokenStored: !!storedToken,
          userStored: !!storedUser,
          justLoggedIn: storedJustLoggedIn === 'true'
        });
        
        if (!storedToken || !storedUser) {
          throw new Error('Failed to store authentication data');
        }
        
      } catch (storageError) {
        console.error('❌ Error storing auth data:', storageError);
        // Clear any partial data
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('auth_session');
        sessionStorage.removeItem('justLoggedIn');
        localStorage.removeItem('justLoggedIn');
        
        throw new Error('Could not save authentication data: ' + storageError.message);
      }
    }

    console.log('🎉 Sign in successful for:', email);
    
    // Ensure we're returning the data in the expected format
    const result = { 
      user: userData, 
      session: session, 
      error: null 
    };
    
    console.log('✅ Returning auth result:', {
      hasUser: !!result.user,
      hasSession: !!result.session,
      hasError: !!result.error
    });
    
    return result;
    
  } catch (error) {
    const errorMessage = error.message || 'Failed to sign in';
    console.error('❌ Sign in error:', errorMessage, error);
    
    // Clear any partial auth data on error
    if (isBrowser) {
      console.log('🧹 Cleaning up partial auth data');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_session');
      sessionStorage.removeItem('justLoggedIn');
    }
    
    return { 
      user: null, 
      session: null, 
      error: errorMessage 
    };
  } finally {
    console.groupEnd();
  }
};

// Simple sign out
window.signOut = async () => {
  if (isBrowser) {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }
  return { error: null };
};

// Update UI based on auth state with enhanced logging
function updateAuthUI(user) {
  debugLog('🔄 Updating UI for user:', user ? user.email : 'No user');
  
  const loginSection = document.getElementById('loginSection');
  const userSection = document.getElementById('userSection');
  const userEmail = document.getElementById('userEmail');
  
  debugLog('📱 UI Elements:', { loginSection, userSection, userEmail });
  
  if (user) {
    debugLog('👤 User is logged in, showing user section');
    if (loginSection) {
      loginSection.style.display = 'none';
      debugLog('✅ Login section hidden');
    }
    if (userSection) {
      userSection.style.display = 'block';
      if (userEmail) {
        userEmail.textContent = user.email;
        debugLog('✅ User email updated:', user.email);
      }
    }
  } else {
    debugLog('👤 No user, showing login section');
    if (loginSection) {
      loginSection.style.display = 'block';
      debugLog('✅ Login section shown');
    }
    if (userSection) {
      userSection.style.display = 'none';
      debugLog('✅ User section hidden');
    }
    // User is logged out
    if (loginButton) loginButton.style.display = 'block';
    if (logoutButton) logoutButton.style.display = 'none';
    if (userEmail) userEmail.style.display = 'none';
    if (loginForm) loginForm.style.display = 'block';
    localStorage.removeItem('auth_token');
  }
}

// Suppress Live Server and other development console noise
const originalConsoleError = console.error;
console.error = function() {
  // Suppress Live Server status check errors
  if (arguments[0] && typeof arguments[0] === 'string' && 
      (arguments[0].includes('[Five Server]') || 
       arguments[0].includes('fiveserver'))) {
    return;
  }
  originalConsoleError.apply(console, arguments);
};

// Also suppress fetch errors for Live Server
if (window.isBrowser && !window._originalFetch) {
  window._originalFetch = window.fetch;
  window.fetch = async function(resource, init) {
    try {
      return await window._originalFetch(resource, init);
    } catch (error) {
      if (!error.message.includes('Failed to fetch')) {
        console.error('Fetch error:', error);
      }
      throw error;
    }
  };
}

// Enhanced login form initialization
function initializeLoginForm() {
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('loginError');
  
  if (!loginForm) {
    debugLog('ℹ️ No login form found on this page');
    return;
  }
  
  debugLog('🔧 Initializing login form');
  
  // Check if already logged in
  debugLog('🔍 Checking if user is already logged in...');
  const { user, error } = window.getCurrentUser();
  if (error) {
    debugLog('⚠️ Error checking auth state:', error);
  }
  if (user) {
    debugLog('👤 User already logged in:', user.email);
    updateAuthUI(user);
  } else {
    debugLog('👤 No active user session found');
  }
  
  // Remove any existing event listeners
  const newForm = loginForm.cloneNode(true);
  loginForm.parentNode.replaceChild(newForm, loginForm);
  
  newForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = newForm.querySelector('input[type="email"]').value.trim();
    const password = newForm.querySelector('input[type="password"]').value;
    const loginButton = newForm.querySelector('button[type="submit"]');
    const originalButtonText = loginButton.innerHTML;
    
    debugLog('🔄 Login attempt started for:', email);
    
    try {
      // Disable button and show loading state
      loginButton.disabled = true;
      loginButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
      
      // Clear previous errors
      if (loginError) {
        loginError.textContent = '';
        loginError.style.display = 'none';
      }
      
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Attempt login
      const { user, error } = await window.signInWithEmail(email, password);
      
      if (error) {
        debugLog('❌ Login failed:', error.message);
        throw error;
      }
      
      debugLog('✅ Login successful, user:', user);
      
      // Update UI with the logged-in user
      updateAuthUI(user);
      
      // Show success message
      if (loginError) {
        loginError.textContent = 'Login successful! Redirecting...';
        loginError.style.color = 'green';
        loginError.style.display = 'block';
      }
      
      // Redirect after a short delay
      setTimeout(() => {
        debugLog('🔄 Redirecting to map page...');
        window.location.href = 'map.html';
      }, 1000);
      
    } catch (error) {
      debugLog('❌ Login error:', error);
      
      // Show error to user
      if (loginError) {
        loginError.textContent = error.message || 'Failed to log in. Please try again.';
        loginError.style.color = '#dc3545';
        loginError.style.display = 'block';
      }
      
      // Re-enable button
      loginButton.disabled = false;
      loginButton.innerHTML = originalButtonText;
    }
  });
  
  debugLog('✅ Login form initialized successfully');
}

// Simple auth check
const checkAuth = () => {
  if (!isBrowser) return;
  
  const { user } = window.getCurrentUser();
  const isLoginPage = window.location.pathname.endsWith('login.html');
  
  if (user && isLoginPage) {
    // If user is logged in and on login page, redirect to map
    window.location.href = 'map.html';
    return true;
  } else if (!user && !isLoginPage) {
    // If user is not logged in and not on login page, redirect to login
    window.location.href = 'login.html';
    return true;
  }
  return false;
};

// Expose functions to window object
if (isBrowser) {
    // Core auth functions
    window.signInWithEmail = signInWithEmail;
    window.signOut = signOut;
    window.getCurrentUser = getCurrentUser;
    window.updateAuthUI = updateAuthUI;
    window.initializeAuth = initializeAuth;
    
    // Initialize auth when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🚀 DOM fully loaded, initializing auth...');
            initializeAuth();
        });
    } else {
        console.log('⚡ DOM already loaded, initializing auth immediately');
        initializeAuth();
    }
    
    console.log('🔌 Auth module initialized and functions exposed:', {
        signInWithEmail: typeof signInWithEmail === 'function',
        signOut: typeof signOut === 'function',
        getCurrentUser: typeof getCurrentUser === 'function',
        updateAuthUI: typeof updateAuthUI === 'function',
        initializeAuth: typeof initializeAuth === 'function'
    });
}

// Initialize auth and auto-login for testing
function initializeAuth() {
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
  checkAuth();
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
  // In case the document has already loaded
  setTimeout(initializeAuth, 0);
}

console.log('🔌 Auth module initialized');
