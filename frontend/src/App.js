import React, { useState, useEffect, Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Components - Load immediately
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";

// Lazy load heavy components for better performance
const Login = lazy(() => import("./components/Login"));
const Register = lazy(() => import("./components/Register"));
const DonorDashboard = lazy(() => import("./components/DonorDashboard"));
const RecipientDashboard = lazy(() => import("./components/RecipientDashboard"));
const FoodBrowser = lazy(() => import("./components/FoodBrowser"));
const ChatWidget = lazy(() => import("./components/ChatWidget"));

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Create axios instance with interceptor for auth
const api = axios.create({
  baseURL: API,
});

// Auth Context
const AuthContext = React.createContext();

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Set up axios interceptor
  useEffect(() => {
    api.interceptors.request.use((config) => {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          toast.error("Session expired. Please login again.", { duration: 2000 });
        }
        return Promise.reject(error);
      }
    );
  }, [token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await api.get('/auth/me');
          setUser(response.data);
        } catch (error) {
          console.error('Auth check failed:', error);
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: userData } = response.data;
      
      setToken(access_token);
      setUser(userData);
      localStorage.setItem('token', access_token);
      
      toast.success(`Welcome back, ${userData.full_name}!`, { duration: 2000 });
      return { success: true, user: userData };
    } catch (error) {
      const message = error.response?.data?.detail || 'Login failed';
      toast.error(message, { duration: 2000 });
      return { success: false, error: message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      const { access_token, user: newUser } = response.data;
      
      setToken(access_token);
      setUser(newUser);
      localStorage.setItem('token', access_token);
      
      toast.success(`Welcome to SaverFwd, ${newUser.full_name}!`, { duration: 2000 });
      return { success: true, user: newUser };
    } catch (error) {
      const message = error.response?.data?.detail || 'Registration failed';
      toast.error(message, { duration: 2000 });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    toast.success("Logged out successfully", { duration: 2000 });
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    api
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Loading Component
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
  </div>
);

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/browse" element={
                <ProtectedRoute requiredRole="recipient">
                  <FoodBrowser />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } />
            </Routes>
          </Suspense>
          <ConditionalChatWidget />
        </BrowserRouter>
        <Toaster position="top-right" duration={2000} />
      </AuthProvider>
    </div>
  );
}

// Conditional ChatWidget Component
const ConditionalChatWidget = () => {
  const location = useLocation();
  
  // Don't show ChatWidget on home page
  if (location.pathname === '/') {
    return null;
  }
  
  return <ChatWidget />;
};

// Dashboard Router Component
const DashboardRouter = () => {
  const { user } = useAuth();
  
  if (user?.role === 'donor') {
    return <DonorDashboard />;
  } else if (user?.role === 'recipient') {
    return <RecipientDashboard />;
  }
  
  return <Navigate to="/" replace />;
};

export default App;