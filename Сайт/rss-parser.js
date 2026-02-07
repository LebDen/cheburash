// ==================== RSS-ПАРСЕР ====================

class RSSNewsParser {
    constructor() {
        this.parser = new RSSParser({
            customFields: {
                item: ['pubDate', 'link', 'guid', 'description']
            }
        });
        
        this.feeds = {
            world: [
                {
                    name: 'РИА Новости',
                    url: 'https://ria.ru/export/rss2/archive/index.xml',
                    category: 'world'
                },
                {
                    name: 'ТАСС',
                    url: 'https://tass.ru/rss/v2.xml',
                    category: 'world'
                }
            ],
            russia: [
                {
                    name: 'ТАСС',
                    url: 'https://tass.ru/rss/v2.xml',
                    category: 'russia'
                },
                {
                    name: 'РИА Новости',
                    url: 'https://ria.ru/export/rss2/archive/index.xml',
                    category: 'russia'
                },
                {
                    name: 'Российская газета',
                    url: 'https://rg.ru/xml/index.xml',
                    category: 'russia'
                }
            ],
            svo: [
                {
                    name: 'Минобороны РФ',
                    url: 'https://function.mil.ru/rss/news.htm',
                    category: 'svo'
                },
                {
                    name: 'РИА Новости',
                    url: 'https://ria.ru/export/rss2/archive/index.xml',
                    category: 'svo'
                },
                {
                    name: 'Звезда',
                    url: 'https://tvzvezda.ru/rss.xml',
                    category: 'svo'
                }
            ]
        };
    }

    // Форматирование даты
    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', window.APP_CONFIG.display.dateFormat);
        } catch (error) {
            return 'Неизвестно';
        }
    }

    // Очистка HTML из текста
    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    // Ограничение длины текста
    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    // Парсинг одной ленты
    async parseFeed(feed) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), window.APP_CONFIG.update.requestTimeout);

            const response = await fetch(feed.url, { signal: controller.signal });
            clearTimeout(timeoutId);

            const text = await response.text();
            const result = await this.parser.parseString(text);

            return {
                source: feed.name,
                items: result.items.map(item => ({
                    title: this.truncateText(item.title || 'Без заголовка', 200),
                    link: item.link || '#',
                    pubDate: item.pubDate || new Date().toISOString(),
                    description: this.stripHtml(item.description || ''),
                    source: feed.name,
                    category: feed.category,
                    formattedDate: this.formatDate(item.pubDate)
                }))
            };
        } catch (error) {
            console.error(`Ошибка парсинга ${feed.name}:`, error);
            return { source: feed.name, items: [] };
        }
    }

    // Парсинг категории
    async parseCategory(category) {
        const feeds = this.feeds[category] || [];
        
        if (feeds.length === 0) {
            return { items: [], sources: [] };
        }

        // Парсим все ленты параллельно
        const results = await Promise.all(
            feeds.map(feed => this.parseFeed(feed))
        );

        // Объединяем новости
        const allItems = [];
        const sources = new Set();

        results.forEach(result => {
            if (result.items.length > 0) {
                allItems.push(...result.items);
                sources.add(result.source);
            }
        });

        // Сортируем по дате (свежие первыми)
        allItems.sort((a, b) => {
            return new Date(b.pubDate) - new Date(a.pubDate);
        });

        // Берём последние N новостей
        const limit = window.APP_CONFIG.display.categoryNewsCount;
        return {
            items: allItems.slice(0, limit),
            sources: Array.from(sources)
        };
    }

    // Парсинг всех категорий
    async parseAll() {
        showLoading(true);
        
        try {
            const [world, russia, svo] = await Promise.all([
                this.parseCategory('world'),
                this.parseCategory('russia'),
                this.parseCategory('svo')
            ]);

            const result = {
                world,
                russia,
                svo,
                timestamp: new Date().toISOString(),
                totalNews: world.items.length + russia.items.length + svo.items.length,
                totalSources: new Set([
                    ...world.sources,
                    ...russia.sources,
                    ...svo.sources
                ]).size
            };

            // Сохраняем в кэш
            this.saveToCache(result);

            return result;
        } catch (error) {
            console.error('Ошибка парсинга:', error);
            showNotification('❌ Ошибка при загрузке новостей. Проверьте интернет-соединение.', 'danger');
            return null;
        } finally {
            showLoading(false);
        }
    }

    // Сохранение в кэш
    saveToCache(data) {
        try {
            localStorage.setItem('newsData', JSON.stringify(data));
            localStorage.setItem('lastUpdate', new Date().toISOString());
            console.log('Данные сохранены в кэш');
        } catch (error) {
            console.error('Ошибка сохранения в кэш:', error);
        }
    }

    // Загрузка из кэша
    loadFromCache() {
        try {
            const cachedData = localStorage.getItem('newsData');
            const lastUpdate = localStorage.getItem('lastUpdate');

            if (!cachedData || !lastUpdate) {
                return null;
            }

            const data = JSON.parse(cachedData);
            const cacheAge = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60); // в минутах

            // Проверяем, не устарел ли кэш
            if (cacheAge > window.APP_CONFIG.update.cacheDuration) {
                console.log('Кэш устарел');
                return null;
            }

            console.log('Загружено из кэша');
            return data;
        } catch (error) {
            console.error('Ошибка загрузки из кэша:', error);
            return null;
        }
    }

    // Проверка валидности кэша
    isCacheValid() {
        const lastUpdate = localStorage.getItem('lastUpdate');
        if (!lastUpdate) return false;

        const cacheAge = (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60);
        return cacheAge <= window.APP_CONFIG.update.cacheDuration;
    }
}

