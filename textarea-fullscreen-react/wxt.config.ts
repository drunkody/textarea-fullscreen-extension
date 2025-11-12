import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Textarea Fullscreen',
    description: 'Fullscreen editor for any textarea',
    version: '1.0.0',
    permissions: ['storage', 'tabs'],
    action: {
      default_popup: 'popup.html',
      default_title: 'Textarea Fullscreen Settings'
    }
  }
});