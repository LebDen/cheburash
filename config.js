// ==================== КОНФИГУРАЦИЯ ПРОЕКТА ====================

// Настройки администратора
const ADMIN_CONFIG = {
    defaultPassword: 'admin123',
    minPasswordLength: 6,
    maxTitleLength: 200
};

// Настройки обновления
const UPDATE_CONFIG = {
    autoUpdateInterval: 0,
    cacheDuration: 60,
    requestTimeout: 15000
};

// Настройки отображения
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

// Настройки Telegram
const TELEGRAM_CONFIG = {
    newsPerCategory: 3,
    maxTitleLength: 80,
    siteUrl: 'https://ваш-сайт.com'
};

// RSS Источники
const RSS_CONFIG = {
    feeds: {
        world: [
            'https://ria.ru/export/rss2/index.xml',
            'https://tass.ru/rss/v2.xml'
        ],
        russia: [
            'https://ria.ru/export/rss2/russia.xml',
            'https://rg.ru/rss/region.xml'
        ],
        svo: [
            'https://ria.ru/export/rss2/russia.xml'
        ]
    },
    corsProxy: 'https://api.allorigins.win/raw?url=',
    maxItemsPerFeed: 10
};

// ==================== ЭКСПОРТ КОНФИГУРАЦИИ ====================
window.APP_CONFIG = {
    admin: ADMIN_CONFIG,
    update: UPDATE_CONFIG,
    display: DISPLAY_CONFIG,
    telegram: TELEGRAM_CONFIG,
    rss: RSS_CONFIG
};
