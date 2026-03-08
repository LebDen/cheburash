// ==================== RSS-ПАРСЕР С РАСПРЕДЕЛЕНИЕМ ПО КЛЮЧЕВЫМ СЛОВАМ ====================
class RSSNewsParser {
    constructor() {
        this.parser = new RSSParser({
            customFields: {
                item: ['pubDate', 'link', 'guid', 'description', 'content:encoded']
            }
        });
        
        // РАБОЧИЕ RSS-ЛЕНТЫ (проверено 2026)
        this.allFeeds = [
            { name: 'РИА Новости', url: 'https://ria.ru/export/rss2/archive/index.xml' },
            { name: 'ТАСС', url: 'https://tass.ru/rss/v2.xml' },
            { name: 'Российская газета', url: 'https://rg.ru/xml/index.xml' },
            { name: 'Известия', url: 'https://iz.ru/rss' }
        ];

        // КЛЮЧЕВЫЕ СЛОВА ДЛЯ КАЖДОЙ КАТЕГОРИИ
        this.keywords = {
            svo: [
                'сво', 'спецоперация', 'специальная военная операция', 'зона сво', 'донбасс', 'донецк', 'днр', 'луганск', 'лнр',
                'запорожье', 'херсон', 'купянск', 'бахмут', 'авдеевка', 'маринка', 'соледар', 'линия соприкосновения',
                'министерство обороны рф', 'военкомат', 'мобилизация', 'контрактник', 'добровольцы', 'штурмовик',
                'обстрел', 'артобстрел', 'дрон', 'бпла', 'пво', 'военная техника', 'танк', 'вдв', 'морпехи', 'флот'
            ],
            russia: [
                'россия', 'рф', 'российская федерация', 'российский', 'россияне', 'москва', 'санкт-петербург',
                'правительство рф', 'госдума', 'совет федерации', 'кремль', 'президент рф', 'губернатор',
                'регион', 'область', 'край', 'республика', 'нацпроекты', 'экономика россии'
            ],
            world: [
                'сша', 'америка', 'китай', 'ес', 'евросоюз', 'германия', 'франция', 'великобритания',
                'оон', 'нато', 'саммит', 'переговоры', 'санкции', 'война', 'конфликт', 'выборы',
                'президент', 'премьер', 'международный', 'мировая экономика'
            ]
        };

        this.cache = new Map();
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (error) {
            return 'Неизвестно';
        }
    }

    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    truncateWords(text, wordCount = 100) {
        if (!text) return '';
        const cleanText = this.stripHtml(text);
        const words = cleanText.split(/\s+/).filter(word => word.length > 0);
        if (words.length <= wordCount) return cleanText;
        return words.slice(0, wordCount).join(' ') + '...';
    }

