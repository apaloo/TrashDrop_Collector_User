# Hardcoded Values Audit

## Summary

| Category | Count |
|----------|-------|
| coordinates | 25 |
| email | 13 |
| ip_address | 11 |
| port | 1 |
| supabase | 6 |
| url | 50 |

## Detailed Findings

### README.md

| Line | Type | Value | Context |
|------|------|-------|---------|
| 49 | url | `https://supabase.com` | `- Create a Supabase project at [supabase.com](https://supabase.com)` |
| 53 | url | `https://your-project-url.supabase.co` | `SUPABASE_URL=https://your-project-url.supabase.co` |
| 59 | url | `http://localhost:8095/` | `CORS_PROXY_URL=http://localhost:8095/` |
| 60 | url | `https://your-ngrok-url.ngrok-free.app` | `NGROK_URL=https://your-ngrok-url.ngrok-free.app` |
| 63 | url | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | `MAP_TILE_URL=https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` |
| 66 | port | `PORT=8095` | `PROXY_PORT=8095` |
| 87 | url | `http://localhost:8000`` | `4. Access the application at `http://localhost:8000`` |
| 127 | supabase | `supabase.getApiUrl` | `const apiEndpoint = CONFIG.supabase.getApiUrl('REQUESTS');` |
| 162 | email | `collector@example.com` | `- **Collector**: collector@example.com / password123` |
| 163 | email | `authority@example.com` | `- **Authority**: authority@example.com / password123` |
| 183 | url | `https://supabase.com` | `- [Supabase](https://supabase.com) for backend services` |
| 184 | url | `https://leafletjs.com` | `- [Leaflet](https://leafletjs.com) for mapping functionality` |
| 185 | url | `https://www.openstreetmap.org` | `- [OpenStreetMap](https://www.openstreetmap.org) for map data` |

### account.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 16 | url | `https://fonts.googleapis.com` | `<link rel="preconnect" href="https://fonts.googleapis.com">` |
| 17 | url | `https://fonts.gstatic.com` | `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` |
| 20 | url | `https://fonts.googleapis.com/icon?family=Material+Icons` | `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">` |
| 23 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |
| 213 | email | `support@trashdrop.com` | `support@trashdrop.com` |

### assign.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 17 | url | `https://fonts.googleapis.com/icon?family=Material+Icons` | `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">` |
| 20 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |
| 315 | url | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=" crossorigin=""/>` |
| 316 | url | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` | `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" integrity="sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=" crossorigin=""></script>` |

### cors-proxy.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 86 | url | `http://localhost:${PORT}`` | `console.log(`✅ CORS proxy server running on http://localhost:${PORT}`);` |

### earnings.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 15 | url | `https://fonts.googleapis.com/icon?family=Material+Icons` | `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">` |
| 24 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |
| 27 | supabase | `supabase-client.js` | `<script src="./src/js/supabase-client.js"></script>` |
| 33 | url | `https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js` | `<script src="https://cdn.jsdelivr.net/npm/chart.js@3.9.1/dist/chart.min.js"></script>` |
| 431 | coordinates | `[2150.75, 1705.75]` | `data: [2150.75, 1705.75],` |
| 1130 | coordinates | `[2150.75, 1705.75]` | `data = [2150.75, 1705.75];` |
| 1133 | coordinates | `[8250.75, 6000.00]` | `data = [8250.75, 6000.00];` |
| 1136 | coordinates | `[54250.50, 41170.00]` | `data = [54250.50, 41170.00];` |

### email-confirmation.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 53 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |

### index.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 24 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |
| 28 | url | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"` |

### login.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 362 | ip_address | `127.0.0.1` | `if (window.location.hostname === 'localhost' \|\| window.location.hostname === '127.0.0.1') {` |
| 365 | email | `test@example.com` | `document.getElementById('email').value = 'test@example.com';` |

