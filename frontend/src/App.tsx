import React from 'react';
import { Calculator } from './components/Calculator';
import './index.css';

export const App: React.FC = () => {
  return (
    <main className="app-wrapper">
      <Calculator />
    </main>
  );
};

export default App;
