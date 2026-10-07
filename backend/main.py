from __future__ import annotations

import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

# ============================================================
# CLASH OF CLANS CONFIGURATION - EDIT THESE CONSTANTS
# ============================================================
# COC_API_KEY = "YOUR_API_KEY_HERE"
COC_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzUxMiIsImtpZCI6IjI4YTMxOGY3LTAwMDAtYTFlYi03ZmExLTJjNzQzM2M2Y2NhNSJ9.eyJpc3MiOiJzdXBlcmNlbGwiLCJhdWQiOiJzdXBlcmNlbGw6Z2FtZWFwaSIsImp0aSI6IjgyODMwNjE5LTgxNGQtNDAwOS1hYzFkLWQ1YjVjYWZjYjVkYyIsImlhdCI6MTc5MTMzODkzNiwic3ViIjoiZGV2ZWxvcGVyL2NiOWE3ZDYzLTVhMWEtNGY4Ny04ZWZhLTFjNjRhNDE1ZjRlYiIsInNjb3BlcyI6WyJjbGFzaCJdLCJsaW1pdHMiOlt7InRpZXIiOiJkZXZlbG9wZXIvc2lsdmVyIiwidHlwZSI6InRocm90dGxpbmcifSx7ImNpZHJzIjpbIjE3My40MS4xNTUuMTU3Il0sInR5cGUiOiJjbGllbnQifV19.9FQQIMLEyhIXrxLFb0LIlP6-EtqENw-yV4m_TTjTtou_u46bfI8qpHEZU66OoFO0yJsMe-UjdLXgeD2gjQyxfA"
COC_CLAN_TAG = "#G9LPUPYO"

# Set False after entering your real API key + clan tag.
USE_DEMO_DATA = False

API_BASE_URL = "https://api.clashofclans.com/v1"
REQUEST_TIMEOUT_SECONDS = 15

app = FastAPI(title="Clash of Clans Clan Dashboard", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def coc_get(path: str) -> dict[str, Any]:
    if not COC_API_KEY or COC_API_KEY == "YOUR_API_KEY_HERE":
        raise HTTPException(status_code=500, detail="COC_API_KEY is not configured.")
    if not COC_CLAN_TAG or COC_CLAN_TAG == "#YOUR_CLAN_TAG_HERE":
        raise HTTPException(status_code=500, detail="COC_CLAN_TAG is not configured.")

    url = f"{API_BASE_URL}{path}"
    headers = {"Authorization": f"Bearer {COC_API_KEY}", "Accept": "application/json"}

    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT_SECONDS)
    except requests.RequestException as exc:
        raise HTTPException(status_code=502, detail=f"Unable to reach Clash API: {exc}") from exc

    if response.status_code >= 400:
        try:
            payload = response.json()
            detail = payload.get("message") or payload.get("reason") or response.text
        except ValueError:
            detail = response.text
        raise HTTPException(status_code=response.status_code, detail=detail or "Clash API request failed")

    return response.json()


# ---------- Demo data ----------
DEMO_CLAN = {
    "tag": "#DEMO1234",
    "name": "Builder Base Legends",
    "description": "A demo clan dashboard. Replace the API constants in backend/main.py to use your clan.",
    "clanLevel": 18,
    "clanPoints": 41236,
    "clanCapitalPoints": 1628,
    "members": 43,
    "memberList": [],
    "warWinStreak": 5,
    "warWins": 82,
    "warLosses": 27,
    "warTies": 4,
    "warLeague": {"name": "Master League I"},
    "capitalLeague": {"name": "Titan League I"},
    "badgeUrls": {"large": "https://placehold.co/256x256/111827/93c5fd?text=COC"},
    "location": {"name": "United States"},
}

