
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Logo from '@/components/ui/logo';
import { Button } from '@/components/ui/button';

const Index: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index page - user:', user, 'isLoading:', isLoading);
    
    // Redirect authenticated users to dashboard
    if (user && !isLoading) {
      console.log('Redirecting authenticated user to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Show loading while checking authentication
  if (isLoading) {
    console.log('Index page - showing loading state');
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary">
        <div className="text-center">
          <Logo size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show landing page for unauthenticated users
  console.log('Index page - showing landing page');
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-secondary p-4">
      <div className="max-w-3xl w-full px-8 py-12 bg-background rounded-lg shadow-lg text-center">
        <Logo size="lg" className="mx-auto mb-8" />
        
        <h1 className="text-4xl font-bold mb-4">Monza S.A.L.</h1>
        <h2 className="text-2xl font-semibold mb-8">Internal Management System</h2>
        
        <p className="text-lg mb-8">
          Access your dealership management tools, garage workflow, inventory management, 
          and request approval system in one place.
        </p>
        
        <div className="flex justify-center">
          <Button 
            size="lg"
            onClick={() => {
              console.log('Navigating to login page');
              navigate('/login');
            }}
            className="px-8"
          >
            Login to System
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
