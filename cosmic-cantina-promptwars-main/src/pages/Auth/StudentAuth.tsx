import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Users, ArrowLeft, Mail, Lock, User, Phone, CreditCard, Shield, UserCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const StudentAuth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    registrationNumber: '',
    mobileNumber: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(formData.email, formData.password);
        navigate('/student/dashboard');
      } else {
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Passwords do not match');
        }
        await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          'student',
          formData.mobileNumber,
          formData.registrationNumber
        );
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen modern-gradient relative overflow-hidden">
      {/* Enhanced Parallax Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Dynamic Background Layers */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(ellipse at ${mousePosition.x}% ${mousePosition.y}%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)`,
            transform: `translateY(${scrollY * 0.3}px)`,
            transition: 'background 0.3s ease',
          }}
        />
        <div 
          className="absolute inset-0 opacity-15"
          style={{
            background: `radial-gradient(ellipse at ${100 - mousePosition.x}% ${100 - mousePosition.y}%, rgba(139, 92, 246, 0.12) 0%, transparent 60%)`,
            transform: `translateY(${scrollY * 0.2}px)`,
            transition: 'background 0.3s ease',
          }}
        />
        
        {/* Floating Particles */}
        {[...Array(10)].map((_, i) => (
          <div
            key={i}
            className="absolute floating-element"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              background: i % 4 === 0 ? '#6366f1' : i % 4 === 1 ? '#8b5cf6' : i % 4 === 2 ? '#22c55e' : '#f59e0b',
              borderRadius: '50%',
              animationDelay: `${Math.random() * 10}s`,
              opacity: 0.3,
              filter: 'blur(0.5px)',
              transform: `translate(${(mousePosition.x - 50) * 0.2}px, ${(mousePosition.y - 50) * 0.2}px) translateY(${scrollY * 0.1}px)`,
              transition: 'transform 0.4s ease',
              boxShadow: '0 0 8px currentColor',
            }}
          />
        ))}

        {/* Geometric Shapes */}
        <div 
          className="absolute top-20 left-10 w-32 h-32 border border-indigo-500/20 rounded-full"
          style={{
            transform: `rotate(${mousePosition.x * 0.5}deg) translateY(${scrollY * 0.15}px)`,
            transition: 'transform 0.3s ease',
          }}
        />
        <div 
          className="absolute bottom-20 right-10 w-24 h-24 border border-purple-500/20 rounded-lg"
          style={{
            transform: `rotate(${mousePosition.y * 0.3}deg) translateY(${scrollY * -0.1}px)`,
            transition: 'transform 0.3s ease',
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-md w-full">
          {/* Header with Enhanced Animations */}
          <div className="text-center mb-8">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-400 hover:text-indigo-300 mb-6 transition-all duration-500 hover-lift group"
              style={{
                transform: `translateY(${scrollY * 0.05}px)`,
              }}
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
            
            <div 
              className="flex items-center justify-center mb-6"
              style={{
                transform: `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.02}deg) rotateY(${(mousePosition.x - 50) * 0.02}deg)`,
                transition: 'transform 0.3s ease',
              }}
            >
              <div className="w-16 h-16 glass-morphism rounded-xl flex items-center justify-center mr-4 hover:scale-110 transition-all duration-500 group relative overflow-hidden" style={{ boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)' }}>
                <Users className="w-8 h-8 text-white group-hover:scale-110 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <span className="text-3xl font-bold text-white">Student Portal</span>
            </div>
            
            <p 
              className="text-gray-300 text-lg leading-relaxed"
              style={{
                transform: `translateY(${scrollY * 0.03}px)`,
              }}
            >
              {isLogin ? 'Welcome back! Sign in to your account' : 'Join our community - Create your student account'}
            </p>
          </div>

          {/* Enhanced Form Container */}
          <div 
            className="auth-form-container rounded-2xl p-8 relative overflow-hidden"
            style={{
              transform: `perspective(1000px) rotateX(${(mousePosition.y - 50) * 0.01}deg) rotateY(${(mousePosition.x - 50) * 0.01}deg) translateY(${scrollY * 0.02}px)`,
              transition: 'transform 0.3s ease',
            }}
          >
            {/* Animated Background Overlay */}
            <div 
              className="absolute inset-0 opacity-10"
              style={{
                background: `linear-gradient(${mousePosition.x * 3.6}deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)`,
                transition: 'background 0.3s ease',
              }}
            />
            
            <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
              {error && (
                <div className="toast-error rounded-lg p-4 animate-in slide-in-from-top-2 duration-300">
                  <p className="text-sm">{error}</p>
                </div>
              )}

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'fullName' ? 'text-indigo-400 scale-110' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                      onFocus={() => setFocusedField('fullName')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:bg-white/8"
                      placeholder="Enter your full name"
                      style={{
                        transform: focusedField === 'fullName' ? 'scale(1.02)' : 'scale(1)',
                      }}
                    />
                  </div>
                </div>
              )}

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                    Registration Number
                  </label>
                  <div className="relative">
                    <CreditCard className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'registrationNumber' ? 'text-indigo-400 scale-110' : 'text-gray-400'
                    }`} />
                    <input
                      type="text"
                      required
                      value={formData.registrationNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, registrationNumber: e.target.value }))}
                      onFocus={() => setFocusedField('registrationNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:bg-white/8"
                      placeholder="Enter your registration number"
                      style={{
                        transform: focusedField === 'registrationNumber' ? 'scale(1.02)' : 'scale(1)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-medium text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                    focusedField === 'email' ? 'text-indigo-400 scale-110' : 'text-gray-400'
                  }`} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:bg-white/8"
                    placeholder="Enter your email"
                    style={{
                      transform: focusedField === 'email' ? 'scale(1.02)' : 'scale(1)',
                    }}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'mobileNumber' ? 'text-indigo-400 scale-110' : 'text-gray-400'
                    }`} />
                    <input
                      type="tel"
                      required
                      value={formData.mobileNumber}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobileNumber: e.target.value }))}
                      onFocus={() => setFocusedField('mobileNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:bg-white/8"
                      placeholder="Enter your mobile number"
                      style={{
                        transform: focusedField === 'mobileNumber' ? 'scale(1.02)' : 'scale(1)',
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="group">
                <label className="block text-sm font-medium text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                  Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                    focusedField === 'password' ? 'text-indigo-400 scale-110' : 'text-gray-400'
                  }`} />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:bg-white/8"
                    placeholder="Enter your password"
                    style={{
                      transform: focusedField === 'password' ? 'scale(1.02)' : 'scale(1)',
                    }}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="group">
                  <label className="block text-sm font-medium text-gray-200 mb-2 group-hover:text-indigo-300 transition-colors">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-3 h-5 w-5 transition-all duration-300 ${
                      focusedField === 'confirmPassword' ? 'text-indigo-400 scale-110' : 'text-gray-400'
                    }`} />
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className="w-full pl-10 pr-4 py-3 modern-input rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-white placeholder-gray-400 transition-all duration-300 hover:bg-white/8"
                      placeholder="Confirm your password"
                      style={{
                        transform: focusedField === 'confirmPassword' ? 'scale(1.02)' : 'scale(1)',
                      }}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full modern-button text-white py-3 px-4 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center space-x-2 group relative overflow-hidden transition-all duration-300 hover:scale-105"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Join the Community'}</span>
                {!loading && <UserCheck className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-all duration-300 hover:scale-105 relative group"
              >
                <span className="relative z-10">
                  {isLogin ? "Don't have an account? Join the Community" : "Already have an account? Sign in"}
                </span>
                <div className="absolute inset-0 bg-indigo-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 -m-2" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentAuth;