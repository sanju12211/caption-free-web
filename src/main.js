import './style.css'

const app = document.querySelector('#app');

// Dummy Admin Credentials
const ADMIN_CREDENTIALS = {
  email: 'sanjidmia999@gmail.com',
  password: '1122@@##'
};

// Global State — persisted in localStorage
let isLoggedIn = localStorage.getItem('qos_logged_in') === 'true';
let isProfileVisible = false;
let currentView = 'dashboard'; // 'dashboard' or 'captions'

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
    isLoggedIn = true;
    currentView = 'captions';
    isProfileVisible = false;
    renderUnifiedLayout();
  } else if (path === '/user/dashboard') {
    isLoggedIn = true;
    currentView = 'dashboard';
    renderUnifiedLayout();
  } else if (path === '/logout') {
    // Explicit logout — clear saved state
    isLoggedIn = false;
    isProfileVisible = false;
    currentView = 'dashboard';
    localStorage.removeItem('qos_logged_in');
    window.history.replaceState(null, null, '/');
    renderUnifiedLayout();
  } else {
    // Home page — if already logged in, stay logged in
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
              <div class="profile-circle" style="width: 40px; height: 40px; font-size: 1rem; flex-shrink: 0; box-shadow: 0 0 12px rgba(99,102,241,0.5);">S</div>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: #fff;">Sanjid Mia</div>
                <div style="color: var(--text-muted); font-size: 0.72rem;">user@example.com</div>
              </div>
            </div>

            <div class="sidebar-section-label">Main Menu</div>
            <a href="/user/dashboard" class="sidebar-link ${currentView === 'dashboard' && !isProfileVisible ? 'sidebar-link-active' : ''}" data-link>
              <span class="sb-icon">🏠</span> Dashboard
            </a>
            <a href="/user/captions" class="sidebar-link ${currentView === 'captions' ? 'sidebar-link-active' : ''}" data-link>
              <span class="sb-icon">✍️</span> Caption Page
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
            <a href="#" class="sidebar-link"><span class="sb-icon">✍️</span> Caption Generator</a>
            <a href="#" class="sidebar-link"><span class="sb-icon">📊</span> Analytics</a>
            <a href="#" class="sidebar-link"><span class="sb-icon">🛡️</span> Security</a>
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
                  <div class="profile-circle">S</div>
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
          ${isLoggedIn && isProfileVisible ? getUserProfileHTML() : (currentView === 'captions' ? getUserCaptionsHTML() : getDashboardHTML())}
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
      document.getElementById('profile-edit-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('অভিনন্দন! আপনার প্রোফাইল সফলভাবে আপডেট হয়েছে।');
      });
    }

    if (currentView === 'captions') {
      document.getElementById('caption-gen-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const topic = document.getElementById('caption-topic').value;
        const resultArea = document.getElementById('caption-result');
        resultArea.style.display = 'block';
        resultArea.innerHTML = `
                <div style="padding: 1rem; background: rgba(255,255,255,0.05); border-radius: 12px; margin-top: 1rem; border: 1px dashed var(--primary);">
                    <p style="color: var(--text-main); font-style: italic;">"Dream big, work hard, and make "${topic}" happen. ✨"</p>
                    <button class="btn btn-secondary" style="margin-top: 0.5rem; width: auto; font-size: 0.8rem;" onclick="alert('Copied to clipboard!')">Copy Caption</button>
                </div>
            `;
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
                    <button class="btn btn-secondary" style="width: 100%; text-align: left; padding: 0.75rem; background: rgba(99, 102, 241, 0.1);">🔥 Attitude</button>
                    <button class="btn btn-secondary" style="width: 100%; text-align: left; padding: 0.75rem;">😊 Funny</button>
                    <button class="btn btn-secondary" style="width: 100%; text-align: left; padding: 0.75rem;">💔 Sad</button>
                    <button class="btn btn-secondary" style="width: 100%; text-align: left; padding: 0.75rem;">❤️ Love</button>
                    <button class="btn btn-secondary" style="width: 100%; text-align: left; padding: 0.75rem;">🏝️ Travel</button>
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
                      <input type="text" value="Sanjid" required>
                  </div>
                  <div class="form-group">
                      <label>Last Name</label>
                      <input type="text" value="Mia" required>
                  </div>
              </div>
              <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" value="user@example.com" required>
              </div>
              <div class="form-group">
                  <label>Bio</label>
                  <textarea style="width: 100%; padding: 0.75rem 1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--glass-border); border-radius: 12px; color: white; resize: none; height: 100px;">Web Developer & Designer</textarea>
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
        </div>
      </div>
    </div>
  `;
  attachLinkListeners();

  document.getElementById('user-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    // Save login state to localStorage
    isLoggedIn = true;
    localStorage.setItem('qos_logged_in', 'true');
    window.history.pushState(null, null, '/user/dashboard');
    navigate();
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
            <input type="text" placeholder="John Doe" required>
          </div>
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" placeholder="john@example.com" required>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" required>
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

  document.getElementById('register-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    alert('অভিনন্দন! আপনার একাউন্ট সফলভাবে তৈরি হয়েছে। এখন আপনি লগইন করতে পারেন।');
    window.history.pushState(null, null, '/user/login');
    navigate();
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
