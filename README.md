# SaverFwd 🍽️ - Food Waste Management Platform

**Reduce Food Waste, Feed Communities**

SaverFwd is a web application that connects food donors (restaurants, hotels) with recipients (NGOs, individuals) to reduce food waste and help feed communities.

## 🌟 Features

- **For Donors (Restaurants/Hotels):**
  - Post available food items for donation or low-cost sale
  - Manage food listings with expiry times and pickup windows
  - Real-time order management and tracking
  - Rating system to build trust
  - Chat system for direct communication

- **For Recipients (NGOs/Individuals):**
  - Browse available food items nearby
  - Claim free donations or purchase low-cost items
  - Rate donors based on experience
  - Real-time notifications for new food items
  - Clickable addresses for easy navigation to pickup locations

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** database

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd app-main
   ```

2. **Setup Backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Variables**

   **Backend (.env):**
   ```
   MONGO_URL=your_mongodb_connection_string
   DB_NAME=saverfwd
   JWT_SECRET_KEY=your_secret_key_here
   ```

   **Frontend (.env):**
   ```
   REACT_APP_BACKEND_URL=http://localhost:8000
   ```

### Running the Application

1. **Start Backend Server:**
   ```bash
   cd backend
   python server.py
   ```
   Server will run on `http://localhost:8000`

2. **Start Frontend:**
   ```bash
   cd frontend
   npm start
   ```
   App will open on `http://localhost:3000`

## 🧪 Test Accounts

Use these pre-configured test accounts to explore the app:

### Donor Accounts (Restaurants/Hotels)
- **Email:** `donor@example.com` | **Password:** `password123`
- **Email:** `donor1@example.com` | **Password:** `password123`

### Recipient Accounts (NGOs/Individuals)
- **Email:** `recipient@example.com` | **Password:** `password123`
- **Email:** `recipient1@example.com` | **Password:** `password123`

## 📱 How to Use

### As a Donor:
1. Login with donor credentials
2. Add food items with details (title, quantity, expiry time, pickup address)
3. Manage incoming orders and confirm pickups
4. Chat with recipients for coordination
5. View your ratings and donation statistics

### As a Recipient:
1. Login with recipient credentials
2. Browse available food items
3. Click on addresses to get directions in Google Maps
4. Claim free donations or purchase low-cost items
5. Rate your experience with donors
6. Track your claimed/purchased items

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Radix UI** - UI components
- **Axios** - API calls
- **Sonner** - Toast notifications
- **Lucide React** - Icons

### Backend
- **FastAPI** - Python web framework
- **MongoDB** - Database
- **Motor** - Async MongoDB driver
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **CORS** - Cross-origin support

## 📂 Project Structure

```
app-main/
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── ...
│   ├── public/             # Static files
│   └── package.json
├── backend/                # FastAPI backend
│   ├── server.py           # Main server file
│   ├── requirements.txt    # Python dependencies
│   └── .env               # Environment variables
└── README.md              # This file
```

## 🌍 Key Features Explained

### Smart Refresh System
- Real-time updates for food availability
- Automatic notifications for new items
- Smart polling to reduce server load

### Rating System
- Recipients can rate donors (1-5 stars)
- Ratings visible on food listings
- Builds trust and quality assurance

### Address Integration
- All pickup addresses are clickable
- Opens Google Maps for easy navigation
- Works in both browse view and dashboard

### Real-time Chat
- Direct messaging between donors and recipients
- Order coordination and pickup arrangements
- Unread message indicators

## 🚀 Deployment

### Option 1: Vercel (Frontend) + Railway (Backend)

**Frontend (Vercel):**
1. Push your code to GitHub
2. Connect your repo to Vercel
3. Set build command: `cd frontend && npm run build`
4. Set output directory: `frontend/build`
5. Add environment variable: `REACT_APP_BACKEND_URL=your_backend_url`

**Backend (Railway):**
1. Connect your GitHub repo to Railway
2. Set start command: `cd backend && python server.py`
3. Add environment variables (MONGO_URL, JWT_SECRET_KEY, etc.)

### Option 2: Heroku (Full Stack)
1. Create two Heroku apps (frontend and backend)
2. Deploy backend with Python buildpack
3. Deploy frontend with Node.js buildpack
4. Configure environment variables

### Option 3: Docker (Self-hosted)
1. Create Docker containers for frontend and backend
2. Use docker-compose for easy management
3. Deploy to any cloud provider supporting Docker

## 🔧 Environment Setup

### MongoDB Setup
1. Create a MongoDB Atlas account (free tier available)
2. Create a new cluster
3. Get connection string and add to backend .env
4. Create database named `saverfwd`

### PostHog Analytics (Optional)
- The app includes PostHog for analytics
- Update the PostHog key in `frontend/public/index.html`
- Or remove the script if not needed

## 🐛 Troubleshooting

### Common Issues

**CORS Errors:**
- Ensure backend allows frontend origin
- Check REACT_APP_BACKEND_URL is correct

**MongoDB Connection:**
- Verify connection string format
- Check network access in MongoDB Atlas

**Port Conflicts:**
- Backend: Change port in server.py
- Frontend: Set PORT environment variable

### Development Tips

- Use browser DevTools for debugging
- Check Network tab for API call issues
- MongoDB Compass for database inspection
- Clear browser cache if UI issues persist

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Support

If you encounter any issues or have questions:
1. Check the troubleshooting section above
2. Look through existing GitHub issues
3. Create a new issue with detailed information

## 🌟 Acknowledgments

- Built with modern web technologies
- Inspired by the need to reduce food waste
- Designed to strengthen community connections

---

**Made with ❤️ to help reduce food waste and feed communities**

*Last updated: 2025*
