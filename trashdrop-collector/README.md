# TrashDrop Collector

A Progressive Web App (PWA) for eco-friendly waste collection services powered by Supabase.

## 🌱 Overview

TrashDrop Collector is a platform that connects waste collectors with users who need trash collection services or authorities that need illegal dumping areas cleaned. The app facilitates efficient waste management while rewarding collectors through a points-based system.

## 🚀 Features

- **User Authentication**: Secure signup, login, and password reset with Supabase
- **Interactive Map**: View nearby collection requests and illegal dumping assignments
- **Request Management**: Accept and manage trash collection requests
- **Assignment Handling**: Accept and complete cleanup assignments from authorities
- **Earnings Tracking**: Monitor earnings and points from completed jobs
- **Profile Management**: Update personal information and settings
- **Offline Support**: Progressive Web App functionality for offline access
- **Geolocation**: Find nearby requests and track collection progress
- **QR Code Scanning**: Scan trash bag QR codes to verify collection

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Styling**: Custom CSS with responsive design
- **Backend**: Supabase for authentication and database
- **Map Integration**: Leaflet.js with OpenStreetMap
- **PWA Support**: Service Worker for offline functionality
- **Geolocation**: Browser Geolocation API

## 📋 Pages

1. **Home Page**: Introduction and call-to-action for new users
2. **Authentication Pages**: Login, Signup, Password Reset, Email Confirmation
3. **Map Page**: Interactive map showing nearby collection requests
4. **Request Page**: Manage available, accepted, and picked-up requests
5. **Assign Page**: Manage available, accepted, and completed assignments
6. **Earnings Page**: Track earnings and manage withdrawals
7. **Account Page**: Update profile, settings, and access support

## 🔧 Setup and Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd trashdrop-collector
   ```

2. Configure Environment Variables:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Copy the `.env.example` file to `.env` and update with your configuration:
     ```
     # Required Supabase Configuration
     SUPABASE_URL=https://your-project-url.supabase.co
     SUPABASE_KEY=your-public-anon-key
     SUPABASE_ANON_KEY=your-public-anon-key
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
     
     # Development Settings (optional)
     CORS_PROXY_URL=http://localhost:8095/
     NGROK_URL=https://your-ngrok-url.ngrok-free.app
     
     # Map Configuration (optional)
     MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
     MAP_DEFAULT_LAT=5.6037
     MAP_DEFAULT_LNG=-0.1870
     MAP_DEFAULT_ZOOM=13
     
     # External Service URLs (optional)
     ONESIGNAL_SDK_URL=https://cdn.onesignal.com/sdks/OneSignalSDK.js
     QR_SCANNER_URL=https://unpkg.com/html5-qrcode@2.2.1/html5-qrcode.min.js
     REVERSE_GEOCODE_URL=https://nominatim.openstreetmap.org/reverse
     GOOGLE_MAPS_DIRECTIONS_URL=https://www.google.com/maps/dir/
     PAYMENT_GATEWAY_URL=https://payment-gateway.example.com
     
     # Development Email Addresses (for testing)
     DEV_EMAIL=dev@example.com
     TEST_EMAIL=test@example.com
     DEV_USER_EMAIL=dev-user@example.com
     
     # Development Authentication (for testing)
     DEV_TEST_USER_ID=mock-user-123
     DEV_TEST_EMAIL=test@example.com
     DEV_TEST_PASSWORD=password123
     DEV_TEST_NAME=Test User
     DEV_TEST_ROLE=collector
     DEV_TOKEN_PREFIX=mock-token-
     DEV_REFRESH_TOKEN=mock-refresh-token
     DEV_TOKEN_ALGO=MOCK
     DEV_TOKEN_SIGNATURE=MOCKSIGNATURE
     
     # Proxy Server Configuration
     PROXY_PORT=8095
     ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the development server:
   ```
   # Start the CORS proxy server
   node cors-proxy.js
   
   # In a separate terminal, start the web server
   # Example using a simple Python HTTP server
   python -m http.server
   
   # Or use a Node.js server like http-server
   npx http-server
   ```

4. Access the application at `http://localhost:8000`

## ⚙️ Configuration System

TrashDrop Collector uses a centralized configuration system:

1. **Environment Variables**: Sensitive data (API keys, credentials) stored in `.env`
2. **Config Module**: Non-sensitive settings managed in `src/js/config.js`
3. **Global CONFIG Object**: Accessible throughout the application

### CONFIG Structure:

