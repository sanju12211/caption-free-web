import './style.css'

const app = document.querySelector('#app');

// Backend API — same host as frontend (localhost বা 127.0.0.1), port 8000
const API_BASE = typeof window !== 'undefined' ? `http://${window.location.hostname}:8000` : 'http://127.0.0.1:8000';

// Dummy Admin Credentials (frontend-only for now)
const ADMIN_CREDENTIALS = {
  email: 'sanjidmia999@gmail.com',
  password: '1122@@##'
};

// Global State — use backend token
function getToken() { return localStorage.getItem('qos_token'); }
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('qos_user') || '{}'); } catch { return {}; }
}
let isLoggedIn = !!getToken();
let isProfileVisible = false;
let currentView = 'dashboard';
let selectedCaptionCategory = 'default';

// Router logic
function navigate() {
  const path = window.location.pathname;

  if (path === '/admin/login') {
    renderAdminLogin();
  } else if (path === '/admin/dashboard') {
    renderAdminDashboard();
  } else if (path === '/user/login') {
    renderUserLogin();
  } else if (path === '/user/register') {
    renderUserRegister();
  } else if (path === '/user/captions') {
    if (!getToken()) { window.history.replaceState(null, null, '/user/login'); renderUserLogin(); return; }
    isLoggedIn = true;
    currentView = 'captions';
    isProfileVisible = false;
    renderUnifiedLayout();
  } else if (path === '/user/emoji-create') {
    if (!getToken()) { window.history.replaceState(null, null, '/user/login'); renderUserLogin(); return; }
    isLoggedIn = true;
    currentView = 'emoji';
    isProfileVisible = false;
    renderUnifiedLayout();
  } else if (path === '/user/dashboard') {
    if (!getToken()) { window.history.replaceState(null, null, '/user/login'); renderUserLogin(); return; }
    isLoggedIn = true;
    currentView = 'dashboard';
    renderUnifiedLayout();
  } else if (path === '/logout') {
    isLoggedIn = false;
    isProfileVisible = false;
    currentView = 'dashboard';
    localStorage.removeItem('qos_token');
    localStorage.removeItem('qos_user');
    localStorage.removeItem('qos_logged_in');
    window.history.replaceState(null, null, '/');
    renderUnifiedLayout();
  } else {
    isLoggedIn = !!getToken();
    if (!isLoggedIn) {
      isProfileVisible = false;
      currentView = 'dashboard';
    }
    renderUnifiedLayout();
  }
}

