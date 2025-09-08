import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { useSmartRefresh } from '../hooks/useSmartRefresh';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { toast } from 'sonner';
import ChatWidget from './ChatWidget';
import { 
  Search, 
  Heart, 
  DollarSign,
  ShoppingCart,
  Clock,
  MapPin,
  Users,
  TrendingDown,
  Package,
  CheckCircle,
  X,
  Star
} from 'lucide-react';
import StarRating from './ui/star-rating';
import RatingForm from './ui/rating-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Link } from 'react-router-dom';

const RecipientDashboard = () => {
  const { api, user } = useAuth();
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrderForRating, setSelectedOrderForRating] = useState(null);
  
  // Smart refresh for stats
  const {
    data: stats,
    loading: statsLoading,
    refresh: refreshStats
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    }, [api]),
    interval: 30000,
    cacheKey: `recipient-stats-${user?.id}`,
    onDataChange: (newStats, oldStats) => {
      if (oldStats && !statsLoading) {
        if (newStats.claimed_items > oldStats.claimed_items) {
          toast.success('🎉 New item claimed!', { duration: 2000 });
        }
        if (newStats.purchased_items > oldStats.purchased_items) {
          toast.success('🛜 New purchase completed!', { duration: 2000 });
        }
      }
    }
  });
  
  // Smart refresh for orders
  const {
    data: orders,
    loading: ordersLoading,
    refresh: refreshOrders
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/orders');
      return response.data;
    }, [api]),
    interval: 10000,
    cacheKey: `recipient-orders-${user?.id}`,
    onDataChange: (newOrders, oldOrders) => {
      if (oldOrders && !ordersLoading) {
        // Check for status changes
        newOrders.forEach(newOrder => {
          const oldOrder = oldOrders.find(o => o.id === newOrder.id);
          if (oldOrder && oldOrder.status !== newOrder.status) {
            if (newOrder.status === 'confirmed') {
              toast.info(`📋 Order #${newOrder.id.slice(-8)} confirmed by donor`);
            }
          }
        });
      }
    }
  });
  
  // Smart refresh for ratings
  const {
    data: ratings,
    loading: ratingsLoading,
    refresh: refreshRatings
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/ratings');
      return response.data;
    }, [api]),
    interval: 60000 // Ratings update much less frequently
  });
  
  // Critical path loading - only wait for essential data (stats + orders)
  // Ratings can load in the background since they're rarely accessed
  const criticalLoading = statsLoading || ordersLoading;

  const openAddressInMaps = (address) => {
    // Create Google Maps URL with the address
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    // Open in new tab
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Rating functions
  const handleRatingSubmit = async (ratingData) => {
    if (!selectedOrderForRating) return;
    
    await api.post('/ratings', {
      order_id: selectedOrderForRating.id,
      ...ratingData
    });
    
    setRatingDialogOpen(false);
    setSelectedOrderForRating(null);
    refreshRatings();
  };

  const handleRateOrder = (order) => {
    setSelectedOrderForRating(order);
    setRatingDialogOpen(true);
  };

  const getOrderRating = (orderId) => {
    return ratings?.find(rating => rating.order_id === orderId);
  };

  const handlePayment = async (orderId) => {
    try {
      await api.post(`/orders/${orderId}/pay`);
      toast.success('Payment processed successfully!', { duration: 2000 });
      refreshOrders();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error(error.response?.data?.detail || 'Payment failed');
    }
  };

  const handleOrderConfirmation = async (orderId) => {
    if (!window.confirm('Have you picked up this food from the donor? This action will mark the order as completed.')) {
      return;
    }
    
    try {
      await api.post(`/orders/${orderId}/confirm`);
      toast.success('Order confirmed! Thank you for completing the pickup.', { duration: 2000 });
      
      // Find the completed order and show rating prompt
      const completedOrder = orders.find(order => order.id === orderId);
      if (completedOrder) {
        toast.info('💭 Rate your experience with this order!', { duration: 5000 });
        // Automatically open rating dialog after a short delay
        setTimeout(() => {
          handleRateOrder(completedOrder);
        }, 2000);
      }
      
      refreshOrders();
      refreshStats(); // Update stats when completing order
      refreshRatings(); // Refresh ratings in case order completion affects rating eligibility
    } catch (error) {
      console.error('Order confirmation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to confirm order');
    }
  };

  const handleOrderCancellation = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully.', { duration: 2000 });
      refreshOrders();
    } catch (error) {
      console.error('Order cancellation failed:', error);
      toast.error(error.response?.data?.detail || 'Failed to cancel order');
    }
  };

  const getOrderStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', className: 'bg-yellow-500 text-white' },
      confirmed: { label: 'Confirmed', className: 'bg-blue-500 text-white' },
      completed: { label: 'Completed', className: 'bg-green-500 text-white' },
      cancelled: { label: 'Cancelled', className: 'bg-red-500 text-white' }
    };
    
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getPaymentStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Payment Pending', className: 'bg-orange-500 text-white' },
      completed: { label: 'Paid', className: 'bg-green-500 text-white' },
      failed: { label: 'Payment Failed', className: 'bg-red-500 text-white' }
    };
    
    const config = statusMap[status] || statusMap.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  if (criticalLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.full_name}!
          </h1>
          <p className="text-gray-600 mt-2">
            Discover available food and track your claims
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <Link to="/browse">
            <Button className="btn-primary gap-2 mb-6">
              <Search className="h-5 w-5" />
              Browse Available Food
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100">Items Claimed</p>
                    <p className="text-3xl font-bold">{stats.claimed_items}</p>
                  </div>
                  <Heart className="h-12 w-12 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Items Purchased</p>
                    <p className="text-3xl font-bold">{stats.purchased_items}</p>
                  </div>
                  <ShoppingCart className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Total Spent</p>
                    <p className="text-3xl font-bold">₹{stats.total_spent || 0}</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders">My Orders & Claims</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Recent Orders & Claims</h2>
            
            <div className="space-y-4">
              {(orders || []).filter(order => order.status !== 'completed' && order.status !== 'cancelled').map((order) => (
                <Card key={order.id} className="card-hover">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <h3 className="font-semibold text-lg">
                          {order.food_title || 'Food Item'} - {order.order_type === 'claim' ? 'Claimed' : 'Purchased'}
                        </h3>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Order #{order.id.slice(-8)}</p>
                          {order.food_quantity && <p>Quantity: {order.food_quantity}</p>}
                          <p>Amount: ₹{order.total_amount}</p>
                          <p>Method: {order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                          {order.donor_name && (
                            <p>From: {order.donor_name} {order.donor_organization && `(${order.donor_organization})`}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          Ordered: {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getOrderStatusBadge(order.status)}
                        {order.order_type === 'purchase' && getPaymentStatusBadge(order.payment_status)}
                      </div>
                    </div>

                    {/* Pickup Address */}
                    {order.pickup_address && order.delivery_method === 'pickup' && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-3 p-3 bg-blue-50 rounded-lg">
                        <MapPin className="h-4 w-4 mt-0.5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-blue-900 mb-1">Pickup Location:</p>
                          <button
                            type="button"
                            onClick={() => openAddressInMaps(order.pickup_address)}
                            className="text-blue-700 hover:text-blue-800 hover:underline transition-colors cursor-pointer text-left font-medium"
                            title="Click to open in maps"
                          >
                            {order.pickup_address}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Delivery Address */}
                    {order.delivery_address && order.delivery_method === 'delivery' && (
                      <div className="flex items-start gap-2 text-sm text-gray-600 mb-3 p-3 bg-green-50 rounded-lg">
                        <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
                        <div className="flex-1">
                          <p className="font-medium text-green-900 mb-1">Delivery Address:</p>
                          <button
                            type="button"
                            onClick={() => openAddressInMaps(order.delivery_address)}
                            className="text-green-700 hover:text-green-800 hover:underline transition-colors cursor-pointer text-left font-medium"
                            title="Click to open in maps"
                          >
                            {order.delivery_address}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Order Status Info */}
                    <div className="p-3 bg-gray-50 rounded-lg mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">Order Status:</span>
                        <span className="capitalize text-gray-600">{order.status}</span>
                      </div>
                      {order.order_type === 'purchase' && (
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="font-medium text-gray-700">Payment Status:</span>
                          <span className="capitalize text-gray-600">{order.payment_status}</span>
                        </div>
                      )}
                    </div>

                    {/* Rating Status for non-completed orders */}
                    {order.status === 'confirmed' && getOrderRating(order.id) && (
                      <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg mb-4">
                        <Star className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-yellow-700">
                          You've rated this order: 
                        </span>
                        <StarRating rating={getOrderRating(order.id).rating} readonly size="xs" />
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {order.order_type === 'purchase' && order.payment_status === 'pending' && (
                        <Button
                          onClick={() => handlePayment(order.id)}
                          className="btn-primary gap-2 flex-1"
                        >
                          <DollarSign className="h-4 w-4" />
                          Pay ₹{order.total_amount}
                        </Button>
                      )}
                      
                      {/* Show confirmation button for confirmed orders or donation claims */}
                      {((order.order_type === 'purchase' && order.payment_status === 'completed' && order.status === 'confirmed') ||
                        (order.order_type === 'claim' && order.status === 'pending')) && (
                        <Button
                          onClick={() => handleOrderConfirmation(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white gap-2 flex-1"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Confirm Pickup
                        </Button>
                      )}
                      
                      {/* Show cancel button for donations (pending) and unpaid purchases */}
                      {((order.order_type === 'claim' && order.status === 'pending') ||
                        (order.order_type === 'purchase' && order.payment_status === 'pending')) && (
                        <Button
                          onClick={() => handleOrderCancellation(order.id)}
                          variant="outline"
                          className="gap-2 flex-1 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                          Cancel Order
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          refreshOrders();
                          refreshStats();
                        }}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Refresh Status
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {orders.filter(order => order.status !== 'completed' && order.status !== 'cancelled').length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No active orders</h3>
                  <p className="text-gray-600 mb-4">Your active claims and purchases will appear here</p>
                  <Link to="/browse">
                    <Button className="btn-primary gap-2">
                      <Search className="h-4 w-4" />
                      Browse Food
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Order History</h2>
            
            <div className="space-y-4">
              {orders.filter(order => order.status === 'completed' || order.status === 'cancelled').map((order) => (
                <Card key={order.id} className={order.status === 'completed' ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {order.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          <h3 className="font-semibold text-lg">
                            {order.food_title || 'Food Item'} - {order.order_type === 'claim' ? 'Claimed' : 'Purchased'}
                          </h3>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Order #{order.id.slice(-8)}</p>
                          {order.food_quantity && <p>Quantity: {order.food_quantity}</p>}
                          <p>Amount: ₹{order.total_amount}</p>
                          <p>Method: {order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}</p>
                          {order.donor_name && (
                            <p>From: {order.donor_name} {order.donor_organization && `(${order.donor_organization})`}</p>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">
                          {order.status === 'completed' ? 'Completed' : 'Cancelled'}: {new Date(order.updated_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={order.status === 'completed' ? "bg-green-500 text-white" : "bg-red-500 text-white"}>
                          {order.status === 'completed' ? 'Completed' : 'Cancelled'}
                        </Badge>
                        {order.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            {getOrderRating(order.id) ? (
                              <div className="flex items-center gap-1">
                                <StarRating rating={getOrderRating(order.id).rating} readonly size="xs" />
                                <span className="text-xs text-gray-600">Rated</span>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleRateOrder(order)}
                                variant="outline"
                                size="sm"
                                className="text-xs gap-1 h-7"
                              >
                                <Star className="h-3 w-3" />
                                Rate
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {orders.filter(order => order.status === 'completed' || order.status === 'cancelled').length === 0 && (
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No completed orders yet</h3>
                  <p className="text-gray-600">Your completed orders will appear here</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Impact Section */}
        <div className="mt-12">
          <Card className="bg-gradient-to-br from-emerald-50 to-blue-50 border-0">
            <CardContent className="p-8 text-center">
              <TrendingDown className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Your Impact</h3>
              <p className="text-gray-600 mb-6">
                Thank you for helping reduce food waste and supporting your community!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-3xl font-bold text-emerald-600">{stats?.claimed_items + stats?.purchased_items || 0}</p>
                  <p className="text-sm text-gray-600">Food Items Rescued</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-blue-600">Community</p>
                  <p className="text-sm text-gray-600">Impact Created</p>
                </div>
                <div>
                  <p className="text-3xl font-bold text-purple-600">Sustainable</p>
                  <p className="text-sm text-gray-600">Living Promoted</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Rating Dialog */}
      <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          {selectedOrderForRating && (
            <RatingForm
              order={selectedOrderForRating}
              onSubmit={handleRatingSubmit}
              onCancel={() => {
                setRatingDialogOpen(false);
                setSelectedOrderForRating(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default RecipientDashboard;
