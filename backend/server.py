from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from uuid import uuid4
from datetime import datetime, timezone, timedelta
import jwt
from passlib.context import CryptContext

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 60  # 30 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="SaverFwd API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# User Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    username: str
    full_name: str
    role: Literal["donor", "recipient"]
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    organization_name: Optional[str] = None  # For donors (restaurants) and recipients (NGOs)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    role: Literal["donor", "recipient"]
    phone: Optional[str] = None
    address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    organization_name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

# Food Item Models
class FoodItem(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: Optional[str] = None
    quantity: str  # e.g., "50 plates", "10 kg"
    expiry_time: datetime
    pickup_address: str
    latitude: float
    longitude: float
    donor_id: str
    food_type: Literal["donation", "sale"] = "donation"
    price: Optional[float] = None  # Only for sales
    delivery_available: bool = False  # Only for sales
    status: Literal["available", "claimed", "sold", "expired", "completed"] = "available"
    pickup_window_start: Optional[datetime] = None
    pickup_window_end: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FoodItemCreate(BaseModel):
    title: str
    description: Optional[str] = None
    quantity: str
    expiry_time: datetime
    pickup_address: str
    latitude: float
    longitude: float
    food_type: Literal["donation", "sale"] = "donation"
    price: Optional[float] = None
    delivery_available: bool = False
    pickup_window_start: Optional[datetime] = None
    pickup_window_end: Optional[datetime] = None

class FoodItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    quantity: Optional[str] = None
    expiry_time: Optional[datetime] = None
    pickup_address: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    food_type: Optional[Literal["donation", "sale"]] = None
    price: Optional[float] = None
    delivery_available: Optional[bool] = None
    status: Optional[Literal["available", "claimed", "sold", "expired", "completed"]] = None
    pickup_window_start: Optional[datetime] = None
    pickup_window_end: Optional[datetime] = None

class FoodItemWithRating(FoodItem):
    """FoodItem with donor rating information for recipients"""
    donor_name: Optional[str] = None
    donor_organization: Optional[str] = None
    donor_average_rating: Optional[float] = None
    donor_total_ratings: Optional[int] = None

# Order/Claim Models
class Order(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    food_item_id: str
    recipient_id: str
    donor_id: str
    order_type: Literal["claim", "purchase"] = "claim"
    total_amount: float = 0.0
    payment_status: Literal["pending", "completed", "failed"] = "pending"
    delivery_method: Literal["pickup", "delivery"] = "pickup"
    delivery_address: Optional[str] = None
    status: Literal["pending", "confirmed", "completed", "cancelled"] = "pending"
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class OrderCreate(BaseModel):
    food_item_id: str
    delivery_method: Literal["pickup", "delivery"] = "pickup"
    delivery_address: Optional[str] = None

# Chat Models
class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    receiver_id: str
    content: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_read: bool = False

class MessageCreate(BaseModel):
    receiver_id: str
    content: str

class ChatContact(BaseModel):
    user_id: str
    user_name: str
    user_organization: Optional[str] = None
    user_role: Literal["donor", "recipient"]
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

class ChatConversation(BaseModel):
    contact: ChatContact
    messages: List[Message]

# Helper Functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise credentials_exception
    return User(**user)

def prepare_for_mongo(data):
    """Convert datetime objects to ISO strings for MongoDB storage"""
    if isinstance(data, dict):
        for key, value in data.items():
            if isinstance(value, datetime):
                # Ensure timezone aware datetime and consistent format
                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                data[key] = value.isoformat()
    return data

def parse_from_mongo(item):
    """Convert ISO strings back to datetime objects"""
    if isinstance(item, dict):
        for key, value in item.items():
            if isinstance(value, str) and key.endswith(('_at', '_time', 'expiry_time', 'pickup_window_start', 'pickup_window_end')):
                try:
                    # Handle various ISO formats
                    if value.endswith('Z'):
                        value = value.replace('Z', '+00:00')
                    item[key] = datetime.fromisoformat(value)
                    # Ensure timezone aware
                    if item[key].tzinfo is None:
                        item[key] = item[key].replace(tzinfo=timezone.utc)
                except Exception as e:
                    # If parsing fails, keep as string
                    pass
    return item

async def auto_expire_food_items():
    """Automatically mark expired food items as expired"""
    current_time = datetime.now(timezone.utc)
    
    # Find all available items that have passed their expiry time
    expired_items = await db.food_items.find({
        "status": "available",
        "expiry_time": {"$lt": current_time.isoformat()}
    }).to_list(length=None)
    
    # Update expired items
    for item in expired_items:
        await db.food_items.update_one(
            {"id": item["id"]},
            {"$set": {
                "status": "expired",
                "updated_at": current_time.isoformat()
            }}
        )
    
    return len(expired_items)

# Basic Routes
@api_router.get("/")
async def root():
    return {"message": "SaverFwd API is running!", "version": "1.0.0"}

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_create: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_create.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    existing_username = await db.users.find_one({"username": user_create.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    user_dict = user_create.dict()
    user_dict["password"] = get_password_hash(user_create.password)
    user_obj = User(**{k: v for k, v in user_dict.items() if k != "password"})
    
    # Store in database
    user_data = prepare_for_mongo(user_obj.dict())
    user_data["hashed_password"] = user_dict["password"]
    await db.users.insert_one(user_data)
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_obj.id}, expires_delta=access_token_expires
    )
    
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.post("/auth/login", response_model=Token)
async def login(user_login: UserLogin):
    user = await db.users.find_one({"email": user_login.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(user_login.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_obj = User(**parse_from_mongo(user))
    return Token(access_token=access_token, token_type="bearer", user=user_obj)

@api_router.get("/auth/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return current_user

# Food Item Routes
@api_router.post("/food-items", response_model=FoodItem)
async def create_food_item(food_item: FoodItemCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "donor":
        raise HTTPException(status_code=403, detail="Only donors can create food items")
    
    food_dict = food_item.dict()
    food_dict["donor_id"] = current_user.id
    food_obj = FoodItem(**food_dict)
    
    # Store in database
    food_data = prepare_for_mongo(food_obj.dict())
    await db.food_items.insert_one(food_data)
    
    return food_obj

@api_router.get("/food-items")
async def get_food_items(
    limit: int = 50,
    status: Optional[str] = None,
    food_type: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    # Auto-expire items before returning results
    await auto_expire_food_items()
    
    query = {}
    
    # Recipients can only see available items, donors can see their own items
    if current_user.role == "recipient":
        query["status"] = "available"
        # Only show items that haven't expired - this is now handled by auto_expire_food_items
        # but we keep this as a safety check
        current_time = datetime.now(timezone.utc)
        query["expiry_time"] = {"$gt": current_time.isoformat()}
    else:  # donor
        query["donor_id"] = current_user.id
    
    if status:
        query["status"] = status
    if food_type:
        query["food_type"] = food_type
    
    food_items = await db.food_items.find(query).limit(limit).to_list(length=None)
    
    # For recipients, enhance food items with donor rating information
    if current_user.role == "recipient":
        enhanced_items = []
        for item in food_items:
            enhanced_item = parse_from_mongo(item.copy())
            
            # Get donor information
            donor = await db.users.find_one({"id": item["donor_id"]})
            if donor:
                enhanced_item["donor_name"] = donor.get("full_name", "Unknown Donor")
                enhanced_item["donor_organization"] = donor.get("organization_name")
            
            # Get donor rating summary
            ratings = await db.ratings.find({"donor_id": item["donor_id"]}).to_list(length=None)
            if ratings:
                total_ratings = len(ratings)
                average_rating = sum(rating["rating"] for rating in ratings) / total_ratings
                enhanced_item["donor_average_rating"] = round(average_rating, 1)
                enhanced_item["donor_total_ratings"] = total_ratings
            else:
                enhanced_item["donor_average_rating"] = None
                enhanced_item["donor_total_ratings"] = 0
            
            enhanced_items.append(FoodItemWithRating(**enhanced_item))
        
        return enhanced_items
    else:
        # For donors, return regular food items
        return [FoodItem(**parse_from_mongo(item)) for item in food_items]

@api_router.get("/food-items/{item_id}", response_model=FoodItem)
async def get_food_item(item_id: str, current_user: User = Depends(get_current_user)):
    food_item = await db.food_items.find_one({"id": item_id})
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    return FoodItem(**parse_from_mongo(food_item))

@api_router.put("/food-items/{item_id}", response_model=FoodItem)
async def update_food_item(
    item_id: str, 
    food_update: FoodItemUpdate, 
    current_user: User = Depends(get_current_user)
):
    food_item = await db.food_items.find_one({"id": item_id})
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    if food_item["donor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own food items")
    
    # Check if food item has been claimed/sold/expired
    if food_item["status"] in ["claimed", "sold", "expired"]:
        if food_item["status"] == "expired":
            raise HTTPException(status_code=400, detail="Cannot edit expired food item")
        else:
            raise HTTPException(status_code=400, detail="Cannot edit food item that has been claimed or sold")
    
    # Update only provided fields - handle datetime fields carefully
    update_dict = food_update.dict(exclude_unset=True)
    update_data = {}
    
    # Copy all provided fields
    for key, value in update_dict.items():
        if key in ['expiry_time', 'pickup_window_start', 'pickup_window_end'] and value is not None:
            # Ensure datetime fields are timezone-aware
            if isinstance(value, datetime):
                if value.tzinfo is None:
                    value = value.replace(tzinfo=timezone.utc)
                update_data[key] = value
            else:
                # If it's a string, parse it properly
                try:
                    parsed_dt = datetime.fromisoformat(str(value).replace('Z', '+00:00'))
                    if parsed_dt.tzinfo is None:
                        parsed_dt = parsed_dt.replace(tzinfo=timezone.utc)
                    update_data[key] = parsed_dt
                except:
                    # If parsing fails, skip this field to avoid corruption
                    continue
        else:
            update_data[key] = value
    
    update_data["updated_at"] = datetime.now(timezone.utc)
    
    prepared_data = prepare_for_mongo(update_data)
    await db.food_items.update_one({"id": item_id}, {"$set": prepared_data})
    
    updated_item = await db.food_items.find_one({"id": item_id})
    return FoodItem(**parse_from_mongo(updated_item))

@api_router.delete("/food-items/{item_id}")
async def delete_food_item(item_id: str, current_user: User = Depends(get_current_user)):
    food_item = await db.food_items.find_one({"id": item_id})
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    if food_item["donor_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only delete your own food items")
    
    # Check if food item has been claimed/sold/expired
    if food_item["status"] in ["claimed", "sold", "expired"]:
        if food_item["status"] == "expired":
            raise HTTPException(status_code=400, detail="Cannot delete expired food item")
        else:
            raise HTTPException(status_code=400, detail="Cannot delete food item that has been claimed or sold")
    
    await db.food_items.delete_one({"id": item_id})
    return {"message": "Food item deleted successfully"}

# Order/Claim Routes
@api_router.post("/orders", response_model=Order)
async def create_order(order_create: OrderCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "recipient":
        raise HTTPException(status_code=403, detail="Only recipients can create orders")
    
    # Get food item
    food_item = await db.food_items.find_one({"id": order_create.food_item_id})
    if not food_item:
        raise HTTPException(status_code=404, detail="Food item not found")
    
    if food_item["status"] != "available":
        raise HTTPException(status_code=400, detail="Food item is not available")
    
    # Create order
    order_dict = order_create.dict()
    order_dict["recipient_id"] = current_user.id
    order_dict["donor_id"] = food_item["donor_id"]
    
    if food_item["food_type"] == "donation":
        order_dict["order_type"] = "claim"
        order_dict["total_amount"] = 0.0
        order_dict["payment_status"] = "completed"
    else:  # sale
        order_dict["order_type"] = "purchase"
        order_dict["total_amount"] = food_item.get("price", 0.0)
        order_dict["payment_status"] = "pending"
    
    order_obj = Order(**order_dict)
    
    # Store in database
    order_data = prepare_for_mongo(order_obj.dict())
    await db.orders.insert_one(order_data)
    
    # Update food item status
    new_status = "claimed" if food_item["food_type"] == "donation" else "sold"
    await db.food_items.update_one(
        {"id": order_create.food_item_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return order_obj

class OrderWithDetails(BaseModel):
    id: str
    food_item_id: str
    recipient_id: str
    donor_id: str
    order_type: Literal["claim", "purchase"]
    total_amount: float
    payment_status: Literal["pending", "completed", "failed"]
    delivery_method: Literal["pickup", "delivery"]
    delivery_address: Optional[str]
    status: Literal["pending", "confirmed", "completed", "cancelled"]
    created_at: datetime
    updated_at: datetime
    # Additional details
    food_title: Optional[str] = None
    food_quantity: Optional[str] = None
    pickup_address: Optional[str] = None
    donor_name: Optional[str] = None
    donor_organization: Optional[str] = None
    # Recipient tracking details (for donors)
    recipient_name: Optional[str] = None
    recipient_organization: Optional[str] = None
    recipient_phone: Optional[str] = None
    recipient_address: Optional[str] = None

@api_router.get("/orders", response_model=List[OrderWithDetails])
async def get_orders(current_user: User = Depends(get_current_user)):
    if current_user.role == "recipient":
        query = {"recipient_id": current_user.id}
    else:  # donor
        query = {"donor_id": current_user.id}
    
    orders = await db.orders.find(query).sort("created_at", -1).to_list(length=None)
    enriched_orders = []
    
    for order in orders:
        order_data = parse_from_mongo(order)
        
        # Get food item details
        food_item = await db.food_items.find_one({"id": order["food_item_id"]})
        if food_item:
            order_data["food_title"] = food_item.get("title")
            order_data["food_quantity"] = food_item.get("quantity")
            order_data["pickup_address"] = food_item.get("pickup_address")
        
        # Get donor details for recipients
        if current_user.role == "recipient":
            donor = await db.users.find_one({"id": order["donor_id"]})
            if donor:
                order_data["donor_name"] = donor.get("full_name")
                order_data["donor_organization"] = donor.get("organization_name")
        
        # Get recipient details for donors (tracking functionality)
        if current_user.role == "donor":
            recipient = await db.users.find_one({"id": order["recipient_id"]})
            if recipient:
                order_data["recipient_name"] = recipient.get("full_name")
                order_data["recipient_organization"] = recipient.get("organization_name")
                order_data["recipient_phone"] = recipient.get("phone")
                order_data["recipient_address"] = recipient.get("address")
        
        enriched_orders.append(OrderWithDetails(**order_data))
    
    return enriched_orders

# Mock Payment Route
@api_router.post("/orders/{order_id}/pay")
async def process_payment(order_id: str, current_user: User = Depends(get_current_user)):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["recipient_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only pay for your own orders")
    
    if order["payment_status"] == "completed":
        raise HTTPException(status_code=400, detail="Order already paid")
    
    # Mock payment processing - always succeeds
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "payment_status": "completed",
            "status": "confirmed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Payment processed successfully", "order_id": order_id}

# Order Confirmation Route - Recipients confirm pickup/completion
@api_router.post("/orders/{order_id}/confirm")
async def confirm_order_pickup(order_id: str, current_user: User = Depends(get_current_user)):
    """Recipients confirm that they have picked up/received the food"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["recipient_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only confirm your own orders")
    
    # Check if order is in a state that can be confirmed
    if order["status"] not in ["confirmed", "pending"]:
        raise HTTPException(status_code=400, detail=f"Order cannot be confirmed. Current status: {order['status']}")
    
    # For purchase orders, payment must be completed first
    if order["order_type"] == "purchase" and order["payment_status"] != "completed":
        raise HTTPException(status_code=400, detail="Payment must be completed before confirming pickup")
    
    # Update order to completed status
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "completed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Order confirmed successfully. Food pickup completed!", "order_id": order_id}

# Order Cancellation Route - Recipients can cancel their orders
@api_router.post("/orders/{order_id}/cancel")
async def cancel_order(order_id: str, current_user: User = Depends(get_current_user)):
    """Recipients can cancel their orders before payment (for purchases) or anytime (for donations)"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if order["recipient_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only cancel your own orders")
    
    # Check if order can be cancelled
    if order["status"] == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel completed orders")
    
    if order["status"] == "cancelled":
        raise HTTPException(status_code=400, detail="Order is already cancelled")
    
    # For purchase orders, can only cancel if payment is not completed
    if order["order_type"] == "purchase" and order["payment_status"] == "completed":
        raise HTTPException(status_code=400, detail="Cannot cancel paid orders")
    
    # Update order status to cancelled
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {
            "status": "cancelled",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    # Update food item status back to available
    await db.food_items.update_one(
        {"id": order["food_item_id"]},
        {"$set": {
            "status": "available",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {"message": "Order cancelled successfully", "order_id": order_id}

# Recipient Tracking Routes (for donors)
class RecipientTrackingInfo(BaseModel):
    recipient_id: str
    recipient_name: str
    recipient_organization: Optional[str]
    recipient_phone: Optional[str]
    recipient_address: Optional[str]
    total_claims: int
    total_purchases: int
    total_spent: float
    total_orders: int  # Total number of orders (all statuses)
    recent_orders: List[OrderWithDetails]
    first_order_date: datetime
    last_order_date: datetime

# Rating Models
class Rating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    order_id: str
    donor_id: str
    recipient_id: str
    rating: int = Field(ge=1, le=5)  # 1-5 star rating
    feedback: Optional[str] = Field(max_length=1000)
    food_title: Optional[str]  # For easy reference
    recipient_name: Optional[str] = None  # Added for display purposes
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class RatingCreate(BaseModel):
    order_id: str
    rating: int = Field(ge=1, le=5)
    feedback: Optional[str] = Field(max_length=1000)

class RatingUpdate(BaseModel):
    rating: Optional[int] = Field(ge=1, le=5)
    feedback: Optional[str] = Field(max_length=1000)

class DonorRatingSummary(BaseModel):
    donor_id: str
    average_rating: float
    total_ratings: int
    rating_distribution: dict  # {"5": count, "4": count, etc.}
    all_ratings: List[Rating]  # All ratings, not just recent

@api_router.get("/donors/recipients", response_model=List[RecipientTrackingInfo])
async def get_recipient_tracking(current_user: User = Depends(get_current_user)):
    """Get all recipients who have COMPLETED claims/purchases from this donor with tracking info"""
    if current_user.role != "donor":
        raise HTTPException(status_code=403, detail="Only donors can access recipient tracking")
    
    # Get all orders for this donor
    orders = await db.orders.find({"donor_id": current_user.id}).to_list(length=None)
    
    # Group orders by recipient
    recipients_data = {}
    
    for order in orders:
        recipient_id = order["recipient_id"]
        if recipient_id not in recipients_data:
            # Get recipient details
            recipient = await db.users.find_one({"id": recipient_id})
            if not recipient:
                continue  # Skip if recipient not found
            
            recipients_data[recipient_id] = {
                "recipient": recipient,
                "orders": [],
                "total_claims": 0,
                "total_purchases": 0,
                "total_spent": 0
            }
        
        recipients_data[recipient_id]["orders"].append(order)
        
        # Count claims vs purchases and calculate totals - ONLY for completed orders
        if order["status"] == "completed":  # Only count completed orders
            if order["order_type"] == "claim":
                recipients_data[recipient_id]["total_claims"] += 1
            else:  # purchase
                recipients_data[recipient_id]["total_purchases"] += 1
                # Only add to total_spent if payment is also completed
                if order.get("payment_status") == "completed":
                    recipients_data[recipient_id]["total_spent"] += order.get("total_amount", 0)
    
    # Build response
    tracking_info = []
    for recipient_id, data in recipients_data.items():
        recipient = data["recipient"]
        orders_list = data["orders"]
        
        # Get recent orders (last 5)
        recent_orders_data = sorted(orders_list, key=lambda x: x["created_at"], reverse=True)[:5]
        recent_orders = []
        
        for order in recent_orders_data:
            order_data = parse_from_mongo(order.copy())
            
            # Get food item details
            food_item = await db.food_items.find_one({"id": order["food_item_id"]})
            if food_item:
                order_data["food_title"] = food_item.get("title")
                order_data["food_quantity"] = food_item.get("quantity")
                order_data["pickup_address"] = food_item.get("pickup_address")
            
            recent_orders.append(OrderWithDetails(**order_data))
        
        # Calculate dates
        order_dates = [parse_from_mongo({"date": order["created_at"]})["date"] for order in orders_list]
        
        # Handle edge case where orders_list might be empty
        if not order_dates:
            continue
            
        tracking_info.append(RecipientTrackingInfo(
            recipient_id=recipient_id,
            recipient_name=recipient.get("full_name", "Unknown"),
            recipient_organization=recipient.get("organization_name"),
            recipient_phone=recipient.get("phone"),
            recipient_address=recipient.get("address"),
            total_claims=data["total_claims"],
            total_purchases=data["total_purchases"],
            total_spent=data["total_spent"],
            total_orders=len(orders_list),  # Total number of orders
            recent_orders=recent_orders,
            first_order_date=min(order_dates),
            last_order_date=max(order_dates)
        ))
    
    # Sort by last order date (most recent first)
    tracking_info.sort(key=lambda x: x.last_order_date, reverse=True)
    
    return tracking_info

# Rating Routes
@api_router.post("/ratings", response_model=Rating)
async def create_rating(rating_create: RatingCreate, current_user: User = Depends(get_current_user)):
    """Recipients can create ratings for completed orders"""
    if current_user.role != "recipient":
        raise HTTPException(status_code=403, detail="Only recipients can create ratings")
    
    # Get the order to validate
    order = await db.orders.find_one({"id": rating_create.order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # Verify this recipient owns the order
    if order["recipient_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only rate your own orders")
    
    # Only allow rating completed orders
    if order["status"] != "completed":
        raise HTTPException(status_code=400, detail="You can only rate completed orders")
    
    # Check if rating already exists
    existing_rating = await db.ratings.find_one({"order_id": rating_create.order_id})
    if existing_rating:
        raise HTTPException(status_code=400, detail="This order has already been rated")
    
    # Get food item details for reference
    food_item = await db.food_items.find_one({"id": order["food_item_id"]})
    food_title = food_item.get("title", "Food Item") if food_item else "Food Item"
    
    # Create rating
    rating_dict = rating_create.dict()
    rating_dict["donor_id"] = order["donor_id"]
    rating_dict["recipient_id"] = current_user.id
    rating_dict["food_title"] = food_title
    
    rating_obj = Rating(**rating_dict)
    
    # Store in database
    rating_data = prepare_for_mongo(rating_obj.dict())
    await db.ratings.insert_one(rating_data)
    
    return rating_obj

@api_router.get("/ratings", response_model=List[Rating])
async def get_ratings(
    donor_id: Optional[str] = None,
    recipient_id: Optional[str] = None,
    order_id: Optional[str] = None,
    limit: int = 50,
    current_user: User = Depends(get_current_user)
):
    """Get ratings with optional filters"""
    query = {}
    
    # Users can only see ratings they're involved in
    if current_user.role == "donor":
        query["donor_id"] = current_user.id
    elif current_user.role == "recipient":
        query["recipient_id"] = current_user.id
    
    # Apply additional filters
    if donor_id and current_user.role != "recipient":
        query["donor_id"] = donor_id
    if recipient_id and current_user.role != "donor":
        query["recipient_id"] = recipient_id
    if order_id:
        query["order_id"] = order_id
    
    ratings = await db.ratings.find(query).limit(limit).sort("created_at", -1).to_list(length=None)
    return [Rating(**parse_from_mongo(rating)) for rating in ratings]

@api_router.get("/ratings/{rating_id}", response_model=Rating)
async def get_rating(rating_id: str, current_user: User = Depends(get_current_user)):
    """Get a specific rating"""
    rating = await db.ratings.find_one({"id": rating_id})
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    # Verify user has access to this rating
    if (current_user.role == "donor" and rating["donor_id"] != current_user.id) or \
       (current_user.role == "recipient" and rating["recipient_id"] != current_user.id):
        raise HTTPException(status_code=403, detail="You don't have access to this rating")
    
    return Rating(**parse_from_mongo(rating))

@api_router.put("/ratings/{rating_id}", response_model=Rating)
async def update_rating(
    rating_id: str, 
    rating_update: RatingUpdate, 
    current_user: User = Depends(get_current_user)
):
    """Recipients can update their ratings"""
    if current_user.role != "recipient":
        raise HTTPException(status_code=403, detail="Only recipients can update ratings")
    
    rating = await db.ratings.find_one({"id": rating_id})
    if not rating:
        raise HTTPException(status_code=404, detail="Rating not found")
    
    if rating["recipient_id"] != current_user.id:
        raise HTTPException(status_code=403, detail="You can only update your own ratings")
    
    # Update only provided fields
    update_dict = rating_update.dict(exclude_unset=True)
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    prepared_data = prepare_for_mongo(update_dict)
    await db.ratings.update_one({"id": rating_id}, {"$set": prepared_data})
    
    updated_rating = await db.ratings.find_one({"id": rating_id})
    return Rating(**parse_from_mongo(updated_rating))

@api_router.get("/donors/{donor_id}/rating-summary", response_model=DonorRatingSummary)
async def get_donor_rating_summary(donor_id: str, current_user: User = Depends(get_current_user)):
    """Get rating summary for a donor"""
    # Get all ratings for this donor
    ratings = await db.ratings.find({"donor_id": donor_id}).to_list(length=None)
    
    if not ratings:
        return DonorRatingSummary(
            donor_id=donor_id,
            average_rating=0.0,
            total_ratings=0,
            rating_distribution={"5": 0, "4": 0, "3": 0, "2": 0, "1": 0},
            all_ratings=[]
        )
    
    # Calculate statistics
    total_ratings = len(ratings)
    average_rating = sum(rating["rating"] for rating in ratings) / total_ratings
    
    # Calculate distribution
    distribution = {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}
    for rating in ratings:
        distribution[str(rating["rating"])] += 1
    
    # Get all ratings (sorted by most recent first) and enhance with recipient info
    all_ratings_data = sorted(ratings, key=lambda x: x["created_at"], reverse=True)
    all_ratings = []
    
    for rating_data in all_ratings_data:
        rating_dict = parse_from_mongo(rating_data)
        
        # Get recipient information
        recipient = await db.users.find_one({"id": rating_data["recipient_id"]})
        if recipient:
            rating_dict["recipient_name"] = recipient.get("full_name", "Anonymous")
        else:
            rating_dict["recipient_name"] = "Anonymous"
        
        all_ratings.append(Rating(**rating_dict))
    
    return DonorRatingSummary(
        donor_id=donor_id,
        average_rating=round(average_rating, 1),
        total_ratings=total_ratings,
        rating_distribution=distribution,
        all_ratings=all_ratings
    )

@api_router.get("/donors/recipients/{recipient_id}", response_model=RecipientTrackingInfo)
async def get_recipient_details(recipient_id: str, current_user: User = Depends(get_current_user)):
    """Get detailed tracking info for a specific recipient"""
    if current_user.role != "donor":
        raise HTTPException(status_code=403, detail="Only donors can access recipient tracking")
    
    # Verify the recipient has orders with this donor
    orders = await db.orders.find({
        "donor_id": current_user.id,
        "recipient_id": recipient_id
    }).to_list(length=None)
    
    if not orders:
        raise HTTPException(status_code=404, detail="No orders found for this recipient")
    
    # Get recipient details
    recipient = await db.users.find_one({"id": recipient_id})
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    
    # Process all orders - ONLY count completed orders
    total_claims = sum(1 for order in orders 
                      if order["order_type"] == "claim" and order["status"] == "completed")
    total_purchases = sum(1 for order in orders 
                         if order["order_type"] == "purchase" and order["status"] == "completed")
    # Only count completed purchases with completed payments
    total_spent = sum(
        order.get("total_amount", 0) 
        for order in orders 
        if (order["order_type"] == "purchase" and 
            order["status"] == "completed" and 
            order.get("payment_status") == "completed")
    )
    
    # Get all orders with details
    detailed_orders = []
    for order in orders:
        order_data = parse_from_mongo(order.copy())
        
        # Get food item details
        food_item = await db.food_items.find_one({"id": order["food_item_id"]})
        if food_item:
            order_data["food_title"] = food_item.get("title")
            order_data["food_quantity"] = food_item.get("quantity")
            order_data["pickup_address"] = food_item.get("pickup_address")
        
        detailed_orders.append(OrderWithDetails(**order_data))
    
    # Sort orders by date (most recent first)
    detailed_orders.sort(key=lambda x: x.created_at, reverse=True)
    
    # Calculate dates
    order_dates = [parse_from_mongo({"date": order["created_at"]})["date"] for order in orders]
    
    return RecipientTrackingInfo(
        recipient_id=recipient_id,
        recipient_name=recipient.get("full_name", "Unknown"),
        recipient_organization=recipient.get("organization_name"),
        recipient_phone=recipient.get("phone"),
        recipient_address=recipient.get("address"),
        total_claims=total_claims,
        total_purchases=total_purchases,
        total_spent=total_spent,
        total_orders=len(orders),  # Total number of orders
        recent_orders=detailed_orders,  # Return all orders, not just recent
        first_order_date=min(order_dates),
        last_order_date=max(order_dates)
    )

# Chat Routes
@api_router.get("/chat/contacts", response_model=List[ChatContact])
async def get_chat_contacts(current_user: User = Depends(get_current_user)):
    """Get all users this user can chat with (based on completed orders)"""
    
    # Find all orders involving this user (allow chat after any order is created)
    if current_user.role == "donor":
        orders = await db.orders.find({
            "donor_id": current_user.id,
            "status": {"$in": ["pending", "confirmed", "completed"]}
        }).to_list(length=None)
        contact_ids = list(set(order["recipient_id"] for order in orders))
    else:  # recipient
        orders = await db.orders.find({
            "recipient_id": current_user.id,
            "status": {"$in": ["pending", "confirmed", "completed"]}
        }).to_list(length=None)
        contact_ids = list(set(order["donor_id"] for order in orders))
    
    if not contact_ids:
        return []
    
    # Get contact user details
    contacts = []
    for contact_id in contact_ids:
        contact_user = await db.users.find_one({"id": contact_id})
        if not contact_user:
            continue
        
        # Get last message between users
        last_message_doc = await db.messages.find_one(
            {
                "$or": [
                    {"sender_id": current_user.id, "receiver_id": contact_id},
                    {"sender_id": contact_id, "receiver_id": current_user.id}
                ]
            },
            sort=[("timestamp", -1)]
        )
        
        # Count unread messages from this contact
        unread_count = await db.messages.count_documents({
            "sender_id": contact_id,
            "receiver_id": current_user.id,
            "is_read": False
        })
        
        contact = ChatContact(
            user_id=contact_id,
            user_name=contact_user.get("full_name", "Unknown"),
            user_organization=contact_user.get("organization_name"),
            user_role=contact_user.get("role"),
            last_message=last_message_doc.get("content") if last_message_doc else None,
            last_message_time=parse_from_mongo({"timestamp": last_message_doc["timestamp"]})["timestamp"] if last_message_doc else None,
            unread_count=unread_count
        )
        contacts.append(contact)
    
    # Sort by last message time (most recent first)
    contacts.sort(key=lambda x: x.last_message_time or datetime.min.replace(tzinfo=timezone.utc), reverse=True)
    
    return contacts

@api_router.get("/chat/{contact_id}", response_model=ChatConversation)
async def get_chat_conversation(contact_id: str, current_user: User = Depends(get_current_user)):
    """Get conversation with a specific contact"""
    
    # Verify the users can chat (have any orders together)
    if current_user.role == "donor":
        order_exists = await db.orders.find_one({
            "donor_id": current_user.id,
            "recipient_id": contact_id,
            "status": {"$in": ["pending", "confirmed", "completed"]}
        })
    else:  # recipient
        order_exists = await db.orders.find_one({
            "recipient_id": current_user.id,
            "donor_id": contact_id,
            "status": {"$in": ["pending", "confirmed", "completed"]}
        })
    
    if not order_exists:
        raise HTTPException(status_code=403, detail="You can only chat with users you have orders with")
    
    # Get contact user details
    contact_user = await db.users.find_one({"id": contact_id})
    if not contact_user:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    # Get messages between users
    messages = await db.messages.find({
        "$or": [
            {"sender_id": current_user.id, "receiver_id": contact_id},
            {"sender_id": contact_id, "receiver_id": current_user.id}
        ]
    }).sort("timestamp", 1).to_list(length=None)
    
    # Mark messages from contact as read
    await db.messages.update_many(
        {
            "sender_id": contact_id,
            "receiver_id": current_user.id,
            "is_read": False
        },
        {"$set": {"is_read": True}}
    )
    
    # Parse messages
    parsed_messages = [Message(**parse_from_mongo(msg)) for msg in messages]
    
    contact = ChatContact(
        user_id=contact_id,
        user_name=contact_user.get("full_name", "Unknown"),
        user_organization=contact_user.get("organization_name"),
        user_role=contact_user.get("role"),
        unread_count=0  # Now 0 since we marked as read
    )
    
    return ChatConversation(contact=contact, messages=parsed_messages)

@api_router.post("/chat/send", response_model=Message)
async def send_message(message_data: MessageCreate, current_user: User = Depends(get_current_user)):
    """Send a message to another user"""
    
    # Verify the users can chat (have any orders together)
    if current_user.role == "donor":
        order_exists = await db.orders.find_one({
            "donor_id": current_user.id,
            "recipient_id": message_data.receiver_id,
            "status": {"$in": ["pending", "confirmed", "completed"]}
        })
    else:  # recipient
        order_exists = await db.orders.find_one({
            "recipient_id": current_user.id,
            "donor_id": message_data.receiver_id,
            "status": {"$in": ["pending", "confirmed", "completed"]}
        })
    
    if not order_exists:
        raise HTTPException(status_code=403, detail="You can only chat with users you have orders with")
    
    # Verify receiver exists
    receiver = await db.users.find_one({"id": message_data.receiver_id})
    if not receiver:
        raise HTTPException(status_code=404, detail="Receiver not found")
    
    # Create message
    message = Message(
        sender_id=current_user.id,
        receiver_id=message_data.receiver_id,
        content=message_data.content.strip()
    )
    
    if not message.content:
        raise HTTPException(status_code=400, detail="Message content cannot be empty")
    
    # Store in database
    message_data_dict = prepare_for_mongo(message.dict())
    await db.messages.insert_one(message_data_dict)
    
    return message

@api_router.get("/chat/unread-count")
async def get_unread_message_count(current_user: User = Depends(get_current_user)):
    """Get total unread message count for the user"""
    
    try:
        unread_count = await db.messages.count_documents({
            "receiver_id": current_user.id,
            "is_read": False
        })
        
        return {"unread_count": unread_count}
    except Exception as e:
        # If messages collection doesn't exist or any other error, return 0
        return {"unread_count": 0}


# Dashboard Routes
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    if current_user.role == "donor":
        # Donor stats
        active_listings = await db.food_items.count_documents({
            "donor_id": current_user.id,
            "status": "available"
        })
        
        # Count completed donations (claimed items with completed orders)
        total_donations = await db.orders.count_documents({
            "donor_id": current_user.id,
            "order_type": "claim",
            "status": "completed"  # Only count completed donations
        })
        
        # Count completed sales (sold items with completed orders)
        total_sales = await db.orders.count_documents({
            "donor_id": current_user.id,
            "order_type": "purchase",
            "status": "completed"  # Only count completed sales
        })
        
        return {
            "role": "donor",
            "active_listings": active_listings,
            "total_donations": total_donations,
            "total_sales": total_sales
        }
    else:  # recipient
        # Recipient stats - only count COMPLETED orders
        claimed_items = await db.orders.count_documents({
            "recipient_id": current_user.id,
            "order_type": "claim",
            "status": "completed"  # Only count completed claims
        })
        purchased_items = await db.orders.count_documents({
            "recipient_id": current_user.id,
            "order_type": "purchase",
            "status": "completed"  # Only count completed purchases
        })
        total_saved = await db.orders.aggregate([
            {"$match": {
                "recipient_id": current_user.id, 
                "order_type": "purchase",
                "status": "completed",  # Only count completed orders
                "payment_status": "completed"  # AND completed payments
            }},
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
        ]).to_list(1)
        
        return {
            "role": "recipient",
            "claimed_items": claimed_items,
            "purchased_items": purchased_items,
            "total_spent": total_saved[0]["total"] if total_saved else 0
        }
# Configure CORS before including router
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "*"],
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Add root route for health check
@app.get("/")
async def root():
    return {
        "message": "SaverFwd API is running!",
        "status": "healthy",
        "api_docs": "/docs",
        "api_endpoints": "/api"
    }

# Add health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "SaverFwd Backend"}

# Include the router in the main app
app.include_router(api_router)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Background task for auto-expiring food items
async def periodic_expire_task():
    """Run auto-expire task every 5 minutes"""
    while True:
        try:
            expired_count = await auto_expire_food_items()
            if expired_count > 0:
                print(f"Auto-expired {expired_count} food items")
        except Exception as e:
            print(f"Error in periodic expire task: {e}")
        
        # Wait 5 minutes before next check
        await asyncio.sleep(300)  # 5 minutes

@app.on_event("startup")
async def startup_event():
    """Start background tasks"""
    asyncio.create_task(periodic_expire_task())
    print("Background tasks started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# Main entry point
if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment (Render provides this) or default to 8000
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
