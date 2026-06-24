#!/bin/bash
set -e
cd "$(dirname "$0")"
echo "Installing frontend dependencies..."
npm install
echo "Starting TalentFlow HRMS frontend on http://localhost:5173"
npm run dev
