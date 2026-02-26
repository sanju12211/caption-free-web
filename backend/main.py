from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import sqlite3
import random
import os

app = FastAPI(title="QuantumOS API", version="1.0.0")

# Allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security Config ---
SECRET_KEY = os.getenv("SECRET_KEY", "quantumos-super-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

# Use pbkdf2_sha256 to avoid OS-specific bcrypt issues
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login", auto_error=False)

DB_PATH = os.path.join(os.path.dirname(__file__), "quantumos.db")

# --- Database Setup ---
def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            hashed_password TEXT NOT NULL,
            bio TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)
    c.execute("""
        CREATE TABLE IF NOT EXISTS captions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            keyword TEXT,
            category TEXT,
            caption TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)
    conn.commit()
    conn.close()

init_db()

# --- Caption Database by Category ---
CAPTIONS = {
    "attitude": [
        "I don't have an attitude problem, I have a personality you can't handle. 😎",
        "Too glam to give a damn. 💅",
        "Born to stand out, not to fit in. 👑",
        "I am not perfect, but I am limited edition. ✨",
        "My life, my rules. Your opinion is not in the script. 🔥",
        "Silence is the best response to a fool. 🤫",
        "I walk like I own the place, because I do. 😤",
        "Don't mistake my kindness for weakness. 🦁",
    ],
    "funny": [
        "I'm not lazy, I'm on energy-saving mode. 😴",
        "Life is short. Smile while you still have teeth. 😁",
        "I followed my heart and it led me to the fridge. 🍕",
        "My bed is a magical place where I suddenly remember everything I forgot to do. 🛌",
        "Running late is my cardio. 🏃💨",
        "I'm not arguing, I'm just explaining why I'm right. 🤓",
        "Chocolate doesn't ask silly questions. Chocolate understands. 🍫",
    ],
    "sad": [
        "Sometimes you have to accept the fact that certain things will never go back to how they used to be. 💔",
        "It's okay not to be okay. 🌧️",
        "The worst kind of pain is when you're smiling just to stop the tears from falling. 😔",
        "I'm not okay, but I smile anyway. 🥀",
        "Sometimes it's better to be alone. Nobody can hurt you. 🌫️",
        "Pain changes people. It makes them trust less, overthink more, and shut people out. 🖤",
        "Missing someone and not being able to do anything about it is the worst feeling. 💧",
    ],
    "love": [
        "You are my today and all of my tomorrows. ❤️",
        "In a world full of people, my eyes will always search for you. 🥰",
        "Every love story is beautiful, but ours is my favorite. 💕",
        "You make my heart smile. 😊",
        "I love you not only for what you are but for what I am when I am with you. 💞",
        "You are the reason I look down at my phone and smile. Then walk into a wall. 😂❤️",
        "Home is wherever I'm with you. 🏡💛",
    ],
    "travel": [
        "Not all those who wander are lost. 🌍",
        "The world is a book and those who do not travel read only one page. 📖✈️",
        "Collect moments, not things. 🌅",
        "Life is short and the world is wide. 🗺️",
        "Travel far enough, you meet yourself. 🏔️",
        "Adventure is worthwhile. 🌊",
        "Take only memories, leave only footprints. 👣",
        "Jobs fill your pocket, adventures fill your soul. 🌿",
    ],
    "default": [
        'Dream big, work hard, and make "{keyword}" happen. ✨',
        'Every day is a new chance to shine with "{keyword}". 🌟',
        '"{keyword}" is not just a word, it\'s a lifestyle. 🔥',
        'Chasing dreams and living the "{keyword}" life. 💫',
        'Stay focused, stay humble. "{keyword}" is the goal. 🎯',
        'Life is better when you embrace "{keyword}". 🌈',
        'The "{keyword}" chapter of my life begins now. 📖',
    ]
}

# --- Helper Functions ---
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def hash_password(password):
    return pwd_context.hash(password)

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_user_by_email(email: str):
    conn = get_db()
    try:
        return conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    finally:
        conn.close()


def ensure_test_user():
    """টেস্টের জন্য একটা ইউজার তৈরি (না থাকলে)।"""
    try:
        test_email = "test@example.com"
        test_pass = "test1234"
        existing = get_user_by_email(test_email)
        conn = get_db()
        try:
            if existing:
                # Update password to ensure it's correct
                hashed = hash_password(test_pass)
                conn.execute(
                    "UPDATE users SET hashed_password = ? WHERE email = ?",
                    (hashed, test_email)
                )
                conn.commit()
                # Verify it works
                test_verify = verify_password(test_pass, hashed)
                print(f"[OK] Test user updated: {test_email} / {test_pass} (verify: {test_verify})")
            else:
                # Create new
                hashed = hash_password(test_pass)
                conn.execute(
                    "INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)",
                    ("Test User", test_email, hashed),
                )
                conn.commit()
                # Verify it works
                test_verify = verify_password(test_pass, hashed)
                print(f"[OK] Test user created: {test_email} / {test_pass} (verify: {test_verify})")
        except Exception as e:
            print(f"[ERROR] Error creating/updating test user: {e}")
            import traceback
            traceback.print_exc()
        finally:
            conn.close()
    except Exception as e:
        print(f"[ERROR] Error in ensure_test_user: {e}")
        import traceback
        traceback.print_exc()


# Test user will be created on first request or via startup event

async def get_current_user(token: str = Depends(oauth2_scheme)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = get_user_by_email(email)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# --- Schemas ---
class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class CaptionRequest(BaseModel):
    keyword: str
    category: str = "default"

class UpdateProfileRequest(BaseModel):
    full_name: str | None = None
    bio: str | None = None

# --- Routes ---

@app.get("/")
def root():
    return {"message": "QuantumOS API is running! 🚀"}


# --- Dashboard (backend stats) ---
def get_dashboard_stats():
    conn = get_db()
    try:
        users = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        captions = conn.execute("SELECT COUNT(*) FROM captions").fetchone()[0]
        recent = conn.execute(
            "SELECT id, user_id, keyword, category, caption, created_at FROM captions ORDER BY created_at DESC LIMIT 10"
        ).fetchall()
        recent_users = conn.execute(
            "SELECT id, full_name, email, created_at FROM users ORDER BY created_at DESC LIMIT 20"
        ).fetchall()
        return {
            "total_users": users,
            "total_captions": captions,
            "recent_captions": [dict(r) for r in recent],
            "recent_users": [dict(r) for r in recent_users],
        }
    finally:
        conn.close()


@app.get("/dashboard/stats")
def dashboard_stats():
    return get_dashboard_stats()

@app.get("/debug/test-user")
def debug_test_user():
    """ডিবাগ: টেস্ট ইউজার আছে কিনা চেক করুন।"""
    user = get_user_by_email("test@example.com")
    if user:
        return {
            "exists": True,
            "email": user["email"],
            "full_name": user["full_name"],
            "id": user["id"]
        }
    return {"exists": False, "message": "Test user not found. Creating..."}

@app.post("/debug/create-test-user")
def create_test_user_endpoint():
    """টেস্ট ইউজার তৈরি/রিসেট করুন (পাসওয়ার্ড: test1234)।"""
    try:
        test_email = "test@example.com"
        test_pass = "test1234"
        existing = get_user_by_email(test_email)
        conn = get_db()
        try:
            hashed = hash_password(test_pass)
            if existing:
                # Update existing user
                conn.execute(
                    "UPDATE users SET hashed_password = ?, full_name = ? WHERE email = ?",
                    (hashed, "Test User", test_email)
                )
                conn.commit()
                verify_ok = verify_password(test_pass, hashed)
                return {
                    "message": "Test user password reset!",
                    "email": test_email,
                    "password": test_pass,
                    "password_verify": verify_ok
                }
            else:
                # Create new
                conn.execute(
                    "INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)",
                    ("Test User", test_email, hashed),
                )
                conn.commit()
                verify_ok = verify_password(test_pass, hashed)
                return {
                    "message": "Test user created!",
                    "email": test_email,
                    "password": test_pass,
                    "password_verify": verify_ok
                }
        finally:
            conn.close()
    except Exception as e:
        import traceback
        return {"error": str(e), "traceback": traceback.format_exc()}


DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>QuantumOS - Backend Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #6366f1;
      --secondary: #a855f7;
      --bg-dark: #0f172a;
      --bg-card: rgba(30, 41, 59, 0.8);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --glass: rgba(255,255,255,0.1);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Outfit', sans-serif; }
    body {
      min-height: 100vh;
      background: var(--bg-dark);
      color: var(--text-main);
      background-image: radial-gradient(circle at 0% 0%, rgba(99,102,241,0.15) 0, transparent 50%),
        radial-gradient(circle at 100% 100%, rgba(168,85,247,0.12) 0, transparent 50%);
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 0;
      border-bottom: 1px solid var(--glass);
      margin-bottom: 2rem;
    }
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      background: linear-gradient(to right, var(--primary), var(--secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge {
      background: rgba(99,102,241,0.2);
      color: var(--primary);
      padding: 0.35rem 0.75rem;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 600;
    }
    h1 { font-size: 1.75rem; margin-bottom: 2rem; color: var(--text-main); }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--glass);
      border-radius: 20px;
      padding: 1.75rem;
      backdrop-filter: blur(12px);
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover { transform: translateY(-4px); border-color: rgba(99,102,241,0.3); }
    .card .icon { font-size: 2rem; margin-bottom: 0.75rem; }
    .card .label { color: var(--text-muted); font-size: 0.9rem; margin-bottom: 0.25rem; }
    .card .value { font-size: 2.25rem; font-weight: 700; background: linear-gradient(135deg, var(--primary), var(--secondary)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .section-title { font-size: 1.2rem; margin-bottom: 1rem; color: var(--text-muted); }
    .table-wrap {
      background: var(--bg-card);
      border: 1px solid var(--glass);
      border-radius: 20px;
      overflow: hidden;
      backdrop-filter: blur(12px);
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 1rem 1.25rem; text-align: left; }
    th { background: rgba(99,102,241,0.15); color: var(--primary); font-weight: 600; font-size: 0.85rem; }
    tr:not(:last-child) td { border-bottom: 1px solid var(--glass); }
    td { color: var(--text-muted); font-size: 0.9rem; }
    td.caption { max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--text-main); }
    .loading { text-align: center; padding: 3rem; color: var(--text-muted); }
    .error { color: #f43f5e; padding: 1rem; background: rgba(244,63,94,0.1); border-radius: 12px; margin-top: 1rem; }
    .links { margin-top: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; }
    .links a { color: var(--primary); text-decoration: none; font-weight: 600; }
    .links a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <span class="logo">QuantumOS</span>
      <div style="display: flex; align-items: center; gap: 1rem;">
        <span id="user-badge" class="badge" style="display: none;">Logged in as …</span>
        <span class="badge">Backend Dashboard</span>
      </div>
    </header>
    <h1>📊 API Overview</h1>
    <div id="content">
      <div class="loading">Loading stats…</div>
    </div>
    <div class="links">
      <a href="/">← API Root</a>
      <a href="/docs">API Docs (Swagger)</a>
      <a href="/redoc">ReDoc</a>
    </div>
  </div>
  <script>
    (function() {
      var params = new URLSearchParams(location.search);
      var token = params.get('token');
      if (token) {
        fetch('/me', { headers: { 'Authorization': 'Bearer ' + token } })
          .then(r => r.ok ? r.json() : null)
          .then(u => {
            if (u) {
              var el = document.getElementById('user-badge');
              if (el) { el.textContent = 'Logged in as ' + (u.full_name || u.email || 'User'); el.style.display = 'inline-block'; }
            }
          })
          .catch(() => {});
      }
    })();
    fetch('/dashboard/stats')
      .then(r => r.json())
      .then(data => {
        document.getElementById('content').innerHTML = `
          <div class="cards">
            <div class="card">
              <div class="icon">👥</div>
              <div class="label">Total Users</div>
              <div class="value">${data.total_users}</div>
            </div>
            <div class="card">
              <div class="icon">✍️</div>
              <div class="label">Total Captions</div>
              <div class="value">${data.total_captions}</div>
            </div>
          </div>
          <div class="section-title">Registered Users (যে ইউজার লগইন/অ্যাকাউন্ট করেছে)</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Joined</th></tr></thead>
              <tbody>
                ${(data.recent_users || []).map(u => `
                  <tr>
                    <td>${u.id}</td>
                    <td>${(u.full_name || '-').replace(/</g, '&lt;')}</td>
                    <td>${(u.email || '-').replace(/</g, '&lt;')}</td>
                    <td>${u.created_at || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${!(data.recent_users && data.recent_users.length) ? '<div class="loading">No users yet.</div>' : ''}
          </div>
          <div class="section-title">Recent Captions (last 10)</div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>User ID</th><th>Keyword</th><th>Category</th><th>Caption</th><th>Created</th></tr></thead>
              <tbody>
                ${(data.recent_captions || []).map(r => `
                  <tr>
                    <td>${r.id}</td>
                    <td>${r.user_id}</td>
                    <td>${r.keyword || '-'}</td>
                    <td>${r.category || '-'}</td>
                    <td class="caption" title="${(r.caption || '').replace(/"/g, '&quot;')}">${r.caption || '-'}</td>
                    <td>${r.created_at || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            ${!(data.recent_captions && data.recent_captions.length) ? '<div class="loading">No captions yet.</div>' : ''}
          </div>
        `;
      })
      .catch(err => {
        document.getElementById('content').innerHTML = '<div class="error">Failed to load stats: ' + err.message + '</div>';
      });
  </script>
</body>
</html>
"""


@app.get("/dashboard", response_class=HTMLResponse)
def dashboard():
    # Ensure test user exists (lazy initialization)
    try:
        ensure_test_user()
    except:
        pass
    return DASHBOARD_HTML

@app.post("/register")
def register(req: RegisterRequest):
    if get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(req.password)
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)",
            (req.full_name, req.email, hashed)
        )
        conn.commit()
    finally:
        conn.close()
    return {"message": "Account created successfully! ✅"}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    # Ensure test user exists (lazy initialization)
    try:
        ensure_test_user()
    except:
        pass
    email = form.username.strip().lower()
    password = form.password
    user = get_user_by_email(email)
    if not user:
        print(f"[LOGIN] User not found: {email}")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    # Debug: print password check
    is_valid = verify_password(password, user["hashed_password"])
    print(f"[LOGIN] Attempt: email={email}, password_match={is_valid}")
    if not is_valid:
        print(f"[LOGIN] Password mismatch for: {email}")
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_token({"sub": user["email"]})
    print(f"[LOGIN] Success: {email}")
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "full_name": user["full_name"],
            "email": user["email"],
            "bio": user["bio"]
        }
    }

