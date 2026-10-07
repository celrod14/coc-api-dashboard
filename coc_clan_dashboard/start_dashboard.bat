@echo off
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
  echo Creating Python virtual environment...
  py -m venv .venv
  echo Installing requirements...
  .venv\Scripts\python.exe -m pip install -r requirements.txt
)
echo Starting Clash of Clans Clan Dashboard...
.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
