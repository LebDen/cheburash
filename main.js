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
        document.body.style.overflow = 'hidden';
    });

    // Закрыть меню
    closeBtn?.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
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

            document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
            document.getElementById(targetId)?.classList.add('active');

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
        // Убрали показ ошибки пользователю - только в консоли
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

// ==================== СКАЧИВАНИЕ ДАЙДЖЕСТА - ЧИСТЫЙ ФОРМАТ ====================

function downloadDigest() {
    const newsData = newsParser.loadFromCache();

    if (!newsData) {
        showNotification('❌ Нет данных для скачивания. Сначала обновите новости.', 'danger');
        return;
    }

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Генерируем чистый .txt файл
    let txtContent = generateCleanDigest(newsData, dateFormatted);

    // Создаём и скачиваем файл
    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ЧБ_дайджест_${now.toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showNotification('✅ Дайджест успешно скачан!', 'success');
}

// Генерация чистого дайджеста без рамок
function generateCleanDigest(data, dateFormatted) {
    let content = '';

    // ЗАГОЛОВОК
    content += 'ЕЖЕДНЕВНЫЙ НОВОСТНОЙ ДАЙДЖЕСТ «ЧБ»\n';
    content += `${dateFormatted}\n\n`;
    content += '='.repeat(70) + '\n\n';

    // НОВОСТИ МИРА
    if (data.world.items.length > 0) {
        content += '🌍 НОВОСТИ МИРА\n';
        content += '-'.repeat(70) + '\n\n';

        data.world.items.forEach((item, index) => {
            content += `${index + 1}. ${item.title}\n`;
            content += `   Источник: ${item.source}\n`;
            content += `   Кратко: ${cleanDescription(item.shortDescription)}\n\n`;
        });

        content += '\n';
    }

    // НОВОСТИ РОССИИ
    if (data.russia.items.length > 0) {
        content += '🇷🇺 НОВОСТИ РОССИИ\n';
        content += '-'.repeat(70) + '\n\n';

        data.russia.items.forEach((item, index) => {
            content += `${index + 1}. ${item.title}\n`;
            content += `   Источник: ${item.source}\n`;
            content += `   Кратко: ${cleanDescription(item.shortDescription)}\n\n`;
        });

        content += '\n';
    }

    // НОВОСТИ СВО
    if (data.svo.items.length > 0) {
        content += '⚔️ НОВОСТИ СПЕЦИАЛЬНОЙ ВОЕННОЙ ОПЕРАЦИИ\n';
        content += '-'.repeat(70) + '\n\n';

        data.svo.items.forEach((item, index) => {
            content += `${index + 1}. ${item.title}\n`;
            content += `   Источник: ${item.source}\n`;
            content += `   Кратко: ${cleanDescription(item.shortDescription)}\n\n`;
        });

        content += '\n';
    }

    // ПОДВАЛ
    content += '='.repeat(70) + '\n\n';
    content += 'Дайджест сформирован автоматически из официальных источников.\n';
    content += 'Все права на полные тексты принадлежат авторам.\n';
    content += '© ЧБ Новостной Агрегатор 2026\n';

    return content;
}

// Очистка описания от лишних символов
function cleanDescription(desc) {
    if (!desc) return 'Без описания';

    // Убираем лишние пробелы и переносы
    desc = desc.trim().replace(/\s+/g, ' ');

    // Обрезаем до 150 символов для читаемости
    if (desc.length > 150) {
        desc = desc.substring(0, 147) + '...';
    }

    return desc;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Показать уведомление
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
        animation: slideInDown 0.3s ease;
    `;
    notification.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('show');
        notification.classList.add('fade');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}