import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { 
  Smile, 
  Gamepad2, 
  Brain, 
  Home, 
  LogOut, 
  Menu, 
  X, 
  User, 
  Settings,
  Shield,
  Zap,
  Activity,
  ChevronRight
} from 'lucide-react';
import HomePage from './components/HomePage';
import AdultsSection from './components/AdultsSection';
import KidsSection from './components/KidsSection';
import NavButton from './components/NavButton';
import AuthPage from './components/AuthPage';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';
import FloatingChatButton from './components/FloatingChatButton';
import DigitalTwinDashboard from './components/DigitalTwinDashboard';
import { ThemeContext, ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import { auth } from './firebase';

const App = () => {
  const { theme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      setIsAuthenticated(!!user);
      if (user) {
        setUserProfile({
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          email: user.email,
          photoURL: user.photoURL
        });
      } else {
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setIsAuthenticated(false);
      setUserProfile(null);
      navigate('/');
      setShowUserMenu(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'MENTAL WELLNESS PLATFORM';
      case '/adults':
        return 'ADULT WELLNESS CENTER';
      case '/digital-twin':
        return 'DIGITAL TWIN DASHBOARD';
      case '/kids':
        return 'KIDS BRAIN TRAINING';
      case '/auth':
        return 'SIGN IN';
      default:
        return 'MINDOASIS';
    }
  };

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  // Enhanced loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-8">
            <Brain className="h-16 w-16 text-black mx-auto animate-pulse" />
            <div className="absolute inset-0 border-2 border-black rounded-full animate-spin"></div>
          </div>
          <h1 className="text-3xl font-black mb-4" style={{ 
            fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
          }}>
            MINDOASIS
          </h1>
          <div className="w-24 h-1 bg-black mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Initializing your wellness experience...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-black font-sans antialiased">
      {/* Enhanced Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b-4 border-black shadow-lg">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-black text-white flex items-center justify-center">
                <Brain className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black leading-tight" style={{ 
                  fontFamily: '"Helvetica Neue", "Arial Black", sans-serif',
                  letterSpacing: '-0.02em'
                }}>
                  MINDOASIS
                </h1>
                <p className="text-xs font-medium opacity-60 leading-none">
                  {getPageTitle()}
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link 
                to="/" 
                className={`flex items-center space-x-2 px-4 py-2 font-bold text-sm transition-all duration-200 ${
                  isActivePage('/') 
                    ? 'bg-black text-white' 
                    : 'hover:bg-gray-100'
                }`}
              >
                <Home className="h-4 w-4" />
                <span>HOME</span>
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link 
                    to="/adults" 
                    className={`flex items-center space-x-2 px-4 py-2 font-bold text-sm transition-all duration-200 ${
                      isActivePage('/adults') 
                        ? 'bg-black text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Smile className="h-4 w-4" />
                    <span>ADULTS</span>
                  </Link>
                  
                  <Link 
                    to="/kids" 
                    className={`flex items-center space-x-2 px-4 py-2 font-bold text-sm transition-all duration-200 ${
                      isActivePage('/kids') 
                        ? 'bg-black text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    
                    <Gamepad2 className="h-4 w-4" />
                    <span>KIDS</span>
                  </Link>
                  <Link 
                    to="/digital-twin" 
                    className={`flex items-center space-x-2 px-4 py-2 font-bold text-sm transition-all duration-200 ${
                      isActivePage('/digital-twin') 
                        ? 'bg-black text-white' 
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <Brain className="h-4 w-4" />
                    <span>DIGITAL TWIN</span>
                  </Link>
                </>
              )}
            </div>

            {/* User Menu / Auth Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <ThemeToggle />
              
              {isAuthenticated ? (
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 bg-gray-100 hover:bg-gray-200 px-4 py-2 transition-colors"
                  >
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-sm font-black">
                      {userProfile?.displayName?.charAt(0) || <User className="h-4 w-4" />}
                    </div>
                    <span className="font-bold text-sm">{userProfile?.displayName || 'USER'}</span>
                  </button>
                  
                  {showUserMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white border-2 border-black shadow-lg min-w-48">
                      <div className="p-4 border-b border-gray-200">
                        <p className="font-bold text-sm">{userProfile?.displayName}</p>
                        <p className="text-xs text-gray-600">{userProfile?.email}</p>
                      </div>
                      
                      <div className="p-2">
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Settings</span>
                        </button>
                        <button className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center space-x-2">
                          <Activity className="h-4 w-4" />
                          <span>Progress</span>
                        </button>
                        <hr className="my-2" />
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link 
                  to="/auth" 
                  className="bg-black text-white px-6 py-3 font-black text-sm hover:bg-gray-800 transition-colors flex items-center space-x-2"
                >
                  <Shield className="h-4 w-4" />
                  <span>SIGN IN</span>
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t-2 border-gray-200">
              <div className="space-y-2">
                <Link 
                  to="/" 
                  className={`flex items-center justify-between px-4 py-3 font-bold text-sm transition-all ${
                    isActivePage('/') ? 'bg-black text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Home className="h-5 w-5" />
                    <span>HOME</span>
                  </div>
                  {isActivePage('/') && <ChevronRight className="h-4 w-4" />}
                </Link>
                
                {isAuthenticated && (
                  <>
                    <Link 
                      to="/adults" 
                      className={`flex items-center justify-between px-4 py-3 font-bold text-sm transition-all ${
                        isActivePage('/adults') ? 'bg-black text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Smile className="h-5 w-5" />
                        <span>ADULTS</span>
                      </div>
                      {isActivePage('/adults') && <ChevronRight className="h-4 w-4" />}
                    </Link>
                    
                    <Link 
                      to="/kids" 
                      className={`flex items-center justify-between px-4 py-3 font-bold text-sm transition-all ${
                        isActivePage('/kids') ? 'bg-black text-white' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Gamepad2 className="h-5 w-5" />
                        <span>KIDS</span>
                      </div>
                      {isActivePage('/kids') && <ChevronRight className="h-4 w-4" />}
                    </Link>
                  </>
                )}
                
                <div className="border-t border-gray-200 mt-4 pt-4">
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <div className="px-4 py-2 bg-gray-100">
                        <p className="font-bold text-sm">{userProfile?.displayName}</p>
                        <p className="text-xs text-gray-600">{userProfile?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center space-x-3 font-bold text-sm"
                      >
                        <LogOut className="h-5 w-5" />
                        <span>SIGN OUT</span>
                      </button>
                    </div>
                  ) : (
                    <Link 
                      to="/auth" 
                      className="flex items-center space-x-3 px-4 py-3 bg-black text-white hover:bg-gray-800 font-bold text-sm"
                    >
                      <Shield className="h-5 w-5" />
                      <span>SIGN IN</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow pt-20 min-h-screen">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth" element={<AuthPage setIsAuthenticated={setIsAuthenticated} />} />
          <Route
            path="/adults"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <AdultsSection />
              </ProtectedRoute>
            }
          />
          <Route
            path="/digital-twin"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <DigitalTwinDashboard userData={userProfile} onClose={() => setIsChatbotOpen(false)} />
              </ProtectedRoute>
            }/>
          <Route

            path="/kids"
            element={
              <ProtectedRoute isAuthenticated={isAuthenticated}>
                <KidsSection />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Floating Chat Button */}
      {!isChatbotOpen && isAuthenticated && (
        <FloatingChatButton onClick={() => setIsChatbotOpen(true)} />
      )}

      {/* Chatbot */}
      {isChatbotOpen && isAuthenticated && (
        <div className="fixed bottom-4 right-4 z-50">
          <Chatbot onClose={() => setIsChatbotOpen(false)} />
        </div>
      )}

      {/* Enhanced Footer */}
      <footer className="bg-black text-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-white text-black flex items-center justify-center">
                  <Brain className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-black" style={{ 
                  fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
                }}>
                  MINDOASIS
                </h3>
              </div>
              <p className="text-sm text-gray-300 mb-4 max-w-md">
                Transforming mental wellness through technology. 
                Providing evidence-based tools for adults and children.
              </p>
              <div className="flex items-center space-x-4 text-xs text-gray-400">
                <span>© 2025 MindOasis</span>
                <span>•</span>
                <span>All Rights Reserved</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-black text-sm mb-3">PLATFORM</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                <li><Link to="/adults" className="hover:text-white transition-colors">Adults</Link></li>
                <li><Link to="/kids" className="hover:text-white transition-colors">Kids</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-black text-sm mb-3">SUPPORT</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 mt-8 pt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-400">
              <Zap className="h-4 w-4" />
              <span>POWERED BY AI • BACKED BY SCIENCE • DESIGNED FOR WELLNESS</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Click outside handler for user menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </div>
  );
};

const AppWrapper = () => (
  <Router basename="/Mental-Health-Application">
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </Router>
);

export default AppWrapper;
