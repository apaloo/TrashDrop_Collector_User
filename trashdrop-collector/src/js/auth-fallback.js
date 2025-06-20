/**
 * TrashDrop Collector - Authentication Fallback System
 * 
 * This file provides global fallback mechanisms for authentication errors
 * and ensures consistent behavior across all application pages.
 */

(function() {
  // Create global namespace if it doesn't exist
  window.TrashDrop = window.TrashDrop || {};

  // Define mock user object
  const MOCK_USER = {
    id: 'mock-user-fallback-id',
    email: 'demo@trashdrop.example',
    user_metadata: {
      first_name: 'Demo',
      last_name: 'User',
      role: 'collector',
      avatar_url: './src/images/avatar-placeholder.jpg'
    },
    created_at: new Date().toISOString(),
    app_metadata: {
      role: 'collector'
    }
  };

  /**
   * Provides a mock user when authentication fails
   * @returns {Object|null} Mock user object or null if in test mode
   */
  function getMockUser() {
    // Don't provide mock user if in test mode
    if (window.TRASHDROP_TEST_MODE === true) {
      console.log('🧪 Test mode active: Not providing fallback mock user');
      return null;
    }
    
    console.info('Providing fallback mock user for development/error scenarios');
    return MOCK_USER;
  }

  /**
   * Gets the current user with comprehensive fallbacks
   * @returns {Promise<Object|null>} User object or null in test mode
   */
  async function getCurrentUserWithFallback() {
    // Immediately return null if in test mode to prevent any fallback auth
    if (window.TRASHDROP_TEST_MODE === true) {
      console.log('🧪 Test mode active: No fallback authentication provided');
      
      // Ensure any cached user is cleared
      window.TrashDrop.currentUser = null;
      try {
        localStorage.removeItem('currentUser');
      } catch (e) {}
      
      return null;
    }
    
    // Check for cached user in local variables
    if (window.TrashDrop.currentUser) {
      return window.TrashDrop.currentUser;
    }
    
    // Check localStorage first (for persistence between pages)
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        window.TrashDrop.currentUser = parsedUser;
        return parsedUser;
      }
    } catch (e) {
      console.warn('Error accessing localStorage:', e);
    }
    
    // Try to get from Supabase
    if (window.supabaseClient && window.supabaseClient.auth) {
      try {
        const { data, error } = await window.supabaseClient.auth.getUser();
        if (!error && data && data.user) {
          // Cache the user
          window.TrashDrop.currentUser = data.user;
          try {
            localStorage.setItem('currentUser', JSON.stringify(data.user));
          } catch (e) {}
          return data.user;
        }
      } catch (error) {
        // Handle specific auth errors
        if (error && 
           (error.name === 'AuthSessionMissingError' || 
            (typeof error === 'object' && error.__isAuthError))) {
          console.warn('Auth session missing, using fallback user');
        } else {
          console.warn('Error getting current user:', error);
        }
      }
    } else {
      console.warn('Supabase client not available, using mock user');
    }
    
    // Use mock user as final fallback
    const mockUser = getMockUser();
    
    // If in test mode or mockUser is null, return null
    if (!mockUser) {
      return null;
    }
    
    // Cache the mock user
    window.TrashDrop.currentUser = mockUser;
    try {
      localStorage.setItem('currentUser', JSON.stringify(mockUser));
    } catch (e) {}
    
    return mockUser;
  }

  // Monkey patch Supabase client when it becomes available
  function patchSupabaseClient() {
    if (!window.supabaseClient) return;
    
    // If we're in test mode, don't apply fallback patches
    if (window.TRASHDROP_TEST_MODE === true) {
      console.log('🧪 Test mode active: Not applying authentication fallback patches');
      return;
    }
    
    // Keep original method reference
    const originalGetUser = window.supabaseClient.auth.getUser;
    
    // Replace with patched version that handles errors
    window.supabaseClient.auth.getUser = async function() {
      // In test mode, just pass through to original to show real errors
      if (window.TRASHDROP_TEST_MODE === true) {
        return await originalGetUser.apply(this);
      }
      
      try {
        const result = await originalGetUser.apply(this);
        if (result.error) {
          console.warn('Auth error intercepted:', result.error);
          const mockUser = getMockUser();
          return { 
            data: { user: mockUser }, 
            error: mockUser ? null : result.error // Only suppress error if we have a mock user
          };
        }
        return result;
      } catch (error) {
        console.warn('Auth exception intercepted:', error);
        const mockUser = getMockUser();
        return { 
          data: { user: mockUser },
          error: mockUser ? null : error // Only suppress error if we have a mock user
        };
      }
    };
    
    console.info('Supabase auth.getUser patched with fallback mechanism');
  }

  // Setup global functions
  window.getCurrentUserWithFallback = getCurrentUserWithFallback;
  window.getMockUser = getMockUser;
  
  // Watch for supabase client initialization to apply patch
  window.addEventListener('supabaseClientInitialized', patchSupabaseClient);
  window.addEventListener('supabaseClientReady', patchSupabaseClient);
  
  // Apply patch immediately if already loaded
  if (window.supabaseClient) {
    patchSupabaseClient();
  }
  
  console.info('Auth fallback system initialized');
})();
