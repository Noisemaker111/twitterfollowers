let scrapedData = []

// Initialize: Check if scraping is already in progress
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  if (tabs[0]) {
    chrome.tabs.sendMessage(tabs[0].id, { action: "getStatus" }, (response) => {
      if (chrome.runtime.lastError) {
        // Content script might not be loaded yet or not on X.com
        return;
      }

      if (response) {
        restoreState(response);
      }
    });
  }
});

function restoreState(state) {
  if (state.data && state.data.length > 0) {
    scrapedData = state.data;
  }

  if (state.status === 'Scraping') {
    document.getElementById("status").innerText = `Scraping... ${state.current}/${state.total}`;
    document.getElementById("limitSlider").value = state.total;
    document.getElementById("limitDisplay").innerText = state.total;
  } else if (state.status === 'RateLimited') {
    const resetDate = new Date(state.rateLimitReset * 1000);
    document.getElementById("status").innerText = `Rate Limited. Paused until ${resetDate.toLocaleTimeString()}...`;
  } else if (state.status === 'Completed') {
    document.getElementById("status").innerText = `Done! Found ${state.data.length} users.`;
    document.getElementById("downloadBtn").style.display = "block";
  }
}

// Listen for progress updates
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "progress") {
    document.getElementById("status").innerText = `Scraping... ${request.current}/${request.total}`
  } else if (request.action === "rateLimit") {
    const resetDate = new Date(request.resetTime * 1000);
    document.getElementById("status").innerText = `Rate Limited. Paused until ${resetDate.toLocaleTimeString()}...`;
  }
});

// Slider logic
const slider = document.getElementById("limitSlider")
const display = document.getElementById("limitDisplay")

slider.addEventListener("input", (e) => {
  display.innerText = e.target.value
})

document.getElementById("scrapeBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab.url.includes("twitter.com") && !tab.url.includes("x.com")) {
    document.getElementById("status").innerText = "Please go to x.com first."
    return
  }

  const limit = parseInt(slider.value, 10)
  // Immediate progress feedback
  document.getElementById("status").innerText = `Scraping... 0/${limit}`

  chrome.tabs.sendMessage(tab.id, { action: "scrape", limit: limit }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById("status").innerText = "Error: Refresh the page and try again."
      return
    }

    if (response && response.data) {
      scrapedData = response.data
      document.getElementById("status").innerText = `Done! Found ${response.count} users. Downloading...`
      document.getElementById("downloadBtn").style.display = "block"

      // Auto-download
      setTimeout(() => {
        document.getElementById("downloadBtn").click();
      }, 1000);

    } else {
      document.getElementById("status").innerText = "No users found. Try again."
    }
  })
})

document.getElementById("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `myxfollowing-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
})
