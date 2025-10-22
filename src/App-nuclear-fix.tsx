import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// NO CSS IMPORTS AT ALL - PURE EMERGENCY MODE

// Ultra simple dashboard with INLINE STYLES ONLY
function UltraSimpleDashboard() {
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ color: '#333', marginBottom: '20px', pointerEvents: 'auto' }}>
        🚗 Monza TECH Dashboard
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'auto'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Total Cars</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#007bff' }}>124</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'auto'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Active Repairs</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#28a745' }}>18</p>
        </div>
        
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          pointerEvents: 'auto'
        }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Today's Schedule</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#ffc107' }}>12</p>
        </div>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
        <button 
          style={{ 
            padding: '15px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={() => alert('Add Car clicked!')}
        >
          🚗 Add Car
        </button>
        
        <button 
          style={{ 
            padding: '15px 20px', 
            backgroundColor: '#28a745', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={() => alert('New Repair clicked!')}
        >
          🔧 New Repair
        </button>
        
        <button 
          style={{ 
            padding: '15px 20px', 
            backgroundColor: '#ffc107', 
            color: 'black', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={() => alert('Schedule clicked!')}
        >
          📅 Schedule
        </button>
        
        <button 
          style={{ 
            padding: '15px 20px', 
            backgroundColor: '#6f42c1', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={() => alert('Reports clicked!')}
        >
          📊 Reports
        </button>
      </div>
      
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Click Test Area</h3>
        <p style={{ marginBottom: '15px' }}>If you can see alerts when clicking buttons above, then React is working.</p>
        <button 
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '14px',
            cursor: 'pointer',
            pointerEvents: 'auto'
          }}
          onClick={() => {
            console.log('🚨 EMERGENCY TEST BUTTON CLICKED!');
            alert('🚨 EMERGENCY TEST: This button works!');
          }}
        >
          🚨 EMERGENCY TEST BUTTON
        </button>
      </div>
    </div>
  );
}

// ULTRA AGGRESSIVE CLICK FIX
const useNuclearClickFix = () => {
  useEffect(() => {
    console.log('🚨 NUCLEAR CLICK FIX STARTING...');
    
    // Nuclear option - force everything to be clickable with maximum aggression
    const nuclearFix = () => {
      // Force on document
      document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
      document.body.style.setProperty('pointer-events', 'auto', 'important');
      
      // Force on ALL elements
      const allElements = document.querySelectorAll('*');
      allElements.forEach((element) => {
        const el = element as HTMLElement;
        
        // Force pointer events
        el.style.setProperty('pointer-events', 'auto', 'important');
        el.style.setProperty('cursor', 'auto', 'important');
        el.style.setProperty('user-select', 'auto', 'important');
        
        // Remove any blocking attributes
        if (el.hasAttribute('inert')) el.removeAttribute('inert');
        if (el.hasAttribute('aria-hidden')) el.removeAttribute('aria-hidden');
        
        // Force visibility
        if (el.style.visibility === 'hidden') el.style.setProperty('visibility', 'visible', 'important');
        if (el.style.display === 'none' && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          el.style.setProperty('display', 'block', 'important');
        }
        
        // Remove any transform that might block
        el.style.setProperty('transform', 'none', 'important');
        el.style.setProperty('filter', 'none', 'important');
        el.style.setProperty('backdrop-filter', 'none', 'important');
        
        // Force z-index reset
        if (el.style.zIndex && parseInt(el.style.zIndex) < 0) {
          el.style.setProperty('z-index', 'auto', 'important');
        }
      });
      
      console.log('🚨 Nuclear fix applied to', allElements.length, 'elements');
    };
    
    // Apply immediately
    nuclearFix();
    
    // Apply after DOM changes
    setTimeout(nuclearFix, 10);
    setTimeout(nuclearFix, 50);
    setTimeout(nuclearFix, 100);
    setTimeout(nuclearFix, 500);
    setTimeout(nuclearFix, 1000);
    
    // Apply every 2 seconds
    const interval = setInterval(nuclearFix, 2000);
    
    // Monitor for new elements
    const observer = new MutationObserver(() => {
      setTimeout(nuclearFix, 10);
    });
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: true,
      attributeFilter: ['style', 'class', 'inert', 'aria-hidden']
    });
    
    // Global event capture to debug clicks
    const clickCapture = (e: MouseEvent) => {
      console.log('🚨 NUCLEAR: Click captured on:', e.target);
      console.log('🚨 NUCLEAR: Click coordinates:', e.clientX, e.clientY);
      console.log('🚨 NUCLEAR: Target element:', e.target);
    };
    
    document.addEventListener('click', clickCapture, { capture: true });
    document.addEventListener('mousedown', clickCapture, { capture: true });
    document.addEventListener('mouseup', clickCapture, { capture: true });
    
    return () => {
      clearInterval(interval);
      observer.disconnect();
      document.removeEventListener('click', clickCapture, { capture: true });
      document.removeEventListener('mousedown', clickCapture, { capture: true });
      document.removeEventListener('mouseup', clickCapture, { capture: true });
    };
  }, []);
};

function AppContent() {
  console.log('🚨 NUCLEAR APP STARTING...');
  useNuclearClickFix();

  return (
    <Routes>
      <Route path="*" element={<UltraSimpleDashboard />} />
    </Routes>
  );
}

function App() {
  // Apply body-level fixes immediately
  React.useLayoutEffect(() => {
    document.body.style.setProperty('pointer-events', 'auto', 'important');
    document.body.style.setProperty('cursor', 'auto', 'important');
    document.body.style.setProperty('user-select', 'auto', 'important');
    document.body.style.setProperty('margin', '0', 'important');
    document.body.style.setProperty('padding', '0', 'important');
    document.body.style.setProperty('background-color', '#f5f5f5', 'important');
    
    document.documentElement.style.setProperty('pointer-events', 'auto', 'important');
    document.documentElement.style.setProperty('cursor', 'auto', 'important');
  }, []);
  
  console.log('🚨 NUCLEAR MONZA TECH APP STARTING...');
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
}

export default App;
