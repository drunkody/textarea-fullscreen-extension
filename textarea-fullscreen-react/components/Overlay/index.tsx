import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import './style.css';

interface OverlayProps {
  onClose: () => void;
  visible: boolean;
}

/**
 * Background overlay component with blur effect
 * Renders below fullscreen editor using React Portal
 */
export function Overlay({ onClose, visible }: OverlayProps) {
  const [opacity, setOpacity] = useState(0);

  // Fade-in animation on mount
  useEffect(() => {
    if (visible) {
      // Use requestAnimationFrame to ensure CSS transition is triggered
      requestAnimationFrame(() => {
        setOpacity(1);
      });
    }
  }, [visible]);

  // Handle close with fade-out animation
  const handleClose = () => {
    // Fade out first
    setOpacity(0);

    // Then call onClose after animation completes
    setTimeout(onClose, 300); // Match CSS transition duration
  };

  if (!visible) return null;

  return createPortal(
    <div
      className="tx-overlay"
      onClick={handleClose}
      style={{ opacity }}
    />,
    document.body
  );
}
