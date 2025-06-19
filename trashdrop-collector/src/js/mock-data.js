/**
 * TrashDrop Collector - Mock Data
 * Provides mock data for development environment
 */

// Prevent duplicate declarations if script is loaded multiple times
(function() {
  // Skip initialization if already loaded
  if (window.mockDataLoaded) {
    console.log('Mock data module already loaded, skipping initialization');
    return;
  }
  
  // Set flag to prevent duplicate initialization
  window.mockDataLoaded = true;

  // Initialize TrashDrop namespace if not exists
  window.TrashDrop = window.TrashDrop || {};
  window.TrashDrop.mockData = window.TrashDrop.mockData || {};

  // Add config-fallback.js if CONFIG is not available
  function ensureConfig() {
    return new Promise((resolve) => {
      if (window.CONFIG) {
        resolve(window.CONFIG);
        return;
      }
      
      console.warn('CONFIG not available for mock-data, loading config-fallback.js');
      const script = document.createElement('script');
      script.src = './src/js/config-fallback.js';
      script.onload = () => {
        console.log('Successfully loaded config-fallback.js for mock-data');
        resolve(window.CONFIG);
      };
      script.onerror = () => {
        console.error('Failed to load config-fallback.js, using hardcoded defaults');
        // Create minimal fallback config directly
        window.CONFIG = window.CONFIG || {
          coordinates: {
            default: {
              lat: 5.6037,
              lng: -0.1870
            }
          }
        };
        resolve(window.CONFIG);
      };
      document.head.appendChild(script);
    });
  }
  
  // Access config safely - now scoped to this IIFE
  let safeConfig;
  
  // Wait for ensureConfig to complete
  ensureConfig().then(config => {
    window.TrashDrop.mockData.config = config;
    safeConfig = config;
    console.log('Mock data config ready:', !!safeConfig);
  });

// Mock requests data
const mockRequests = [
  {
    id: 'req-123',
    location: {
      lat: safeConfig?.coordinates?.default?.lat || 5.6037,
      lng: safeConfig?.coordinates?.default?.lng || -0.1870
    },
    trashType: 'recyclable',
    status: 'open',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    name: 'Plastic Bottles'
  },
  {
    id: 'req-124',
    location: {
      lat: safeConfig?.coordinates?.default?.lat + 0.002 || 5.6057,
      lng: safeConfig?.coordinates?.default?.lng + 0.003 || -0.1840
    },
    trashType: 'general',
    status: 'open',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    name: 'Household Waste'
  },
  {
    id: 'req-125',
    location: {
      lat: safeConfig?.coordinates?.default?.lat - 0.001 || 5.6027,
      lng: safeConfig?.coordinates?.default?.lng + 0.001 || -0.1860
    },
    trashType: 'hazardous',
    status: 'open',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    name: 'Electronic Waste'
  },
  {
    id: 'req-126',
    location: {
      lat: safeConfig?.coordinates?.default?.lat + 0.003 || 5.6067,
      lng: safeConfig?.coordinates?.default?.lng - 0.002 || -0.1890
    },
    trashType: 'recyclable',
    status: 'assigned',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    name: 'Glass Bottles'
  },
  {
    id: 'req-127',
    location: {
      lat: safeConfig?.coordinates?.default?.lat - 0.002 || 5.6017,
      lng: safeConfig?.coordinates?.default?.lng - 0.001 || -0.1880
    },
    trashType: 'general',
    status: 'open',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    name: 'Food Waste'
  }
];

// Load mock requests data
function loadMockRequests() {
  return new Promise((resolve) => {
    console.log('Loading mock requests data');
    // Simulate network delay
    setTimeout(() => {
      window.mockRequestsData = mockRequests;
      console.log(`Loaded ${mockRequests.length} mock requests`);
      resolve(mockRequests);
    }, 500);
  });
}

// Render mock requests to the UI
function renderMockRequests(requests = mockRequests) {
  if (typeof document === 'undefined') {
    console.warn('Not in browser environment, skipping UI rendering');
    return;
  }
  
  const requestsContainer = document.getElementById('requests-container');
  if (!requestsContainer) {
    console.warn('Requests container not found in DOM');
    return;
  }
  
  requestsContainer.innerHTML = '';
  
  if (!requests || requests.length === 0) {
    requestsContainer.innerHTML = '<div class="empty-state">No requests found</div>';
    return;
  }
  
  requests.forEach(request => {
    const requestCard = document.createElement('div');
    requestCard.className = 'request-card';
    requestCard.dataset.requestId = request.id;
    
    // Determine status class
    let statusClass = '';
    switch (request.status) {
      case 'open':
        statusClass = 'status-open';
        break;
      case 'assigned':
        statusClass = 'status-assigned';
        break;
      case 'completed':
        statusClass = 'status-completed';
        break;
      default:
        statusClass = 'status-open';
    }
    
    requestCard.innerHTML = `
      <div class="request-header">
        <h3>${request.name}</h3>
        <span class="status-badge ${statusClass}">${request.status}</span>
      </div>
      <div class="request-details">
        <p><strong>Type:</strong> ${request.trashType}</p>
        <p><strong>Created:</strong> ${formatTimestamp(request.createdAt)}</p>
        <p><strong>Location:</strong> ${request.location.lat.toFixed(4)}, ${request.location.lng.toFixed(4)}</p>
      </div>
      <div class="request-actions">
        <button class="btn btn-primary">View Details</button>
        <button class="btn btn-accept">Accept Request</button>
      </div>
    `;
    
    requestsContainer.appendChild(requestCard);
  });
  
  console.log(`Rendered ${requests.length} requests to UI`);
}

// Format timestamp to readable string
// @param {String} timestamp - ISO timestamp
// @returns {String} - Formatted time string
function formatTimestamp(timestamp) {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hours ago`;
    } else if (diffMin > 0) {
      return `${diffMin} minutes ago`;
    } else {
      return 'Just now';
    }
  } catch (error) {
    console.error('Error formatting timestamp:', error);
    return 'Date error';
  }
}

// Make functions available globally only if not already defined
if (typeof window !== 'undefined') {
  if (typeof window.loadMockRequests === 'undefined') {
    window.loadMockRequests = loadMockRequests;
  }

  if (typeof window.renderMockRequests === 'undefined') {
    window.renderMockRequests = renderMockRequests;
  }

  console.log('Mock data module loaded successfully');
}

// Close the IIFE that was opened at the beginning of the file
})();