// Глобальный экземпляр парсера
const newsParser = new RSSNewsParser();

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Показать/скрыть индикатор загрузки
function showLoading(show) {
    const loadingElements = document.querySelectorAll('.loading');
    loadingElements.forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

// Показать уведомление
function showNotification(message, type = 'info') {
    // Удаляем старые уведомления
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
        animation: slideInDown 0.3s ease;
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    // Удаляем через 5 секунд
    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('fade');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Обновить категорию
async function refreshCategory(category) {
    showLoading(true);
    
    try {
        const result = await newsParser.parseCategory(category);
        
        if (result) {
            // Обновляем только эту категорию в кэше
            const cachedData = newsParser.loadFromCache() || {
                world: { items: [], sources: [] },
                russia: { items: [], sources: [] },
                svo: { items: [], sources: [] }
            };
            
            cachedData[category] = result;
            newsParser.saveToCache(cachedData);
            
            displayNews(cachedData);
            showNotification(`✅ ${getCategoryName(category)} успешно обновлены!`, 'success');
        }
    } catch (error) {
        console.error(`Ошибка обновления ${category}:`, error);
        showNotification(`❌ Ошибка при обновлении ${getCategoryName(category)}`, 'danger');
    } finally {
        showLoading(false);
    }
}

// Получить название категории
function getCategoryName(category) {
    const names = {
        world: 'Мировые новости',
        russia: 'Новости России',
        svo: 'Новости СВО'
    };
    return names[category] || category;
}

// Скопировать ссылку на страницу
function copyPageLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('✅ Ссылка скопирована в буфер обмена!', 'success');
    }).catch(err => {
        console.error('Ошибка копирования:', err);
        showNotification('❌ Не удалось скопировать ссылку', 'danger');
    });
}

// Поделиться в соцсетях
function shareToTelegram() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Смотрите новости здесь:');
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank');
}

function shareToWhatsApp() {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent('Смотрите новости здесь:');
    window.open(`https://wa.me/?text=${text}%20${url}`, '_blank');
}

function shareToVK() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://vk.com/share.php?url=${url}`, '_blank');
}

// Показать юридическую информацию
function showLegalInfo() {
    alert(`Юридическая информация:

Данный агрегатор публикует только заголовки новостей и ссылки на официальные источники.

Все права на полные тексты, фотографии и видео принадлежат их авторам.

Публикация заголовков в информационных целях с указанием источника разрешена в соответствии со ст. 1274 ГК РФ.`);
}

// Показать политику конфиденциальности
function showPrivacyPolicy() {
    alert(`Политика конфиденциальности:

1. Мы не собираем персональные данные пользователей.
2. Все данные хранятся только в вашем браузере (localStorage).
3. Мы не используем cookies для отслеживания.
4. Мы не передаём данные третьим лицам.

Данный сайт является статическим и не имеет серверной части.`);
}