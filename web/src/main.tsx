import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'
import './index.css'

console.log('main.tsx: Starting app render');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('main.tsx: Root element not found!');
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
  console.log('main.tsx: App rendered successfully');
} catch (error) {
  console.error('main.tsx: Error rendering app:', error);
  rootElement.innerHTML = `
    <div style="min-height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
      <div style="background: rgba(0,0,0,0.3); padding: 2rem; border-radius: 15px; max-width: 600px;">
        <h1>Error Loading App</h1>
        <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
        <pre style="background: rgba(0,0,0,0.3); padding: 1rem; margin-top: 1rem; border-radius: 8px; overflow: auto; font-size: 0.8rem;">
          ${error instanceof Error ? error.stack : String(error)}
        </pre>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #4CAF50; color: white; border: none; border-radius: 8px; cursor: pointer; margin-top: 1rem;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
