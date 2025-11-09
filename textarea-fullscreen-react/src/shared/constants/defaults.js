export const DEFAULT_SETTINGS = {
    enabled: true,
    overlay: true,
    maxWidth: '90vw',
    maxHeight: '90vh',
    shortcutKey: 'f',
    excludedDomains: [
        'mail.google.com',
        'docs.google.com',
        'sheets.google.com'
    ]
};

export const PERFORMANCE_LIMITS = {
    MAX_PROCESS_COUNT: 100,
    TIME_WINDOW: 5000,
    RESET_INTERVAL: 5000,
    MAX_BATCH_SIZE: 10
};

export const Z_INDEX = {
    BUTTON: 999999,
    OVERLAY: 2147483646,
    EDITOR: 2147483647
};
