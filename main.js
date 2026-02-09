// ==================== ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 ЧБ Новостной Агрегатор 2026 инициализирован');

    // Мобильное меню
    setupMobileMenu();

    // Тема
    setupTheme();

    // Навигация (десктоп)
    setupNavigation();

    // Кнопки
    setupButtons();

    // Таймер
    setupCountdown();

    // Загрузка новостей
    await loadNews();
});

// ==================== МОБИЛЬНОЕ МЕНЮ ====================

function setupMobileMenu() {
    const toggleBtn = document.getElementById('mobileMenuToggle');
    const closeBtn = document.getElementById('mobileMenuClose');
    const mobileMenu = document.getElementById('mobileMenu');
    const mobileLinks = document.querySelectorAll('.mobile-nav-link');

    // Открыть меню
    toggleBtn?.addEventListener('click', () => {
        mobileMenu.classList.add('active');
        document.body.style.overflow = 'hidden'; // Запретить прокрутку
    });

    // Закрыть меню
    closeBtn?.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = ''; // Разрешить прокрутку
    });

    // Закрыть меню при клике на ссылку
    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';

            // Обновить активные состояния
            mobileLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });

    // Закрыть меню при клике вне
    document.addEventListener('click', (e) => {
        if (mobileMenu.classList.contains('active') &&
            !mobileMenu.contains(e.target) &&
            !toggleBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
            document.body.style.overflow = '';
        }
    });
}

// ==================== ТЕМА ====================

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    updateThemeButtonIcon(savedTheme);

    // Кнопки переключения темы
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('mobileThemeToggle')?.addEventListener('click', toggleTheme);
}

function toggleTheme() {
    const currentTheme = document.body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    updateThemeButtonIcon(newTheme);
    showNotification(newTheme === 'dark' ? '🌙 Тёмная тема включена' : '☀️ Светлая тема включена', 'info');
}

function updateThemeButtonIcon(theme) {
    const buttons = document.querySelectorAll('#themeToggle, #mobileThemeToggle');
    buttons.forEach(button => {
        if (button) {
            button.innerHTML = theme === 'dark'
                ? '<i class="fas fa-sun"></i>'
                : '<i class="fas fa-moon"></i>';
        }
    });
}

// ==================== НАВИГАЦИЯ (ДЕСКТОП) ====================

function setupNavigation() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = tab.getAttribute('href').substring(1);

            // Обновляем активные состояния
            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Показываем целевую секцию
            document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
            document.getElementById(targetId)?.classList.add('active');

            // Прокручиваем наверх
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ==================== КНОПКИ ====================

