function getApiBaseUrl() {
    if (!window.location.origin || !window.location.origin.startsWith('http')) {
        return 'http://localhost:8000/backend/api';
    }
    const pathname = window.location.pathname;
    let base = window.location.origin;
    if (pathname.toLowerCase().includes('/frontend')) {
        const prefix = pathname.substring(0, pathname.toLowerCase().indexOf('/frontend'));
        base += prefix;
    } else if (pathname.toLowerCase().includes('/wheather%20wesite') || pathname.toLowerCase().includes('/wheather wesite')) {
        base += '/wheather%20wesite';
    }
    return `${base}/backend/api`;
}

const API_BASE_URL = getApiBaseUrl();

window.apiConfig = {
    getCities:      `${API_BASE_URL}/get_cities.php`,
    addCity:        `${API_BASE_URL}/add_city.php`,
    deleteCity:     `${API_BASE_URL}/delete_city.php`,
    login:          `${API_BASE_URL}/login.php`,
    getSettings:    `${API_BASE_URL}/get_settings.php`,
    saveSettings:   `${API_BASE_URL}/save_settings.php`,
    logSearch:      `${API_BASE_URL}/log_search.php`,
    getSearchStats: `${API_BASE_URL}/get_search_stats.php`,
    trackVisitor:   `${API_BASE_URL}/track_visitor.php`,
    getVisitors:    `${API_BASE_URL}/get_visitors.php`,
};

// OpenWeatherMap API Key & Endpoints
window.OWM_KEY = '91f9651a6fa348f23e20ce0a3ef9041f';
window.OWM = {
    current:  (lat, lon, units='metric') => `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${window.OWM_KEY}&units=${units}`,
    forecast: (lat, lon, units='metric') => `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${window.OWM_KEY}&units=${units}&cnt=40`,
    aqi:      (lat, lon) => `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${window.OWM_KEY}`,
    geo:      (q)        => `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(q)}&limit=8&appid=${window.OWM_KEY}`,
};
