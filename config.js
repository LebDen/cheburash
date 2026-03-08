/**
 * ЧБ Новости 2026 — Конфигурация
 */
const CONFIG = {
    // RSS-источники (официальные, публичные)
    RSS_FEEDS: {
        world: [
            'https://ria.ru/export/rss2/index.xml',
            'https://tass.ru/rss/v2.xml'
        ],
        russia: [
            'https://ria.ru/export/rss2/russia.xml',
            'https://rg.ru/rss/region.xml'
        ],
        svo: [
            'https://function.mil.ru/news_page/country/more.htm',
            'https://tass.ru/rss/v2.xml?feed=48' // Пример: лента по теме СВО
        ]
    },

    // Настройки парсинга
    PARSER: {
        timeout: 10000, // 10 секунд
        maxItemsPerFeed: 10, // Макс. новостей с одного источника
        corsProxy: 'https://api.allorigins.win/raw?url=', // CORS-прокси для браузерных запросов
        userAgent: 'CHB-NewsBot/1.0 (+https://t.me/cheburashNEWS)'
    },

    // Таймер обновления
    COUNTDOWN: {
        nextUpdate: new Date(new Date().setHours(18, 0, 0, 0)), // Ежедневно в 18:00
        autoRefresh: true
    },

    // Админ-панель
    ADMIN: {
        passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d9', // SHA256 от "password" (замените!)
        sessionKey: 'chb_admin_session',
        sessionDuration: 3600000 // 1 час
    },

    // Хранение (localStorage)
    STORAGE: {
        newsKey: 'chb_news_cache',
        settingsKey: 'chb_settings',
        maxCacheAge: 3600000 // 1 час
    },

    // Интеграции
    TELEGRAM: {
        botUsername: '@CheburashNEWS_bot',
        channelUrl: 'https://t.me/cheburashNEWS'
    }
};

// Экспорт для модулей
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
