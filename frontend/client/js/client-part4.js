
if (closeRadarBtn) {
    closeRadarBtn.addEventListener('click', () => {
        if (radarModal) radarModal.style.display = 'none';
    });
}

function initModalRadarMap() {
    const lat = currentCityData ? currentCityData.cur.coord.lat : 30.3753;
    const lon = currentCityData ? currentCityData.cur.coord.lon : 69.3451;

    modalMap = L.map('leafletMap', {
        center: [lat, lon],
        zoom: 6,
        zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO',
        maxZoom: 18
    }).addTo(modalMap);

    updateModalRadarLayer('precipitation');

    modalCityMarker = L.marker([lat, lon]).addTo(modalMap)
        .bindPopup(`<img src="https://flagcdn.com/16x12/pk.png" alt="PK" style="vertical-align: middle; margin-right: 4px;"> <b>${currentCityData ? currentCityData.cur.name : 'Pakistan'}</b>`)
        .openPopup();
}

function updateModalRadarLayer(layerName) {
    if (!modalMap) return;
    if (modalRadarLayer) modalMap.removeLayer(modalRadarLayer);

    modalRadarLayer = L.tileLayer(`https://tile.openweathermap.org/map/${layerName}/{z}/{x}/{y}.png?appid=${window.OWM_KEY}`, {
        maxZoom: 18,
        opacity: 0.75
    });
    modalRadarLayer.addTo(modalMap);
}

document.querySelectorAll('.radar-layer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.radar-layer-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const layer = btn.getAttribute('data-layer');
        updateModalRadarLayer(layer);
    });
});

// ─── 📍 USE MY LOCATION (GPS / GEOLOCATION) ───────────────────
if (geoBtn) {
    geoBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            showLoader(currentLang === 'ur' ? 'آپ کی لوکیشن حاصل کی جا رہی ہے...' : 'Locating your GPS location...', '📍');
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    showCity({ name: 'My Location', lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                (err) => {
                    console.warn('GPS permission denied or error', err);
                    hideLoader();
                    alert(currentLang === 'ur' ? 'جی پی ایس ایکسس ناکام رہا۔' : 'Location access denied. Please type your city.');
                }
            );
        } else {
            alert('Geolocation is not supported by your browser.');
        }
    });
}

// ─── SEARCH INPUT & AUTOCOMPLETE ──────────────────────────────
if (searchInput) {
    searchInput.addEventListener('input', () => {
        const q = searchInput.value.trim();
        if (clearBtn) clearBtn.style.display = q ? 'flex' : 'none';
        clearTimeout(searchTimer);

        if (q.length < 2) { closeSuggestions(); return; }
        if (suggestions) {
            suggestions.innerHTML = `<div class="sug-loading"><i class="fa-solid fa-spinner fa-spin"></i> ${currentLang === 'ur' ? 'تلاش جاری ہے...' : 'Searching cities…'}</div>`;
            openSuggestions();
        }
        searchTimer = setTimeout(() => doSearch(q), 350);
    });
}

async function doSearch(q) {
    try {
        const res = await fetch(window.OWM.geo(q));
        const results = await res.json();

        if (!suggestions) return;
        if (!results || !results.length) {
            suggestions.innerHTML = `<div class="sug-empty">${currentLang === 'ur' ? 'کوئی شہر نہیں ملا' : 'No city found for'} "<b>${q}</b>"</div>`;
            return;
        }

        suggestions.innerHTML = '';
        results.forEach(place => {
            const item = document.createElement('div');
            item.className = 'suggestion-item';
            item.innerHTML = `
                    <i class="fa-solid fa-location-dot"></i>
                    <div>
                        <div class="sug-name">${place.name}</div>
                        <div class="sug-region">${place.state ? place.state + ', ' : ''}${place.country}</div>
                    </div>
                `;
            item.addEventListener('click', () => {
                closeSuggestions();
                showCity({ name: place.name, lat: place.lat, lng: place.lon });
            });
            suggestions.appendChild(item);
        });
    } catch (e) {
        if (suggestions) suggestions.innerHTML = `<div class="sug-empty">Search failed. Check network.</div>`;
    }
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
        }
        clearBtn.style.display = 'none';
        closeSuggestions();
    });
}

document.addEventListener('click', (e) => {
    const sBox = document.getElementById('searchBox');
    if (sBox && !sBox.contains(e.target)) closeSuggestions();
});

function openSuggestions() { if (suggestions) suggestions.classList.add('open'); }
function closeSuggestions() { if (suggestions) suggestions.classList.remove('open'); }

function showLoader(msg, emoji) {
    const searchIcon = document.querySelector('#searchBox .search-icon');
    if (searchIcon) {
        searchIcon.className = 'fa-solid fa-spinner fa-spin search-icon';
    }
}

function hideLoader() {
    const searchIcon = document.querySelector('#searchBox .search-icon');
    if (searchIcon) {
        searchIcon.className = 'fa-solid fa-magnifying-glass search-icon';
    }
    if (loaderScreen) loaderScreen.style.display = 'none';
}

// ─── TEXT-TO-SPEECH (VOICE SUMMARY) ───────────────────────────
if (speakBtn) {
    speakBtn.addEventListener('click', () => {
        if (!currentCityData || !currentCityData.cur) return;
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const c = currentCityData.cur;
            const text = currentLang === 'ur'
                ? `${c.name} میں اس وقت درجہ حرارت ${Math.round(c.main.temp)} ڈگری سینٹی گریڈ ہے اور مطلع ${URDU_DICT.conditions[c.weather[0].description.toLowerCase()] || c.weather[0].description} ہے۔`
                : `Currently in ${c.name}, the temperature is ${Math.round(c.main.temp)} degrees Celsius with ${c.weather[0].description}. Humidity is at ${c.main.humidity} percent with wind speeds of ${Math.round(c.wind.speed * 3.6)} kilometers per hour.`;

            const utterance = new SpeechSynthesisUtterance(text);
            if (currentLang === 'ur') utterance.lang = 'ur-PK';
            utterance.rate = 1.0;
            window.speechSynthesis.speak(utterance);
        } else {
            alert('Text-to-speech is not supported in your browser.');
        }
    });
}

// ─── WEB AUDIO AMBIENT SOUND GENERATOR ────────────────────────
if (ambienceBtn) {
    ambienceBtn.addEventListener('click', () => {
        if (!isAmbiencePlaying) {
            startRainSound();
            ambienceBtn.classList.add('active-sound');
            if (ambienceLabel) ambienceLabel.textContent = currentLang === 'ur' ? 'جاری' : 'Playing';
            isAmbiencePlaying = true;
        } else {
            stopRainSound();
            ambienceBtn.classList.remove('active-sound');
            if (ambienceLabel) ambienceLabel.textContent = currentLang === 'ur' ? 'صدا' : 'Sound';
            isAmbiencePlaying = false;
        }
    });
}

function startRainSound() {
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const bufferSize = audioCtx.sampleRate * 2;
        const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = audioCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = audioCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioCtx.currentTime);

        rainGainNode = audioCtx.createGain();
        rainGainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);

        whiteNoise.connect(filter);
        filter.connect(rainGainNode);
        rainGainNode.connect(audioCtx.destination);

        whiteNoise.start();
    } catch (e) { console.warn('Audio Ambience Error', e); }
}

function stopRainSound() {
    if (audioCtx) {
        audioCtx.close();
        audioCtx = null;
    }
}

// ─── HOURLY HORIZONTAL SCROLL CONTROLS ───────────────────────
const hourlyGridContainer = document.querySelector('.hourly-scroll-container');
const scrollLeftBtn = document.getElementById('scrollLeftHourly');
const scrollRightBtn = document.getElementById('scrollRightHourly');

if (scrollLeftBtn && hourlyGridContainer) {
    scrollLeftBtn.addEventListener('click', () => {
        hourlyGridContainer.scrollBy({ left: -260, behavior: 'smooth' });
    });
}
if (scrollRightBtn && hourlyGridContainer) {
    scrollRightBtn.addEventListener('click', () => {
        hourlyGridContainer.scrollBy({ left: 260, behavior: 'smooth' });
    });
}

