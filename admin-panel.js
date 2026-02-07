// ==================== АДМИН-ПАНЕЛЬ ====================

let isAdmin = false;
let adminPassword = window.APP_CONFIG.admin.defaultPassword;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем сохранённый статус авторизации
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') {
        isAdmin = true;
    }
    
    // Загружаем настройки
    loadSettings();
    
    // Настраиваем обработчики
    setupAdminPanel();
});

// ==================== НАСТРОЙКА АДМИН-ПАНЕЛИ ====================

function setupAdminPanel() {
    // Кнопка админ-панели
    document.getElementById('adminBtn')?.addEventListener('click', () => {
        openAdminPanel();
    });
    
    // Переключение вкладок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchTab(btn.getAttribute('data-tab'));
        });
    });
    
    // Показать/скрыть пароль
    document.getElementById('togglePassword')?.addEventListener('click', togglePasswordVisibility);
    document.getElementById('toggleNewPassword')?.addEventListener('click', toggleNewPasswordVisibility);
    
    // Вход
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    
    // Форма добавления новости
    document.getElementById('manualNewsForm')?.addEventListener('submit', handleManualNewsSubmit);
    
    // Telegram функции
    document.getElementById('copyTelegramTextBtn')?.addEventListener('click', copyTelegramText);
    document.getElementById('generateTelegramTextBtn')?.addEventListener('click', generateTelegramText);
    document.getElementById('previewTelegramBtn')?.addEventListener('click', previewTelegramMessage);
    
    // Настройки
    document.getElementById('changePasswordBtn')?.addEventListener('click', changeAdminPassword);
    document.getElementById('saveSettingsBtn')?.addEventListener('click', saveSettings);
    document.getElementById('clearCacheBtn')?.addEventListener('click', clearCache);
    document.getElementById('exportDataBtn')?.addEventListener('click', exportData);
    
    // Кнопки на странице
    document.getElementById('previewUpdateBtn')?.addEventListener('click', updateNews);
    document.getElementById('footerDownloadBtn')?.addEventListener('click', downloadDigest);
    document.getElementById('copyShareLink')?.addEventListener('click', copyShareLink);
    
    // Спонсорская поддержка
    document.getElementById('donate50Btn')?.addEventListener('click', () => showDonationModal(50));
    document.getElementById('donate100Btn')?.addEventListener('click', () => showDonationModal(100));
    document.getElementById('donate200Btn')?.addEventListener('click', () => showDonationModal(200));
}

// Открыть админ-панель
function openAdminPanel() {
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    
    if (isAdmin) {
        // Уже авторизованы
        switchTab('manual');
    } else {
        // Нужно войти
        switchTab('login');
    }
    
    // Обновляем заголовок
    updateAdminModalTitle();
    
    modal.show();
}

// Переключить вкладку
function switchTab(tabName) {
    // Скрываем все вкладки
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убираем активный класс у всех кнопок
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показываем выбранную вкладку
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
    
    // Обновляем заголовок
    updateAdminModalTitle();
    
    // Генерируем текст для Telegram при открытии вкладки
    if (tabName === 'telegram') {
        generateTelegramText();
    }
}

// Обновить заголовок модалки
function updateAdminModalTitle() {
    const activeTab = document.querySelector('.tab-btn.active');
    const title = activeTab?.textContent || 'Админ-панель';
    document.getElementById('adminModalTitle').textContent = title.trim();
}

// ==================== АВТОРИЗАЦИЯ ====================

// Показать/скрыть пароль
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

// Обработка входа
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
        
        // Закрываем модалку
        bootstrap.Modal.getInstance(document.getElementById('adminModal'))?.hide();
        
        // Очищаем поле пароля
        passwordInput.value = '';
        
        // Обновляем интерфейс
        updateAdminUI();
    } else {
        showNotification('❌ Неверный пароль!', 'danger');
        passwordInput.value = '';
    }
}

// Обновить интерфейс для админа
function updateAdminUI() {
    // Можно добавить индикатор авторизации
    const adminBtn = document.getElementById('adminBtn');
    if (adminBtn) {
        adminBtn.innerHTML = '<i class="fas fa-user-check"></i>';
        adminBtn.title = 'Админ-панель (авторизован)';
    }
}

// ==================== РУЧНОЕ ДОБАВЛЕНИЕ НОВОСТЕЙ ====================

