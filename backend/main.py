from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
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
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Security Config ---
SECRET_KEY = "quantumos-super-secret-key-2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
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
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return user

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
    email: str
    password: str

class CaptionRequest(BaseModel):
    keyword: str
    category: str = "default"

# --- Routes ---

@app.get("/")
def root():
    return {"message": "QuantumOS API is running! 🚀"}

@app.post("/register")
def register(req: RegisterRequest):
    if get_user_by_email(req.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(req.password)
    conn = get_db()
    conn.execute(
        "INSERT INTO users (full_name, email, hashed_password) VALUES (?, ?, ?)",
        (req.full_name, req.email, hashed)
    )
    conn.commit()
    conn.close()
    return {"message": "Account created successfully! ✅"}

@app.post("/login")
def login(form: OAuth2PasswordRequestForm = Depends()):
    user = get_user_by_email(form.username)
    if not user or not verify_password(form.password, user["hashed_password"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_token({"sub": user["email"]})
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
    conn.execute(
        "INSERT INTO captions (user_id, keyword, category, caption) VALUES (?, ?, ?, ?)",
        (current_user["id"], keyword, category, caption)
    )
    conn.commit()
    conn.close()

    return {"caption": caption, "category": category, "keyword": keyword}

@app.get("/my-captions")
def my_captions(current_user=Depends(get_current_user)):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM captions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        (current_user["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@app.put("/profile")
def update_profile(data: dict, current_user=Depends(get_current_user)):
    full_name = data.get("full_name", current_user["full_name"])
    bio = data.get("bio", current_user["bio"])
    conn = get_db()
    conn.execute(
        "UPDATE users SET full_name = ?, bio = ? WHERE id = ?",
        (full_name, bio, current_user["id"])
    )
    conn.commit()
    conn.close()
    return {"message": "Profile updated! ✅"}
