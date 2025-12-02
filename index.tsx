import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const mount = () => {
  let rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.warn("Root element 'root' not found. Creating it dynamically.");
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

// Ensure DOM is ready before mounting
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}