import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Code, 
  FileText, 
  GitBranch, 
  ExternalLink, 
  Copy, 
  X,
  AlertCircle,
  Sparkles
} from "lucide-react";

export default function CodeViewer({ test, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("test-code");
  
  // Mock code data - in real app, this would come from GitHub API or file system
  const mockTestCode = `describe('User Authentication', () => {
  it('should successfully log in with valid credentials', async () => {
    const { getByPlaceholder, getByRole } = render(<LoginForm />);
    
    const emailInput = getByPlaceholder('Email');
    const passwordInput = getByPlaceholder('Password');
    const loginButton = getByRole('button', { name: 'Log In' });
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    fireEvent.click(loginButton);
    
    // This assertion is failing intermittently
    await waitFor(() => {
      expect(screen.getByText('Welcome back!')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});`;

  const mockSourceCode = `import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await login({ email, password });
      // Success message appears here
      showSuccessMessage('Welcome back!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Logging in...' : 'Log In'}
      </Button>
    </form>
  );
}`;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-6xl h-[90vh] glass-effect border-0 shadow-2xl flex flex-col">
        <CardHeader className="border-b border-slate-200/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Code className="w-6 h-6 text-blue-600" />
              <div>
                <CardTitle className="text-xl">Code Analysis</CardTitle>
                <p className="text-sm text-slate-600 mt-1">
                  Deep dive into {test.test_suite} failure
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 p-6 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="test-code" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Test Code
              </TabsTrigger>
              <TabsTrigger value="source-code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Source Code
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Analysis
              </TabsTrigger>
            </TabsList>

            <TabsContent value="test-code" className="flex-1 flex flex-col space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    <GitBranch className="w-3 h-3 mr-1" />
                    {test.branch || 'main'}
                  </Badge>
                  <span className="font-mono text-sm text-slate-700">
                    tests/auth/login.test.js
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in GitHub
                  </Button>
                </div>
              </div>

              {/* Code Display */}
              <div className="flex-1 bg-slate-900 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-slate-100 font-mono leading-relaxed">
                  <code className="language-javascript">{mockTestCode}</code>
                </pre>
              </div>

              {/* Error Highlight */}
              {test.status === 'failed' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 mb-2">Failure Point Detected</p>
                      <p className="text-sm text-red-800 mb-3">
                        Line 15: The assertion for "Welcome back!" message is failing intermittently, 
                        likely due to timing issues with async operations.
                      </p>
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Line 15: expect(screen.getByText('Welcome back!'))
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="source-code" className="flex-1 flex flex-col space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    <Code className="w-3 h-3 mr-1" />
                    Component
                  </Badge>
                  <span className="font-mono text-sm text-slate-700">
                    src/components/LoginForm.jsx
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-3 h-3 mr-1" />
                    Open in GitHub
                  </Button>
                </div>
              </div>

              {/* Code Display */}
              <div className="flex-1 bg-slate-900 rounded-lg p-4 overflow-auto">
                <pre className="text-sm text-slate-100 font-mono leading-relaxed">
                  <code className="language-jsx">{mockSourceCode}</code>
                </pre>
              </div>

              {/* Potential Issue Highlight */}
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-orange-900 mb-2">Potential Race Condition</p>
                    <p className="text-sm text-orange-800 mb-3">
                      The success message might be shown before the component re-renders, 
                      causing timing issues in tests.
                    </p>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                      Line 21: showSuccessMessage('Welcome back!')
                    </Badge>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analysis" className="flex-1 space-y-4">
              {/* AI Analysis Results */}
              <div className="p-6 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-900">AI Analysis Results</h3>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    95% confidence
                  </Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Root Cause Analysis</h4>
                    <p className="text-sm text-blue-800 leading-relaxed">
                      The test is failing due to a race condition between the login API call and the success message display. 
                      The test expects the "Welcome back!" message to appear immediately, but there's a delay in the async 
                      operation completion and subsequent state updates.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Recommended Fixes</h4>
                    <div className="space-y-3">
                      <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
                        <p className="font-medium text-blue-900 mb-1">1. Increase Wait Timeout</p>
                        <p className="text-sm text-blue-800">
                          Increase the waitFor timeout from 5000ms to 10000ms to account for slower CI environments.
                        </p>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
                        <p className="font-medium text-blue-900 mb-1">2. Mock Network Delays</p>
                        <p className="text-sm text-blue-800">
                          Add proper mocking for the login API to ensure consistent response times during testing.
                        </p>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg border border-blue-200">
                        <p className="font-medium text-blue-900 mb-1">3. Test State Changes</p>
                        <p className="text-sm text-blue-800">
                          Instead of testing UI text, test for state changes or loading indicators for more reliable assertions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-blue-900 mb-2">Suggested Code Changes</h4>
                    <div className="bg-slate-900 rounded-lg p-4">
                      <pre className="text-sm text-slate-100 font-mono">
                        <code>{`// Replace this:
await waitFor(() => {
  expect(screen.getByText('Welcome back!')).toBeInTheDocument();
}, { timeout: 5000 });

// With this:
await waitFor(() => {
  expect(screen.getByText('Welcome back!')).toBeInTheDocument();
}, { timeout: 10000 });

// Or better yet:
await waitFor(() => {
  expect(mockLogin).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
});`}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}