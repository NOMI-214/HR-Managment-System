#!/bin/bash
# Start both backend and frontend
BASE_DIR="$(dirname "$0")"

echo "Starting TalentFlow HRMS..."
echo ""
echo "Backend (FastAPI):  http://localhost:8000"
echo "Frontend (React):   http://localhost:5173"
echo "API Docs:           http://localhost:8000/docs"
echo ""

# Start backend
cd "$BASE_DIR/backend"
pip install -r requirements.txt -q
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
cd "$BASE_DIR/frontend"
npm install --silent
npm run dev &
FRONTEND_PID=$!

echo "Press Ctrl+C to stop all services"
wait $BACKEND_PID $FRONTEND_PID
