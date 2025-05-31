/**
 * Supabase Client Configuration
 * Centralized configuration for Supabase client
 */

// Initialize Supabase client if not already initialized
if (!window.supabaseClient) {
  window.supabaseClient = window.supabase || createMockClient();
}

// Export the client
export const supabaseClient = window.supabaseClient;

// Mock client for development
function createMockClient() {
  console.log('Initializing mock Supabase client');
  return {
    auth: {
      signUp: async (params) => ({
        data: {
          user: {
            id: 'mock-user-' + Date.now(),
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
            id: 'mock-user-' + Date.now(),
            email: params.email,
            created_at: new Date().toISOString()
          },
          session: { access_token: 'mock-token' }
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
