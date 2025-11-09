import { useState } from 'react';
import browser from 'webextension-polyfill';
import './styles.css';

export const FullscreenButton = ({ onClick, isExpanded }) => {
    const [isHovered, setIsHovered] = useState(false);

    const iconUrl = browser.runtime.getURL(
        isExpanded ? 'icons/collapse.svg' : 'icons/expand.svg'
    );

    return (
        <button
            className={`tx-icon ${isExpanded ? 'expanded' : ''}`}
            onClick={onClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Toggle Fullscreen"
            title="Toggle Fullscreen (Ctrl+F)"
            style={{
                backgroundImage: `url("${iconUrl}")`,
                opacity: isHovered ? 1 : 0.85,
                transform: isHovered ? 'scale(1.05)' : 'scale(1)'
            }}
        />
    );
};
