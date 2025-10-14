// Save settings
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    overlay: document.getElementById('overlay').checked,
    maxWidth: document.getElementById('maxWidth').value,
    maxHeight: document.getElementById('maxHeight').value,
    shortcutKey: document.getElementById('shortcutKey').value.toLowerCase()
  };

  const storageAPI = typeof chrome !== 'undefined' && chrome.storage 
    ? chrome.storage 
    : (typeof browser !== 'undefined' && browser.storage ? browser.storage : null);

  const tabsAPI = typeof chrome !== 'undefined' && chrome.tabs 
    ? chrome.tabs 
    : (typeof browser !== 'undefined' && browser.tabs ? browser.tabs : null);

  if (!storageAPI) return;

  storageAPI.sync.set(settings, () => {
    // Show status message
    const status = document.getElementById('status');
    status.style.display = 'block';
    status.textContent = 'Settings saved!';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);

    // Send message to all tabs (but don't reload them)
    if (tabsAPI) {
      tabsAPI.query({}, (tabs) => {
        tabs.forEach(tab => {
          // Only message tabs that can receive messages
          if (tab.id && tab.url && 
              !tab.url.startsWith('chrome://') &&
              !tab.url.startsWith('chrome-extension://') &&
              !tab.url.startsWith('about:') &&
              !tab.url.startsWith('moz-extension://')) {
            
            // Send message (content script can listen and update settings)
            if (typeof chrome !== 'undefined' && chrome.tabs.sendMessage) {
              chrome.tabs.sendMessage(tab.id, {
                type: 'SETTINGS_UPDATED',
                settings: settings
              }).catch(() => {
                // Ignore errors for tabs without content script
              });
            } else if (typeof browser !== 'undefined' && browser.tabs.sendMessage) {
              browser.tabs.sendMessage(tab.id, {
                type: 'SETTINGS_UPDATED',
                settings: settings
              }).catch(() => {
                // Ignore errors
              });
            }
          }
        });
      });
    }
  });
});
