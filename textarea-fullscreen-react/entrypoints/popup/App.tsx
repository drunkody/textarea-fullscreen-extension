// entrypoints/popup/App.tsx
import { useState } from 'react';
import { SettingsForm } from '../../components/SettingsForm';
import { useSettings } from '../../hooks/useSettings';
import type { Settings } from '../../types/settings';
import './App.css';

export default function App() {
  const { settings, loading, saveSettings } = useSettings();
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState<'success' | 'error'>('success');

  const handleSave = async (newSettings: Settings) => {
    try {
      await saveSettings(newSettings);
      setStatusType('success');
      setStatusMessage('✓ Settings saved successfully!');

      // Clear message after 2 seconds
      setTimeout(() => setStatusMessage(''), 2000);
    } catch (error) {
      setStatusType('error');
      setStatusMessage('✗ Failed to save settings');

      setTimeout(() => setStatusMessage(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className="popup-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="popup-header">
        <h3 className="popup-title">
          <span className="popup-icon">⛶</span>
          Textarea Fullscreen
        </h3>
        <p className="popup-subtitle">Configure your fullscreen experience</p>
      </div>

      {/* Status Message */}
      {statusMessage && (
        <div className={`status-message status-${statusType}`}>
          {statusMessage}
        </div>
      )}

      {/* Settings Form */}
      <SettingsForm settings={settings} onSave={handleSave} />

      {/* Info Box */}
      <div className="info-box">
        <strong>💡 Quick Tip:</strong>
        <p>
          Press <kbd>Ctrl</kbd>+<kbd>{settings.shortcutKey.toUpperCase()}</kbd> on any
          textarea to toggle fullscreen mode.
        </p>
      </div>

      {/* Footer */}
      <div className="popup-footer">
        <small>Version 1.0.0 • Made with ❤️</small>
      </div>
    </div>
  );
}
