import os
from typing import List, Optional
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from app.config import settings

# In-memory store for session vector databases
_vector_stores: dict = {}


def get_embeddings():
    """Get HuggingFace embeddings instance (local, free, works offline)."""
    return HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2",
        model_kwargs={'device': 'cpu'}
    )


def create_vector_store(chunks: List[str], session_id: str) -> bool:
    """
    Create a FAISS vector store from text chunks.
    
    Args:
        chunks: List of text chunks to embed
        session_id: Unique session identifier
        
    Returns:
        True if successful
    """
    try:
        embeddings = get_embeddings()
        db = FAISS.from_texts(chunks, embedding=embeddings)
        
        # Store in memory for quick access
        _vector_stores[session_id] = db
        
        # Also save to disk for persistence
        store_path = os.path.join(settings.VECTOR_STORE_PATH, session_id)
        os.makedirs(store_path, exist_ok=True)
        db.save_local(store_path)
        
        return True
    except Exception as e:
        print(f"Error creating vector store: {e}")
        raise e


def load_vector_store(session_id: str) -> Optional[FAISS]:
    """
    Load a vector store for a session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        FAISS vector store or None if not found
    """
    # Check in-memory cache first
    if session_id in _vector_stores:
        return _vector_stores[session_id]
    
    # Try loading from disk
    store_path = os.path.join(settings.VECTOR_STORE_PATH, session_id)
    if os.path.exists(store_path):
        try:
            embeddings = get_embeddings()
            db = FAISS.load_local(
                store_path,
                embeddings,
                allow_dangerous_deserialization=True
            )
            _vector_stores[session_id] = db
            return db
        except Exception as e:
            print(f"Error loading vector store: {e}")
            return None
    
    return None


def similarity_search(session_id: str, query: str, k: int = 4) -> List[str]:
    """
    Perform similarity search on the vector store.
    
    Args:
        session_id: Unique session identifier
        query: Search query
        k: Number of results to return
        
    Returns:
        List of relevant document chunks
    """
    db = load_vector_store(session_id)
    if db is None:
        raise ValueError(f"No vector store found for session: {session_id}")
    
    docs = db.similarity_search(query, k=k)
    return [doc.page_content for doc in docs]


def delete_vector_store(session_id: str) -> bool:
    """
    Delete a vector store for a session.
    
    Args:
        session_id: Unique session identifier
        
    Returns:
        True if successful
    """
    # Remove from memory
    if session_id in _vector_stores:
        del _vector_stores[session_id]
    
    # Remove from disk
    store_path = os.path.join(settings.VECTOR_STORE_PATH, session_id)
    if os.path.exists(store_path):
        import shutil
        shutil.rmtree(store_path)
    
    return True


def session_exists(session_id: str) -> bool:
    """Check if a session has an active vector store."""
    if session_id in _vector_stores:
        return True
    
    store_path = os.path.join(settings.VECTOR_STORE_PATH, session_id)
    return os.path.exists(store_path)
