import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();


function suppressResizeObserverErrors() {
  const ignoreMsgs = [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
  ];

  const handler = (e) => {
    const msg =
      String(e.message || (e.reason && e.reason.message) || e.reason || '');
    if (ignoreMsgs.some((m) => msg.includes(m))) {
      if (e.preventDefault) e.preventDefault();
      if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      return;
    }
  };

  window.addEventListener('error', handler, true);
  window.addEventListener('unhandledrejection', handler, true);

  const originalError = window.console.error;
  window.console.error = (...args) => {
    const first = args[0];
    const msg =
      (first && first.message) ||
      (typeof first === 'string' ? first : '') ||
      '';
    if (ignoreMsgs.some((m) => msg.includes(m))) {
      return;
    }
    originalError(...args);
  };
}

suppressResizeObserverErrors();
