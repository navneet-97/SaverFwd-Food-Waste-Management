import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../App';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { 
  Heart, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

const Landing = () => {
  const { user } = useAuth();
  
  // Preload Login and Register components when Landing loads
  useEffect(() => {
    // Preload critical authentication components
    const preloadAuthComponents = () => {
      import('./Login').catch(err => console.warn('Login preload failed:', err));
      import('./Register').catch(err => console.warn('Register preload failed:', err));
    };
    
    // Delay preload to not interfere with Landing component rendering
    const timer = setTimeout(preloadAuthComponents, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50"></div>
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-4 rounded-2xl shadow-lg">
                <Heart className="h-12 w-12 text-white" />
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Reduce Food Waste,
              <span className="text-gradient block">Feed Communities</span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Connect restaurants and hotels with NGOs and communities to transform food waste into hope. 
              Donate surplus food or sell at low cost to make a real impact.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!user ? (
                <>
                  <Link to="/register">
                    <Button size="lg" className="btn-primary gap-2 px-8 py-4 h-auto">
                      Get Started
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link to="/login">
                    <Button variant="outline" size="lg" className="px-8 py-4 h-auto">
                      Sign In
                    </Button>
                  </Link>
                </>
              ) : (
                <Link to="/dashboard">
                  <Button size="lg" className="btn-primary gap-2 px-8 py-4 h-auto">
                    Go to Dashboard
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"></div>
        </div>
        <div className="absolute top-40 right-20 opacity-20">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600"></div>
        </div>
        <div className="absolute bottom-20 left-1/4 opacity-20">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600"></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              How SaverFwd Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple steps to reduce food waste and help communities in need
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* For Donors */}
            <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
              <CardContent className="p-8">
                <div className="bg-emerald-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">List Your Food</h3>
                <p className="text-gray-600 mb-4">
                  Restaurants and hotels can easily list surplus food for donation or low-cost sale.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Add food details & location
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Choose donation or sale
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    Set pickup windows
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* For Recipients */}
            <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
              <CardContent className="p-8">
                <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Find & Claim Food</h3>
                <p className="text-gray-600 mb-4">
                  NGOs and individuals can discover available food near their location.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Browse nearby food listings
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Claim free donations
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                    Purchase at low cost
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Location Based */}
            <Card className="card-hover border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100">
              <CardContent className="p-8">
                <div className="bg-purple-500 w-12 h-12 rounded-lg flex items-center justify-center mb-6">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Location Based</h3>
                <p className="text-gray-600 mb-4">
                  Smart location matching ensures efficient food distribution in your area.
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    Map-based discovery
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    Distance filtering
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    Real-time updates
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Why Choose SaverFwd?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Fast & Easy</h3>
              <p className="text-gray-600">Quick food listing and claiming process</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Safe & Secure</h3>
              <p className="text-gray-600">Verified users and secure transactions</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-time</h3>
              <p className="text-gray-600">Live updates on food availability</p>
            </div>

            <div className="text-center">
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Impact Tracking</h3>
              <p className="text-gray-600">See your contribution to the community</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-emerald-100 mb-8">
            Join thousands of restaurants, NGOs, and individuals fighting food waste together.
          </p>
          
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="px-8 py-4 h-auto">
                  Start Today
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 py-4 h-auto border-white text-white hover:bg-white hover:text-emerald-700">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;