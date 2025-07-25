console.log('main.tsx is executing');

import { createRoot } from 'react-dom/client';
// import App from './App.tsx';
import App from './App-test.tsx';
import './index.css'

console.log('SIMPLE TEST: Starting Monza app...');

// Immediately show something to confirm JavaScript is running
const rootElement = document.getElementById("root");
if (rootElement) {
  console.log('Root element found');
  rootElement.innerHTML = '<div style="padding: 20px; font-size: 24px; color: blue;">Loading Monza App...</div>';
  
  setTimeout(() => {
    try {
      createRoot(rootElement).render(App());
      console.log('React app rendered successfully');
    } catch (error) {
      console.error('Error rendering React app:', error);
      rootElement.innerHTML = '<div style="padding: 20px; color: red;">React Error: ' + error.message + '</div>';
    }
  }, 1000);
} else {
  console.error('Root element not found!');
}
