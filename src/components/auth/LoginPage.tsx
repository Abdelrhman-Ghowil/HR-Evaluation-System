
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
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [identifierError, setIdentifierError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Username validation function
  const validateUsername = (username: string): boolean => {
    const usernameRegex = /^[a-zA-Z0-9._]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleIdentifierChange = (value: string) => {
    setIdentifier(value);
    setIdentifierError('');
    if (value) {
      if (value.includes('@')) {
        if (!validateEmail(value)) {
          setIdentifierError('Enter a valid email address');
        }
      } else {
        if (!validateUsername(value)) {
          setIdentifierError('Username must be 3-20 characters: letters, numbers, underscores, or periods');
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIdentifierError('');
    let hasValidEmail = false;
    let hasValidUsername = false;
    
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier) {
      setIdentifierError('Email or username is required');
      return;
    }
    if (trimmedIdentifier.includes('@')) {
      if (!validateEmail(trimmedIdentifier)) {
        setIdentifierError('Enter a valid email address');
        return;
      }
      hasValidEmail = true;
    } else {
      if (!validateUsername(trimmedIdentifier)) {
        setIdentifierError('Username must be 3-20 characters: letters, numbers, underscores, or periods');
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
    
    const credentials: { email?: string; username?: string; password: string } = {
      password: trimmedPassword
    };
    
    if (hasValidEmail) credentials.email = trimmedIdentifier.toLowerCase();
    if (hasValidUsername) credentials.username = trimmedIdentifier;
    
    try {
      const success = await login(credentials);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (error) {
      setError('Authentication failed. Please check your credentials and try again.');
    }
  };

  const isEmailLikely = identifier.includes('@');

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
                <div className="space-y-2">
                  <Label htmlFor="identifier" className="text-sm font-medium text-gray-700">
                    Email or Username *
                  </Label>
                  <div className="relative">
                    <Input
                      id="identifier"
                      type="text"
                      placeholder="Enter your email or username"
                      value={identifier}
                      onChange={(e) => handleIdentifierChange(e.target.value)}
                      disabled={isLoading}
                      className={`h-11 pl-10 ${identifierError ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
                      aria-describedby={identifierError ? "identifier-error" : undefined}
                      aria-invalid={!!identifierError}
                    />
                    {isEmailLikely ? (
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    ) : (
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  {identifierError && (
                    <p id="identifier-error" className="text-red-600 text-sm mt-1" role="alert">
                      {identifierError}
                    </p>
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
