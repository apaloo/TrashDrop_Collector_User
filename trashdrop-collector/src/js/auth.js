/**
 * TrashDrop Collector - Authentication Module
 * Handles user authentication with Supabase
 */

// Initialize Supabase client
let supabase;

// Function to create a mock Supabase client for development
function createMockClient() {
  console.log('Creating mock Supabase client for development');
  return {
    auth: {
      signUp: async (params) => {
        console.log('Mock signup called with:', params);
        let email = params.email || 'test@example.com';
        
        // Return in the same format as Supabase client
        return {
          data: {
            user: {
              id: 'mock-user-id-' + Date.now(),
              email: email,
              created_at: new Date().toISOString()
            },
            session: null
          },
          error: null
        };
      },
      signInWithPassword: async (params) => {
        console.log('Mock sign in for:', params.email);
        
        // Create mock user data
        const mockUser = {
          id: 'mock-user-id-' + Date.now(),
          email: params.email,
          created_at: new Date().toISOString()
        };
        
        // Store in localStorage for persistence in development mode
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        
        return {
          data: {
            user: mockUser,
            session: {
              access_token: 'mock-token'
            }
          },
          error: null
        };
      },
      signOut: async () => {
        // Clear mockUser from localStorage
        localStorage.removeItem('mockUser');
        return { error: null };
      },
      getUser: async () => ({
        data: {
          user: {
            id: 'mock-user-id',
            email: 'mock@example.com',
            created_at: new Date().toISOString()
          }
        },
        error: null
      }),
      resetPasswordForEmail: async (email) => {
        console.log('Mock password reset for:', email);
        return { error: null };
      },
      updateUser: async (updates) => {
        console.log('Mock update user:', updates);
        return { data: { user: { ...updates } }, error: null };
      },
      resend: async (params) => {
        console.log('Mock resend confirmation for:', params.email);
        return { error: null };
      }
    },
    from: (table) => ({
      update: async (data) => ({ data, error: null }),
      eq: () => ({ data: [], error: null })
    })
  };
}

// Initialize Supabase only after the document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Supabase...');
  
  // Ensure SUPABASE_CONFIG is available
  if (!window.SUPABASE_CONFIG) {
    console.warn('SUPABASE_CONFIG not found, creating default config');
    window.SUPABASE_CONFIG = {
      url: 'https://cpeyavpxqcloupolbvyh.supabase.co',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXlhdnB4cWNsb3Vwb2xidnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4OTYsImV4cCI6MjA2MTA3Mjg5Nn0.5rxsiRuLHCpeJZ5TqoIA5X4UwoAAuxIpNu_reafwwbQ'
    };
  }
  
  if (window.isDevelopment) {
    // Use mock client in development mode
    console.log('Development mode detected - using mock Supabase client');
    supabase = createMockClient();
  } else {
    // Use real Supabase client in production
    try {
      supabase = window.supabase.createClient(window.SUPABASE_CONFIG.url, window.SUPABASE_CONFIG.key);
      console.log('Supabase initialized with real client');
    } catch (error) {
      console.error('Failed to initialize Supabase, falling back to mock:', error);
      supabase = createMockClient();
    }
  }
});

// Initialize a default mock client to prevent errors before DOMContentLoaded
supabase = createMockClient();

/**
 * Sign up a new user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Promise containing user data or error
 */
async function signUpWithEmail(email, password) {
  try {
    console.log('Signing up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });
    
    if (error) throw error;
    
    console.log('Sign up successful:', data);
    return { user: data?.user || null, error: null };
  } catch (error) {
    console.error('Sign up error:', error);
    return { user: null, error };
  }
}

/**
 * Sign in a user with email and password
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @returns {Promise} - Promise containing user data or error
 */
async function signInWithEmail(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { user: data?.user || null, error: null };
  } catch (error) {
    console.error('Sign in error:', error);
    return { user: null, error };
  }
}

/**
 * Sign out the current user
 * @returns {Promise} - Promise containing success status or error
 */
async function signOut() {
  try {
    // Always clear the mock user from localStorage
    localStorage.removeItem('mockUser');
    
    const { error } = await supabase.auth.signOut();
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error };
  }
}

/**
 * Get the current user session
 * @returns {Promise} - Promise containing user data or null
 */
async function getCurrentUser() {
  try {
    // Check for mock user in localStorage if in development mode
    if (window.isDevelopment) {
      const mockUser = localStorage.getItem('mockUser');
      if (mockUser) {
        return JSON.parse(mockUser);
      }
    }
    
    // Otherwise use Supabase auth
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return data?.user || null;
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

/**
 * Reset password request
 * @param {string} email - User's email
 * @returns {Promise} - Promise containing success status or error
 */
async function resetPasswordRequest(email) {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password.html`
    });
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Reset password request error:', error);
    return { success: false, error };
  }
}

/**
 * Reset password with token
 * @param {string} token - Reset password token
 * @param {string} newPassword - New password
 * @returns {Promise} - Promise containing success status or error
 */
async function resetPassword(token, newPassword) {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, error };
  }
}

/**
 * Resend confirmation email
 * @param {string} email - User's email
 * @returns {Promise} - Promise containing success status or error
 */
async function resendConfirmationEmail(email) {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/login.html`
      }
    });
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Resend confirmation email error:', error);
    return { success: false, error };
  }
}

/**
 * Update user status (online/offline)
 * @param {boolean} isOnline - User's online status
 * @returns {Promise} - Promise containing success status or error
 */
async function updateUserStatus(isOnline) {
  try {
    const user = await getCurrentUser();
    
    if (!user) throw new Error('No user logged in');
    
    const { error } = await supabase
      .from('profiles')
      .update({ is_online: isOnline })
      .eq('user_id', user.id);
    
    if (error) throw error;
    
    return { success: true, error: null };
  } catch (error) {
    console.error('Update user status error:', error);
    return { success: false, error };
  }
}

// Export functions to make them available globally
window.signUpWithEmail = signUpWithEmail;
window.signInWithEmail = signInWithEmail;
window.signOut = signOut;
window.getCurrentUser = getCurrentUser;
window.resetPasswordRequest = resetPasswordRequest;
window.resetPassword = resetPassword;
window.resendConfirmationEmail = resendConfirmationEmail;
window.updateUserStatus = updateUserStatus;
