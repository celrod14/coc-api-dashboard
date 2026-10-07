let dashboardData = null;
const sectionTitles = { overview: 'Overview', members: 'Members', war: 'Current War', history: 'War History', capital: 'Capital Raids' };

const $ = (id) => document.getElementById(id);
const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const fmt = new Intl.NumberFormat('en-US');
const initials = name => String(name || '?').split(/\s+/).map(x => x[0]).join('').slice(0,2).toUpperCase();

function pct(value) { return Number(value || 0).toFixed(1) + '%'; }
function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString([], {month:'short', day:'numeric', hour:'numeric', minute:'2-digit'});
}
function roleLabel(role) { return ({leader:'Leader', coLeader:'Co-Leader', admin:'Elder', member:'Member'}[role] || role || 'Member'); }
function resultPill(result) {
  const r = String(result || '').toLowerCase();
  if (r === 'win') return '<span class="pill good">WIN</span>';
  if (r === 'lose') return '<span class="pill bad">LOSS</span>';
  if (r === 'tie') return '<span class="pill warn">DRAW</span>';
  return '<span class="pill">—</span>';
}

async function loadDashboard() {
  setLoading();
  $('errorBanner').classList.add('hidden');
  try {
    const res = await fetch('/api/dashboard', {cache:'no-store'});
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Dashboard request failed');
    dashboardData = data;
    updateConnection();
    renderAll();
  } catch (err) {
    $('errorBanner').textContent = err.message || 'Unable to load dashboard.';
    $('errorBanner').classList.remove('hidden');
    $('connectionStatus').textContent = 'API error';
  }
}

function setLoading() {
  ['overview','members','war','history','capital'].forEach(id => $(id).innerHTML = '<div class="loading">Loading clan intelligence…</div>');
}

async function updateConnection() {
  try {
    const res = await fetch('/api/health', {cache:'no-store'});
    const health = await res.json();
    $('connectionStatus').textContent = health.demoMode ? 'Demo data' : (health.configured ? 'API connected' : 'Needs API config');
    document.querySelector('.status-dot').style.background = health.demoMode ? 'var(--warning)' : 'var(--success)';
  } catch { $('connectionStatus').textContent = 'Offline'; }
}

function renderAll() {
  renderOverview(); renderMembers(); renderWar(); renderHistory(); renderCapital();
  $('updatedAt').textContent = `Updated ${formatDate(dashboardData.updatedAt)}`;
}

function clan() { return dashboardData.clan || {}; }
function members() { return dashboardData.members || clan().memberList || []; }
function warlog() { return dashboardData.warlog?.items || []; }

function renderOverview() {
  const c = clan(); const ms = members(); const war = dashboardData.currentWar || {};
  const topDonors = [...ms].sort((a,b)=>(b.donations||0)-(a.donations||0)).slice(0,5);
  const avgTrophies = ms.length ? ms.reduce((s,m)=>s+(m.trophies||0),0)/ms.length : 0;
  const currentName = war?.clan?.name || c.name || 'Clan';
  const opponentName = war?.opponent?.name || 'Opponent';

  $('overview').innerHTML = `
    <div class="hero">
      <div class="hero-main">
        <img class="badge" src="${escapeHtml(c.badgeUrls?.large || 'https://placehold.co/256x256/111827/93c5fd?text=COC')}" alt="Clan badge" />
        <div>
          <h2 class="hero-title">${escapeHtml(c.name || 'Unknown Clan')}</h2>
          <div class="tag">${escapeHtml(c.tag || '—')} · Level ${c.clanLevel ?? '—'} · ${escapeHtml(c.location?.name || 'Location not listed')}</div>
          <p class="description">${escapeHtml(c.description || 'No clan description returned by the API.')}</p>
        </div>
      </div>
      <div class="hero-stats">
        <div class="hero-stat"><span class="num">${fmt.format(c.members ?? ms.length)}</span><span class="label">Members</span></div>
        <div class="hero-stat"><span class="num">${fmt.format(c.clanPoints ?? 0)}</span><span class="label">Clan Points</span></div>
        <div class="hero-stat"><span class="num">${fmt.format(c.clanCapitalPoints ?? 0)}</span><span class="label">Capital</span></div>
      </div>
    </div>

    <div class="grid cards">
      ${statCard('War Win Streak', fmt.format(c.warWinStreak ?? 0), 'Current streak')}
      ${statCard('War Record', `${c.warWins ?? 0}-${c.warLosses ?? 0}`, `${c.warTies ?? 0} draws`)}
      ${statCard('Average Trophies', Math.round(avgTrophies).toLocaleString(), 'Current members')}
      ${statCard('War League', c.warLeague?.name || '—', 'Current tier')}
      ${statCard('Capital League', c.capitalLeague?.name || '—', 'Current tier')}
    </div>

    <div class="grid split">
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Current war</div><div class="panel-sub">${war.state === 'inWar' ? 'Battle underway' : (war.state || 'No active war')}</div></div><button class="refresh" onclick="activate('war')">Open war →</button></div>
        <div class="panel-body">
          ${war.state === 'inWar' || war.state === 'preparation' ? warSummary(war, currentName, opponentName) : `<div class="empty">No active war data is currently available.</div>`}
        </div>
      </div>
      <div class="panel">
        <div class="panel-head"><div><div class="panel-title">Top donors</div><div class="panel-sub">This cycle's donation counts</div></div></div>
        <div class="panel-body"><div class="rank-list">${topDonors.map((m,i)=>rankRow(i+1,m.name,m.trophies,`${fmt.format(m.donations||0)} donations`)).join('') || '<div class="empty">No member data.</div>'}</div></div>
      </div>
    </div>`;
}

