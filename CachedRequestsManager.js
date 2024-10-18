import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";

let requestsCachesExpirationTime = serverVariables.get("main.requests.CacheExpirationTime");

global.requestsCaches = [];
global.cachedRequestsCleanerStarted = false;

export default class CachedRequestsManager {
    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, requestsCachesExpirationTime * 1000);
        console.log(BgWhite + FgBlue, "[Periodic requests data caches cleaning process started...]");
    }

    static add(url, payload, ETag= "") {
        if(!cachedRequestsCleanerStarted){
            cachedRequestsCleanerStarted = true;
            this.startCachedRequestsCleaner();
        }

        if (url != "") {
            CachedRequestsManager.clear(url);
            requestsCaches.push({
                url,
                payload,
                ETag,
                Expire_Time: utilities.nowInSeconds() + requestsCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} request has been cached]`);
        }

    }

    static find(url) {
        try{
            if(url != ""){
                for(let cache of requestsCaches){
                    if(cache.url == url){

                        cache.Expire_Time = utilities.nowInSeconds() + requestsCachesExpirationTime;
                        console.log(BgWhite + FgBlue, `[Data of ${url.toString()} request has been retrieved from cached]`);
                        return cache;
                    }
                }
                return null;
            }
            return null;
        }
        catch(error){
            console.log(BgWhite + FgRed, "[request cache error!]", error);
            return null;
        }
    }

    static clear(url) {
        if(url != ""){
            let indexToDelete = [];
            let index = 0;

            for (let cache of requestsCaches){
                if(cache.url == url){
                    indexToDelete.push(index)
                    index++;
                }
            }
            utilities.deleteByIndex(requestsCaches, indexToDelete);
        }
    }

    static flushExpired() {
        let now = utilities.nowInSeconds();
        for(let cache of requestsCaches){
            if(cache.Expire_Time <= now){
                console.log(BgWhite + FgBlue, "Cached request data of " + cache.url + " expired");
            }
        }
        requestsCaches = requestsCaches.filter(cache => cache.Expire_Time > now);
    }

static get(HttpContext) {
    let url = HttpContext.req.url;
    let cachedRequest = CachedRequestsManager.find(url);

    if (HttpContext.req.method !== 'GET') {
        CachedRequestsManager.clear(url);
        return false; 
    }

    if (cachedRequest != null && cachedRequest.ETag != HttpContext.req.headers['if-none-match']) {
        HttpContext.response.JSON(cachedRequest.payload, cachedRequest.ETag, true);
        return true
    }
    return false;
}


}