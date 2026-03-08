/**
 * ЧБ Новости 2026 — Основная логика
 */
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация
    const parser = typeof RSSParser !== 'undefined' 
        ? new RSSParser(CONFIG.PARSER) 
        : null;
    
    let currentSection = 'today';
    let newsCache = {};

    // ===== ТЕМЫ =====
    const themeToggle = document.getElementById('themeToggle');
    const mobileThemeToggle = document.getElementById('mobileThemeToggle');
    
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('chb_theme', theme);
        
        const icon = theme === 'dark' ? 'fa-sun' : 'fa-moon';
        [themeToggle, mobileThemeToggle].forEach(btn => {
            if (btn) btn.querySelector('i').className = `fas ${icon}`;
        });
    }
    
    // Загрузка сохранённой темы
    const savedTheme = localStorage.getItem('chb_theme') || 
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    
    [themeToggle, mobileThemeToggle].forEach(btn => {
        btn?.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme');
            applyTheme(current === 'dark' ? 'light' : 'dark');
        });
    });

    // ===== НАВИГАЦИЯ =====
    function switchSection(sectionId) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-tab, .mobile-nav-link').forEach(t => {
            t.classList.remove('active');
            if (t.dataset.section === sectionId) t.classList.add('active');
        });
        
        document.getElementById(sectionId)?.classList.add('active');
        currentSection = sectionId;
        
        // Автозагрузка новостей при переходе
        if (sectionId === 'info' && Object.keys(newsCache).length === 0) {
            loadAllCategories();
        }
        
        // Закрытие мобильного меню
        document.getElementById('mobileMenu')?.classList.remove('active');
    }
    
    // Десктопные вкладки
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            switchSection(tab.dataset.section);
        });
    });
    
    // Мобильные ссылки
    document.querySelectorAll('.mobile-nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            const section = link.dataset.section;
            if (section) {
                e.preventDefault();
                switchSection(section);
            }
        });
    });
    
    // Гамбургер-меню
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuClose = document.getElementById('mobileMenuClose');
    const mobileMenu = document.getElementById('mobileMenu');
    
    mobileMenuToggle?.addEventListener('click', () => {
        mobileMenu?.classList.add('active');
    });
    
    mobileMenuClose?.addEventListener('click', () => {
        mobileMenu?.classList.remove('active');
    });

    // ===== НОВОСТИ =====
    function renderNewsCard(item) {
        return `
            <article class="news-card">
                <span class="news-category ${item.category}">
                    ${item.category === 'world' ? '🌍' : item.category === 'russia' ? '🇷🇺' : '⚔️'} 
                    ${item.category === 'world' ? 'Мир' : item.category === 'russia' ? 'Россия' : 'СВО'}
                </span>
                <h4 class="news-title">${escapeHtml(item.title)}</h4>
                <p class="news-description">${escapeHtml(item.description)}</p>
                <a href="${escapeHtml(item.link)}" class="news-link" target="_blank" rel="noopener">
                    Читать <i class="fas fa-arrow-right"></i>
                </a>
                <div class="news-meta">
                    <span class="news-source">${escapeHtml(item.source)}</span>
                    <span class="news-time">
                        <i class="far fa-clock"></i> ${item.timeAgo || '—'}
                    </span>
                </div>
            </article>
        `;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function renderNews(containerId, items, loadingId, emptyId) {
        const container = document.getElementById(containerId);
        const loading = document.getElementById(loadingId);
        const empty = document.getElementById(emptyId);
        
        if (!container) return;
        
        loading?.classList.remove('d-none');
        empty?.classList.add('d-none');
        container.innerHTML = '';
        
        if (!items?.length) {
            loading?.classList.add('d-none');
            empty?.classList.remove('d-none');
            return;
        }
        
        container.innerHTML = items.map(renderNewsCard).join('');
        loading?.classList.add('d-none');
    }
    
    async function loadCategory(category) {
        if (!parser) return [];
        
        const loading = document.getElementById(`${category}Loading`);
        loading?.classList.remove('d-none');
        
        try {
            const items = await parser.fetchCategory(category);
            newsCache[category] = items;
            renderNews(
                `${category}NewsList`, 
                items, 
                `${category}Loading`, 
                `${category}NoContent`
            );
            return items;
        } catch (err) {
            console.error(`Ошибка загрузки ${category}:`, err);
            document.getElementById(`${category}Loading`)?.classList.add('d-none');
            document.getElementById(`${category}NoContent`)?.classList.remove('d-none');
            return [];
        }
    }
    
    async function loadAllCategories() {
        await Promise.all([
            loadCategory('world'),
            loadCategory('russia'),
            loadCategory('svo')
        ]);
        updateSourcesCount();
    }
    
    function updateSourcesCount() {
        // Простая реализация: считаем уникальные источники
        const allItems = Object.values(newsCache).flat();
        const sources = new Set(allItems.map(i => i.source));
        document.querySelectorAll('[id$="SourcesCount"]').forEach(el => {
            el.textContent = `${sources.size} источников`;
        });
    }
    
    // Кнопки обновления
    document.getElementById('updateNewsBtn')?.addEventListener('click', loadAllCategories);
    document.getElementById('previewUpdateBtn')?.addEventListener('click', loadAllCategories);
    
    window.refreshCategory = (category) => loadCategory(category);

    // ===== ПРЕВЬЮ НОВОСТЕЙ (Главная) =====
    async function loadPreviewNews() {
        const container = document.getElementById('previewNewsGrid');
        const noContent = document.getElementById('previewNoContent');
        
        // Попробовать загрузить из кэша
        const cached = JSON.parse(localStorage.getItem(CONFIG.STORAGE.newsKey) || '[]');
        if (cached.length && Date.now() - (cached.timestamp || 0) < CONFIG.STORAGE.maxCacheAge) {
            container.innerHTML = cached.items.slice(0, 6).map(renderNewsCard).join('');
            noContent?.classList.add('d-none');
            return;
        }
        
        // Загрузка свежих
        noContent?.classList.remove('d-none');
        container.innerHTML = '';
        
        // Загружаем по 2 новости из каждой категории для превью
        const preview = [];
        for (const cat of ['world', 'russia', 'svo']) {
            const items = await loadCategory(cat);
            preview.push(...items.slice(0, 2));
        }
        
        // Сортировка и отображение
        preview.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
        if (preview.length) {
            container.innerHTML = preview.slice(0, 6).map(renderNewsCard).join('');
            noContent?.classList.add('d-none');
            
            // Сохранение в кэш
            localStorage.setItem(CONFIG.STORAGE.newsKey, JSON.stringify({
                items: preview,
                timestamp: Date.now()
            }));
        }
    }

    // ===== ТАЙМЕР ОБРАТНОГО ОТСЧЁТА =====
    function updateCountdown() {
        const now = new Date();
        const next = new Date(CONFIG.COUNTDOWN.nextUpdate);
        
        // Если время обновления уже прошло сегодня — ставим на завтра
        if (now >= next) {
            next.setDate(next.getDate() + 1);
        }
        
        const diff = next - now;
        const hours = Math.floor(diff / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        
        document.getElementById('countdownHours').textContent = String(hours).padStart(2, '0');
        document.getElementById('countdownMinutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('countdownSeconds').textContent = String(seconds).padStart(2, '0');
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
    
    // Автообновление по таймеру
    if (CONFIG.COUNTDOWN.autoRefresh) {
        setInterval(() => {
            const now = new Date();
            const next = new Date(CONFIG.COUNTDOWN.nextUpdate);
            if (now >= next) {
                loadAllCategories();
                updateCountdown();
            }
        }, 60000); // Проверка каждую минуту
    }

    // ===== СКАЧИВАНИЕ ДАЙДЖЕСТА =====
    function generateDigest() {
        const items = Object.values(newsCache).flat().slice(0, 20);
        const date = new Date().toLocaleDateString('ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
        
        let digest = `ЧБ НОВОСТИ | Дайджест — ${date}\n`;
        digest += '═'.repeat(50) + '\n\n';
        
        ['world', 'russia', 'svo'].forEach(cat => {
            const catName = cat === 'world' ? '🌍 Мир' : cat === 'russia' ? '🇷🇺 Россия' : '⚔️ СВО';
            const catItems = newsCache[cat] || [];
            if (catItems.length) {
                digest += `${catName}\n${'─'.repeat(30)}\n`;
                catItems.slice(0, 5).forEach((item, i) => {
                    digest += `${i+1}. ${item.title}\n   ${item.source} • ${item.timeAgo}\n   ${item.link}\n\n`;
                });
            }
        });
        
        digest += `\nПолная версия: ${CONFIG.TELEGRAM.channelUrl}`;
        return digest;
    }
    
    function downloadDigest() {
        const content = generateDigest();
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CHB_digest_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    document.getElementById('downloadDigestBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('footerDownloadBtn')?.addEventListener('click', downloadDigest);

    // ===== ФУТЕР: ВРЕМЯ ОБНОВЛЕНИЯ =====
    function updateFooterTime() {
        const now = new Date();
        document.getElementById('footerLastUpdate').textContent = 
            now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    updateFooterTime();
    setInterval(updateFooterTime, 60000);

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    loadPreviewNews();
    
    // PWA: регистрация Service Worker (опционально)
    if ('serviceWorker' in navigator) {
        // navigator.serviceWorker.register('/sw.js').catch(console.warn);
    }
});
