import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import apiService from '../../services/api';
import { toast } from 'sonner';

interface DiagnosticResult {
  test: string;
  success: boolean;
  message: string;
  details?: unknown;
  timestamp: string;
}

export const NetworkDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, success: boolean, message: string, details?: unknown) => {
    const result: DiagnosticResult = {
      test,
      success,
      message,
      details,
      timestamp: new Date().toLocaleTimeString()
    };
    setResults(prev => [result, ...prev]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Basic connectivity
    try {
      const connectionTest = await apiService.testConnection();
      addResult(
        'API Connectivity',
        connectionTest.success,
        connectionTest.message,
        connectionTest.details
      );
    } catch (error) {
      addResult('API Connectivity', false, 'Connection test failed', { error: error.message });
    }

    // Test 2: Environment variables
    const apiUrl = import.meta.env.VITE_API_BASE_URL;
    const timeout = import.meta.env.VITE_API_TIMEOUT;
    addResult(
      'Environment Config',
      !!apiUrl,
      apiUrl ? `API URL configured: ${apiUrl}` : 'API URL not configured',
      { apiUrl, timeout }
    );

    // Test 3: Login attempt
    try {
      const loginResult = await apiService.login({
        email: 'conan@gmail.com',
        username: 'conan',
        password: '#$123456'
      });
      addResult(
        'Login Test',
        true,
        'Login successful',
        { userId: loginResult.user.id, role: loginResult.user.role }
      );
    } catch (error: unknown) {
      addResult(
        'Login Test',
        false,
        (error as { message: string }).message || 'Login failed',
        { error: (error as { message: string }).message, status: (error as { status: number }).status }
      );
    }

    setIsRunning(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="h-5 w-5" />
          Network Diagnostic Tool
        </CardTitle>
        <CardDescription>
          Test API connectivity and diagnose network issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Running Tests...
              </>
            ) : (
              <>
                <Wifi className="h-4 w-4" />
                Run Diagnostics
              </>
            )}
          </Button>
          {results.length > 0 && (
            <Button variant="outline" onClick={clearResults}>
              Clear Results
            </Button>
          )}
        </div>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Diagnostic Results</h3>
            {results.map((result, index) => (
              <Card key={index} className={`border-l-4 ${
                result.success ? 'border-l-green-500' : 'border-l-red-500'
              }`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{result.test}</h4>
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? 'PASS' : 'FAIL'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {result.message}
                        </p>
                        {result.details && (
                          <details className="mt-2">
                            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                              View Details
                            </summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                              {JSON.stringify(result.details, null, 2)}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && !isRunning && (
          <div className="text-center py-8 text-muted-foreground">
            <WifiOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Click "Run Diagnostics" to test your network connection</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default NetworkDiagnostic;