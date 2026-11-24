// Confere a publicação ao voltar de uma página suspensa no Safari/iPad.
function createNoahUpdateChecker({ currentVersion, fetchVersion, onUpdate }) {
  let running;
  return function check() {
    if (!currentVersion) return Promise.resolve();
    if (running) return running;
    running = Promise.resolve().then(fetchVersion).then(version => {
      if (/^[a-f0-9]{16}$/.test(version || '') && version !== currentVersion) onUpdate(version);
    }).catch(() => {}).finally(() => { running = null; });
    return running;
  };
}

function noahCanReload(document, storage) {
  if (document.querySelector('dialog[open]:not(#cinematic-intro), .modal-backdrop.open, .cinematic-intro.chest-opened[open], .album-lightbox-modal.active')) return false;
  if (Array.from(document.querySelectorAll('form input:not([type=radio]):not([type=checkbox]):not([type=hidden]), form textarea'))
    .some(field => field.value.trim())) return false;
  try { return JSON.parse(storage.getItem('noah_delivery_queue_v2') || '[]').length === 0; }
  catch { return false; }
}

if (typeof module === 'object' && module.exports) module.exports = { createNoahUpdateChecker, noahCanReload };

if (typeof window !== 'undefined') (() => {
  const currentVersion = document.querySelector('meta[name="noah-build"]')?.content;
  if (!currentVersion) return; // A prévia local usa os arquivos diretamente.
  let banner;
  let pendingVersion;
  let lastCheck = 0;

  function reload(version) {
    try { sessionStorage.setItem('noah_update_attempt', version); } catch {}
    const url = new URL(window.location.href);
    url.searchParams.set('v', version);
    window.location.replace(url.toString());
  }

  function offerUpdate(version) {
    pendingVersion = version;
    let alreadyTried = false;
    try { alreadyTried = sessionStorage.getItem('noah_update_attempt') === version; } catch {}
    if (!alreadyTried && noahCanReload(document, localStorage)) {
      reload(version);
      return;
    }
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'invite-update-notice';
    banner.setAttribute('role', 'status');
    const text = document.createElement('span');
    text.textContent = 'Tem novidade no convite!';
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Atualizar convite';
    button.addEventListener('click', () => reload(pendingVersion));
    banner.append(text, button);
    document.body.append(banner);
  }

  const check = createNoahUpdateChecker({ currentVersion, onUpdate: offerUpdate, fetchVersion: async () => {
    // A URL exclusiva também evita cópias antigas em navegadores de aplicativos.
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = setTimeout(() => { if (controller) controller.abort(); }, 10000);
    try {
      const response = await fetch('/release.json?check=' + Date.now(), { cache: 'no-store', ...(controller ? { signal: controller.signal } : {}) });
      if (!response.ok) return null;
      return (await response.json()).version;
    } finally { clearTimeout(timeout); }
  } });

  function checkVisible(force = false) {
    if (document.hidden || (!force && Date.now() - lastCheck < 30000)) return;
    lastCheck = Date.now();
    void check();
  }
  window.addEventListener('pageshow', () => checkVisible(true));
  window.addEventListener('online', () => checkVisible(true));
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVisible(true); });
  setInterval(() => checkVisible(), 60000);
  checkVisible(true);
})();
