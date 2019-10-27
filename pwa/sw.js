const staticCacheName = 'site-static-v1'; // this is the name of the static cache
const dynamicCacheName = 'site-dynamic-v1';

const assets = [
    '/pwa/',
    '/pwa/index.html',
    '/pwa/fallback.html',
    '/pwa/js/app.js',
    '/pwa/js/ui.js',
    '/pwa/js/materialize.min.js',
    '/pwa/css/styles.css',
    '/pwa/css/materialize.min.css',
    '/pwa/img/dish.png',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://fonts.gstatic.com/s/materialicons/v48/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2',
];

// cache size limit function - recursively deletes the first element of the cache if it exceeds the cache limit
const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if(keys.length > size) {
                cache.delete(keys[0]).then(limitCacheSize(name, size))
            }
        })
    });
};


// install service worker
self.addEventListener('install', (ev) => {
    // ev = install event
    // console.log('service worker has been installed', ev);

    //waitUntil shte izchaka da se zavurshi promisa koito mu e podaden predi da se zavurshi i da produlji natatuk (da pusne activate eventa)
    ev.waitUntil(
        caches.open(staticCacheName).then(cache => {
            // add and addAll requests the server and ands results to the cache
            // stored as key (url of the resource) and value (response to that request)
            // cache.add() // adds single item
            // cache.addAll() // adds array of resources
            console.log('caching assets');
            cache.addAll(assets);
        })
    );
});

// activate service worker
self.addEventListener('activate', (ev) => {
    // ev = activate event
    // console.log('service worker has been activated', ev)

    // for cache versioning delete old cache
    // cycles through all the cache keys and deletes the ones that don't match the current version
    ev.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCacheName && key !== dynamicCacheName)
                .map(key => caches.delete(key))
            );
        })
    );
});

// fetch event
self.addEventListener('fetch', (ev) => {
    // ev = fetch event
    // console.log('fetch event', ev);

    // Pause the fetch event and respond with our own
    ev.respondWith(
        caches.match(ev.request).then(cacheResponse => {
            // returns cache if its not empty or executes the request with the normal fetch request
            // return cacheResponse || fetch(ev.request);

            // return cacheResponse || fetch(ev.request).then(fetchResponse => {
            //     return caches.open(dynamicCacheName).then(cache => {
            //         // here we dont use the add method, because it will make a new request, and we already have the response, so we can just write it in the cache
            //         cache.put(ev.request.url, fetchResponse.clone());
            //         return fetchResponse;
            //     });
            // });

            return cacheResponse || fetch(ev.request).then(fetchResponse => {
                    return caches.open(dynamicCacheName).then(cache => {
                        // here we dont use the add method, because it will make a new request, and we already have the response, so we can just write it in the cache
                        cache.put(ev.request.url, fetchResponse.clone());
                        limitCacheSize(dynamicCacheName, 15);
                        return fetchResponse;
                    });
                });

        }).catch(() => {
            // if offline and page is not cached, return default fallback page
            if(ev.request.url.indexOf('.html') > -1) {
                return caches.match('/pwa/fallback.html');
            }
        })
    );
});