function statCard(label,value,foot) { return `<div class="card"><div class="card-label">${escapeHtml(label)}</div><div class="card-value">${escapeHtml(value)}</div><div class="card-foot">${escapeHtml(foot)}</div></div>`; }
function rankRow(rank,name,value,meta) { return `<div class="rank-row"><div class="rank-num">${rank}</div><div><div class="rank-name">${escapeHtml(name)}</div><div class="rank-meta">${escapeHtml(meta)}</div></div><div class="rank-value">${fmt.format(value||0)}</div></div>`; }
function warSummary(war, ownName, oppName) {
  const own = war.clan || {}, opp = war.opponent || {};
  const ownPct = Number(own.destructionPercentage || 0); const oppPct = Number(opp.destructionPercentage || 0);
  return `<div class="war-head">
    <div class="war-side"><h3>${escapeHtml(ownName)}</h3><div class="stars">${own.stars ?? 0} ★</div><div class="destruction">${pct(ownPct)} destruction</div></div>
    <div class="vs">VS<div class="war-state">${escapeHtml(war.state || 'unknown')}</div></div>
    <div class="war-side"><h3>${escapeHtml(oppName)}</h3><div class="stars">${opp.stars ?? 0} ★</div><div class="destruction">${pct(oppPct)} destruction</div></div>
  </div>
  <div class="progress"><span style="width:${Math.min(100, Math.max(0, (ownPct/(Math.max(ownPct,oppPct,1)))*100))}%"></span></div>`;
}

