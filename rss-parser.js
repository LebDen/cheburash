// ==================== RSS ПАРСЕР ====================

const newsParser = {
    // Загрузка из кэша
    loadFromCache: function() {
        try {
            const cached = localStorage.getItem('newsData');
            return cached ? JSON.parse(cached) : null;
        } catch (e) {
            console.error('Ошибка загрузки кэша:', e);
            return null;
        }
    },

    // Сохранение в кэш
    saveToCache: function(data) {
        try {
            localStorage.setItem('newsData', JSON.stringify(data));
            localStorage.setItem('lastUpdate', new Date().toISOString());
        } catch (e) {
            console.error('Ошибка сохранения кэша:', e);
        }
    },

    // Проверка валидности кэша
    isCacheValid: function() {
        const lastUpdate = localStorage.getItem('lastUpdate');
        if (!lastUpdate) return false;
        
        const cacheAge = Date.now() - new Date(lastUpdate).getTime();
        const maxAge = APP_CONFIG.update.cacheDuration * 60 * 1000;
        
        return cacheAge < maxAge;
    },

    // Форматирование даты
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', APP_CONFIG.display.dateFormat);
    },

    // Обрезка текста
    truncateWords: function(text, maxWords) {
        if (!text) return '';
        const words = text.split(' ');
        if (words.length <= maxWords) return text;
        return words.slice(0, maxWords).join(' ') + '...';
    },

    // Парсинг всех категорий
    parseAll: async function() {
        const categories = ['world', 'russia', 'svo'];
        const result = {
            world: { items: [], sources: [] },
            russia: { items: [], sources: [] },
            svo: { items: [], sources: [] },
            timestamp: new Date().toISOString(),
            totalNews: 0
        };

        for (const category of categories) {
            const data = await this.parseCategory(category);
            result[category] = data;
            result.totalNews += data.items.length;
        }

        this.saveToCache(result);
        return result;
    },

    // Парсинг категории
    parseCategory: async function(category) {
        const feeds = APP_CONFIG.rss.feeds[category] || [];
        const items = [];
        const sources = new Set();

        for (const feedUrl of feeds) {
            try {
                const feedItems = await this.fetchFeed(feedUrl);
                feedItems.forEach(item => {
                    items.push({
                        ...item,
                        category,
                        formattedDate: this.formatDate(item.pubDate),
                        shortDescription: this.truncateWords(item.description, APP_CONFIG.display.maxDescriptionWords)
                    });
                    sources.add(item.source);
                });
            } catch (e) {
                console.warn(`Ошибка парсинга ${feedUrl}:`, e);
            }
        }

        // Сортировка по дате
        items.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

        return {
            items: items.slice(0, APP_CONFIG.display.categoryNewsCount),
            sources: Array.from(sources)
        };
    },

    // Загрузка одной ленты
    fetchFeed: async function(url) {
        const proxyUrl = APP_CONFIG.rss.corsProxy + encodeURIComponent(url);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), APP_CONFIG.update.requestTimeout);

        try {
            const response = await fetch(proxyUrl, {
                signal: controller.signal,
                headers: { 'Accept': 'application/rss+xml, application/xml' }
            });
            clearTimeout(timeout);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const xml = await response.text();
            const parser = new RSSParser();
            const feed = await parser.parseString(xml);

            return (feed.items || []).slice(0, APP_CONFIG.rss.maxItemsPerFeed).map(item => ({
                title: this.stripHtml(item.title),
                link: item.link,
                pubDate: item.pubDate || new Date().toISOString(),
                source: item.source || new URL(item.link).hostname.replace('www.', ''),
                description: this.stripHtml(item.contentSnippet || item.description || '')
            }));
        } catch (e) {
            throw e;
        }
    },

    // Очистка HTML
    stripHtml: function(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
};

// Экспорт глобально
window.newsParser = newsParser;
