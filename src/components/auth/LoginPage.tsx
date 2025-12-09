
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, Shield, BarChart3, Loader2, Settings, Mail, User, Eye, EyeOff } from 'lucide-react';
import NetworkDiagnostic from '../debug/NetworkDiagnostic';

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  
  // New state for flexible authentication system
  const [loginMethod, setLoginMethod] = useState<'email' | 'username' | 'both'>('email');
  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Username validation function
  const validateUsername = (username: string): boolean => {
    // Username should be at least 3 characters, alphanumeric and underscores allowed
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  // Handle input validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    setEmailError('');
    if (value && !validateEmail(value)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    setUsernameError('');
    if (value && !validateUsername(value)) {
      setUsernameError('Username must be 3-20 characters, letters, numbers, and underscores only');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setUsernameError('');
    
    // Validate based on selected login method
    let hasValidEmail = false;
    let hasValidUsername = false;
    
    if (loginMethod === 'email' || loginMethod === 'both') {
      const trimmedEmail = email.trim();
      if (!trimmedEmail) {
        setEmailError('Email is required');
        return;
      }
      if (!validateEmail(trimmedEmail)) {
        setEmailError('Please enter a valid email address');
        return;
      }
      hasValidEmail = true;
    }
    
    if (loginMethod === 'username' || loginMethod === 'both') {
      const trimmedUsername = username.trim();
      if (!trimmedUsername) {
        setUsernameError('Username is required');
        return;
      }
      if (!validateUsername(trimmedUsername)) {
        setUsernameError('Username must be 3-20 characters, letters, numbers, and underscores only');
        return;
      }
      hasValidUsername = true;
    }
    
    const trimmedPassword = password.trim();
    if (!trimmedPassword) {
      setError('Password is required');
      return;
    }
    if (trimmedPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Additional validation for 'both' method: ensure username and email refer to the same user
    if (loginMethod === 'both' && hasValidEmail && hasValidUsername) {
      // To avoid backend mismatch false-negatives, prefer a single identifier.
      // We will send only the username when both are provided.
    }
    
    // Construct credentials object based on what's provided
    const credentials: { email?: string; username?: string; password: string } = {
      password: trimmedPassword
    };
    
    if (loginMethod === 'both') {
      // Prefer username-only to reduce intermittent backend validation errors
      if (hasValidUsername) credentials.username = username.trim();
    } else {
      if (hasValidEmail) credentials.email = email.trim().toLowerCase();
      if (hasValidUsername) credentials.username = username.trim();
    }
    
    try {
      const success = await login(credentials);
      if (!success) {
        // Enhanced error message for 'both' method
        if (loginMethod === 'both') {
          setError('Invalid credentials or username and email do not belong to the same user. Please try again.');
        } else {
          setError('Invalid credentials. Please try again.');
        }
      }
    } catch (error) {
      // Handle any network or other errors
      if (loginMethod === 'both') {
        setError('Authentication failed. Please verify that your username and email belong to the same account.');
      } else {
        setError('Authentication failed. Please check your credentials and try again.');
      }
    }
  };

  const demoCredentials = [
    { role: 'ADMIN', email: 'admin@company.com', icon: Shield },
    { role: 'HR Manager', email: 'hr@company.com', icon: Users },
    { role: 'Department Manager', email: 'manager@company.com', icon: BarChart3 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding & Features */}
        <div className="space-y-8 text-center lg:text-left">
          <div className="space-y-4">
            <div className="flex items-center justify-center lg:justify-start space-x-3">
              <img 
                src="/logo.png" 
                alt="Company Logo" 
                className="h-10 w-auto"
              />
              <h1 className="text-3xl font-bold text-gray-900">HR System</h1>
            </div>
            <p className="text-xl text-gray-600 max-w-lg">
              Streamline your employee evaluation process with our comprehensive management platform
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <Users className="h-6 w-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Employee Management</h3>
              <p className="text-sm text-gray-600">Manage employee data and profiles</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <BarChart3 className="h-6 w-6 text-teal-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Performance Tracking</h3>
              <p className="text-sm text-gray-600">Track evaluations and objectives</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <Shield className="h-6 w-6 text-purple-600 mb-2" />
              <h3 className="font-semibold text-gray-900">Role-based Access</h3>
              <p className="text-sm text-gray-600">Secure, permission-based system</p>
            </div>
          </div>

          {/* API Integration Info */}
          {/* <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-3">API Integration Ready</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <p>✅ Authentication with JWT tokens</p>
              <p>✅ Employee management</p>
              <p>✅ Company & department handling</p>
              <p>✅ Evaluation system integration</p>
              <p className="text-xs text-blue-600 mt-2">
                Configure your backend API URL in environment variables
              </p>
            </div>
          </div> */}

          {/* Demo Credentials */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <h4 className="font-semibold text-blue-900 mb-3">Demo Credentials:</h4>
            <div className="space-y-2 text-sm text-blue-700">
              <div>
                <p className="font-medium">Admin:</p>
                <p>conan@gmail.com</p>
                <p>Username: conan</p>
                <p>Password: #$123456</p>
              </div>
              <div>
                <p className="font-medium">HR Manager:</p>
                <p>admin@company.com</p>
                <p>Username: admin</p>
                <p>Password: password</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Login Method Toggle */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Login Method</Label>
                  <div className="relative bg-gray-100 rounded-lg p-1 grid grid-cols-3 gap-1">
                    <button
                      type="button"
                      onClick={() => setLoginMethod('email')}
                      className={`
                        relative flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-all duration-300 ease-in-out
                        ${loginMethod === 'email' 
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                      aria-pressed={loginMethod === 'email'}
                      aria-label="Login with email only"
                    >
                      <Mail className="h-3 w-3 mr-1" />
                      Email
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('username')}
                      className={`
                        relative flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-all duration-300 ease-in-out
                        ${loginMethod === 'username' 
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                      aria-pressed={loginMethod === 'username'}
                      aria-label="Login with username only"
                    >
                      <User className="h-3 w-3 mr-1" />
                      Username
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginMethod('both')}
                      className={`
                        relative flex items-center justify-center px-2 py-2 rounded-md text-xs font-medium transition-all duration-300 ease-in-out
                        ${loginMethod === 'both' 
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-blue-200' 
                          : 'text-gray-600 hover:text-gray-900'
                        }
                      `}
                      aria-pressed={loginMethod === 'both'}
                      aria-label="Login with both email and username"
                    >
                      <div className="flex items-center">
                        <Mail className="h-3 w-3" />
                        <User className="h-3 w-3 -ml-1" />
                      </div>
                      <span className="ml-1">Both</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Input Fields */}
                <div className="space-y-4">
                  {/* Email Input - Show for 'email' and 'both' methods */}
                  {(loginMethod === 'email' || loginMethod === 'both') && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email Address *
                      </Label>
                      <div className="relative">
                        <Input
                          id="email"
                          type="email"
                          placeholder="Enter your email address"
                          value={email}
                          onChange={(e) => handleEmailChange(e.target.value)}
                          disabled={isLoading}
                          className={`h-11 pl-10 ${emailError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          aria-describedby={emailError ? "email-error" : undefined}
                          aria-invalid={!!emailError}
                        />
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      {emailError && (
                        <p id="email-error" className="text-red-600 text-sm mt-1" role="alert">
                          {emailError}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Username Input - Show for 'username' and 'both' methods */}
                  {(loginMethod === 'username' || loginMethod === 'both') && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Username *
                      </Label>
                      <div className="relative">
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your username"
                          value={username}
                          onChange={(e) => handleUsernameChange(e.target.value)}
                          disabled={isLoading}
                          className={`h-11 pl-10 ${usernameError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                          aria-describedby={usernameError ? "username-error" : undefined}
                          aria-invalid={!!usernameError}
                        />
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      </div>
                      {usernameError && (
                        <p id="username-error" className="text-red-600 text-sm mt-1" role="alert">
                          {usernameError}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Password Input - Always visible */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-11 pr-10"
                      aria-describedby={error ? "form-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors duration-200"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={0}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700" id="form-error" role="alert">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
                
                {/* Network Diagnostic Toggle */}
                <div className="pt-4 border-t">
                  <Button 
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDiagnostic(!showDiagnostic)}
                    className="w-full text-xs"
                  >
                    <Settings className="mr-2 h-3 w-3" />
                    {showDiagnostic ? 'Hide' : 'Show'} Network Diagnostic
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Network Diagnostic Panel */}
      {showDiagnostic && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">Network Diagnostic</h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowDiagnostic(false)}
              >
                ✕
              </Button>
            </div>
            <div className="p-4">
              <NetworkDiagnostic />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
