/**
 * Centralized Supabase client initialization
 * This ensures we only initialize the Supabase client once
 */

// Create a mock Supabase client for fallback
function createMockClient() {
    console.log('Creating mock Supabase client');
    return {
        auth: {
            signInWithPassword: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
            signUp: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
            signOut: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
            getUser: () => Promise.resolve({ data: null, error: new Error('Supabase not initialized') }),
            resetPasswordForEmail: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
            updateUser: () => Promise.resolve({ error: new Error('Supabase not initialized') }),
            resend: () => Promise.resolve({ error: new Error('Supabase not initialized') })
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: async () => ({ data: null, error: new Error('Supabase not initialized') })
                }),
                order: () => ({
                    limit: () => Promise.resolve({ data: [], error: null })
                })
            })
        })
    };
}

// Initialize Supabase client if not already initialized
if (!window.supabaseClient) {
    if (window.SUPABASE_CONFIG && window.supabase) {
        try {
            window.supabaseClient = window.supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.key
            );
            console.log('Supabase client initialized successfully');
        } catch (error) {
            console.error('Error initializing Supabase client:', error);
            window.supabaseClient = createMockClient();
        }
    } else {
        console.warn('Supabase configuration not found, using mock client');
        window.supabaseClient = createMockClient();
    }
    
    // For backward compatibility
    window.supabase = window.supabaseClient;
} else {
    console.log('Using existing Supabase client');
    // Ensure backward compatibility
    if (!window.supabaseClient) {
        window.supabaseClient = window.supabase;
    } else {
        window.supabase = window.supabaseClient;
    }
}
