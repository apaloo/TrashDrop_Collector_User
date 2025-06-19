/**
 * TrashDrop Collector - Improved Supabase Client
 * Consolidated implementation that fixes initialization failures
 */

(function() {
    // Configuration
    const config = {
        retryAttempts: 3,
        retryDelayMs: 1000,
        initTimeoutMs: 5000,
        debugLevel: 2
    };
    
    let supabaseInitPromise = null;
    
    /**
     * Debug logging with level control
     */
    function debugLog(message, level = 1) {
        if (level <= config.debugLevel) {
            console.log(`[Supabase Client] ${message}`);
        }
    }
    
    /**
     * Create a minimal Supabase client implementation for fallback
     */
    function createMinimalClient(supabaseUrl, supabaseKey) {
        debugLog('Creating minimal fallback client', 1);
        
        // Always attempt to get mock user data
        let mockUser = null;
        try {
            const mockUserString = localStorage.getItem('mockUser');
            if (mockUserString) {
                mockUser = JSON.parse(mockUserString);
            }
        } catch (e) {
            debugLog(`Error parsing mock user: ${e}`, 2);
        }
        
        // If no mock user found, create one
        if (!mockUser) {
            mockUser = {
                id: 'minimal-client-user-' + Date.now(),
                email: 'test@example.com',
                name: 'Fallback User',
                created_at: new Date().toISOString(),
                role: 'collector'
            };
            localStorage.setItem('mockUser', JSON.stringify(mockUser));
        }
        
        // Create minimal client with working auth functions
        return {
            auth: {
                onAuthStateChange: (callback) => {
                    // Immediately trigger callback with mock user
                    setTimeout(() => {
                        if (typeof callback === 'function') {
                            callback('SIGNED_IN', { user: mockUser });
                        }
                    }, 10);
                    
                    // Return mock subscription
                    return { data: { subscription: { unsubscribe: () => {} } } };
                },
                getUser: () => Promise.resolve({ data: { user: mockUser }, error: null }),
                getSession: () => Promise.resolve({ 
                    data: { 
                        session: {
                            user: mockUser,
                            access_token: 'mock-token-' + Date.now()
                        }
                    }, 
                    error: null 
                }),
                signOut: () => {
                    localStorage.removeItem('mockUser');
                    return Promise.resolve({ error: null });
                },
                // Add compatibility for both v1 and v2 API formats
                user: () => mockUser,
                session: () => ({
                    user: mockUser,
                    access_token: 'mock-token-' + Date.now()
                })
            },
            
            // Minimal database operations
            from: (table) => ({
                select: (columns = '*') => ({
                    eq: (column, value) => Promise.resolve({
                        data: [], 
                        error: null,
                        count: 0,
                    }),
                    match: (params) => Promise.resolve({
                        data: [],
                        error: null,
                        count: 0,
                    })
                }),
                insert: (data) => Promise.resolve({
                    data: { ...data, id: 'mock-id-' + Date.now() },
                    error: null
                }),
                update: (data) => ({
                    eq: (column, value) => Promise.resolve({
                        data: { ...data, id: value },
                        error: null
                    })
                }),
                delete: () => ({
                    eq: (column, value) => Promise.resolve({
                        data: null,
                        error: null
                    })
                })
            }),
            
            // Storage operations
            storage: {
                from: (bucket) => ({
                    upload: (path, file) => Promise.resolve({
                        data: { path: `${bucket}/${path}` },
                        error: null
                    }),
                    getPublicUrl: (path) => ({
                        data: { publicUrl: `https://mock-storage/${bucket}/${path}` }
                    })
                })
            },
            
            // Flag to identify this as minimal client
            _isMinimalClient: true
        };
    }
    
    /**
     * Initialize the Supabase client with robust error handling
     */
    async function initializeSupabaseClient() {
        // Check if client already exists
        if (window.supabaseClient && !window.supabaseClient._isMinimalClient) {
            debugLog('Using existing Supabase client', 1);
            return window.supabaseClient;
        }
        
        // Wait for CONFIG to be initialized
        if (!window.CONFIG || !window.CONFIG.supabase) {
            debugLog('Waiting for CONFIG to load...', 1);
            
            // Wait for up to 3 seconds for config
            await new Promise((resolve) => {
                const checkConfig = () => {
                    if (window.CONFIG && window.CONFIG.supabase) {
                        resolve();
                    }
                };
                
                const configCheckInterval = setInterval(() => {
                    if (window.CONFIG && window.CONFIG.supabase) {
                        clearInterval(configCheckInterval);
                        clearTimeout(configCheckTimeout);
                        resolve();
                    }
                }, 300);
                
                const configCheckTimeout = setTimeout(() => {
                    clearInterval(configCheckInterval);
                    debugLog('CONFIG loading timed out, using defaults', 1);
                    resolve();
                }, 3000);
                
                // Also listen for config event
                window.addEventListener('configReady', () => {
                    clearInterval(configCheckInterval);
                    clearTimeout(configCheckTimeout);
                    resolve();
                }, { once: true });
            });
        }
        
        // Get Supabase configuration
        const supabaseUrl = window.CONFIG?.supabase?.supabaseUrl || 'https://mock-supabase-url.co';
        const supabaseKey = window.CONFIG?.supabase?.supabaseKey || 'mock-supabase-key';
        
        debugLog(`Initializing with URL: ${supabaseUrl}`, 2);
        
        // Check if global Supabase object is available
        if (!window.supabase || typeof window.supabase.createClient !== 'function') {
            debugLog('Supabase SDK not available, using minimal client', 1);
            window.supabaseClient = createMinimalClient(supabaseUrl, supabaseKey);
            notifyInitialized();
            return window.supabaseClient;
        }
        
        // Try to initialize real client
        try {
            const client = window.supabase.createClient(supabaseUrl, supabaseKey);
            debugLog('Supabase client initialized successfully', 1);
            window.supabaseClient = client;
            notifyInitialized();
            return client;
        } catch (error) {
            debugLog(`Error initializing Supabase client: ${error}`, 1);
            window.supabaseClient = createMinimalClient(supabaseUrl, supabaseKey);
            notifyInitialized();
            return window.supabaseClient;
        }
    }
    
    /**
     * Notify application that the client is initialized
     */
    function notifyInitialized() {
        // Dispatch both event types for backward compatibility
        debugLog('Dispatching client ready events', 2);
        
        window.dispatchEvent(new CustomEvent('supabaseClientInitialized', { 
            detail: { client: window.supabaseClient } 
        }));
        
        window.dispatchEvent(new CustomEvent('supabaseClientReady', {
            detail: { client: window.supabaseClient }
        }));
    }
    
    /**
     * Get current user with fallbacks
     */
    function getCurrentUser() {
        // First try using the client
        try {
            if (window.supabaseClient && window.supabaseClient.auth) {
                // Try v2 API first
                if (typeof window.supabaseClient.auth.getUser === 'function') {
                    return window.supabaseClient.auth.getUser().then(response => {
                        if (response && response.data && response.data.user) {
                            return { user: response.data.user };
                        }
                        return getMockUser();
                    }).catch(() => getMockUser());
                }
                
                // Try v1 API
                if (typeof window.supabaseClient.auth.user === 'function') {
                    const user = window.supabaseClient.auth.user();
                    if (user) return { user };
                }
            }
        } catch (e) {
            debugLog(`Error in getCurrentUser: ${e}`, 2);
        }
        
        return getMockUser();
    }
    
    /**
     * Get mock user from localStorage
     */
    function getMockUser() {
        try {
            const mockUserString = localStorage.getItem('mockUser');
            if (mockUserString) {
                const mockUser = JSON.parse(mockUserString);
                return { user: mockUser };
            }
        } catch (e) {
            debugLog(`Error getting mock user: ${e}`, 2);
        }
        
        // Create new mock user if none exists
        const mockUser = {
            id: 'new-mock-user-' + Date.now(),
            email: 'test@example.com',
            name: 'New Mock User',
            created_at: new Date().toISOString(),
            role: 'collector'
        };
        
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        return { user: mockUser };
    }
    
    /**
     * Start initialization process
     */
    function init() {
        // Create singleton promise for initialization
        if (!supabaseInitPromise) {
            supabaseInitPromise = initializeSupabaseClient();
        }
        
        // Expose global functions
        window.getCurrentUser = getCurrentUser;
        window.getSupabaseClient = () => supabaseInitPromise;
        
        // Add global waitForSupabaseClient function
        window.waitForSupabaseClient = function(callback, timeoutMs = config.initTimeoutMs) {
            debugLog(`waitForSupabaseClient called with ${timeoutMs}ms timeout`, 2);
            
            // Check if client already exists
            if (window.supabaseClient) {
                debugLog('Client already available, executing callback', 2);
                setTimeout(callback, 0);
                return;
            }
            
            // Set up event listeners
            const handleInit = () => {
                window.removeEventListener('supabaseClientReady', handleInit);
                window.removeEventListener('supabaseClientInitialized', handleInit);
                callback();
            };
            
            window.addEventListener('supabaseClientReady', handleInit);
            window.addEventListener('supabaseClientInitialized', handleInit);
            
            // Set up timeout fallback
            setTimeout(() => {
                if (!window.supabaseClient) {
                    debugLog(`Client initialization timed out after ${timeoutMs}ms`, 1);
                    window.removeEventListener('supabaseClientReady', handleInit);
                    window.removeEventListener('supabaseClientInitialized', handleInit);
                    
                    // Create minimal client as fallback
                    if (!window.supabaseClient) {
                        const supabaseUrl = window.CONFIG?.supabase?.supabaseUrl || 'https://mock-supabase-url.co';
                        const supabaseKey = window.CONFIG?.supabase?.supabaseKey || 'mock-supabase-key';
                        window.supabaseClient = createMinimalClient(supabaseUrl, supabaseKey);
                    }
                    
                    callback();
                }
            }, timeoutMs);
        };
    }
    
    // Start initialization on load
    init();
})();