    removeDuplicates(newsItems) {
        const seen = new Set();
        return newsItems.filter(item => {
            const key = item.link?.trim() || item.title;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    categorizeNewsItem(item) {
        const text = (item.title + ' ' + item.description).toLowerCase();

        // СВО (высший приоритет)
        for (const keyword of this.keywords.svo) {
            if (text.includes(keyword)) {
                return 'svo';
            }
        }

        // Россия
        for (const keyword of this.keywords.russia) {
            if (text.includes(keyword)) {
                return 'russia';
            }
        }

        // Мир (по умолчанию)
        return 'world';
    }

    async parseFeed(feed) {
        const cacheKey = `${feed.url}_${Math.floor(Date.now() / 300000)}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            // Используем rss2json для обхода CORS
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed.url)}`;

            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const data = await response.json();
            if (data.status !== 'ok') throw new Error(`RSS parsing error: ${data.message || 'Unknown error'}`);

            const items = (data.items || []).map(item => ({
                title: this.truncateText(item.title || 'Без заголовка', 200),
                link: item.link || '#',
                pubDate: item.pubDate || new Date().toISOString(),
                description: item.description || '',
                source: feed.name,
                formattedDate: this.formatDate(item.pubDate),
                shortDescription: this.truncateWords(item.description || '', 100)
            }));

            const result = { source: feed.name, items };
            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error(`Ошибка парсинга ${feed.name}:`, error);
            return { source: feed.name, items: [] };
        }
    }

    async parseAll() {
        showLoading(true);

        try {
            const results = await Promise.allSettled(
                this.allFeeds.map(feed =>
                    Promise.race([
                        this.parseFeed(feed),
                        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 15000))
                    ])
                )
            );

            const allItems = [];
            const allSources = new Set();

            results.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value.items.length > 0) {
                    allItems.push(...result.value.items);
                    allSources.add(this.allFeeds[index].name);
                }
            });

            const uniqueItems = this.removeDuplicates(allItems);

            const categories = { world: [], russia: [], svo: [] };
            const categorySources = { world: new Set(), russia: new Set(), svo: new Set() };

            uniqueItems.forEach(item => {
                const category = this.categorizeNewsItem(item);
                categories[category].push(item);
                categorySources[category].add(item.source);
            });

            Object.keys(categories).forEach(cat => {
                categories[cat].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
                categories[cat] = categories[cat].slice(0, 15);
            });

            const result = {
                world: {
                    items: categories.world,
                    sources: Array.from(categorySources.world)
                },
                russia: {
                    items: categories.russia,
                    sources: Array.from(categorySources.russia)
                },
                svo: {
                    items: categories.svo,
                    sources: Array.from(categorySources.svo)
                },
                timestamp: new Date().toISOString(),
                totalNews: categories.world.length + categories.russia.length + categories.svo.length,
                totalSources: allSources.size
            };

            this.saveToCache(result);

            console.log('✅ Парсинг завершён:');
            console.log(`   🌍 Мир: ${categories.world.length} новостей`);
            console.log(`   🇷🇺 Россия: ${categories.russia.length} новостей`);
            console.log(`   ⚔️ СВО: ${categories.svo.length} новостей`);
            console.log(`   💎 Всего: ${result.totalNews} новостей`);

            this.updateCategoryBadges(result);

            return result;

        } catch (error) {
            console.error('❌ Критическая ошибка парсинга:', error);
            showNotification('❌ Ошибка при загрузке новостей', 'danger');
            return null;
        } finally {
            showLoading(false);
        }
    }

    updateCategoryBadges(data) {
        if (data.world.sources.length > 0) {
            document.getElementById('worldSourcesCount').textContent =
                `${data.world.sources.length} ${this.getSourcesText(data.world.sources.length)}`;
        }
        if (data.russia.sources.length > 0) {
            document.getElementById('russiaSourcesCount').textContent =
                `${data.russia.sources.length} ${this.getSourcesText(data.russia.sources.length)}`;
        }
        if (data.svo.sources.length > 0) {
            document.getElementById('svoSourcesCount').textContent =
                `${data.svo.sources.length} ${this.getSourcesText(data.svo.sources.length)}`;
        }
    }

    getSourcesText(count) {
        if (count === 1) return 'источник';
        if (count > 1 && count < 5) return 'источника';
        return 'источников';
    }

    saveToCache(data) {
        try {
            localStorage.setItem('newsData', JSON.stringify(data));
            localStorage.setItem('lastUpdate', new Date().toISOString());
        } catch (error) {
            console.error('Ошибка сохранения в кэш:', error);
        }
    }

    loadFromCache() {
        try {
            const cachedData = localStorage.getItem('newsData');
            const lastUpdate = localStorage.getItem('lastUpdate');
            if (!cachedData || !lastUpdate) return null;

            const data = JSON.parse(cachedData);
            const cacheAge = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60);
            if (cacheAge > 60) {
                return null;
            }

            return data;
        } catch (error) {
            console.error('Ошибка загрузки из кэша:', error);
            return null;
        }
    }

    isCacheValid() {
        const lastUpdate = localStorage.getItem('lastUpdate');
        if (!lastUpdate) return false;
        const cacheAge = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60);
        return cacheAge <= 60;
    }
}

const newsParser = new RSSNewsParser();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

function showNotification(message, type = 'info') {
    const oldNotifications = document.querySelectorAll('.app-notification');
    oldNotifications.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show app-notification`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 350px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}
