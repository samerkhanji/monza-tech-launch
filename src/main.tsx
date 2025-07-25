console.log('Monza S.A.L. main.tsx executing');

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import './styles/date-picker-fix.css';
import './styles/time-scheduling-fix.css';
import { Toaster } from '@/components/ui/toaster';
import App from './App.tsx';
import './index.css';

// Initialize comprehensive mock data (commented out temporarily)
// import './services/mockDataService';

console.log('Starting Monza S.A.L. application...');

const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('Root element found, initializing Monza app...');
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    console.log('Monza S.A.L. application rendered successfully with Redux store');
  } catch (error) {
    console.error('Error rendering Monza application:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: Arial;">
        <h1>Monza S.A.L. - Startup Error</h1>
        <p>Error: ${error.message}</p>
        <p>Please check the browser console for more details.</p>
      </div>
    `;
  }
} else {
  console.error('Root element not found!');
  document.body.innerHTML = `
    <div style="padding: 20px; color: red; font-family: Arial;">
      <h1>Monza S.A.L. - Configuration Error</h1>
      <p>Root element #root not found in HTML.</p>
    </div>
  `;
}
