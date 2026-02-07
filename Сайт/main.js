// ==================== ОСНОВНАЯ ЛОГИКА ПРИЛОЖЕНИЯ ====================

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 RSS News Aggregator инициализирован');
    
    // Скрываем прелоадер
    hidePreloader();
    
    // Настройка темы
    setupTheme();
    
    // Настройка навигации
    setupNavigation();
    
    // Настройка кнопок
    setupButtons();
    
    // Настройка модальных окон
    setupModals();
    
    // Загрузка новостей
    await loadNews();
    
    // Проверка автообновления
    checkAutoUpdate();
});

// ==================== ПРЕЛОАДЕР ====================

function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    
    // Имитируем прогресс загрузки
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        document.getElementById('preloaderProgress').style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                preloader.classList.add('hidden');
            }, 300);
        }
    }, 50);
}

// ==================== ТЕМА ====================

function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Обновляем иконку кнопки
    updateThemeButtonIcon(savedTheme);
    
    // Обработчик кнопки
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
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
    const button = document.getElementById('themeToggle');
    if (!button) return;
    
    button.innerHTML = theme === 'dark' 
        ? '<i class="fas fa-sun"></i>'
        : '<i class="fas fa-moon"></i>';
}

// ==================== НАВИГАЦИЯ ====================

function setupNavigation() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            
            // Обновляем активные состояния
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
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
    // Обновить новости
    document.getElementById('updateNewsBtn')?.addEventListener('click', updateNews);
    
    // Скачать дайджест
    document.getElementById('downloadDigestBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('footerDownloadBtn')?.addEventListener('click', downloadDigest);
    
    // Поделиться
    document.getElementById('shareBtn')?.addEventListener('click', () => {
        new bootstrap.Modal(document.getElementById('shareModal')).show();
    });
}

// ==================== МОДАЛЬНЫЕ ОКНА ====================

function setupModals() {
    // Модалка шеринга
    document.getElementById('shareModal')?.addEventListener('shown.bs.modal', () => {
        document.getElementById('shareLink').value = window.location.href;
    });
}

// ==================== ЗАГРУЗКА НОВОСТЕЙ ====================

async function loadNews() {
    // Проверяем кэш
    const cachedData = newsParser.loadFromCache();
    
    if (cachedData && newsParser.isCacheValid()) {
        console.log('Загружаем из кэша');
        displayNews(cachedData);
        updateLastUpdateTime();
        return;
    }
    
    // Загружаем свежие новости
    console.log('Загружаем свежие новости');
    await updateNews();
}

// Обновление новостей
async function updateNews() {
    const updateBtn = document.getElementById('updateNewsBtn');
    const originalHTML = updateBtn?.innerHTML;
    
    // Блокируем кнопку
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
            showNotification('✅ Новости успешно обновлены!', 'success');
        }
    } catch (error) {
        console.error('Ошибка обновления:', error);
        showNotification('❌ Ошибка при обновлении новостей', 'danger');
    } finally {
        // Разблокируем кнопку
        if (updateBtn) {
            updateBtn.disabled = false;
            updateBtn.innerHTML = originalHTML;
        }
    }
}

// Отображение новостей
function displayNews(data) {
    if (!data) return;
    
    // Отображаем в дайджесте
    displayCategory('world', data.world);
    displayCategory('russia', data.russia);
    displayCategory('svo', data.svo);
    
    // Отображаем в превью на главной
    displayPreviewNews(data);
    
    // Обновляем статистику
    updateStats(data);
}

// Отображение категории
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
    
    // Обновляем счётчик источников
    if (sourcesEl) {
        sourcesEl.textContent = `${data.sources.length} ${getSourcesText(data.sources.length)}`;
    }
}

