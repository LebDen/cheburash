document.addEventListener('DOMContentLoaded', async () => {
    setupMobileMenu();
    setupTheme();
    setupNavigation();
    setupButtons();
    await loadNews();
});

// Mobile Menu
function setupMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const close = document.getElementById('mobileMenuClose');
    const menu = document.getElementById('mobileMenu');
    const links = document.querySelectorAll('.mobile-nav-link');

    toggle?.addEventListener('click', () => {
        menu.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    close?.addEventListener('click', () => {
        menu.classList.remove('active');
        document.body.style.overflow = '';
    });
    links.forEach(link => link.addEventListener('click', () => {
        menu.classList.remove('active');
        document.body.style.overflow = '';
        links.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
    }));
    document.addEventListener('click', e => {
        if (menu.classList.contains('active') && !menu.contains(e.target) && !toggle.contains(e.target)) {
            menu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// Theme
function setupTheme() {
    const saved = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeToggle')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const current = document.body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    updateThemeIcon(next);
    showNotification(next === 'dark' ? '🌙 Тёмная тема' : '☀️ Светлая тема', 'info');
}

function updateThemeIcon(theme) {
    const icons = document.querySelectorAll('#themeToggle i, #mobileThemeToggle i, #mobileThemeToggle span:last-child');
    icons.forEach(el => {
        if (el.tagName === 'I') {
            el.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        } else if (el.textContent.includes('Светлая') || el.textContent.includes('Тёмная')) {
            el.textContent = theme === 'dark' ? 'Светлая' : 'Тёмная';
        }
    });
}

// Navigation
function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', e => {
            e.preventDefault();
            const target = tab.getAttribute('href').substring(1);
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(target)?.classList.add('active');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// Buttons
function setupButtons() {
    document.getElementById('updateNewsBtn')?.addEventListener('click', updateNews);
    document.getElementById('downloadDigestBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('refreshNewsBtn')?.addEventListener('click', updateNews);
    document.getElementById('previewUpdateBtn')?.addEventListener('click', updateNews);
}

// Load News
async function loadNews() {
    const cached = newsParser.loadFromCache();
    if (cached && newsParser.isCacheValid()) {
        displayNews(cached);
        updateLastUpdate();
        return;
    }
    await updateNews();
}

async function updateNews() {
    const btn = document.getElementById('updateNewsBtn');
    const original = btn?.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i>'; }
    showLoading(true);
    showNotification('📡 Загрузка...', 'info');

    try {
        const data = await newsParser.parseAll();
        if (data) {
            displayNews(data);
            updateLastUpdate();
            showNotification(`✅ ${data.totalNews} новостей`, 'success');
        }
    } catch (e) {
        console.error('Update error:', e);
    } finally {
        showLoading(false);
        if (btn) { btn.disabled = false; btn.innerHTML = original; }
    }
}

function displayNews(data) {
    if (!data) return;
    displayCategory('world', data.world);
    displayCategory('russia', data.russia);
    displayCategory('svo', data.svo);
    displayPreview(data);
}

function displayCategory(cat, data) {
    const list = document.getElementById(`${cat}NewsList`);
    const empty = document.getElementById(`${cat}NoContent`);
    const badge = document.getElementById(`${cat}SourcesCount`);
    const loading = document.getElementById(`${cat}Loading`);
    if (!list || !empty) return;
    loading.style.display = 'none';
    if (!data?.items?.length) {
        empty.style.display = 'block';
        list.innerHTML = '';
        if (badge) badge.textContent = '0';
        return;
    }
    empty.style.display = 'none';
    list.innerHTML = '';
    data.items.forEach(item => list.appendChild(createNewsCard(item)));
    if (badge) badge.textContent = data.sources.length;
}

function displayPreview(data) {
    const grid = document.getElementById('previewNewsGrid');
    const empty = document.getElementById('previewNoContent');
    if (!grid || !empty) return;
    const all = [...data.world.items, ...data.russia.items, ...data.svo.items];
    if (!all.length) { empty.style.display = 'block'; grid.innerHTML = ''; return; }
    empty.style.display = 'none';
    grid.innerHTML = '';
    all.slice(0, 6).forEach(item => grid.appendChild(createNewsCard(item)));
}

function createNewsCard(item) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.onclick = () => window.open(item.link, '_blank');
    card.innerHTML = `
        <div class="news-card-header">
            <div class="news-card-title">${escapeHtml(item.title)}</div>
            <div class="news-card-meta">${item.formattedDate}</div>
        </div>
        <div class="news-card-body">
            <div class="news-card-source"><i class="fas fa-newspaper"></i> ${escapeHtml(item.source)}</div>
            <p class="news-card-description">${escapeHtml(item.shortDescription)}</p>
            <a href="${item.link}" class="news-card-link" target="_blank"><i class="fas fa-arrow-right"></i> Читать</a>
        </div>
    `;
    return card;
}

function escapeHtml(text) {
    if (!text) return '';
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

// Last Update
function updateLastUpdate() {
    const time = localStorage.getItem('lastUpdate');
    const el = document.getElementById('footerLastUpdate');
    if (!time || !el) { el.textContent = '—'; return; }
    const diff = Math.floor((Date.now() - new Date(time)) / 60000);
    el.textContent = diff < 1 ? 'только что' : diff < 60 ? `${diff} мин назад` : `${Math.floor(diff / 60)} ч назад`;
}

// Download Digest
function downloadDigest() {
    const data = newsParser.loadFromCache();
    if (!data) { showNotification('❌ Сначала обновите новости', 'danger'); return; }
    const date = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let txt = `ЕЖЕДНЕВНЫЙ ДАЙДЖЕСТ «ЧБ»\n${date}\n\n${'='.repeat(60)}\n\n`;
    [['🌍 Мир', 'world'], ['🇷🇺 Россия', 'russia'], ['⚔️ СВО', 'svo']].forEach(([title, key]) => {
        if (data[key].items.length) {
            txt += `${title}\n${'-'.repeat(60)}\n\n`;
            data[key].items.forEach((it, i) => {
                txt += `${i + 1}. ${it.title}\n   Источник: ${it.source}\n   Кратко: ${cleanDesc(it.shortDescription)}\n\n`;
            });
        }
    });
    txt += `${'='.repeat(60)}\n© ЧБ Новости 2026`;
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ЧБ_дайджест_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('✅ Дайджест скачан', 'success');
}

function cleanDesc(d) {
    if (!d) return 'Без описания';
    d = d.trim().replace(/\s+/g, ' ');
    return d.length > 150 ? d.slice(0, 147) + '...' : d;
}