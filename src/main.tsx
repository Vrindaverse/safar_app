// index.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'

// Remove StrictMode temporarily to test
ReactDOM.createRoot(document.getElementById('root')!).render(
  //<React.StrictMode>
    <App />
  //</React.StrictMode>
);
