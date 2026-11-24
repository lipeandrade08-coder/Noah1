// A preferência do aparelho é o padrão; cada visitante pode escolher no convite.
function createNoahMotion({ media, storage, onChange = () => {} }) {
  const key = 'noah_motion_preference_v1';
  const listeners = new Set();
  let preference;
  try { preference = storage.getItem(key); } catch {}
  if (preference !== 'full' && preference !== 'reduced') preference = null;
  const motion = {
    get matches() { return preference ? preference === 'reduced' : media.matches; },
    toggle() {
      preference = motion.matches ? 'full' : 'reduced';
      try { storage.setItem(key, preference); } catch {}
      notify();
    },
    addEventListener(type, listener) { if (type === 'change') listeners.add(listener); },
    removeEventListener(type, listener) { if (type === 'change') listeners.delete(listener); }
  };
  function notify() {
    onChange(motion.matches);
    listeners.forEach(listener => listener({ matches: motion.matches }));
  }
  const systemChanged = () => { if (!preference) notify(); };
  if (media.addEventListener) media.addEventListener('change', systemChanged);
  else if (media.addListener) media.addListener(systemChanged); // Safari antigo.
  notify();
  return motion;
}

if (typeof module === 'object' && module.exports) module.exports = { createNoahMotion };

if (typeof window !== 'undefined') (() => {
  let storage;
  try { storage = window.localStorage; } catch {}
  window.NoahMotion = createNoahMotion({
    media: window.matchMedia('(prefers-reduced-motion: reduce)'), storage,
    onChange(reduced) {
      document.documentElement.dataset.motion = reduced ? 'reduced' : 'full';
      document.querySelectorAll('[data-motion-toggle]').forEach(button => {
        button.setAttribute('aria-pressed', String(!reduced));
        button.setAttribute('aria-label', reduced ? 'Ativar animações do convite' : 'Reduzir animações do convite');
        button.querySelector('[data-motion-label]').textContent = reduced ? 'Ativar animações' : 'Animações ligadas';
      });
    }
  });
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-motion-toggle]').forEach(button => {
      button.addEventListener('click', () => window.NoahMotion.toggle());
      button.setAttribute('aria-pressed', String(!window.NoahMotion.matches));
      button.setAttribute('aria-label', window.NoahMotion.matches ? 'Ativar animações do convite' : 'Reduzir animações do convite');
      button.querySelector('[data-motion-label]').textContent = window.NoahMotion.matches ? 'Ativar animações' : 'Animações ligadas';
    });
  });
})();
