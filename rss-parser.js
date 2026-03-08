/**
 * ЧБ Новости 2026 — Парсер RSS
 */
class RSSParser {
    constructor(config) {
        this.config = config;
        this.parser = typeof Parser !== 'undefined' ? new Parser({
            customFields: {
                item: ['content:encoded', 'media:content']
            }
        }) : null;
    }

    // Загрузка и парсинг одной ленты
    async fetchFeed(url) {
        try {
            // Используем CORS-прокси для браузерных запросов
            const proxyUrl = this.config.corsProxy + encodeURIComponent(url);
            const response = await fetch(proxyUrl, {
                headers: { 'User-Agent': this.config.userAgent },
                signal: AbortSignal.timeout(this.config.timeout)
            });
            
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const xml = await response.text();
            
            return this.parser ? await this.parser.parseString(xml) : this.fallbackParse(xml);
        } catch (error) {
            console.warn(`Ошибка загрузки ${url}:`, error.message);
            return null;
        }
    }

    // Резервный парсер (если rss-parser не подключён)
    fallbackParse(xml) {
        const items = [];
        const parser = new DOMParser();
        const doc = parser.parseFromString(xml, 'text/xml');
        const entries = doc.querySelectorAll('item, entry');
        
        entries.forEach(entry => {
            const title = entry.querySelector('title')?.textContent || 'Без заголовка';
            const link = entry.querySelector('link')?.textContent 
                      || entry.querySelector('link')?.getAttribute('href') 
                      || '#';
            const description = entry.querySelector('description')?.textContent 
                             || entry.querySelector('summary')?.textContent 
                             || '';
            const pubDate = entry.querySelector('pubDate, published')?.textContent;
            const source = entry.querySelector('source')?.textContent 
                        || new URL(link).hostname;
            
            if (title && link) {
                items.push({
                    title: this.stripHtml(title),
                    description: this.stripHtml(description).substring(0, 200) + '...',
                    link: link.trim(),
                    pubDate: pubDate ? new Date(pubDate) : new Date(),
                    source: this.stripHtml(source)
                });
            }
        });
        
        return { items: items.slice(0, this.config.maxItemsPerFeed) };
    }

    // Очистка от HTML-тегов
    stripHtml(html) {
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Форматирование даты
    formatTimeAgo(date) {
        const now = new Date();
        const diff = Math.floor((now - date) / 1000);
        
        if (diff < 60) return 'только что';
        if (diff < 3600) return `${Math.floor(diff/60)} мин. назад`;
        if (diff < 86400) return `${Math.floor(diff/3600)} ч. назад`;
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }

    // Загрузка всех лент категории
    async fetchCategory(category) {
        const feeds = this.config.RSS_FEEDS[category] || [];
        if (!feeds.length) return [];
        
        const results = await Promise.allSettled(
            feeds.map(url => this.fetchFeed(url))
        );
        
        const allItems = results
            .filter(r => r.status === 'fulfilled' && r.value?.items)
            .flatMap(r => r.value.items)
            .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
            .slice(0, 20); // Топ-20 свежих
        
        return allItems.map(item => ({
            ...item,
            category,
            timeAgo: this.formatTimeAgo(item.pubDate)
        }));
    }
}

// Экспорт
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RSSParser;
}
