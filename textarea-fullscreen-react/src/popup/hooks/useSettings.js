import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import { DEFAULT_SETTINGS } from '../../shared/constants/defaults';

export const useSettings = () => {
    const [settings, setSettings] = useState(DEFAULT_SETTINGS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const storedSettings = await browser.storage.sync.get(DEFAULT_SETTINGS);
                setSettings(storedSettings);
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSettings();

        const handleSettingsChange = (changes, area) => {
            if (area === 'sync') {
                for (let key in changes) {
                    setSettings(prev => ({ ...prev, [key]: changes[key].newValue }));
                }
            }
        };

        browser.storage.onChanged.addListener(handleSettingsChange);

        return () => {
            browser.storage.onChanged.removeListener(handleSettingsChange);
        };
    }, []);

    const saveSettings = async (newSettings) => {
        try {
            await browser.storage.sync.set(newSettings);
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    const shouldRunOnCurrentDomain = () => {
        if (!settings.excludedDomains) return true;
        const hostname = window.location.hostname;
        return !settings.excludedDomains.some(domain => hostname.includes(domain));
    };

    return {
        settings,
        loading,
        saveSettings,
        shouldRunOnCurrentDomain
    };
};
