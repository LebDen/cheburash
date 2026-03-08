class RSSNewsParser {
    constructor() {
        this.parser = new RSSParser();
        this.cache = new Map();
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('ru-RU', {
                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
            });
        } catch { return '—'; }
    }

    stripHtml(html) {
        if (!html) return '';
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }

    truncateWords(text, count = 100) {
        if (!text) return '';
        const clean = this.stripHtml(text);
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        return words.length <= count ? clean : words.slice(0, count).join(' ') + '...';
    }

    removeDuplicates(items) {
        const seen = new Set();
        return items.filter(item => {
            const key = item.link?.trim() || item.title;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    categorize(item) {
        const text = (item.title + ' ' + item.description).toLowerCase();
        for (const kw of APP_CONFIG.keywords.svo) if (text.includes(kw)) return 'svo';
        for (const kw of APP_CONFIG.keywords.russia) if (text.includes(kw)) return 'russia';
        return 'world';
    }

    async fetchFeed(feed) {
        const cacheKey = `${feed.url}_${Math.floor(Date.now() / 300000)}`;
        if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);

        try {
            const proxy = APP_CONFIG.rss.corsProxy + encodeURIComponent(feed.url);
            const res = await fetch(proxy, {
                headers: { 'Content-Type': 'application/json' },
                signal: AbortSignal.timeout(APP_CONFIG.update.requestTimeout)
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.status !== 'ok') throw new Error(data.message || 'Error');

            const items = (data.items || []).slice(0, 15).map(it => ({
                title: (it.title || 'Без заголовка').slice(0, 200),
                link: it.link || '#',
                pubDate: it.pubDate || new Date().toISOString(),
                description: it.description || '',
                source: feed.name,
                formattedDate: this.formatDate(it.pubDate),
                shortDescription: this.truncateWords(it.description || '', 100)
            }));

            const result = { source: feed.name, items };
            this.cache.set(cacheKey, result);
            return result;
        } catch (e) {
            console.warn(`Ошибка ${feed.name}:`, e.message);
            return { source: feed.name, items: [] };
        }
    }

    async parseAll() {
        const results = await Promise.allSettled(
            APP_CONFIG.rss.feeds.map(f => this.fetchFeed(f))
        );

        const allItems = results
            .filter(r => r.status === 'fulfilled' && r.value.items.length)
            .flatMap(r => r.value.items);

        const unique = this.removeDuplicates(allItems);
        const cats = { world: [], russia: [], svo: [] };
        const sources = { world: new Set(), russia: new Set(), svo: new Set() };

        unique.forEach(item => {
            const cat = this.categorize(item);
            cats[cat].push(item);
            sources[cat].add(item.source);
        });

        Object.keys(cats).forEach(c => {
            cats[c].sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            cats[c] = cats[c].slice(0, 15);
        });

        const result = {
            world: { items: cats.world, sources: Array.from(sources.world) },
            russia: { items: cats.russia, sources: Array.from(sources.russia) },
            svo: { items: cats.svo, sources: Array.from(sources.svo) },
            timestamp: new Date().toISOString(),
            totalNews: cats.world.length + cats.russia.length + cats.svo.length
        };

        this.saveToCache(result);
        return result;
    }

    saveToCache(data) {
        try {
            localStorage.setItem('newsData', JSON.stringify(data));
            localStorage.setItem('lastUpdate', new Date().toISOString());
        } catch (e) { console.error('Cache error:', e); }
    }

    loadFromCache() {
        try {
            const data = localStorage.getItem('newsData');
            const time = localStorage.getItem('lastUpdate');
            if (!data || !time) return null;
            const age = (Date.now() - new Date(time)) / 60000;
            if (age > APP_CONFIG.update.cacheDuration) return null;
            return JSON.parse(data);
        } catch { return null; }
    }

    isCacheValid() {
        const time = localStorage.getItem('lastUpdate');
        if (!time) return false;
        return (Date.now() - new Date(time)) / 60000 <= APP_CONFIG.update.cacheDuration;
    }
}

const newsParser = new RSSNewsParser();

// Helpers
function showLoading(show) {
    document.querySelectorAll('.loading').forEach(el => {
        el.style.display = show ? 'block' : 'none';
    });
}

function showNotification(msg, type = 'info') {
    const old = document.querySelectorAll('.app-notification');
    old.forEach(el => el.remove());
    const n = document.createElement('div');
    n.className = `alert alert-${type} app-notification`;
    n.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;min-width:300px;padding:1rem 1.5rem;border-radius:12px;background:var(--bg-card);border:1px solid var(--border);box-shadow:var(--shadow);color:var(--text-primary);animation:slideIn 0.3s ease;`;
    n.innerHTML = `${msg}<button onclick="this.parentElement.remove()" style="position:absolute;top:8px;right:12px;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:1.2rem;">&times;</button>`;
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 300); }, 4000);
}