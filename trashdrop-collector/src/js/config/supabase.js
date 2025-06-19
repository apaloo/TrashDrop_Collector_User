/**
 * Supabase Client Configuration
 * Centralized configuration for Supabase client
 */

// Initialize Supabase client if not already initialized
if (!window.supabaseClient) {
  window.supabaseClient = createMockClient(); // Create mock client if no client exists yet
}

// Export the client
// Make supabaseClient accessible through global namespace
if (typeof window.TrashDrop === 'undefined') {
  window.TrashDrop = {};
}

window.TrashDrop.supabaseClient = window.supabaseClient;

// Mock client for development
function createMockClient() {
  console.log('Initializing mock Supabase client');
  return {
    auth: {
      signUp: async (params) => ({
        data: {
          user: {
            id: CONFIG.dev.testUser.id + '-' + Date.now(),
            email: params.email,
            created_at: new Date().toISOString()
          },
          session: null
        },
        error: null
      }),
      signInWithPassword: async (params) => ({
        data: {
          user: {
            id: CONFIG.dev.testUser.id + '-' + Date.now(),
            email: params.email,
            created_at: new Date().toISOString()
          },
          session: { access_token: CONFIG.dev.auth.mockTokenPrefix + Date.now() }
        },
        error: null
      }),
      signOut: async () => ({
        error: null
      }),
      getUser: async () => ({
        data: {
          user: null // Return null to indicate no active session
        },
        error: null
      })
    }
  };
}
