import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Ultra simple pages
const Dashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>🚗 Dashboard</h1>
    <p>Dashboard working! You can click everything here.</p>
  </div>
);

const CarInventory = () => (
  <div style={{ padding: '20px' }}>
    <h1>🚗 Car Inventory</h1>
    <p>Car Inventory working!</p>
  </div>
);

// Ultra simple layout matching your original design
const UltraSimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', height: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
    {/* Sidebar */}
    <div style={{ 
      width: '260px', 
      background: '#ffffff', 
      borderRight: '1px solid #e5e7eb',
      boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Sidebar content */}
      <div style={{ padding: '20px' }}>
        <div style={{ 
          background: '#FFD700', 
          padding: '12px',
          borderRadius: '6px',
          textAlign: 'center',
          fontWeight: 'bold',
          marginBottom: '24px'
        }}>
          🚗 MONZA S.A.L.
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <h3 style={{ 
            fontSize: '12px', 
            fontWeight: '600', 
            color: '#6b7280', 
            textTransform: 'uppercase',
            marginBottom: '8px',
            letterSpacing: '0.05em'
          }}>Main</h3>
          <Link 
            to="/" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#FFD700',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => e.target.style.background = '#F1C40F'}
            onMouseOut={(e) => e.target.style.background = '#FFD700'}
            onClick={(e) => {
              console.log('✅ Dashboard link clicked!');
            }}
          >
            🏠 Dashboard
          </Link>
          <Link 
            to="/message-center" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            💬 Messages & Requests
          </Link>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <button 
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
            onClick={(e) => {
              console.log('✅ Vehicles button clicked!');
              alert('Vehicles section clicked!');
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
          >
            <span>🚗 Vehicles</span>
            <span>›</span>
          </button>
        </div>
        
        <div style={{ marginBottom: '12px' }}>
          <Link 
            to="/car-inventory" 
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 12px',
              background: '#f3f4f6',
              color: '#374151',
              textDecoration: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.background = '#e5e7eb'}
            onMouseOut={(e) => e.target.style.background = '#f3f4f6'}
            onClick={(e) => {
              console.log('✅ Car Inventory link clicked!');
            }}
          >
            🚗 Car Inventory
          </Link>
        </div>
      </div>
    </div>
    
    {/* Main content area */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ 
        height: '64px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            style={{
              padding: '8px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'none' // Hidden on desktop, would show on mobile
            }}
            onClick={() => console.log('✅ Menu button clicked!')}
          >
            ☰
          </button>
          <div style={{ 
            background: '#FFD700',
            padding: '8px 12px',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '12px'
          }}>
            MONZA S.A.L.
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            background: '#dcfce7',
            color: '#166534',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Samer (OWNER)
          </div>
          <button 
            style={{
              padding: '8px 16px',
              background: '#fff',
              border: '1px solid #FFD700',
              borderRadius: '6px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '14px'
            }}
            onClick={() => {
              console.log('✅ Logout clicked!');
              alert('Logout clicked!');
            }}
            onMouseOver={(e) => e.target.style.background = '#fffbeb'}
            onMouseOut={(e) => e.target.style.background = '#fff'}
          >
            Logout
          </button>
        </div>
      </header>
      
      {/* Main content */}
      <main style={{ 
        flex: 1, 
        padding: '24px',
        background: '#f9fafb',
        overflow: 'auto'
      }}>
        {children}
      </main>
    </div>
  </div>
);

function App() {
  console.log('🚀 Ultra Simple App rendering...');
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <UltraSimpleLayout>
            <Dashboard />
          </UltraSimpleLayout>
        } />
        <Route path="/car-inventory" element={
          <UltraSimpleLayout>
            <CarInventory />
          </UltraSimpleLayout>
        } />
        <Route path="*" element={
          <UltraSimpleLayout>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h2>Page Not Found</h2>
              <Link to="/" style={{ color: '#3b82f6' }}>← Back to Dashboard</Link>
            </div>
          </UltraSimpleLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
