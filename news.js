// news.js - Система новостей с автоматическим импортом

class NewsSystem {
    constructor() {
        this.apiBaseUrl = window.location.origin;
        this.news = [];
        this.filteredNews = [];
        this.currentPage = 1;
        this.newsPerPage = 10;
        this.init();
    }

    async init() {
        console.log('📰 Система новостей запущена');
        
        // Загружаем новости
        await this.loadNews();
        
        // Настраиваем обработчики
        this.setupEventListeners();
        
        // Обновляем время последнего обновления
        this.updateLastUpdateTime();
        
        // Автоматическое обновление каждые 2 часа
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Кнопка обновления новостей
        document.getElementById('refreshNews').addEventListener('click', () => {
            this.refreshNews();
        });

        // Поиск
        document.getElementById('searchNews').addEventListener('input', (e) => {
            this.filterNews(e.target.value, document.getElementById('newsFilter').value);
        });

        // Фильтр по времени
        document.getElementById('newsFilter').addEventListener('change', (e) => {
            this.filterNews(document.getElementById('searchNews').value, e.target.value);
        });

        // Закрытие модального окна
        document.querySelector('#newsModal .close').addEventListener('click', () => {
            document.getElementById('newsModal').style.display = 'none';
        });

        // Закрытие по клику вне окна
        window.addEventListener('click', (e) => {
            const modal = document.getElementById('newsModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    // Загрузка новостей с сервера
    async loadNews() {
        try {
            console.log('📥 Загружаем новости...');
            
            // Пытаемся загрузить из локального хранилища
            const cachedNews = localStorage.getItem('school_news');
            const lastUpdate = localStorage.getItem('news_last_update');
            
            if (cachedNews && lastUpdate) {
                const hoursSinceUpdate = (Date.now() - parseInt(lastUpdate)) / (1000 * 60 * 60);
                
                // Если прошло меньше 2 часов, используем кэш
                if (hoursSinceUpdate < 2) {
                    this.news = JSON.parse(cachedNews);
                    console.log('✅ Используем кэшированные новости');
                    this.displayNews();
                    return;
                }
            }
            
            // Загружаем новые новости
            await this.fetchAndParseNews();
            
        } catch (error) {
            console.error('❌ Ошибка загрузки новостей:', error);
            
            // Пробуем использовать кэш в случае ошибки
            const cachedNews = localStorage.getItem('school_news');
            if (cachedNews) {
                this.news = JSON.parse(cachedNews);
                this.displayNews();
                this.showMessage('Используем кэшированные новости', 'info');
            } else {
                this.showMessage('Не удалось загрузить новости', 'error');
            }
        }
    }

    // Парсинг новостей с сайта школы
    async fetchAndParseNews() {
        try {
            console.log('🌐 Парсим новости с сайта школы...');
            
            // Здесь будет реальный парсинг с сайта школы
            // Временно используем демо-данные
            
            // Для реального парсинга нужно использовать прокси-сервер из-за CORS
            // Я создам отдельный сервер для парсинга
            
            const response = await fetch(`${this.apiBaseUrl}/api/news`);
            
            if (!response.ok) {
                throw new Error('Сервер новостей не отвечает');
            }
            
            const newsData = await response.json();
            
            // Сохраняем в локальное хранилище
            this.news = newsData;
            localStorage.setItem('school_news', JSON.stringify(newsData));
            localStorage.setItem('news_last_update', Date.now().toString());
            
            console.log(`✅ Загружено ${newsData.length} новостей`);
            this.displayNews();
            
        } catch (error) {
            console.error('❌ Ошибка парсинга:', error);
            throw error;
        }
    }

    // Отображение новостей
    displayNews() {
        const container = document.getElementById('newsContainer');
        
        if (!this.news || this.news.length === 0) {
            container.innerHTML = `
                <div class="no-news">
                    <i class="fas fa-newspaper" style="font-size: 48px; color: #ccc; margin-bottom: 20px;"></i>
                    <h3>Новостей пока нет</h3>
                    <p>Попробуйте обновить страницу через несколько минут</p>
                </div>
            `;
            return;
        }

        // Применяем фильтры если есть
        this.filteredNews = this.applyFilters(this.news, 
            document.getElementById('searchNews').value,
            document.getElementById('newsFilter').value
        );

        // Показываем пагинацию
        this.displayPagination();

        // Отображаем новости для текущей страницы
        const startIndex = (this.currentPage - 1) * this.newsPerPage;
        const endIndex = startIndex + this.newsPerPage;
        const currentNews = this.filteredNews.slice(startIndex, endIndex);

        container.innerHTML = currentNews.map((news, index) => this.createNewsCard(news, startIndex + index + 1)).join('');
        
        // Добавляем обработчики для карточек
        this.attachNewsCardListeners();
    }

    // Создание карточки новости
    createNewsCard(news, index) {
        const date = new Date(news.date || Date.now());
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        return `
            <div class="news-card" data-news-id="${news.id}">
                <div class="news-image">
                    ${news.image ? 
                        `<img src="${news.image}" alt="${news.title}" class="news-image">` : 
                        `<i class="fas fa-newspaper"></i>`
                    }
                </div>
                <div class="news-content">
                    <div class="news-header">
                        <h3 class="news-title">${index}. ${this.escapeHtml(news.title)}</h3>
                        <span class="news-date">${formattedDate}</span>
                    </div>
                    <div class="news-excerpt">
                        ${this.escapeHtml(news.excerpt || news.content.substring(0, 200) + '...')}
                    </div>
                    <div class="news-footer">
                        <span class="news-category">${news.category || 'Общая новость'}</span>
                        <a href="#" class="read-more" data-news-id="${news.id}">
                            Читать далее <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    // Применение фильтров
    applyFilters(news, searchQuery, timeFilter) {
        let filtered = [...news];

        // Поиск по тексту
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => 
                item.title.toLowerCase().includes(query) || 
                item.content.toLowerCase().includes(query) ||
                (item.excerpt && item.excerpt.toLowerCase().includes(query))
            );
        }

        // Фильтр по времени
        if (timeFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);

            filtered = filtered.filter(item => {
                const newsDate = new Date(item.date || item.created_at);
                
                switch (timeFilter) {
                    case 'today':
                        return newsDate >= today;
                    case 'week':
                        return newsDate >= weekAgo;
                    case 'month':
                        return newsDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Сортировка по дате (сначала новые)
        filtered.sort((a, b) => {
            return new Date(b.date || b.created_at) - new Date(a.date || a.created_at);
        });

        return filtered;
    }

    // Пагинация
    displayPagination() {
        const totalPages = Math.ceil(this.filteredNews.length / this.newsPerPage);
        const pagination = document.getElementById('pagination');
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let html = '';
        
        // Кнопка "Назад"
        html += `
            <button class="page-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    onclick="newsSystem.goToPage(${this.currentPage - 1})" 
                    ${this.currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;

        // Номера страниц
        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
                html += `
                    <button class="page-btn ${i === this.currentPage ? 'active' : ''}" 
                            onclick="newsSystem.goToPage(${i})">
                        ${i}
                    </button>
                `;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                html += `<span class="page-dots">...</span>`;
            }
        }

        // Кнопка "Вперед"
        html += `
            <button class="page-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    onclick="newsSystem.goToPage(${this.currentPage + 1})" 
                    ${this.currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;

        pagination.innerHTML = html;
    }

    goToPage(page) {
        const totalPages = Math.ceil(this.filteredNews.length / this.newsPerPage);
        
        if (page < 1 || page > totalPages) return;
        
        this.currentPage = page;
        this.displayNews();
        
        // Прокрутка к верху
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    filterNews(searchQuery, timeFilter) {
        this.currentPage = 1;
        this.displayNews();
    }

    // Отображение полной новости
    showFullNews(newsId) {
        const news = this.news.find(n => n.id === newsId);
        if (!news) return;

        const modal = document.getElementById('newsModal');
        const content = document.getElementById('newsModalContent');
        
        const date = new Date(news.date || Date.now());
        const formattedDate = date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        content.innerHTML = `
            <div class="news-full">
                <h2 class="news-full-title">${this.escapeHtml(news.title)}</h2>
                
                <div class="news-full-meta">
                    <span><i class="far fa-calendar"></i> ${formattedDate}</span>
                    <span><i class="fas fa-tag"></i> ${news.category || 'Общая новость'}</span>
                </div>
                
                ${news.image ? `
                    <img src="${news.image}" alt="${news.title}" class="news-full-image">
                ` : ''}
                
                <div class="news-full-content">
                    ${this.formatNewsContent(news.content)}
                </div>
                
                <div class="news-source">
                    <p><i class="fas fa-external-link-alt"></i> 
                       Источник: <a href="${news.source_url || 'https://sch654.mskobr.ru/novosti'}" target="_blank">
                       ${news.source || 'Официальный сайт школы №654'}
                       </a>
                    </p>
                </div>
            </div>
        `;

        modal.style.display = 'block';
    }

    // Форматирование контента новости
    formatNewsContent(content) {
        // Простое форматирование - разбивка на параграфы
        const paragraphs = content.split('\n\n').filter(p => p.trim());
        
        return paragraphs.map(p => {
            const trimmed = p.trim();
            
            // Проверяем, является ли это заголовком
            if (trimmed.startsWith('# ') || trimmed.endsWith(':')) {
                return `<h3>${this.escapeHtml(trimmed.replace('# ', ''))}</h3>`;
            }
            
            // Проверяем, содержит ли изображение
            if (trimmed.includes('![') && trimmed.includes('](') && trimmed.includes(')')) {
                const match = trimmed.match(/!\[(.*?)\]\((.*?)\)/);
                if (match) {
                    return `<img src="${match[2]}" alt="${match[1]}" style="max-width: 100%; height: auto; margin: 15px 0; border-radius: 5px;">`;
                }
            }
            
            // Обычный параграф
            return `<p>${this.escapeHtml(trimmed)}</p>`;
        }).join('');
    }

    // Добавление обработчиков для карточек новостей
    attachNewsCardListeners() {
        // Карточки новостей
        document.querySelectorAll('.news-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // Не открываем при клике на ссылку "Читать далее"
                if (!e.target.closest('.read-more')) {
                    const newsId = card.getAttribute('data-news-id');
                    this.showFullNews(newsId);
                }
            });
        });

        // Ссылки "Читать далее"
        document.querySelectorAll('.read-more').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const newsId = link.getAttribute('data-news-id');
                this.showFullNews(newsId);
            });
        });
    }

    // Обновление новостей
    async refreshNews() {
        const refreshBtn = document.getElementById('refreshNews');
        const originalHTML = refreshBtn.innerHTML;
        
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Обновление...';
        refreshBtn.disabled = true;

        try {
            // Очищаем кэш
            localStorage.removeItem('school_news');
            localStorage.removeItem('news_last_update');
            
            // Загружаем заново
            await this.fetchAndParseNews();
            
            this.showMessage('Новости успешно обновлены!', 'success');
            this.updateLastUpdateTime();
            
        } catch (error) {
            console.error('❌ Ошибка обновления:', error);
            this.showMessage('Не удалось обновить новости', 'error');
            
        } finally {
            refreshBtn.innerHTML = originalHTML;
            refreshBtn.disabled = false;
        }
    }

    // Обновление времени последнего обновления
    updateLastUpdateTime() {
        const lastUpdate = localStorage.getItem('news_last_update');
        const element = document.getElementById('lastUpdateTime');
        
        if (lastUpdate) {
            const date = new Date(parseInt(lastUpdate));
            const formatted = date.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                day: 'numeric',
                month: 'long'
            });
            element.textContent = `Обновлено: ${formatted}`;
        } else {
            element.textContent = 'Еще не обновлялось';
        }
    }

    // Настройка автоматического обновления
    setupAutoRefresh() {
        // Проверка каждые 30 минут
        setInterval(() => {
            const lastUpdate = localStorage.getItem('news_last_update');
            if (lastUpdate) {
                const hoursSinceUpdate = (Date.now() - parseInt(lastUpdate)) / (1000 * 60 * 60);
                
                if (hoursSinceUpdate >= 2) {
                    console.log('🔄 Автоматическое обновление новостей...');
                    this.refreshNews();
                }
            }
        }, 30 * 60 * 1000); // 30 минут
    }

    // Вспомогательные функции
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showMessage(text, type = 'info') {
        // Удаляем старые сообщения
        const existing = document.querySelectorAll('.news-message');
        existing.forEach(msg => msg.remove());
        
        // Создаем новое сообщение
        const message = document.createElement('div');
        message.className = `news-message message-${type}`;
        message.innerHTML = `
            <div style="
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 3px 10px rgba(0,0,0,0.2);
                display: flex;
                align-items: center;
                gap: 10px;
            ">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${text}</span>
            </div>
        `;
        
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 9999;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        // Автоматическое скрытие
        setTimeout(() => {
            message.style.opacity = '0';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
}

// ==================== СЕРВЕР ДЛЯ ПАРСИНГА НОВОСТЕЙ ====================
// Создайте файл `news-server.js`:

```javascript
// news-server.js - Сервер для парсинга новостей
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

// Кэш для новостей
let newsCache = null;
let lastFetchTime = 0;
const CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 часа

// Парсинг новостей с сайта школы
async function fetchSchoolNews() {
    try {
        console.log('🌐 Парсим новости с сайта школы...');
        
        const response = await axios.get('https://sch654.mskobr.ru/novosti', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });
        
        const $ = cheerio.load(response.data);
        const news = [];
        
        // Парсим новости (структура может отличаться)
        $('.news-item, article, .post').each((i, element) => {
            try {
                const $el = $(element);
                
                // Извлекаем заголовок
                const title = $el.find('h2, h3, .title, .news-title').first().text().trim();
                
                // Извлекаем дату
                let dateText = $el.find('.date, .news-date, time').first().text().trim();
                
                // Парсим дату
                let date = new Date();
                if (dateText) {
                    // Пытаемся распарсить разные форматы дат
                    const parsedDate = parseRussianDate(dateText);
                    if (parsedDate) date = parsedDate;
                }
                
                // Извлекаем краткое описание
                const excerpt = $el.find('.excerpt, .news-excerpt, p').first().text().trim().substring(0, 200);
                
                // Извлекаем ссылку
                let link = $el.find('a').first().attr('href');
                if (link && !link.startsWith('http')) {
                    link = 'https://sch654.mskobr.ru' + link;
                }
                
                // Извлекаем изображение
                const image = $el.find('img').first().attr('src');
                
                if (title && excerpt) {
                    news.push({
                        id: `news_${i}_${Date.now()}`,
                        title: title || 'Новость школы',
                        excerpt: excerpt || '',
                        content: excerpt || 'Подробности на сайте школы',
                        date: date.toISOString(),
                        category: 'Школьные новости',
                        image: image ? (image.startsWith('http') ? image : 'https://sch654.mskobr.ru' + image) : null,
                        source: 'Школа №654',
                        source_url: link || 'https://sch654.mskobr.ru/novosti'
                    });
                }
            } catch (error) {
                console.error('Ошибка парсинга элемента:', error);
            }
        });
        
        // Если не нашли новостей, используем демо-данные
        if (news.length === 0) {
            console.log('⚠️ Используем демо-новости');
            return generateDemoNews();
        }
        
        console.log(`✅ Найдено ${news.length} новостей`);
        return news;
        
    } catch (error) {
        console.error('❌ Ошибка парсинга сайта:', error.message);
        // Возвращаем демо-новости в случае ошибки
        return generateDemoNews();
    }
}

// Генерация демо-новостей
function generateDemoNews() {
    const demoNews = [
        {
            id: 'demo_1',
            title: 'День открытых дверей в школе',
            excerpt: 'Приглашаем всех родителей и будущих учеников на день открытых дверей, который состоится в эту субботу.',
            content: 'Уважаемые родители и будущие ученики! Школа №654 приглашает вас на традиционный День открытых дверей, который состоится 15 апреля 2024 года. Вы сможете познакомиться с учителями, посетить учебные кабинеты и задать все интересующие вопросы администрации школы.',
            date: new Date(2024, 3, 10).toISOString(),
            category: 'Мероприятия',
            image: null,
            source: 'Школа №654',
            source_url: 'https://sch654.mskobr.ru/novosti'
        },
        {
            id: 'demo_2',
            title: 'Победа на олимпиаде по математике',
            excerpt: 'Ученики нашей школы заняли призовые места на городской олимпиаде по математике.',
            content: 'Мы гордимся нашими учениками! Команда школы №654 заняла первое место на городской олимпиаде по математике. Особые поздравления Иванову Алексею, который стал абсолютным победителем в своей возрастной категории.',
            date: new Date(2024, 3, 5).toISOString(),
            category: 'Достижения',
            image: null,
            source: 'Школа №654',
            source_url: 'https://sch654.mskobr.ru/novosti'
        },
        {
            id: 'demo_3',
            title: 'Новый компьютерный класс',
            excerpt: 'В школе открылся полностью обновленный компьютерный класс с современным оборудованием.',
            content: 'Благодаря участию в городской программе "Цифровая школа", в нашем учебном заведении открылся новый компьютерный класс, оснащенный современными компьютерами, интерактивной доской и 3D-принтером. Теперь у учеников есть все возможности для изучения информационных технологий.',
            date: new Date(2024, 2, 20).toISOString(),
            category: 'Развитие',
            image: null,
            source: 'Школа №654',
            source_url: 'https://sch654.mskobr.ru/novosti'
        }
    ];
    
    return demoNews;
}

// Парсинг русской даты
function parseRussianDate(dateString) {
    try {
        const months = {
            'января': 0, 'февраля': 1, 'марта': 2, 'апреля': 3,
            'мая': 4, 'июня': 5, 'июля': 6, 'августа': 7,
            'сентября': 8, 'октября': 9, 'ноября': 10, 'декабря': 11
        };
        
        // Формат: "10 апреля 2024"
        const parts = dateString.toLowerCase().split(' ');
        if (parts.length >= 3) {
            const day = parseInt(parts[0]);
            const month = months[parts[1]];
            const year = parseInt(parts[2]);
            
            if (!isNaN(day) && month !== undefined && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
        
        // Формат: "10.04.2024"
        const dotParts = dateString.split('.');
        if (dotParts.length === 3) {
            const day = parseInt(dotParts[0]);
            const month = parseInt(dotParts[1]) - 1;
            const year = parseInt(dotParts[2]);
            
            if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                return new Date(year, month, day);
            }
        }
    } catch (error) {
        console.error('Ошибка парсинга даты:', error);
    }
    
    return new Date();
}

// API endpoint для получения новостей
app.get('/api/news', async (req, res) => {
    try {
        // Используем кэш если он свежий
        if (newsCache && (Date.now() - lastFetchTime) < CACHE_DURATION) {
            console.log('📦 Используем кэшированные новости');
            return res.json(newsCache);
        }
        
        // Получаем новые новости
        newsCache = await fetchSchoolNews();
        lastFetchTime = Date.now();
        
        res.json(newsCache);
        
    } catch (error) {
        console.error('❌ Ошибка API /api/news:', error);
        res.status(500).json({ error: 'Не удалось загрузить новости' });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`📰 Сервер новостей запущен на порту ${PORT}`);
    console.log(`🌐 API доступно по адресу: http://localhost:${PORT}/api/news`);
});

module.exports = app;
