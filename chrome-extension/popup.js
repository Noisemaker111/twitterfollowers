let scrapedData = []
const chrome = window.chrome // Declare the chrome variable

document.getElementById("scrapeBtn").addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })

  if (!tab.url.includes("twitter.com") && !tab.url.includes("x.com")) {
    document.getElementById("status").innerText = "Please go to x.com first."
    return
  }

  document.getElementById("status").innerText = "Scraping..."

  chrome.tabs.sendMessage(tab.id, { action: "scrape" }, (response) => {
    if (chrome.runtime.lastError) {
      document.getElementById("status").innerText = "Error: Refresh the page and try again."
      return
    }

    if (response && response.data) {
      scrapedData = response.data
      document.getElementById("status").innerText = `Found ${response.count} users!`
      document.getElementById("downloadBtn").style.display = "block"
    } else {
      document.getElementById("status").innerText = "No users found. Scroll down to load more."
    }
  })
})

document.getElementById("downloadBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(scrapedData, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "myxfollowing-data.json"
  a.click()
})
