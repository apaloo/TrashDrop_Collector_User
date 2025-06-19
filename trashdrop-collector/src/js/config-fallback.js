/**
 * TrashDrop Collector - Configuration Fallback
 * Provides default configuration when the main config.js fails to load
 */

(function() {
  // Only create fallback if CONFIG is not already defined
  if (window.CONFIG) {
    console.log('✅ config-fallback.js: CONFIG already exists, no need for fallback');
    return;
  }
  
  console.log('⚠️ config-fallback.js: Creating fallback CONFIG object');
  
  // Create base fallback configuration
  const fallbackConfig = {
    // Flag to indicate this is fallback config
    isFallback: true,
    
    // App version
    version: '1.0.0',
    
    // Environment
    environment: 'development',
    
    // Default coordinates (Accra, Ghana)
    defaultLocation: {
      coordinates: [5.6037, -0.1870],
      zoom: 13
    },
    
    // API endpoints
    api: {
      baseUrl: 'http://localhost:3000',
      endpoints: {
        login: '/auth/login',
        register: '/auth/register',
        resetPassword: '/auth/reset-password',
        profile: '/api/profile',
        requests: '/api/requests',
        assignments: '/api/assignments',
        pickups: '/api/pickups'
      },
      getUrl: function(endpoint) {
        return this.baseUrl + this.endpoints[endpoint];
      }
    },
    
    // Supabase configuration
    supabase: {
      url: 'http://localhost:3000',
      key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXlhdnB4cWNsb3Vwb2xidnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4OTYsImV4cCI6MjA2MTA3Mjg5Nn0.5rxsiRuLHCpeJZ5TqoIA5X4UwoAAuxIpNu_reafwwbQ',
      authEnabled: true,
      tables: {
        users: 'users',
        requests: 'requests',
        assignments: 'assignments',
        pickups: 'pickups',
        earnings: 'earnings'
      }
    },
    
    // Map settings
    map: {
      tileProvider: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; OpenStreetMap contributors',
      initialZoom: 13,
      minZoom: 3,
      maxZoom: 18
    },
    
    // Helper functions
    helpers: {
      // Wait for CONFIG to be available (resolves immediately since this is the fallback)
      waitForConfig: function(callback) {
        if (typeof callback === 'function') {
          callback(fallbackConfig);
        }
        return Promise.resolve(fallbackConfig);
      },
      
      // Get current authenticated user (mock function)
      getCurrentUser: function() {
        return {
          id: 'fallback-user-id',
          name: 'Fallback User',
          email: 'fallback@example.com',
          role: 'collector'
        };
      }
    }
  };
  
  // Make fallback CONFIG available globally
  window.CONFIG = fallbackConfig;
  
  // Create helper functions
  window.waitForConfig = fallbackConfig.helpers.waitForConfig;
  window.getCurrentUser = fallbackConfig.helpers.getCurrentUser;
  
  console.log('✅ config-fallback.js: Fallback CONFIG created successfully');
})();
