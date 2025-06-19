/**
 * TrashDrop Collector - CDN Configuration
 * 
 * This module provides the CDN URLs and config for external dependencies.
 * Centralizing this makes it easier to update versions or sources.
 */

// Define in global namespace to avoid ES6 module issues
window.CDN_CONFIG = {
  // Libraries
  supabase: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  leaflet: {
    css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    integrity: {
      css: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
      js: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    },
    plugins: {
      locate: {
        css: 'https://unpkg.com/leaflet.locatecontrol@0.76.1/dist/L.Control.Locate.min.css',
        js: 'https://unpkg.com/leaflet.locatecontrol@0.76.1/dist/L.Control.Locate.min.js'
      }
    }
  },
  
  // Data visualization
  chartjs: {
    js: 'https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js'
  },
  
  // Fonts
  googleFonts: {
    preconnect: [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com'
    ],
    materialIcons: 'https://fonts.googleapis.com/icon?family=Material+Icons',
    roboto: 'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
  }
};

// Export as default for ES modules
// No need for default export in browser context
