import React, { useState, useEffect, Suspense, lazy } from "react";
import "./App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Toaster } from "./components/ui/sonner";
import { toast } from "sonner";

// Components - Load immediately
import Navbar from "./components/Navbar";
import Landing from "./components/Landing";

// Retry function for failed lazy imports
const retryLazyImport = (importFn, retries = 3) => {
  return new Promise((resolve, reject) => {
    importFn()
      .then(resolve)
      .catch((error) => {
        console.warn(`Lazy import failed, retries left: ${retries}`, error);
        if (retries > 0) {
          setTimeout(() => {
            retryLazyImport(importFn, retries - 1).then(resolve, reject);
          }, 1000);
        } else {
          reject(error);
        }
      });
  });
};

// Lazy load heavy components with retry logic
const Login = lazy(() => retryLazyImport(() => import("./components/Login")));
const Register = lazy(() => retryLazyImport(() => import("./components/Register")));
const DonorDashboard = lazy(() => retryLazyImport(() => import("./components/DonorDashboard")));
const RecipientDashboard = lazy(() => retryLazyImport(() => import("./components/RecipientDashboard")));
const FoodBrowser = lazy(() => retryLazyImport(() => import("./components/FoodBrowser")));
const ChatWidget = lazy(() => retryLazyImport(() => import("./components/ChatWidget")));

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

// Loading Component with timeout
const LoadingSpinner = () => {
  const [showSlowWarning, setShowSlowWarning] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowWarning(true);
    }, 5000); // Show warning after 5 seconds
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600 mb-2">Loading...</p>
        {showSlowWarning && (
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-2">Taking longer than usual?</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-emerald-600 hover:text-emerald-700 text-sm underline"
            >
              Try refreshing the page
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Error Boundary for lazy loading failures
class LazyErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ 
      hasError: false, 
      retryCount: this.state.retryCount + 1 
    });
    // Force reload the page if multiple retries fail
    if (this.state.retryCount >= 2) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Failed to load the page. Please try again.</p>
            <button 
              onClick={this.handleRetry}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md"
            >
              {this.state.retryCount >= 2 ? 'Reload Page' : 'Try Again'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Main App Component
function App() {
  return (
    <div className="App">
      <AuthProvider>
        <BrowserRouter>
          <Navbar />
          <LazyErrorBoundary>
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
          </LazyErrorBoundary>
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