import { defineConfig } from 'wxt';

export default defineConfig({
  // Enable React module
  modules: ['@wxt-dev/module-react'],

  // Output directory
  outDir: '.output',
  // ❌ Remove: srcDir: 'src',  (your files are at root, not in src/)

  // Manifest configuration
  manifest: {
    // Basic information
    name: 'Textarea Fullscreen',
    description: 'Expand any textarea to fullscreen for a better editing experience. Perfect for writing emails, comments, and long-form content.',
    version: '1.0.0',

    // Developer information (cross-browser compatible)
    developer: {
      name: 'Your Name',
      url: 'https://github.com/drunkody',
    },
    homepage_url: 'https://github.com/drunkody/textarea-fullscreen',

    // Icons (required for store submission)
    icons: {
      16: '/icon/16.png',
      48: '/icon/48.png',
      128: '/icon/128.png',
    },

    // Permissions
    permissions: ['storage'],

    // Action (popup)
    action: {
      default_popup: 'popup.html',
      default_title: 'Textarea Fullscreen Settings',
      default_icon: {
        16: '/icon/16.png',
        48: '/icon/48.png',
      },
    },

    // Web accessible resources
    web_accessible_resources: [
      {
        resources: ['icon/*.svg', 'icon/*.png'],
        matches: ['<all_urls>'],
      },
    ],

    // Commands (keyboard shortcuts) - works for both browsers
    commands: {
      toggle_fullscreen: {
        suggested_key: {
          default: 'Ctrl+Shift+F',
          mac: 'Command+Shift+F',
        },
        description: 'Toggle fullscreen editor',
      },
    },

    // Chrome-specific: minimum version
    minimum_chrome_version: '88',

    // Firefox-specific: browser settings
    browser_specific_settings: {
      gecko: {
        id: 'textarea-fullscreen@example.com',
        strict_min_version: '109.0',
      },
    },
  },

  // Development configuration (updated to use webExt instead of runner)
  dev: {
    server: {
      port: 3000,
    },
  },

  // Build optimizations
  zip: {
    artifactTemplate: '{{name}}-{{browser}}-{{version}}.zip',
  },
});