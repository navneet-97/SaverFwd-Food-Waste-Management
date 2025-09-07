import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { useSmartRefresh } from '../hooks/useSmartRefresh';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import ChatWidget from './ChatWidget';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Clock, 
  MapPin, 
  Users,
  TrendingUp,
  Heart,
  DollarSign,
  Package,
  Calendar,
  CheckCircle,
  User,
  X,
  Building2,
  Star
} from 'lucide-react';
import StarRating from './ui/star-rating';
import { RatingDisplay, RatingSummary } from './ui/rating-display';

const DonorDashboard = () => {
  const { api, user } = useAuth();
  const [orderFilter, setOrderFilter] = useState('all'); // all, pending, confirmed, completed, cancelled
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [selectedRecipientAllOrders, setSelectedRecipientAllOrders] = useState(null);
  const [loadingAllOrders, setLoadingAllOrders] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Smart refresh hooks for different data types
  const {
    data: stats,
    loading: statsLoading,
    isRefreshing: statsRefreshing,
    refresh: refreshStats
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/dashboard/stats');
      return response.data;
    }, [api]),
    interval: 10000, // Stats update less frequently
    onDataChange: (newStats, oldStats) => {
      if (oldStats && !statsLoading) {
        // Notify about changes in stats
        if (newStats.total_donations > oldStats.total_donations) {
          toast.success('🎉 New donation completed!', { duration: 2000 });
        }
        if (newStats.total_sales > oldStats.total_sales) {
          toast.success('💰 New sale completed!', { duration: 2000 });
        }
      }
    }
  });

  const {
    data: foodItems,
    loading: foodItemsLoading,
    refresh: refreshFoodItems
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/food-items');
      return response.data;
    }, [api]),
    interval: 5000 // Food items update more frequently
  });

  const {
    data: orders,
    loading: ordersLoading,
    refresh: refreshOrders
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/orders');
      return response.data;
    }, [api]),
    interval: 3000, // Orders update most frequently
    onDataChange: (newOrders, oldOrders) => {
      if (oldOrders && !ordersLoading) {
        const oldCount = oldOrders.length;
        const newCount = newOrders.length;
        if (newCount > oldCount) {
          toast.info('📦 New order received!');
        }
      }
    }
  });

  const {
    data: recipients,
    loading: recipientsLoading,
    refresh: refreshRecipients
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/donors/recipients');
      return response.data;
    }, [api]),
    interval: 15000 // Recipients update less frequently
  });

  const {
    data: ratingSummary,
    loading: ratingSummaryLoading,
    refresh: refreshRatingSummary
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get(`/donors/${user?.id}/rating-summary`);
      return response.data;
    }, [api, user?.id]),
    interval: 30000 // Rating summary updates less frequently
  });

  // Form state for adding/editing food items
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quantity: '',
    expiry_time: '',
    pickup_address: '',
    latitude: 40.7128,
    longitude: -74.0060,
    food_type: 'donation',
    price: '',
    delivery_available: false,
    pickup_window_start: '',
    pickup_window_end: ''
  });

  // Combined loading state
  const loading = statsLoading || foodItemsLoading || ordersLoading || recipientsLoading || ratingSummaryLoading;
  const isRefreshing = statsRefreshing;
  
  // Manual refresh all data
  const refreshAllData = useCallback(() => {
    refreshStats();
    refreshFoodItems();
    refreshOrders();
    refreshRecipients();
    refreshRatingSummary();
    toast.success('Dashboard data refreshed!', { duration: 2000 });
  }, [refreshStats, refreshFoodItems, refreshOrders, refreshRecipients, refreshRatingSummary]);

  // Function to fetch all orders for a specific recipient
  const fetchAllOrdersForRecipient = useCallback(async (recipientId) => {
    setLoadingAllOrders(true);
    try {
      const response = await api.get(`/donors/recipients/${recipientId}`);
      setSelectedRecipientAllOrders(response.data);
    } catch (error) {
      console.error('Failed to fetch all orders:', error);
      toast.error('Failed to load all orders');
    } finally {
      setLoadingAllOrders(false);
    }
  }, [api]);

  const handleFormChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      quantity: '',
      expiry_time: '',
      pickup_address: '',
      latitude: 40.7128,
      longitude: -74.0060,
      food_type: 'donation',
      price: '',
      delivery_available: false,
      pickup_window_start: '',
      pickup_window_end: ''
    });
    setEditingItem(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title || !formData.quantity || !formData.expiry_time || !formData.pickup_address) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const submitData = {
        title: formData.title,
        description: formData.description || null,
        quantity: formData.quantity,
        expiry_time: new Date(formData.expiry_time).toISOString(),
        pickup_address: formData.pickup_address,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        food_type: formData.food_type,
        price: formData.food_type === 'sale' ? parseFloat(formData.price) || null : null,
        delivery_available: formData.delivery_available || false,
        pickup_window_start: formData.pickup_window_start ? new Date(formData.pickup_window_start).toISOString() : null,
        pickup_window_end: formData.pickup_window_end ? new Date(formData.pickup_window_end).toISOString() : null
      };

      if (editingItem) {
        await api.put(`/food-items/${editingItem.id}`, submitData);
        toast.success('Food item updated successfully!', { duration: 2000 });
      } else {
        await api.post('/food-items', submitData);
        toast.success('Food item added successfully!', { duration: 2000 });
      }

      setIsAddDialogOpen(false);
      resetForm();
      // Refresh relevant data
      refreshStats();
      refreshFoodItems();
    } catch (error) {
      console.error('Failed to save food item:', error);
      toast.error(error.response?.data?.detail || 'Failed to save food item');
    }
  };

  const handleEdit = (item) => {
    // Prevent editing if item is claimed/sold/expired
    if (item.status === 'claimed' || item.status === 'sold') {
      toast.error('Cannot edit food item that has been claimed or sold');
      return;
    }
    if (item.status === 'expired') {
      toast.error('Cannot edit expired food item');
      return;
    }
    
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      quantity: item.quantity,
      expiry_time: item.expiry_time ? (() => {
        // Convert to local time for datetime-local input
        const date = new Date(item.expiry_time);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      })() : '',
      pickup_address: item.pickup_address,
      latitude: item.latitude,
      longitude: item.longitude,
      food_type: item.food_type,
      price: item.price || '',
      delivery_available: item.delivery_available,
      pickup_window_start: item.pickup_window_start ? (() => {
        const date = new Date(item.pickup_window_start);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      })() : '',
      pickup_window_end: item.pickup_window_end ? (() => {
        const date = new Date(item.pickup_window_end);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      })() : ''
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (item) => {
    // Prevent deleting if item is claimed/sold/expired
    if (item.status === 'claimed' || item.status === 'sold') {
      toast.error('Cannot delete food item that has been claimed or sold');
      return;
    }
    if (item.status === 'expired') {
      toast.error('Cannot delete expired food item');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this food item?')) return;

    try {
      await api.delete(`/food-items/${item.id}`);
      toast.success('Food item deleted successfully!', { duration: 2000 });
      // Refresh relevant data
      refreshFoodItems();
      refreshStats();
    } catch (error) {
      console.error('Failed to delete food item:', error);
      toast.error(error.response?.data?.detail || 'Failed to delete food item');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      available: { label: 'Available', className: 'bg-green-500 text-white' },
      claimed: { label: 'Claimed', className: 'bg-orange-500 text-white' },
      sold: { label: 'Sold', className: 'bg-red-500 text-white' },
      expired: { label: 'Expired', className: 'bg-gray-500 text-white' }
    };
    
    const config = statusMap[status] || statusMap.available;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getOrderStatusBadge = (status) => {
    const statusColors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };

    const statusIcons = {
      completed: CheckCircle,
      confirmed: Clock,
      pending: Clock,
      cancelled: X // Using X icon for cancelled
    };

    const Icon = statusIcons[status];

    return (
      <Badge variant="outline" className={`${statusColors[status]} border-0 flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getTypeBadge = (type) => {
    return type === 'donation' ? (
      <Badge className="type-donation text-white">Free</Badge>
    ) : (
      <Badge className="type-sale text-white">Sale</Badge>
    );
  };

  // Helper function to check if item can be edited/deleted
  const canModifyItem = (item) => {
    return item.status === 'available';
  };
  
  // Helper function to get item status color for different statuses
  const getItemCardClass = (item) => {
    let baseClass = 'card-hover';
    
    switch (item.status) {
      case 'available':
        baseClass += ' border-green-200 bg-green-50/30';
        break;
      case 'claimed':
        baseClass += ' border-orange-200 bg-orange-50/30 opacity-85';
        break;
      case 'sold':
        baseClass += ' border-red-200 bg-red-50/30 opacity-85';
        break;
      case 'expired':
        baseClass += ' border-gray-200 bg-gray-50 opacity-75';
        break;
      default:
        baseClass += ' border-gray-200';
    }
    
    return baseClass;
  };
  
  // Helper function to get time remaining in hours+minutes format
  const getTimeRemaining = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diffInMs = expiry - now;
    
    if (diffInMs < 0) {
      return 'Expired';
    }
    
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const totalHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const remainingMinutes = diffInMinutes % 60;
    
    if (totalHours > 0) {
      if (remainingMinutes > 0) {
        return `${totalHours}h ${remainingMinutes}m left`;
      } else {
        return `${totalHours}h left`;
      }
    } else if (diffInMinutes > 0) {
      return `${diffInMinutes}m left`;
    } else {
      return 'Expiring soon!';
    }
  };
  
  // Helper function to sort food items by status priority
  const getSortedFoodItems = () => {
    if (!foodItems || foodItems.length === 0) return [];
    
    const statusPriority = {
      'available': 1,   // Available items first
      'claimed': 2,     // Then claimed
      'sold': 3,        // Then sold
      'expired': 4      // Finally expired
    };
    
    return [...foodItems].sort((a, b) => {
      const priorityA = statusPriority[a.status] || 5;
      const priorityB = statusPriority[b.status] || 5;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Within same status, sort by creation date (newest first)
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };

  const filteredOrders = (orders || []).filter(order => {
    if (orderFilter === 'all') return true;
    return order.status === orderFilter;
  });

  if (loading) {
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.full_name}!
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your food listings and track your impact
            </p>
          </div>
          <div className="flex items-center gap-4">
            {/* Remove auto-refresh indicator - keep it silent */}
            <Button
              onClick={refreshAllData} // Smart manual refresh
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={isRefreshing}
            >
              <CheckCircle className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100">Active Listings</p>
                    <p className="text-3xl font-bold">{stats.active_listings}</p>
                  </div>
                  <Package className="h-12 w-12 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100">Total Donations</p>
                    <p className="text-3xl font-bold">{stats.total_donations}</p>
                  </div>
                  <Heart className="h-12 w-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100">Total Sales</p>
                    <p className="text-3xl font-bold">{stats.total_sales}</p>
                  </div>
                  <DollarSign className="h-12 w-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            {/* Rating Summary Card */}
            <Card className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100">Average Rating</p>
                    <div className="flex items-center gap-2">
                      <p className="text-3xl font-bold">
                        {ratingSummary?.average_rating || '0.0'}
                      </p>
                      <StarRating 
                        rating={Math.round(ratingSummary?.average_rating || 0)} 
                        readonly 
                        size="sm" 
                      />
                    </div>
                    <p className="text-yellow-100 text-sm mt-1">
                      {ratingSummary?.total_ratings || 0} reviews
                    </p>
                  </div>
                  <Star className="h-12 w-12 text-yellow-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="listings">Food Listings</TabsTrigger>
            <TabsTrigger value="orders">Orders & Claims</TabsTrigger>
            <TabsTrigger value="recipients">Recipients</TabsTrigger>
            <TabsTrigger value="ratings">Ratings & Feedback</TabsTrigger>
          </TabsList>

          {/* Food Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Your Food Listings</h2>
                {getSortedFoodItems().length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {getSortedFoodItems().filter(item => item.status === 'available').length} available •{' '}
                    {getSortedFoodItems().filter(item => item.status === 'claimed').length} claimed •{' '}
                    {getSortedFoodItems().filter(item => item.status === 'sold').length} sold •{' '}
                    {getSortedFoodItems().filter(item => item.status === 'expired').length} expired
                  </p>
                )}
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="btn-primary gap-2">
                    <Plus className="h-4 w-4" />
                    Add Food Item
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingItem ? 'Edit Food Item' : 'Add New Food Item'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="title">Food Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => handleFormChange('title', e.target.value)}
                        required
                        placeholder="e.g., Fresh Biryani"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleFormChange('description', e.target.value)}
                        placeholder="Brief description of the food"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quantity">Quantity *</Label>
                      <Input
                        id="quantity"
                        value={formData.quantity}
                        onChange={(e) => handleFormChange('quantity', e.target.value)}
                        required
                        placeholder="e.g., 50 plates, 10 kg"
                      />
                    </div>

                    <div>
                      <Label htmlFor="food_type">Type *</Label>
                      <Select onValueChange={(value) => handleFormChange('food_type', value)} value={formData.food_type}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="donation">Donation (Free)</SelectItem>
                          <SelectItem value="sale">Low-Cost Sale</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.food_type === 'sale' && (
                      <div>
                        <Label htmlFor="price">Price (₹) *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleFormChange('price', e.target.value)}
                          required
                          placeholder="Enter price"
                        />
                      </div>
                    )}

                    <div>
                      <Label htmlFor="expiry_time">Expiry Time *</Label>
                      <Input
                        id="expiry_time"
                        type="datetime-local"
                        value={formData.expiry_time}
                        onChange={(e) => handleFormChange('expiry_time', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="pickup_address">Pickup Address *</Label>
                      <Textarea
                        id="pickup_address"
                        value={formData.pickup_address}
                        onChange={(e) => handleFormChange('pickup_address', e.target.value)}
                        required
                        placeholder="Full pickup address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="latitude">Latitude *</Label>
                        <Input
                          id="latitude"
                          type="number"
                          step="any"
                          value={formData.latitude}
                          onChange={(e) => handleFormChange('latitude', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="longitude">Longitude *</Label>
                        <Input
                          id="longitude"
                          type="number"
                          step="any"
                          value={formData.longitude}
                          onChange={(e) => handleFormChange('longitude', e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="pickup_window_start">Pickup Window Start</Label>
                        <Input
                          id="pickup_window_start"
                          type="datetime-local"
                          value={formData.pickup_window_start}
                          onChange={(e) => handleFormChange('pickup_window_start', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="pickup_window_end">Pickup Window End</Label>
                        <Input
                          id="pickup_window_end"
                          type="datetime-local"
                          value={formData.pickup_window_end}
                          onChange={(e) => handleFormChange('pickup_window_end', e.target.value)}
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full btn-primary">
                      {editingItem ? 'Update Food Item' : 'Add Food Item'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-8">
              {/* Group items by status and render sections */}
              {[
                {status: 'available', title: 'Active Listings'}, 
                {status: 'claimed', title: 'Claimed Items'}, 
                {status: 'sold', title: 'Sold Items'}, 
                {status: 'expired', title: 'Expired Items'}
              ].map(section => {
                const sectionItems = getSortedFoodItems().filter(item => item.status === section.status);
                if (sectionItems.length === 0) return null;
                
                return (
                  <div key={section.status} className="space-y-4">
                    {/* Section Header */}
                    <div className="flex items-center">
                      <div className="flex-grow border-t border-gray-300"></div>
                      <span className="flex-shrink-0 px-4 text-sm font-medium text-gray-500 bg-white">
                        {section.title} ({sectionItems.length})
                      </span>
                      <div className="flex-grow border-t border-gray-300"></div>
                    </div>
                    
                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {sectionItems.map((item) => (
                        <Card key={item.id} className={getItemCardClass(item)}>
                          <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                              <CardTitle className="text-lg">{item.title}</CardTitle>
                              <div className="flex gap-2">
                                {getTypeBadge(item.food_type)}
                                {getStatusBadge(item.status)}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {item.description && (
                                <p className="text-gray-600 text-sm">{item.description}</p>
                              )}
                              
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Package className="h-4 w-4" />
                                <span>Quantity: {item.quantity}</span>
                              </div>

                              {item.food_type === 'sale' && item.price && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <DollarSign className="h-4 w-4" />
                                  <span>Price: ₹{item.price}</span>
                                </div>
                              )}

                              {item.status === 'available' && (
                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                  <Clock className="h-4 w-4" />
                                  <span>Expires: {getTimeRemaining(item.expiry_time)}</span>
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <MapPin className="h-4 w-4" />
                                <span className="truncate">{item.pickup_address}</span>
                              </div>

                              {canModifyItem(item) && (
                                <div className="flex gap-2 pt-2">
                                  <Button
                                    onClick={() => handleEdit(item)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    onClick={() => handleDelete(item)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              }).filter(Boolean) /* Remove null sections */}
              
              {getSortedFoodItems().length === 0 && (
                <div className="text-center py-12">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No food items yet</h3>
                  <p className="text-gray-600 mb-4">Start by adding your first food listing</p>
                  <Button onClick={() => setIsAddDialogOpen(true)} className="btn-primary">
                    Add Food Item
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Orders & Claims</h2>
              <div className="flex items-center gap-4">
                <Label htmlFor="orderFilter" className="text-sm font-medium">
                  Filter by Status:
                </Label>
                <Select value={orderFilter} onValueChange={setOrderFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              {filteredOrders.length === 0 && orderFilter !== 'all' && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No orders found with status: {orderFilter}</p>
                  <Button 
                    onClick={() => setOrderFilter('all')} 
                    variant="outline" 
                    className="mt-2"
                  >
                    Show All Orders
                  </Button>
                </div>
              )}
              
              {filteredOrders.map((order) => {
                let cardClassName = 'card-hover';
                if (order.status === 'completed') {
                  cardClassName += ' ring-1 ring-green-200';
                } else if (order.status === 'cancelled') {
                  cardClassName += ' ring-1 ring-red-200 bg-red-50';
                }
                return (
                <Card key={order.id} className={cardClassName}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">Order #{order.id.slice(-8)}</h3>
                          {getOrderStatusBadge(order.status)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">{order.food_title || 'Food Item'}</span>
                          {order.food_quantity && (
                            <span>• {order.food_quantity}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div className="text-lg font-semibold text-gray-900">
                          {order.order_type === 'claim' ? 'Free' : `₹${order.total_amount}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          {order.order_type === 'claim' ? 'Donation' : 'Sale'}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span className="font-medium">Recipient:</span>
                          {order.recipient_name && (
                            <span>{order.recipient_name}</span>
                          )}
                        </div>
                        {order.recipient_organization && (
                          <div className="text-sm text-gray-600 ml-6">
                            {order.recipient_organization}
                          </div>
                        )}
                        {order.recipient_phone && (
                          <div className="text-sm text-gray-600 ml-6">
                            <span className="font-medium">Phone:</span> {order.recipient_phone}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span>Pickup: {order.delivery_method === 'pickup' ? (order.pickup_address || 'Address not available') : 'Delivery'}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Created:</span> {new Date(order.created_at).toLocaleString()}
                        </div>
                        {order.updated_at !== order.created_at && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Updated:</span> {new Date(order.updated_at).toLocaleString()}
                          </div>
                        )}
                        {order.order_type === 'purchase' && (
                          <div className="text-sm">
                            <span className="font-medium">Payment:</span>
                            <Badge 
                              variant={order.payment_status === 'completed' ? 'default' : 'outline'}
                              className={`ml-2 ${order.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}
                            >
                              {order.payment_status ? order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1) : 'Pending'}
                            </Badge>
                          </div>
                        )}
                        {order.status === 'completed' && (
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <CheckCircle className="h-4 w-4" />
                            <span className="font-medium">Pickup Confirmed</span>
                          </div>
                        )}
                        {order.status === 'cancelled' && (
                          <div className="flex items-center gap-2 text-sm text-red-700">
                            <X className="h-4 w-4" />
                            <span className="font-medium">Order Cancelled</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
                );
              })}

              {orders.length === 0 && orderFilter === 'all' && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600">Orders and claims will appear here when recipients interact with your listings</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Recipients Tracking Tab */}
          <TabsContent value="recipients" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-gray-900">Recipients Tracking</h2>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {recipients.length} Total Recipients
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {recipients.map((recipient) => (
                <Card key={recipient.recipient_id} className="card-hover">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{recipient.recipient_name}</CardTitle>
                        {recipient.recipient_organization && (
                          <p className="text-sm text-gray-600">{recipient.recipient_organization}</p>
                        )}
                      </div>
                      <Badge 
                        variant="outline" 
                        className="bg-green-50 text-green-700 border-green-200"
                      >
                        {recipient.total_claims + recipient.total_purchases} Orders
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Contact Information */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900 text-sm">Contact Information</h4>
                      {recipient.recipient_phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className="font-medium">Phone:</span>
                          <span>{recipient.recipient_phone}</span>
                        </div>
                      )}
                      {recipient.recipient_address && (
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span className="text-xs leading-relaxed">{recipient.recipient_address}</span>
                        </div>
                      )}
                    </div>

                    {/* Statistics */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{recipient.total_claims}</div>
                        <div className="text-xs text-gray-600">Free Claims</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{recipient.total_purchases}</div>
                        <div className="text-xs text-gray-600">Purchases</div>
                      </div>
                    </div>

                    {recipient.total_spent > 0 && (
                      <div className="text-center pt-2 border-t border-gray-100">
                        <div className="text-lg font-semibold text-purple-600">₹{recipient.total_spent.toFixed(2)}</div>
                        <div className="text-xs text-gray-600">Total Spent</div>
                      </div>
                    )}

                    {/* Recent Orders */}
                    <div className="space-y-2 pt-2 border-t border-gray-100">
                      <h4 className="font-medium text-gray-900 text-sm">Recent Orders</h4>
                      {recipient.recent_orders.slice(0, 3).map((order) => (
                        <div key={order.id} className="bg-gray-50 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="font-medium text-gray-900">
                                {order.food_title || 'Food Item'}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>{order.order_type === 'claim' ? 'Claimed' : 'Purchased'}</span>
                                <span>•</span>
                                <span>{new Date(order.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1">
                              <div className="text-sm font-medium">
                                {order.order_type === 'claim' ? 'Free' : `₹${order.total_amount}`}
                              </div>
                              {getOrderStatusBadge(order.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {recipient.recent_orders.length === 0 && (
                        <p className="text-xs text-gray-500 italic py-2">No recent orders</p>
                      )}
                      
                      {recipient.total_orders > 5 && (
                        <div className="text-center pt-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs text-blue-600 hover:text-blue-800"
                            onClick={async () => {
                              setLoadingAllOrders(true);
                              setSelectedRecipient(recipient);
                              await fetchAllOrdersForRecipient(recipient.recipient_id);
                            }}
                          >
                            View All {recipient.total_orders} Orders
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Order Timeline */}
                    <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                      <div>First order: {new Date(recipient.first_order_date).toLocaleDateString()}</div>
                      <div>Last order: {new Date(recipient.last_order_date).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {recipients.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No recipients yet</h3>
                <p className="text-gray-600">Recipients who claim or purchase your food items will appear here with their contact information and order history</p>
              </div>
            )}

            {/* Detailed Recipient Modal */}
            {selectedRecipient && (
              <Dialog open={!!selectedRecipient} onOpenChange={() => {
                setSelectedRecipient(null);
                setSelectedRecipientAllOrders(null);
              }}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-xl">
                      {selectedRecipient.recipient_name} - Complete Order History
                    </DialogTitle>
                    {selectedRecipient.recipient_organization && (
                      <p className="text-gray-600">{selectedRecipient.recipient_organization}</p>
                    )}
                  </DialogHeader>
                  
                  {loadingAllOrders ? (
                    <div className="flex flex-col items-center justify-center py-16 space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                      <p className="text-gray-600 text-lg">Loading complete order history...</p>
                      <p className="text-gray-500 text-sm">Fetching all {selectedRecipient.total_orders} orders</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-emerald-600">{selectedRecipientAllOrders?.total_claims || selectedRecipient.total_claims}</div>
                          <div className="text-sm text-gray-600">Total Claims</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">{selectedRecipientAllOrders?.total_purchases || selectedRecipient.total_purchases}</div>
                          <div className="text-sm text-gray-600">Total Purchases</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4 text-center">
                          <div className="text-2xl font-bold text-purple-600">₹{(selectedRecipientAllOrders?.total_spent || selectedRecipient.total_spent).toFixed(2)}</div>
                          <div className="text-sm text-gray-600">Total Spent</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Contact Information */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Contact Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {selectedRecipient.recipient_phone && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Phone:</span>
                            <span>{selectedRecipient.recipient_phone}</span>
                          </div>
                        )}
                        {selectedRecipient.recipient_address && (
                          <div className="flex items-start gap-2">
                            <span className="font-medium">Address:</span>
                            <span>{selectedRecipient.recipient_address}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* All Orders */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          All Orders ({selectedRecipientAllOrders ? selectedRecipientAllOrders.recent_orders.length : selectedRecipient.recent_orders.length})
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(selectedRecipientAllOrders?.recent_orders || selectedRecipient.recent_orders).map((order) => (
                          <div key={order.id} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium">{order.food_title || 'Food Item'}</h4>
                                  <p className="text-sm text-gray-600">Order #{order.id.slice(-8)}</p>
                                </div>
                                <div className="text-right space-y-1">
                                  <div className="font-semibold">
                                    {order.order_type === 'claim' ? 'Free' : `₹${order.total_amount}`}
                                  </div>
                                  {getOrderStatusBadge(order.status)}
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                  <span className="font-medium">Type:</span> {order.order_type === 'claim' ? 'Donation' : 'Purchase'}
                                </div>
                                <div>
                                  <span className="font-medium">Created:</span> {new Date(order.created_at).toLocaleString()}
                                </div>
                                {order.food_quantity && (
                                  <div>
                                    <span className="font-medium">Quantity:</span> {order.food_quantity}
                                  </div>
                                )}
                                <div>
                                  <span className="font-medium">Method:</span> {order.delivery_method === 'pickup' ? 'Pickup' : 'Delivery'}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* Ratings & Feedback Tab */}
          <TabsContent value="ratings" className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-900">Ratings & Feedback</h2>
            
            {ratingSummaryLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600"></div>
              </div>
            ) : (
              /* Rating Summary */
              ratingSummary && (ratingSummary.total_ratings || 0) > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rating Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RatingSummary summary={ratingSummary} />
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>All Feedback ({ratingSummary?.all_ratings?.length || 0})</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                    {(ratingSummary?.all_ratings || []).map((rating) => (
                      <RatingDisplay 
                        key={rating.id} 
                        rating={rating} 
                        showRecipient={true}
                        className="border-0 shadow-none bg-gray-50"
                      />
                    ))}
                    {(!ratingSummary?.all_ratings || ratingSummary.all_ratings.length === 0) && (
                      <p className="text-gray-500 text-center py-4">No feedback yet</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              ) : (
                <div className="text-center py-12">
                  <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No ratings yet</h3>
                  <p className="text-gray-600 mb-4">
                    Recipients will be able to rate their experience after completing orders.
                    <br />Start by adding food items and receiving your first orders!
                  </p>
                </div>
              )
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Chat Widget */}
      <ChatWidget />
    </div>
  );
};

export default DonorDashboard;
