// Reduced console noise - use window.enableVerboseLogs() to see all logs

import React from 'react';
import ReactDOM from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import './styles/date-picker-fix.css';
import './styles/time-scheduling-fix.css';
import './index.css';
import './styles/dialog-fixes.css';
import '@/styles/pdi-professional.css';
import App from './App';

// Initialize comprehensive mock data (commented out temporarily)


// Starting application...

const rootElement = document.getElementById("root");
if (rootElement) {
  // Root element found, initializing app...
  
  try {
    const root = createRoot(rootElement);
    root.render(
      <Provider store={store}>
        <App />
      </Provider>
    );
    // Application rendered successfully
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
