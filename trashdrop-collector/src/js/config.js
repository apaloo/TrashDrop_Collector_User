/**
 * TrashDrop Collector - Configuration
 * Contains application configuration and API keys
 */

// Detect if we're in development or production mode
window.isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1' ||
                      window.location.hostname.includes('ngrok-free.app');

// Flag to force direct connection even in development
window.forceDirectConnection = false;

// Set up CORS proxy for development
window.CORS_PROXY = 'http://localhost:8095/';

// API Configuration
const API_CONFIG = {
  // Base API URL - will be determined by environment
  get BASE_URL() {
    // If we're running through ngrok, use the direct Supabase URL
    if (window.location.hostname.includes('ngrok-free.app')) {
      return 'https://cpeyavpxqcloupolbvyh.supabase.co';
    }
    // In local development with CORS proxy
    if (window.isDevelopment && !window.forceDirectConnection) {
      return `${window.CORS_PROXY}https://cpeyavpxqcloupolbvyh.supabase.co`;
    }
    // Default production URL
    return 'https://cpeyavpxqcloupolbvyh.supabase.co';
  },
  
  // Latest ngrok URL (update this when ngrok URL changes)
  NGROK_URL: 'https://trashdrop-collector.ngrok-free.app',
  
  // Endpoints
  ENDPOINTS: {
    REQUESTS: '/rest/v1/requests',
    REQUESTS_NEARBY: '/rest/v1/rpc/requests_nearby',
    ACCEPT_REQUEST: '/rest/v1/rpc/accept_request',
    UPDATE_STATUS: '/rest/v1/rpc/update_collector_status'
  }
};

// Supabase Configuration
window.SUPABASE_CONFIG = {
  url: API_CONFIG.BASE_URL,
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXlhdnB4cWNsb3Vwb2xidnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4OTYsImV4cCI6MjA2MTA3Mjg5Nn0.5rxsiRuLHCpeJZ5TqoIA5X4UwoAAuxIpNu_reafwwbQ',
  
  // Helper methods for API endpoints
  getApiUrl(endpoint) {
    const path = API_CONFIG.ENDPOINTS[endpoint] || endpoint;
    return `${this.url}${path}`;
  },
  
  // Get the current ngrok URL
  getNgrokUrl() {
    return API_CONFIG.NGROK_URL;
  }
};

// For debugging
console.log('Supabase URL:', window.SUPABASE_CONFIG.url);
