// ==================== АДМИН-ПАНЕЛЬ ====================
let isAdmin = false;
let adminPassword = 'admin123';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') {
        isAdmin = true;
    }
    
    const savedPassword = localStorage.getItem('adminPassword');
    if (savedPassword) {
        adminPassword = savedPassword;
    }

    setupAdminPanel();
});

// ==================== НАСТРОЙКА АДМИН-ПАНЕЛИ ====================
function setupAdminPanel() {
    document.getElementById('adminBtn')?.addEventListener('click', openAdminPanel);
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });

    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('manualNewsForm')?.addEventListener('submit', handleManualNewsSubmit);
    document.getElementById('copyTelegramTextBtn')?.addEventListener('click', copyTelegramText);
    document.getElementById('generateTelegramTextBtn')?.addEventListener('click', generateTelegramText);
}

function openAdminPanel() {
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    if (isAdmin) {
        switchTab('manual');
    } else {
        switchTab('login');
    }
    updateAdminModalTitle();
    modal.show();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    updateAdminModalTitle();

    if (tabName === 'telegram') {
        generateTelegramText();
    }
}

function updateAdminModalTitle() {
    const activeTab = document.querySelector('.tab-btn.active');
    const title = activeTab?.textContent || 'Админ-панель';
    document.getElementById('adminModalTitle').textContent = title.trim();
}

// ==================== АВТОРИЗАЦИЯ ====================
function handleLogin() {
    const passwordInput = document.getElementById('adminPassword');
    const password = passwordInput.value.trim();
    
    if (!password) {
        showNotification('❌ Введите пароль!', 'danger');
        return;
    }

    if (password === adminPassword) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        showNotification('✅ Вход выполнен успешно!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('adminModal'))?.hide();
        passwordInput.value = '';
        updateAdminUI();
    } else {
        showNotification('❌ Неверный пароль!', 'danger');
        passwordInput.value = '';
    }
}

function updateAdminUI() {
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.innerHTML = '<i class="fas fa-user-check"></i>';
    }
}

// ==================== РУЧНОЕ ДОБАВЛЕНИЕ НОВОСТЕЙ ====================
function handleManualNewsSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('manualTitle').value.trim();
    const description = document.getElementById('manualDescription').value.trim();
    const url = document.getElementById('manualUrl').value.trim();
    const category = document.getElementById('manualCategory').value;
    const source = document.getElementById('manualSource').value.trim();

    if (!title || !description || !url || !category || !source) {
        showNotification('❌ Заполните все поля!', 'danger');
        return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showNotification('❌ URL должен начинаться с http:// или https://', 'danger');
        return;
    }

    const manualNews = {
        title: title,
        link: url,
        pubDate: new Date().toISOString(),
        source: source,
        category: category,
        formattedDate: newsParser.formatDate(new Date()),
        description: description,
        shortDescription: newsParser.truncateWords(description, 100),
        isManual: true
    };

    addManualNews(manualNews);
    showNotification('✅ Новость успешно добавлена!', 'success');
    document.getElementById('manualNewsForm').reset();

    setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('adminModal'))?.hide();
    }, 1000);
}

function addManualNews(news) {
    try {
        let newsData = newsParser.loadFromCache();
        if (!newsData) {
            newsData = {
                world: { items: [], sources: [] },
                russia: { items: [], sources: [] },
                svo: { items: [], sources: [] },
                timestamp: new Date().toISOString()
            };
        }

        newsData[news.category].items.unshift(news);

        if (!newsData[news.category].sources.includes(news.source)) {
            newsData[news.category].sources.push(news.source);
        }

        newsParser.saveToCache(newsData);
        displayNews(newsData);

    } catch (error) {
        console.error('Ошибка добавления новости:', error);
        showNotification('❌ Ошибка при добавлении новости', 'danger');
    }
}

// ==================== TELEGRAM ====================
function generateTelegramText() {
    const newsData = newsParser.loadFromCache();
    if (!newsData) {
        document.getElementById('telegramText').value = 'Нет данных. Сначала обновите новости.';
        return;
    }

    let text = '📰 НОВОСТНОЙ ДАЙДЖЕСТ\n';
    text += '════════════════════════\n\n';

    text += '🌍 НОВОСТИ МИРА:\n';
    newsData.world.items.slice(0, 3).forEach((item, index) => {
        text += `${index + 1}. ${item.title}\n`;
        text += `   📰 ${item.source}\n\n`;
    });

    text += '\n🇷🇺 НОВОСТИ РОССИИ:\n';
    newsData.russia.items.slice(0, 3).forEach((item, index) => {
        text += `${index + 1}. ${item.title}\n`;
        text += `   📰 ${item.source}\n\n`;
    });

    text += '\n⚔️ НОВОСТИ СВО:\n';
    newsData.svo.items.slice(0, 3).forEach((item, index) => {
        text += `${index + 1}. ${item.title}\n`;
        text += `   📰 ${item.source}\n\n`;
    });

    text += '\n════════════════════════\n';
    text += '🔗 Подробнее: ваш-сайт.com\n';
    text += '📡 Новости из официальных источников';

    document.getElementById('telegramText').value = text;
}

function copyTelegramText() {
    const textArea = document.getElementById('telegramText');
    textArea.select();
    document.execCommand('copy');
    showNotification('✅ Текст для Telegram скопирован!', 'success');
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
