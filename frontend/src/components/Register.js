import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { Heart, Mail, Lock, User, Phone, MapPin, Building, Eye, EyeOff } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: '',
    phone: '',
    address: '',
    organization_name: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    const userData = {
      email: formData.email,
      username: formData.username,
      password: formData.password,
      full_name: formData.full_name,
      role: formData.role,
      phone: formData.phone || null,
      address: formData.address || null,
      organization_name: formData.organization_name || null
    };

    const result = await register(userData);
    
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
          <h2 className="text-3xl font-bold text-gray-900">Join SaverFwd</h2>
          <p className="mt-2 text-sm text-gray-600">
            Create your account to start reducing food waste
          </p>
        </div>

        {/* Registration Form */}
        <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center text-gray-900">
              Sign Up
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                {/* Role Selection */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">I am a</Label>
                  <Select onValueChange={(value) => handleChange('role', value)} required>
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="donor">Donor (Restaurant/Hotel)</SelectItem>
                      <SelectItem value="recipient">Recipient (NGO/Individual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      required
                      className="pl-10 pr-4 py-3 w-full"
                      placeholder="Enter your email"
                    />
                    <Mail className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Username */}
                <div>
                  <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                    Username
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => handleChange('username', e.target.value)}
                      required
                      className="pl-10 pr-4 py-3 w-full"
                      placeholder="Choose a username"
                    />
                    <User className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">
                    Full Name
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => handleChange('full_name', e.target.value)}
                      required
                      className="pl-10 pr-4 py-3 w-full"
                      placeholder="Enter your full name"
                    />
                    <User className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Organization Name */}
                <div>
                  <Label htmlFor="organization_name" className="text-sm font-medium text-gray-700">
                    {formData.role === 'donor' ? 'Restaurant/Hotel Name' : 'Organization Name'} (Optional)
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="organization_name"
                      value={formData.organization_name}
                      onChange={(e) => handleChange('organization_name', e.target.value)}
                      className="pl-10 pr-4 py-3 w-full"
                      placeholder={formData.role === 'donor' ? 'Restaurant/Hotel name' : 'NGO or organization name'}
                    />
                    <Building className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                    Phone Number (Optional)
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      className="pl-10 pr-4 py-3 w-full"
                      placeholder="Enter your phone number"
                    />
                    <Phone className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Address (Optional)
                  </Label>
                  <div className="mt-1 relative">
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      className="pl-10 pr-4 py-3 w-full min-h-20"
                      placeholder="Enter your address"
                    />
                    <MapPin className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                    Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      required
                      className="pl-10 pr-12 py-3 w-full"
                      placeholder="Create a password"
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

                {/* Confirm Password */}
                <div>
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                    Confirm Password
                  </Label>
                  <div className="mt-1 relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      required
                      className="pl-10 pr-12 py-3 w-full"
                      placeholder="Confirm your password"
                    />
                    <Lock className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                    Creating account...
                  </div>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Already have an account?</span>
                </div>
              </div>

              <div className="mt-6">
                <Link to="/login">
                  <Button
                    variant="outline"
                    className="w-full py-3 px-4 border-2 border-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors duration-200"
                  >
                    Sign In
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;