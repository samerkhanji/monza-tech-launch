import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from '@/components/layout/Layout';

// Import emergency CSS only
import '@/styles/emergency-click-fix.css';

// Simple test page
const TestDashboard = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>🚗 Test Dashboard</h1>
    <p>This is a simple test page to check if the Layout component works.</p>
    
    <div style={{ marginTop: '20px' }}>
      <button 
        onClick={() => {
          console.log('✅ Test button clicked!');
          alert('Button works in Layout!');
        }}
        style={{
          padding: '12px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test Button - Click Me!
      </button>
    </div>
    
    <div style={{ 
      marginTop: '20px',
      padding: '15px',
      background: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '6px'
    }}>
      <h3>Layout Component Test</h3>
      <p>If you can click the button above, then the Layout component is working properly.</p>
      <p>If not, there's something in the Layout blocking clicks.</p>
    </div>
  </div>
);

function App() {
  console.log('🧪 Testing Layout component...');
  
  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<TestDashboard />} />
          </Route>
        </Routes>
        <Toaster />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
