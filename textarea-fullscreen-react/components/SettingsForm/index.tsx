// components/SettingsForm/index.tsx
import { useForm } from 'react-hook-form';
import type { Settings } from '../../types/settings';
import './style.css';

interface SettingsFormProps {
  settings: Settings;
  onSave: (data: Settings) => void;
}

export function SettingsForm({ settings, onSave }: SettingsFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Settings>({ defaultValues: settings });

  return (
    <form onSubmit={handleSubmit(onSave)} className="settings-form">
      {/* Enable extension */}
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" {...register('enabled')} />
          <span>Enable extension</span>
        </label>
        <small className="form-hint">
          Toggle the entire extension on/off
        </small>
      </div>

      {/* Show overlay */}
      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" {...register('overlay')} />
          <span>Show background overlay</span>
        </label>
        <small className="form-hint">
          Darken the page when fullscreen editor is open
        </small>
      </div>

      {/* Shortcut key */}
      <div className="form-group">
        <label htmlFor="shortcutKey" className="form-label">
          Shortcut Key
        </label>
        <input
          id="shortcutKey"
          type="text"
          maxLength={1}
          placeholder="f"
          className="form-input"
          {...register('shortcutKey', {
            required: 'Shortcut key is required',
            maxLength: { value: 1, message: 'Only one character allowed' },
            pattern: {
              value: /^[a-z0-9]$/i,
              message: 'Must be a letter or number'
            }
          })}
        />
        <small className="form-hint">
          Press Ctrl+[Key] to toggle fullscreen
        </small>
        {errors.shortcutKey && (
          <span className="error-message">{errors.shortcutKey.message}</span>
        )}
      </div>

      {/* Excluded domains */}
      <div className="form-group">
        <label htmlFor="excludedDomains" className="form-label">
          Excluded Domains
        </label>
        <textarea
          id="excludedDomains"
          rows={4}
          placeholder="mail.google.com&#10;docs.google.com&#10;github.com"
          className="form-textarea"
          {...register('excludedDomains')}
        />
        <small className="form-hint">
          Extension won't work on these domains (one per line)
        </small>
      </div>

      {/* Submit button */}
      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Settings'}
      </button>
    </form>
  );
}