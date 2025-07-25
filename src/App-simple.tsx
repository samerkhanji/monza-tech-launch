import React from 'react';

function App() {
  console.log('Simple Monza App is rendering...');
  
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif',
      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
      color: '#1a1a1a'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '20px' }}>
          Monza S.A.L.
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '30px', color: '#666' }}>
          Car Dealership Management System
        </p>
        
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#10b981', fontSize: '1.5rem' }}>
            React App is Working!
          </h2>
          <p>If you can see this, the basic React setup is functional.</p>
        </div>

        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>System Status</h3>
          <p><strong>Time:</strong> {new Date().toLocaleString()}</p>
          <p><strong>React:</strong> Rendering</p>
          <p><strong>JavaScript:</strong> Executing</p>
          <p><strong>Server:</strong> Port 5174</p>
        </div>

        <button
          onClick={() => {
            console.log('Test button clicked!');
            alert('Button working! OK');
          }}
          style={{
            background: '#FFD700',
            color: '#1a1a1a',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🧪 Test Button
        </button>

        <div style={{ marginTop: '30px', fontSize: '14px', color: '#666' }}>
          <p>If this page works but the main app doesn't:</p>
          <p>1. Check browser console (F12) for errors</p>
          <p>2. Try clearing cache (Ctrl+Shift+R)</p>
          <p>3. The issue is likely in a complex component or context</p>
        </div>
      </div>
    </div>
  );
}

export default App; 