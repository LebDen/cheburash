const CONFIG = {
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
            'https://tass.ru/rss/v2.xml?feed=48'
        ]
    },
    CORS_PROXY: 'https://api.allorigins.win/raw?url=',
    MAX_NEWS_PER_CATEGORY: 5,
    TIMEOUT: 10000,
    
    // Настройки игр (замените на свои ссылки)
    GAMES: {
        dog: {
            name: 'Служебная Собака',
            subtitle: 'ПОГОНЯ ULTIMATE',
            url: 'ВАША_ССЫЛКА_НА_СОБАКУ'
        },
        pet: {
            name: 'Virtual PET',
            subtitle: 'Тамагочи 2.0',
            url: 'ВАША_ССЫЛКА_НА_PET'
        }
    },
    
    // Telegram
    TELEGRAM: {
        channel: 'https://t.me/cheburashNEWS',
        bot: '@CheburashNEWS_bot'
    }
};
