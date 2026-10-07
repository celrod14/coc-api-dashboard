# Clash of Clans Clan Dashboard

A lightweight Clash of Clans clan operations dashboard using the official Clash of Clans API.

## What is included

- Clan overview and badge
- Member roster with rank, role, XP, trophies, Builder Base trophies, donations and league
- Current war scoreboard
- War history
- Capital raid history
- Responsive dark dashboard
- Demo mode so the UI can be tested without credentials
- API key stays on the FastAPI backend and is never sent to browser JavaScript

## 1. Install

Use Python 3.10+.

```bash
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Windows CMD:

```cmd
.venv\\Scripts\\activate
pip install -r requirements.txt
```

## 2. Add your Clash API credentials

Open:

`backend/main.py`

At the top, replace these constants:

```python
COC_API_KEY = "YOUR_API_KEY_HERE"
COC_CLAN_TAG = "#YOUR_CLAN_TAG_HERE"
USE_DEMO_DATA = True
```

Change `USE_DEMO_DATA` to `False` after entering the real values:

```python
COC_API_KEY = "PASTE_YOUR_API_KEY_HERE"
COC_CLAN_TAG = "#PASTE_YOUR_CLAN_TAG_HERE"
USE_DEMO_DATA = False
```

The tag must include the `#`.

## 3. Run it

From the project root:

```bash
python -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

Open:

`http://localhost:8000`

## 4. Deploying

For a server deployment, run Uvicorn behind a reverse proxy such as IIS or Nginx. Do not place the API key in `frontend/app.js`.

## API routes used

- `GET /v1/clans/{clanTag}`
- `GET /v1/clans/{clanTag}/members`
- `GET /v1/clans/{clanTag}/currentwar`
- `GET /v1/clans/{clanTag}/warlog`
- `GET /v1/clans/{clanTag}/capitalraidseasons`

The official API uses Bearer-token authentication and expects clan tags to be URL encoded by the client.
