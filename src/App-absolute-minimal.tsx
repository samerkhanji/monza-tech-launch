import React from 'react';

// ABSOLUTE MINIMAL REACT APP - NO ROUTER, NO EXTERNAL DEPENDENCIES
function App() {
  console.log('🚨 ABSOLUTE MINIMAL React App starting...');
  
  // Force body styles immediately
  React.useLayoutEffect(() => {
    console.log('🚨 MINIMAL: Setting body styles...');
    document.body.style.margin = '0';
    document.body.style.padding = '20px';
    document.body.style.fontFamily = 'Arial, sans-serif';
    document.body.style.backgroundColor = '#f0f0f0';
    document.body.style.pointerEvents = 'auto';
    document.body.style.cursor = 'auto';
  }, []);

  const handleClick1 = () => {
    console.log('🚨 MINIMAL: Button 1 clicked!');
    alert('🚨 MINIMAL REACT: Button 1 WORKS!');
  };

  const handleClick2 = () => {
    console.log('🚨 MINIMAL: Button 2 clicked!');
    alert('🚨 MINIMAL REACT: Button 2 WORKS!');
  };

  const handleClick3 = () => {
    console.log('🚨 MINIMAL: Button 3 clicked!');
    alert('🚨 MINIMAL REACT: Button 3 WORKS!');
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

  const greenButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: '#28a745'
  };

  return (
    <div style={{ pointerEvents: 'auto', cursor: 'auto' }}>
      <h1 style={{ color: '#333', marginBottom: '20px' }}>
        🚨 ABSOLUTE MINIMAL REACT TEST
      </h1>
      <p style={{ marginBottom: '30px', color: '#666' }}>
        This is minimal React with NO router, NO external CSS, NO complex dependencies.
      </p>
      
      <button style={buttonStyle} onClick={handleClick1}>
        🔵 REACT CLICK TEST 1
      </button>
      
      <button style={redButtonStyle} onClick={handleClick2}>
        🔴 REACT CLICK TEST 2
      </button>
      
      <button style={greenButtonStyle} onClick={handleClick3}>
        🟢 REACT CLICK TEST 3
      </button>
      
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>React Test Status:</h3>
        <p style={{ margin: 0, color: '#666' }}>
          If you can click the buttons above and see alerts, React click events are working.
        </p>
      </div>
      
      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '5px'
      }}>
        <strong>Next Test:</strong> Try the pure HTML version at{' '}
        <a 
          href="/absolute-minimal-test.html" 
          style={{ color: '#007bff', textDecoration: 'underline' }}
          onClick={(e) => {
            console.log('🚨 MINIMAL: Link clicked');
          }}
        >
          /absolute-minimal-test.html
        </a>
      </div>
    </div>
  );
}

export default App;
