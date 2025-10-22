import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const Login: React.FC = () => {
  const { user, login, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);
    console.log(`🔐 Starting login for: ${email}`);
    
    try {
      const success = await login(email, password);
      
      if (success) {
        toast.success('Login successful! Redirecting...');
        console.log('Login successful, navigation handled by AuthContext');
      } else {
        toast.error('Invalid email or password. Please check your credentials.');
        console.log('Login failed - invalid credentials');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      toast.error('An error occurred during login. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillDemoCredentials = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    console.log(`Demo credentials filled: ${demoEmail}`);
  };

  // If already authenticated, redirect immediately
  if (user && !isLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-monza-light-gray to-white px-4 py-8">
      <div className="w-full max-w-sm mx-auto px-6 py-8 bg-white rounded-lg shadow-lg animate-fadeIn border border-gray-200">
        <div className="text-center mb-6">
          {/* Custom structure for MONZA S.A.L. in yellow box */}
          <div className="relative h-16 w-full mb-4">
            <div className="absolute inset-0 bg-monza-yellow rounded-lg flex items-center justify-center">
              <span className="text-monza-black font-bold text-xl">MONZA S.A.L.</span>
            </div>
          </div>
          <h1 className="text-xl font-bold mt-4 text-monza-black">Internal Management System</h1>
          <p className="text-sm text-monza-gray mt-2">Login to access your dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="login-email" className="form-label text-sm text-monza-black">
              Email
            </label>
            <input
              id="login-email"
              name="email"
              type="email"
              placeholder="Enter your email"
              className="form-input w-full h-12 text-base touch-manipulation border-gray-300 focus:border-monza-yellow focus:ring-monza-yellow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isSubmitting}
              autoComplete="email"
              inputMode="email"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="login-password" className="form-label text-sm text-monza-black">
              Password
            </label>
            <input
              id="login-password"
              name="password"
              type="password"
              placeholder="Enter your password"
              className="form-input w-full h-12 text-base touch-manipulation border-gray-300 focus:border-monza-yellow focus:ring-monza-yellow"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isSubmitting}
              autoComplete="current-password"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={isLoading || isSubmitting}
            className="w-full h-12 text-base font-medium touch-manipulation bg-monza-yellow hover:bg-monza-yellow/90 text-monza-black"
            size="mobile-friendly"
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </Button>
        </form>
        
        <div className="mt-4 p-3 bg-monza-light-gray rounded-md">
          <p className="text-xs mb-2 text-monza-gray">Demo account information:</p>
          <div className="space-y-1">
            <button 
              type="button"
              className="text-xs text-monza-yellow hover:text-monza-yellow/80 cursor-pointer block"
              onClick={() => fillDemoCredentials('samer@monza.com', 'Monza123')}
            >
              Owner: samer@monza.com / Monza123
            </button>
            <button 
              type="button"
              className="text-xs text-monza-yellow hover:text-monza-yellow/80 cursor-pointer block"
              onClick={() => fillDemoCredentials('mark@monza.com', 'Monza123')}
            >
              Garage Manager: mark@monza.com / Monza123
            </button>
            <button 
              type="button"
              className="text-xs text-monza-yellow hover:text-monza-yellow/80 cursor-pointer block"
              onClick={() => fillDemoCredentials('lara@monza.com', 'Monza123')}
            >
              Assistant: lara@monza.com / Monza123
            </button>
            <button 
              type="button"
              className="text-xs text-monza-yellow hover:text-monza-yellow/80 cursor-pointer block"
              onClick={() => fillDemoCredentials('khalil@monza.com', 'Monza123')}
            >
              Sales: khalil@monza.com / Monza123
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
