// Motorista Pro EV - Service Worker (CORRIGIDO)
const CACHE_NAME = 'motorista-pro-ev-v5';

// Arquivos essenciais para cache (caminhos relativos)
const ASSETS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png'
];

self.addEventListener('install', event => {
  console.log('[SW] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      try {
        for (const asset of ASSETS_TO_CACHE) {
          try {
            await cache.add(asset);
            console.log('[SW] Cacheado com sucesso:', asset);
          } catch (err) {
            console.warn('[SW] Não foi possível cachear:', asset, err);
          }
        }
      } catch (error) {
        console.error('[SW] Erro no cache:', error);
      }
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('[SW] Ativando...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => {
          console.log('[SW] Removendo cache antigo:', key);
          return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Ignora requisições para outros domínios (CDN, APIs externas)
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      return fetch(event.request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
          
          if (event.request.destination === 'image') {
            return new Response('', { status: 200, statusText: 'OK' });
          }
          
          return new Response('Conteúdo offline', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
    })
  );
});