DEMO_MEMBERS = [
    {"tag": "#AAA111", "name": "ChiefNova", "role": "leader", "expLevel": 246, "trophies": 5821, "builderBaseTrophies": 3411, "clanRank": 1, "previousClanRank": 2, "donations": 2147, "donationsReceived": 1032, "league": {"name": "Legend League"}},
    {"tag": "#BBB222", "name": "WarMachine", "role": "coLeader", "expLevel": 232, "trophies": 5690, "builderBaseTrophies": 3190, "clanRank": 2, "previousClanRank": 1, "donations": 1820, "donationsReceived": 980, "league": {"name": "Legend League"}},
    {"tag": "#CCC333", "name": "QueenWalk", "role": "admin", "expLevel": 221, "trophies": 5484, "builderBaseTrophies": 3102, "clanRank": 3, "previousClanRank": 4, "donations": 1654, "donationsReceived": 1121, "league": {"name": "Titan League I"}},
    {"tag": "#DDD444", "name": "ZapDragon", "role": "member", "expLevel": 205, "trophies": 5315, "builderBaseTrophies": 2961, "clanRank": 4, "previousClanRank": 3, "donations": 1450, "donationsReceived": 1210, "league": {"name": "Titan League II"}},
    {"tag": "#EEE555", "name": "MinerMax", "role": "member", "expLevel": 191, "trophies": 5174, "builderBaseTrophies": 2817, "clanRank": 5, "previousClanRank": 5, "donations": 1210, "donationsReceived": 940, "league": {"name": "Titan League III"}},
]

DEMO_WAR = {
    "state": "inWar",
    "teamSize": 15,
    "attacksPerMember": 2,
    "preparationStartTime": "2026-10-06T00:00:00.000Z",
    "startTime": "2026-10-06T06:00:00.000Z",
    "endTime": "2026-10-07T06:00:00.000Z",
    "clan": {"tag": "#DEMO1234", "name": "Builder Base Legends", "clanLevel": 18, "stars": 27, "destructionPercentage": 91.4, "attacks": 24, "members": []},
    "opponent": {"tag": "#RIVAL999", "name": "Rival Kings", "clanLevel": 17, "stars": 23, "destructionPercentage": 86.8, "attacks": 21, "members": []},
}

DEMO_WARLOG = {"items": [
    {"result": "win", "endTime": "2026-10-03T06:00:00.000Z", "teamSize": 25, "clan": {"name": "Builder Base Legends", "clanTag": "#DEMO1234", "clanLevel": 18, "stars": 44, "destructionPercentage": 96.3}, "opponent": {"name": "Night Raiders", "clanTag": "#W1", "clanLevel": 17, "stars": 39, "destructionPercentage": 91.8}},
    {"result": "win", "endTime": "2026-09-29T06:00:00.000Z", "teamSize": 20, "clan": {"name": "Builder Base Legends", "clanTag": "#DEMO1234", "clanLevel": 18, "stars": 35, "destructionPercentage": 92.1}, "opponent": {"name": "Clash Nation", "clanTag": "#W2", "clanLevel": 18, "stars": 31, "destructionPercentage": 88.4}},
    {"result": "lose", "endTime": "2026-09-25T06:00:00.000Z", "teamSize": 25, "clan": {"name": "Builder Base Legends", "clanTag": "#DEMO1234", "clanLevel": 18, "stars": 41, "destructionPercentage": 94.0}, "opponent": {"name": "Legends United", "clanTag": "#W3", "clanLevel": 19, "stars": 43, "destructionPercentage": 95.7}},
    {"result": "win", "endTime": "2026-09-21T06:00:00.000Z", "teamSize": 30, "clan": {"name": "Builder Base Legends", "clanTag": "#DEMO1234", "clanLevel": 18, "stars": 52, "destructionPercentage": 93.5}, "opponent": {"name": "Stormborn", "clanTag": "#W4", "clanLevel": 16, "stars": 44, "destructionPercentage": 85.2}},
    {"result": "win", "endTime": "2026-09-17T06:00:00.000Z", "teamSize": 20, "clan": {"name": "Builder Base Legends", "clanTag": "#DEMO1234", "clanLevel": 18, "stars": 35, "destructionPercentage": 93.7}, "opponent": {"name": "Fire Walkers", "clanTag": "#W5", "clanLevel": 17, "stars": 30, "destructionPercentage": 89.1}},
]}

