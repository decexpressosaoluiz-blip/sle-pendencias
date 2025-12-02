import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '../index.css'; // Updated path to point to root index.css or src/index.css depending on location. Assuming root for now based on previous.

// Ensure we find the root element
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

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}