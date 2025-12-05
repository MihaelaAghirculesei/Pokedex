const CACHE_NAME = 'pokedex-v1';
const STATIC_CACHE = 'pokedex-static-v1';
const API_CACHE = 'pokedex-api-v1';
const IMAGE_CACHE = 'pokedex-images-v1';

const STATIC_RESOURCES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/shared.min.css',
  '/style.min.css',
  '/impressum.min.css',
  '/script.min.js',
  '/scripts/templates.min.js',
  '/imgs/icons/pokemon-ball.png',
  '/imgs/icons/icon-pokemon.png',
  '/imgs/icons/arrow-left-circle-fill.svg',
  '/imgs/icons/arrow-right-circle-fill.svg',
  '/imgs/icons/x-button.png',
  '/imgs/icons/bug.png',
  '/imgs/icons/dark.png',
  '/imgs/icons/dragon.png',
  '/imgs/icons/electric.png',
  '/imgs/icons/fairy.png',
  '/imgs/icons/fighting.png',
  '/imgs/icons/fire.png',
  '/imgs/icons/flying.png',
  '/imgs/icons/ghost.png',
  '/imgs/icons/grass.png',
  '/imgs/icons/ground.png',
  '/imgs/icons/ice.png',
  '/imgs/icons/normal.png',
  '/imgs/icons/poison.png',
  '/imgs/icons/psychic.png',
  '/imgs/icons/rock.png',
  '/imgs/icons/steel.png',
  '/imgs/icons/water.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('❌ Failed to cache static resources:', err);
      })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== API_CACHE && 
                cacheName !== IMAGE_CACHE) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  if (url.origin === 'https://pokeapi.co') {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  if (url.hostname === 'raw.githubusercontent.com' && 
      url.pathname.includes('PokeAPI/sprites')) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  event.respondWith(handleStaticRequest(request));
});

async function handleApiRequest(request) {
  try {
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ API request failed:', error);
    
    const cache = await caches.open(API_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response(JSON.stringify({ 
      error: 'Offline', 
      message: 'Content not available offline' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('❌ Image request failed:', error);
    
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Image not available offline', { status: 404 });
  }
}

async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok && request.method === 'GET') {
      const responseClone = networkResponse.clone();
      await cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return new Response('Resource not available offline', { status: 404 });
  }
}

self.addEventListener('sync', event => {
});