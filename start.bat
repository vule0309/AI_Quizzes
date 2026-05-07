@echo off
echo Starting AI Quizzes Application...

echo Starting Backend...
start cmd /k "cd backend && call venv\Scripts\activate && uvicorn app.main:app --reload"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both services are starting up!
