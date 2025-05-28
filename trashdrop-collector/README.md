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

2. Configure Supabase:
   - Create a Supabase project at [supabase.com](https://supabase.com)
   - Update the `.env` file with your Supabase URL and anon key:
     ```
     SUPABASE_URL=https://your-project-url.supabase.co
     SUPABASE_KEY=your-public-anon-key
     ```

3. Deploy to a web server or use a local development server:
   ```
   # Example using a simple Python HTTP server
   python -m http.server
   ```

4. Access the application at `http://localhost:8000`

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