```javascript
window.CONFIG = {
    // Core application configuration
    app: { /* Application settings */ },
    
    // Map configuration
    map: {
        tileUrl: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        maxZoom: 19,
        defaultCenter: { lat: 5.6037, lng: -0.1870 } // Accra, Ghana
    },
    
    // Static application data
    staticData: {
        // Email addresses
        emails: {
            dev: "dev@example.com",
            test: "test@example.com",
            devUser: "dev-user@example.com",
            mock: "mock@example.com",
            temp: "temp@example.com",
            support: "support@trashdrop.example.com",
            contact: "contact@trashdrop.example.com",
            admin: "admin@trashdrop.example.com"
        },
        
        // External service URLs
        urls: {
            oneSignalSDK: "https://cdn.onesignal.com/sdks/OneSignalSDK.js",
            qrScanner: "https://unpkg.com/html5-qrcode@2.2.1/html5-qrcode.min.js",
            reverseGeocode: "https://nominatim.openstreetmap.org/reverse",
            googleMapsDirections: "https://www.google.com/maps/dir/",
            paymentGateway: "https://payment-gateway.example.com"
        },
        
        // Attributions
        attributions: {
            openStreetMap: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        },
        
        // Application branding
        branding: {
            appName: "TrashDrop Collector",
            companyName: "TrashDrop",
            copyright: "© 2025 TrashDrop. All rights reserved."
        }
    },
  environment: {
    isDevelopment,     // Development mode detection
    forceDirectConnection, // Bypass CORS proxy
    corsProxy,         // CORS proxy URL
    isProduction       // Production mode flag
  },
  api: {
    baseUrl,          // API base URL with env detection
    ngrokUrl,         // Ngrok tunnel URL
    apiVersion,       // API version from env (default: 'v1')
    restBasePath,     // Base path for REST endpoints
    rpcBasePath,      // Base path for RPC endpoints
    endpoints: {      // Organized API endpoints
      requests: {     // Request management endpoints
        LIST,         // List all requests
        NEARBY,       // Get nearby requests
        ACCEPT        // Accept a request
      },
      collectors: {   // Collector management endpoints
        UPDATE_STATUS // Update collector status
      },
      // Legacy endpoint keys are also supported
      REQUESTS,
      REQUESTS_NEARBY,
      ACCEPT_REQUEST
    }
  },
  map: {
    defaultLocation,   // Default coordinates
    tileUrl,          // Map tile provider URL
    maxZoom           // Maximum zoom level
  },
  supabase: {...},    // Supabase connection details
  dev: {...}          // Development-only settings
}
```

### Usage:

```javascript
// Access configuration values
const mapUrl = CONFIG.map.tileUrl;
const apiEndpoint = CONFIG.supabase.getApiUrl('REQUESTS');
const isDev = CONFIG.environment.isDevelopment;
```

### Development Mode:

In development mode (`localhost`), the system provides fallbacks for missing environment variables and enables additional debug features.

### Development Server Configuration:

#### CORS Proxy Server

The CORS proxy server (`cors-proxy.js`) can be configured using the following environment variables:

```bash
# CORS Proxy Configuration
CORS_PROXY_URL=http://localhost:8095/  # URL to access the proxy from the app
PROXY_PORT=8095                        # Port the proxy server runs on
PROXY_HOST=localhost                   # Host the proxy server binds to
CORS_ALLOWED_ORIGINS=*                 # Origins allowed to access the proxy
CORS_ALLOWED_METHODS=GET, POST, PUT, DELETE, OPTIONS  # HTTP methods allowed
CORS_ALLOWED_HEADERS=*                 # HTTP headers allowed
```

#### Running the Development Server

```bash
# Start the CORS proxy with custom configuration
node cors-proxy.js

# To use a specific environment file
PROXY_PORT=9000 PROXY_HOST=0.0.0.0 node cors-proxy.js
```

## 🔄 Database Schema

The application uses the following database tables in Supabase:

- **auth.users**: User authentication data (handled by Supabase Auth)
- **profiles**: User profile information
- **locations**: Saved user locations
- **pickup_requests**: Trash collection requests
- **authority_assignments**: Cleanup assignments from authorities
- **disposal_centers**: Waste disposal center locations
- **bags**: Trash bag tracking
- **fee_points**: Points earned from collections
- **rewards**: Available rewards for redemption
- **rewards_redemption**: Record of redeemed rewards

## 📱 PWA Installation

TrashDrop Collector can be installed as a Progressive Web App on compatible devices:

1. Visit the website in a supported browser (Chrome, Edge, Safari, etc.)
2. Look for the "Add to Home Screen" or "Install" option in the browser menu
3. Follow the prompts to install the app on your device

## 🧪 Testing

The application includes test accounts for demonstration:

- **Collector**: collector@example.com / password123
- **Authority**: authority@example.com / password123

## 🔮 Future Enhancements

- **Real-time Notifications**: Push notifications for new requests
- **Route Optimization**: Suggest optimal routes for multiple pickups
- **Analytics Dashboard**: Detailed stats on collections and earnings
- **Social Features**: Community challenges and leaderboards
- **Expanded Payment Options**: Multiple withdrawal methods

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

- [Your Name] - Initial development

## 🙏 Acknowledgements

- [Supabase](https://supabase.com) for backend services
- [Leaflet](https://leafletjs.com) for mapping functionality
- [OpenStreetMap](https://www.openstreetmap.org) for map data
