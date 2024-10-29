
import * as utilities from './utilities.js';
import Repository from './models/repository.js';
import * as serverVariables from "./serverVariables.js";
import { log } from "./log.js";
global.requestCacheExpirationTime = serverVariables.get("main.requestCache.expirationTime");

// Get requests cache
global.cachedRequests = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
    static add(url, content, ETag = "") {
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            cachedRequests.push({ url, content, ETag, Expire_Time: utilities.nowInSeconds() + requestCacheExpirationTime });
            console.log(BgCyan + FgWhite, `[Response content of request GET: ${url} has been cached]`);
        }
    }
    static startCachedRequestsCleaner() {
        // periodic cleaning of expired cached requests
        setInterval(CachedRequestsManager.flushExpired, requestCacheExpirationTime * 1000);
        console.log(BgCyan + FgWhite, "Periodic cached requests content cleaning process started...");
    }
    static find(url) {
        try {
            if (url != "") {
                for (let cache of cachedRequests) {
                    if (cache.url == url) {
                        // renew cached url
                        cache.Expire_Time = utilities.nowInSeconds() + requestCacheExpirationTime;
                        console.log(BgCyan + FgWhite, `[Response content of request Get: ${url} retrieved from cache]`);
                        return cache;
                    }
                }
            }
        } catch (error) {
            console.log("requests cache error", error);
        }
        return null;
    }
    static clear(url) {
        if (url != "")
            cachedRequests = cachedRequests.filter(cache => cache.url.toLowerCase().indexOf(url.toLowerCase()) == -1);
    }
    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let endpoint of cachedRequests) {
            if (endpoint.Expire_Time <= now)
                console.log(BgCyan + FgWhite, `[Cached response content of request GET:${endpoint.url} expired]`);
        }
        cachedRequests = cachedRequests.filter(endpoint => endpoint.Expire_Time > now);
    }
    static get(HttpContext) {
        //If the request is cacheable
        if (HttpContext.isCacheable) {
            let cacheFound = CachedRequestsManager.find(HttpContext.req.url);
            if (cacheFound) { //If cache found

                //If the ETag of the cached request is the same as the current ETag
                if (Repository.getETag(HttpContext.path.model) == cacheFound.ETag) {
                    //Return the cached content
                    HttpContext.response.JSON(cacheFound.content, cacheFound.ETag, true);
                    return true; //Return true to stop the request processing
                } else {
                    //If the ETag of the cached request is different from the current ETag
                    //Clear the cache
                    CachedRequestsManager.clear(HttpContext.path.model);
                    return false; //Return false to continue the request processing
                }

            }
        }
        //If the request is not cacheable
        return false;
    }
}