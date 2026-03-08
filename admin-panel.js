// ==================== АДМИН-ПАНЕЛЬ ====================

let isAdmin = false;
let adminPassword = 'admin123';

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') {
        isAdmin = true;
    }

    // Загружаем сохранённый логотип
    loadLogo();

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

    document.getElementById('togglePassword')?.addEventListener('click', togglePasswordVisibility);
    document.getElementById('toggleNewPassword')?.addEventListener('click', toggleNewPasswordVisibility);
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('manualNewsForm')?.addEventListener('submit', handleManualNewsSubmit);
    document.getElementById('copyTelegramTextBtn')?.addEventListener('click', copyTelegramText);
    document.getElementById('generateTelegramTextBtn')?.addEventListener('click', generateTelegramText);
    document.getElementById('previewTelegramBtn')?.addEventListener('click', previewTelegramMessage);
    document.getElementById('changePasswordBtn')?.addEventListener('click', changeAdminPassword);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
    document.getElementById('clearCacheBtn')?.addEventListener('click', clearCache);
    document.getElementById('previewUpdateBtn')?.addEventListener('click', updateNews);
    document.getElementById('footerDownloadBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('copyShareLink')?.addEventListener('click', copyShareLink);

    // Новая функция: сохранение логотипа
    document.getElementById('saveLogoBtn')?.addEventListener('click', saveLogo);
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

function togglePasswordVisibility() {
    const passwordInput = document.getElementById('adminPassword');
    const toggleBtn = document.getElementById('togglePassword');
    const isPassword = passwordInput.type === 'password';

    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

function toggleNewPasswordVisibility() {
    const passwordInput = document.getElementById('newAdminPassword');
    const toggleBtn = document.getElementById('toggleNewPassword');
    const isPassword = passwordInput.type === 'password';

    passwordInput.type = isPassword ? 'text' : 'password';
    toggleBtn.innerHTML = isPassword ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
}

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

    let text = '📰 НОВОСТНОЙ ДАЙДЖЕСТ\\n';
    text += '════════════════════════\\n\\n';

    text += '🌍 НОВОСТИ МИРА:\\n';
    newsData.world.items.slice(0, 3).forEach((item, index) => {
        text += `${index + 1}. ${item.title}\\n`;
        text += `   📰 ${item.source}\\n\\n`;
    });

    text += '\\n🇷🇺 НОВОСТИ РОССИИ:\\n';
    newsData.russia.items.slice(0, 3).forEach((item, index) => {
        text += `${index + 1}. ${item.title}\\n`;
        text += `   📰 ${item.source}\\n\\n`;
    });

    text += '\\n⚔️ НОВОСТИ СВО:\\n';
    newsData.svo.items.slice(0, 3).forEach((item, index) => {
        text += `${index + 1}. ${item.title}\\n`;
        text += `   📰 ${item.source}\\n\\n`;
    });

    text += '\\n════════════════════════\\n';
    text += '🔗 Подробнее: ваш-сайт.com\\n';
    text += '📡 Новости из официальных источников';

    document.getElementById('telegramText').value = text;
}

function copyTelegramText() {
    const textArea = document.getElementById('telegramText');
    textArea.select();
    document.execCommand('copy');
    showNotification('✅ Текст для Telegram скопирован!', 'success');
}

function previewTelegramMessage() {
    const text = document.getElementById('telegramText').value;
    if (!text) {
        showNotification('❌ Сначала сгенерируйте текст!', 'danger');
        return;
    }

    const previewContent = document.getElementById('telegramPreviewContent');
    previewContent.innerHTML = `
        <div style="background: #2c2c2c; color: white; padding: 1.5rem; border-radius: 12px; font-family: Arial, sans-serif;">
            <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                <div style="width: 50px; height: 50px; background: #0088cc; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem;">
                    <i class="fab fa-telegram-plane"></i>
                </div>
                <div>
                    <div style="font-weight: bold; font-size: 1.1rem;">ЧБ Новостной Агрегатор</div>
                    <div style="opacity: 0.7; font-size: 0.9rem;">${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            </div>
            <div style="line-height: 1.6; white-space: pre-wrap; font-size: 1.05rem;">
                ${text.replace(/\\n/g, '<br>')}
            </div>
        </div>
    `;

    new bootstrap.Modal(document.getElementById('telegramPreviewModal')).show();
}

// ==================== НАСТРОЙКИ ====================

function loadSettings() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.body.setAttribute('data-theme', savedTheme);

    const autoUpdate = localStorage.getItem('autoUpdate') === 'true';
    document.getElementById('autoUpdateToggle')?.checked = autoUpdate;

    const darkModeDefault = localStorage.getItem('darkModeDefault') === 'true';
    document.getElementById('darkModeToggle')?.checked = darkModeDefault;
}

