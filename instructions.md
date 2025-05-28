To develop the **TrashDrop Collector** Progressive Web App (PWA) using **Node.js 15**, **Tailwind CSS**, **Lucide Icons**, and **Supabase**, follow the comprehensive instructions below. This guide encompasses the onboarding process, main features, and technical setup, ensuring a seamless development experience.

---

## 🛠️ Technology Stack Overview

* **Frontend**: Next.js 15 (React-based framework)
* **Styling**: Tailwind CSS
* **Icons**: Lucide Icons
* **Backend**: Node.js 15
* **Database & Auth**: Supabase
* **Map Integration**: OpenStreetMap (via Leaflet.js or similar)
* **QR Code Scanning**: HTML5 Web APIs or third-party libraries
* **Geofencing**: Browser Geolocation API with custom logic
* **Notifications**: OneSignal integration with Supabase Edge Functions

---

## 🧾 Onboarding Flow

Upon first login, users will complete an onboarding process to set up their company persona.

### 1. Personal Details

* First Name
* Last Name
* Phone Number
* Ghana Card Number
* Upload Ghana Card Photo (Front)
* Upload Ghana Card Photo (Back)([YouTube][5], [Reddit][3])

### 2. Company Details

* Company Name
* Service Type (Dropdown)
* Operating Area (Dropdown)
* Assembly Registration Number
* Union Membership (Dropdown)
* Registered Business Status (Dropdown)
* If Registered, Upload Company Registration Certificate

### 3. Vehicle/Truck/Tricycle Details

* Registration Number
* Chassis Number
* Type (Dropdown)
* Vehicle Status (Dropdown)
* Upload Vehicle Photo

After completing onboarding, users are directed to the app homepage while awaiting account confirmation to start accepting requests or assignments.

---

## 🧭 Bottom Navigation Bar

The app features a bottom navigation bar with the following tabs:

* **Map** (Default Landing Page)
* **Request**
* **Assign**
* **Earnings**
* **Account** (Profile Settings)

---

## 🗺️ Map Page

The landing page displays an OpenStreetMap with the following functionalities:

* **Online/Offline Toggle**: Users can toggle their availability status.
* **Radius Filter**: Adjustable radius to filter pending requests within a certain distance.
* **Trash Type Filter**: Horizontal filter bar to select trash types (All Types, Recyclable, General, Hazardous).
* **List View Button**: Opens the "Request" page, displaying pending requests within the selected radius, sorted by distance.

---

## 📥 Request Page

The Request page contains three tabs:

### 1. Available

* Displays pending requests sorted by proximity.
* Users can accept one or multiple requests, which then move to the "Accepted" tab.

### 2. Accepted

* Lists accepted requests with two action buttons:

  * **Get Direction**: Opens a third-party app (e.g., Google Maps) for navigation.
  * **Scan Bag QR Code**: Opens a modal with a QR scanner. After scanning, displays a table of scanned bags with associated fees/points. Upon closing the modal, requests move to the "Picked Up" tab.

### 3. Picked Up

* Displays picked-up requests with two action buttons:

  * **Locate Dumping Site**: Opens a third-party app for navigation to the nearest disposal center.
  * **Dispose Bag Now**: Geofenced to activate only within a 50m radius of a disposal center. Opens a modal to confirm disposal. Upon completion, credits the user's account and changes the button to "View Report".

---

## 📋 Assign Page

The Assign page contains three tabs:

### 1. Available

* Displays assignments from authorities, sorted by proximity.
* Users can accept one or multiple assignments, which then move to the "Accepted" tab.

### 2. Accepted

* Lists accepted assignments with two action buttons:

  * **Get Direction**: Opens a third-party app for navigation.
  * **Mark Complete**: Opens a modal requiring users to:

    * Capture a minimum of three photos of the cleaned environment.
    * Add comments.
    * Upon submission, assignments move to the "Completed" tab.

### 3. Completed

* Displays completed assignments with two action buttons:

  * **Locate Dumping Site**: Opens a third-party app for navigation.
  * **Dispose Now**: Geofenced to activate only within a 50m radius of a disposal center. Opens a modal to confirm disposal. Upon completion, notifies the authority for validation. Payment is processed via mobile wallet or alternative methods. The button then changes to "View Report".