// Отображение превью на главной
function displayPreviewNews(data) {
    const gridEl = document.getElementById('previewNewsGrid');
    const emptyEl = document.getElementById('previewNoContent');
    const loadingEl = document.getElementById('previewLoading');
    
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
    
    // Берём последние N новостей
    const previewCount = window.APP_CONFIG.display.previewNewsCount;
    const previewNews = allNews.slice(0, previewCount);
    
    previewNews.forEach(item => {
        gridEl.appendChild(createNewsCard(item));
    });
}

// Создание карточки новости
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
            <a href="${item.link}" class="news-card-link" target="_blank">
                <i class="fas fa-external-link-alt"></i> Читать на сайте источника
            </a>
        </div>
    `;
    
    return card;
}

// Создание элемента списка
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
        <a href="${item.link}" class="news-item-link" target="_blank">
            <i class="fas fa-external-link-alt"></i> Открыть
        </a>
    `;
    
    return li;
}

// Экранирование HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== СТАТИСТИКА ====================

function updateStats(data) {
    // Счётчики в херо
    document.getElementById('worldCount').textContent = data.world.items.length;
    document.getElementById('russiaCount').textContent = data.russia.items.length;
    document.getElementById('svoCount').textContent = data.svo.items.length;
    
    // Общая статистика
    const totalNews = data.totalNews || (data.world.items.length + data.russia.items.length + data.svo.items.length);
    const totalSources = data.totalSources || 0;
    
    document.getElementById('totalNewsCount').textContent = `${totalNews} ${getNewsText(totalNews)}`;
    document.getElementById('sourcesCount').textContent = `${totalSources} ${getSourcesText(totalSources)}`;
    
    // Футер
    document.getElementById('footerNewsCount').textContent = totalNews;
}

// Склонение слов
function getNewsText(count) {
    if (count === 1) return 'новость';
    if (count > 1 && count < 5) return 'новости';
    return 'новостей';
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
        document.getElementById('lastUpdate').textContent = 'Не обновлялось';
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
    
    document.getElementById('lastUpdate').textContent = timeText;
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
    txtContent += '║        Новости из официальных RSS-лент                  ║\n';
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
        txtContent += `   Источник: ${item.source} | Время: ${date}\n`;
        txtContent += `   Ссылка: ${item.link}\n\n`;
    });
    
    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += '🇷🇺 НОВОСТИ РОССИИ\n';
    txtContent += '════════════════════════════════════════════════════════\n\n';
    
    newsData.russia.items.forEach((item, index) => {
        const date = item.formattedDate || newsParser.formatDate(item.pubDate);
        
        txtContent += `${index + 1}. ${item.title}\n`;
        txtContent += `   Источник: ${item.source} | Время: ${date}\n`;
        txtContent += `   Ссылка: ${item.link}\n\n`;
    });
    
    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += '⚔️ СПЕЦИАЛЬНАЯ ВОЕННАЯ ОПЕРАЦИЯ (СВО)\n';
    txtContent += '════════════════════════════════════════════════════════\n\n';
    
    newsData.svo.items.forEach((item, index) => {
        const date = item.formattedDate || newsParser.formatDate(item.pubDate);
        
        txtContent += `${index + 1}. ${item.title}\n`;
        txtContent += `   Источник: ${item.source} | Время: ${date}\n`;
        txtContent += `   Ссылка: ${item.link}\n\n`;
    });
    
    txtContent += '════════════════════════════════════════════════════════\n';
    txtContent += 'ℹ️ Все новости взяты из официальных RSS-лент.\n';
    txtContent += 'Права на полные тексты принадлежат авторам.\n';
    txtContent += '════════════════════════════════════════════════════════\n';
    
    // Создаём и скачиваем файл
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

// ==================== АВТООБНОВЛЕНИЕ ====================

function checkAutoUpdate() {
    const autoUpdate = localStorage.getItem('autoUpdate') === 'true';
    
    if (autoUpdate && !newsParser.isCacheValid()) {
        console.log('Автообновление запущено');
        updateNews();
    }
}

// ==================== ПЛАВНАЯ ПРОКРУТКА К СЕКЦИИ ====================

function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
}
