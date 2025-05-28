/**
 * TrashDrop Collector - Notifications
 * Handles push notifications using OneSignal integrated with Supabase
 */

// OneSignal configuration - DISABLED FOR NOW TO PREVENT ERRORS
const ONE_SIGNAL_CONFIG = {
    // Commented out to prevent OneSignal initialization errors
    // appId: "YOUR_ONESIGNAL_APP_ID", 
    // safari_web_id: "YOUR_SAFARI_WEB_ID", 
    notifyButton: {
        enable: false, // Hide the Subscription Bell
    },
    allowLocalhostAsSecureOrigin: true, // For development
    serviceWorkerParam: {
        scope: "/"
    },
    // Prevent automatic permission prompts
    autoRegister: false,
    autoResubscribe: false,
    promptOptions: {
        // This ensures we don't show the native browser prompt without user action
        native: {
            enabled: false
        }
    }
};

// Flag to indicate we're running in mock mode without OneSignal
const USING_MOCK_NOTIFICATIONS = true;

// Notification state
let notificationsInitialized = false;
let notificationsEnabled = false;

/**
 * Initialize OneSignal integration (MOCK IMPLEMENTATION)
 * @param {Boolean} skipPermissionPrompt - Whether to skip permission prompt
 */
async function initNotifications(skipPermissionPrompt = true) {
    try {
        // Prevent multiple initializations
        if (notificationsInitialized) {
            console.log('Notifications already initialized');
            return;
        }
        
        if (USING_MOCK_NOTIFICATIONS) {
            // Using mock implementation to avoid OneSignal errors
            console.log('Using mock notification system (OneSignal disabled)');
            window.OneSignal = {
                // Mock implementation of OneSignal methods
                getNotificationPermission: async () => 'default',
                registerForPushNotifications: async () => 'default',
                setExternalUserId: async () => {},
                sendTags: async () => {},
                init: () => {}
            };
            
            notificationsInitialized = true;
            console.log('Mock notifications initialized');
            return true;
        } else {
            // Load OneSignal script dynamically
            await loadOneSignalScript();
            
            // Initialize OneSignal with autoRegister set to false to prevent automatic prompting
            window.OneSignal = window.OneSignal || [];
            window.OneSignal.push(function() {
                // Modify config to prevent automatic prompting
                const config = {...ONE_SIGNAL_CONFIG};
                
                // Only prompt for notification permission if explicitly requested
                config.autoRegister = false;
                config.autoResubscribe = false;
                
                window.OneSignal.init(config);
                console.log('OneSignal initialized with autoRegister:', !skipPermissionPrompt);
            });
        }
        
        // Set initialized flag
        notificationsInitialized = true;
        
        // Check if notifications are enabled
        await checkNotificationStatus();
        
        console.log('Notifications initialized successfully');
        return true;
    } catch (error) {
        console.error('Failed to initialize notifications:', error);
        return false;
    }
}

/**
 * Load OneSignal script dynamically
 * @returns {Promise} - Resolves when script is loaded
 */
function loadOneSignalScript() {
    return new Promise((resolve, reject) => {
        // Check if script is already loaded
        if (window.OneSignal) {
            resolve();
            return;
        }
        
        // Create script element
        const script = document.createElement('script');
        script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';
        script.async = true;
        
        script.onload = () => {
            console.log('OneSignal script loaded');
            resolve();
        };
        script.onerror = () => {
            reject(new Error('Failed to load OneSignal script'));
        };
        
        // Add to document
        document.head.appendChild(script);
    });
}

/**
 * Check if notifications are enabled
 */
async function checkNotificationStatus() {
    if (!notificationsInitialized || !window.OneSignal) {
        console.log('OneSignal not initialized');
        notificationsEnabled = false;
        return false;
    }
    
    try {
        // Get subscription state
        const state = await window.OneSignal.getNotificationPermission();
        notificationsEnabled = state === 'granted';
        
        console.log('Notifications enabled:', notificationsEnabled);
        return notificationsEnabled;
    } catch (error) {
        console.error('Error checking notification status:', error);
        return false;
    }
}

/**
 * Request notification permission
 * @returns {Promise} - Resolves with true if granted, false otherwise
 */
