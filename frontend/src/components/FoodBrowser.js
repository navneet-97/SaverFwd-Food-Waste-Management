import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../App';
import { useSmartRefresh } from '../hooks/useSmartRefresh';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { toast } from 'sonner';
import { 
  Search, 
  Filter, 
  Clock, 
  MapPin, 
  Heart,
  DollarSign,
  Package,
  Truck,
  User,
  ShoppingCart,
  CheckCircle,
  Star
} from 'lucide-react';
import StarRating from './ui/star-rating';

const FoodBrowser = () => {
  const { api } = useAuth();
  const [filteredItems, setFilteredItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [orderData, setOrderData] = useState({
    delivery_method: 'pickup',
    delivery_address: ''
  });

  // Smart refresh for food items
  const {
    data: foodItems,
    loading,
    refresh: refreshFoodItems
  } = useSmartRefresh({
    fetchFunction: useCallback(async () => {
      const response = await api.get('/food-items');
      return response.data;
    }, [api]),
    interval: 8000, // Food items update reasonably in browse mode
    cacheKey: 'food-items-browse'
    onDataChange: (newItems, oldItems) => {
      if (oldItems && !loading) {
        const newAvailableCount = newItems.filter(item => item.status === 'available').length;
        const oldAvailableCount = oldItems.filter(item => item.status === 'available').length;
        
        if (newAvailableCount > oldAvailableCount) {
          toast.success('🎆 New food items available!', { duration: 2000 });
        }
      }
    }
  });

  useEffect(() => {
    filterItems();
  }, [foodItems, searchTerm, typeFilter]);

  const filterItems = () => {
    if (!foodItems) return;
    let filtered = [...foodItems];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        item.pickup_address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.food_type === typeFilter);
    }

    // Sort by creation date (newest first)
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setFilteredItems(filtered);
  };

  const handleOrderClick = (item) => {
    setSelectedItem(item);
    setOrderData({
      delivery_method: 'pickup',
      delivery_address: ''
    });
    setIsOrderDialogOpen(true);
  };

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      const orderPayload = {
        food_item_id: selectedItem.id,
        delivery_method: orderData.delivery_method,
        delivery_address: orderData.delivery_method === 'delivery' ? orderData.delivery_address : null
      };

      const response = await api.post('/orders', orderPayload);
      
      if (selectedItem.food_type === 'donation') {
        toast.success('Food claimed successfully! Check your dashboard for details.', { duration: 2000 });
      } else {
        toast.success('Order created! Complete payment to confirm your order.', { duration: 2000 });
      }

      setIsOrderDialogOpen(false);
      setSelectedItem(null);
      refreshFoodItems(); // Smart refresh the list
    } catch (error) {
      console.error('Failed to create order:', error);
      toast.error(error.response?.data?.detail || 'Failed to create order');
    }
  };

  const getTypeBadge = (type, price) => {
    if (type === 'donation') {
      return <Badge className="bg-emerald-500 text-white">FREE</Badge>;
    } else {
      return <Badge className="bg-blue-500 text-white">₹{price}</Badge>;
    }
  };

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

  const isExpiringSoon = (expiryTime) => {
    const now = new Date();
    const expiry = new Date(expiryTime);
    const diffInHours = (expiry - now) / (1000 * 60 * 60);
    return diffInHours <= 6 && diffInHours > 0;
  };

  const openAddressInMaps = (address) => {
    // Create Google Maps URL with the address
    const encodedAddress = encodeURIComponent(address);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
    
    // Open in new tab
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Available Food
          </h1>
          <p className="text-gray-600">
            Find free donations and low-cost food near you
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <Input
                  placeholder="Search food items, location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="donation">Free Donations</SelectItem>
                  <SelectItem value="sale">Low-Cost Sales</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Showing {filteredItems.length} of {(foodItems || []).length} available food items
          </p>
          <Button 
            onClick={refreshFoodItems}
            variant="outline" 
            size="sm"
            className="gap-2"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>

        {/* Food Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className="card-hover overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg line-clamp-2">{item.title}</CardTitle>
                  {getTypeBadge(item.food_type, item.price)}
                </div>
                {isExpiringSoon(item.expiry_time) && (
                  <Badge variant="destructive" className="w-fit">
                    Expiring Soon!
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {item.description && (
                    <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                  )}
                  
                  {/* Donor Rating */}
                  {item.donor_average_rating && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-600" />
                          <span className="text-sm text-gray-700">
                            {item.donor_name || 'Donor'}
                            {item.donor_organization && (
                              <span className="text-gray-500"> • {item.donor_organization}</span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <StarRating 
                            rating={Math.round(item.donor_average_rating)} 
                            readonly 
                            size="xs" 
                          />
                          <span className="text-xs text-gray-600">
                            {item.donor_average_rating} ({item.donor_total_ratings})
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Package className="h-4 w-4" />
                      <span>Quantity: {item.quantity}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>Expires: {getTimeRemaining(item.expiry_time)}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openAddressInMaps(item.pickup_address);
                        }}
                        className="text-left line-clamp-1 text-blue-600 hover:text-blue-800 hover:underline transition-colors cursor-pointer flex-1 font-medium"
                        title="Click to open in maps"
                      >
                        {item.pickup_address}
                      </button>
                    </div>

                    {item.pickup_window_start && item.pickup_window_end && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Clock className="h-4 w-4" />
                        <span>
                          Pickup: {new Date(item.pickup_window_start).toLocaleTimeString()} - {new Date(item.pickup_window_end).toLocaleTimeString()}
                        </span>
                      </div>
                    )}

                    {item.delivery_available && (
                      <div className="flex items-center gap-2 text-sm text-emerald-600">
                        <Truck className="h-4 w-4" />
                        <span>Delivery available</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      onClick={() => handleOrderClick(item)}
                      className="w-full btn-primary gap-2"
                    >
                      {item.food_type === 'donation' ? (
                        <>
                          <Heart className="h-4 w-4" />
                          Claim Food
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4" />
                          Order Food
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {(foodItems || []).length === 0 ? 'No food items available' : 'No items match your search'}
            </h3>
            <p className="text-gray-600">
              {(foodItems || []).length === 0 
                ? 'Check back later for new food listings' 
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        )}

        {/* Order Dialog */}
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {selectedItem?.food_type === 'donation' ? 'Claim Food' : 'Order Food'}
              </DialogTitle>
            </DialogHeader>
            
            {selectedItem && (
              <form onSubmit={handleOrderSubmit} className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{selectedItem.title}</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>Quantity: {selectedItem.quantity}</p>
                    {selectedItem.food_type === 'sale' && (
                      <p>Price: ₹{selectedItem.price}</p>
                    )}
                    <p>Expires: {new Date(selectedItem.expiry_time).toLocaleString()}</p>
                  </div>
                </div>

                <div>
                  <Label>Pickup/Delivery Method</Label>
                  <Select 
                    value={orderData.delivery_method} 
                    onValueChange={(value) => setOrderData(prev => ({ ...prev, delivery_method: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pickup">Pickup from location</SelectItem>
                      {selectedItem.delivery_available && (
                        <SelectItem value="delivery">Delivery to my address</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {orderData.delivery_method === 'delivery' && (
                  <div>
                    <Label htmlFor="delivery_address">Delivery Address *</Label>
                    <Textarea
                      id="delivery_address"
                      value={orderData.delivery_address}
                      onChange={(e) => setOrderData(prev => ({ ...prev, delivery_address: e.target.value }))}
                      required
                      placeholder="Enter your delivery address"
                    />
                  </div>
                )}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 mb-1">Pickup Location:</p>
                      <button
                        type="button"
                        onClick={() => openAddressInMaps(selectedItem.pickup_address)}
                        className="text-sm text-blue-700 hover:text-blue-800 hover:underline transition-colors cursor-pointer text-left"
                        title="Click to open in maps"
                      >
                        {selectedItem.pickup_address}
                      </button>
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full btn-primary gap-2">
                  {selectedItem.food_type === 'donation' ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Confirm Claim
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-4 w-4" />
                      Create Order
                    </>
                  )}
                </Button>

                {selectedItem.food_type === 'sale' && (
                  <p className="text-sm text-gray-600 text-center">
                    You'll be redirected to payment after creating the order
                  </p>
                )}
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FoodBrowser;