function setupButtons() {
    document.getElementById('updateNewsBtn')?.addEventListener('click', updateNews);
    document.getElementById('downloadDigestBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('footerDownloadBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('previewUpdateBtn')?.addEventListener('click', updateNews);
}

// ==================== ТАЙМЕР ====================

function setupCountdown() {
    const countdownHours = document.getElementById('countdownHours');
    const countdownMinutes = document.getElementById('countdownMinutes');
    const countdownSeconds = document.getElementById('countdownSeconds');

    function updateCountdown() {
        const now = new Date();
        const target = new Date();

        // Устанавливаем время 21:00 по МСК (UTC+3)
        target.setHours(21, 0, 0, 0);

        if (now > target) {
            target.setDate(target.getDate() + 1);
        }

        const diff = target - now;

        if (diff <= 0) {
            countdownHours.textContent = '00';
            countdownMinutes.textContent = '00';
            countdownSeconds.textContent = '00';
            return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownHours.textContent = hours.toString().padStart(2, '0');
        countdownMinutes.textContent = minutes.toString().padStart(2, '0');
        countdownSeconds.textContent = seconds.toString().padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ==================== ЗАГРУЗКА НОВОСТЕЙ ====================

async function loadNews() {
    const cachedData = newsParser.loadFromCache();

    if (cachedData && newsParser.isCacheValid()) {
        console.log('✅ Загружаем новости из кэша');
        displayNews(cachedData);
        updateLastUpdateTime();
        return;
    }

    console.log('🔄 Загружаем свежие новости...');
    await updateNews();
}

async function updateNews() {
    const updateBtn = document.getElementById('updateNewsBtn');
    const originalHTML = updateBtn?.innerHTML;

    if (updateBtn) {
        updateBtn.disabled = true;
        updateBtn.innerHTML = '<i class="fas fa-sync-alt fa-spin"></i> Обновление...';
    }

    showNotification('📡 Загрузка свежих новостей...', 'info');

    try {
        const result = await newsParser.parseAll();

        if (result) {
            displayNews(result);
            updateLastUpdateTime();
            showNotification(`✅ Новости обновлены! Всего: ${result.totalNews} новостей`, 'success');
        }
    } catch (error) {
        console.error('Ошибка обновления:', error);
        showNotification('❌ Ошибка при обновлении новостей', 'danger');
    } finally {
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalHTML;
        }
    }
}

function displayNews(data) {
    if (!data) return;

    displayCategory('world', data.world);
    displayCategory('russia', data.russia);
    displayCategory('svo', data.svo);
    displayPreviewNews(data);
}

function displayCategory(category, data) {
    const listEl = document.getElementById(`${category}NewsList`);
    const emptyEl = document.getElementById(`${category}NoContent`);
    const sourcesEl = document.getElementById(`${category}SourcesCount`);

    if (!listEl || !emptyEl) return;

    if (!data || data.items.length === 0) {
        emptyEl.classList.add('show');
        listEl.innerHTML = '';
        if (sourcesEl) sourcesEl.textContent = '0 источников';
        return;
    }

    emptyEl.classList.remove('show');
    listEl.innerHTML = '';

    data.items.forEach(item => {
        listEl.appendChild(createNewsListItem(item));
    });

    if (sourcesEl) {
        sourcesEl.textContent = `${data.sources.length} ${getSourcesText(data.sources.length)}`;
    }
}

function displayPreviewNews(data) {
    const gridEl = document.getElementById('previewNewsGrid');
    const emptyEl = document.getElementById('previewNoContent');

    if (!gridEl || !emptyEl) return;

    const allNews = [
        ...data.world.items,
        ...data.russia.items,
        ...data.svo.items
    ];

    if (allNews.length === 0) {
        emptyEl.classList.add('show');
        gridEl.innerHTML = '';
        return;
    }

    emptyEl.classList.remove('show');
    gridEl.innerHTML = '';

    const previewCount = 6;
    const previewNews = allNews.slice(0, previewCount);

    previewNews.forEach(item => {
        gridEl.appendChild(createNewsCard(item));
    });
}

function createNewsCard(item) {
    const card = document.createElement('div');
    card.className = 'news-card';
    card.onclick = () => window.open(item.link, '_blank');

    card.innerHTML = `
        <div class="news-card-header">
            <div class="news-card-title">${escapeHtml(item.title)}</div>
            <div class="news-card-meta">
                <span>${item.formattedDate || newsParser.formatDate(item.pubDate)}</span>
            </div>
        </div>
        <div class="news-card-body">
            <div class="news-card-source">
                <i class="fas fa-newspaper"></i> ${escapeHtml(item.source)}
            </div>
            <p class="news-card-description">${escapeHtml(item.shortDescription)}</p>
            <a href="${item.link}" class="news-card-link" target="_blank">
                <i class="fas fa-arrow-right"></i>
                <span>Читать</span>
            </a>
        </div>
    `;

    return card;
}

function createNewsListItem(item) {
    const li = document.createElement('div');
    li.className = 'news-item';
    li.onclick = () => window.open(item.link, '_blank');

    li.innerHTML = `
        <div class="news-item-header">
            <span class="news-item-source">${escapeHtml(item.source)}</span>
            <span class="news-item-time">${item.formattedDate || newsParser.formatDate(item.pubDate)}</span>
        </div>
        <div class="news-item-title">${escapeHtml(item.title)}</div>
        <div class="news-item-description">${escapeHtml(item.shortDescription)}</div>
        <a href="${item.link}" class="news-item-link" target="_blank">
            <i class="fas fa-arrow-right"></i>
            <span>Читать</span>
        </a>
    `;

    return li;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getSourcesText(count) {
    if (count === 1) return 'источник';
    if (count > 1 && count < 5) return 'источника';
    return 'источников';
}

// ==================== ВРЕМЯ ПОСЛЕДНЕГО ОБНОВЛЕНИЯ ====================

function updateLastUpdateTime() {
    const lastUpdate = localStorage.getItem('lastUpdate');

    if (!lastUpdate) {
        document.getElementById('footerLastUpdate').textContent = '-';
        return;
    }

    const date = new Date(lastUpdate);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));

    let timeText = '';

    if (diffMinutes < 1) {
        timeText = 'только что';
    } else if (diffMinutes < 60) {
        timeText = `${diffMinutes} мин назад`;
    } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        timeText = `${hours} ч назад`;
    } else {
        timeText = date.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    document.getElementById('footerLastUpdate').textContent = timeText;
}

// ==================== СКАЧИВАНИЕ ДАЙДЖЕСТА ====================

function downloadDigest() {
    const newsData = newsParser.loadFromCache();

    if (!newsData) {
        showNotification('❌ Нет данных для скачивания. Сначала обновите новости.', 'danger');
        return;
    }

    const now = new Date();

    let txtContent = '';
    txtContent += '╔════════════════════════════════════════════════════════╗\n';
    txtContent += '║        ЕЖЕДНЕВНЫЙ НОВОСТНОЙ ДАЙДЖЕСТ                   ║\n';
    txtContent += '║        Новости из официальных источников                ║\n';
    txtContent += '╚════════════════════════════════════════════════════════╝\n\n';

    txtContent += `📅 Дата формирования: ${now.toLocaleDateString('ru-RU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })}\n\n`;

    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += '🌍 НОВОСТИ МИРА\n';
    txtContent += '════════════════════════════════════════════════════════\n\n';

    newsData.world.items.forEach((item, index) => {
        const date = item.formattedDate || newsParser.formatDate(item.pubDate);
        txtContent += `${index + 1}. ${item.title}\n`;
        txtContent += `${item.shortDescription}\n`;
        txtContent += `   Источник: ${item.source} | Время: ${date}\n`;
        txtContent += `   Ссылка: ${item.link}\n\n`;
    });

    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += '🇷🇺 НОВОСТИ РОССИИ\n';
    txtContent += '════════════════════════════════════════════════════════\n\n';

    newsData.russia.items.forEach((item, index) => {
        const date = item.formattedDate || newsParser.formatDate(item.pubDate);
        txtContent += `${index + 1}. ${item.title}\n`;
        txtContent += `${item.shortDescription}\n`;
        txtContent += `   Источник: ${item.source} | Время: ${date}\n`;
        txtContent += `   Ссылка: ${item.link}\n\n`;
    });

    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += '⚔️ СПЕЦИАЛЬНАЯ ВОЕННАЯ ОПЕРАЦИЯ (СВО)\n';
    txtContent += '════════════════════════════════════════════════════════\n\n';

    newsData.svo.items.forEach((item, index) => {
        const date = item.formattedDate || newsParser.formatDate(item.pubDate);
        txtContent += `${index + 1}. ${item.title}\n`;
        txtContent += `${item.shortDescription}\n`;
        txtContent += `   Источник: ${item.source} | Время: ${date}\n`;
        txtContent += `   Ссылка: ${item.link}\n\n`;
    });

    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += 'ℹ️ Новости из официальных источников\n';
    txtContent += '════════════════════════════════════════════════════════\n';

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `новостной_дайджест_${now.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('✅ Дайджест успешно скачан!', 'success');
}