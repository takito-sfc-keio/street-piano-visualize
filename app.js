(() => {
  'use strict';
  const config = window.PIANO_CONFIG;
  const $ = s => document.querySelector(s);

  let dates = [];
  let currentIndex = 0;
  let cache = {};

  async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const res = await fetch(url, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } finally { clearTimeout(timer); }
  }

  function formatDate(dateStr) {
    const y = dateStr.slice(0, 4);
    const m = parseInt(dateStr.slice(4, 6), 10);
    const d = parseInt(dateStr.slice(6, 8), 10);
    const dt = new Date(+y, m - 1, d);
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return `${y}年${m}月${d}日（${days[dt.getDay()]}）`;
  }

  async function loadDayData(dateKey) {
    if (cache[dateKey]) return cache[dateKey];
    const data = await fetchJson(`${config.dataDir}/${dateKey}.json`);
    cache[dateKey] = data;
    return data;
  }

  function renderHero(data) {
    $('#count').textContent = new Intl.NumberFormat('ja-JP').format(data.totalCount);
    $('#date-label').textContent = formatDate(dates[currentIndex]);
    $('#status').textContent = config.demoMode ? 'デモデータ' : '';
  }

  function renderDiary(data) {
    $('#diary-date').textContent = formatDate(dates[currentIndex]);
    $('#diary-text').textContent = data.diary || 'ダイアリーはまだありません。';

    const statsEl = $('#diary-stats');
    const cardsEl = $('#stat-cards');
    cardsEl.innerHTML = '';

    if (data.spots && data.spots.length) {
      statsEl.hidden = false;
      for (const spot of data.spots) {
        const card = document.createElement('div');
        card.className = 'stat-card';
        card.innerHTML =
          `<h3 class="stat-spot-name">${esc(spot.name)}</h3>` +
          `<div class="stat-row"><span class="stat-label">利用者数</span><span class="stat-value">${spot.count}<span class="stat-unit">人</span></span></div>` +
          `<div class="stat-row"><span class="stat-label">演奏楽曲数</span><span class="stat-value">${spot.songs}<span class="stat-unit">曲</span></span></div>` +
          `<div class="stat-row"><span class="stat-label">演奏時間</span><span class="stat-value">${spot.playTimeMinutes}<span class="stat-unit">分</span></span></div>` +
          `<div class="stat-row"><span class="stat-label">聴衆数</span><span class="stat-value">${spot.audience}<span class="stat-unit">人</span></span></div>`;
        cardsEl.append(card);
      }
    } else {
      statsEl.hidden = true;
    }

    $('#diary-prev').disabled = currentIndex >= dates.length - 1;
    $('#diary-next').disabled = currentIndex <= 0;
  }

  function esc(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  async function showDay(index) {
    currentIndex = index;
    try {
      const data = await loadDayData(dates[index]);
      renderHero(data);
      renderDiary(data);
    } catch {
      $('#diary-text').textContent = 'データを読み込めませんでした。';
      $('#diary-stats').hidden = true;
    }
  }

  function renderHistoryList() {
    const list = $('#history-list');
    list.innerHTML = '';
    for (let i = 0; i < dates.length; i++) {
      const li = document.createElement('li');
      const btn = document.createElement('button');
      btn.className = 'history-item';
      btn.textContent = formatDate(dates[i]);
      if (i === currentIndex) btn.classList.add('active');
      btn.addEventListener('click', () => {
        showDay(i);
        renderHistoryList();
      });
      li.append(btn);
      list.append(li);
    }
  }

  async function init() {
    try {
      dates = await fetchJson(config.indexUrl);
      if (!dates.length) throw new Error('No data');
      await showDay(0);
      $('#retry').hidden = true;
    } catch {
      $('#count').textContent = '—';
      $('#status').textContent = '利用者数を取得できませんでした';
      $('#retry').hidden = false;
      $('#diary-text').textContent = 'データを読み込めませんでした。';
    }
  }

  $('#retry').addEventListener('click', init);
  $('#diary-prev').addEventListener('click', () => {
    if (currentIndex < dates.length - 1) { showDay(currentIndex + 1); renderHistoryList(); }
  });
  $('#diary-next').addEventListener('click', () => {
    if (currentIndex > 0) { showDay(currentIndex - 1); renderHistoryList(); }
  });
  $('#history-toggle').addEventListener('click', () => {
    const list = $('#history-list');
    const isHidden = list.hidden;
    list.hidden = !isHidden;
    $('#history-toggle').textContent = isHidden ? '閉じる' : '過去のダイアリーを見る';
    if (isHidden) renderHistoryList();
  });

  // Menu toggle
  const toggle = $('.menu-toggle');
  const menu = $('#menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.hidden = !open;
  }
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });
  document.addEventListener('click', event => { if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false); });

  // Spots
  const list = $('#spot-list');
  for (const spot of config.spots || []) {
    const item = document.createElement('li');
    const title = document.createElement('h3'); title.textContent = spot.name;
    const description = document.createElement('p'); description.textContent = spot.description || '';
    item.append(title, description);
    if (spot.url) {
      try {
        const url = new URL(spot.url);
        if (['https:', 'http:'].includes(url.protocol)) {
          const link = document.createElement('a'); link.href = url.href; link.textContent = 'スポットの詳細'; item.append(link);
        }
      } catch { /* URL未設定 */ }
    }
    list.append(item);
  }
  if (list.children.length) { list.hidden = false; $('#spots-empty').hidden = true; }

  init();
})();
