import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

import { CertificateProvider } from './contexts/CertificateContext';

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <CertificateProvider>
      <App />
    </CertificateProvider>
  </React.StrictMode>
);