function renderMembers() {
  const ms = [...members()].sort((a,b)=>(a.clanRank||999)-(b.clanRank||999));
  const avgDonation = ms.length ? Math.round(ms.reduce((s,m)=>s+(m.donations||0),0)/ms.length) : 0;
  $('members').innerHTML = `<div class="panel">
    <div class="panel-head"><div><div class="panel-title">Clan roster</div><div class="panel-sub">${ms.length} members · average ${fmt.format(avgDonation)} donations</div></div><button class="refresh" onclick="sortMembersByDonations()">Sort by donations</button></div>
    <div class="table-wrap"><table><thead><tr><th>Rank</th><th>Player</th><th>Role</th><th>XP</th><th>Trophies</th><th>Capital</th><th>Donations</th><th>Received</th><th>League</th></tr></thead><tbody>
    ${ms.map(m=>`<tr><td>#${m.clanRank ?? '—'}</td><td><div class="player"><div class="avatar">${initials(m.name)}</div><div><div class="player-name">${escapeHtml(m.name)}</div><div class="player-tag">${escapeHtml(m.tag || '')}</div></div></div></td><td class="role">${escapeHtml(roleLabel(m.role))}</td><td>${fmt.format(m.expLevel||0)}</td><td>${fmt.format(m.trophies||0)}</td><td>${fmt.format(m.builderBaseTrophies||0)}</td><td>${fmt.format(m.donations||0)}</td><td>${fmt.format(m.donationsReceived||0)}</td><td>${escapeHtml(m.league?.name || '—')}</td></tr>`).join('') || '<tr><td colspan="9"><div class="empty">No member data.</div></td></tr>'}
    </tbody></table></div></div>`;
}

function sortMembersByDonations() {
  const sorted = [...members()].sort((a,b)=>(b.donations||0)-(a.donations||0));
  dashboardData.members = sorted; renderMembers();
}

function renderWar() {
  const war = dashboardData.currentWar || {};
  if (war.state === 'unavailable') { $('war').innerHTML = `<div class="panel"><div class="empty">${escapeHtml(war.message || 'War data unavailable.')}</div></div>`; return; }
  const own = war.clan || {}, opp = war.opponent || {};
  const allMembers = [...(own.members||[])];
  const attacked = allMembers.filter(m => (m.attacks || []).length).length;
  const attacksEarned = (war.attacksPerMember || 1) * Number(war.teamSize || allMembers.length || 0);
  const attacksUsed = (own.attacks ?? allMembers.reduce((s,m)=>s+(m.attacks?.length||0),0));
  $('war').innerHTML = `<div class="panel"><div class="panel-head"><div><div class="panel-title">War room</div><div class="panel-sub">${escapeHtml(war.startTime ? formatDate(war.startTime) : '')} → ${escapeHtml(war.endTime ? formatDate(war.endTime) : '')}</div></div><span class="pill good">${escapeHtml(war.state || 'Unknown')}</span></div>
  <div class="panel-body"><div class="war-head">${teamCard(own)}<div class="vs">VS<div class="war-state">${war.teamSize || '—'} v ${war.teamSize || '—'}</div></div>${teamCard(opp)}</div>
  <div class="grid war-grid">${statCard('Our attacks', `${attacksUsed}/${attacksEarned}`, `${attacked} members attacked`)}${statCard('Stars', `${own.stars||0} — ${opp.stars||0}`, 'Current score')}${statCard('Destruction', `${pct(own.destructionPercentage)} — ${pct(opp.destructionPercentage)}`, 'Our side first')}${statCard('Team size', `${war.teamSize||0}`, `${war.attacksPerMember||1} attacks / member`)}</div>
  </div></div>`;
}
function teamCard(team) { return `<div class="war-side"><h3>${escapeHtml(team.name||'Clan')}</h3><div class="stars">${team.stars||0} ★</div><div class="destruction">${pct(team.destructionPercentage)}</div></div>`; }

function renderHistory() {
  const items = warlog();
  const wins = items.filter(x=>x.result==='win').length; const losses = items.filter(x=>x.result==='lose').length; const ties = items.filter(x=>x.result==='tie').length;
  $('history').innerHTML = `<div class="grid cards">${statCard('Recent wins',wins,`${items.length || 0} logged wars`)}${statCard('Recent losses',losses,'Logged results')}${statCard('Recent draws',ties,'Logged results')}${statCard('Win rate',items.length?`${Math.round(wins/items.length*100)}%`:'—','From loaded wars')}${statCard('Avg destruction',items.length?`${(items.reduce((s,x)=>s+(x.clan?.destructionPercentage||0),0)/items.length).toFixed(1)}%`:'—','Our side')}</div>
  <div class="panel"><div class="panel-head"><div><div class="panel-title">War history</div><div class="panel-sub">Most recent wars returned by the API</div></div></div><div class="table-wrap"><table><thead><tr><th>Result</th><th>Opponent</th><th>Team size</th><th>Score</th><th>Destruction</th><th>Completed</th></tr></thead><tbody>
  ${items.map(x=>`<tr><td>${resultPill(x.result)}</td><td><strong>${escapeHtml(x.opponent?.name||'Unknown')}</strong><div class="player-tag">${escapeHtml(x.opponent?.clanTag||'')}</div></td><td>${x.teamSize||'—'}</td><td>${x.clan?.stars||0} — ${x.opponent?.stars||0}</td><td>${pct(x.clan?.destructionPercentage)} — ${pct(x.opponent?.destructionPercentage)}</td><td>${formatDate(x.endTime)}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">No war history available.</div></td></tr>'}
  </tbody></table></div></div>`;
}

function renderCapital() {
  const items = dashboardData.capitalRaidSeasons?.items || [];
  const latest = items[0] || {};
  $('capital').innerHTML = `<div class="grid cards">${statCard('Capital League', latest.capitalLeague?.name || clan().capitalLeague?.name || '—','Latest loaded season')}${statCard('Total Loot', fmt.format(latest.capitalTotalLoot||0),'Latest season')}${statCard('Offensive Reward', fmt.format(latest.offensiveReward||0),'Latest season')}${statCard('Attacks', `${latest.attackCount||0}/${latest.totalAttackCount||0}`,'Used / available')}${statCard('Seasons Loaded',items.length,'API history')}</div>
  <div class="panel"><div class="panel-head"><div><div class="panel-title">Capital raid history</div><div class="panel-sub">Recent capital raid seasons</div></div></div><div class="table-wrap"><table><thead><tr><th>League</th><th>Loot</th><th>Offensive reward</th><th>Defensive reward</th><th>Attacks</th><th>Period</th></tr></thead><tbody>
  ${items.map(x=>`<tr><td>${escapeHtml(x.capitalLeague?.name||'—')}</td><td>${fmt.format(x.capitalTotalLoot||0)}</td><td>${fmt.format(x.offensiveReward||0)}</td><td>${fmt.format(x.defensiveReward||0)}</td><td>${x.attackCount||0}/${x.totalAttackCount||0}</td><td>${formatDate(x.startTime)} → ${formatDate(x.endTime)}</td></tr>`).join('') || '<tr><td colspan="6"><div class="empty">No capital raid history available.</div></td></tr>'}
  </tbody></table></div></div>`;
}

function activate(section) {
  document.querySelectorAll('.nav-item').forEach(btn => btn.classList.toggle('active', btn.dataset.section === section));
  document.querySelectorAll('.page-section').forEach(s => s.classList.toggle('active', s.id === section));
  $('pageTitle').textContent = sectionTitles[section] || 'Overview';
}

window.activate = activate;
window.sortMembersByDonations = sortMembersByDonations;
document.querySelectorAll('.nav-item').forEach(btn => btn.addEventListener('click', () => activate(btn.dataset.section)));
$('refreshBtn').addEventListener('click', loadDashboard);
loadDashboard();
