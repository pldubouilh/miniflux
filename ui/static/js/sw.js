let long_cache, short_cache;

caches.open("long_cache").then(_cache => { long_cache = _cache })
caches.open("short_cache").then(_cache => { short_cache = _cache })

const trimEntry = e => e.includes("/entry/") ? e.split("/entry/")[1] : e

// cache first, network fallback
async function cache_or_nw(req, cache, url) {
    let res = await cache.match(url);
    if (!res) {
        try {
            res = await fetch(req);
            await cache.put(url, res.clone());
        } catch (e) {}
    }
    return res
}

// network first, cache fallback
async function nw_or_cache(req, cache, url) {
    let res
    try {
        res = await fetch(req);
        await cache.put(url, res.clone());
    } catch (error) {
        res = await cache.match(url);
    }

    return res
}

async function cleanup() {
    console.log("do cleanup here :)")
}

self.addEventListener("fetch", async (event) => {
    if (!long_cache || !short_cache) return;
    if (event.request.method !== "GET" || !event.request.url.startsWith(location.origin)) return;
    if (short_cache.keys().length > 500) await cleanup()

    const url = event.request.url.includes("/entry/") ? event.request.url.split("/entry/")[1] : event.request.url

    if (url.includes("/icon/")) {
        event.respondWith(cache_or_nw(event.request, long_cache, url))
    } else {
        event.respondWith(nw_or_cache(event.request, short_cache, url))
    }
});

