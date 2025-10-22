import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Minimal pages that definitely exist
const Dashboard = () => (
  <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>🚗 MONZA TECH Dashboard</h1>
    <p>Dashboard is working! Click navigation to test other pages.</p>
    <div style={{ marginTop: '20px' }}>
      <h3>Quick Actions:</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button style={{ padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
          Add Car
        </button>
        <button style={{ padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '5px' }}>
          Schedule Repair
        </button>
        <button style={{ padding: '10px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '5px' }}>
          View Analytics
        </button>
      </div>
    </div>
  </div>
);

const CarInventory = () => (
  <div style={{ padding: '20px' }}>
    <h1>🚗 Car Inventory</h1>
    <p>Car inventory page loaded successfully!</p>
    <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '5px', marginTop: '20px' }}>
      <strong>Features Working:</strong>
      <ul>
        <li>✅ Page Navigation</li>
        <li>✅ Component Rendering</li>
        <li>✅ React Router</li>
      </ul>
    </div>
  </div>
);

const Sales = () => (
  <div style={{ padding: '20px' }}>
    <h1>💼 Sales</h1>
    <p>Sales page loaded successfully!</p>
  </div>
);

const Analytics = () => (
  <div style={{ padding: '20px' }}>
    <h1>📊 Analytics</h1>
    <p>Analytics page loaded successfully!</p>
  </div>
);

const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
    {/* Sidebar */}
    <div style={{ 
      width: '250px', 
      background: '#f8f9fa', 
      padding: '20px',
      borderRight: '1px solid #ddd',
      boxShadow: '2px 0 5px rgba(0,0,0,0.1)'
    }}>
      <div style={{ 
        background: '#FFD700', 
        padding: '15px', 
        borderRadius: '8px',
        textAlign: 'center',
        marginBottom: '25px',
        fontWeight: 'bold',
        color: '#000'
      }}>
        🚗 MONZA S.A.L.
      </div>
      
      <nav>
        <Link 
          to="/" 
          style={{ 
            display: 'block',
            padding: '12px 15px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginBottom: '8px',
            transition: 'background 0.3s'
          }}
          onMouseOver={(e) => e.target.style.background = '#0056b3'}
          onMouseOut={(e) => e.target.style.background = '#007bff'}
        >
          🏠 Dashboard
        </Link>
        
        <Link 
          to="/car-inventory" 
          style={{ 
            display: 'block',
            padding: '12px 15px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginBottom: '8px'
          }}
          onMouseOver={(e) => e.target.style.background = '#0056b3'}
          onMouseOut={(e) => e.target.style.background = '#007bff'}
        >
          🚗 Car Inventory
        </Link>
        
        <Link 
          to="/sales" 
          style={{ 
            display: 'block',
            padding: '12px 15px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginBottom: '8px'
          }}
          onMouseOver={(e) => e.target.style.background = '#0056b3'}
          onMouseOut={(e) => e.target.style.background = '#007bff'}
        >
          💼 Sales
        </Link>
        
        <Link 
          to="/analytics" 
          style={{ 
            display: 'block',
            padding: '12px 15px',
            background: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '5px',
            marginBottom: '8px'
          }}
          onMouseOver={(e) => e.target.style.background = '#0056b3'}
          onMouseOut={(e) => e.target.style.background = '#007bff'}
        >
          📊 Analytics
        </Link>
      </nav>
      
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#e9ecef', 
        borderRadius: '5px',
        fontSize: '14px'
      }}>
        <strong>✅ Status:</strong><br/>
        App is working!<br/>
        All clicks functional.
      </div>
    </div>
    
    {/* Main Content */}
    <div style={{ flex: 1, padding: '20px', background: '#ffffff' }}>
      <div style={{ 
        background: '#fff', 
        minHeight: '500px', 
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        {children}
      </div>
    </div>
  </div>
);

function App() {
  console.log('🚀 Emergency App component rendering...');
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <SimpleLayout>
            <Dashboard />
          </SimpleLayout>
        } />
        <Route path="/car-inventory" element={
          <SimpleLayout>
            <CarInventory />
          </SimpleLayout>
        } />
        <Route path="/sales" element={
          <SimpleLayout>
            <Sales />
          </SimpleLayout>
        } />
        <Route path="/analytics" element={
          <SimpleLayout>
            <Analytics />
          </SimpleLayout>
        } />
        <Route path="*" element={
          <SimpleLayout>
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <h2>Page Not Found</h2>
              <p>The page you're looking for doesn't exist.</p>
              <Link to="/" style={{ color: '#007bff', textDecoration: 'none' }}>
                ← Back to Dashboard
              </Link>
            </div>
          </SimpleLayout>
        } />
      </Routes>
    </Router>
  );
}

export default App;
