/**
 * TrashDrop - Minimal Supabase Client
 * This is a lightweight implementation that provides basic Supabase functionality
 * Used when the full SDK cannot be loaded from CDN sources
 */

(function(global) {
  console.log('🔧 Loading minimal Supabase client implementation');
  
  // Always create a fresh implementation to ensure we have all expected methods
  // Basic implementation of the Supabase client
  global.supabase = {
      // Main client factory function
      createClient: function(supabaseUrl, supabaseKey, options) {
        console.log('Creating minimal Supabase client with URL:', supabaseUrl);
        
        if (!supabaseUrl || !supabaseKey) {
          console.error('Cannot create Supabase client: Missing URL or API key');
          throw new Error('Supabase URL and API key are required');
        }
        
        // Create a minimal client object with common methods
        const client = {
          // Flag to identify this as a minimal client
          _isMinimalClient: true,
          
          // Storage API
          storage: {
            from: function(bucketName) {
              return {
                upload: function(path, file) {
                  console.log(`[Mock] Upload to ${bucketName}/${path}`);
                  return Promise.resolve({ data: { path }, error: null });
                },
                download: function(path) {
                  console.log(`[Mock] Download from ${bucketName}/${path}`);
                  return Promise.resolve({ data: null, error: null });
                },
                getPublicUrl: function(path) {
                  return { 
                    data: { publicUrl: `${supabaseUrl}/storage/v1/object/public/${bucketName}/${path}` },
                    error: null
                  };
                }
              };
            }
          },
          
          // Auth API
          auth: {
            onAuthStateChange: function(callback) {
              console.log('[Mock] Auth state change listener added');
              // Return a fake unsubscribe function
              return { 
                data: { subscription: { unsubscribe: function() {} } },
                error: null
              };
            },
            getUser: function() {
              // Try to get user from localStorage first
              try {
                const userData = JSON.parse(localStorage.getItem('supabase.auth.user'));
                if (userData) {
                  return Promise.resolve({ data: { user: userData }, error: null });
                }
              } catch (e) {
                console.log('No stored user data found');
              }
              
              return Promise.resolve({ data: { user: null }, error: null });
            },
            getSession: function() {
              // Try to get session from localStorage first
              try {
                const sessionData = JSON.parse(localStorage.getItem('supabase.auth.session'));
                if (sessionData) {
                  return Promise.resolve({ data: { session: sessionData }, error: null });
                }
              } catch (e) {
                console.log('No stored session data found');
              }
              
              return Promise.resolve({ data: { session: null }, error: null });
            },
            signIn: function(credentials) {
              console.log('[Mock] Sign in attempt', credentials.email ? 'with email' : 'with provider');
              return Promise.resolve({ data: null, error: null });
            },
            signOut: function() {
              console.log('[Mock] Sign out');
              localStorage.removeItem('supabase.auth.token');
              localStorage.removeItem('supabase.auth.user');
              return Promise.resolve({ error: null });
            }
          },
          
          // Database API
          from: function(tableName) {
            return {
              select: function(columns) {
                return {
                  eq: function(column, value) {
                    console.log(`[Mock] Select from ${tableName} where ${column} = ${value}`);
                    return Promise.resolve({ data: [], error: null });
                  },
                  order: function() {
                    return this;
                  },
                  limit: function() {
                    return this;
                  },
                  then: function(callback) {
                    callback([]);
                    return {
                      catch: function() {}
                    };
                  }
                };
              },
              insert: function(data) {
                console.log(`[Mock] Insert into ${tableName}:`, data);
                return Promise.resolve({ data: data, error: null });
              },
              update: function(data) {
                return {
                  eq: function(column, value) {
                    console.log(`[Mock] Update ${tableName} set data where ${column} = ${value}`);
                    return Promise.resolve({ data: data, error: null });
                  }
                };
              },
              delete: function() {
                return {
                  eq: function(column, value) {
                    console.log(`[Mock] Delete from ${tableName} where ${column} = ${value}`);
                    return Promise.resolve({ data: null, error: null });
                  }
                };
              }
            };
          },
          
          // RPC function call
          rpc: function(functionName, params) {
            console.log(`[Mock] RPC call to ${functionName} with params:`, params);
            return Promise.resolve({ data: null, error: null });
          }
        };
        
        return client;
      },
      // Utility to show client is minimal version
      isMinimalClient: true,
      version: '2.0.0-minimal'
    };
    
    console.log('✅ Minimal Supabase client initialized in global namespace');
  
})(typeof self !== 'undefined' ? self : this);

// Notify that Supabase minimal is loaded
if (typeof window !== 'undefined') {
  window.dispatchEvent(new CustomEvent('supabaseMinimalLoaded'));
}
