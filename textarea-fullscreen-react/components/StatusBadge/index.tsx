import { Badge } from '../Badge';

interface StatusBadgeProps {
  textareaCount: number;
}

/**
 * Status badge showing number of detected textareas
 */
export function StatusBadge({ textareaCount }: StatusBadgeProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: '10px',
        right: '10px',
        zIndex: 999999,
        background: 'white',
        padding: '10px',
        borderRadius: '4px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}
    >
      <Badge color={textareaCount > 0 ? '#4caf50' : '#9e9e9e'}>
        ✅ {textareaCount} textarea{textareaCount !== 1 ? 's' : ''}
      </Badge>
    </div>
  );
}