function renderUnifiedLayout() {
  const profileActiveStyle = isProfileVisible ? 'background: rgba(99, 102, 241, 0.2); border: 1px solid var(--primary);' : '';

  app.innerHTML = `
    <div style="display: flex; min-height: 100vh;">

      <!-- Premium Permanent Sidebar -->
      <aside style="
        width: 255px; min-width: 255px; height: 100vh;
        position: sticky; top: 0;
        background: linear-gradient(160deg, #0d1130 0%, #0a0e23 60%, #0d1130 100%);
        border-right: 1px solid rgba(99,102,241,0.2);
        padding: 0;
        display: flex; flex-direction: column;
        overflow-y: auto;
        box-shadow: 4px 0 24px rgba(0,0,0,0.4);
      ">
        <!-- Sidebar Logo Area -->
        <div style="
          padding: 1.6rem 1.4rem 1.4rem;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          background: linear-gradient(135deg, rgba(99,102,241,0.12) 0%, transparent 100%);
        ">
          <a href="/" class="logo" data-link style="font-size: 1.35rem; letter-spacing: -0.5px;">QuantumOS</a>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.25rem; letter-spacing: 0.05em;">Premium Dashboard</div>
        </div>

        <div style="padding: 1.2rem 1rem; flex: 1; display: flex; flex-direction: column;">
          ${isLoggedIn ? `
            <!-- User Info Card -->
            <div style="
              display: flex; align-items: center; gap: 0.85rem;
              padding: 0.85rem 1rem;
              background: linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.1) 100%);
              border-radius: 14px; margin-bottom: 1.4rem;
              border: 1px solid rgba(99,102,241,0.25);
              box-shadow: 0 0 20px rgba(99,102,241,0.08);
            ">
              <div class="profile-circle" style="width: 40px; height: 40px; font-size: 1rem; flex-shrink: 0; box-shadow: 0 0 12px rgba(99,102,241,0.5);">${(getCurrentUser().full_name || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">${getCurrentUser().full_name || 'User'}</div>
                <div style="color: var(--text-muted); font-size: 0.72rem;">${getCurrentUser().email || ''}</div>
              </div>
            </div>

            <div class="sidebar-section-label">Main Menu</div>
            <a href="/user/dashboard" class="sidebar-link ${currentView === 'dashboard' && !isProfileVisible ? 'sidebar-link-active' : ''}" data-link>
              <span class="sb-icon">🏠</span> Dashboard
            </a>
            <a href="/user/captions" class="sidebar-link ${currentView === 'captions' ? 'sidebar-link-active' : ''}" data-link>
              <span class="sb-icon">✍️</span> Caption Page
            </a>
            <a href="/user/emoji-create" class="sidebar-link ${currentView === 'emoji' ? 'sidebar-link-active' : ''}" data-link>
              <span class="sb-icon">😀</span> Emoji Create
            </a>

            <div class="sidebar-section-label" style="margin-top: 1.2rem;">Tools</div>
            <a href="#" class="sidebar-link">
              <span class="sb-icon">🔔</span> Notifications
              <span style="margin-left: auto; background: linear-gradient(135deg,#6366f1,#a855f7); color: white; font-size: 0.62rem; padding: 0.15rem 0.5rem; border-radius: 99px; font-weight: 700;">3</span>
            </a>
            <a href="#" class="sidebar-link"><span class="sb-icon">📦</span> My Orders</a>
            <a href="#" class="sidebar-link"><span class="sb-icon">📊</span> Analytics</a>

            <div class="sidebar-section-label" style="margin-top: 1.2rem;">Account</div>
            <a href="#" class="sidebar-link ${isProfileVisible ? 'sidebar-link-active' : ''}" id="sidebar-profile-btn"><span class="sb-icon">⚙️</span> Profile Settings</a>
            <a href="#" class="sidebar-link"><span class="sb-icon">🛡️</span> Security</a>

            <div style="flex: 1;"></div>
            <div style="border-top: 1px solid rgba(255,255,255,0.06); padding-top: 1rem; margin-top: 1rem;">
              <a href="/logout" class="sidebar-link" data-link style="color: #f43f5e;">
                <span class="sb-icon">🚪</span> Logout
              </a>
            </div>
          ` : `
            <div class="sidebar-section-label">Get Started</div>
            <a href="/" class="sidebar-link sidebar-link-active" data-link><span class="sb-icon">🏠</span> Home</a>
            <a href="/user/login" class="sidebar-link" data-link><span class="sb-icon">🔐</span> Login</a>
            <a href="/user/register" class="sidebar-link" data-link><span class="sb-icon">🚀</span> Create Account</a>

            <div class="sidebar-section-label" style="margin-top: 1.2rem;">Features</div>
            <a href="/user/login" class="sidebar-link" data-link><span class="sb-icon">✍️</span> Caption Generator</a>
          `}
        </div>
      </aside>

      <!-- Main Content Area -->
      <div style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <header class="animate-fade" style="margin-bottom: 0;">
          <div></div>
          <nav class="nav-links">
            ${isLoggedIn ? `
              <button id="toggle-profile" class="profile-link btn-secondary" style="background: none; border: none; padding: 0.5rem 1rem; border-radius: 20px; cursor: pointer; ${profileActiveStyle}">
                  <div class="profile-circle">${(getCurrentUser().full_name || 'U').charAt(0).toUpperCase()}</div>
                  <span style="font-weight: 600; color: var(--text-main);">My Profile</span>
              </button>
              <a href="/logout" id="logout-btn" data-link style="color: var(--accent); font-weight: 600;">Logout</a>
            ` : `
              <a href="/user/login" class="btn btn-primary" style="text-decoration: none; width: auto; padding: 0.5rem 1.5rem;" data-link>Login</a>
              <a href="/user/register" class="btn btn-secondary" style="text-decoration: none; width: auto; padding: 0.5rem 1.5rem;" data-link>Join Free</a>
            `}
          </nav>
        </header>

        <main id="user-main-content" class="animate-fade" style="padding: 2rem; flex: 1;">
          ${isLoggedIn && isProfileVisible ? getUserProfileHTML() : (currentView === 'captions' ? getUserCaptionsHTML() : currentView === 'emoji' ? getEmojiCreateHTML() : getDashboardHTML())}
        </main>
      </div>
    </div>
  `;

  attachLinkListeners();

  // No toggle needed - sidebar is always visible

  if (isLoggedIn) {
    document.getElementById('toggle-profile')?.addEventListener('click', () => {
      isProfileVisible = !isProfileVisible;
      renderUnifiedLayout();
    });

    if (isProfileVisible) {
      document.getElementById('profile-edit-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = [document.getElementById('profile-first-name')?.value?.trim(), document.getElementById('profile-last-name')?.value?.trim()].filter(Boolean).join(' ') || getCurrentUser().full_name;
        const bio = document.getElementById('profile-bio')?.value?.trim() ?? '';
        try {
          const res = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ full_name: fullName, bio }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { alert(data.detail || 'প্রোফাইল আপডেট ব্যর্থ।'); return; }
          const u = getCurrentUser();
          u.full_name = fullName;
          u.bio = bio;
          localStorage.setItem('qos_user', JSON.stringify(u));
          alert('অভিনন্দন! আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে।');
          renderUnifiedLayout();
        } catch (err) {
          alert('নেটওয়ার্ক ত্রুটি। ব্যাকএন্ড চালু আছে কিনা দেখুন।');
        }
      });
    }

    if (currentView === 'captions') {
      document.querySelectorAll('.caption-cat-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          selectedCaptionCategory = btn.dataset.category || 'default';
          renderUnifiedLayout();
        });
      });
      document.getElementById('caption-gen-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const keyword = document.getElementById('caption-topic').value.trim();
        const resultArea = document.getElementById('caption-result');
        resultArea.style.display = 'block';
        resultArea.innerHTML = '<div style="color: var(--text-muted);">Generating…</div>';
        try {
          const res = await fetch(`${API_BASE}/generate-caption`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${getToken()}` },
            body: JSON.stringify({ keyword, category: selectedCaptionCategory }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) { resultArea.innerHTML = `<div class="error">${data.detail || 'ত্রুটি।'}</div>`; return; }
          resultArea.innerHTML = `
                <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 12px; margin-top: 1rem; border: 1px dashed var(--primary);">
                    <p style="color: var(--text-main); font-style: italic;">"${(data.caption || '').replace(/"/g, '&quot;')}"</p>
                    <button class="btn btn-secondary copy-caption-btn" style="margin-top: 0.5rem; width: auto; font-size: 0.8rem;">Copy Caption</button>
                </div>
            `;
          resultArea.querySelector('.copy-caption-btn')?.addEventListener('click', () => {
            navigator.clipboard?.writeText(data.caption).then(() => alert('কপি হয়েছে!'));
          });
        } catch (err) {
          resultArea.innerHTML = '<div style="color: #f43f5e;">নেটওয়ার্ক ত্রুটি। ব্যাকএন্ড চালু আছে কিনা দেখুন।</div>';
        }
      });
    }
    if (currentView === 'emoji') {
      const compose = document.getElementById('emoji-compose');
      document.querySelectorAll('.emoji-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (compose) compose.value += btn.dataset.emoji || '';
        });
      });
      document.getElementById('emoji-copy-btn')?.addEventListener('click', () => {
        if (!compose) return;
        const text = compose.value;
        if (!text.trim()) { alert('প্রথমে কিছু লিখুন বা ইমোজি যোগ করুন।'); return; }
        navigator.clipboard?.writeText(text).then(() => alert('কপি হয়েছে!')).catch(() => alert('কপি ব্যর্থ।'));
      });
    }
  }
}

function getDashboardHTML() {
  if (!isLoggedIn) {
    return `<div></div>`;
  }

  return `<div></div>`;
}

// Emoji categories for Emoji Create
const EMOJI_SETS = {
  smileys: ['😀','😃','😄','😁','😅','😂','🤣','😊','😇','🙂','😉','😍','🥰','😘','😗','😋','😛','😜','🤪','😎'],
  hearts: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💕','💖','💗','💘','💝','💞','💓','💔','❤️‍🔥','❤️‍🩹','💋'],
  gestures: ['👍','👎','👏','🙌','👋','🤝','✌️','🤞','🤟','🤘','👌','🤌','🤏','✋','🖐️','👈','👉','👆','👇','☝️'],
  nature: ['🌸','🌺','🌻','🌹','🌷','💐','🍀','🌿','🍁','🍂','🌈','☀️','🌙','⭐','🔥','💧','🌊','✨','🌟','💫'],
  objects: ['📱','💻','⌨️','🖥️','📷','🎵','🎶','🎬','📚','✏️','📌','📍','🎯','✅','❌','💡','🔔','🎁','🏆','🎉'],
};

function getEmojiCreateHTML() {
  const categories = Object.entries(EMOJI_SETS).map(([key, emojis]) => `
    <div style="background: var(--bg-card); padding: 1.25rem; border-radius: 16px; border: 1px solid var(--glass-border);">
      <h4 style="margin-bottom: 0.75rem; color: var(--text-muted); font-size: 0.85rem;">${key}</h4>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        ${emojis.map(e => `<button type="button" class="emoji-btn" data-emoji="${e}" style="font-size: 1.5rem; padding: 0.35rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 10px; cursor: pointer;">${e}</button>`).join('')}
      </div>
    </div>
  `).join('');
  return `
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 800px; margin: 0 auto;">
      <div style="background: var(--bg-card); padding: 2rem; border-radius: 24px; border: 1px solid var(--glass-border); text-align: center;">
        <h2 style="font-size: 2.5rem; margin-bottom: 0.5rem;">Emoji Create 😀</h2>
        <p style="color: var(--text-muted);">টেক্সট লিখুন, ইমোজি ক্লিক করে যোগ করুন, তারপর কপি করুন।</p>
      </div>
      <div style="background: var(--bg-card); padding: 2rem; border-radius: 24px; border: 1px solid var(--glass-border);">
        <label style="display: block; margin-bottom: 0.5rem; color: var(--text-muted);">আপনার টেক্সট + ইমোজি</label>
        <textarea id="emoji-compose" placeholder="এখানে লিখুন এবং নিচের ইমোজি ক্লিক করে যোগ করুন..." style="width: 100%; min-height: 120px; padding: 1rem; background: rgba(255,255,255,0.05); border: 1px solid var(--glass-border); border-radius: 12px; color: var(--text-main); font-size: 1rem; resize: vertical;"></textarea>
        <button type="button" id="emoji-copy-btn" class="btn btn-primary" style="margin-top: 1rem; width: auto;">কপি করুন</button>
      </div>
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        ${categories}
      </div>
    </div>
  `;
}

function getUserCaptionsHTML() {
  return `
      <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 900px; margin: 0 auto;">
        <div style="background: var(--bg-card); padding: 2.5rem; border-radius: 24px; border: 1px solid var(--glass-border); text-align: center;">
          <h2 style="font-size: 2.5rem; margin-bottom: 1rem;">Caption Generator ✍️</h2>
          <p style="color: var(--text-muted);">আপনার মুড বা ক্যাটাগরি অনুযায়ী সেরা ক্যাপশন বেছে নিন।</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem;">
            <!-- Category Selector -->
            <aside style="background: var(--bg-card); padding: 1.5rem; border-radius: 20px; border: 1px solid var(--glass-border); height: fit-content;">
                <h4 style="margin-bottom: 1rem;">Categories</h4>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    <button type="button" class="btn btn-secondary caption-cat-btn" data-category="attitude" style="width: 100%; text-align: left; padding: 0.75rem; ${selectedCaptionCategory === 'attitude' ? 'background: rgba(99, 102, 241, 0.2); border-color: var(--primary);' : ''}">🔥 Attitude</button>
                    <button type="button" class="btn btn-secondary caption-cat-btn" data-category="funny" style="width: 100%; text-align: left; padding: 0.75rem; ${selectedCaptionCategory === 'funny' ? 'background: rgba(99, 102, 241, 0.2); border-color: var(--primary);' : ''}">😊 Funny</button>
                    <button type="button" class="btn btn-secondary caption-cat-btn" data-category="sad" style="width: 100%; text-align: left; padding: 0.75rem; ${selectedCaptionCategory === 'sad' ? 'background: rgba(99, 102, 241, 0.2); border-color: var(--primary);' : ''}">💔 Sad</button>
                    <button type="button" class="btn btn-secondary caption-cat-btn" data-category="love" style="width: 100%; text-align: left; padding: 0.75rem; ${selectedCaptionCategory === 'love' ? 'background: rgba(99, 102, 241, 0.2); border-color: var(--primary);' : ''}">❤️ Love</button>
                    <button type="button" class="btn btn-secondary caption-cat-btn" data-category="travel" style="width: 100%; text-align: left; padding: 0.75rem; ${selectedCaptionCategory === 'travel' ? 'background: rgba(99, 102, 241, 0.2); border-color: var(--primary);' : ''}">🏝️ Travel</button>
                </div>
            </aside>

            <!-- Main Generator -->
            <div style="display: flex; flex-direction: column; gap: 2rem;">
                <div style="background: var(--bg-card); padding: 2rem; border-radius: 24px; border: 1px solid var(--glass-border);">
                    <h3>Custom Keyword</h3>
                    <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">একটি কি-ওয়ার্ড লিখুন এবং ম্যাজিক দেখুন!</p>
                    <form id="caption-gen-form">
                        <div class="form-group">
                            <input type="text" id="caption-topic" placeholder="e.g. Success, Beach, Monday" required style="font-size: 1.1rem; padding: 1rem;">
                        </div>
                        <button type="submit" class="btn btn-primary">Generate Best Caption</button>
                    </form>
                    <div id="caption-result" style="display: none; margin-top: 1.5rem;"></div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="card" style="padding: 1.5rem;">
                        <p style="font-size: 0.95rem; margin-bottom: 1rem;">"Don't study me, you won't graduate. 😎"</p>
                        <button class="btn btn-secondary" style="width: auto; padding: 0.4rem 1rem; font-size: 0.8rem;">Copy</button>
                    </div>
                    <div class="card" style="padding: 1.5rem;">
                        <p style="font-size: 0.95rem; margin-bottom: 1rem;">"Life is short. Smile while you still have teeth. 😁"</p>
                        <button class="btn btn-secondary" style="width: auto; padding: 0.4rem 1rem; font-size: 0.8rem;">Copy</button>
                    </div>
                </div>
            </div>
        </div>
      </div>
    `;
}

function getUserProfileHTML() {
  const u = getCurrentUser();
  const parts = (u.full_name || '').trim().split(/\s+/);
  const firstName = parts[0] || '';
  const lastName = parts.slice(1).join(' ') || '';
  const esc = (s) => (s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  return `
    <div style="display: flex; flex-direction: column; gap: 2rem; max-width: 800px; margin: 0 auto;">
      <div style="background: var(--bg-card); padding: 2rem; border-radius: 24px; border: 1px solid var(--glass-border);">
        <h2 style="font-size: 2rem; margin-bottom: 0.5rem;">Profile Settings ⚙️</h2>
        <p style="color: var(--text-muted);">আপনার প্রোফাইল তথ্য এখান থেকে পরিবর্তন করতে পারবেন।</p>
      </div>
      <div style="background: var(--bg-card); padding: 2.5rem; border-radius: 24px; border: 1px solid var(--glass-border);">
          <form id="profile-edit-form">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem;">
                  <div class="form-group">
                      <label>First Name</label>
                      <input type="text" id="profile-first-name" value="${esc(firstName)}" required>
                  </div>
                  <div class="form-group">
                      <label>Last Name</label>
                      <input type="text" id="profile-last-name" value="${esc(lastName)}" required>
                  </div>
              </div>
              <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" id="profile-email" value="${esc(u.email)}" readonly style="opacity: 0.7;">
              </div>
              <div class="form-group">
                  <label>Bio</label>
                  <textarea id="profile-bio" style="width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 12px; color: white; resize: none; height: 100px;">${esc(u.bio || '')}</textarea>
              </div>
              <button type="submit" class="btn btn-primary" style="width: auto; padding: 0.75rem 3rem;">Save Changes</button>
          </form>
      </div>
    </div>
  `;
}

function renderAdminLogin() {
  app.innerHTML = `
    <header>
      <a href="/" class="logo" data-link>QuantumOS</a>
    </header>
    <div class="auth-container animate-fade">
      <div class="auth-card">
        <h2>Admin Login</h2>
        <p>শুধুমাত্র অ্যাডমিনিস্ট্রেটরদের জন্য এক্সেস।</p>
        <form id="admin-form">
          <div class="form-group">
            <label>Admin Email</label>
            <input type="email" id="admin-email" placeholder="sanjidmia999@gmail.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="admin-pass" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary">Login as Admin</button>
        </form>
        <div style="margin-top: 1.5rem;">
            <a href="/" data-link style="color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← Back to Home</a>
        </div>
      </div>
    </div>
  `;
  attachLinkListeners();

  document.getElementById('admin-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('admin-email').value;
    const pass = document.getElementById('admin-pass').value;

    if (email === ADMIN_CREDENTIALS.email && pass === ADMIN_CREDENTIALS.password) {
      alert('সফলভাবে লগইন হয়েছে!');
      window.history.pushState(null, null, '/admin/dashboard');
      navigate();
    } else {
      alert('ভুল ইমেইল বা পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  });
}

function renderAdminDashboard() {
  app.innerHTML = `
    <header>
      <div class="logo">QuantumOS Admin</div>
      <nav class="nav-links">
        <a href="/" data-link>Logout</a>
      </nav>
    </header>
    <main class="animate-fade">
      <div style="background: var(--bg-card); padding: 3rem; border-radius: 24px; border: 1px solid var(--glass-border); text-align: center;">
        <h1 style="font-size: 2.5rem; margin-bottom: 1rem;">Welcome Back, Sanjid! 👋</h1>
        <p style="color: var(--text-muted); margin-bottom: 3rem;">আপনার ওয়েবসাইটের পুরো নিয়ন্ত্রণ এখন আপনার হাতে।</p>
        
        <div class="features" style="margin-top: 0;">
          <div class="card">
            <h3>📊 ইউজার স্ট্যাটাস</h3>
            <p>মোট ইউজার: ১২৪ জন (আজ নতুন: ৫ জন)</p>
          </div>
          <div class="card">
            <h3>📝 পোস্ট ম্যানেজমেন্ট</h3>
            <p>নতুন পোস্ট পাবলিশ করুন এবং পুরানোগুলো এডিট করুন।</p>
          </div>
          <div class="card" style="border-color: var(--accent);">
            <h3>⚙️ সেটিংস</h3>
            <p>ওয়েবসাইটের লোগো, নাম এবং অন্যান্য সেটিংস পরিবর্তন করুন।</p>
          </div>
        </div>
      </div>
    </main>
  `;
  attachLinkListeners();
}

function renderUserLogin() {
  app.innerHTML = `
    <header>
      <a href="/" class="logo" data-link>QuantumOS</a>
    </header>
    <div class="auth-container animate-fade">
      <div class="auth-card">
        <h2>User Login</h2>
        <p>আপনার প্রোফাইলে লগইন করুন।</p>
        <form id="user-form">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="user-email" placeholder="name@example.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="user-pass" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary">Sign In</button>
        </form>
        <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <a href="/user/register" data-link style="color: var(--primary); text-decoration: none; font-size: 0.9rem;">Don't have an account? Register here</a>
            <a href="/" data-link style="color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← Back to Home</a>
            <p style="margin-top: 1rem; padding: 0.75rem; background: rgba(99,102,241,0.1); border-radius: 12px; font-size: 0.85rem; color: var(--text-muted);">টেস্টের জন্য: <strong style="color: var(--primary);">test@example.com</strong> / পাসওয়ার্ড: <strong style="color: var(--primary);">test1234</strong></p>
        </div>
      </div>
    </div>
  `;
  attachLinkListeners();

  document.getElementById('user-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('user-email').value.trim();
    const password = document.getElementById('user-pass').value;
    if (!email || !password) { alert('ইমেইল ও পাসওয়ার্ড দিন।'); return; }
    try {
      const params = new URLSearchParams({ username: email, password });
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data.detail || 'ভুল ইমেইল বা পাসওয়ার্ড!';
        console.error('Login error:', msg, data);
        alert(msg);
        return;
      }
      localStorage.setItem('qos_token', data.access_token);
      localStorage.setItem('qos_user', JSON.stringify(data.user));
      localStorage.setItem('qos_logged_in', 'true');
      isLoggedIn = true;
      window.history.pushState(null, null, '/user/dashboard');
      navigate();
    } catch (err) {
      alert('নেটওয়ার্ক ত্রুটি। ব্যাকএন্ড চালু আছে কিনা দেখুন।');
    }
  });
}

function renderUserRegister() {
  app.innerHTML = `
    <header>
      <a href="/" class="logo" data-link>QuantumOS</a>
    </header>
    <div class="auth-container animate-fade">
      <div class="auth-card">
        <h2>Create Account</h2>
        <p>নতুন একাউন্ট তৈরি করে আমাদের সাথে যুক্ত হোন।</p>
        <form id="register-form">
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="reg-full-name" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="reg-email" placeholder="john@example.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="reg-password" placeholder="••••••••" required>
          </div>
          <button type="submit" class="btn btn-primary">Create Account</button>
        </form>
        <div style="margin-top: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <a href="/user/login" data-link style="color: var(--primary); text-decoration: none; font-size: 0.9rem;">Already have an account? Login</a>
            <a href="/" data-link style="color: var(--text-muted); text-decoration: none; font-size: 0.9rem;">← Back to Home</a>
        </div>
      </div>
    </div>
  `;
  attachLinkListeners();

  document.getElementById('register-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName = document.getElementById('reg-full-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!fullName || !email || !password) { alert('সব ফিল্ড পূরণ করুন।'); return; }
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ full_name: fullName, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { alert(data.detail || 'রেজিস্ট্রেশন ব্যর্থ। আবার চেষ্টা করুন।'); return; }
      alert('অভিনন্দন! আপনার একাউন্ট সফলভাবে তৈরি হয়েছে। এখন লগইন করুন।');
      window.history.pushState(null, null, '/user/login');
      navigate();
    } catch (err) {
      alert('নেটওয়ার্ক ত্রুটি। ব্যাকএন্ড চালু আছে কিনা দেখুন।');
    }
  });
}

function attachLinkListeners() {
  document.querySelectorAll('[data-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const href = e.target.closest('a').getAttribute('href');
      window.history.pushState(null, null, href);
      navigate();
    });
  });
}

window.addEventListener('popstate', navigate);
navigate();
