
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Users, Shield, BarChart3, Loader2, Settings } from 'lucide-react';
import NetworkDiagnostic from '../debug/NetworkDiagnostic';

const LoginPage = () => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !username || !password) {
      setError('Please fill in all fields.');
      return;
    }
    
    const success = await login(email, username, password);
    if (!success) {
      setError('Invalid credentials. Please try again.');
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
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11"
                  />
                </div>
                
                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
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
