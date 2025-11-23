// content.js
console.log("MyXFollowing Exporter loaded")

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
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

// Main scraping function
async function scrapeData() {
  const users = []
  // Select all user cells in the list
  // This selector targets the standard user cell in the following/follower lists
  // Note: Twitter selectors change often, this is a best-effort guess based on current structure
  const userCells = document.querySelectorAll('[data-testid="UserCell"]')

  for (const cell of userCells) {
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

      // Mocking missing data that requires deep scraping (Location/Join Date)
      // In a real full extension, we'd fire an API call here for each user
      // For now, we set placeholders or try to parse bio for location

      users.push({
        rank: users.length + 1,
        name: name,
        handle: handle,
        followers: 0, // Not visible in simple list view usually
        country: "Unknown", // Would need profile visit
        flag: "🏳️",
        joinedDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        status: status,
      })
    } catch (e) {
      console.error("Error scraping cell:", e)
    }
  }

  return users
}

// Listen for messages from popup
window.chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "scrape") {
    scrapeData().then((data) => {
      sendResponse({ data: data, count: data.length })
    })
    return true // Keep message channel open for async response
  }
})
