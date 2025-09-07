import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Heart, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(email, password);
    
    if (result.success) {
      // Force navigation based on user role
      if (result.user?.role === 'recipient') {
        navigate('/browse');
      } else {
        navigate('/dashboard');
      }
      // Force page reload to ensure proper state
      setTimeout(() => window.location.reload(), 100);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-2xl shadow-lg">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your SaverFwd account
          </p>
        </div>

        {/* Login Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Sign In
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-10 pr-4 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your email"
                    />
                    <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-10 pr-12 py-3 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                      placeholder="Enter your password"
                    />
                    <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 btn-primary hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="loading-spinner mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Don't have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/register">
                  <Button
                    variant="outline"
                    className="w-full py-3 px-4 border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors duration-200"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card className="border-0 shadow-lg bg-blue-50/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Demo Accounts (for testing):</h3>
            <div className="space-y-2 text-xs text-gray-600">
              <p><strong>Donor:</strong> donor@example.com / password123</p>
              <p><strong>Recipient:</strong> recipient@example.com / password123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;