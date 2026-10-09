(() => {
  'use strict';
  const config = window.PIANO_CONFIG;
  const count = document.querySelector('#count');
  const status = document.querySelector('#status');
  const retry = document.querySelector('#retry');
  async function loadCount() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    count.textContent = '—';
    status.textContent = '読み込み中';
    retry.hidden = true;
    try {
      const response = await fetch(config.apiUrl, { signal: controller.signal, cache: 'no-store', headers: { Accept: 'application/json' } });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const value = config.getCount(await response.json());
      if (!Number.isSafeInteger(value) || value < 0) throw new Error('Invalid count');
      count.textContent = new Intl.NumberFormat('ja-JP').format(value);
      status.textContent = config.demoMode ? 'デモデータ' : '';
    } catch {
      status.textContent = '利用者数を取得できませんでした';
      retry.hidden = false;
    } finally { clearTimeout(timer); }
  }
  retry.addEventListener('click', loadCount);
  loadCount();
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#menu');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu.hidden = !open;
  }
  toggle.addEventListener('click', () => setMenu(menu.hidden));
  menu.addEventListener('click', event => { if (event.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !menu.hidden) { setMenu(false); toggle.focus(); } });
  document.addEventListener('click', event => { if (!menu.hidden && !menu.contains(event.target) && !toggle.contains(event.target)) setMenu(false); });
  const list = document.querySelector('#spot-list');
  for (const spot of config.spots || []) {
    const item = document.createElement('li');
    const title = document.createElement('h3'); title.textContent = spot.name;
    const description = document.createElement('p'); description.textContent = spot.description || '';
    item.append(title, description);
    try {
      const url = new URL(spot.url);
      if (['https:', 'http:'].includes(url.protocol)) {
        const link = document.createElement('a'); link.href = url.href; link.textContent = 'スポットの詳細'; item.append(link);
      }
    } catch { /* URL未設定の場合はテキストのみ表示 */ }
    list.append(item);
  }
  if (list.children.length) { list.hidden = false; document.querySelector('#spots-empty').hidden = true; }
})();
