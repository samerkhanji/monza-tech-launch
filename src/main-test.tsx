console.log('Testing basic React setup...');

import React from 'react';
import { createRoot } from 'react-dom/client';

const TestApp = () => {
  return (
    <div style={{ 
      padding: '50px', 
      fontSize: '24px', 
      color: 'green',
      backgroundColor: '#f0f0f0',
      textAlign: 'center'
    }}>
      <h1>MONZA S.A.L. - TEST SUCCESS!</h1>
      <p>If you see this, React is working!</p>
      <p>Port: 5173</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
};

console.log('Starting test app...');

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('Root element found, rendering test app...');
  const root = createRoot(rootElement);
  root.render(<TestApp />);
  console.log('Test app rendered successfully!');
} else {
  console.error('Root element not found!');
}
