import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  XCircle, 
  Loader,
  Brain,
  Shield,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

const AuthPage = ({ setIsAuthenticated }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // success, error, info
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage('');
        setMessageType('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Password strength checker
  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear validation errors when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Update password strength for signup
    if (name === 'password' && !isLogin) {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const validateForm = () => {
    const errors = {};
    const { name, email, password } = formData;

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation
    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Name validation for signup
    if (!isLogin) {
      if (!name) {
        errors.name = 'Full name is required';
      } else if (name.length < 2) {
        errors.name = 'Name must be at least 2 characters';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Please correct the errors below');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const { email, password, name } = formData;

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        setIsAuthenticated(true);
        setMessage('Welcome back! Redirecting to dashboard...');
        setMessageType('success');
        setTimeout(() => navigate('/'), 1500);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, {
          displayName: name,
        });
        setMessage('Account created successfully! Please sign in to continue.');
        setMessageType('success');
        setIsLogin(true);
        setFormData({ name: '', email: '', password: '' });
      }
    } catch (error) {
      let errorMessage = 'Authentication failed. Please try again.';
      
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          errorMessage = 'Invalid email or password. Please check your credentials.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'An account with this email already exists. Please sign in instead.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Please choose a stronger password.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection and try again.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many failed attempts. Please try again later.';
          break;
        default:
          errorMessage = error.message;
      }
      
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setMessage('Please enter your email address first');
      setMessageType('error');
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setMessage('Password reset email sent! Check your inbox.');
      setMessageType('success');
      setShowForgotPassword(false);
    } catch (error) {
      setMessage('Failed to send reset email. Please try again.');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
      case 3:
        return 'bg-yellow-500';
      case 4:
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  const getPasswordStrengthText = () => {
    switch (passwordStrength) {
      case 0:
      case 1:
        return 'WEAK';
      case 2:
      case 3:
        return 'MEDIUM';
      case 4:
      case 5:
        return 'STRONG';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-white text-black flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-black text-white flex items-center justify-center mx-auto mb-6">
            <Brain className="h-10 w-10" />
          </div>
          
          <h1 className="text-3xl font-black mb-4" style={{ 
            fontFamily: '"Helvetica Neue", "Arial Black", sans-serif' 
          }}>
            {isLogin ? 'WELCOME BACK' : 'JOIN MINDOASIS'}
          </h1>
          
          <div className="w-16 h-1 bg-black mx-auto mb-4"></div>
          
          <p className="text-gray-600 font-medium">
            {isLogin 
              ? 'Sign in to access your wellness dashboard' 
              : 'Create your account and start your wellness journey'
            }
          </p>
        </div>

        {/* Auth Form */}
        <div className="bg-white border-4 border-black p-8">
          
          {/* Tab Switcher */}
          <div className="flex mb-8 border-2 border-black">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setFormData({ name: '', email: '', password: '' });
                setValidationErrors({});
                setMessage('');
              }}
              className={`flex-1 py-3 font-black text-sm transition-all ${
                isLogin 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              SIGN IN
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setFormData({ name: '', email: '', password: '' });
                setValidationErrors({});
                setMessage('');
              }}
              className={`flex-1 py-3 font-black text-sm transition-all ${
                !isLogin 
                  ? 'bg-black text-white' 
                  : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              SIGN UP
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            
            {/* Name Field (Sign Up Only) */}
            {!isLogin && (
              <div>
                <div className={`flex items-center border-2 p-4 bg-gray-50 transition-colors ${
                  validationErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-300 focus-within:border-black'
                }`}>
                  <User className="h-5 w-5 text-gray-600 mr-3" />
                  <input
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    className="w-full bg-transparent border-none focus:outline-none font-medium"
                    value={formData.name}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>
                {validationErrors.name && (
                  <p className="mt-2 text-sm text-red-600 flex items-center">
                    <XCircle className="h-4 w-4 mr-1" />
                    {validationErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <div className={`flex items-center border-2 p-4 bg-gray-50 transition-colors ${
                validationErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300 focus-within:border-black'
              }`}>
                <Mail className="h-5 w-5 text-gray-600 mr-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  className="w-full bg-transparent border-none focus:outline-none font-medium"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={loading}
                />
              </div>
              {validationErrors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {validationErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className={`flex items-center border-2 p-4 bg-gray-50 transition-colors ${
                validationErrors.password ? 'border-red-500 bg-red-50' : 'border-gray-300 focus-within:border-black'
              }`}>
                <Lock className="h-5 w-5 text-gray-600 mr-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Password"
                  className="w-full bg-transparent border-none focus:outline-none font-medium"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="ml-3 text-gray-600 hover:text-black transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {validationErrors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center">
                  <XCircle className="h-4 w-4 mr-1" />
                  {validationErrors.password}
                </p>
              )}

              {/* Password Strength Indicator (Sign Up Only) */}
              {!isLogin && formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold">PASSWORD STRENGTH</span>
                    <span className={`text-xs font-black ${
                      passwordStrength >= 4 ? 'text-green-600' : 
                      passwordStrength >= 2 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {getPasswordStrengthText()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 h-2">
                    <div 
                      className={`h-2 transition-all duration-300 ${getPasswordStrengthColor()}`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Forgot Password Link */}
            {isLogin && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-gray-600 hover:text-black font-medium hover:underline transition-colors"
                  disabled={loading}
                >
                  Forgot your password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || (!isLogin && passwordStrength < 2)}
              className="w-full bg-black text-white py-4 font-black text-sm hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
            >
              {loading ? (
                <Loader className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <ArrowRight className="h-5 w-5 mr-2" />
              )}
              {loading ? 'PROCESSING...' : isLogin ? 'SIGN IN' : 'CREATE ACCOUNT'}
            </button>
          </form>

          {/* Message Display */}
          {message && (
            <div className={`mt-6 p-4 border-2 flex items-start space-x-3 ${
              messageType === 'success' 
                ? 'bg-green-50 border-green-500 text-green-800' :
              messageType === 'error' 
                ? 'bg-red-50 border-red-500 text-red-800' :
                'bg-blue-50 border-blue-500 text-blue-800'
            }`}>
              {messageType === 'success' ? (
                <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : messageType === 'error' ? (
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              ) : (
                <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
              )}
              <p className="font-medium text-sm">{message}</p>
            </div>
          )}
        </div>

        {/* Security Notice */}
        <div className="mt-8 p-6 bg-gray-100 border-2 border-gray-300">
          <div className="flex items-center space-x-3 mb-3">
            <Shield className="h-5 w-5 text-gray-700" />
            <h3 className="font-black text-sm">SECURITY & PRIVACY</h3>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            Your data is encrypted and protected. We never share your personal information. 
            All communications are secured with industry-standard encryption.
          </p>
        </div>

        {/* Forgot Password Modal */}
        {showForgotPassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white border-4 border-black p-8 max-w-md w-full">
              <h3 className="text-xl font-black mb-4">RESET PASSWORD</h3>
              <p className="text-sm text-gray-600 mb-6">
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={handleForgotPassword}
                  disabled={loading || !formData.email}
                  className="flex-1 bg-black text-white py-3 font-black text-sm hover:bg-gray-800 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'SENDING...' : 'SEND RESET LINK'}
                </button>
                <button
                  onClick={() => setShowForgotPassword(false)}
                  className="px-6 border-2 border-black text-black py-3 font-black text-sm hover:bg-gray-100 transition-colors"
                  disabled={loading}
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
