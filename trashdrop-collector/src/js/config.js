/**
 * TrashDrop Collector - Configuration
 * Contains application configuration and API keys
 * 
 * IMPORTANT: This file works in both module and non-module contexts.
 * It sets window.CONFIG directly without export statements.
 */

// Guard against duplicate initialization
if (window.configInitialized) {
  console.log('🛑 config.js: Already initialized, skipping duplicate load');
  // Export any expected globals for backward compatibility
  if (!window.CONFIG) window.CONFIG = {};
  if (!window.SUPABASE_CONFIG) window.SUPABASE_CONFIG = {};
  // Script will exit here without re-initializing
} else {
  // Set flag to avoid duplicate initialization
  window.configInitialized = true;
  console.log('✅ config.js: Initializing configuration...');


// Environment Variable Loader
// --------------------------

/**
 * Load environment variables with fallbacks
 * @param {string} key - Environment variable name
 * @param {*} fallback - Default value if not found
 * @returns {*} Environment value or fallback
 */
function getEnv(key, fallback) {
  // Try to get from .env (server-side)
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  
  // Try to get from localStorage (for development)
  const localValue = localStorage.getItem(`env_${key}`);
  if (localValue) {
    return localValue;
  }
  
  // Try to get from window.ENV (if injected from server)
  if (window.ENV && window.ENV[key]) {
    return window.ENV[key];
  }
  
  // Return fallback
  return fallback;
}

// Environment Detection
// --------------------

// Detect if we're in development or production mode
const isDevelopment = window.location.hostname === 'localhost' || 
                     window.location.hostname === '127.0.0.1' ||
                     window.location.hostname.includes('ngrok-free.app') ||
                     window.location.port === '3000';

// Flag to force direct connection even in development
const forceDirectConnection = false;

// CORS proxy for development
const corsProxy = getEnv('CORS_PROXY_URL', 'http://localhost:3000/');

// Always use port 3000 for consistency
const appPort = getEnv('APP_PORT', '3000');

// Default Locations
// ----------------

const defaultLocation = {
  // Default coordinates (Accra, Ghana)
  coordinates: [5.6037, -0.1870],
  // Default zoom level for map
  zoom: 13
};

// Map Locations Repository
// -----------------------
const locationDefaults = {
  // Primary locations (cities)
  cities: {
    accra: { lat: 5.6037, lng: -0.1870 },        // Ghana
    sanFrancisco: { lat: 37.7749, lng: -122.4194 } // USA
  },
  
  // Points of interest for demo/testing
  pointsOfInterest: {
    park: { lat: 37.7749, lng: -122.4194, name: 'Park Cleanup' },
    beach: { lat: 37.8199, lng: -122.4783, name: 'Beach Restoration' },
    highway: { lat: 37.7833, lng: -122.4324, name: 'Highway Median' },
    school: { lat: 37.7694, lng: -122.4862, name: 'School Grounds' },
    garden: { lat: 37.7815, lng: -122.4158, name: 'Community Garden' }
  },
  
  // Sample disposal center locations for geofencing
  disposalCenters: [
    [5.6050, -0.1875], // Sample disposal center 1
    [5.6100, -0.1800], // Sample disposal center 2
    [5.5980, -0.1920]  // Sample disposal center 3
  ]
};

// API & Service Configuration
// ---------------------------

// Get Supabase credentials from environment with fallbacks
// These are kept as local variables and only exposed via CONFIG and SUPABASE_CONFIG
// Use let instead of const to avoid redeclaration errors if the script runs multiple times

// Check URL parameters for Supabase configuration (allows sharing links with credentials)
function getUrlParam(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

// Production Supabase instance
const PROD_SUPABASE_URL = 'https://npfpealzcpljpqiyyuut.supabase.co';

// First try URL params, then localStorage, then env vars, and finally fallbacks
let _supabaseUrl = 
  getUrlParam('supabaseUrl') || 
  localStorage.getItem('supabase_url') || 
  getEnv('SUPABASE_URL', PROD_SUPABASE_URL);

// Make sure the URL is properly formatted
if (_supabaseUrl && _supabaseUrl.includes('localhost:3000') && !isDevelopment) {
  console.warn('⚠️ Fixing incorrect Supabase URL format that contains localhost');
  _supabaseUrl = PROD_SUPABASE_URL;
}

// Handle anonymous key in the same priority order
let _supabaseKey = 
  getUrlParam('supabaseKey') || 
  localStorage.getItem('supabase_key') || 
  getEnv('SUPABASE_KEY', 
    // Default anonymous key for development
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZnBlYWx6Y3BsanBxaXl5dXV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.qZSzcZA-5-ht9k-mWJIEIP5xyS1Wz-jLQK4RvMe24Mg'
  );

// Ensure SUPABASE_CONFIG is available globally for compatibility with various app components
window.SUPABASE_CONFIG = {
  url: _supabaseUrl,
  key: _supabaseKey,
  supabase: {
    url: _supabaseUrl,
    key: _supabaseKey
  }
};

// Get ngrok URL from environment with fallback
const ngrokUrl = getEnv('NGROK_URL', 'https://trashdrop-collector.ngrok-free.app');

// Service URLs
const mapTileUrl = getEnv('MAP_TILE_URL', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');

// API Configuration
const apiConfig = {
  // Base API URL - determined by environment
  get baseUrl() {
    // If we're running through ngrok, use the direct Supabase URL
    if (window.location.hostname.includes('ngrok-free.app')) {
      return _supabaseUrl;
    }
    // In local development with CORS proxy
    if (isDevelopment && !forceDirectConnection) {
      // Always use port 3000 for corsProxy
      return `http://localhost:3000/${_supabaseUrl}`;
    }
    // Default production URL
    return _supabaseUrl;
  },
  
  // Latest ngrok URL
  ngrokUrl: ngrokUrl,
  
  // API configuration - All API endpoints and related settings
  apiVersion: getEnv('API_VERSION', 'v1'),
  restBasePath: '/rest/',
  rpcBasePath: '/rpc/',
  
  // Endpoints organized by functionality
  endpoints: {
    // Request management endpoints
    requests: {
      // Get all requests or create a new one
      LIST: '/rest/v1/requests',
      // Get nearby requests with geolocation filtering
      NEARBY: '/rest/v1/rpc/requests_nearby',
      // Accept a request by ID
      ACCEPT: '/rest/v1/rpc/accept_request',
    },
    // Collector management endpoints
    collectors: {
      // Update collector online/offline status
      UPDATE_STATUS: '/rest/v1/rpc/update_collector_status',
    },
    // Legacy endpoints (for backward compatibility)
    REQUESTS: '/rest/v1/requests',
    REQUESTS_NEARBY: '/rest/v1/rpc/requests_nearby',
    ACCEPT_REQUEST: '/rest/v1/rpc/accept_request',
    UPDATE_STATUS: '/rest/v1/rpc/update_collector_status'
  }
};

// Development Configuration
// ------------------------

const devConfig = {
  // Test user for development
  testUser: {
    id: getEnv('DEV_TEST_USER_ID', 'mock-user-123'),
    email: getEnv('DEV_TEST_EMAIL', 'test@example.com'),
    password: getEnv('DEV_TEST_PASSWORD', 'password123'), // Only for development
    name: getEnv('DEV_TEST_NAME', 'Test User'),
    role: getEnv('DEV_TEST_ROLE', 'collector')
  },
  
  // Mock token settings
  auth: {
    mockTokenPrefix: getEnv('DEV_TOKEN_PREFIX', 'mock-token-'),
    mockRefreshToken: getEnv('DEV_REFRESH_TOKEN', 'mock-refresh-token'),
    mockTokenAlgo: getEnv('DEV_TOKEN_ALGO', 'MOCK'),
    mockSignature: getEnv('DEV_TOKEN_SIGNATURE', 'MOCKSIGNATURE')
  },
  
  // Demo locations for development
  demoLocations: {
    accra: [5.6037, -0.1870],
    sanFrancisco: [37.7749, -122.4194]
  }
};

// Unified Configuration Object
// ---------------------------

// Create the centralized CONFIG object
const CONFIG = {
  environment: {
    isDevelopment,
    forceDirectConnection,
    corsProxy,
    isProduction: !isDevelopment
  },
  api: apiConfig,
  map: {
    defaultLocation,
    tileUrl: mapTileUrl,
    maxZoom: 19,
    locations: locationDefaults
  },
  // Static application data - centralized references for hardcoded values
  staticData: {
    // Email addresses used throughout the application
    emails: {
      // Development/test emails
      dev: getEnv('DEV_EMAIL', 'dev@example.com'),
      test: getEnv('TEST_EMAIL', 'test@example.com'),
      devUser: getEnv('DEV_USER_EMAIL', 'dev-user@example.com'),
      mock: getEnv('MOCK_EMAIL', 'mock@example.com'),
      temp: getEnv('TEMP_EMAIL', 'temp@example.com'),
      // Support and contact emails
      support: getEnv('SUPPORT_EMAIL', 'support@trashdrop.example.com'),
      contact: getEnv('CONTACT_EMAIL', 'contact@trashdrop.example.com'),
      // Administrative emails
      admin: getEnv('ADMIN_EMAIL', 'admin@trashdrop.example.com')
    },
    // Application name and branding
    branding: {
      appName: 'TrashDrop Collector',
      companyName: 'TrashDrop',
      copyright: `© ${new Date().getFullYear()} TrashDrop`
    },
    // External service URLs
    urls: {
      // External APIs
      oneSignalSDK: getEnv('ONESIGNAL_SDK_URL', 'https://cdn.onesignal.com/sdks/OneSignalSDK.js'),
      qrScanner: getEnv('QR_SCANNER_URL', 'https://unpkg.com/html5-qrcode@2.2.1/html5-qrcode.min.js'),
      // Mapping services
      reverseGeocode: getEnv('REVERSE_GEOCODE_URL', 'https://nominatim.openstreetmap.org/reverse'),
      // Navigation
      googleMapsDirections: getEnv('GOOGLE_MAPS_DIRECTIONS_URL', 'https://www.google.com/maps/dir/'),
      // Payment gateway (currently just a placeholder)
      paymentGateway: getEnv('PAYMENT_GATEWAY_URL', 'https://payment-gateway.example.com')
    },
    // Attribution texts
    attributions: {
      openStreetMap: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }
  },
  dev: devConfig,
  supabase: {
    url: apiConfig.baseUrl,
    key: _supabaseKey,
    
    // Helper methods for API endpoints
    getApiUrl(endpoint) {
      // Check if it's a simple endpoint string or a path with category
      if (endpoint.includes('.')) {
        // Format: 'category.ENDPOINT_NAME'
        const [category, name] = endpoint.split('.');
        if (apiConfig.endpoints[category] && apiConfig.endpoints[category][name]) {
          // Return formatted URL with structured endpoint
          return `${this.url}${apiConfig.endpoints[category][name]}`;
        }
      }
      
      // Legacy/backward compatibility for direct endpoints
      const path = apiConfig.endpoints[endpoint] || endpoint;
      return `${this.url}${path}`;
    },
    
    // Get the current ngrok URL
    getNgrokUrl() {
      return apiConfig.ngrokUrl;
    }
  }
};

// Make CONFIG available globally
window.CONFIG = CONFIG;

// Explicitly set Supabase config for supabase-client.js
window.SUPABASE_CONFIG = {
  url: CONFIG.supabase.url,
  key: CONFIG.supabase.key
};

// Log Supabase configuration (without showing full key in console)
console.log('SUPABASE_CONFIG set with URL:', CONFIG.supabase.url);
console.log('SUPABASE_KEY available:', CONFIG.supabase.key ? 'Yes (key hidden)' : 'No');

// For backward compatibility
window.isDevelopment = CONFIG.environment.isDevelopment;
window.forceDirectConnection = CONFIG.environment.forceDirectConnection;
window.CORS_PROXY = CONFIG.environment.corsProxy;

// Print active configuration to console in development mode
if (CONFIG.environment.isDevelopment) {
  console.group('📦 TrashDrop Configuration');
  console.log('Environment:', CONFIG.environment.isDevelopment ? 'Development' : 'Production');
  console.log('API Base URL:', CONFIG.api.baseUrl);
  console.log('Using CORS Proxy:', !CONFIG.environment.forceDirectConnection);
  console.groupEnd();
}

// Make CONFIG available globally in non-module context
if (typeof window !== 'undefined') {
  // Dispatch a custom event to signal config is loaded
  setTimeout(() => {
    const configLoadedEvent = new CustomEvent('configLoaded', { detail: { CONFIG } });
    window.dispatchEvent(configLoadedEvent);
    console.log('Config loaded and event dispatched');
  }, 0);
}

// Make sure CONFIG is globally available
(function() {
  // Signal that config is loaded
  if (typeof window !== 'undefined') {
    // Set a flag for other scripts to check
    window.configLoaded = true;
    
    // Dispatch an event that CONFIG is ready
    try {
      window.dispatchEvent(new CustomEvent('configLoaded', { 
        detail: { CONFIG: window.CONFIG } 
      }));
      console.log('CONFIG loaded and event dispatched');
    } catch (e) {
      console.error('Error dispatching configLoaded event:', e);
    }
  }
})();

// Remove ALL module-related code and exports
// We're using script tags only, no ES modules, CommonJS, or AMD
// Simply expose CONFIG and SUPABASE_CONFIG globally
console.log('CONFIG is set globally and ready to use');

// Close the initialization guard block
}
