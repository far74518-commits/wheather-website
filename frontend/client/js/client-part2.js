
    // ─── 🇵🇰 PAKISTAN QUICK CITIES CARDS SYSTEM ────────────────────
    async function fetchAndRenderPakistanQuickCities() {
        const now = Date.now();
        if (pkCitiesDataCache.timestamp && (now - pkCitiesDataCache.timestamp < 10 * 60 * 1000) && pkCitiesDataCache.cities) {
            renderPakistanQuickCitiesCards();
            updateFloatingMapCityChips();
            return;
        }

        try {
            const promises = PAKISTAN_CITIES.map(async (c) => {
                const r = await fetch(window.OWM.current(c.lat, c.lng));
                const data = await r.json();
                return { ...c, data };
            });

            const results = await Promise.all(promises);
            pkCitiesDataCache = { timestamp: now, cities: results };
            localStorage.setItem('pkCitiesCache', JSON.stringify(pkCitiesDataCache));
            renderPakistanQuickCitiesCards();
            updateFloatingMapCityChips();
        } catch(e) {
            console.warn('Failed to batch fetch PK quick cities weather', e);
        }
    }

    function updateFloatingMapCityChips() {
        const cities = pkCitiesDataCache.cities || [];
        cities.forEach(c => {
            const tempEl = document.getElementById(`chipTemp${c.name}`);
            if (tempEl && c.data && c.data.main) {
                tempEl.textContent = formatTemp(c.data.main.temp);
            }
        });
    }

    // Hook click events on floating map chips
    document.querySelectorAll('.map-city-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            const cityName = chip.getAttribute('data-city');
            const cityObj = PAKISTAN_CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
            if (cityObj) {
                document.querySelectorAll('.map-city-chip').forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
                showCity({ name: cityObj.name, lat: cityObj.lat, lng: cityObj.lng });
            }
        });
    });

    function renderPakistanQuickCitiesCards() {
        const grid = document.getElementById('pkCitiesGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const cities = pkCitiesDataCache.cities || PAKISTAN_CITIES.map(c => ({ ...c, data: null }));
        const filterVal = (document.getElementById('pkQuickSearch')?.value || '').toLowerCase().trim();

        cities.forEach(city => {
            const nameToDisplay = currentLang === 'ur' ? (city.nameUr || city.name) : city.name;
            if (filterVal && !city.name.toLowerCase().includes(filterVal) && !(city.nameUr && city.nameUr.includes(filterVal))) {
                return;
            }

            const card = document.createElement('div');
            card.className = 'pk-city-card';
            if (currentCityData && currentCityData.cur.name.toLowerCase() === city.name.toLowerCase()) {
                card.classList.add('active-city');
            }

            let tempStr = '--°', iconStr = '🌤️', condStr = '--', highLowStr = '';
            if (city.data && city.data.main) {
                tempStr = formatTemp(city.data.main.temp);
                iconStr = owmEmoji(city.data.weather[0].icon);
                const rawDesc = city.data.weather[0].description;
                condStr = currentLang === 'ur' ? (URDU_DICT.conditions[rawDesc] || rawDesc) : rawDesc;
                highLowStr = `${formatTemp(city.data.main.temp_max)} / ${formatTemp(city.data.main.temp_min)}`;
            }

            card.innerHTML = `
                <div class="pk-city-name">${nameToDisplay}</div>
                <div class="pk-city-icon">${iconStr}</div>
                <div class="pk-city-temp">${tempStr}</div>
                <div class="pk-city-cond">${condStr}</div>
                <div class="pk-city-highlow">${highLowStr}</div>
            `;

            card.addEventListener('click', () => {
                showCity({ name: city.name, lat: city.lat, lng: city.lng });
            });

            grid.appendChild(card);
        });
    }

    const pkQuickSearch = document.getElementById('pkQuickSearch');
    if (pkQuickSearch) {
        pkQuickSearch.addEventListener('input', () => {
            renderPakistanQuickCitiesCards();
        });
    }

    // ─── RENDER FAVORITE / SAVED CITIES ───────────────────────────
    function renderSavedCities(apiCities) {
        const savedList = document.getElementById('savedCitiesList');
        if (!savedList) return;
        savedList.innerHTML = '';

        const combined = [...apiCities];
        pinnedCities.forEach(p => {
            if (!combined.some(c => c.name.toLowerCase() === p.name.toLowerCase())) {
                combined.push(p);
            }
        });

        if (combined.length === 0) {
            savedList.innerHTML = `<span class="loading-saved">${currentLang === 'ur' ? 'کوئی پسندیدہ شہر نہیں ہے۔ ستارے کے آئیکن پر کلک کریں!' : 'No pinned cities yet. Click star icon on hero card!'}</span>`;
            return;
        }

        combined.forEach(city => {
            const pill = document.createElement('div');
            pill.className = 'saved-city-pill';
            const isPinned = pinnedCities.some(p => p.name.toLowerCase() === city.name.toLowerCase());
            pill.innerHTML = `
                <i class="fa-solid fa-location-dot"></i>
                <span>${city.name}</span>
                ${isPinned ? `<i class="fa-solid fa-xmark del-pin" title="Unpin city"></i>` : ''}
            `;

            pill.addEventListener('click', (e) => {
                if (e.target.classList.contains('del-pin')) {
                    e.stopPropagation();
                    unpinCity(city.name);
                } else {
                    showCity({ name: city.name, lat: city.lat, lng: city.lng });
                }
            });

            savedList.appendChild(pill);
        });
    }

    // ─── PIN / UNPIN CITY ─────────────────────────────────────────
    if (pinCityBtn) {
        pinCityBtn.addEventListener('click', () => {
            if (!currentCityData || !currentCityData.cur) return;
            const name = currentCityData.cur.name;
            const lat  = currentCityData.cur.coord.lat;
            const lng  = currentCityData.cur.coord.lon;

            const idx = pinnedCities.findIndex(p => p.name.toLowerCase() === name.toLowerCase());
            if (idx >= 0) {
                pinnedCities.splice(idx, 1);
                if (pinStarIcon) pinStarIcon.className = 'fa-regular fa-star';
            } else {
                pinnedCities.push({ name, lat, lng });
                if (pinStarIcon) pinStarIcon.className = 'fa-solid fa-star';
            }
            localStorage.setItem('pinnedCities', JSON.stringify(pinnedCities));
            if (window.apiConfig?.getCities) {
                fetch(window.apiConfig.getCities).then(r => r.json()).then(d => {
                    renderSavedCities(d.data || []);
                }).catch(() => renderSavedCities([]));
            }
        });
    }

    function unpinCity(cityName) {
        pinnedCities = pinnedCities.filter(p => p.name.toLowerCase() !== cityName.toLowerCase());
        localStorage.setItem('pinnedCities', JSON.stringify(pinnedCities));
        if (currentCityData && currentCityData.cur.name.toLowerCase() === cityName.toLowerCase()) {
            if (pinStarIcon) pinStarIcon.className = 'fa-regular fa-star';
        }
        if (window.apiConfig?.getCities) {
            fetch(window.apiConfig.getCities).then(r => r.json()).then(d => {
                renderSavedCities(d.data || []);
            }).catch(() => renderSavedCities([]));
        }
    }

    // ─── FETCH & SHOW CITY DATA ───────────────────────────────────
    async function showCity(city) {
        showLoader(currentLang === 'ur' ? `${city.name} کا موسم لوڈ ہو رہا ہے...` : `Loading weather for ${city.name}…`, '🔍');
        if (searchInput) searchInput.value = city.name;

        try {
            const [curRes, fcRes, aqiRes] = await Promise.all([
                fetch(window.OWM.current(city.lat, city.lng)),
                fetch(window.OWM.forecast(city.lat, city.lng)),
                fetch(window.OWM.aqi(city.lat, city.lng)),
            ]);

            const [cur, fc, aqiData] = await Promise.all([
                curRes.json(),
                fcRes.json(),
                aqiRes.json(),
            ]);

            if (cur.cod !== 200) throw new Error(cur.message || 'City not found');

            currentCityData = { cur, fc, aqiData };
            
            // Save as last location
            localStorage.setItem('lastLocation', JSON.stringify({ name: cur.name, lat: cur.coord.lat, lng: cur.coord.lon }));

            // Log search stats to backend
            try {
                if (window.apiConfig?.logSearch) {
                    fetch(window.apiConfig.logSearch, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ city_name: cur.name })
                    }).catch(() => {});
                }
            } catch(e) {}

            renderWeatherData(currentCityData);
            renderPakistanQuickCitiesCards();

            renderComfortIndex(cur);
            fetchNamazTimes(cur.coord.lat, cur.coord.lon, cur.name);

            hideLoader();

        } catch(e) {
            console.error(e);
            if (loaderText) loaderText.textContent = `⚠️ ${e.message || 'Failed to fetch weather data'}`;
            
            // Display error on hero card for debugging
            const heroCondEl = document.getElementById('heroCondition');
            if (heroCondEl) heroCondEl.textContent = 'Error: ' + e.message;
            const heroDescEl = document.getElementById('heroDesc');
            if (heroDescEl) heroDescEl.textContent = e.stack || e.toString();
            
            setTimeout(hideLoader, 2500);
        }
    }

    // ─── RENDER ALL WEATHER DATA ──────────────────────────────────
    let currentDailyEntries = [];
    let selectedDayIdx = 0;

    function setDynamicBackground(conditionMain, isDay) {
        const bgMap = {
            Clear: { d: 'https://images.unsplash.com/photo-1622278647429-71bc97e904e8?auto=format&fit=crop&w=1920&q=80', n: 'https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&w=1920&q=80' },
            Clouds: { d: 'https://images.unsplash.com/photo-1534088568595-a066f410cbda?auto=format&fit=crop&w=1920&q=80', n: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=80' },
            Rain: { d: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80', n: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=80' },
            Drizzle: { d: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=1920&q=80', n: 'https://images.unsplash.com/photo-1534274988757-a28bf1a57c17?auto=format&fit=crop&w=1920&q=80' },
            Thunderstorm: { d: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce16?auto=format&fit=crop&w=1920&q=80', n: 'https://images.unsplash.com/photo-1605727216801-e27ce1d0ce16?auto=format&fit=crop&w=1920&q=80' },
            Snow: { d: 'https://images.unsplash.com/photo-1516431883659-655d41c09bf9?auto=format&fit=crop&w=1920&q=80', n: 'https://images.unsplash.com/photo-1516431883659-655d41c09bf9?auto=format&fit=crop&w=1920&q=80' }
        };
        const cond = bgMap[conditionMain] ? conditionMain : 'Clear';
        const time = isDay ? 'd' : 'n';
        const url = bgMap[cond][time];
        
        const bgAtmo = document.getElementById('bgAtmosphere');
        if (bgAtmo) {
            bgAtmo.style.backgroundImage = `url('${url}')`;
            bgAtmo.style.backgroundSize = 'cover';
            bgAtmo.style.backgroundPosition = 'center';
            bgAtmo.style.backgroundAttachment = 'fixed';
            bgAtmo.style.opacity = '0.35'; // Subdued so it doesn't break UI contrast
        }
    }

    function renderWeatherData({ cur, fc, aqiData }) {
        const tz      = cur.timezone;
        const weather = cur.weather[0];
        const main    = cur.main;
        const wind    = cur.wind;
        const sys     = cur.sys;
        const emoji   = owmEmoji(weather.icon);
        const theme   = owmTheme(weather.id);

        // Day vs Night Detection for current city
        const isDayInCity = weather.icon.endsWith('d') || (sys.sunrise && sys.sunset && cur.dt >= sys.sunrise && cur.dt < sys.sunset);

        // Body Theme & Day/Night Atmosphere Class
        document.body.className = `${currentTheme === 'light' ? 'theme-light' : 'theme-dark-dashboard'} ${theme} ${isDayInCity ? 'city-is-day' : 'city-is-night'}`;
        setDynamicBackground(weather.main, isDayInCity);

        // Pin Icon State
        const isPinned = pinnedCities.some(p => p.name.toLowerCase() === cur.name.toLowerCase());
        if (pinStarIcon) pinStarIcon.className = isPinned ? 'fa-solid fa-star' : 'fa-regular fa-star';

        // Update Day / Night Pill in Hero Card
        const heroDayNightPill = document.getElementById('heroDayNightPill');
        const heroDayNightIcon = document.getElementById('heroDayNightIcon');
        const heroDayNightText = document.getElementById('heroDayNightText');
        if (heroDayNightPill && heroDayNightIcon && heroDayNightText) {
            if (isDayInCity) {
                heroDayNightPill.className = 'hero-daynight-pill day-mode';
                heroDayNightIcon.className = 'fa-solid fa-sun';
                heroDayNightText.textContent = currentLang === 'ur' ? 'دن (Day)' : 'Daytime';
            } else {
                heroDayNightPill.className = 'hero-daynight-pill night-mode';
                heroDayNightIcon.className = 'fa-solid fa-moon';
                heroDayNightText.textContent = currentLang === 'ur' ? 'رات (Night)' : 'Nighttime';
            }
        }

        // Translate Condition
        const condDesc = currentLang === 'ur' 
            ? (URDU_DICT.conditions[weather.description.toLowerCase()] || weather.description) 
            : (weather.description.charAt(0).toUpperCase() + weather.description.slice(1));

        // Hero Card Updates
        const heroIconEl = document.getElementById('heroIconBig');
        if (heroIconEl) heroIconEl.textContent = emoji;

        const heroTempEl = document.getElementById('heroTemp');
        if (heroTempEl) heroTempEl.textContent = formatTemp(main.temp);

        const heroHighEl = document.getElementById('heroHigh');
        if (heroHighEl) heroHighEl.textContent = formatTemp(main.temp_max);

        const heroLowEl = document.getElementById('heroLow');
        if (heroLowEl) heroLowEl.textContent = formatTemp(main.temp_min);

        const heroCondEl = document.getElementById('heroCondition');
        if (heroCondEl) heroCondEl.textContent = condDesc;

        const heroCityEl = document.getElementById('heroCity');
        if (heroCityEl) {
            const countryCode = sys.country || 'PK';
            const flagUrl = `https://flagcdn.com/w20/${countryCode.toLowerCase()}.png`;
            heroCityEl.innerHTML = `<i class="fa-solid fa-location-dot"></i> <span>${cur.name}, ${countryCode} <img src="${flagUrl}" width="16" style="vertical-align: middle; border-radius: 2px; margin-left: 4px;" alt="Flag"></span>`;
        }

        const heroTimeEl = document.getElementById('heroTime');
        if (heroTimeEl) heroTimeEl.textContent = nowLocalTime(tz);

        const heroDateEl = document.getElementById('heroDate');
        if (heroDateEl) heroDateEl.textContent = nowLocalDate(tz);

        const descText = currentLang === 'ur' 
            ? `${condDesc}۔ زیادہ سے زیادہ ${formatTemp(main.temp_max)} اور کم سے کم ${formatTemp(main.temp_min)}۔ نمی ${main.humidity}%۔`
            : `${condDesc} with a high of ${formatTemp(main.temp_max)} and low of ${formatTemp(main.temp_min)}. Humidity at ${main.humidity}%.`;
        const heroDescEl = document.getElementById('heroDesc');
        if (heroDescEl) heroDescEl.textContent = descText;

        // ─── 1. WIND HIGHLIGHT CARD ────────────────────────────────
        const speedVal = formatWind(wind.speed);
        const gustVal  = formatWind(wind.gust || wind.speed);
        const windValEl = document.getElementById('windSpeedVal');
        if (windValEl) windValEl.textContent = speedVal;

        const windUnitEl = document.getElementById('windUnitLabel');
        if (windUnitEl) windUnitEl.textContent = getWindUnitLabel();

        const windGustsEl = document.getElementById('windGustsVal');
        if (windGustsEl) windGustsEl.textContent = `${gustVal} ${getWindUnitLabel()}`;

        // ─── 2. UV INDEX HIGHLIGHT CARD ────────────────────────────
        const cloudPct = cur.clouds ? cur.clouds.all : 0;
        const uvEst = Math.max(1, Math.round((1 - cloudPct / 100) * 9.5 * 10) / 10);
        const uvValEl = document.getElementById('uvIndexVal');
        if (uvValEl) uvValEl.textContent = uvEst.toFixed(2);

        let uvCat = 'Low';
        if (uvEst >= 3) uvCat = 'Moderate';
        if (uvEst >= 6) uvCat = 'High';
        if (uvEst >= 8) uvCat = 'Very High';
        if (uvEst >= 11) uvCat = 'Extreme';
        const uvDescEl = document.getElementById('uvIndexDesc');
        if (uvDescEl) uvDescEl.textContent = uvCat;

        // Arc gauge stroke offset: full arc length is ~204.2
        const uvArcPath = document.getElementById('uvArcPath');
        if (uvArcPath) {
            const fraction = Math.min(1, Math.max(0, uvEst / 11));
            const offset = 204.2 - (fraction * 204.2);
            uvArcPath.style.strokeDashoffset = offset;
        }

        // ─── 3. SUNRISE & SUNSET ARC ───────────────────────────────
        const rise = sys.sunrise, set = sys.sunset;
        const riseEl = document.getElementById('sunriseTime');
        if (riseEl) riseEl.textContent = fmt12h(rise, tz);

        const setEl = document.getElementById('sunsetTime');
        if (setEl) setEl.textContent = fmt12h(set, tz);

        const prog = sunProgress(rise, set);
        const sunDot = document.getElementById('sunArcDot');
        if (sunDot) {
            if (prog !== null) {
                const t = prog / 100;
                // Quadratic bezier formula: P0=(15,75), P1=(90,5), P2=(165,75)
                const cx = Math.round((1 - t)*(1 - t)*15 + 2*(1 - t)*t*90 + t*t*165);
                const cy = Math.round((1 - t)*(1 - t)*75 + 2*(1 - t)*t*5 + t*t*75);
                sunDot.setAttribute('cx', cx);
                sunDot.setAttribute('cy', cy);
                sunDot.style.display = 'block';
            } else {
                sunDot.setAttribute('cx', 15);
                sunDot.setAttribute('cy', 75);
                sunDot.style.opacity = '0.4';
            }
        }

        // ─── 4. HUMIDITY HIGHLIGHT CARD ────────────────────────────
        const humValEl = document.getElementById('heroHumidity');
        if (humValEl) humValEl.textContent = main.humidity;

        const humDescEl = document.getElementById('humidityDesc');
        if (humDescEl) {
            const dewPoint = Math.round(main.temp - ((100 - main.humidity) / 5));
            humDescEl.textContent = `The dew point is ${dewPoint}° right now`;
        }

        // ─── 5. VISIBILITY HIGHLIGHT CARD ──────────────────────────
        const visKm = cur.visibility ? (cur.visibility / 1000).toFixed(0) : '10';
        const visValEl = document.getElementById('visibility');
        if (visValEl) visValEl.textContent = String(visKm).padStart(2, '0');

        const visDescEl = document.getElementById('visibilityDesc');
        if (visDescEl) {
            visDescEl.textContent = parseInt(visKm) < 5 ? 'Haze is affecting visibility' : 'Clear vision range';
        }

        // ─── 6. FEELS LIKE HIGHLIGHT CARD ──────────────────────────
        const feelsValEl = document.getElementById('heroFeels');
        if (feelsValEl) feelsValEl.textContent = formatTemp(main.feels_like);

        const diff = main.feels_like - main.temp;
        const feelsDescEl = document.getElementById('feelsLikeDesc');
        if (feelsDescEl) {
            feelsDescEl.textContent = diff > 1 
                ? "Humidity is making it feel hotter" 
                : diff < -1 ? "Wind makes it feel cooler" : "Feels accurate";
        }

        // ─── 7-DAY FORECAST & TOMORROW SPOTLIGHT ────────────────────
        renderDailyForecast(fc, tz);

        // ─── 24-HOUR HOURLY FORECAST ────────────────────────────────
        renderHourlyForecast(fc, tz);

        // ─── AQI SMOG SECTION ───────────────────────────────────────
        renderAQI(aqiData);

        // ─── SMART WEATHER INSIGHTS ─────────────────────────────────
        renderSmartInsights(cur, fc);

        // ─── SEVERE WEATHER ADVISORY ALERTS ────────────────────────
        const pop = fc.list[0] ? Math.round((fc.list[0].pop || 0) * 100) : 0;
        checkPakistaniWeatherAlerts(cur, pop, wind, aqiData);

        // ─── UPDATE INTEGRATED RADAR MAP ────────────────────────────
        updateIntegratedMap(cur.coord.lat, cur.coord.lon, cur.name);
    }
