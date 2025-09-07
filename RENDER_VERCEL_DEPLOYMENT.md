# 🚀 SaverFwd: Render + Vercel Deployment Guide

This guide will walk you through deploying your SaverFwd application using **Render for the backend** and **Vercel for the frontend**.

## 🎯 What We're Deploying

- **Backend (Python/FastAPI)** → Render
- **Frontend (React)** → Vercel  
- **Database** → MongoDB Atlas (Free)

## 📋 Prerequisites

- [ ] GitHub account with your code pushed
- [ ] MongoDB Atlas account (we'll set this up)
- [ ] Render account (free)
- [ ] Vercel account (free)

---

## 🏗️ Step 1: Set Up MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account

1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Click "Try Free" and sign up
3. Choose "Shared" (free tier)
4. Select a region close to you
5. Name your cluster (e.g., "saverfwd-cluster")
6. Click "Create Cluster"

### 1.2 Create Database User

1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Username: `saverfwd-user` (or any name you prefer)
5. Generate a secure password and **save it**
6. Database User Privileges: "Read and write to any database"
7. Click "Add User"

### 1.3 Configure Network Access

1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Select "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### 1.4 Get Connection String

1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Select "Python" and version "3.12 or later"
4. Copy the connection string - it looks like:
   ```
   mongodb+srv://saverfwd-user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. **Save this connection string** - you'll need it for Render

---

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

### 2.2 Deploy the Backend

1. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your `app-main` repository

2. **Configure Service Settings**
   ```
   Name: saverfwd-backend
   Environment: Python 3
   Build Command: cd backend && pip install -r requirements.txt
   Start Command: cd backend && python server.py
   ```

3. **Set Environment Variables**
   Click "Advanced" and add these environment variables:
   
   ```bash
   MONGO_URL=mongodb+srv://saverfwd-user:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/saverfwd?retryWrites=true&w=majority
   DB_NAME=saverfwd
   JWT_SECRET_KEY=your-super-secret-key-at-least-32-characters-long
   PORT=10000
   ```
   
   **Important:** Replace `YOUR_PASSWORD` with your MongoDB password!

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (this may take 5-10 minutes)
   - Your backend will be available at: `https://saverfwd-backend-xxxx.onrender.com`

### 2.3 Test Your Backend

Once deployed, test these URLs in your browser:

1. **Root endpoint**: `https://your-backend-url.onrender.com/`
   - Should show: `{"message": "SaverFwd API is running!", "status": "healthy"}`

2. **Health check**: `https://your-backend-url.onrender.com/health`
   - Should show: `{"status": "healthy", "service": "SaverFwd Backend"}`

3. **API docs**: `https://your-backend-url.onrender.com/docs`
   - Should show FastAPI interactive documentation

4. **Test API endpoint**: `https://your-backend-url.onrender.com/api/auth/test`
   - Should return API response (or 404 if endpoint doesn't exist)

---

## 🎨 Step 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account

1. Go to [vercel.com](https://vercel.com)
2. Sign up with your GitHub account
3. Authorize Vercel to access your repositories

### 3.2 Import Your Project

1. Click "New Project"
2. Import your GitHub repository (`app-main`)
3. **Configure Project Settings:**
   ```
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

### 3.3 Set Environment Variables

Before deploying, add this environment variable:
```
REACT_APP_BACKEND_URL=https://your-render-backend-url.onrender.com
```

**Replace with your actual Render backend URL!**

### 3.4 Deploy

1. Click "Deploy"
2. Wait for build and deployment (2-5 minutes)
3. Your app will be live at: `https://your-app-name.vercel.app`

---

## 🧪 Step 4: Create Test Accounts

### Option 1: Use the App Interface (Recommended)

1. Go to your deployed app URL
2. Click "Register"
3. Create these test accounts:

**Donor Account:**
- Email: `donor@example.com`
- Username: `testdonor`
- Password: `password123`
- Role: Donor (Restaurant/Hotel)
- Organization: `Test Restaurant`

**Recipient Account:**
- Email: `recipient@example.com`
- Username: `testrecipient`  
- Password: `password123`
- Role: Recipient (NGO/Individual)
- Organization: `Test NGO`

### Option 2: Database Seeding (Advanced)

If you prefer to seed data directly, create test accounts via MongoDB Compass or a script.

---

## ✅ Step 5: Test Your Deployment

### 5.1 Test Authentication
1. **Login as Donor**
   - Go to your app → Login
   - Use: `donor@example.com` / `password123`
   - Should redirect to donor dashboard

2. **Login as Recipient**  
   - Use: `recipient@example.com` / `password123`
   - Should redirect to recipient dashboard

### 5.2 Test Core Features

**As a Donor:**
1. Add a food item with details
2. Set pickup address and expiry time
3. View your dashboard stats

**As a Recipient:**
1. Browse available food items
2. Click on addresses (should open Google Maps)
3. Claim/order food items
4. Check your dashboard

### 5.3 Test Real-time Features
1. Open two browser windows (donor and recipient)
2. As donor: add new food item
3. As recipient: refresh browse page - should see new item
4. Test the chat system between users

---

## 🚨 Troubleshooting Common Issues

### Backend Issues

**❌ "Application failed to respond"**
- Check Render logs for errors
- Verify environment variables are set correctly
- Ensure MongoDB connection string is correct

**❌ CORS errors in browser**
- Check that CORS is configured in your FastAPI app
- Verify frontend URL is allowed in backend

### Frontend Issues

**❌ "Network Error" or API calls failing**
- Verify `REACT_APP_BACKEND_URL` is correct
- Check browser network tab for failed requests
- Ensure backend is running and accessible

**❌ Build failures on Vercel**
- Check build logs for specific errors
- Ensure all dependencies are in package.json
- Try clearing cache and rebuilding

### Database Issues

**❌ MongoDB connection errors**
- Verify connection string format
- Check username/password are correct
- Ensure IP whitelist includes 0.0.0.0/0
- Check MongoDB Atlas status

---

## 🔧 Environment Variables Reference

### Backend (Render)
```bash
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/saverfwd?retryWrites=true&w=majority
DB_NAME=saverfwd
JWT_SECRET_KEY=your-super-secret-key-at-least-32-characters-long
PORT=10000
```

### Frontend (Vercel)
```bash
REACT_APP_BACKEND_URL=https://your-backend.onrender.com
```

---

## 💰 Cost Breakdown

### Free Tier Limits
- **Render**: 750 hours/month, sleeps after 15 min inactivity
- **Vercel**: Unlimited personal projects, 100GB bandwidth
- **MongoDB Atlas**: 512MB storage, shared cluster
- **Total Cost**: $0/month for development and testing

### If You Need More
- **Render Starter**: $7/month (always on, better performance)
- **Vercel Pro**: $20/month (more bandwidth, better support)
- **MongoDB Atlas**: $9/month (2GB dedicated cluster)

---

## 🎉 Congratulations!

Your SaverFwd application is now live! Here's what users can do:

✅ **Donors can:**
- Register and login
- Add food items with expiry times
- Manage orders and pickups
- Chat with recipients
- View ratings and stats

✅ **Recipients can:**
- Browse available food items
- Click addresses to get directions
- Claim donations or purchase items
- Rate their experience
- Track their order history

### 🔗 Share Your App

Your app is now live at:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://your-backend.onrender.com`
- **API Docs**: `https://your-backend.onrender.com/docs`

### 📱 Next Steps

1. **Share your app** with potential users
2. **Monitor performance** via Render and Vercel dashboards
3. **Collect feedback** and iterate on features
4. **Scale up** to paid tiers when ready

---

**🆘 Need Help?**

If you run into issues:
1. Check the logs in Render/Vercel dashboards
2. Review the troubleshooting section above
3. Test individual components (database, backend, frontend)
4. Verify all environment variables are correct

**Your food waste management platform is now helping communities! 🌍🍽️**
