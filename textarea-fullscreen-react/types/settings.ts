// types/settings.ts
export interface Settings {
  enabled: boolean;
  overlay: boolean;
  shortcutKey: string;
  excludedDomains: string;
}

export const DEFAULT_SETTINGS: Settings = {
  enabled: true,
  overlay: true,
  shortcutKey: 'f',
  excludedDomains: ''
};
