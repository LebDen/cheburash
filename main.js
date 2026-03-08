document.addEventListener('DOMContentLoaded', () => {
    const tg = window.Telegram.WebApp;
    const parser = typeof RSSParser !== 'undefined' ? new RSSParser(CONFIG.PARSER) : null;
    
    // Обновление времени
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'});

    // Загрузка превью новостей (только заголовки для дайджеста)
    async function loadPreview() {
        const container = document.getElementById('newsPreview');
        if (!parser) {
            container.innerHTML = '<div class="loading-sm">Модуль новостей отключен</div>';
            return;
        }

        try {
            // Грузим по 1 новости из каждой категории для превью
            const allNews = [];
            for (const cat of ['world', 'russia', 'svo']) {
                const items = await parser.fetchCategory(cat);
                if(items.length) allNews.push(items[0]);
            }
            
            // Сортируем по времени
            allNews.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
            
            if (allNews.length === 0) {
                container.innerHTML = '<div class="loading-sm">Нет свежих данных</div>';
                return;
            }

            container.innerHTML = allNews.slice(0, 3).map(item => `
                <div class="news-item-mini">
                    <strong>${item.category === 'world' ? '🌍 МИР' : item.category === 'russia' ? '🇷🇺 РФ' : '⚔️ СВО'}</strong>
                    ${item.title}
                </div>
            `).join('');
            
            // Сохраняем для дайджеста
            window.currentNewsCache = allNews;

        } catch (e) {
            console.error(e);
            container.innerHTML = '<div class="loading-sm">Ошибка загрузки</div>';
        }
    }

    loadPreview();

    // Логика скачивания
    document.getElementById('downloadDigestBtn').addEventListener('click', () => {
        if(tg.HapticFeedback) tg.HapticFeedback.notificationOccurred('success');
        
        const news = window.currentNewsCache || [];
        const date = new Date().toLocaleDateString('ru-RU');
        
        let content = `📂 ДАЙДЖЕСТ ЧБ | ${date}\n\n`;
        content += `Статус: Система в норме\n`;
        content += `Игры доступны: 2\n\n`;
        content += `─ ПОСЛЕДНИЕ СОБЫТИЯ ─\n\n`;
        
        if(news.length === 0) content += "Нет новых данных.\n";
        
        news.forEach((item, i) => {
            const icon = item.category === 'world' ? '🌍' : item.category === 'russia' ? '🇷🇺' : '⚔️';
            content += `${i+1}. ${icon} ${item.title}\n   🔗 ${item.link}\n\n`;
        });
        
        content += `\n🤖 Бот: @CheburashNEWS_bot`;

        // Создаем файл
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `CHB_Digest_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // Показываем нативное уведомление Telegram (если доступно)
        tg.showAlert({
            title: 'Готово!',
            message: 'Файл дайджеста загружен в устройство.',
            buttons: [{type: 'ok'}]
        });
    });
});
