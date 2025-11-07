import React from 'react';
import DQ2SidohBattle from './DQ2SidohBattle';
import './index.css';
import backgroundImage from './assets/background.png';

function App() {
  return (
    <div 
      className="App"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        minHeight: '100vh',
        width: '100%'
      }}
    >
      <DQ2SidohBattle />
    </div>
  );
}

export default App;
