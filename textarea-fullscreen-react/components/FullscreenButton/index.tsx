import './style.css';
import { logger } from '../../utils/logger';

interface FullscreenButtonProps {
  onClick: () => void;
  isExpanded: boolean;
}

export function FullscreenButton({ onClick, isExpanded }: FullscreenButtonProps) {
  const handleClick = () => {
    logger.debug('FullscreenButton clicked', { isExpanded });
    onClick();
  };

  return (
    <button
      className="tx-fullscreen-btn"
      onClick={handleClick}
      aria-label="Toggle Fullscreen"
      title="Toggle Fullscreen (Ctrl+F)"
      type="button"
    >
      {isExpanded ? '⊗' : '⛶'}
    </button>
  );
}