---

## 💰 Earnings Page

* Displays earnings per work done (assignments, pickup requests), trash type, and timeframes (Day, Week, Month).
* **Cash Out**: Opens a modal to confirm withdrawal request and redirects to a third-party payment gateway.

---

## 👤 Account Page

Contains three tabs:

### 1. Account

* Allows users to edit and save account information.

### 2. Settings

* Provides toggle switches for various settings.

### 3. Support

* Displays support content.
* **Create Support Ticket**: Opens a modal for users to submit comments or issues.

---

## 🧩 Technical Setup

### 1. Project Initialization

* Initialize a Next.js 15 project with Tailwind CSS:([YouTube][1])

```bash
  npx create-next-app@15 trashdrop-collector
  cd trashdrop-collector
  npm install tailwindcss lucide-react @supabase/supabase-js
  npx tailwindcss init -p
```



### 2. Tailwind CSS Configuration

* Configure `tailwind.config.js` with desired settings.

### 3. Lucide Icons Integration

* Import icons as React components:([YouTube][6])

```javascript
  import { Camera } from 'lucide-react';
```



* Use in components:([Lucide][7])

```jsx
  <Camera size={24} color="black" />
```


Lucide Icons are tree-shakable and customizable. ([Lucide][7])

### 4. Supabase Setup

* Create a Supabase project and obtain the API keys.
* Initialize Supabase client:([Supabase][4])

```javascript
  import { createClient } from '@supabase/supabase-js';

  const supabase = createClient('https://your-project.supabase.co', 'public-anon-key');
```



### 5. PWA Configuration

* Create `manifest.json` in the `public` directory with appropriate metadata.
* Configure Next.js to use `next-pwa` for service worker support.
* Add an install button using the `beforeinstallprompt` event. ([Gist][8])

### 6. Map Integration

* Use Leaflet.js or a similar library to integrate OpenStreetMap.
* Implement radius filtering and trash type filtering functionalities.

### 7. QR Code Scanning

* Utilize HTML5 Web APIs or third-party libraries to implement QR code scanning within modals.

### 8. Geofencing

* Use the Browser Geolocation API to determine the user's location.
* Implement custom logic to activate certain features (e.g., "Dispose Bag Now") only within a 50m radius of disposal centers.

### 9. Notifications

* Integrate OneSignal with Supabase Edge Functions to send real-time push notifications. ([Supabase][4])

---

## 📊 Database Schema (Supabase)

Design the database with the following tables:([Supabase][4])

* **Users**: Stores

[1]: https://www.youtube.com/watch?v=wU6EmxVD_8M&utm_source=chatgpt.com "Build and Deploy a Full Stack App Using Next.JS 15 in V0.dev and ..."
[2]: https://medium.com/%40nbryleibanez/building-a-simple-to-do-app-with-supabase-next-js-2984ce16926a?utm_source=chatgpt.com "Building a simple To-Do app with Supabase & Next.js - Medium"
[3]: https://www.reddit.com/r/nextjs/comments/1e884mz/nextjs_14_pwa_with_supabase_middleware/?utm_source=chatgpt.com "NextJS 14 PWA with Supabase middleware - Reddit"
[4]: https://supabase.com/partners/onesignal?utm_source=chatgpt.com "OneSignal | Works With Supabase"
[5]: https://www.youtube.com/watch?v=k1Y8EN6eAX4&utm_source=chatgpt.com "Build a MODERN Full-Stack App: Next.js, Tailwind & Supabase ..."
[6]: https://www.youtube.com/watch?v=FncLJLfXRDM&utm_source=chatgpt.com "Lucide Icons in React / Next.js project with lucide-react - YouTube"
[7]: https://lucide.dev/guide/packages/lucide-react?utm_source=chatgpt.com "Lucide React"
[8]: https://gist.github.com/cdnkr/25d3746bdb35767d66c7ae6d26c2ed98?utm_source=chatgpt.com "Setting up a PWA with install button in Next.js 15 - GitHub Gist"
