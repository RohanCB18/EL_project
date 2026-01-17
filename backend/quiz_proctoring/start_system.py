#!/usr/bin/env python3
"""
Quick Start Script for Quiz Proctoring System
Run this to start the integrated quiz management and proctoring system
"""
import os
import sys
import subprocess

def main():
    print("="*60)
    print("QUIZ PROCTORING SYSTEM")
    print("="*60)
    print("\nChecking dependencies...")
    
    # Check if we're in the right directory
    if not os.path.exists("backend/main.py"):
        print("❌ Error: Please run this script from the project root directory")
        print("   Expected: QUIZ_PROCTORING/")
        return 1
    
    # Check Python version
    if sys.version_info < (3, 8):
        print("❌ Error: Python 3.8+ required")
        return 1
    
    print("✅ Python version OK")
    
    # Check if FastAPI is installed
    try:
        import fastapi
        import uvicorn
        print("✅ FastAPI installed")
    except ImportError:
        print("⚠️  FastAPI not found. Installing dependencies...")
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements_phase5.txt"])
    
    # Change to backend directory
    os.chdir("backend")
    
    print("\n" + "="*60)
    print("STARTING SERVER")
    print("="*60)
    print("\n🏠 Landing Page: http://localhost:8000/")
    print("📚 API Docs: http://localhost:8000/docs")
    print("\nAfter selecting your role on the landing page:")
    print("  • Students: Login/Register → Take Quizzes")
    print("  • Teachers: Login/Register → Create & Review Quizzes")
    print("\nPress Ctrl+C to stop the server")
    print("="*60 + "\n")
    
    # Start the server
    try:
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n\n" + "="*60)
        print("SERVER STOPPED")
        print("="*60)
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
