import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// STEP 2: Add emergency CSS to test if CSS breaks clicking
import '@/styles/emergency-click-fix.css';

// STEP 2: Test with emergency CSS
function SimpleDashboard() {
  console.log('🔧 Step 2: SimpleDashboard with CSS rendering...');
  
  const handleClick1 = () => {
    console.log('🚨 STEP 2: Button 1 clicked!');
    alert('🚨 STEP 2: Button 1 WORKS with CSS!');
  };

  const handleClick2 = () => {
    console.log('🚨 STEP 2: Button 2 clicked!');
    alert('🚨 STEP 2: Button 2 WORKS with CSS!');
  };

  const buttonStyle: React.CSSProperties = {
    background: '#007bff',
    color: 'white',
    padding: '20px 40px',
    border: 'none',
    borderRadius: '5px',
    fontSize: '18px',
    cursor: 'pointer',
    margin: '10px 0',
    display: 'block',
    width: '300px',
    pointerEvents: 'auto'
  };

  const redButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#dc3545'
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', pointerEvents: 'auto' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🚗 Monza TECH - Step 2 (With Emergency CSS)
      </h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        Testing if emergency-click-fix.css breaks clicking...
      </p>
      
      <button style={buttonStyle} onClick={handleClick1}>
        🔵 STEP 2: CLICK TEST 1
      </button>
      
      <button style={redButtonStyle} onClick={handleClick2}>
        🔴 STEP 2: CLICK TEST 2
      </button>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Step 2 Status:</h3>
        <p style={{ margin: 0, color: '#666' }}>
          ✅ Minimal React working<br/>
          ✅ React Router working<br/>
          🔄 Testing Emergency CSS...
        </p>
      </div>
    </div>
  );
}

function App() {
  console.log('🔧 Step 2: App with Router + CSS starting...');
  
  // Force body styles immediately
  React.useLayoutEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = '#f5f5f5';
    document.body.style.pointerEvents = 'auto';
    document.body.style.cursor = 'auto';
  }, []);
  
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<SimpleDashboard />} />
        <Route path="*" element={<SimpleDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
