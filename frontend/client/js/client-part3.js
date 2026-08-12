
    // ─── 7-DAY FORECAST & INTERACTIVE DAY SELECTION ───────────────
    function renderDailyForecast(fc, tz) {
        const grid = document.getElementById('forecastGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const dailyMap = {};
        fc.list.forEach(item => {
            const d = new Date((item.dt + tz) * 1000);
            const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
            if (!dailyMap[key]) dailyMap[key] = { items: [], date: d };
            dailyMap[key].items.push(item);
        });

        currentDailyEntries = Object.values(dailyMap).slice(0, 7);
        if (selectedDayIdx >= currentDailyEntries.length) selectedDayIdx = 0;

        // Render 7-day rows with Click Interaction
        currentDailyEntries.forEach((day, i) => {
            const temps = day.items.map(x => x.main.temp);
            const minT  = Math.min(...temps);
            const maxT  = Math.max(...temps);
            const midItem = day.items[Math.floor(day.items.length / 2)] || day.items[0];
            const dEmoji = owmEmoji(midItem.weather[0].icon);
            
            const daysArray = currentLang === 'ur' ? DAYS_UR : DAYS_FULL_EN;
            const monthsArray = currentLang === 'ur' ? MONTHS_UR : MONTHS_EN;
            const dayLabel  = i === 0 ? (currentLang === 'ur' ? 'آج' : 'Today') : (i === 1 ? (currentLang === 'ur' ? 'کل' : 'Tomorrow') : daysArray[day.date.getUTCDay()]);
            const dateStr = `${day.date.getUTCDate()} ${monthsArray[day.date.getUTCMonth()]}`;

            const row = document.createElement('div');
            row.className = `daily-forecast-row ${i === selectedDayIdx ? 'selected-forecast-day' : ''}`;
            row.setAttribute('data-day-idx', i);
            row.title = currentLang === 'ur' ? 'اس دن کے گھنٹہ وار ڈیٹا کے لیے کلک کریں' : 'Click to view hourly forecast for this day';
            row.innerHTML = `
                <div class="df-left">
                    <span class="df-icon">${dEmoji}</span>
                    <span class="df-temps">+${Math.round(maxT)}° <span class="min-temp">/+${Math.round(minT)}°</span></span>
                </div>
                <div class="df-right">
                    <span class="df-date">${dateStr}</span>
                    <span class="df-day">${dayLabel}</span>
                </div>
            `;

            row.addEventListener('click', () => {
                selectForecastDay(i, fc, tz);
            });

            grid.appendChild(row);
        });

        // Update spotlight card with selected day's data
        updateSpotlightCard(selectedDayIdx);
    }

    function selectForecastDay(idx, fc, tz) {
        selectedDayIdx = idx;
        document.querySelectorAll('.daily-forecast-row').forEach((r, i) => {
            if (i === idx) r.classList.add('selected-forecast-day');
            else r.classList.remove('selected-forecast-day');
        });

        updateSpotlightCard(idx);

        // Update 24-hour section to show the clicked day's forecast!
        if (currentDailyEntries[idx]) {
            const dayData = currentDailyEntries[idx];
            renderHourlyForecastForDay(dayData, fc, tz, idx);
            
            // --- Update Hero Card & Dynamic Background ---
            const midItem = dayData.items[Math.floor(dayData.items.length / 2)] || dayData.items[0];
            const weather = midItem.weather[0];
            const main = midItem.main;
            
            if (typeof setDynamicBackground === 'function') {
                setDynamicBackground(weather.main, true); // Assume day for forecast
            }
            
            const heroIconEl = document.getElementById('heroIconBig');
            if (heroIconEl) heroIconEl.textContent = owmEmoji(weather.icon);
            
            const heroTempEl = document.getElementById('heroTemp');
            if (heroTempEl) heroTempEl.textContent = Math.round(main.temp) + '°';
            
            const temps = dayData.items.map(x => x.main.temp);
            const minT  = Math.min(...temps);
            const maxT  = Math.max(...temps);
            
            const heroHighEl = document.getElementById('heroHigh');
            if (heroHighEl) heroHighEl.textContent = Math.round(maxT) + '°';
            
            const heroLowEl = document.getElementById('heroLow');
            if (heroLowEl) heroLowEl.textContent = Math.round(minT) + '°';
            
            const condDesc = currentLang === 'ur' 
                ? (URDU_DICT.conditions[weather.description.toLowerCase()] || weather.description) 
                : (weather.description.charAt(0).toUpperCase() + weather.description.slice(1));
                
            const heroCondEl = document.getElementById('heroCondition');
            if (heroCondEl) heroCondEl.textContent = condDesc;
            
            const daysArray = currentLang === 'ur' ? DAYS_UR : DAYS_FULL_EN;
            const dayName = idx === 0 ? (currentLang === 'ur' ? 'آج' : 'Today') : (idx === 1 ? (currentLang === 'ur' ? 'کل' : 'Tomorrow') : daysArray[dayData.date.getUTCDay()]);
            const heroDayNightText = document.getElementById('heroDayNightText');
            if (heroDayNightText) heroDayNightText.textContent = dayName;
            const heroDayNightIcon = document.getElementById('heroDayNightIcon');
            if (heroDayNightIcon) heroDayNightIcon.className = 'fa-regular fa-calendar';

            // --- Update Highlights (Wind, UV, Humidity, Visibility, Feels Like) ---
            const speedVal = formatWind(midItem.wind.speed);
            const gustVal  = formatWind(midItem.wind.gust || midItem.wind.speed);
            const windValEl = document.getElementById('windSpeedVal');
            if (windValEl) windValEl.textContent = speedVal;
            const windGustsEl = document.getElementById('windGustsVal');
            if (windGustsEl) windGustsEl.textContent = `${gustVal} ${getWindUnitLabel()}`;
            
            const cloudPct = midItem.clouds ? midItem.clouds.all : 0;
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
            const uvArcPath = document.getElementById('uvArcPath');
            if (uvArcPath) {
                const fraction = Math.min(1, Math.max(0, uvEst / 11));
                uvArcPath.style.strokeDashoffset = 204.2 - (fraction * 204.2);
            }

            const humValEl = document.getElementById('heroHumidity');
            if (humValEl) humValEl.textContent = main.humidity;
            const humDescEl = document.getElementById('humidityDesc');
            if (humDescEl) {
                const dewPoint = Math.round(main.temp - ((100 - main.humidity) / 5));
                humDescEl.textContent = `The dew point is ${dewPoint}° right now`;
            }

            const visKm = midItem.visibility ? (midItem.visibility / 1000).toFixed(0) : '10';
            const visValEl = document.getElementById('visibility');
            if (visValEl) visValEl.textContent = String(visKm).padStart(2, '0');
            const visDescEl = document.getElementById('visibilityDesc');
            if (visDescEl) {
                visDescEl.textContent = parseInt(visKm) < 5 ? 'Haze is affecting visibility' : 'Clear vision range';
            }

            const feelsValEl = document.getElementById('heroFeels');
            if (feelsValEl) feelsValEl.textContent = formatTemp(main.feels_like);
            const diff = main.feels_like - main.temp;
            const feelsDescEl = document.getElementById('feelsLikeDesc');
            if (feelsDescEl) {
                feelsDescEl.textContent = diff > 1 
                    ? "Humidity is making it feel hotter" 
                    : diff < -1 ? "Wind makes it feel cooler" : "Feels accurate";
            }
        }
    }

    function updateSpotlightCard(idx) {
        if (!currentDailyEntries || !currentDailyEntries[idx]) return;
        const day = currentDailyEntries[idx];
        const midItem = day.items[Math.floor(day.items.length / 2)] || day.items[0];
        const temps = day.items.map(x => x.main.temp);
        const minT  = Math.min(...temps);
        const maxT  = Math.max(...temps);

        const tagEl  = document.getElementById('spotlightTag');
        const iconEl = document.getElementById('tomorrowIcon');
        const tempEl = document.getElementById('tomorrowTemp');
        const condEl = document.getElementById('tomorrowCond');

        const daysArray = currentLang === 'ur' ? DAYS_UR : DAYS_FULL_EN;
        const monthsArray = currentLang === 'ur' ? MONTHS_UR : MONTHS_EN;
        const dayName = idx === 0 ? (currentLang === 'ur' ? 'آج' : 'Today') : (idx === 1 ? (currentLang === 'ur' ? 'کل' : 'Tomorrow') : daysArray[day.date.getUTCDay()]);
        const dateStr = `${day.date.getUTCDate()} ${monthsArray[day.date.getUTCMonth()]}`;

        if (tagEl) tagEl.textContent = `${dayName.toUpperCase()} • ${dateStr}`;
        if (iconEl) iconEl.textContent = owmEmoji(midItem.weather[0].icon);
        if (tempEl) tempEl.textContent = `+${Math.round(maxT)}° / +${Math.round(minT)}°`;
        if (condEl) {
            const desc = midItem.weather[0].description;
            condEl.textContent = currentLang === 'ur' ? (URDU_DICT.conditions[desc.toLowerCase()] || desc) : (desc.charAt(0).toUpperCase() + desc.slice(1));
        }
    }

    // ─── 24-HOUR FORECAST & CANVAS CURVE ──────────────────────────
    function renderHourlyForecast(fc, tz) {
        if (currentDailyEntries && currentDailyEntries[selectedDayIdx]) {
            renderHourlyForecastForDay(currentDailyEntries[selectedDayIdx], fc, tz, selectedDayIdx);
            return;
        }

        const grid = document.getElementById('hourlyGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const hourlyData = fc.list.slice(0, 16);
        const temps = [];

        hourlyData.forEach((h, idx) => {
            const hEmoji = owmEmoji(h.weather[0].icon);
            const label  = idx === 0 ? (currentLang === 'ur' ? 'ابھی' : 'Now') : fmtHour(h.dt, tz);
            const pop    = Math.round((h.pop || 0) * 100);
            temps.push(h.main.temp);

            const div = document.createElement('div');
            div.className = `hourly-item ${idx === 0 ? 'now-item' : ''}`;
            div.innerHTML = `
                <div class="hourly-time">${label}</div>
                <div class="hourly-icon">${hEmoji}</div>
                <div class="hourly-temp">${formatTemp(h.main.temp)}</div>
                ${pop > 0 ? `<div class="hourly-pop">💧${pop}%</div>` : ''}
            `;
            grid.appendChild(div);
        });

        setTimeout(() => drawTempCurveCanvas(temps), 50);
    }

    function renderHourlyForecastForDay(dayData, fc, tz, dayIdx) {
        const grid = document.getElementById('hourlyGrid');
        if (!grid) return;
        grid.innerHTML = '';

        const hourlyItems = (dayIdx === 0 && fc && fc.list) ? fc.list.slice(0, 16) : dayData.items;
        const temps = [];

        hourlyItems.forEach((h, idx) => {
            const hEmoji = owmEmoji(h.weather[0].icon);
            const label  = (dayIdx === 0 && idx === 0) ? (currentLang === 'ur' ? 'ابھی' : 'Now') : fmtHour(h.dt, tz);
            const pop    = Math.round((h.pop || 0) * 100);
            temps.push(h.main.temp);

            const div = document.createElement('div');
            div.className = `hourly-item ${(dayIdx === 0 && idx === 0) ? 'now-item' : ''}`;
            div.innerHTML = `
                <div class="hourly-time">${label}</div>
                <div class="hourly-icon">${hEmoji}</div>
                <div class="hourly-temp">${formatTemp(h.main.temp)}</div>
                ${pop > 0 ? `<div class="hourly-pop">💧${pop}%</div>` : ''}
            `;
            grid.appendChild(div);
        });

        // Update section title badge
        const daysArray = currentLang === 'ur' ? DAYS_UR : DAYS_FULL_EN;
        const dayLabel = dayIdx === 0 ? (currentLang === 'ur' ? 'آج' : 'Today') : (dayIdx === 1 ? (currentLang === 'ur' ? 'کل' : 'Tomorrow') : daysArray[dayData.date.getUTCDay()]);
        let badge = document.getElementById('hourlyDayBadge');
        if (!badge) {
            const titleGroup = document.querySelector('#hourlySection .drawer-title-group');
            if (titleGroup) {
                badge = document.createElement('span');
                badge.id = 'hourlyDayBadge';
                badge.className = 'hourly-day-badge';
                titleGroup.appendChild(badge);
            }
        }
        if (badge) {
            badge.textContent = `${dayLabel} • ${dayData.items.length} ${currentLang === 'ur' ? 'اوقات' : 'intervals'}`;
        }

        setTimeout(() => drawTempCurveCanvas(temps), 50);
    }

    function drawTempCurveCanvas(temps) {
        const canvas = document.getElementById('tempCurveCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const width = canvas.parentElement.clientWidth || 300;
        canvas.width = width;
        canvas.height = 55;

        if (!temps || temps.length < 2) return;
        ctx.clearRect(0, 0, width, 55);

        const min = Math.min(...temps) - 1;
        const max = Math.max(...temps) + 1;
        const step = width / (temps.length - 1);

        ctx.beginPath();
        temps.forEach((t, i) => {
            const x = i * step;
            const y = 48 - ((t - min) / (max - min)) * 40;
            if (i === 0) ctx.moveTo(x, y);
            else {
                const prevX = (i - 1) * step;
                const prevY = 48 - ((temps[i-1] - min) / (max - min)) * 40;
                const cpX1 = prevX + step / 2;
                const cpX2 = x - step / 2;
                ctx.bezierCurveTo(cpX1, prevY, cpX2, y, x, y);
            }
        });

        const isLight = document.body.classList.contains('theme-light');
        ctx.strokeStyle = isLight ? '#0284c7' : '#00d2ff';
        ctx.lineWidth = 3.5;
        ctx.shadowColor = isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(0, 210, 255, 0.6)';
        ctx.shadowBlur = 8;
        ctx.stroke();
    }

    // ─── AQI SMOG SECTION ─────────────────────────────────────────
    function renderAQI(aqiData) {
        if (!aqiData || !aqiData.list || !aqiData.list.length) return;
        const aqi = aqiData.list[0];
        const aqiIdx = aqi.main.aqi;
        const comp   = aqi.components;

        const aqiValEl = document.getElementById('aqiVal');
        if (aqiValEl) aqiValEl.textContent = aqiIdx;

        const descText = currentLang === 'ur' ? URDU_DICT.aqi[aqiIdx] : URDU_DICT.aqi[aqiIdx];
        const aqiDescEl = document.getElementById('aqiDesc');
        if (aqiDescEl) aqiDescEl.textContent = descText;
        
        const healthAdv = currentLang === 'ur' ? URDU_DICT.aqiHealth[aqiIdx] : URDU_DICT.aqiHealth[aqiIdx];
        const aqiAdvEl = document.getElementById('aqiHealthAdv');
        if (aqiAdvEl) aqiAdvEl.textContent = healthAdv;

        const indicator = document.getElementById('aqiScaleIndicator');
        if (indicator) {
            indicator.style.left = `${((aqiIdx - 1) / 4) * 95}%`;
        }

        const pm25El = document.getElementById('pm25');
        if (pm25El) pm25El.textContent = `${comp.pm2_5.toFixed(1)} µg`;

        const pm10El = document.getElementById('pm10');
        if (pm10El) pm10El.textContent = `${comp.pm10.toFixed(1)} µg`;

        const o3El = document.getElementById('o3');
        if (o3El) o3El.textContent = `${comp.o3.toFixed(1)} µg`;

        const no2El = document.getElementById('no2');
        if (no2El) no2El.textContent = `${comp.no2.toFixed(1)} µg`;
    }

    // ─── SMART WEATHER INSIGHTS ───────────────────────────────────
    function renderSmartInsights(cur, fc) {
        const tempC = cur.main.temp;
        const cond  = cur.weather[0].main.toLowerCase();
        const pop   = fc.list[0] ? Math.round((fc.list[0].pop || 0) * 100) : 0;

        let summary = `Pleasant clear weather in ${cur.name} with moderate temperatures.`;
        if (tempC > 38) summary = `Extreme heatwave in ${cur.name}. Keep hydrated and avoid direct sun.`;
        else if (tempC < 12) summary = `Chilly weather in ${cur.name}. Warm clothing recommended.`;
        else if (cond.includes('rain') || pop > 60) summary = `Rain showers expected today in ${cur.name}. Keep an umbrella handy.`;
        else if (cond.includes('cloud')) summary = `Pleasant overcast weather expected today in ${cur.name}.`;

        if (currentLang === 'ur') {
            summary = `${cur.name} میں آج درجہ حرارت ${Math.round(tempC)}°C اور مطلع ${URDU_DICT.conditions[cur.weather[0].description.toLowerCase()] || cur.weather[0].description} رہے گا۔`;
        }
        const insSumEl = document.getElementById('insightSummary');
        if (insSumEl) insSumEl.textContent = summary;

        // Lifestyle Widgets
        const lsOutfit = document.getElementById('lsOutfit');
        if (lsOutfit) {
            let outfit = tempC < 15 ? 'Heavy Warm Layers' : tempC < 25 ? 'Light Jacket' : 'Light Cotton Clothes';
            if (cur.weather[0].id >= 200 && cur.weather[0].id < 600) outfit += ' + ☔';
            lsOutfit.textContent = outfit;
        }

        const lsRunning = document.getElementById('lsRunning');
        if (lsRunning) {
            lsRunning.textContent = tempC > 35 ? 'Avoid Afternoon' : 'Optimal Morning';
        }

        const lsDriving = document.getElementById('lsDriving');
        if (lsDriving) {
            lsDriving.textContent = (cur.visibility && cur.visibility < 3000) ? 'Fog / Smog Alert' : 'Safe Conditions';
        }

        const lsStargazing = document.getElementById('lsStargazing');
        if (lsStargazing) {
            const clouds = cur.clouds ? cur.clouds.all : 0;
            lsStargazing.textContent = clouds > 70 ? 'Cloudy Sky' : 'Clear View';
        }
    }

    // ─── MONSOON & HEATWAVE SEVERE ALERTS ─────────────────────────
    function checkPakistaniWeatherAlerts(cur, rainPop, wind, aqiData) {
        const speedKmh = wind.speed * 3.6;
        const tempC = cur.main.temp;
        const feelsC = cur.main.feels_like;
        const aqiIdx = (aqiData && aqiData.list && aqiData.list[0]) ? aqiData.list[0].main.aqi : 1;

        if (tempC >= 38 || feelsC >= 42) {
            showAlertBanner(currentLang === 'ur' 
                ? `🔥 شدید ترین گرمی کی لہر (Heatwave): ${cur.name} میں درجہ حرارت ${Math.round(tempC)}°C ہے۔ دھوپ سے بچیں۔`
                : `🔥 Extreme Heatwave Alert: Very high temperature (${Math.round(tempC)}°C) in ${cur.name}. Stay hydrated.`);
        } else if (rainPop > 60 || (cur.rain && (cur.rain['1h'] || 0) > 2)) {
            showAlertBanner(currentLang === 'ur' 
                ? `🌧️ مون سون بارشوں کا الرٹ: ${cur.name} میں ${rainPop}% بارش کا امکان ہے۔`
                : `🌧️ Pakistan Monsoon Advisory: Heavy precipitation probability (${rainPop}%) in ${cur.name}.`);
        } else if (aqiIdx >= 4) {
            showAlertBanner(currentLang === 'ur' 
                ? `🌫️ شدید سموگ الرٹ: ${cur.name} میں ہوا کا معیار خراب ہے۔ ماسک استعمال کریں۔`
                : `🌫️ Severe Smog Alert: Air quality in ${cur.name} is hazardous. Wear N95 masks.`);
        } else if (speedKmh > 40) {
            showAlertBanner(currentLang === 'ur' 
                ? `💨 تیز ہوا کا الرٹ: ${cur.name} میں جھونکے ${Math.round(speedKmh)} km/h تک ہیں۔`
                : `⚠️ High Wind Advisory: Gusts up to ${Math.round(speedKmh)} km/h in ${cur.name}.`);
        } else {
            if (alertBanner) alertBanner.style.display = 'none';
        }
    }

    function showAlertBanner(msg) {
        if (alertText) alertText.textContent = msg;
        if (alertBanner) alertBanner.style.display = 'flex';
    }

    if (closeAlertBtn) {
        closeAlertBtn.addEventListener('click', () => {
            if (alertBanner) alertBanner.style.display = 'none';
        });
    }

    // ─── 🗺️ INTEGRATED LEAFLET WEATHER RADAR MAP ──────────────────
    function updateIntegratedMap(lat, lon, cityName) {
        if (!integratedMap) {
            integratedMap = L.map('integratedLeafletMap', {
                center: [lat, lon],
                zoom: 6,
                zoomControl: false
            });

            L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap &copy; CARTO',
                maxZoom: 18
            }).addTo(integratedMap);

            integratedCityMarker = L.marker([lat, lon]).addTo(integratedMap)
                .bindPopup(`<img src="https://flagcdn.com/16x12/pk.png" alt="PK" style="vertical-align: middle; margin-right: 4px;"> <b>${cityName}</b>`)
                .openPopup();

            setIntegratedRadarLayer(currentIntegratedLayer);
        } else {
            integratedMap.setView([lat, lon], 6);
            if (integratedCityMarker) {
                integratedCityMarker.setLatLng([lat, lon]).setPopupContent(`<img src="https://flagcdn.com/16x12/pk.png" alt="PK" style="vertical-align: middle; margin-right: 4px;"> <b>${cityName}</b>`);
            }
        }
    }

    function setIntegratedRadarLayer(layerName) {
        if (!integratedMap) return;
        if (integratedRadarLayer) integratedMap.removeLayer(integratedRadarLayer);

        integratedRadarLayer = L.tileLayer(`https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${window.OWM_KEY}`, {
            maxZoom: 18,
            opacity: 0.75
        });
        integratedRadarLayer.addTo(integratedMap);
        currentIntegratedLayer = layerName;
    }

    document.querySelectorAll('.map-layer-chip').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.map-layer-chip').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const layer = btn.getAttribute('data-layer');
            setIntegratedRadarLayer(layer);
        });
    });

    const resetMapBtn = document.getElementById('mapResetViewBtn');
    if (resetMapBtn) {
        resetMapBtn.addEventListener('click', () => {
            if (integratedMap) integratedMap.setView([30.3753, 69.3451], 5);
        });
    }

    if (expandMapBtn) {
        expandMapBtn.addEventListener('click', () => {
            if (radarModal) radarModal.style.display = 'flex';
            if (!modalMap) setTimeout(initModalRadarMap, 100);
        });
    }

    // ─── FULLSCREEN MODAL RADAR MAP ────────────────────────────────
    if (openRadarBtn) {
        openRadarBtn.addEventListener('click', () => {
            if (radarModal) radarModal.style.display = 'flex';
            if (!modalMap) setTimeout(initModalRadarMap, 100);
        });
    }
