import browser from 'webextension-polyfill';

export const loadSettings = async (defaults) => {
    try {
        return await browser.storage.sync.get(defaults);
    } catch (error) {
        console.error('Error loading settings:', error);
        return defaults;
    }
};

export const saveSettings = async (settings) => {
    try {
        await browser.storage.sync.set(settings);
    } catch (error) {
        console.error('Error saving settings:', error);
    }
};

export const onSettingsChanged = (callback) => {
    const listener = (changes, area) => {
        if (area === 'sync') {
            callback(changes);
        }
    };
    browser.storage.onChanged.addListener(listener);
    return () => browser.storage.onChanged.removeListener(listener);
};
