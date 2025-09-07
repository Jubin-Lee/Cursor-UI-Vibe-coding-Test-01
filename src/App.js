import React from 'react';
import './App.css';
import Header from './components/Header';
import MapContainer from './components/MapContainer';
import LinearDiagram from './components/LinearDiagram';
import BottomPanels from './components/BottomPanels';
import Toast from './components/Toast';

function App() {
  return (
    <div className="app">
      <Header />
      <MapContainer />
      <LinearDiagram />
      <BottomPanels />
      <Toast />
    </div>
  );
}

export default App;

