// content.js
console.log("MyXFollowing Exporter loaded")

// --- API & Location Infrastructure (Ported from Twitter Location Flag) ---

// Cache for user locations - persistent storage
let locationCache = new Map();
const CACHE_KEY = 'twitter_location_cache';
const CACHE_EXPIRY_DAYS = 30; // Cache for 30 days

// Rate limiting
const requestQueue = [];
let isProcessingQueue = false;
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds between requests to be safe
const MAX_CONCURRENT_REQUESTS = 2;
let activeRequests = 0;
let rateLimitResetTime = 0;

// Load cache
async function loadCache() {
  try {
    if (!chrome.runtime?.id) return;
    const result = await chrome.storage.local.get(CACHE_KEY);
    if (result[CACHE_KEY]) {
      const cached = result[CACHE_KEY];
      const now = Date.now();
      for (const [username, data] of Object.entries(cached)) {
        if (data.expiry && data.expiry > now && data.location !== null) {
          locationCache.set(username, data.location);
        }
      }
      console.log(`Loaded ${locationCache.size} cached locations`);
    }
  } catch (error) {
    console.error('Error loading cache:', error);
  }
}

// Save cache
async function saveCache() {
  try {
    if (!chrome.runtime?.id) return;
    const cacheObj = {};
    const now = Date.now();
    const expiry = now + (CACHE_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    for (const [username, location] of locationCache.entries()) {
      cacheObj[username] = { location, expiry, cachedAt: now };
    }
    await chrome.storage.local.set({ [CACHE_KEY]: cacheObj });
  } catch (error) {
    console.error('Error saving cache:', error);
  }
}

function saveCacheEntry(username, location) {
  locationCache.set(username, location);
  if (!saveCache.timeout) {
    saveCache.timeout = setTimeout(async () => {
      await saveCache();
      saveCache.timeout = null;
    }, 5000);
  }
}

function injectPageScript() {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('pageScript.js');
  script.onload = function() { this.remove(); };
  (document.head || document.documentElement).appendChild(script);
  
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === '__rateLimitInfo') {
      rateLimitResetTime = event.data.resetTime;
      console.log(`Rate limit detected. Reset at ${new Date(rateLimitResetTime * 1000).toLocaleTimeString()}`);
    }
  });
}

async function processRequestQueue() {
  if (isProcessingQueue || requestQueue.length === 0) return;
  
  if (rateLimitResetTime > 0) {
    const now = Math.floor(Date.now() / 1000);
    if (now < rateLimitResetTime) {
      const waitTime = (rateLimitResetTime - now) * 1000;
      setTimeout(processRequestQueue, Math.min(waitTime, 60000));
      return;
    }
    rateLimitResetTime = 0;
  }
  
  isProcessingQueue = true;
  
  while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    
    const { screenName, resolve, reject } = requestQueue.shift();
    activeRequests++;
    lastRequestTime = Date.now();
    
    makeLocationRequest(screenName)
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeRequests--;
        setTimeout(processRequestQueue, 100);
      });
  }
  isProcessingQueue = false;
}

function makeLocationRequest(screenName) {
  return new Promise((resolve, reject) => {
    const requestId = Date.now() + Math.random();
    const handler = (event) => {
      if (event.source !== window) return;
      if (event.data && event.data.type === '__locationResponse' && 
          event.data.screenName === screenName && event.data.requestId === requestId) {
        window.removeEventListener('message', handler);
        const location = event.data.location;
        if (!event.data.isRateLimited) {
          saveCacheEntry(screenName, location || null);
        }
        resolve(location || null);
      }
    };
    window.addEventListener('message', handler);
    window.postMessage({ type: '__fetchLocation', screenName, requestId }, '*');
    setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(null);
    }, 10000);
  });
}

function getUserLocation(screenName) {
  if (locationCache.has(screenName)) {
    const cached = locationCache.get(screenName);
    if (cached !== null) return Promise.resolve(cached);
    locationCache.delete(screenName); // Retry if null
  }
  return new Promise((resolve, reject) => {
    requestQueue.push({ screenName, resolve, reject });
    processRequestQueue();
  });
}

// --- End Infrastructure ---

// Helper to wait for elements
const waitForElement = (selector) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector))
    }
    const observer = new MutationObserver((mutations) => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector))
        observer.disconnect()
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })
  })
}

// Main scraping function
async function scrapeData() {
  const users = []
  // Select all user cells in the list
  const userCells = document.querySelectorAll('[data-testid="UserCell"]')
  console.log(`Found ${userCells.length} users to process. This may take a while due to API calls...`);

  for (let i = 0; i < userCells.length; i++) {
    const cell = userCells[i];
    try {
      // Extract Handle
      const handleElement = cell.querySelector('a[href^="/"] div[dir="ltr"] > span')
      const handle = handleElement ? handleElement.textContent.replace("@", "") : "unknown"

      // Extract Name
      const nameElement = cell.querySelector('div[dir="auto"] > span > span')
      const name = nameElement ? nameElement.textContent : "Unknown"

      // Extract Bio (if visible)
      const bioElement = cell.querySelector('div[dir="auto"][lang]')
      const bio = bioElement ? bioElement.textContent : ""

      // Determine Status based on current URL or tab
      let status = "follower"
      if (window.location.href.includes("following")) status = "following"
      if (window.location.href.includes("blocked")) status = "blocked"

      // Fetch real location
      let location = "Unknown";
      let flag = "🏳️";

      if (handle !== "unknown") {
        try {
          // Fetch from API (cached or new request)
          const fetchedLocation = await getUserLocation(handle);
          if (fetchedLocation) {
            location = fetchedLocation;
            const flagEmoji = getCountryFlag(location);
            if (flagEmoji) flag = flagEmoji;
          }
        } catch (err) {
          console.error(`Failed to fetch location for ${handle}`, err);
        }
      }

      users.push({
        rank: users.length + 1,
        name: name,
        handle: handle,
        followers: 0, // Not visible in simple list view usually
        country: location,
        flag: flag,
        joinedDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        status: status,
      })

      // Send progress update
      chrome.runtime.sendMessage({ action: "progress", current: users.length, total: userCells.length });

      // Log progress
      if (users.length % 5 === 0) {
        console.log(`Processed ${users.length}/${userCells.length} users`);
      }

    } catch (e) {
      console.error("Error scraping cell:", e)
    }
  }

  return users
}

// Initialize
injectPageScript();
loadCache();

// Listen for messages from popup
window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    scrapeData().then((data) => {
      sendResponse({ data: data, count: data.length })
    })
    return true // Keep message channel open for async response
  }
})