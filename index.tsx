
import React from 'react';
import ReactDOM from 'react-dom/client';
// FIX: Explicitly add file extension to solve module resolution issue.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);