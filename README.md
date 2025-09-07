# SaverFwd 🍽️ - Food Waste Management Platform

SaverFwd connects food businesses with recipients to reduce waste by facilitating donations and low-cost sales of excess food.

## What It Does

- **Food Donors** (restaurants, hotels) can list excess food for donation or sale
- **Recipients** (NGOs, individuals) can find, claim, and purchase available food
- **Both users** can communicate and coordinate pickups

## Key Features

### For Donors
- List food items with details (quantity, expiry time, pricing)
- Set pickup locations and time windows
- Manage orders and track their status
- Chat with recipients for coordination
- View impact statistics and ratings

### For Recipients
- Browse and search available food items
- Filter by location, food type, and price
- Claim donations or purchase items
- Get directions to pickup locations
- Rate donors and provide feedback

## Quick Start Guide

### Test Accounts
**Donor:** `donor@example.com` / `password123`  
**Recipient:** `recipient@example.com` / `password123`

### Local Development
```bash
# Clone repository
git clone https://github.com/navneet-97/SaverFwd-Food-Waste-Management
cd app-main

# Setup Backend
cd backend
pip install -r requirements.txt
# Create .env with MongoDB URL, JWT secret, and DB name
python server.py  # Runs on http://localhost:8000

# Setup Frontend
cd frontend
npm install --legacy-peer-deps
npm start  # Runs on http://localhost:3000
```

## Technologies Used

### Frontend
- React 18
- React Router
- Tailwind CSS
- Axios

### Backend
- FastAPI
- MongoDB (with Motor)
- JWT Authentication

---

**SaverFwd - Turning food waste into food security 🍽️**
