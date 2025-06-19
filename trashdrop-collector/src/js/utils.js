/**
 * TrashDrop Collector - Utilities
 * 
 * General utility functions for the TrashDrop Collector application.
 */

// Define TrashDropUtils namespace if it doesn't exist
window.TrashDropUtils = window.TrashDropUtils || {};

/**
 * Creates a script tag to load JavaScript from a module
 * Ensures proper module loading with ES6 imports
 * 
 * @param {string} src - The source URL of the script
 * @returns {Promise} - Promise that resolves when the script loads
 */
TrashDropUtils.loadModule = function(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.type = 'module';
    script.src = src;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

/**
 * Check if we're running in development mode
 * @returns {boolean}
 */
TrashDropUtils.isDevelopment = function() {
  return window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1' ||
         window.CONFIG?.environment?.isDevelopment === true;
};

/**
 * Format date for display
 * @param {Date|string} date - Date to format 
 * @returns {string} Formatted date
 */
TrashDropUtils.formatDate = function(date) {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Debug logger - only logs in development mode
 */
TrashDropUtils.debug = {
  log: (...args) => {
    if (TrashDropUtils.isDevelopment()) {
      console.log('🔍', ...args);
    }
  },
  error: (...args) => {
    if (TrashDropUtils.isDevelopment()) {
      console.error('❌', ...args);
    }
  },
  warn: (...args) => {
    if (TrashDropUtils.isDevelopment()) {
      console.warn('⚠️', ...args);
    }
  },
  info: (...args) => {
    if (TrashDropUtils.isDevelopment()) {
      console.info('ℹ️', ...args);
    }
  }
};
