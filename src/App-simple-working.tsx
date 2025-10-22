import React from 'react';

// Ultra-simple React app that should work
function SimpleApp() {
  const handleClick = (pageName: string) => {
    console.log('Button clicked:', pageName);
    window.location.href = `/${pageName}`;
  };

  const pages = [
    { name: 'car-inventory', label: '🚗 Car Inventory' },
    { name: 'repairs', label: '🔧 Repairs' },
    { name: 'garage-schedule', label: '📅 Garage Schedule' },
    { name: 'analytics', label: '📊 Analytics' },
    { name: 'sales', label: '💼 Sales' },
    { name: 'employee-management', label: '👥 Employees' }
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ 
        background: '#FFD700', 
        padding: '20px', 
        borderRadius: '10px', 
        textAlign: 'center',
        marginBottom: '20px'
      }}>
        <h1>🚗 MONZA TECH - Simple React Version</h1>
        <p>Testing if basic React clicks work</p>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '15px' 
      }}>
        {pages.map((page) => (
          <button
            key={page.name}
            onClick={() => handleClick(page.name)}
            onMouseDown={(e) => {
              console.log('Mouse down on:', page.label);
              e.preventDefault();
            }}
            onMouseUp={(e) => {
              console.log('Mouse up on:', page.label);
              e.preventDefault();
            }}
            style={{
              padding: '20px',
              fontSize: '16px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {page.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: '30px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
        <h3>🔧 Debug Info</h3>
        <p>If you can click these buttons and see console messages, React works!</p>
        <button 
          onClick={() => {
            console.log('Test button clicked!');
            alert('React onClick works!');
          }}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Test React Click
        </button>
      </div>
    </div>
  );
}

export default SimpleApp;