// ─── LIVE VISITOR TRACKER PING ────────────────────────────────
function pingTracker() {
    if (window.apiConfig?.trackVisitor) {
        fetch(`${window.apiConfig.trackVisitor}?page=Client%20Dashboard`).catch(e => { });
    }
    if (window.apiConfig?.getVisitors) {
        fetch(window.apiConfig.getVisitors)
            .then(r => r.json())
            .then(d => {
                const badge = document.getElementById('liveBadge');
                const count = document.getElementById('liveMembersCount');
                if (badge && count && d.status === 'success') {
                    badge.style.display = 'flex';
                    count.textContent = d.active_members || 1;
                }
            }).catch(e => { });
    }
}
pingTracker();
setInterval(pingTracker, 30000);

// ─── 🕌 NAMAZ / PRAYER TIMES ──────────────────────────────────
async function fetchNamazTimes(lat, lng, cityName) {
    try {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        const url = `https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lng}&method=1`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.code !== 200 || !data.data) return;

        const t = data.data.timings;
        const prayers = [
            { id: 'namazFajr', time: t.Fajr },
            { id: 'namazDhuhr', time: t.Dhuhr },
            { id: 'namazAsr', time: t.Asr },
            { id: 'namazMaghrib', time: t.Maghrib },
            { id: 'namazIsha', time: t.Isha },
        ];

        const names = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

        const nowPK = new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' });
        const nowD = new Date(nowPK);
        const nowMin = nowD.getHours() * 60 + nowD.getMinutes();

        let nextIdx = -1;
        let minDiff = Infinity;

        prayers.forEach((p, i) => {
            const el = document.getElementById(p.id);
            if (el) {
                const [hh, mm2] = p.time.split(':').map(Number);
                const ampm = hh >= 12 ? 'PM' : 'AM';
                const h12 = hh % 12 || 12;
                el.textContent = `${h12}:${String(mm2).padStart(2, '0')} ${ampm}`;
            }

            const pMin = parseInt(p.time.split(':')[0]) * 60 + parseInt(p.time.split(':')[1]);
            const diff = pMin - nowMin;
            if (diff > 0 && diff < minDiff) {
                minDiff = diff;
                nextIdx = i;
            }
            const items = document.querySelectorAll('.namaz-time-pill');
            if (items[i]) items[i].classList.remove('namaz-active');
        });

        const items = document.querySelectorAll('.namaz-time-pill');
        if (nextIdx >= 0 && items[nextIdx]) {
            items[nextIdx].classList.add('namaz-active');
            const hrs = Math.floor(minDiff / 60);
            const mns = minDiff % 60;
            const timeLeft = hrs > 0 ? `${hrs}h ${mns}m` : `${mns}m`;
            const nextEl = document.getElementById('namazNextLabel');
            if (nextEl) nextEl.textContent = `Next: ${names[nextIdx]} in ${timeLeft}`;
        } else {
            const nextEl = document.getElementById('namazNextLabel');
            if (nextEl) nextEl.textContent = 'All prayers completed for today';
        }

        const tag = document.getElementById('namazCityTag');
        if (tag && cityName) tag.textContent = cityName;

    } catch (e) {
        const nextEl = document.getElementById('namazNextLabel');
        if (nextEl) nextEl.textContent = 'Prayer times unavailable offline';
    }
}

