# 🚀 SaverFwd Deployment Guide

This guide will help you deploy your SaverFwd application to various platforms. Choose the option that best fits your needs.

## 📋 Pre-deployment Checklist

Before deploying, make sure you have:

- [ ] MongoDB database set up (MongoDB Atlas recommended)
- [ ] All environment variables configured
- [ ] Test accounts created in your database
- [ ] Code pushed to a Git repository (GitHub, GitLab, etc.)

## 🌟 Recommended: Vercel + Railway

This is the **easiest and most cost-effective** deployment method.

### 🎯 Step 1: Deploy Backend to Railway

**Railway** offers free hosting for backend services with generous limits.

1. **Sign up for Railway**
   - Go to [railway.app](https://railway.app)
   - Sign up with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Backend Service**
   ```bash
   # Railway will auto-detect your Python app
   # Add these settings in Railway dashboard:
   
   Root Directory: backend
   Start Command: python server.py
   ```

4. **Set Environment Variables**
   In Railway dashboard, add:
   ```
   MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/saverfwd
   DB_NAME=saverfwd
   JWT_SECRET_KEY=your-super-secret-key-change-this
   PORT=8000
   ```

5. **Deploy**
   - Railway will automatically deploy
   - Copy your backend URL (e.g., `https://your-app.railway.app`)

### 🎨 Step 2: Deploy Frontend to Vercel

**Vercel** is perfect for React applications with automatic deployments.

1. **Sign up for Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

3. **Configure Build Settings**
   ```bash
   Framework Preset: Create React App
   Root Directory: frontend
   Build Command: npm run build
   Output Directory: build
   Install Command: npm install
   ```

4. **Set Environment Variables**
   ```
   REACT_APP_BACKEND_URL=https://your-railway-app.railway.app
   ```

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Your app will be live at `https://your-app.vercel.app`

### 💾 Step 3: Set Up MongoDB Atlas

1. **Create MongoDB Atlas Account**
   - Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
   - Sign up for free

2. **Create Cluster**
   - Choose "Shared" (free tier)
   - Select a region close to your users
   - Create cluster

3. **Set Up Database Access**
   - Go to "Database Access"
   - Add database user with read/write permissions
   - Note down username and password

4. **Configure Network Access**
   - Go to "Network Access"
   - Add IP Address: `0.0.0.0/0` (allow from anywhere)

5. **Get Connection String**
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your actual password

## 🐳 Alternative: Docker Deployment

### Create Dockerfile for Backend

Create `backend/Dockerfile`:
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "server.py"]
```

### Create Dockerfile for Frontend

Create `frontend/Dockerfile`:
```dockerfile
FROM node:16-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Create docker-compose.yml

Create `docker-compose.yml` in root:
```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - MONGO_URL=${MONGO_URL}
      - DB_NAME=saverfwd
      - JWT_SECRET_KEY=${JWT_SECRET_KEY}
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - REACT_APP_BACKEND_URL=http://localhost:8000
    depends_on:
      - backend

  mongodb:
    image: mongo:5.0
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password

volumes:
  mongodb_data:
```

## 🟡 Alternative: Heroku Deployment

### Backend on Heroku

1. **Install Heroku CLI**
   ```bash
   # Download from heroku.com/cli
   ```

2. **Create Heroku App**
   ```bash
   cd backend
   heroku create your-app-backend
   ```

3. **Add Buildpack**
   ```bash
   heroku buildpacks:set heroku/python
   ```

4. **Create Procfile**
   Create `backend/Procfile`:
   ```
   web: python server.py
   ```

5. **Set Environment Variables**
   ```bash
   heroku config:set MONGO_URL=your_mongodb_connection_string
   heroku config:set DB_NAME=saverfwd
   heroku config:set JWT_SECRET_KEY=your-secret-key
   ```

6. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy backend"
   git push heroku main
   ```

### Frontend on Heroku

1. **Create Frontend App**
   ```bash
   cd frontend
   heroku create your-app-frontend
   ```

2. **Add Buildpack**
   ```bash
   heroku buildpacks:set heroku/nodejs
   ```

3. **Create Procfile**
   Create `frontend/Procfile`:
   ```
   web: npm start
   ```

4. **Set Environment Variables**
   ```bash
   heroku config:set REACT_APP_BACKEND_URL=https://your-app-backend.herokuapp.com
   ```

5. **Deploy**
   ```bash
   git add .
   git commit -m "Deploy frontend"
   git push heroku main
   ```

## 🔧 Environment Variables Reference

### Backend Environment Variables
```bash
# Required
MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/saverfwd
DB_NAME=saverfwd
JWT_SECRET_KEY=your-super-secret-key-minimum-32-chars

# Optional
PORT=8000
```

### Frontend Environment Variables
```bash
# Required
REACT_APP_BACKEND_URL=https://your-backend-domain.com

# Optional
GENERATE_SOURCEMAP=false  # For production builds
```

## 🧪 Setting Up Test Data

After deployment, you'll need to create test accounts. You can either:

### Option 1: Use the Registration Form
1. Go to your deployed app
2. Use the "Register" page to create test accounts
3. Use the provided test emails and passwords

### Option 2: Database Seeding (Advanced)

Create `backend/seed_data.py`:
```python
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from passlib.context import CryptContext
import os

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def seed_test_accounts():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]
    
    test_users = [
        {
            "email": "donor@example.com",
            "username": "donor",
            "password": pwd_context.hash("password123"),
            "full_name": "Test Donor",
            "role": "donor",
            "organization_name": "Test Restaurant"
        },
        {
            "email": "recipient@example.com", 
            "username": "recipient",
            "password": pwd_context.hash("password123"),
            "full_name": "Test Recipient",
            "role": "recipient",
            "organization_name": "Test NGO"
        }
    ]
    
    for user in test_users:
        existing = await db.users.find_one({"email": user["email"]})
        if not existing:
            await db.users.insert_one(user)
            print(f"Created user: {user['email']}")

if __name__ == "__main__":
    asyncio.run(seed_test_accounts())
```

Run: `python backend/seed_data.py`

## 🔍 Post-Deployment Testing

1. **Test Registration**
   - Try creating new accounts
   - Verify email validation works

2. **Test Login**
   - Use test credentials
   - Check JWT token generation

3. **Test Core Features**
   - Create food items (as donor)
   - Browse food items (as recipient)
   - Test address clicking functionality
   - Try the chat system
   - Test rating system

4. **Check API Endpoints**
   - Visit `https://your-backend-url.com/docs`
   - Test API documentation

## 🚨 Common Deployment Issues

### CORS Issues
```python
# In server.py, make sure CORS allows your frontend domain
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Environment Variables Not Loading
- Double-check variable names (case-sensitive)
- Ensure .env files are not committed to Git
- Restart services after changing variables

### MongoDB Connection Issues
- Verify connection string format
- Check network access settings in MongoDB Atlas
- Ensure database name matches

### Build Failures
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Check Node.js version compatibility
- Verify all dependencies are in package.json

## 📊 Monitoring & Analytics

### Application Monitoring
- Use Vercel Analytics for frontend
- Use Railway metrics for backend
- Monitor MongoDB Atlas performance

### Error Tracking
- Add Sentry for error tracking
- Monitor API response times
- Set up uptime monitoring

## 🔄 Continuous Deployment

### Auto-deploy from Git
Both Vercel and Railway support automatic deployments:
- Push to main branch = automatic deployment
- Preview deployments for pull requests
- Rollback capabilities

### GitHub Actions (Optional)
Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Deploy to production
      run: |
        # Your deployment commands here
```

## 💰 Cost Estimates

### Free Tier (Recommended for Testing)
- **Vercel**: Free for personal projects
- **Railway**: $5/month after free tier
- **MongoDB Atlas**: Free tier (512MB)
- **Total**: ~$5/month

### Production Ready
- **Vercel Pro**: $20/month
- **Railway Pro**: $20/month  
- **MongoDB Atlas**: $9/month (2GB)
- **Total**: ~$49/month

## 🎉 Congratulations!

Your SaverFwd application is now deployed and ready to help reduce food waste! 

### Next Steps:
1. Share your app URL with potential users
2. Monitor usage and performance
3. Collect feedback for improvements
4. Consider adding new features based on user needs

---

**Need Help?** Check the troubleshooting section in the main README or create an issue in your repository.
