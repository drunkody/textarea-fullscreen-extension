import { useState } from 'react';
import { useSettings } from './hooks/useSettings';
import { SettingsForm } from './components/SettingsForm/SettingsForm';
import browser from 'webextension-polyfill';
import './styles.css';

export const PopupApp = () => {
    const { settings, loading, saveSettings } = useSettings();
    const [statusMessage, setStatusMessage] = useState('');

    const handleSave = async (newSettings) => {
        await saveSettings(newSettings);
        setStatusMessage('Settings saved!');
        setTimeout(() => setStatusMessage(''), 2000);

        const tabs = await browser.tabs.query({});
        for (const tab of tabs) {
            if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
                try {
                    await browser.tabs.sendMessage(tab.id, {
                        type: 'SETTINGS_UPDATED',
                        settings: newSettings
                    });
                } catch (error) {
                    // Ignore errors for tabs that don't have the content script
                }
            }
        }
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="popup-app">
            <h3>⛶ Textarea Fullscreen</h3>
            {statusMessage && <div className="status-message">{statusMessage}</div>}
            <SettingsForm settings={settings} onSave={handleSave} />
            <div class="info-box">
             <strong>ℹ️ Note:</strong>
             After saving, refresh any page to apply changes to existing textareas. New textareas will use the new settings automatically.
            </div>
        </div>
    );
};