// Обработка отправки формы
function handleManualNewsSubmit(e) {
    e.preventDefault();
    
    const title = document.getElementById('manualTitle').value.trim();
    const description = document.getElementById('manualDescription').value.trim();
    const url = document.getElementById('manualUrl').value.trim();
    const category = document.getElementById('manualCategory').value;
    const source = document.getElementById('manualSource').value.trim();
    
    // Валидация
    if (!title || !description || !url || !category || !source) {
        showNotification('❌ Заполните все поля!', 'danger');
        return;
    }
    
    if (title.length > window.APP_CONFIG.admin.maxTitleLength) {
        showNotification(`❌ Заголовок слишком длинный (максимум ${window.APP_CONFIG.admin.maxTitleLength} символов)`, 'danger');
        return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
        showNotification('❌ URL должен начинаться с http:// или https://', 'danger');
        return;
    }
    
    // Создаём новость
    const manualNews = {
        title: title,
        link: url,
        pubDate: new Date().toISOString(),
        source: source,
        category: category,
        formattedDate: newsParser.formatDate(new Date()),
        description: description,
        shortDescription: newsParser.truncateWords(description, window.APP_CONFIG.display.maxDescriptionWords),
        isManual: true
    };
    
    // Добавляем в кэш
    addManualNews(manualNews);
    
    showNotification('✅ Новость успешно добавлена!', 'success');
    
    // Очищаем форму
    document.getElementById('manualNewsForm').reset();
    
    // Закрываем модалку через 1 секунду
    setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('adminModal'))?.hide();
    }, 1000);
}

// Добавление ручной новости в кэш
function addManualNews(news) {
    try {
        // Получаем текущие данные
        let newsData = newsParser.loadFromCache();
        
        if (!newsData) {
            newsData = {
                world: { items: [], sources: [] },
                russia: { items: [], sources: [] },
                svo: { items: [], sources: [] },
                timestamp: new Date().toISOString()
            };
        }
        
        // Добавляем новость в соответствующую категорию (в начало)
        newsData[news.category].items.unshift(news);
        
        // Обновляем счётчики
        if (!newsData[news.category].sources.includes(news.source)) {
            newsData[news.category].sources.push(news.source);
        }
        
        // Сохраняем обратно
        newsParser.saveToCache(newsData);
        
        // Обновляем отображение
        displayNews(newsData);
        
    } catch (error) {
        console.error('Ошибка добавления новости:', error);
        showNotification('❌ Ошибка при добавлении новости', 'danger');
    }
}

// ==================== TELEGRAM ====================

// Генерация текста для Telegram
function generateTelegramText() {
    const newsData = newsParser.loadFromCache();
    
    if (!newsData) {
        document.getElementById('telegramText').value = 'Нет данных. Сначала обновите новости.';
        return;
    }
    
    let text = '📰 НОВОСТНОЙ ДАЙДЖЕСТ\\n';
    text += '════════════════════════\\n\\n';
    
    // Новости мира
    text += '🌍 НОВОСТИ МИРА:\\n';
    newsData.world.items.slice(0, window.APP_CONFIG.telegram.newsPerCategory).forEach((item, index) => {
        const title = newsParser.truncateText(item.title, window.APP_CONFIG.telegram.maxTitleLength);
        text += `${index + 1}. ${title}\\n`;
        text += `   📰 ${item.source}\\n\\n`;
    });
    
    text += '\\n';
    
    // Новости России
    text += '🇷🇺 НОВОСТИ РОССИИ:\\n';
    newsData.russia.items.slice(0, window.APP_CONFIG.telegram.newsPerCategory).forEach((item, index) => {
        const title = newsParser.truncateText(item.title, window.APP_CONFIG.telegram.maxTitleLength);
        text += `${index + 1}. ${title}\\n`;
        text += `   📰 ${item.source}\\n\\n`;
    });
    
    text += '\\n';
    
    // Новости СВО
    text += '⚔️ СПЕЦИАЛЬНАЯ ВОЕННАЯ ОПЕРАЦИЯ:\\n';
    newsData.svo.items.slice(0, window.APP_CONFIG.telegram.newsPerCategory).forEach((item, index) => {
        const title = newsParser.truncateText(item.title, window.APP_CONFIG.telegram.maxTitleLength);
        text += `${index + 1}. ${title}\\n`;
        text += `   📰 ${item.source}\\n\\n`;
    });
    
    text += '\\n════════════════════════\\n';
    text += `🔗 Подробнее: ${window.APP_CONFIG.telegram.siteUrl}\\n`;
    text += '📡 Новости из официальных источников';
    
    document.getElementById('telegramText').value = text;
}

// Копирование текста для Telegram
function copyTelegramText() {
    const textArea = document.getElementById('telegramText');
    textArea.select();
    document.execCommand('copy');
    
    showNotification('✅ Текст для Telegram скопирован!', 'success');
}

