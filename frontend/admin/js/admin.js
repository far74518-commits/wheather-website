// frontend/admin/admin.js – Admin Dashboard Management Suite

document.addEventListener('DOMContentLoaded', () => {

    // ─── CHECK LOGIN SESSION ──────────────────────────────────────
    if (sessionStorage.getItem('adminLoggedIn')) {
        showDashboard();
    }

    // ─── TAB SWITCHING SYSTEM ─────────────────────────────────────
    window.switchTab = function(tabName) {
        // Hide all tab panes
        document.querySelectorAll('.tab-pane').forEach(el => el.style.display = 'none');
        
        // Remove active class from nav buttons
        document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

        // Show target tab pane
        const targetId = 'tab' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
        const targetPane = document.getElementById(targetId);
        if (targetPane) targetPane.style.display = 'block';

        // Highlight nav item
        const navId = 'nav' + tabName.charAt(0).toUpperCase() + tabName.slice(1);
        const navEl = document.getElementById(navId);
        if (navEl) navEl.classList.add('active');

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');

        // Load data specific to tabs
        if (tabName === 'overview')   loadOverviewData();
        if (tabName === 'cities')     loadCitiesData();
        if (tabName === 'broadcast')  loadBroadcastData();
        if (tabName === 'settings')   loadSettingsData();
        if (tabName === 'stats')      loadStatsData();
        if (tabName === 'activity')   loadActivityLogs();
        if (tabName === 'visitors')   loadVisitors();
    };

    // ─── MOBILE SIDEBAR TOGGLE ────────────────────────────────────
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
        });
    }

    // ─── LOGIN FLOW ───────────────────────────────────────────────
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('loginBtn');
            const err = document.getElementById('loginError');
            if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Authenticating...';
            if (err) err.style.display = 'none';

            try {
                const res = await fetch(window.apiConfig.login, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: document.getElementById('username')?.value.trim() || '',
                        password: document.getElementById('password')?.value || ''
                    })
                });
                const data = await res.json();
                if (data.status === 'success') {
                    sessionStorage.setItem('adminLoggedIn', 'true');
                    addLogEvent('Admin login successful', 'Success');
                    showDashboard();
                } else {
                    if (err) {
                        err.textContent = data.message || 'Invalid username or password';
                        err.style.display = 'block';
                    }
                    if (btn) btn.innerHTML = '<span>Sign In</span><i class="fa-solid fa-arrow-right"></i>';
                }
            } catch(e) {
                if (err) {
                    err.textContent = 'Connection failed. Check backend server / XAMPP.';
                    err.style.display = 'block';
                }
                if (btn) btn.innerHTML = '<span>Sign In</span><i class="fa-solid fa-arrow-right"></i>';
            }
        });
    }

    // ─── LOGOUT ───────────────────────────────────────────────────
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            sessionStorage.removeItem('adminLoggedIn');
            location.reload();
        });
    }

    // ─── SHOW DASHBOARD ───────────────────────────────────────────
    function showDashboard() {
        document.getElementById('loginSection').style.display     = 'none';
        document.getElementById('dashboardSection').style.display = 'flex';
        switchTab('overview');
    }

    // ─── LOAD OVERVIEW TAB ────────────────────────────────────────
    async function loadOverviewData() {
        // Cities count
        try {
            const r = await fetch(window.apiConfig.getCities);
            const d = await r.json();
            const cities = d.data || [];
            document.getElementById('ovCityCount').textContent = cities.length;

            const topEl = document.getElementById('ovTopCities');
            if (cities.length > 0) {
                topEl.innerHTML = cities.slice(0, 5).map((c, i) => `
                    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:rgba(0,0,0,0.15);border-radius:10px;margin-bottom:8px;">
                        <span style="font-weight:700;">#${i+1} ${c.name}</span>
                        <span style="font-size:0.78rem;color:#94a3b8;">Lat: ${parseFloat(c.lat).toFixed(2)}° | Lng: ${parseFloat(c.lng).toFixed(2)}°</span>
                    </div>
                `).join('');
            } else {
                topEl.innerHTML = '<div style="color:#94a3b8;font-size:0.85rem;padding:10px;">No cities saved.</div>';
            }
        } catch(e) {}

        // Search count
        try {
            const r = await fetch(window.apiConfig.getSearchStats);
            const d = await r.json();
            const total = (d.data?.cities || []).reduce((a,b) => a + parseInt(b.count||0), 0);
            document.getElementById('ovSearchCount').textContent = total;
        } catch(e) { document.getElementById('ovSearchCount').textContent = '0'; }

        // Live members count
        try {
            const r = await fetch(window.apiConfig.getVisitors);
            const d = await r.json();
            const el = document.getElementById('ovLiveMembers');
            if (el && d.status === 'success') el.textContent = d.active_members || 0;
        } catch(e) {}
    }

    // ─── LOAD CITIES TAB ──────────────────────────────────────────
    let allLoadedCities = [];
    async function loadCitiesData() {
        const listEl  = document.getElementById('adminCitiesList');
        const countEl = document.getElementById('cityCount');
        listEl.innerHTML = '<div class="mini-loader-wrap"><div class="mini-spinner"></div></div>';

        try {
            const res  = await fetch(window.apiConfig.getCities);
            const data = await res.json();
            allLoadedCities = data.data || [];
            countEl.textContent = allLoadedCities.length;
            renderCitiesList(allLoadedCities);
        } catch(e) {
            listEl.innerHTML = '<p style="color:#94a3b8;padding:20px;">Failed to load cities from database.</p>';
        }
    }

    function renderCitiesList(cities) {
        const listEl = document.getElementById('adminCitiesList');
        listEl.innerHTML = '';
        if (cities.length === 0) {
            listEl.innerHTML = '<p style="color:#94a3b8;padding:20px;">No cities found.</p>';
            return;
        }

        cities.forEach(city => {
            const row = document.createElement('div');
            row.className = 'city-row';
            row.id = `cityRow-${city.id}`;
            row.innerHTML = `
                <div class="city-row-info">
                    <div class="city-row-name"><i class="fa-solid fa-location-dot" style="color:#3b82f6;margin-right:6px;"></i>${city.name}</div>
                    <div class="city-row-coords">Lat: ${city.lat} | Lng: ${city.lng}</div>
                </div>
                <button class="btn-delete" onclick="deleteCity(${city.id}, '${city.name}')">
                    <i class="fa-solid fa-trash"></i> Remove
                </button>
            `;
            listEl.appendChild(row);
        });
    }

    // Filter cities input
    const filterInput = document.getElementById('filterCitiesInput');
    if (filterInput) {
        filterInput.addEventListener('input', () => {
            const q = filterInput.value.toLowerCase().trim();
            const filtered = allLoadedCities.filter(c => c.name.toLowerCase().includes(q));
            renderCitiesList(filtered);
        });
    }

    // AUTO-GEOCODE COORDINATES LOOKUP
    document.getElementById('autoGeocodeBtn').addEventListener('click', async () => {
        const cityName = document.getElementById('addCityName').value.trim();
        if (!cityName) {
            alert('Please enter a city name first.');
            return;
        }
        const btn = document.getElementById('autoGeocodeBtn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Fetching...';

        try {
            const res = await fetch(window.OWM.geo(cityName));
            const data = await res.json();
            if (data && data.length > 0) {
                document.getElementById('addLat').value = data[0].lat.toFixed(4);
                document.getElementById('addLng').value = data[0].lon.toFixed(4);
                addLogEvent(`Auto-geocoded coordinates for ${cityName}`, 'Success');
            } else {
                alert(`Could not auto-find coordinates for "${cityName}". Please enter manually.`);
            }
        } catch(e) {
            alert('Geocoding search failed. Check network.');
        }
        btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i> Auto-Fetch';
    });

    // ADD CITY SUBMIT
    document.getElementById('addCityForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const msgEl = document.getElementById('addMsg');
        const errEl = document.getElementById('addError');
        msgEl.style.display = errEl.style.display = 'none';

        const payload = {
            name: document.getElementById('addCityName').value.trim(),
            lat:  parseFloat(document.getElementById('addLat').value),
            lng:  parseFloat(document.getElementById('addLng').value)
        };

        try {
            const res  = await fetch(window.apiConfig.addCity, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status === 'success') {
                msgEl.textContent = `✓ ${payload.name} saved successfully!`;
                msgEl.style.display = 'block';
                document.getElementById('addCityForm').reset();
                addLogEvent(`Added city: ${payload.name}`, 'Success');
                loadCitiesData();
            } else {
                errEl.textContent = data.message || 'Failed to add city.';
                errEl.style.display = 'block';
            }
        } catch {
            errEl.textContent = 'Server connection error.';
            errEl.style.display = 'block';
        }
        setTimeout(() => { msgEl.style.display = errEl.style.display = 'none'; }, 4000);
    });

    // DELETE CITY
    window.deleteCity = async (id, name) => {
        if (!confirm(`Are you sure you want to remove ${name}?`)) return;
        try {
            const res = await fetch(`${window.apiConfig.deleteCity}?id=${id}`, { method: 'DELETE' });
            const data = await res.json();
            if (data.status === 'success') {
                addLogEvent(`Removed city: ${name}`, 'Warning');
                loadCitiesData();
            } else {
                alert(data.message || 'Delete failed.');
            }
        } catch {
            alert('Connection error.');
        }
    };

    // ─── LOAD BROADCAST / EMERGENCY WARNINGS TAB ──────────────────
    async function loadBroadcastData() {
        try {
            const res = await fetch(window.apiConfig.getSettings);
            const data = await res.json();
            if (data.status === 'success' && data.data?.custom_alert) {
                document.getElementById('alertTextInput').value = data.data.custom_alert;
            }
        } catch(e) {}
    }

    document.getElementById('broadcastForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = document.getElementById('alertTextInput').value.trim();
        const msgEl = document.getElementById('broadcastMsg');
        msgEl.style.display = 'none';

        try {
            const res = await fetch(window.apiConfig.saveSettings, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'custom_alert', value: text })
            });
            const data = await res.json();
            if (data.status === 'success') {
                msgEl.textContent = '✓ Emergency alert published to live website!';
                msgEl.style.display = 'block';
                addLogEvent(`Published emergency weather alert: "${text.slice(0, 30)}..."`, 'Warning');
            }
        } catch(e) {
            alert('Failed to publish alert.');
        }
        setTimeout(() => msgEl.style.display = 'none', 4000);
    });

    document.getElementById('clearAlertBtn').addEventListener('click', async () => {
        document.getElementById('alertTextInput').value = '';
        try {
            await fetch(window.apiConfig.saveSettings, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'custom_alert', value: '' })
            });
            addLogEvent('Cleared custom weather alert banner', 'Info');
            alert('Alert cleared.');
        } catch(e) {}
    });

    // ─── LOAD API SETTINGS TAB ────────────────────────────────────
    async function loadSettingsData() {
        try {
            const res  = await fetch(window.apiConfig.getSettings);
            const data = await res.json();
            if (data.status === 'success') {
                const key = data.data.owm_api_key || '';
                const input = document.getElementById('owmApiKey');
                input.value = key;
                const masked = key ? key.substring(0, 6) + '••••••••••••••••' + key.slice(-4) : 'Not configured';
                document.getElementById('currentKeyDisplay').textContent = masked;
            }
        } catch(e) {
            document.getElementById('currentKeyDisplay').textContent = 'Error loading settings';
        }
    }

    document.getElementById('toggleKeyBtn').addEventListener('click', () => {
        const input = document.getElementById('owmApiKey');
        const icon  = document.getElementById('toggleKeyIcon');
        if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fa-solid fa-eye-slash';
        } else {
            input.type = 'password';
            icon.className = 'fa-solid fa-eye';
        }
    });

    // TEST API KEY
    document.getElementById('testKeyBtn').addEventListener('click', async () => {
        const key = document.getElementById('owmApiKey').value.trim();
        const ok  = document.getElementById('testResult');
        const err = document.getElementById('testError');
        ok.style.display = err.style.display = 'none';

        if (!key) { err.textContent = 'Please enter an API key.'; err.style.display = 'block'; return; }

        const btn = document.getElementById('testKeyBtn');
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Testing...';

        try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Islamabad&appid=${key}&units=metric`);
            const d   = await res.json();
            if (d.cod === 200) {
                ok.textContent = `✓ API key active! Verified response: ${d.name} (${Math.round(d.main.temp)}°C)`;
                ok.style.display = 'block';
                addLogEvent('Tested OpenWeatherMap API key - Validated', 'Success');
            } else {
                err.textContent = `✗ Invalid Key: ${d.message}`;
                err.style.display = 'block';
            }
        } catch {
            err.textContent = '✗ Network test error.';
            err.style.display = 'block';
        }
        btn.innerHTML = '<i class="fa-solid fa-vial"></i> Test Key';
    });

    // SAVE API KEY
    document.getElementById('apiKeyForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const key     = document.getElementById('owmApiKey').value.trim();
        const saveMsg = document.getElementById('saveKeyMsg');
        const saveErr = document.getElementById('saveKeyError');
        saveMsg.style.display = saveErr.style.display = 'none';

        try {
            const res  = await fetch(window.apiConfig.saveSettings, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: 'owm_api_key', value: key })
            });
            const data = await res.json();
            if (data.status === 'success') {
                window.OWM_KEY = key;
                saveMsg.textContent = '✓ OWM API key saved successfully!';
                saveMsg.style.display = 'block';
                addLogEvent('Updated system OWM API key', 'Success');
                loadSettingsData();
            } else {
                saveErr.textContent = data.message || 'Save failed.';
                saveErr.style.display = 'block';
            }
        } catch {
            saveErr.textContent = 'Connection error while saving.';
            saveErr.style.display = 'block';
        }
        setTimeout(() => { saveMsg.style.display = saveErr.style.display = 'none'; }, 4000);
    });

    // ─── LOAD SEARCH ANALYTICS ────────────────────────────────────
    async function loadStatsData() {
        const container = document.getElementById('statsContainer');
        const countEl = document.getElementById('totalSearchesCount');
        container.innerHTML = '<div class="mini-loader-wrap"><div class="mini-spinner"></div></div>';

        try {
            const res = await fetch(window.apiConfig.getSearchStats);
            const data = await res.json();

            if (data.status === 'success' && data.data) {
                container.innerHTML = '';
                const total = data.data.total || 0;
                countEl.textContent = total;

                if (!data.data.cities || data.data.cities.length === 0) {
                    container.innerHTML = '<p style="color:#94a3b8;padding:20px 0;">No searches logged today.</p>';
                    return;
                }

                data.data.cities.forEach(stat => {
                    const row = document.createElement('div');
                    row.className = 'stat-row';
                    row.innerHTML = `
                        <div class="stat-header">
                            <span class="stat-city">${stat.city}</span>
                            <span class="stat-percent">${stat.percentage}% (${stat.count} searches)</span>
                        </div>
                        <div class="stat-bar-container">
                            <div class="stat-bar" style="width: 0%"></div>
                        </div>
                    `;
                    container.appendChild(row);
                    setTimeout(() => {
                        row.querySelector('.stat-bar').style.width = `${stat.percentage}%`;
                    }, 50);
                });
            }
        } catch(e) {
            container.innerHTML = '<p style="color:#94a3b8;padding:20px 0;">Failed to load search statistics.</p>';
        }
    }

    // ─── LOG EVENT SYSTEM ─────────────────────────────────────────
    const logs = [
        { title: 'System Boot & Admin Login', desc: 'Administrator logged into the dashboard', time: 'Just now', type: 'Success' }
    ];

    function addLogEvent(title, type='Info') {
        const time = new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
        logs.unshift({ title, desc: title, time, type });
        loadActivityLogs();
    }

    function loadActivityLogs() {
        const container = document.getElementById('fullActivityLogList');
        if (!container) return;

        container.innerHTML = logs.map(l => `
            <div class="log-item">
                <div class="log-icon log-green"><i class="fa-solid fa-circle-info"></i></div>
                <div class="log-body">
                    <div class="log-title">${l.title}</div>
                    <div class="log-desc">${l.desc}</div>
                    <div class="log-time"><i class="fa-regular fa-clock"></i> ${l.time}</div>
                </div>
                <div class="log-tag tag-success">${l.type}</div>
            </div>
        `).join('');
    }

    const clearLogsBtn = document.getElementById('clearLogsBtn');
    if (clearLogsBtn) {
        clearLogsBtn.addEventListener('click', () => {
            logs.length = 0;
            loadActivityLogs();
        });
    }

    // ─── LIVE VISITORS ───────────────────────────────────────────
    window.loadVisitors = async function() {
        try {
            const r = await fetch(window.apiConfig.getVisitors);
            const d = await r.json();
            if (d.status !== 'success') return;

            const count = d.active_members || 0;
            const topPage = d.most_visited_page || 'N/A';
            const pageStats = d.page_stats || {};

            const liveCountEl     = document.getElementById('liveCount');
            const mostVisitedEl   = document.getElementById('mostVisitedPage');
            const lastRefreshEl   = document.getElementById('lastRefresh');
            const navBadge        = document.getElementById('navVisitorsBadge');
            const breakdownEl     = document.getElementById('visitorPageBreakdown');

            if (liveCountEl)   liveCountEl.textContent   = count;
            if (mostVisitedEl) mostVisitedEl.textContent = topPage;
            if (navBadge)      navBadge.textContent       = count;
            if (lastRefreshEl) {
                const now = new Date();
                lastRefreshEl.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            }

            // Page breakdown table
            if (breakdownEl) {
                if (Object.keys(pageStats).length === 0) {
                    breakdownEl.innerHTML = '<div style="text-align:center;padding:40px;color:#94a3b8;"><i class="fa-solid fa-users-slash" style="font-size:2rem;margin-bottom:12px;display:block;"></i>No active visitors right now</div>';
                } else {
                    const maxCount = Math.max(...Object.values(pageStats));
                    breakdownEl.innerHTML = Object.entries(pageStats).map(([page, cnt]) => {
                        const pct = Math.round((cnt / maxCount) * 100);
                        return `
                            <div style="margin-bottom:20px;">
                                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                                    <span style="font-weight:600;font-size:0.95rem;">
                                        <i class="fa-solid fa-globe" style="color:#60a5fa;margin-right:8px;"></i>${page}
                                    </span>
                                    <span style="background:rgba(0,255,136,0.15);color:#00ff88;font-weight:700;padding:2px 10px;border-radius:12px;font-size:0.85rem;">${cnt} active</span>
                                </div>
                                <div style="background:rgba(255,255,255,0.05);border-radius:8px;height:10px;overflow:hidden;">
                                    <div style="background:linear-gradient(90deg,#00ff88,#00cc66);height:100%;width:${pct}%;border-radius:8px;transition:width 0.8s ease;"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch(e) {
            console.warn('Visitors load failed', e);
        }
    };

    // Admin self-tracker: ping as 'Admin Panel'
    function pingAdminTracker() {
        if (window.apiConfig && window.apiConfig.trackVisitor) {
            fetch(`${window.apiConfig.trackVisitor}?page=Admin%20Panel`).catch(()=>{});
        }
        // Update nav badge
        if (window.apiConfig && window.apiConfig.getVisitors) {
            fetch(window.apiConfig.getVisitors)
                .then(r => r.json())
                .then(d => {
                    const badge = document.getElementById('navVisitorsBadge');
                    if (badge && d.status === 'success') {
                        badge.textContent = d.active_members || 0;
                    }
                }).catch(()=>{});
        }
    }
    pingAdminTracker();
    setInterval(pingAdminTracker, 30000);

});
