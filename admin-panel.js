// ==================== АДМИН-ПАНЕЛЬ ====================
let isAdmin = false;
let adminPassword = 'admin123';

document.addEventListener('DOMContentLoaded', () => {
    const savedAdmin = localStorage.getItem('isAdmin');
    if (savedAdmin === 'true') isAdmin = true;
    loadLogo();
    setupAdminPanel();
});

function setupAdminPanel() {
    document.getElementById('adminBtn')?.addEventListener('click', openAdminPanel);
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.getAttribute('data-tab')));
    });
    document.getElementById('loginBtn')?.addEventListener('click', handleLogin);
    document.getElementById('manualNewsForm')?.addEventListener('submit', handleManualNewsSubmit);
    document.getElementById('saveLogoBtn')?.addEventListener('click', saveLogo);
    document.getElementById('clearCacheBtn')?.addEventListener('click', clearCache);
}

function openAdminPanel() {
    const modal = new bootstrap.Modal(document.getElementById('adminModal'));
    switchTab(isAdmin ? 'manual' : 'login');
    modal.show();
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${tabName}Tab`)?.classList.add('active');
    document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
}

function handleLogin() {
    const password = document.getElementById('adminPassword').value.trim();
    if (!password) {
        showNotification('❌ Введите пароль!', 'danger');
        return;
    }
    if (password === adminPassword) {
        isAdmin = true;
        localStorage.setItem('isAdmin', 'true');
        showNotification('✅ Вход выполнен!', 'success');
        bootstrap.Modal.getInstance(document.getElementById('adminModal'))?.hide();
        document.getElementById('adminPassword').value = '';
        switchTab('manual');
    } else {
        showNotification('❌ Неверный пароль!', 'danger');
    }
}

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

    const manualNews = {
        title, link: url, pubDate: new Date().toISOString(),
        source, category,
        formattedDate: newsParser.formatDate(new Date()),
        description,
        shortDescription: newsParser.truncateWords(description, 100),
        isManual: true
    };

    addManualNews(manualNews);
    showNotification('✅ Новость добавлена!', 'success');
    document.getElementById('manualNewsForm').reset();
    setTimeout(() => bootstrap.Modal.getInstance(document.getElementById('adminModal'))?.hide(), 1000);
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
        console.error('Ошибка:', error);
        showNotification('❌ Ошибка добавления', 'danger');
    }
}

function saveLogo() {
    const logoUrl = document.getElementById('logoUrl').value.trim();
    if (logoUrl) {
        localStorage.setItem('customLogo', logoUrl);
        loadLogo();
        showNotification('✅ Логотип сохранён!', 'success');
    } else {
        localStorage.removeItem('customLogo');
        loadLogo();
        showNotification('✅ Логотип сброшен', 'success');
    }
}

function loadLogo() {
    const logoUrl = localStorage.getItem('customLogo');
    const logoElements = document.querySelectorAll('.logo-text');
    if (logoUrl) {
        logoElements.forEach(el => {
            el.style.display = 'none';
            const imgContainer = el.parentElement;
            if (imgContainer && !imgContainer.querySelector('.custom-logo-img')) {
                const imgEl = document.createElement('img');
                imgEl.className = 'custom-logo-img';
                imgEl.style.cssText = 'width:50px;height:50px;border-radius:50%;object-fit:cover;';
                imgEl.src = logoUrl;
                imgContainer.insertBefore(imgEl, el);
            }
        });
    } else {
        logoElements.forEach(el => el.style.display = 'flex');
    }
}

function clearCache() {
    if (!confirm('Вы уверены?')) return;
    localStorage.removeItem('newsData');
    localStorage.removeItem('lastUpdate');
    localStorage.removeItem('customLogo');
    showNotification('✅ Кэш очищен!', 'success');
    setTimeout(() => location.reload(), 1000);
}

function showNotification(message, type = 'info') {
    document.querySelectorAll('.app-notification').forEach(el => el.remove());
    const notification = document.createElement('div');
    notification.className = 'app-notification';
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        animation: slideInDown 0.3s ease;
    `;
    notification.innerHTML = `
        <span>${message}</span>
        <button type="button" class="btn-close" style="margin-left:1rem;" onclick="this.parentElement.remove()"></button>
    `;
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}