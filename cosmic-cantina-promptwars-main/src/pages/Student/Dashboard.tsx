import React, { useState, useEffect } from 'react';
import { Clock, Search, Filter, Plus, Minus, Star, ShoppingCart, X, Package, CheckCircle, AlertCircle, Coffee, Shield, LogOut } from 'lucide-react';
import Header from '../../components/Layout/Header';
import Toast from '../../components/Common/Toast';
import { MenuItem, CartItem, Order } from '../../types';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

const StudentDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'menu' | 'orders'>('menu');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [updatingCart, setUpdatingCart] = useState<string | null>(null);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  useEffect(() => {
    fetchMenuItems();
    fetchCartItems();
    if (activeTab === 'orders') {
      fetchOrders();
    }
  }, [activeTab]);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) throw error;
      setMenuItems(data || []);
      console.log('Menu items fetched:', data?.length || 0);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          *,
          menu_item:menu_items(*)
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setCartItems(data || []);
    } catch (error) {
      console.error('Error fetching cart items:', error);
    }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items:order_items(
            *,
            menu_item:menu_items(*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const addToCart = async (menuItem: MenuItem) => {
    if (addingToCart === menuItem.id) return;
    
    // Check if item is out of stock
    if (menuItem.quantity_available <= 0) {
      showToast('This item is currently out of stock', 'error');
      return;
    }

    setAddingToCart(menuItem.id);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const existingItem = cartItems.find(item => item.menu_item_id === menuItem.id);

      if (existingItem) {
        // Item already exists in cart - increase quantity by 1
        const newQuantity = existingItem.quantity + 1;
        
        // Check if we have enough inventory
        if (menuItem.quantity_available < 1) {
          showToast('No more items available in stock', 'error');
          return;
        }
        
        // Update cart quantity first
        const { error: cartError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', existingItem.id);

        if (cartError) throw cartError;
        
      } else {
        // Add new item to cart
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            menu_item_id: menuItem.id,
            quantity: 1
          });

        if (error) throw error;
      }

      // Update inventory - decrease by 1
      const newInventoryQuantity = menuItem.quantity_available - 1;
      const { error: inventoryError } = await supabase
        .from('menu_items')
        .update({ quantity_available: newInventoryQuantity })
        .eq('id', menuItem.id);

      if (inventoryError) throw inventoryError;

      // Update local state immediately for better UX
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === menuItem.id 
            ? { ...item, quantity_available: newInventoryQuantity }
            : item
        )
      );
      
      // Refresh cart
      await fetchCartItems();
      
      showToast('Item added to cart!', 'success');
    } catch (error) {
      console.error('Error adding to cart:', error);
      showToast('Failed to add item to cart', 'error');
      // Refresh data to ensure consistency
      await Promise.all([fetchMenuItems(), fetchCartItems()]);
    } finally {
      setAddingToCart(null);
    }
  };

  const updateCartQuantity = async (cartItemId: string, newQuantity: number) => {
    if (updatingCart === cartItemId) return;
    
    setUpdatingCart(cartItemId);
    try {
      const cartItem = cartItems.find(item => item.id === cartItemId);
      if (!cartItem) return;

      const oldQuantity = cartItem.quantity;
      const quantityDifference = newQuantity - oldQuantity;

      if (newQuantity <= 0) {
        // Remove item from cart completely
        const { error: cartError } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', cartItemId);

        if (cartError) throw cartError;
        
        // Return all quantity back to inventory
        const currentMenuItem = menuItems.find(item => item.id === cartItem.menu_item_id);
        if (currentMenuItem) {
          const newInventoryQuantity = currentMenuItem.quantity_available + oldQuantity;
          const { error: inventoryError } = await supabase
            .from('menu_items')
            .update({ quantity_available: newInventoryQuantity })
            .eq('id', cartItem.menu_item_id);

          if (inventoryError) throw inventoryError;

          // Update local state
          setMenuItems(prevItems => 
            prevItems.map(item => 
              item.id === cartItem.menu_item_id 
                ? { ...item, quantity_available: newInventoryQuantity }
                : item
            )
          );
        }
        
        showToast('Item removed from cart', 'success');
      } else {
        // Check if we have enough inventory for the increase
        if (quantityDifference > 0) {
          const currentMenuItem = menuItems.find(item => item.id === cartItem.menu_item_id);
          if (!currentMenuItem) return;

          if (quantityDifference > currentMenuItem.quantity_available) {
            showToast(`Only ${currentMenuItem.quantity_available} more items available`, 'error');
            setUpdatingCart(null);
            return;
          }

          // Update inventory first (decrease available quantity)
          const newInventoryQuantity = currentMenuItem.quantity_available - quantityDifference;
          const { error: inventoryError } = await supabase
            .from('menu_items')
            .update({ quantity_available: newInventoryQuantity })
            .eq('id', cartItem.menu_item_id);

          if (inventoryError) throw inventoryError;

          // Update local state
          setMenuItems(prevItems => 
            prevItems.map(item => 
              item.id === cartItem.menu_item_id 
                ? { ...item, quantity_available: newInventoryQuantity }
                : item
            )
          );
        } else if (quantityDifference < 0) {
          // Quantity decreased, return items to inventory
          const currentMenuItem = menuItems.find(item => item.id === cartItem.menu_item_id);
          if (currentMenuItem) {
            const newInventoryQuantity = currentMenuItem.quantity_available + Math.abs(quantityDifference);
            const { error: inventoryError } = await supabase
              .from('menu_items')
              .update({ quantity_available: newInventoryQuantity })
              .eq('id', cartItem.menu_item_id);

            if (inventoryError) throw inventoryError;

            // Update local state
            setMenuItems(prevItems => 
              prevItems.map(item => 
                item.id === cartItem.menu_item_id 
                  ? { ...item, quantity_available: newInventoryQuantity }
                  : item
              )
            );
          }
        }

        // Update cart quantity
        const { error: cartError } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', cartItemId);

        if (cartError) throw cartError;
      }

      // Refresh cart
      await fetchCartItems();
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      showToast('Failed to update cart', 'error');
      // Refresh data to ensure consistency
      await Promise.all([fetchMenuItems(), fetchCartItems()]);
    } finally {
      setUpdatingCart(null);
    }
  };

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;

    setCheckoutLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const totalAmount = cartItems.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: totalAmount,
          status: 'pending',
          payment_status: 'completed'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = cartItems.map(item => ({
        order_id: order.id,
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        price: item.menu_item.price
      }));

      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // Clear cart (inventory is already updated when items were added to cart)
      const { error: clearCartError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (clearCartError) throw clearCartError;

      // Refresh cart and menu
      await Promise.all([fetchCartItems(), fetchMenuItems()]);

      setIsCartOpen(false);
      showToast('Order placed successfully! Your cosmic feast is being prepared!', 'success');

    } catch (error) {
      console.error('Error during checkout:', error);
      showToast('Failed to place order. Please try again.', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'processing': return 'status-processing';
      case 'ready': return 'status-ready';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'processing': return <Package className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'cancelled': return <AlertCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const isItemInCart = (menuItemId: string) => {
    return cartItems.find(item => item.menu_item_id === menuItemId);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...new Set(menuItems.map(item => item.category))];
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.menu_item.price * item.quantity), 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen modern-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 modern-spinner rounded-full animate-spin mx-auto mb-6"></div>
          <div className="flex items-center justify-center space-x-3">
            <Coffee className="w-6 h-6 text-indigo-500" />
            <span className="text-xl font-medium text-gray-200">Loading Menu...</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">Preparing your experience</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen modern-gradient">
      <Header
        title={activeTab === 'menu' ? 'Menu' : 'Your Orders'}
        showCart={true}
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />

      {/* Mobile Welcome Section - Only visible on mobile */}
      <div className="block md:hidden px-4 py-4 border-b border-white/10">
        <div className="glass-morphism rounded-xl p-4 border border-white/15">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-white mb-1">
                Welcome, {user?.full_name}!
              </h2>
              {user?.registration_number && (
                <p className="text-sm text-blue-400 mb-2">
                  Registration: {user.registration_number}
                </p>
              )}
              <p className="text-xs text-gray-400">
                Ready to explore our menu?
              </p>
            </div>
            <button
              onClick={signOut}
              className="p-2 text-gray-400 hover:text-red-400 transition-all duration-300 rounded-lg hover:bg-white/10 hover:scale-110 magnetic-hover ripple-effect ml-4"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs - Hidden on mobile */}
        <div className="mb-8 hidden md:block">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'menu'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'
              }`}
            >
              Your Orders
            </button>
          </nav>
        </div>

        {/* Mobile Tab Navigation - Only visible on mobile */}
        <div className="mb-6 block md:hidden">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('menu')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'menu'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'
              }`}
            >
              Menu
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300 hover:border-gray-400'
              }`}
            >
              Your Orders
            </button>
          </nav>
        </div>

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <>
            {/* Search and Filter */}
            <div className="mb-8 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for delicacies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="pl-10 pr-8 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none min-w-[200px]"
                >
                  {categories.map(category => (
                    <option key={category} value={category} className="bg-black text-white">
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Menu Items */}
            <div className="responsive-grid">
              {filteredItems.map((item) => {
                const isOutOfStock = item.quantity_available <= 0;
                const canAddToCart = item.quantity_available > 0;
                
                return (
                  <div key={item.id} className={`glass-card rounded-xl overflow-hidden hover-lift transition-all duration-300 flex flex-col ${isOutOfStock ? 'opacity-60' : ''}`}>
                    <div className="relative">
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-48 object-cover"
                      />
                      <div className="absolute top-2 right-2 glass-morphism px-2 py-1 rounded-lg flex items-center border border-white/20">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className="ml-1 text-sm font-medium text-white">{item.rating}</span>
                      </div>
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="glass-morphism px-4 py-2 rounded-lg border border-red-500/30">
                            <span className="text-red-400 font-semibold text-sm">OUT OF STOCK</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Card Content - Flex grow to push bottom content down */}
                    <div className="p-6 flex flex-col flex-grow">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                        <span className="text-2xl font-bold cosmic-text">₹{item.price}</span>
                      </div>
                      <p className="text-gray-400 mb-4 flex-grow">{item.description}</p>
                      
                      {/* Bottom section - Always at bottom */}
                      <div className="mt-auto">
                        <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                          <span>Serves: {item.serves}</span>
                          <span className={`font-medium ${isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>
                            Available: {item.quantity_available}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-indigo-400">{item.canteen_name}</span>
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!canAddToCart || addingToCart === item.id}
                            className={`flex items-center space-x-2 ios-button text-white px-4 py-2 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                              canAddToCart ? 'modern-button' : ''
                            }`}
                          >
                            <Plus className="w-4 h-4" />
                            <span>
                              {addingToCart === item.id ? 'Adding...' : 
                               isOutOfStock ? 'Out of Stock' : 
                               'Add to Cart'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 glass-morphism rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No delicacies found</h3>
                <p className="text-gray-400">Try adjusting your search or filter criteria</p>
              </div>
            )}
          </>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold text-white">Your Orders</h2>
              <div className="glass-morphism px-4 py-2 rounded-lg border border-white/20">
                <span className="text-sm text-gray-400">Total Orders: </span>
                <span className="font-semibold text-white">{orders.length}</span>
              </div>
            </div>

            {ordersLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 glass-spinner rounded-full animate-spin"></div>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 glass-morphism rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
                <p className="text-gray-400 mb-6">Your orders will appear here</p>
                <button
                  onClick={() => setActiveTab('menu')}
                  className="modern-button text-white px-6 py-2 rounded-lg transition-all duration-200"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => (
                  <div key={order.id} className="glass-morphism-strong rounded-xl p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Order #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-bold gradient-text">₹{order.total_amount}</p>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="font-medium text-white mb-3">Items:</h4>
                      <div className="space-y-3">
                        {order.order_items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-3 glass-morphism rounded-lg border border-white/10">
                            <img
                              src={item.menu_item.image_url}
                              alt={item.menu_item.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h5 className="font-medium text-white">{item.menu_item.name}</h5>
                              <p className="text-sm text-indigo-400">{item.menu_item.canteen_name}</p>
                            </div>
                            <div className="text-left">
                              <p className="font-medium text-white">x{item.quantity}</p>
                              <p className="text-sm text-gray-400">₹{item.price * item.quantity}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {order.status === 'ready' && (
                      <div className="toast-success rounded-lg p-4">
                        <div className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-400 mr-2" />
                          <span className="text-green-300 font-medium">Your order is ready for pickup!</span>
                        </div>
                      </div>
                    )}

                    {order.status === 'processing' && (
                      <div className="status-processing rounded-lg p-4">
                        <div className="flex items-center">
                          <Package className="w-5 h-5 text-indigo-400 mr-2" />
                          <span className="text-indigo-300 font-medium">Your order is being prepared by our chefs</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setIsCartOpen(false)} 
          />
          <div className="absolute right-0 top-0 h-full w-full max-w-md glass-morphism-strong flex flex-col border-l border-white/20">
            {/* Cart Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/20">
              <h2 className="text-xl font-semibold text-white">Your Cart</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Cart Content */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {cartItems.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Your cart is empty</h3>
                  <p className="text-gray-400">Add some delicacies to get started!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item) => {
                    const currentMenuItem = menuItems.find(menuItem => menuItem.id === item.menu_item_id);
                    const currentAvailable = currentMenuItem?.quantity_available || 0;
                    const canIncrease = currentAvailable > 0;
                    
                    return (
                      <div key={item.id} className="glass-morphism rounded-lg p-4 border border-white/10">
                        <div className="flex items-center space-x-4">
                          <img
                            src={item.menu_item.image_url}
                            alt={item.menu_item.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-white">{item.menu_item.name}</h4>
                            <p className="text-sm text-cosmic-400">₹{item.menu_item.price}</p>
                            <p className="text-xs text-gray-500">{item.menu_item.canteen_name}</p>
                            <p className="text-xs text-gray-500">Available: {currentAvailable}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                              disabled={updatingCart === item.id}
                              className="w-8 h-8 flex items-center justify-center rounded-full glass-morphism hover:bg-white/10 transition-colors disabled:opacity-50 border border-white/20"
                            >
                              <Minus className="w-4 h-4 text-white" />
                            </button>
                            <span className="w-8 text-center font-medium text-white">
                              {updatingCart === item.id ? '...' : item.quantity}
                            </span>
                            <button
                              onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                              disabled={updatingCart === item.id || !canIncrease}
                              className="w-8 h-8 flex items-center justify-center rounded-full glass-morphism hover:bg-white/10 transition-colors disabled:opacity-50 border border-white/20"
                            >
                              <Plus className="w-4 h-4 text-white" />
                            </button>
                          </div>
                        </div>
                        {!canIncrease && (
                          <div className="mt-2 text-xs text-yellow-400">
                            No more items available in stock
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="border-t border-white/20 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-white">Total:</span>
                  <span className="text-2xl font-bold gradient-text">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className="w-full modern-button text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <Shield className="w-5 h-5" />
                  <span>{checkoutLoading ? 'Processing...' : 'Proceed to Checkout'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;