/**
 * TrashDrop Collector - Supabase Client Initialization
 * Creates and exposes a global Supabase client instance
 */

(function() {
  console.log('🔌 supabase-client.js: Starting initialization...');
  
  // If the client is already initialized, use it
  if (window.supabaseClient) {
    console.log('✅ supabase-client.js: Client already initialized, using existing client');
    return;
  }

  // Set attempt counter if not already set
  window._supabaseInitAttempts = window._supabaseInitAttempts || 0;
  window._supabaseInitMaxRetries = 5;
  window._supabaseInitRetryDelay = 300; // ms

  // Function to attempt initialization
  function attemptInitialization() {
    // Increment attempt counter
    window._supabaseInitAttempts++;
    
    // Check if we've reached max retries
    if (window._supabaseInitAttempts > window._supabaseInitMaxRetries) {
      console.error(`❌ supabase-client.js: Failed to initialize after ${window._supabaseInitMaxRetries} attempts. Giving up.`);
      return;
    }
    
    console.log(`🔄 supabase-client.js: Initialization attempt ${window._supabaseInitAttempts}...`);

    // Check for Supabase global object
    if (typeof window.supabase === 'undefined') {
      console.warn(`⚠️ supabase-client.js: Supabase SDK not loaded yet. Attempt ${window._supabaseInitAttempts}/${window._supabaseInitMaxRetries}`);
      console.log('Supabase SDK not detected, trying to load SDK directly...');
      
      // Try to load Supabase SDK if not already loaded
      if (!window._supabaseSDKLoading) {
        window._supabaseSDKLoading = true;
        
        // Try multiple sources in sequence
        const trySource = (sources, index) => {
          if (index >= sources.length) {
            console.error('❌ supabase-client.js: Failed to load Supabase SDK from all sources');
            window._supabaseSDKLoading = false;
            // Continue with next retry
            setTimeout(attemptInitialization, 300);
            return;
          }
          
          const source = sources[index];
          console.log(`🔄 supabase-client.js: Trying to load SDK from ${source}`);
          
          const script = document.createElement('script');
          script.src = source;
          script.async = true;
          
          script.onload = function() {
            console.log(`✅ supabase-client.js: Successfully loaded Supabase SDK from ${source}`);
            // Verify the SDK is actually available
            if (typeof window.supabase !== 'undefined') {
              // Schedule next retry immediately after script loads
              setTimeout(attemptInitialization, 100);
            } else {
              console.warn(`⚠️ supabase-client.js: Script loaded from ${source} but supabase namespace not available`);              
              // Try next source
              trySource(sources, index + 1);
            }
          };
          
          script.onerror = function(e) {
            console.error(`❌ supabase-client.js: Failed to load SDK from ${source}:`, e);
            // Try next source
            trySource(sources, index + 1);
          };
          
          document.head.appendChild(script);
        };
        
        // Try these sources in order
        const sources = [
          './src/js/vendors/supabase-minimal.js', // Try local minimal implementation first
          './src/js/vendors/supabase.js',        // Then try local full version
          'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
          'https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js'
        ];
        
        trySource(sources, 0);
        return;
      }
      
      // Schedule retry with exponential backoff
      setTimeout(attemptInitialization, window._supabaseInitRetryDelay * Math.pow(1.5, window._supabaseInitAttempts - 1));
      return;
    }
  
  // Now the Supabase SDK is available, proceed with initialization
  console.log('✅ supabase-client.js: Supabase SDK detected, proceeding with initialization');

  // Try to ensure CONFIG is available
  if (!window.CONFIG && !window._configLoaded) {
    console.warn('⚠️ supabase-client.js: CONFIG not found, attempting to load config.js...');
    // Try to load config.js if it's not already attempted
    if (!window._configLoading) {
      window._configLoading = true;
      const configScript = document.createElement('script');
      configScript.src = './src/js/config.js';
      configScript.async = true;
      configScript.onload = function() {
        console.log('✅ supabase-client.js: config.js loaded');
        window._configLoaded = true;
        // Retry initialization after config loads
        setTimeout(attemptInitialization, 100);
      };
      configScript.onerror = function(e) {
        console.error('❌ supabase-client.js: Failed to load config.js:', e);
        window._configLoading = false;
      };
      document.head.appendChild(configScript);
      return; // Stop and wait for config to load
    } else {
      // Config is loading, try again later
      setTimeout(attemptInitialization, 300);
      return;
    }
  }

  // Find configuration sources
  let config = null;
  
  // Try window.CONFIG first
  if (typeof window.CONFIG !== 'undefined') {
    config = window.CONFIG;
    console.log('✅ supabase-client.js: Found CONFIG in window');
  } else {
    console.warn('⚠️ supabase-client.js: window.CONFIG not available, checking SUPABASE_CONFIG');
    
    // Fall back to window.SUPABASE_CONFIG if available
    if (typeof window.SUPABASE_CONFIG !== 'undefined') {
      config = window.SUPABASE_CONFIG;
      console.log('✅ supabase-client.js: Using SUPABASE_CONFIG instead');
    } else {
      // If still no configuration, set minimal defaults and warn
      console.error('❌ supabase-client.js: Neither CONFIG nor SUPABASE_CONFIG available');
      console.warn('Setting minimal default configuration');
      window.SUPABASE_CONFIG = {
        url: 'http://localhost:3000',
        key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNwZXlhdnB4cWNsb3Vwb2xidnloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU0OTY4OTYsImV4cCI6MjA2MTA3Mjg5Nn0.5rxsiRuLHCpeJZ5TqoIA5X4UwoAAuxIpNu_reafwwbQ'
      };
      config = window.SUPABASE_CONFIG;
      console.log('✅ supabase-client.js: Created default SUPABASE_CONFIG');
    }
  }

  // Get Supabase URL and key from CONFIG structure using consistent path
  const supabaseUrl = (config && config.supabase && config.supabase.url) || 
                     (window.CONFIG && window.CONFIG.supabase && window.CONFIG.supabase.url) || 
                     (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url);
                     
  const supabaseKey = (config && config.supabase && config.supabase.key) || 
                     (window.CONFIG && window.CONFIG.supabase && window.CONFIG.supabase.key) || 
                     (window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.key);

  // Log what we found for debugging
  console.log('🔍 supabase-client.js: Credentials search result:', {
    foundUrl: !!supabaseUrl,
    foundKey: !!supabaseKey,
    fromWindow: !!(window.supabaseUrl && window.supabaseKey),
    fromConfig: !!(config && config.supabaseUrl && config.supabaseKey),
    fromSupabaseConfig: !!(window.SUPABASE_CONFIG && window.SUPABASE_CONFIG.url && window.SUPABASE_CONFIG.key)
  });

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ supabase-client.js: Failed to initialize - URL or key missing');
    return; // Exit this attempt
  }

  // We have the URL and key, try to create client
  try {
    console.log('✅ supabase-client.js: Creating client with URL and key');
    // Create the client
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log('✅ supabase-client.js: Client initialized successfully');
    
    // Expose for debugging
    window._supabaseDebug = {
      sdk: supabase,
      client: window.supabaseClient,
      config: config
    };
    
    // Dispatch events for components waiting on client initialization
    // Using both event names for backward compatibility
    const initEvent = new CustomEvent('supabaseClientInitialized', { detail: { client: window.supabaseClient } });
    window.dispatchEvent(initEvent);
    
    // Also dispatch the 'supabaseClientReady' event for code listening for that event
    const readyEvent = new CustomEvent('supabaseClientReady', { detail: { client: window.supabaseClient } });
    window.dispatchEvent(readyEvent);
    
  } catch (err) {
    console.error('❌ supabase-client.js: Error initializing client:', err?.message || err);
  }
  
  // If all attempts failed
  if (!window.supabaseClient) {
    console.error('❌ supabase-client.js: Client initialization failed, will retry in 500ms');
    // Schedule one more attempt
    setTimeout(attemptInitialization, 500);
  }
}

  // Add final status message for debugging
  console.log('🔌 supabase-client.js: Module execution complete, client ' + 
    (window.supabaseClient ? 'successfully initialized' : 'initialization FAILED'));

// Start the initialization process
attemptInitialization();
})();