DEMO_RAIDS = {"items": [
    {"state": "ended", "startTime": "2026-10-02T07:30:00.000Z", "endTime": "2026-10-05T07:30:00.000Z", "capitalLeague": {"name": "Titan League I"}, "capitalTotalLoot": 88450, "offensiveReward": 1920, "defensiveReward": 310, "attackCount": 208, "totalAttackCount": 210},
    {"state": "ended", "startTime": "2026-09-25T07:30:00.000Z", "endTime": "2026-09-28T07:30:00.000Z", "capitalLeague": {"name": "Titan League I"}, "capitalTotalLoot": 82110, "offensiveReward": 1784, "defensiveReward": 295, "attackCount": 201, "totalAttackCount": 208},
    {"state": "ended", "startTime": "2026-09-18T07:30:00.000Z", "endTime": "2026-09-21T07:30:00.000Z", "capitalLeague": {"name": "Titan League I"}, "capitalTotalLoot": 79870, "offensiveReward": 1710, "defensiveReward": 280, "attackCount": 198, "totalAttackCount": 205},
]}


def demo_payload() -> dict[str, Any]:
    now = datetime.now(timezone.utc).isoformat()
    return {"updatedAt": now, "clan": {**DEMO_CLAN, "memberList": DEMO_MEMBERS, "members": len(DEMO_MEMBERS)}, "members": DEMO_MEMBERS, "currentWar": DEMO_WAR, "warlog": DEMO_WARLOG, "capitalRaidSeasons": DEMO_RAIDS}


def get_dashboard_data() -> dict[str, Any]:
    if USE_DEMO_DATA:
        return demo_payload()

    clan_tag = quote(COC_CLAN_TAG, safe="")
    clan = coc_get(f"/clans/{clan_tag}")
    members = coc_get(f"/clans/{clan_tag}/members")

    result: dict[str, Any] = {
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "clan": clan,
        "members": members.get("items", []),
        "currentWar": None,
        "warlog": {"items": []},
        "capitalRaidSeasons": {"items": []},
    }

    # Some clans cannot expose war data if their war log is private.
    try:
        result["currentWar"] = coc_get(f"/clans/{clan_tag}/currentwar")
    except HTTPException as exc:
        if exc.status_code not in (403, 404):
            raise
        result["currentWar"] = {"state": "unavailable", "message": "Current war data is unavailable."}

    try:
        result["warlog"] = coc_get(f"/clans/{clan_tag}/warlog")
    except HTTPException as exc:
        if exc.status_code not in (403, 404):
            raise
        result["warlog"] = {"items": [], "message": "War log is unavailable or private."}

    try:
        result["capitalRaidSeasons"] = coc_get(f"/clans/{clan_tag}/capitalraidseasons")
    except HTTPException as exc:
        if exc.status_code not in (403, 404):
            raise
        result["capitalRaidSeasons"] = {"items": []}

    return result


@app.get("/api/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "demoMode": USE_DEMO_DATA, "configured": COC_API_KEY != "YOUR_API_KEY_HERE" and COC_CLAN_TAG != "#YOUR_CLAN_TAG_HERE"}


@app.get("/api/dashboard")
def dashboard() -> dict[str, Any]:
    return get_dashboard_data()


@app.get("/")
def index() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "index.html")


@app.get("/app.js")
def app_js() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "app.js", media_type="text/javascript")


@app.get("/styles.css")
def styles_css() -> FileResponse:
    return FileResponse(FRONTEND_DIR / "styles.css", media_type="text/css")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
