/**
 * TrashDrop Collector - Configuration
 * Contains application configuration and API keys
 */

// Detect if we're in development or production mode
window.isDevelopment = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';

// Set up CORS proxy for development
window.CORS_PROXY = 'http://localhost:8095/';

// Supabase Configuration
window.SUPABASE_CONFIG = {
  // Use the CORS proxy in development, direct URL in production
  url: window.isDevelopment ? 
       `${window.CORS_PROXY}https://cpeyavpxqcloupolbvyh.supabase.co` : 
       'https://cpeyavpxqcloupolbvyh.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXlhdnB4cWNsb3Vwb2xidnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4OTYsImV4cCI6MjA2MTA3Mjg5Nn0.5rxsiRuLHCpeJZ5TqoIA5X4UwoAAuxIpNu_reafwwbQ'
};

// For debugging
console.log('Supabase URL:', window.SUPABASE_CONFIG.url);
