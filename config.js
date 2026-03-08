// ==================== КОНФИГУРАЦИЯ ПРОЕКТА ====================
const ADMIN_CONFIG = {
    defaultPassword: 'admin123',
    minPasswordLength: 6,
    maxTitleLength: 200
};

const UPDATE_CONFIG = {
    autoUpdateInterval: 0,
    cacheDuration: 60,
    requestTimeout: 15000
};

const DISPLAY_CONFIG = {
    previewNewsCount: 6,
    categoryNewsCount: 12,
    showTime: true,
    dateFormat: {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    },
    maxDescriptionWords: 100
};

const TELEGRAM_CONFIG = {
    newsPerCategory: 3,
    maxTitleLength: 80,
    siteUrl: 'https://ваш-сайт.com'
};

window.APP_CONFIG = {
    admin: ADMIN_CONFIG,
    update: UPDATE_CONFIG,
    display: DISPLAY_CONFIG,
    telegram: TELEGRAM_CONFIG
};