### map.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 33 | url | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"` |
| 38 | url | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.js` | `<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"` |
| 43 | url | `https://unpkg.com/leaflet.locatecontrol@0.76.1/dist/L.Control.Locate.min.css` | `<link rel="stylesheet" href="https://unpkg.com/leaflet.locatecontrol@0.76.1/dist/L.Control.Locate.min.css" />` |
| 46 | url | `https://unpkg.com/leaflet.locatecontrol@0.76.1/dist/L.Control.Locate.min.js` | `<script src="https://unpkg.com/leaflet.locatecontrol@0.76.1/dist/L.Control.Locate.min.js"></script>` |
| 136 | url | `https://fonts.googleapis.com/icon?family=Material+Icons` | `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">` |
| 145 | url | `https://unpkg.com/leaflet@1.9.4/dist/leaflet.css` | `<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"` |
| 948 | coordinates | `[5.6037, -0.1870]` | `let coords = [5.6037, -0.1870]; // Default Accra coordinates` |
| 1254 | coordinates | `[5.6037, -0.1870]` | `center: [5.6037, -0.1870],` |
| 1269 | coordinates | `[-90, -180]` | `maxBounds: [[-90, -180], [90, 180]],` |
| 1269 | coordinates | `[90, 180]` | `maxBounds: [[-90, -180], [90, 180]],` |
| 1283 | url | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {` |
| 1443 | coordinates | `[5.6037, -0.1870]` | `window.mapInstance = window.initMap([5.6037, -0.1870]);` |
| 1684 | coordinates | `[5.6037, -0.1870]` | `currentPosition = [5.6037, -0.1870]; // Default to Accra if position not available` |
| 1909 | supabase | `supabase.auth.getSession` | `const { data: { session }, error } = await window.supabase.auth.getSession();` |

### onboarding-company.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 13 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |

### onboarding-personal.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 13 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |

### onboarding-vehicle.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 13 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |

### request.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 18 | url | `https://fonts.googleapis.com/icon?family=Material+Icons` | `<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">` |
| 33 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |

### reset-password.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 12 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |

### signup.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 12 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |
| 210 | ip_address | `127.0.0.1` | `window.location.hostname === '127.0.0.1';` |

### src/js/assign.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 454 | url | `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` | `L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {` |
| 455 | url | `https://www.openstreetmap.org/copyright` | `attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',` |
| 573 | url | `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,` | `const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {` |
| 1055 | url | `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;` | `url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;` |

### src/js/auth.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 21 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1') \|\|` |

### src/js/bottom-nav-fix.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 41 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1') \|\|` |
| 48 | email | `temp@example.com` | `email: 'temp@example.com',` |

### src/js/dev-tools.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 10 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1');` |

### src/js/earnings.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 668 | url | `https://payment-gateway.example.com` | `// window.location.href = "https://payment-gateway.example.com";` |

### src/js/fixed-navigation.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 14 | email | `dev@example.com` | `email: 'dev@example.com',` |

### src/js/main.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 65 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1') \|\|` |
| 221 | ip_address | `127.0.0.1` | `!window.location.hostname.includes('127.0.0.1');` |
| 223 | ip_address | `127.0.0.1` | `window.location.hostname === '127.0.0.1';` |

### src/js/map.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 31 | coordinates | `[5.6037, -0.1870]` | `function initMap(coords = [5.6037, -0.1870]) {` |
| 72 | coordinates | `[-90, -180]` | `[-90, -180],` |
| 73 | coordinates | `[90, 180]` | `[90, 180]` |
| 102 | url | `https://www.openstreetmap.org/copyright` | `attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',` |
| 166 | coordinates | `[32, 32]` | `iconSize: [32, 32],` |
| 167 | coordinates | `[16, 32]` | `iconAnchor: [16, 32],` |
| 168 | coordinates | `[0, -32]` | `popupAnchor: [0, -32]` |
| 496 | coordinates | `[30, 30]` | `iconSize: [30, 30],` |
| 497 | coordinates | `[15, 15]` | `iconAnchor: [15, 15]` |
| 772 | coordinates | `[36, 36]` | `iconSize: [36, 36],` |
| 773 | coordinates | `[18, 18]` | `iconAnchor: [18, 18]` |

### src/js/mock-auth.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 12 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1') \|\|` |
| 25 | email | `test@example.com` | `email: 'test@example.com',` |

### src/js/navigation-fix.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 12 | email | `mock@example.com` | `email: 'mock@example.com',` |

### src/js/notifications.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 110 | url | `https://cdn.onesignal.com/sdks/OneSignalSDK.js` | `script.src = 'https://cdn.onesignal.com/sdks/OneSignalSDK.js';` |
| 264 | supabase | `supabase.createClient` | `return window.supabase.createClient(url, key);` |
| 266 | supabase | `supabase.createClient` | `return supabase.createClient(url, key);` |
| 289 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1') \|\|` |
| 295 | email | `dev@example.com` | `email: 'dev@example.com',` |

### src/js/pwa-install.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 67 | url | `http://www.w3.org/2000/svg` | `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` |

### src/js/qr-scanner.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 107 | url | `https://unpkg.com/html5-qrcode@2.2.1/html5-qrcode.min.js` | `script.src = 'https://unpkg.com/html5-qrcode@2.2.1/html5-qrcode.min.js';` |

### src/js/request.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 36 | ip_address | `127.0.0.1` | `window.location.hostname.includes('127.0.0.1') \|\|` |
| 46 | email | `dev@example.com` | `email: 'dev@example.com',` |
| 272 | coordinates | `[5.6037, -0.1870]` | `let center = [5.6037, -0.1870]; // Default: Accra, Ghana` |
| 616 | url | `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;` | `url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;` |

### src/js/safe-navigation.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 17 | email | `dev-user@example.com` | `email: 'dev-user@example.com',` |
| 85 | email | `dev-user@example.com` | `email: 'dev-user@example.com',` |

### src/js/supabase-client.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 36 | supabase | `supabase.createClient` | `window.supabaseClient = window.supabase.createClient(` |

### src/js/tech-setup.js

| Line | Type | Value | Context |
|------|------|-------|---------|
| 70 | coordinates | `[5.6037, -0.1870]` | `let coords = [5.6037, -0.1870];` |
| 77 | url | `http://www.w3.org/2000/svg` | `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">` |
| 163 | coordinates | `[5.6050, -0.1875]` | `[5.6050, -0.1875], // Sample disposal center 1` |
| 164 | coordinates | `[5.6100, -0.1800]` | `[5.6100, -0.1800], // Sample disposal center 2` |
| 165 | coordinates | `[5.5980, -0.1920]` | `[5.5980, -0.1920]  // Sample disposal center 3` |

### test-login.html

| Line | Type | Value | Context |
|------|------|-------|---------|
| 11 | url | `https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2` | `<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>` |
| 77 | email | `test@example.com` | `<input type="email" id="email" value="test@example.com">` |


## Recommendations

### Values to Move to Environment Variables

- API keys, secrets, and credentials
- Service URLs that might change between environments
- Database connection strings

### Values to Move to Configuration

- Default coordinates and zoom levels
- UI settings and defaults
- Feature flags and toggles