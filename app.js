// ==================== INIT ====================
const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

// ==================== STATE ====================
let newsCache = { world: [], russia: [], svo: [] };
let lastUpdateTime = null;

// ==================== UTILS ====================
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent =
        now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    lastUpdateTime = now;
}
setInterval(updateTime, 1000);
updateTime();

function stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

function timeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'только что';
    if (diff < 3600) return `${Math.floor(diff / 60)} мин. назад`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ч. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function haptic(type = 'light') {
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred(type);
}

// ==================== RSS PARSER ====================
async function fetchFeed(url) {
    try {
        const proxyUrl = CONFIG.CORS_PROXY + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(CONFIG.TIMEOUT)
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const xml = await response.text();
        const parser = new RSSParser();
        const feed = await parser.parseString(xml);

        return feed.items.slice(0, CONFIG.MAX_NEWS_PER_CATEGORY).map(item => ({
            title: stripHtml(item.title),
            description: stripHtml(item.description || '').substring(0, 200),
            link: item.link,
            pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
            source: item.source || new URL(item.link).hostname.replace('www.', '')
        }));
    } catch (error) {
        console.warn(`Ошибка ${url}:`, error.message);
        return null;
    }
}

async function fetchCategory(category) {
    const feeds = CONFIG.RSS_FEEDS[category] || [];
    if (!feeds.length) return [];

    const results = await Promise.allSettled(feeds.map(url => fetchFeed(url)));

    return results
        .filter(r => r.status === 'fulfilled' && r.value)
        .flatMap(r => r.value)
        .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate))
        .slice(0, CONFIG.MAX_NEWS_PER_CATEGORY)
        .map(item => ({ ...item, category, timeAgo: timeAgo(item.pubDate) }));
}

async function loadAllNews() {
    const container = document.getElementById('newsContainer');
    container.innerHTML = `<div class="loading"><i class="fas fa-circle-notch fa-spin"></i><div>Загрузка...</div></div>`;

    try {
        const [world, russia, svo] = await Promise.all([
            fetchCategory('world'),
            fetchCategory('russia'),
            fetchCategory('svo')
        ]);
        newsCache = { world, russia, svo };
        renderNews();
        updateTime();
    } catch (error) {
        container.innerHTML = `<div class="error-state"><i class="fas fa-exclamation-triangle"></i><div style="margin-top:8px">Ошибка загрузки</div><button class="refresh-btn" onclick="loadAllNews()" style="margin-top:12px"><i class="fas fa-sync-alt"></i> Повторить</button></div>`;
    }
}

function renderNews() {
    const container = document.getElementById('newsContainer');
    const categories = [
        { key: 'world', name: '?? Мир', class: 'tag-world' },
        { key: 'russia', name: '???? Россия', class: 'tag-russia' },
        { key: 'svo', name: '?? СВО', class: 'tag-svo' }
    ];

    let html = '';
    categories.forEach(cat => {
        const items = newsCache[cat.key] || [];
        if (items.length === 0) return;
        html += `<div class="category-block"><div class="category-title">${cat.name}<span class="category-badge">${items.length}</span></div>`;
        items.forEach(item => {
            html += `<div class="news-item">
                <div class="news-source">${item.source} • ${item.timeAgo}</div>
                <div class="news-text">${item.title}</div>
                <a href="${item.link}" class="news-time" target="_blank" style="color:var(--tg-link);text-decoration:none">Читать ?</a>
            </div>`;
        });
        html += `</div>`;
    });

    container.innerHTML = html || `<div class="error-state"><i class="fas fa-inbox"></i><div style="margin-top:8px">Нет новостей</div><button class="refresh-btn" onclick="loadAllNews()" style="margin-top:12px"><i class="fas fa-sync-alt"></i> Обновить</button></div>`;
}

// ==================== DIGEST GENERATOR (формат как в вашем коде) ====================
function generateDigestContent() {
    const date = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
    const time = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    let content = `????????????????????????????????????????????????????\n`;
    content += `         ЧБ НОВОСТИ | ИНФОРМАЦИОННЫЙ ДАЙДЖЕСТ\n`;
    content += `????????????????????????????????????????????????????\n\n`;
    content += `?? Дата: ${date}\n`;
    content += `? Время: ${time}\n`;
    content += `?? Статус: Актуальная сводка\n\n`;
    content += `????????????????????????????????????????????????????\n\n`;

    // Games
    content += `?? ИГРОВЫЕ МОДУЛИ\n`;
    content += `????????????????????????????????????????????????????\n`;
    content += `  [1] ${CONFIG.GAMES.dog.name}: ${CONFIG.GAMES.dog.subtitle}\n`;
    content += `  [2] ${CONFIG.GAMES.pet.name}: ${CONFIG.GAMES.pet.subtitle}\n\n`;

    // News by category
    const categories = [
        { key: 'world', name: '?? МИР' },
        { key: 'russia', name: '???? РОССИЯ' },
        { key: 'svo', name: '?? СВО' }
    ];

    categories.forEach(cat => {
        const items = newsCache[cat.key] || [];
        content += `${cat.name}\n`;
        content += `????????????????????????????????????????????????????\n`;
        if (items.length === 0) {
            content += `  Нет данных\n\n`;
        } else {
            items.forEach((item, index) => {
                content += `  [${index + 1}] ${item.title}\n`;
                content += `      Источник: ${item.source}\n`;
                content += `      Время: ${item.timeAgo}\n`;
                content += `      Ссылка: ${item.link}\n\n`;
            });
        }
    });

    content += `????????????????????????????????????????????????????\n\n`;
    content += `?? ТЕЛЕГРАМ КАНАЛ: ${CONFIG.TELEGRAM.channel}\n`;
    content += `?? БОТ: ${CONFIG.TELEGRAM.bot}\n\n`;
    content += `????????????????????????????????????????????????????\n`;
    content += `         © 2026 ЧБ НОВОСТНОЙ АГРЕГАТОР\n`;
    content += `????????????????????????????????????????????????????\n`;

    return content;
}

function downloadDigest() {
    haptic('success');
    const content = generateDigestContent();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CHB_Digest_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    tg.showAlert({ title: '? Готово', message: 'Дайджест загружен', buttons: [{ type: 'ok' }] });
}

// ==================== EVENT LISTENERS ====================
document.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', () => haptic('light'));
});

document.getElementById('refreshBtn').addEventListener('click', () => { haptic('medium'); loadAllNews(); });
document.getElementById('downloadBtn').addEventListener('click', downloadDigest);

// Setup game links
document.getElementById('gameDog').href = CONFIG.GAMES.dog.url;
document.getElementById('gamePet').href = CONFIG.GAMES.pet.url;

// ==================== INIT ====================
loadAllNews();