// Предпросмотр сообщения Telegram
function previewTelegramMessage() {
    const text = document.getElementById('telegramText').value;
    
    if (!text) {
        showNotification('❌ Сначала сгенерируйте текст!', 'danger');
        return;
    }
    
    // Создаём красивый предпросмотр
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
                ${text.replace(/\\n/g, '<br>').replace(/\*/g, '<b>').replace(/<\/b>/g, '</b>')}
            </div>
        </div>
    `;
    
    // Показываем модалку
    new bootstrap.Modal(document.getElementById('telegramPreviewModal')).show();
}

// ==================== НАСТРОЙКИ ====================

// Загрузка настроек
function loadSettings() {
    // Тема
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.setAttribute('data-theme', savedTheme);
    
    // Автообновление
    const autoUpdate = localStorage.getItem('autoUpdate') === 'true';
    document.getElementById('autoUpdateToggle')?.checked = autoUpdate;
    
    // Тёмная тема по умолчанию
    const darkModeDefault = localStorage.getItem('darkModeDefault') === 'true';
    document.getElementById('darkModeToggle')?.checked = darkModeDefault;
}

// Сохранение настроек
function saveSettings() {
    // Автообновление
    const autoUpdate = document.getElementById('autoUpdateToggle')?.checked;
    localStorage.setItem('autoUpdate', autoUpdate.toString());
    
    // Тёмная тема по умолчанию
    const darkModeDefault = document.getElementById('darkModeToggle')?.checked;
    localStorage.setItem('darkModeDefault', darkModeDefault.toString());
    
    showNotification('✅ Настройки сохранены!', 'success');
}

// Изменение пароля администратора
function changeAdminPassword() {
    const newPassword = document.getElementById('newAdminPassword').value.trim();
    
    if (!newPassword) {
        showNotification('ℹ️ Пароль не изменён', 'info');
        return;
    }
    
    if (newPassword.length < window.APP_CONFIG.admin.minPasswordLength) {
        showNotification(`❌ Пароль должен быть не менее ${window.APP_CONFIG.admin.minPasswordLength} символов`, 'danger');
        return;
    }
    
    adminPassword = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    
    showNotification('✅ Пароль успешно изменён!', 'success');
    document.getElementById('newAdminPassword').value = '';
}

// Очистка кэша
function clearCache() {
    if (!confirm('Вы уверены? Это удалит все сохранённые новости и настройки.')) {
        return;
    }
    
    localStorage.removeItem('newsData');
    localStorage.removeItem('lastUpdate');
    localStorage.removeItem('autoUpdate');
    localStorage.removeItem('darkModeDefault');
    
    showNotification('✅ Кэш очищен! Страница будет перезагружена.', 'success');
    
    // Перезагружаем страницу через 1 секунду
    setTimeout(() => {
        location.reload();
    }, 1000);
}

// Экспорт данных
function exportData() {
    const newsData = newsParser.loadFromCache();
    
    if (!newsData) {
        showNotification('❌ Нет данных для экспорта', 'danger');
        return;
    }
    
    const exportData = {
        news: newsData,
        settings: {
            theme: localStorage.getItem('theme'),
            autoUpdate: localStorage.getItem('autoUpdate'),
            darkModeDefault: localStorage.getItem('darkModeDefault')
        },
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rss-news-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('✅ Данные экспортированы!', 'success');
}

// ==================== СПОНСОРСКАЯ ПОДДЕРЖКА ====================

// Показать модалку с оплатой
function showDonationModal(amount) {
    const modalContent = `
        <div class="modal-header">
            <h5 class="modal-title"><i class="fas fa-donate"></i> Поддержать проект (${amount} руб)</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
        </div>
        <div class="modal-body">
            <div class="donation-options">
                <div class="donation-option" onclick="processDonation(${amount}, 'sberbank')">
                    <i class="fab fa-cc-mastercard"></i>
                    <div>
                        <h6>Сбербанк</h6>
                        <p>Перевод по номеру телефона</p>
                    </div>
                </div>
                <div class="donation-option" onclick="processDonation(${amount}, 'qiwi')">
                    <i class="fab fa-cc-visa"></i>
                    <div>
                        <h6>QIWI</h6>
                        <p>Кошелек QIWI</p>
                    </div>
                </div>
                <div class="donation-option" onclick="processDonation(${amount}, 'yoomoney')">
                    <i class="fab fa-cc-paypal"></i>
                    <div>
                        <h6>ЮMoney</h6>
                        <p>Кошелек ЮMoney</p>
                    </div>
                </div>
            </div>
            <div class="donation-info">
                <p><i class="fas fa-info-circle"></i> После оплаты отправьте скриншот в телеграм-бота для подтверждения</p>
                <p><i class="fab fa-telegram"></i> Бот: @news_donate_bot</p>
            </div>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Закрыть</button>
        </div>
    `;
    
    const modal = new bootstrap.Modal(document.getElementById('donationModal'));
    document.getElementById('donationModalContent').innerHTML = modalContent;
    modal.show();
}

// Обработка оплаты
function processDonation(amount, system) {
    const systemNames = {
        sberbank: 'Сбербанк',
        qiwi: 'QIWI',
        yoomoney: 'ЮMoney'
    };
    
    showNotification(`✅ Поддержка через ${systemNames[system]} (${amount} руб)`, 'success');
    showNotification('Отправьте скриншот в @news_donate_bot для подтверждения', 'info');
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

// Скопировать ссылку для шеринга
function copyShareLink() {
    const shareLink = document.getElementById('shareLink');
    shareLink.select();
    document.execCommand('copy');
    
    showNotification('✅ Ссылка скопирована!', 'success');
}

// Открыть модалку шеринга
document.getElementById('shareBtn')?.addEventListener('click', () => {
    const shareModal = new bootstrap.Modal(document.getElementById('shareModal'));
    document.getElementById('shareLink').value = window.location.href;
    shareModal.show();
});