async function requestNotificationPermission() {
    try {
        if (!notificationsInitialized) {
            await initNotifications();
        }
        
        if (!window.OneSignal) {
            console.error('OneSignal not available');
            return false;
        }
        
        const result = await window.OneSignal.registerForPushNotifications();
        notificationsEnabled = result === 'granted';
        
        // Update user's notification preferences in Supabase
        await updateUserNotificationSettings({
            pushNotificationsEnabled: notificationsEnabled
        });
        
        return notificationsEnabled;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return false;
    }
}

/**
 * Update user notification settings in Supabase
 * @param {Object} settings - Notification settings object
 * @returns {Promise} - Resolves with success status
 */
async function updateUserNotificationSettings(settings) {
    try {
        const user = await getCurrentUser();
        
        if (!user) {
            console.error('User not logged in');
            return false;
        }
        
        // Create Supabase client
        const supabase = createSupabaseClient();
        
        // Update user settings
        const { data, error } = await supabase
            .from('user_settings')
            .upsert({
                user_id: user.id,
                push_notifications_enabled: settings.pushNotificationsEnabled,
                email_notifications_enabled: settings.emailNotificationsEnabled || false,
                updated_at: new Date().toISOString()
            });
        
        if (error) throw error;
        
        console.log('User notification settings updated:', settings);
        return true;
    } catch (error) {
        console.error('Error updating notification settings:', error);
        return false;
    }
}

/**
 * Add user information to OneSignal for targeted notifications
 * @param {Object} user - User object
 * @returns {Promise} - Resolves with success status
 */
async function setUserNotificationData(user) {
    try {
        if (!notificationsInitialized || !window.OneSignal) {
            console.log('OneSignal not initialized');
            return false;
        }
        
        if (!user || !user.id) {
            console.error('Invalid user data');
            return false;
        }
        
        // Set external user ID
        await window.OneSignal.setExternalUserId(user.id);
        
        // Set user data for segmentation
        await window.OneSignal.sendTags({
            user_id: user.id,
            user_type: 'collector',
            name: user.name || '',
            company: user.company || '',
            vehicle_type: user.vehicle_type || '',
            onboarding_complete: user.onboarding_complete ? 'true' : 'false'
        });
        
        console.log('User notification data set');
        return true;
    } catch (error) {
        console.error('Error setting user notification data:', error);
        return false;
    }
}

/**
 * Create Supabase client
 * @returns {Object} - Supabase client instance
 */
function createSupabaseClient() {
    // Use global Supabase configuration
    const { url, key } = window.SUPABASE_CONFIG;
    
    // Make sure we have access to the Supabase client
    if (typeof supabase === 'undefined' && typeof window.supabase !== 'undefined') {
        return window.supabase.createClient(url, key);
    } else if (typeof supabase !== 'undefined') {
        return supabase.createClient(url, key);
    } else {
        console.error('Supabase client not available');
        return null;
    }
}

// Helper function to get current user - FIXED circular reference
async function getCurrentUser() {
    // IMPORTANT: Don't call window.getCurrentUser to avoid circular reference
    // Instead, try to get user directly from localStorage first
    const mockUserStr = localStorage.getItem('mockUser');
    if (mockUserStr) {
        try {
            const mockUser = JSON.parse(mockUserStr);
            if (mockUser && mockUser.id) {
                return mockUser;
            }
        } catch (e) {}
    }
    
    // For development, return a default user to avoid errors
    if (window.location.hostname === 'localhost' || 
        window.location.hostname.includes('127.0.0.1') ||
        window.location.port === '5500' || 
        window.location.port === '5501') {
        
        return {
            id: 'notifications-user-' + Date.now(),
            email: 'dev@example.com',
            role: 'collector'
        };
    }
    
    // Last resort - if not in development, return null
    return null;
}

// Export functions to global scope
window.initNotifications = initNotifications;
window.requestNotificationPermission = requestNotificationPermission;
window.checkNotificationStatus = checkNotificationStatus;
window.setUserNotificationData = setUserNotificationData;
window.updateUserNotificationSettings = updateUserNotificationSettings;
