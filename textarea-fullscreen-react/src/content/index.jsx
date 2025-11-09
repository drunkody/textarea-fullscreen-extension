import React from 'react';
import { createRoot } from 'react-dom/client';
import { ContentApp } from './ContentApp';

const init = () => {
    const container = document.createElement('div');
    container.id = 'textarea-fullscreen-root';
    document.body.appendChild(container);

    const root = createRoot(container);
    root.render(
        <React.StrictMode>
            <ContentApp />
        </React.StrictMode>
    );
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
