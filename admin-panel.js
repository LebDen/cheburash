/**
 * ЧБ Новости 2026 — Админ-панель
 */
class AdminPanel {
    constructor(config) {
        this.config = config;
        this.isAuthenticated = false;
        this.init();
    }

    init() {
        // Переключение вкладок
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Вход
        document.getElementById('loginBtn')?.addEventListener('click', () => this.login());
        
        // Добавление новости
        document.getElementById('manualNewsForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.addManualNews();
        });

        // Сохранение настроек
        document.getElementById('saveLogoBtn')?.addEventListener('click', () => this.saveSettings());

        // Проверка сессии при загрузке
        this.checkSession();
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}Tab`)?.classList.add('active');
    }

    async login() {
        const password = document.getElementById('adminPassword')?.value;
        if (!password) return this.showError('Введите пароль');

        try {
            // Хэширование пароля (SHA-256)
            const encoder = new TextEncoder();
            const data = encoder.encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const passwordHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            if (passwordHash === this.config.passwordHash) {
                this.isAuthenticated = true;
                // Сохранение сессии
                const session = {
                    token: crypto.randomUUID(),
                    expires: Date.now() + this.config.sessionDuration
                };
                localStorage.setItem(this.config.sessionKey, JSON.stringify(session));
                
                this.showSuccess('Вход выполнен');
                this.switchTab('manual');
                document.getElementById('adminPassword').value = '';
            } else {
                this.showError('Неверный пароль');
            }
        } catch (err) {
            console.error('Ошибка входа:', err);
            this.showError('Ошибка авторизации');
        }
    }

    checkSession() {
        try {
            const session = JSON.parse(localStorage.getItem(this.config.sessionKey));
            if (session && session.expires > Date.now()) {
                this.isAuthenticated = true;
            } else {
                localStorage.removeItem(this.config.sessionKey);
            }
        } catch (e) {
            localStorage.removeItem(this.config.sessionKey);
        }
    }

    addManualNews() {
        if (!this.isAuthenticated) return this.showError('Требуется авторизация');

        const news = {
            id: `manual_${Date.now()}`,
            title: document.getElementById('manualTitle').value.trim(),
            description: document.getElementById('manualDescription').value.trim(),
            link: document.getElementById('manualUrl').value.trim(),
            category: document.getElementById('manualCategory').value,
            source: document.getElementById('manualSource').value.trim(),
            pubDate: new Date(),
            isManual: true
        };

        if (!news.title || !news.description || !news.link || !news.category) {
            return this.showError('Заполните все обязательные поля');
        }

        // Сохранение в localStorage
        const saved = JSON.parse(localStorage.getItem(this.config.newsKey) || '[]');
        saved.unshift(news);
        localStorage.setItem(this.config.newsKey, JSON.stringify(saved.slice(0, 100)));

        this.showSuccess('Новость добавлена');
        document.getElementById('manualNewsForm').reset();
        
        // Обновление интерфейса
        if (typeof renderNews === 'function') {
            renderNews();
        }
    }

    saveSettings() {
        if (!this.isAuthenticated) return this.showError('Требуется авторизация');

        const logoUrl = document.getElementById('logoUrl')?.value?.trim();
        const settings = JSON.parse(localStorage.getItem(this.config.settingsKey) || '{}');
        
        if (logoUrl) {
            settings.logoUrl = logoUrl;
            // Применение логотипа
            const logoText = document.querySelector('.logo-text');
            if (logoText) {
                logoText.innerHTML = `<img src="${logoUrl}" alt="ЧБ" style="height:32px;border-radius:4px">`;
            }
        }
        
        localStorage.setItem(this.config.settingsKey, JSON.stringify(settings));
        this.showSuccess('Настройки сохранены');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showToast(message, type = 'info') {
        // Простой тост без зависимостей
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 9999;
            padding: 12px 20px; border-radius: 8px; color: white;
            background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#198754' : '#0d6efd'};
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); animation: slideIn 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    if (typeof CONFIG !== 'undefined') {
        window.adminPanel = new AdminPanel(CONFIG.ADMIN);
    }
});
