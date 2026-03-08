// ==================== ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ ====================
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 ЧБ Новостной Агрегатор 2026 инициализирован');
    
    // Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
    }

    // Тема
    setupTheme();

    // Кнопки
    setupButtons();

    // Время
    updateTime();
    setInterval(updateTime, 1000);

    // Загрузка новостей
    await loadNews();
});

// ==================== ТЕМА ====================
function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
}

// ==================== КНОПКИ ====================
function setupButtons() {
    document.getElementById('updateNewsBtn')?.addEventListener('click', updateNews);
    document.getElementById('downloadDigestBtn')?.addEventListener('click', downloadDigest);
}

// ==================== ВРЕМЯ ====================
function updateTime() {
    const now = new Date();
    document.getElementById('currentTime').textContent = 
        now.toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'});
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
}

function displayCategory(category, data) {
    const listEl = document.getElementById(`${category}NewsList`);
    const emptyEl = document.getElementById(`${category}NoContent`);
    const sourcesEl = document.getElementById(`${category}SourcesCount`);
    const loadingEl = document.getElementById(`${category}Loading`);
    
    if (!listEl || !emptyEl) return;

    if (loadingEl) loadingEl.classList.add('hidden');

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
    const dateFormatted = now.toLocaleDateString('ru-RU', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    let txtContent = generateCleanDigest(newsData, dateFormatted);

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

function generateCleanDigest(data, dateFormatted) {
    let content = '';
    content += 'ЕЖЕДНЕВНЫЙ НОВОСТНОЙ ДАЙДЖЕСТ «ЧБ»\n';
    content += `${dateFormatted}\n\n`;
    content += '='.repeat(70) + '\n\n';

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

    content += '='.repeat(70) + '\n\n';
    content += 'Дайджест сформирован автоматически из официальных источников.\n';
    content += 'Все права на полные тексты принадлежат авторам.\n';
    content += '© ЧБ Новостной Агрегатор 2026\n';

    return content;
}

function cleanDescription(desc) {
    if (!desc) return 'Без описания';
    desc = desc.trim().replace(/\s+/g, ' ');
    if (desc.length > 150) {
        desc = desc.substring(0, 147) + '...';
    }
    return desc;
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function showNotification(message, type = 'info') {
    const oldNotifications = document.querySelectorAll('.app-notification');
    oldNotifications.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = `alert alert-${type} alert-dismissible fade show app-notification`;
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