function saveSettings() {
    const autoUpdate = document.getElementById('autoUpdateToggle')?.checked;
    localStorage.setItem('autoUpdate', autoUpdate.toString());

    const darkModeDefault = document.getElementById('darkModeToggle')?.checked;
    localStorage.setItem('darkModeDefault', darkModeDefault.toString());

    showNotification('✅ Настройки сохранены!', 'success');
}

// Новая функция: сохранение логотипа
function saveLogo() {
    const logoUrl = document.getElementById('logoUrl').value.trim();

    if (logoUrl) {
        // Проверяем, что это действительно изображение
        if (!logoUrl.match(/\.(jpeg|jpg|gif|png|svg)$/) && !logoUrl.includes('logo')) {
            showNotification('⚠️ URL должен вести к изображению (jpg, png, svg)', 'warning');
            return;
        }

        localStorage.setItem('customLogo', logoUrl);
        loadLogo();
        showNotification('✅ Логотип успешно изменён!', 'success');
    } else {
        // Удаляем кастомный логотип
        localStorage.removeItem('customLogo');
        loadLogo();
        showNotification('✅ Логотип сброшен на стандартный', 'success');
    }
}

// Новая функция: загрузка логотипа
function loadLogo() {
    const logoUrl = localStorage.getItem('customLogo');
    const logoElements = document.querySelectorAll('.logo-img, .logo-placeholder, .footer-logo .logo-text');

    if (logoUrl) {
        // Заменяем текстовый логотип на изображение
        logoElements.forEach(el => {
            if (el.classList.contains('logo-text')) {
                // Для элементов с текстом "ЧБ" - скрываем текст и показываем изображение
                el.style.display = 'none';
                const imgContainer = el.parentElement;
                if (imgContainer) {
                    let imgEl = imgContainer.querySelector('.custom-logo-img');
                    if (!imgEl) {
                        imgEl = document.createElement('img');
                        imgEl.className = 'custom-logo-img';
                        imgEl.style.width = '50px';
                        imgEl.style.height = '50px';
                        imgEl.style.borderRadius = '50%';
                        imgEl.style.objectFit = 'cover';
                        imgEl.style.boxShadow = '0 0 15px rgba(196, 30, 58, 0.4)';
                        imgContainer.insertBefore(imgEl, el);
                    }
                    imgEl.src = logoUrl;
                    imgEl.style.display = 'block';
                }
            } else {
                // Для контейнеров логотипа
                el.innerHTML = `<img src="${logoUrl}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
            }
        });
    } else {
        // Восстанавливаем текстовый логотип
        logoElements.forEach(el => {
            if (el.classList.contains('logo-text')) {
                el.style.display = 'flex';
                const imgEl = el.parentElement?.querySelector('.custom-logo-img');
                if (imgEl) imgEl.style.display = 'none';
            } else if (el.classList.contains('logo-img')) {
                el.innerHTML = `<div class="logo-text">ЧБ</div>`;
            } else {
                el.innerHTML = `<div class="logo-text">ЧБ</div>`;
            }
        });
    }
}

function changeAdminPassword() {
    const newPassword = document.getElementById('newAdminPassword').value.trim();

    if (!newPassword) {
        showNotification('ℹ️ Пароль не изменён', 'info');
        return;
    }

    if (newPassword.length < 6) {
        showNotification('❌ Пароль должен быть не менее 6 символов', 'danger');
        return;
    }

    adminPassword = newPassword;
    localStorage.setItem('adminPassword', newPassword);

    showNotification('✅ Пароль успешно изменён!', 'success');
    document.getElementById('newAdminPassword').value = '';
}

function clearCache() {
    if (!confirm('Вы уверены? Это удалит все сохранённые новости.')) {
        return;
    }

    localStorage.removeItem('newsData');
    localStorage.removeItem('lastUpdate');
    localStorage.removeItem('customLogo');

    showNotification('✅ Кэш очищен! Страница будет перезагружена.', 'success');

    setTimeout(() => {
        location.reload();
    }, 1000);
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    showNotification('✅ Ссылка скопирована!', 'success');
}

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
        background: rgba(30, 30, 30, 0.95);
        border: 1px solid var(--primary);
        color: #e0e0e0;
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