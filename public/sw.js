// Simple service worker to prevent PWA errors
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
});

self.addEventListener('fetch', (event) => {
  // Don't intercept requests to external APIs to prevent network errors
  const url = new URL(event.request.url);
  
  // Skip intercepting Supabase requests and other external APIs
  if (
    url.hostname.includes('supabase') ||
    url.hostname.includes('api.') ||
    url.hostname !== location.hostname
  ) {
    // Let the browser handle these requests normally
    return;
  }
  
  // Only handle same-origin requests for app assets
  event.respondWith(fetch(event.request));
}); 