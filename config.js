// ==================== КОНФИГУРАЦИЯ ====================

// Настройки обновления
const UPDATE_CONFIG = {
    cacheDuration: 60, // минут
    requestTimeout: 15000 // мс
};

// Настройки отображения
const DISPLAY_CONFIG = {
    previewNewsCount: 6,
    categoryNewsCount: 12,
    maxDescriptionWords: 100
};

// RSS-источники
const RSS_CONFIG = {
    feeds: [
        { name: 'РИА Новости', url: 'https://ria.ru/export/rss2/archive/index.xml' },
        { name: 'ТАСС', url: 'https://tass.ru/rss/v2.xml' },
        { name: 'Минобороны РФ', url: 'https://function.mil.ru/rss/news.htm' },
        { name: 'Российская газета', url: 'https://rg.ru/xml/index.xml' },
        { name: 'Звезда', url: 'https://tvzvezda.ru/rss.xml' }
    ],
    corsProxy: 'https://api.rss2json.com/v1/api.json?rss_url='
};

// Ключевые слова для категоризации
const KEYWORDS = {
    svo: [
        'сво', 'спецоперация', 'донбасс', 'донецк', 'луганск', 'запорожье', 'херсон',
        'министерство обороны', 'мобилизация', 'контрактник', 'дрон', 'бпла', 'пво',
        'артобстрел', 'линия соприкосновения', 'вс рф', 'военная техника'
    ],
    russia: [
        'россия', 'рф', 'москва', 'правительство рф', 'госдума', 'регион',
        'экономика россии', 'нацпроекты', 'губернатор', 'президент рф'
    ],
    world: [
        'сша', 'китай', 'ес', 'евросоюз', 'нато', 'оон', 'санкции',
        'международный', 'саммит', 'переговоры', 'выборы', 'конфликт'
    ]
};

// Экспорт
window.APP_CONFIG = {
    update: UPDATE_CONFIG,
    display: DISPLAY_CONFIG,
    rss: RSS_CONFIG,
    keywords: KEYWORDS
};