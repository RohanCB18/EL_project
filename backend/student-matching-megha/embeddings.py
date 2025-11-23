# backend/student-matching/embeddings.py
import os
import json
import sqlite3
import hashlib
from typing import List
import numpy as np

# Try to import Gemini client (google-generativeai). If it's not installed or key missing, we fallback.
# pip install google-generativeai
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except Exception:
    GEMINI_AVAILABLE = False

# Simple SQLite cache for embeddings
DB_PATH = os.environ.get("SM_EMBED_DB", "embeddings_cache.db")
TABLE_INITED = False

def init_db():
    global TABLE_INITED
    if TABLE_INITED:
        return
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        CREATE TABLE IF NOT EXISTS embeddings (
            id TEXT PRIMARY KEY,
            usn TEXT,
            profile_text TEXT,
            model TEXT,
            embedding_json TEXT
        )
    """)
    conn.commit()
    conn.close()
    TABLE_INITED = True

def _hash(text: str, model: str):
    return hashlib.sha256((model + "|" + text).encode("utf-8")).hexdigest()

def get_cached_embedding(key: str):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT embedding_json FROM embeddings WHERE id = ?", (key,))
    row = c.fetchone()
    conn.close()
    if row:
        return np.array(json.loads(row[0]), dtype=float)
    return None

def cache_embedding(key: str, usn: str, profile_text: str, model: str, vector: List[float]):
    init_db()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("""
        INSERT OR REPLACE INTO embeddings (id, usn, profile_text, model, embedding_json)
        VALUES (?, ?, ?, ?, ?)
    """, (key, usn, profile_text, model, json.dumps([float(x) for x in vector])))
    conn.commit()
    conn.close()

def _local_embedding(text: str, dim: int = 768):
    # deterministic pseudo-embedding fallback: hash-based vector (useful for offline testing)
    h = hashlib.sha256(text.encode("utf-8")).digest()
    rng = np.frombuffer(h * (dim // len(h) + 1), dtype=np.uint8)[:dim].astype(float)
    # normalize
    rng = (rng - rng.mean()) / (rng.std() + 1e-9)
    return rng.tolist()

def get_embedding_for_profile(profile_text: str, usn: str, model_name: str = "gemini-1.5-mini-embedding"):
    """
    Returns a numpy array embedding for profile_text.
    Uses cache. If GEMINI available & API key set, will call it.
    Otherwise returns local deterministic embedding.
    """
    key = _hash(profile_text, model_name)
    cached = get_cached_embedding(key)
    if cached is not None:
        return cached

    # Try to call Gemini if available and API key present
    api_key = os.environ.get("GEMINI_API_KEY") or os.environ.get("GOOGLE_API_KEY")
    if GEMINI_AVAILABLE and api_key:
        try:
            genai.configure(api_key=api_key)
            # NOTE: check your gemini method signature; adjust accordingly.
            resp = genai.embeddings.create(model=model_name, input=profile_text)
            # resp["data"][0]["embedding"]  or resp.data[0].embedding depending on client
            vec = resp.data[0].embedding if hasattr(resp, "data") else resp["data"][0]["embedding"]
            # Ensure list of floats
            vec = [float(x) for x in vec]
            cache_embedding(key, usn, profile_text, model_name, vec)
            return np.array(vec, dtype=float)
        except Exception as e:
            # fallback to local embedding
            print("Gemini embedding failed, falling back:", e)

    # fallback deterministic embedding
    vec = _local_embedding(profile_text, dim=768)
    cache_embedding(key, usn, profile_text, model_name, vec)
    return np.array(vec, dtype=float)
