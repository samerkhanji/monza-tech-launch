import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Simple components for testing
const Dashboard = () => (
  <div style={{ padding: '20px' }}>
    <h1>🚗 MONZA TECH Dashboard</h1>
    <p>Welcome to the dashboard! Everything is working.</p>
  </div>
);

const CarInventory = () => (
  <div style={{ padding: '20px' }}>
    <h1>🚗 Car Inventory</h1>
    <p>Car inventory page loaded successfully!</p>
  </div>
);

const Repairs = () => (
  <div style={{ padding: '20px' }}>
    <h1>🔧 Repairs</h1>
    <p>Repairs page loaded successfully!</p>
  </div>
);

const Analytics = () => (
  <div style={{ padding: '20px' }}>
    <h1>📊 Analytics</h1>
    <p>Analytics page loaded successfully!</p>
  </div>
);

const SimpleLayout = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    {/* Sidebar */}
    <div style={{ 
      width: '250px', 
      background: '#f8f9fa', 
      padding: '20px',
      borderRight: '1px solid #ddd'
    }}>
      <div style={{ 
        background: '#FFD700', 
        padding: '10px', 
        borderRadius: '5px',
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <strong>MONZA S.A.L.</strong>
      </div>
      
      <nav>
        <div style={{ marginBottom: '10px' }}>
          <Link 
            to="/" 
            style={{ 
              display: 'block',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '3px',
              marginBottom: '5px'
            }}
            onClick={(e) => {
              console.log('Dashboard link clicked');
            }}
          >
            🏠 Dashboard
          </Link>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <Link 
            to="/car-inventory" 
            style={{ 
              display: 'block',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '3px',
              marginBottom: '5px'
            }}
            onClick={(e) => {
              console.log('Car Inventory link clicked');
            }}
          >
            🚗 Car Inventory
          </Link>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <Link 
            to="/repairs" 
            style={{ 
              display: 'block',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '3px',
              marginBottom: '5px'
            }}
            onClick={(e) => {
              console.log('Repairs link clicked');
            }}
          >
            🔧 Repairs
          </Link>
        </div>
        
        <div style={{ marginBottom: '10px' }}>
          <Link 
            to="/analytics" 
            style={{ 
              display: 'block',
              padding: '10px',
              background: '#007bff',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '3px',
              marginBottom: '5px'
            }}
            onClick={(e) => {
              console.log('Analytics link clicked');
            }}
          >
            📊 Analytics
          </Link>
        </div>
      </nav>
    </div>
    
    {/* Main Content */}
    <div style={{ flex: 1, padding: '20px' }}>
      {children}
    </div>
  </div>
);

function App() {
  console.log('✅ Fixed App component rendering');
  
  return (
    <Router>
      <div>
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
          <Route path="/repairs" element={
            <SimpleLayout>
              <Repairs />
            </SimpleLayout>
          } />
          <Route path="/analytics" element={
            <SimpleLayout>
              <Analytics />
            </SimpleLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
