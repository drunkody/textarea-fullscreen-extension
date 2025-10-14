// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    enabled: true,
    overlay: true,
    maxWidth: '80%',
    maxHeight: '80%',
    shortcutKey: 'f'
  }, (items) => {
    document.getElementById('enabled').checked = items.enabled;
    document.getElementById('overlay').checked = items.overlay;
    document.getElementById('maxWidth').value = items.maxWidth;
    document.getElementById('maxHeight').value = items.maxHeight;
    document.getElementById('shortcutKey').value = items.shortcutKey;
  });
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const settings = {
    enabled: document.getElementById('enabled').checked,
    overlay: document.getElementById('overlay').checked,
    maxWidth: document.getElementById('maxWidth').value,
    maxHeight: document.getElementById('maxHeight').value,
    shortcutKey: document.getElementById('shortcutKey').value.toLowerCase()
  };

  chrome.storage.sync.set(settings, () => {
    // Show status message
    const status = document.getElementById('status');
    status.style.display = 'block';
    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);

    // Reload all tabs to apply new settings
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        if (tab.url && !tab.url.startsWith('chrome://')) {
          chrome.tabs.reload(tab.id);
        }
      });
    });
  });
});