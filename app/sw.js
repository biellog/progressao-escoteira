/* =====================================================================
   Service Worker – funciona offline e cuida das atualizações.
   A cada publicação, o GitHub Actions troca __BUILD__ pelo id do commit,
   o que faz o navegador perceber a nova versão e avisar o usuário.
   Os DADOS do usuário não ficam aqui (ficam no localStorage/Supabase),
   por isso trocar o cache NUNCA apaga dados.
   ===================================================================== */
const VERSAO = '1.0.0';
const BUILD = '__BUILD__';
const CACHE = `pe-app-${VERSAO}-${BUILD}`;
const CACHE_EXTERNO = 'pe-externo';

const ARQUIVOS = [
  './',
  './index.html',
  './css/app.css',
  './js/app.js',
  './js/config.js',
  './js/data.js',
  './js/db.js',
  './js/update.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: 'reload' })))));
  // não chama skipWaiting aqui: esperamos o usuário tocar em "Atualizar"
});

self.addEventListener('message', (e) => {
  if (e.data?.tipo === 'ATUALIZAR') self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nomes = await caches.keys();
    await Promise.all(nomes.filter((n) => n.startsWith('pe-app-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // version.json sempre da rede (para saber se há novidade)
  if (url.pathname.endsWith('/version.json')) return;

  // biblioteca do Supabase (CDN): usa cache e atualiza em segundo plano
  if (url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open(CACHE_EXTERNO).then(async (c) => {
      const cache = await c.match(req);
      const rede = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => cache);
      return cache || rede;
    }));
    return;
  }

  if (url.origin !== location.origin) return; // API do Supabase etc.: direto na rede

  // arquivos do app: cache primeiro, rede como reserva
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const naCache = await c.match(req, { ignoreSearch: req.mode === 'navigate' });
    if (naCache) return naCache;
    try {
      return await fetch(req);
    } catch {
      if (req.mode === 'navigate') return c.match('./index.html');
      throw new Error('offline');
    }
  })());
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil((async () => {
    const janelas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    if (janelas.length) return janelas[0].focus();
    return self.clients.openWindow('./');
  })());
});
