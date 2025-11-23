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
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests to be safe
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
  script.onload = function () { this.remove(); };
  (document.head || document.documentElement).appendChild(script);

  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data && event.data.type === '__rateLimitInfo') {
      rateLimitResetTime = event.data.resetTime;
      console.log(`Rate limit detected. Reset at ${new Date(rateLimitResetTime * 1000).toLocaleTimeString()}`);

      scrapingState.status = 'RateLimited';
      scrapingState.rateLimitReset = rateLimitResetTime;

      chrome.runtime.sendMessage({
        action: "rateLimit",
        resetTime: rateLimitResetTime
      }, (response) => {
        if (chrome.runtime.lastError) {
          // Popup closed, ignore
        }
      });
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
// Main scraping function
let scrapingState = {
  isScraping: false,
  current: 0,
  total: 0,
  data: [],
  status: 'Ready', // 'Ready', 'Scraping', 'RateLimited', 'Completed'
  rateLimitReset: null
};

async function scrapeData(limit = 50) {
  const users = new Map(); // Use Map to avoid duplicates by handle
  let lastHeight = 0;
  let noNewUsersCount = 0;
  const MAX_NO_NEW_USERS = 3; // Stop after 3 scrolls with no new users

  scrapingState.isScraping = true;
  scrapingState.total = limit;
  scrapingState.status = 'Scraping';
  scrapingState.data = [];
  scrapingState.current = 0;

  console.log(`Starting scrape with limit: ${limit}`);

  while (users.size < limit) {
    // Select all user cells in the list
    const userCells = document.querySelectorAll('[data-testid="UserCell"]');
    let newUsersFound = false;

    for (let i = 0; i < userCells.length; i++) {
      if (users.size >= limit) break;

      const cell = userCells[i];
      try {
        // Extract Handle
        const handleElement = cell.querySelector('a[href^="/"] div[dir="ltr"] > span');
        const handle = handleElement ? handleElement.textContent.replace("@", "") : "unknown";

        if (handle === "unknown" || users.has(handle)) continue;

        // Extract Display Name (for reference, but we use handle as name per request)
        const displayNameElement = cell.querySelector('div[dir="auto"] > span > span');
        const displayName = displayNameElement ? displayNameElement.textContent : "Unknown";

        // Extract Bio (if visible)
        const bioElement = cell.querySelector('div[dir="auto"][lang]');
        const bio = bioElement ? bioElement.textContent : "";

        // Determine Status based on current URL or tab
        let status = "Follower";
        if (window.location.href.includes("following")) status = "Following";
        if (window.location.href.includes("blocked")) status = "Blocked";

        // Fetch real location and other details
        let location = "Unknown";
        let flag = "🏳️";
        let joinedDate = "Unknown";
        let usernameChanges = "Unknown";
        let lastOn = "Unknown";
        let connectedVia = "Unknown";

        if (handle !== "unknown") {
          try {
            // Fetch from API (cached or new request)
            const fetchedData = await getUserLocation(handle);
            if (fetchedData) {
              if (fetchedData.location) {
                location = fetchedData.location;
                const flagEmoji = getCountryFlag(location);
                if (flagEmoji) flag = flagEmoji;
              }
              if (fetchedData.joinedDate) joinedDate = fetchedData.joinedDate;
              if (fetchedData.usernameChanges) usernameChanges = fetchedData.usernameChanges;
              if (fetchedData.lastOn) lastOn = fetchedData.lastOn;
              if (fetchedData.connectedVia) connectedVia = fetchedData.connectedVia;
            }
          } catch (err) {
            console.error(`Failed to fetch details for ${handle}`, err);
          }
        }

        const userData = {
          rank: users.size + 1,
          name: handle, // Requested: use handle as name
          handle: handle,
          displayName: displayName,
          followers: 0, // Not visible in simple list view usually
          country: location,
          flag: flag,
          joinedDate: joinedDate,
          usernameChanges: usernameChanges,
          lastOn: lastOn,
          connectedVia: connectedVia,
          status: status,
          bio: bio
        };

        users.set(handle, userData);

        // Update State
        scrapingState.current = users.size;
        scrapingState.data = Array.from(users.values());

        newUsersFound = true;

        // Send progress update safely
        try {
          chrome.runtime.sendMessage({ action: "progress", current: users.size, total: limit }, (response) => {
            if (chrome.runtime.lastError) {
              // Popup is likely closed, ignore error
            }
          });
        } catch (e) {
          // Ignore
        }

      } catch (e) {
        console.error("Error scraping cell:", e);
      }
    }

    if (!newUsersFound) {
      noNewUsersCount++;
      console.log(`No new users found. Attempt ${noNewUsersCount}/${MAX_NO_NEW_USERS}`);
      // Try scrolling up a bit then back down to trigger load
      window.scrollBy(0, -500);
      await new Promise(resolve => setTimeout(resolve, 1000));
      window.scrollTo(0, document.body.scrollHeight);
    } else {
      noNewUsersCount = 0;
    }

    if (noNewUsersCount >= MAX_NO_NEW_USERS) {
      console.log("No new users found after multiple scrolls. Stopping.");
      break;
    }

    // Scroll down
    window.scrollTo(0, document.body.scrollHeight);

    // Dynamic wait time: longer if we are finding fewer users or if the list is long
    const waitTime = newUsersFound ? 2500 : 4000;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  scrapingState.isScraping = false;
  scrapingState.status = 'Completed';

  return Array.from(users.values());
}

// Initialize
injectPageScript();
loadCache();

// Listen for messages from popup
window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    if (scrapingState.isScraping) {
      sendResponse({ status: 'already_running' });
      return;
    }
    scrapeData(request.limit || 50).then((data) => {
      sendResponse({ data: data, count: data.length });
    });
    return true; // Keep message channel open for async response
  } else if (request.action === "getStatus") {
    sendResponse(scrapingState);
  }
});