@app.get("/me")
def get_me(current_user=Depends(get_current_user)):
    return {
        "id": current_user["id"],
        "full_name": current_user["full_name"],
        "email": current_user["email"],
        "bio": current_user["bio"],
        "created_at": current_user["created_at"]
    }

@app.post("/generate-caption")
def generate_caption(req: CaptionRequest, current_user=Depends(get_current_user)):
    category = req.category.lower()
    keyword = req.keyword.strip()

    caption_pool = CAPTIONS.get(category, CAPTIONS["default"])
    caption = random.choice(caption_pool)

    # Replace {keyword} placeholder if present
    caption = caption.replace("{keyword}", keyword)

    # Save to DB
    conn = get_db()
    try:
        conn.execute(
            "INSERT INTO captions (user_id, keyword, category, caption) VALUES (?, ?, ?, ?)",
            (current_user["id"], keyword, category, caption)
        )
        conn.commit()
    finally:
        conn.close()

    return {"caption": caption, "category": category, "keyword": keyword}

@app.get("/my-captions")
def my_captions(current_user=Depends(get_current_user)):
    conn = get_db()
    try:
        rows = conn.execute(
            "SELECT * FROM captions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
            (current_user["id"],)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()

@app.put("/profile")
def update_profile(data: UpdateProfileRequest, current_user=Depends(get_current_user)):
    full_name = data.full_name if data.full_name is not None else current_user["full_name"]
    bio = data.bio if data.bio is not None else current_user["bio"]
    conn = get_db()
    try:
        conn.execute(
            "UPDATE users SET full_name = ?, bio = ? WHERE id = ?",
            (full_name, bio, current_user["id"])
        )
        conn.commit()
    finally:
        conn.close()
    return {"message": "Profile updated! ✅"}
