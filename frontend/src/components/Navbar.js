import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { 
  Heart, 
  LogOut, 
  User, 
  Home, 
  Search,
  LayoutDashboard 
} from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Preload heavy components when user is logged in
  useEffect(() => {
    if (user) {
      const preloadUserComponents = () => {
        // Preload dashboard components based on user role
        if (user.role === 'donor') {
          import('./DonorDashboard').catch(err => console.warn('DonorDashboard preload failed:', err));
        } else if (user.role === 'recipient') {
          import('./RecipientDashboard').catch(err => console.warn('RecipientDashboard preload failed:', err));
          import('./FoodBrowser').catch(err => console.warn('FoodBrowser preload failed:', err));
        }
      };
      
      // Preload after a short delay to not interfere with current page rendering
      const timer = setTimeout(preloadUserComponents, 2000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-2 rounded-lg group-hover:shadow-lg transition-all duration-200">
              <Heart className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gradient">SaverFwd</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/">
              <Button 
                variant={isActive('/') ? "secondary" : "ghost"} 
                size="sm" 
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>

            {user && user.role === 'recipient' && (
              <Link to="/browse">
                <Button 
                  variant={isActive('/browse') ? "secondary" : "ghost"} 
                  size="sm" 
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Browse Food
                </Button>
              </Link>
            )}

            {user && (
              <Link to="/dashboard">
                <Button 
                  variant={isActive('/dashboard') ? "secondary" : "ghost"} 
                  size="sm" 
                  className="gap-2"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Button>
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                  </div>
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-white" />
                  </div>
                </div>
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  size="sm"
                  className="gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="btn-primary">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {user && (
        <div className="md:hidden bg-white/90 backdrop-blur-sm border-t border-gray-200/50">
          <div className="px-4 py-2 flex justify-around">
            <Link to="/">
              <Button 
                variant={isActive('/') ? "secondary" : "ghost"} 
                size="sm" 
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            </Link>

            {user.role === 'recipient' && (
              <Link to="/browse">
                <Button 
                  variant={isActive('/browse') ? "secondary" : "ghost"} 
                  size="sm" 
                  className="gap-2"
                >
                  <Search className="h-4 w-4" />
                  Browse
                </Button>
              </Link>
            )}

            <Link to="/dashboard">
              <Button 
                variant={isActive('/dashboard') ? "secondary" : "ghost"} 
                size="sm" 
                className="gap-2"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;