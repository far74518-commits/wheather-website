// frontend/client/client.js – Ultra Modern Commercial Weather Dashboard Engine for Pakistan


    // ─── STATE MANAGEMENT ─────────────────────────────────────────
    let currentCityData = null;
    let currentUnit = localStorage.getItem('weatherUnit') || 'C'; // 'C', 'F', 'K'
    let currentLang = localStorage.getItem('weatherLang') || 'en'; // 'en', 'ur'
    let currentTheme = localStorage.getItem('weatherTheme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
    let pinnedCities = JSON.parse(localStorage.getItem('pinnedCities') || '[]');
    let pkCitiesDataCache = JSON.parse(localStorage.getItem('pkCitiesCache') || '{}');
    
    let isAmbiencePlaying = false;
    let audioCtx = null;
    let rainGainNode = null;
    
    let integratedMap = null;
    let integratedRadarLayer = null;
    let integratedCityMarker = null;
    let currentIntegratedLayer = 'precipitation';

    let modalMap = null;
    let modalRadarLayer = null;
    let modalCityMarker = null;

    let searchTimer = null;

    // ─── 🇵🇰 14 POPULAR PAKISTANI CITIES CONFIG ────────────────────
    const PAKISTAN_CITIES = [
        { name: 'Islamabad', nameUr: 'اسلام آباد', lat: 33.6844, lng: 73.0479 },
        { name: 'Lahore', nameUr: 'لاہور', lat: 31.5204, lng: 74.3587 },
        { name: 'Karachi', nameUr: 'کراچی', lat: 24.8607, lng: 67.0011 },
        { name: 'Rawalpindi', nameUr: 'راولپنڈی', lat: 33.5651, lng: 73.0169 },
        { name: 'Peshawar', nameUr: 'پشاور', lat: 34.0151, lng: 71.5249 },
        { name: 'Quetta', nameUr: 'کوئٹہ', lat: 30.1798, lng: 66.9750 },
        { name: 'Multan', nameUr: 'ملتان', lat: 30.1575, lng: 71.5249 },
        { name: 'Faisalabad', nameUr: 'فیصل آباد', lat: 31.4504, lng: 73.1350 },
        { name: 'Hyderabad', nameUr: 'حیدرآباد', lat: 25.3960, lng: 68.3578 },
        { name: 'Gwadar', nameUr: 'گوادر', lat: 25.1264, lng: 62.3225 },
        { name: 'Murree', nameUr: 'مری', lat: 33.9070, lng: 73.3903 },
        { name: 'Sukkur', nameUr: 'سکھر', lat: 27.7052, lng: 68.8574 },
        { name: 'Nawabshah', nameUr: 'نواب شاہ', lat: 26.2483, lng: 68.4096 },
        { name: 'Bahawalpur', nameUr: 'بہاولپور', lat: 29.3956, lng: 71.6836 },
    ];

    // ─── URDU TRANSLATION DICTIONARY ──────────────────────────────
    const URDU_DICT = {
        lblLiveBadge: 'لائیو',
        lblHighlightsTitle: 'آج کی اہم تفصیلات',
        lblPopularCities: 'پاکستان کے مقبول شہر',
        lblLiveUpdatesBadge: 'تازہ ترین ڈیٹا',
        lblInsightsTitle: 'موسمی تجاویز اور لائف اسٹائل',
        lblFeelsLike: 'محسوس درجہ حرارت',
        lblHumidity: 'نمی',
        lblVisibility: 'بصارت (دید)',
        lblSunTracker: 'سورج کا وقت',
        lblSunrise: 'طلوعِ آفتاب',
        lblSunset: 'غروبِ آفتاب',
        lblFavoritesTitle: 'پسندیدہ اور محفوظ شہر',
        lblHourlyTitle: '48 گھنٹے کی پیشین گوئی',
        lblDailyTitle: '7 دن کی پیشین گوئی',
        lblAqiTitle: 'ایئر کوالٹی اور سموگ (AQI)',
        lblWindTitle: 'ہوا کی رفتار',
        lblUvTitle: 'یو وی انڈیکس (UV)',
        lblIntegratedMapTitle: 'موسمی حالات کا نقشہ',
        lblModalMapTitle: 'لائیو تعامل پذیر ریڈار میپ',
        lblReadBtn: 'سنیں',
        lblRadarBtn: 'لائیو ریڈار',
        lblNamazTitle: 'نماز کے اوقات',
        lblComfortTitle: 'لائیو کمفرٹ انڈیکس',
        lblTipsTitle: 'پاکستانی موسمی رہنمائی',
        searchPlaceholder: 'پاکستان یا دنیا بھر کے شہر تلاش کریں (مثلاً اسلام آباد، لاہور)...',

        conditions: {
            'clear sky': 'صاف آسمان',
            'few clouds': 'تھوڑے بادل',
            'scattered clouds': 'بکھرے ہوئے بادل',
            'broken clouds': 'ٹوٹے ہوئے بادل',
            'overcast clouds': 'ابر آلود',
            'light rain': 'ہلکی بارش',
            'moderate rain': 'معتدل بارش',
            'heavy intensity rain': 'تیز بارش',
            'very heavy rain': 'شدید ترین بارش',
            'thunderstorm': 'گرج چمک کے ساتھ بارش',
            'thunderstorm with rain': 'گرج چمک اور بارش',
            'snow': 'برف باری',
            'light snow': 'ہلکی برف باری',
            'mist': 'دھند',
            'fog': 'شدید دھند',
            'haze': 'غبار / سموگ',
            'dust': 'گرد آلود ہوا',
            'sand': 'ریتلا طوفان',
        },

        aqi: {
            1: 'بہترین ہوا (Good)',
            2: 'مناسب ہوا (Fair)',
            3: 'متوسط آلودگی (Moderate)',
            4: 'غیر صحت بخش (Poor / Smog)',
            5: 'شدید مضرِ صحت (Hazardous Smog)'
        },

        aqiHealth: {
            1: 'ہوا صاف ہے۔ تمام سرگرمیوں کے لیے بہترین۔',
            2: 'ہوا کا معیار مناسب ہے۔',
            3: 'حساس افراد باہر کا وقت کم کریں۔',
            4: 'سموگ موجود ہے۔ باہر نکلتے ہوئے ماسک استعمال کریں۔',
            5: 'شدید سموگ کی لہر! غیر ضروری باہر نکلنے سے گریز کریں۔'
        }
    };

    // ─── DOM REFS ──────────────────────────────────────────────────
    const htmlRoot       = document.getElementById('htmlRoot');
    const searchInput    = document.getElementById('searchInput');
    const clearBtn       = document.getElementById('clearBtn');
    const geoBtn         = document.getElementById('geoBtn');
    const suggestions    = document.getElementById('suggestions');
    const loaderScreen   = document.getElementById('loaderScreen');
    const loaderText     = document.getElementById('loaderText');
    const loaderIcon     = document.getElementById('loaderIcon');
    const alertBanner    = document.getElementById('weatherAlertBanner');
    const alertText      = document.getElementById('alertText');
    const closeAlertBtn  = document.getElementById('closeAlertBtn');
    const pinCityBtn     = document.getElementById('pinCityBtn');
    const pinStarIcon    = document.getElementById('pinStarIcon');
    const speakBtn       = document.getElementById('speakWeatherBtn');
    const ambienceBtn    = document.getElementById('ambienceBtn');
    const ambienceLabel  = document.getElementById('ambienceLabel');
    const openRadarBtn   = document.getElementById('openRadarBtn');
    const radarModal     = document.getElementById('radarModal');
    const closeRadarBtn  = document.getElementById('closeRadarBtn');
    const langToggleBtn  = document.getElementById('langToggleBtn');
    const langLabel      = document.getElementById('langLabel');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const themeIcon      = document.getElementById('themeIcon');
    const expandMapBtn   = document.getElementById('expandMapBtn');
    const heroSearchTrigger = document.getElementById('heroSearchTrigger');

    // ─── EMOJI MAP ────────────────────────────────────────────────
    function owmEmoji(icon) {
        const map = {
            '01d': '☀️',  '01n': '🌙',
            '02d': '🌤️', '02n': '🌤️',
            '03d': '⛅',  '03n': '⛅',
            '04d': '☁️',  '04n': '☁️',
            '09d': '🌦️', '09n': '🌦️',
            '10d': '🌧️', '10n': '🌧️',
            '11d': '⛈️',  '11n': '⛈️',
            '13d': '🌨️', '13n': '🌨️',
            '50d': '🌫️', '50n': '🌫️',
        };
        return map[icon] || '🌡️';
    }

    // ─── THEME MAP ────────────────────────────────────────────────
    function owmTheme(id) {
        if (id >= 200 && id < 300) return 'theme-stormy';
        if (id >= 300 && id < 400) return 'theme-rainy';
        if (id >= 500 && id < 600) return 'theme-rainy';
        if (id >= 600 && id < 700) return 'theme-snowy';
        if (id >= 700 && id < 800) return 'theme-foggy';
        if (id === 800)             return 'theme-sunny';
        if (id > 800)               return 'theme-cloudy';
        return 'theme-dark-dashboard';
    }

    // ─── UNIT CONVERTERS ──────────────────────────────────────────
    function formatTemp(celsius) {
        if (celsius === undefined || celsius === null || isNaN(celsius)) return '--°';
        if (currentUnit === 'F') return `${Math.round((celsius * 9/5) + 32)}°F`;
        if (currentUnit === 'K') return `${Math.round(celsius + 273.15)}K`;
        return `${Math.round(celsius)}°C`;
    }

    function formatWind(speedMps) {
        if (!speedMps) return '--';
        const kmh = speedMps * 3.6;
        if (currentUnit === 'F') return (kmh * 0.621371).toFixed(2);
        return kmh.toFixed(2);
    }

    function getWindUnitLabel() {
        return currentUnit === 'F' ? 'mph' : 'km/h';
    }

    // ─── DATE / TIME HELPERS ──────────────────────────────────────
    const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const DAYS_FULL_EN = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const DAYS_UR = ['اتوار','پیر','منگل','بدھ','جمعرات','جمعہ','ہفتہ'];
    const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const MONTHS_FULL_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const MONTHS_UR = ['جنوری','فروری','مارچ','اپریل','مئی','جون','جولائی','اگست','ستمبر','اکتوبر','نومبر','دسمبر'];

    function fmt12h(unixSec, tz) {
        const d = new Date((unixSec + tz) * 1000);
        let h = d.getUTCHours(), m = d.getUTCMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
    }

    function fmtHour(unixSec, tz) {
        const d = new Date((unixSec + tz) * 1000);
        let h = d.getUTCHours(), ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h} ${ampm}`;
    }

    function nowLocalTime(tz) {
        const d = new Date((Date.now() / 1000 + tz) * 1000);
        let h = d.getUTCHours(), m = d.getUTCMinutes();
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12 || 12;
        return `${h}:${String(m).padStart(2,'0')} ${ampm}`;
    }

    function nowLocalDate(tz) {
        const d = new Date((Date.now() / 1000 + tz) * 1000);
        if (currentLang === 'ur') {
            return `${DAYS_UR[d.getUTCDay()]}، ${d.getUTCDate()} ${MONTHS_UR[d.getUTCMonth()]}`;
        }
        return `${d.getUTCDate()} ${MONTHS_FULL_EN[d.getUTCMonth()]}, ${d.getUTCFullYear()}`;
    }

    function sunProgress(sunrise, sunset) {
        const now = Date.now() / 1000;
        if (now < sunrise || now > sunset) return null;
        return ((now - sunrise) / (sunset - sunrise)) * 100;
    }

    // ─── INITIALIZATION ───────────────────────────────────────────
    async function init() {
        setupLanguageToggle();
        setupThemeToggle();
        setupUnitButtons();
        setupSidebarNav();

        applyLanguage(currentLang);
        applyTheme(currentTheme);

        showLoader(currentLang === 'ur' ? 'موسمی ڈیٹا لوڈ ہو رہا ہے...' : 'Loading weather platform...', '🌏');

        try {
            // Load backend custom settings
            try {
                if (window.apiConfig?.getSettings) {
                    const setRes = await fetch(window.apiConfig.getSettings);
                    const setData = await setRes.json();
                    if (setData.status === 'success' && setData.data) {
                        if (setData.data.owm_api_key) window.OWM_KEY = setData.data.owm_api_key;
                        if (setData.data.custom_alert) {
                            showAlertBanner(`🚨 Admin Warning: ${setData.data.custom_alert}`);
                        }
                    }
                }
            } catch(e) { console.warn('Settings fetch error', e); }

            // Load saved/favorite cities from DB
            try {
                if (window.apiConfig?.getCities) {
                    const res  = await fetch(window.apiConfig.getCities);
                    const data = await res.json();
                    if (data.status === 'success' && data.data && data.data.length > 0) {
                        renderSavedCities(data.data);
                    } else {
                        renderSavedCities([]);
                    }
                } else {
                    renderSavedCities([]);
                }
            } catch(e) { renderSavedCities([]); }

            // Initialize Tips
            if (typeof initWeatherTips === 'function') {
                initWeatherTips();
            }

            // Render 14 Popular Pakistan Cities Cards
            fetchAndRenderPakistanQuickCities();

            // Default City (Last Searched / Auto Location / Islamabad)
            let defaultCity = { name: 'Islamabad', lat: 33.6844, lng: 73.0479 };
            let savedLoc = localStorage.getItem('lastLocation');
            
            if (savedLoc) {
                try {
                    defaultCity = JSON.parse(savedLoc);
                } catch(e){}
            } else {
                // AUTO GEOLOCATION VIA IP-API
                try {
                    const ipRes  = await fetch('https://ip-api.com/json/?fields=status,city,lat,lon');
                    const ipData = await ipRes.json();
                    if (ipData.status === 'success' && ipData.lat && ipData.lon) {
                        defaultCity = { name: ipData.city, lat: ipData.lat, lng: ipData.lon };
                    }
                } catch (e) { console.warn('IP Geo fallback used.'); }
            }

            showCity(defaultCity);
        } catch(e) {
            console.warn('Initialization fallback to Islamabad.', e);
            try {
                if (typeof showCity === 'function') {
                    showCity({ name: 'Islamabad', lat: 33.6844, lng: 73.0479 });
                } else {
                    const heroCondEl = document.getElementById('heroCondition');
                    if (heroCondEl) heroCondEl.textContent = 'Critical Error: showCity is not defined (SyntaxError in client-part2.js?)';
                    const heroDescEl = document.getElementById('heroDesc');
                    if (heroDescEl) heroDescEl.textContent = e.stack || e.toString();
                }
            } catch (err2) {
                const heroCondEl = document.getElementById('heroCondition');
                if (heroCondEl) heroCondEl.textContent = 'Critical Error in init fallback: ' + err2.message;
            }
        }
    }

    // ─── SIDEBAR NAVIGATION HANDLER ───────────────────────────────
    function setupSidebarNav() {
        document.querySelectorAll('.nav-rail-item').forEach(item => {
            item.addEventListener('click', () => {
                const tab = item.getAttribute('data-tab');
                if (!tab) return;
                document.querySelectorAll('.nav-rail-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                if (tab === 'dashboard') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (tab === 'map') {
                    document.getElementById('weatherMapSection')?.scrollIntoView({ behavior: 'smooth' });
                } else if (tab === 'locations') {
                    document.getElementById('pkCitiesSection')?.scrollIntoView({ behavior: 'smooth' });
                } else if (tab === 'aqi') {
                    document.getElementById('hourlySection')?.scrollIntoView({ behavior: 'smooth' });
                } else if (tab === 'forecast') {
                    document.getElementById('forecastSection')?.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });

        if (heroSearchTrigger) {
            heroSearchTrigger.addEventListener('click', () => {
                if (searchInput) {
                    searchInput.focus();
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            });
        }
    }

    // ─── BILINGUAL LANGUAGE SWITCHER ──────────────────────────────
    function setupLanguageToggle() {
        if (langToggleBtn) {
            langToggleBtn.addEventListener('click', () => {
                currentLang = currentLang === 'en' ? 'ur' : 'en';
                localStorage.setItem('weatherLang', currentLang);
                applyLanguage(currentLang);
                if (currentCityData) renderWeatherData(currentCityData);
                renderPakistanQuickCitiesCards();
            });
        }
    }

    function applyLanguage(lang) {
        if (lang === 'ur') {
            if (htmlRoot) {
                htmlRoot.setAttribute('lang', 'ur');
                htmlRoot.setAttribute('dir', 'rtl');
            }
            if (langLabel) langLabel.textContent = 'English';
            if (searchInput) searchInput.placeholder = URDU_DICT.searchPlaceholder;
        } else {
            if (htmlRoot) {
                htmlRoot.setAttribute('lang', 'en');
                htmlRoot.setAttribute('dir', 'ltr');
            }
            if (langLabel) langLabel.textContent = 'اردو';
            if (searchInput) searchInput.placeholder = 'Search Pakistani or global city (e.g. Islamabad, Lahore, Karachi)...';
        }

        // Translate labels in DOM
        Object.keys(URDU_DICT).forEach(key => {
            if (key.startsWith('lbl')) {
                const el = document.getElementById(key);
                if (el) {
                    el.textContent = lang === 'ur' ? (URDU_DICT[key] || el.textContent) : el.getAttribute('data-en') || el.textContent;
                    if (!el.getAttribute('data-en')) el.setAttribute('data-en', el.textContent);
                }
            }
        });
    }

    // ─── LIGHT / DARK THEME SWITCHER ──────────────────────────────
    function setupThemeToggle() {
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', () => {
                currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
                localStorage.setItem('weatherTheme', currentTheme);
                applyTheme(currentTheme);
            });
        }
    }

    function applyTheme(theme) {
        if (theme === 'light') {
            document.body.classList.add('theme-light');
            document.body.classList.remove('theme-dark-dashboard');
            if (themeIcon) themeIcon.className = 'fa-solid fa-sun';
            if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Switch to Dark Mode');
        } else {
            document.body.classList.remove('theme-light');
            document.body.classList.add('theme-dark-dashboard');
            if (themeIcon) themeIcon.className = 'fa-solid fa-moon';
            if (themeToggleBtn) themeToggleBtn.setAttribute('title', 'Switch to Light Mode');
        }
        if (currentCityData && currentCityData.fc) {
            renderHourlyForecast(currentCityData.fc, currentCityData.cur.timezone);
        }
    }

    // ─── UNIT TOGGLE CONTROLS ─────────────────────────────────────
    function setupUnitButtons() {
        ['unitC', 'unitF', 'unitK'].forEach(id => {
            const btn = document.getElementById(id);
            if (!btn) return;
            const u = btn.getAttribute('data-unit');
            if (u === currentUnit) btn.classList.add('active');
            else btn.classList.remove('active');

            btn.addEventListener('click', () => {
                document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentUnit = u;
                localStorage.setItem('weatherUnit', u);
                if (currentCityData) renderWeatherData(currentCityData);
                renderPakistanQuickCitiesCards();
            });
        });
    }