// ─── 💡 PAKISTAN WEATHER TIPS ROTATOR ─────────────────────────
const PK_TIPS = [
    { icon: '💧', text: 'Drink at least 2-3 litres of water daily during hot Pakistani summers. Dehydration is the #1 risk.' },
    { icon: '🌧️', text: 'During Monsoon (July–September), avoid low-lying areas. Flash floods can occur in minutes in Karachi, KPK, and Balochistan.' },
    { icon: '😷', text: 'Lahore smog season peaks Nov–Jan. Wear N95 masks outdoors and keep windows closed on high AQI days.' },
    { icon: '☀️', text: 'Multan and Sukkur reach 50°C+. Never leave children or animals in parked cars during summer afternoons.' },
    { icon: '❄️', text: 'Murree and Quetta winters are harsh. Keep emergency blankets and rock salt in your car during December–February.' },
    { icon: '⚡', text: 'Thunderstorms are common in Islamabad during June–August. Unplug electronics and stay indoors during lightning.' },
    { icon: '🌬️', text: 'Sindh Loo winds blow at 40-60 km/h during May–June. Wear sunglasses and cover skin to prevent heatstroke.' },
    { icon: '🌊', text: 'Gwadar and coastal Sindh face rough seas during monsoon. Check Met Office advisories before boating.' },
];

let currentTip = 0;
let tipInterval = null;

function renderTip(idx) {
    const tip = PK_TIPS[idx];
    const iconEl = document.getElementById('tipIcon');
    const textEl = document.getElementById('tipText');
    if (iconEl) iconEl.textContent = tip.icon;
    if (textEl) { textEl.textContent = tip.text; }
    const dotsEl = document.getElementById('tipDots');
    if (dotsEl) {
        dotsEl.innerHTML = PK_TIPS.map((_, i) =>
            `<div class="tip-dot ${i === idx ? 'active' : ''}" data-idx="${i}"></div>`
        ).join('');
        dotsEl.querySelectorAll('.tip-dot').forEach(d => {
            d.addEventListener('click', () => {
                currentTip = parseInt(d.dataset.idx);
                renderTip(currentTip);
                resetTipInterval();
            });
        });
    }
}

function resetTipInterval() {
    if (tipInterval) clearInterval(tipInterval);
    tipInterval = setInterval(() => {
        currentTip = (currentTip + 1) % PK_TIPS.length;
        renderTip(currentTip);
    }, 6000);
}

function initWeatherTips() {
    renderTip(0);
    resetTipInterval();
}

// ─── 📊 LIVE COMFORT INDEX RENDERER ───────────────────────────
function renderComfortIndex(cur) {
    const temp = cur.main.temp;
    const humidity = cur.main.humidity;
    const windSpeed = cur.wind ? cur.wind.speed * 3.6 : 0;
    const visKm = cur.visibility ? cur.visibility / 1000 : 10;

    const heatIndex = temp + (0.33 * (humidity / 100 * 6.1078 * Math.exp(17.27 * temp / (temp + 237.3)))) - 4.0;
    const heatPct = Math.min(100, Math.max(0, ((heatIndex - 20) / 30) * 100));
    const hBar = document.getElementById('heatIndexBar');
    const hVal = document.getElementById('heatIndexVal');
    if (hBar) hBar.style.width = `${heatPct}%`;
    if (hVal) hVal.textContent = `${Math.round(heatIndex)}°C`;

    const humBar = document.getElementById('humidityBar');
    const humVal = document.getElementById('humidityBarVal');
    if (humBar) humBar.style.width = `${humidity}%`;
    if (humVal) humVal.textContent = `${humidity}%`;

    const windPct = Math.min(100, (windSpeed / 80) * 100);
    const wBar = document.getElementById('windChillBar');
    const wVal = document.getElementById('windChillVal');
    if (wBar) wBar.style.width = `${windPct}%`;
    if (wVal) wVal.textContent = `${Math.round(windSpeed)} km/h`;

    let score = 10;
    if (temp > 40) score -= 3;
    else if (temp > 35) score -= 2;
    else if (temp < 10) score -= 2;
    if (humidity > 80) score -= 2;
    else if (humidity > 65) score -= 1;
    if (windSpeed > 50) score -= 2;
    else if (windSpeed > 30) score -= 1;
    if (visKm < 3) score -= 2;
    else if (visKm < 7) score -= 1;
    score = Math.max(1, Math.min(10, score));

    const scoreEl = document.getElementById('comfortScoreVal');
    if (scoreEl) {
        scoreEl.textContent = `${score}/10`;
        scoreEl.style.color = score >= 7 ? '#34d399' : score >= 4 ? '#fbbf24' : '#f87171';
    }
}
