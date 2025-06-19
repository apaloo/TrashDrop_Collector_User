/**
 * TrashDrop Collector - Resource Loader
 * 
 * This module handles dynamic loading of external CSS and JavaScript resources.
 * It centralizes resource loading to ensure consistency and easier maintenance.
 */

// Define namespace
window.ResourceLoader = window.ResourceLoader || {};

// Use a local config instead of importing
const CDN_CONFIG = {
  leaflet: {
    css: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    js: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
    integrity: {
      css: 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=',
      js: 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo='
    }
  },
  supabase: {
    js: 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.38.4/dist/umd/supabase.min.js'
  },
  chartjs: {
    js: 'https://cdn.jsdelivr.net/npm/chart.js@4.3.0/dist/chart.umd.min.js'
  },
  fonts: {
    googleFonts: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;600;700&display=swap'
  }
};

// Track loaded resources to prevent duplicates
const loadedResources = {
  css: new Set(),
  js: new Set()
};

/**
 * Dynamically load all required CSS and JS resources
 * @param {Object} options - Configuration options
 * @param {boolean} options.loadLeaflet - Whether to load Leaflet (default: false)
 * @param {boolean} options.loadLeafletPlugins - Whether to load Leaflet plugins (default: false)
 * @param {boolean} options.loadFonts - Whether to load Google Fonts (default: true)
 * @param {boolean} options.loadSupabase - Whether to load Supabase (default: true)
 * @param {boolean} options.loadChartJs - Whether to load Chart.js (default: false)
 * @returns {Promise} - Promise that resolves when all resources are loaded
 */
window.ResourceLoader.loadResources = function(options = {}) {
  const { 
    loadLeaflet = false,
    loadLeafletPlugins = false, 
    loadFonts = true, 
    loadSupabase = true,
    loadChartJs = false 
  } = options;
  
  // Set up preconnects for faster resource loading
  if (loadFonts) {
    CDN_CONFIG.googleFonts.preconnect.forEach(url => {
      createPreconnect(url, url.includes('gstatic'));
    });
  }

  // Load CSS resources
  if (loadFonts) {
    loadStylesheet(CDN_CONFIG.googleFonts.materialIcons);
    loadStylesheet(CDN_CONFIG.googleFonts.roboto);
  }
  
  if (loadLeaflet) {
    loadStylesheet(CDN_CONFIG.leaflet.css, CDN_CONFIG.leaflet.integrity.css);
    
    // Load Leaflet plugins if requested
    if (loadLeafletPlugins && CDN_CONFIG.leaflet.plugins) {
      // Load Leaflet.locate plugin
      if (CDN_CONFIG.leaflet.plugins.locate) {
        loadStylesheet(CDN_CONFIG.leaflet.plugins.locate.css);
      }
    }
  }
  
  // Load JS libraries
  const scripts = [];
  
  if (loadSupabase) {
    scripts.push(loadScript(CDN_CONFIG.supabase));
  }
  
  if (loadChartJs) {
    scripts.push(loadScript(CDN_CONFIG.chartjs.js));
  }
  
  if (loadLeaflet) {
    // Load main Leaflet script first
    const leafletPromise = loadScript(CDN_CONFIG.leaflet.js, CDN_CONFIG.leaflet.integrity.js);
    scripts.push(leafletPromise);
    
    // Load Leaflet plugins if requested
    if (loadLeafletPlugins && CDN_CONFIG.leaflet.plugins) {
      // Wait for Leaflet to load first, then load plugins
      const pluginPromise = leafletPromise.then(() => {
        const pluginPromises = [];
        
        // Load Leaflet.locate plugin
        if (CDN_CONFIG.leaflet.plugins.locate) {
          pluginPromises.push(loadScript(CDN_CONFIG.leaflet.plugins.locate.js));
        }
        
        return Promise.all(pluginPromises);
      });
      
      scripts.push(pluginPromise);
    }
  }
  
  return Promise.all(scripts);
}

/**
 * Load a stylesheet
 * @param {string} url - URL of the stylesheet
 * @param {string} integrity - Optional integrity hash
 * @returns {HTMLElement} - The created link element
 */
window.ResourceLoader.loadStylesheet = function(url, integrity = null) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;
  
  if (integrity) {
    link.integrity = integrity;
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
  return link;
}

/**
 * Create a preconnect link
 * @param {string} url - URL to preconnect to
 * @param {boolean} crossorigin - Whether to use crossorigin
 * @returns {HTMLElement} - The created link element
 */
window.ResourceLoader.createPreconnect = function(url, crossorigin = false) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = url;
  
  if (crossorigin) {
    link.crossOrigin = 'anonymous';
  }
  
  document.head.appendChild(link);
  return link;
}

/**
 * Load a script
 * @param {string} url - URL of the script
 * @param {string} integrity - Optional integrity hash
 * @returns {Promise} - Promise that resolves when script loads
 */
window.ResourceLoader.loadScript = function(url, integrity = null) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    
    if (integrity) {
      script.integrity = integrity;
      script.crossOrigin = 'anonymous';
    }
    
    script.onload = () => resolve(script);
    script.onerror = reject;
    
    document.body.appendChild(script);
  });
}

// Make sure all functions reference the window namespace
loadResources = window.ResourceLoader.loadResources;
loadStylesheet = window.ResourceLoader.loadStylesheet;
createPreconnect = window.ResourceLoader.createPreconnect;
loadScript = window.ResourceLoader.loadScript;
