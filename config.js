// ==================== КОНФИГУРАЦИЯ ПРОЕКТА ====================

// Настройки администратора
const ADMIN_CONFIG = {
    // Пароль по умолчанию (РЕКОМЕНДУЕТСЯ СМЕНИТЬ!)
    defaultPassword: 'admin123',
    
    // Минимальная длина пароля
    minPasswordLength: 6,
    
    // Максимальная длина заголовка новости
    maxTitleLength: 200
};

// Настройки обновления
const UPDATE_CONFIG = {
    // Интервал автообновления (в минутах, 0 = отключено)
    autoUpdateInterval: 0,
    
    // Кэш новостей (в минутах)
    cacheDuration: 60,
    
    // Таймаут запроса к RSS (в миллисекундах)
    requestTimeout: 15000
};

// Настройки отображения
const DISPLAY_CONFIG = {
    // Количество новостей в превью на главной
    previewNewsCount: 6,
    
    // Количество новостей в каждой категории
    categoryNewsCount: 12,
    
    // Показывать время публикации
    showTime: true,
    
    // Формат даты
    dateFormat: {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    },
    
    // Максимальное количество слов в описании
    maxDescriptionWords: 100
};

// Настройки Telegram
const TELEGRAM_CONFIG = {
    // Количество новостей в сообщении
    newsPerCategory: 3,
    
    // Максимальная длина заголовка в сообщении
    maxTitleLength: 80,
    
    // Ссылка на сайт (для публикации)
    siteUrl: 'https://ваш-сайт.com'
};

// ==================== ЭКСПОРТ КОНФИГУРАЦИИ ====================
window.APP_CONFIG = {
    admin: ADMIN_CONFIG,
    update: UPDATE_CONFIG,
    display: DISPLAY_CONFIG,
    telegram: TELEGRAM_CONFIG
};