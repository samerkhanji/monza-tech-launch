import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import emergency CSS only
import '@/styles/emergency-click-fix.css';

// Create a simplified version of the original layout without complex CSS
const SimpleNavbar = ({ onMenuClick }: { onMenuClick?: () => void }) => (
  <header style={{
    position: 'sticky',
    top: 0,
    zIndex: 30,
    width: '100%',
    borderBottom: '1px solid #e5e7eb',
    background: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  }}>
    <div style={{
      display: 'flex',
      height: '64px',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {onMenuClick && (
          <button
            onClick={(e) => {
              console.log('🍔 Hamburger clicked');
              e.preventDefault();
              e.stopPropagation();
              onMenuClick();
            }}
            style={{
              padding: '8px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
          >
            ☰
          </button>
        )}
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
    </div>
  </header>
);

const SimpleSidebar = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <>
    {/* Mobile overlay */}
    {isOpen && (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 40,
          cursor: 'pointer',
          pointerEvents: 'auto'
        }}
        onClick={onClose}
      />
    )}
    
    {/* Sidebar */}
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 50,
      width: '256px',
      height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e5e7eb',
      transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
      transition: 'transform 0.3s ease',
      boxShadow: '1px 0 3px rgba(0,0,0,0.1)',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        {/* Close button for mobile */}
        <div style={{ 
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span style={{ fontWeight: 'bold' }}>Menu</span>
          <button
            onClick={(e) => {
              console.log('❌ Close button clicked');
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px',
              pointerEvents: 'auto'
            }}
          >
            ✕
          </button>
        </div>
        
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
          
          {/* Navigation items */}
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>Main</h3>
            <a
              href="/"
              onClick={(e) => {
                console.log('🏠 Dashboard link clicked');
                e.preventDefault();
                alert('Dashboard clicked!');
              }}
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
                marginBottom: '4px',
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
            >
              🏠 Dashboard
            </a>
          </div>
          
          <div style={{ marginBottom: '12px' }}>
            <h3 style={{
              fontSize: '12px',
              fontWeight: '600',
              color: '#6b7280',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>Vehicles</h3>
            <button
              onClick={(e) => {
                console.log('🚗 Car Inventory clicked');
                e.preventDefault();
                e.stopPropagation();
                alert('Car Inventory clicked!');
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '8px 12px',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
                cursor: 'pointer',
                pointerEvents: 'auto',
                textAlign: 'left'
              }}
            >
              🚗 Car Inventory
            </button>
          </div>
        </div>
      </div>
    </div>
  </>
);

const SimpleLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  
  return (
    <div style={{ display: 'flex', height: '100vh', pointerEvents: 'auto' }}>
      <SimpleSidebar 
        isOpen={sidebarOpen} 
        onClose={() => {
          console.log('📱 Closing sidebar');
          setSidebarOpen(false);
        }} 
      />
      
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        marginLeft: sidebarOpen ? '0' : '0', // No permanent sidebar on desktop for now
        pointerEvents: 'auto'
      }}>
        <SimpleNavbar onMenuClick={() => {
          console.log('📱 Opening sidebar');
          setSidebarOpen(true);
        }} />
        
        <main style={{
          flex: 1,
          padding: '24px',
          background: '#f9fafb',
          overflow: 'auto',
          pointerEvents: 'auto'
        }}>
          {children}
        </main>
      </div>
    </div>
  );
};

// Test dashboard with original functionality
const TestDashboard = () => (
  <div style={{ pointerEvents: 'auto' }}>
    <h1 style={{ marginBottom: '20px', color: '#374151' }}>🚗 Fixed Original Layout Test</h1>
    
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={() => {
          console.log('✅ Main test button clicked!');
          alert('✅ Main button works!');
        }}
        style={{
          padding: '15px 25px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: '500',
          pointerEvents: 'auto'
        }}
      >
        🧪 Test Main Button
      </button>
    </div>
    
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '16px',
      marginBottom: '20px'
    }}>
      {['Car Inventory', 'Repairs', 'Analytics', 'Sales'].map((item, index) => (
        <button
          key={index}
          onClick={() => {
            console.log(`✅ ${item} clicked!`);
            alert(`${item} button works!`);
          }}
          style={{
            padding: '20px',
            background: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            cursor: 'pointer',
            textAlign: 'left',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            pointerEvents: 'auto'
          }}
        >
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>{item}</h3>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '14px' }}>
            Click to test {item.toLowerCase()} functionality
          </p>
        </button>
      ))}
    </div>
    
    <div style={{
      background: '#f0f9ff',
      border: '1px solid #bae6fd',
      borderRadius: '8px',
      padding: '16px'
    }}>
      <h3 style={{ margin: '0 0 8px 0', color: '#0c4a6e' }}>✅ Testing Status</h3>
      <p style={{ margin: '0', color: '#075985', fontSize: '14px' }}>
        This is the original layout structure but simplified. All components should be clickable.
      </p>
    </div>
  </div>
);

function App() {
  console.log('🔧 Testing simplified original layout...');
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <SimpleLayout>
            <TestDashboard />
          </SimpleLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
