import React, { useState, useEffect } from 'react';
import { LogOut, User, ShoppingCart, Utensils, Crown, Shield, Coffee, ChefHat } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import ThemeToggle from '../Common/ThemeToggle';

interface HeaderProps {
  title: string;
  showCart?: boolean;
  cartCount?: number;
  onCartClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ title, showCart = false, cartCount = 0, onCartClick }) => {
  const { user, signOut } = useAuth();
  const [scrollY, setScrollY] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <header className="glass-morphism border-b border-black/10 dark:border-white/15 sticky top-0 z-30 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 py-4">
          <div className="flex items-center">
            <div 
              className="flex-shrink-0 flex items-center group"
              style={{
                transform: `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.01}deg) rotateY(${(mousePosition.x - 50) * 0.01}deg)`,
                transition: 'transform 0.3s ease',
              }}
            >
              <div className="w-16 h-16 flex items-center justify-center mr-4 group-hover:scale-110 transition-all duration-500 relative overflow-hidden glass-morphism rounded-2xl">
                <ChefHat className="w-8 h-8 text-orange-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 to-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              </div>
              <div>
                <span className="text-xl font-bold gradient-text tracking-wide">FoodieHub</span>
                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">Premium Food Ordering</div>
              </div>
            </div>
            <div 
              className="ml-8 hidden md:block"
              style={{
                transform: `translateY(${scrollY * 0.02}px)`,
              }}
            >
              <h1 className="text-lg font-medium text-gray-700 dark:text-gray-200">{title}</h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            
            {showCart && (
              <button
                onClick={onCartClick}
                className="relative p-3 text-gray-600 dark:text-gray-400 hover:text-orange-500 transition-all duration-300 hover-lift rounded-xl glass-morphism group"
                style={{
                  transform: `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.005}deg) rotateY(${(mousePosition.x - 50) * 0.005}deg)`,
                  transition: 'transform 0.3s ease',
                }}
              >
                <ShoppingCart className="w-6 h-6 group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold pulse-glow bounce-in">
                    {cartCount}
                  </span>
                )}
              </button>
            )}
            
            {/* Desktop User Info */}
            <div 
              className="hidden md:flex items-center space-x-3 glass-morphism-strong rounded-xl px-4 py-3 border border-black/10 dark:border-white/15 hover-lift group"
              style={{
                transform: `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.005}deg) rotateY(${(mousePosition.x - 50) * 0.005}deg)`,
                transition: 'transform 0.3s ease',
              }}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 ${
                  user?.role === 'staff' 
                    ? 'bg-orange-500/15' 
                    : 'bg-red-500/15'
                }`} style={{ 
                  boxShadow: user?.role === 'staff' 
                    ? '0 0 15px rgba(249, 115, 22, 0.3)' 
                    : '0 0 15px rgba(220, 38, 38, 0.3)' 
                }}>
                  {user?.role === 'staff' ? (
                    <Crown className="w-5 h-5 text-orange-500 group-hover:rotate-12 transition-transform duration-300" />
                  ) : (
                    <Shield className="w-5 h-5 text-red-500 group-hover:rotate-12 transition-transform duration-300" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-black dark:text-white group-hover:text-orange-500 transition-colors">{user?.full_name}</span>
                  {user?.role === 'student' && user?.registration_number && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{user.registration_number}</div>
                  )}
                  <div className={`text-xs capitalize font-medium transition-colors ${
                    user?.role === 'staff' ? 'text-orange-500 group-hover:text-orange-400' : 'text-red-500 group-hover:text-red-400'
                  }`}>
                    {user?.role === 'staff' ? 'Staff Member' : 'Student'}
                  </div>
                </div>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-all duration-300 rounded-lg hover:scale-110"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;