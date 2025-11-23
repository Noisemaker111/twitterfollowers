// This script runs in the page context to access cookies and make API calls
;(() => {
  // Store headers from Twitter's own API calls
  let twitterHeaders = null
  let headersReady = false

  // Function to capture headers from a request
  function captureHeaders(headers) {
    if (!headers) return

    const headerObj = {}
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        headerObj[key] = value
      })
    } else if (headers instanceof Object) {
      // Copy all headers
      for (const [key, value] of Object.entries(headers)) {
        headerObj[key] = value
      }
    }

    // Replace headers completely (don't merge) to ensure we get auth tokens
    twitterHeaders = headerObj
    headersReady = true
    console.log("Captured Twitter API headers:", Object.keys(headerObj))
  }

  // Intercept fetch to capture Twitter's headers
  const originalFetch = window.fetch
  window.fetch = function (...args) {
    const url = args[0]
    const options = args[1] || {}

    // If it's a Twitter GraphQL API call, capture ALL headers
    if (typeof url === "string" && url.includes("x.com/i/api/graphql")) {
      if (options.headers) {
        captureHeaders(options.headers)
        console.log("Captured Twitter headers:", Object.keys(twitterHeaders || {}))
      }
    }

    return originalFetch.apply(this, args)
  }

  // Also intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open
  const originalXHRSend = XMLHttpRequest.prototype.send

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url
    return originalXHROpen.apply(this, [method, url, ...rest])
  }

  XMLHttpRequest.prototype.send = function (...args) {
    if (this._url && this._url.includes("x.com/i/api/graphql")) {
      const headers = {}
      // Try to get headers from setRequestHeader
      if (this._headers) {
        Object.assign(headers, this._headers)
      }
      captureHeaders(headers)
    }
    return originalXHRSend.apply(this, args)
  }

  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader
  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    if (!this._headers) this._headers = {}
    this._headers[header] = value
    return originalSetRequestHeader.apply(this, [header, value])
  }

  // Wait a bit for Twitter to make some API calls first
  setTimeout(() => {
    if (!headersReady) {
      console.log("No Twitter headers captured yet, using defaults")
      twitterHeaders = {
        Accept: "*/*",
        "Content-Type": "application/json",
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "en",
      }
      headersReady = true
    }
  }, 3000)

  // Listen for fetch requests from content script via postMessage
  window.addEventListener("message", async (event) => {
    // Only accept messages from our extension
    if (event.data && event.data.type === "__fetchLocation") {
      const { screenName, requestId } = event.data

      // Helper to get CSRF token
      function getCsrfToken() {
        const cookies = document.cookie.split(";")
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split("=")
          if (name === "ct0") {
            return decodeURIComponent(value)
          }
        }
        return null
      }

      await new Promise((r) => setTimeout(r, Math.random() * 500 + 200))

      try {
        const variables = JSON.stringify({
          screen_name: screenName,
          withSafetyModeUserFields: true,
        })

        const features = JSON.stringify({
          hidden_profile_likes_enabled: true,
          hidden_profile_subscriptions_enabled: true,
          responsive_web_graphql_exclude_directive_enabled: true,
          verified_phone_label_enabled: false,
          subscriptions_verification_info_is_identity_verified_enabled: true,
          subscriptions_verification_info_verified_since_enabled: true,
          highlights_tweets_tab_ui_enabled: true,
          responsive_web_twitter_article_notes_tab_enabled: true,
          creator_subscriptions_tweet_preview_api_enabled: true,
          responsive_web_graphql_skip_user_profile_image_extensions_enabled: false,
          responsive_web_graphql_timeline_navigation_enabled: true,
        })

        // Use UserByScreenName query ID which is more standard
        const url = `https://x.com/i/api/graphql/sLVLhk0bGj396p255w7mnw/UserByScreenName?variables=${encodeURIComponent(variables)}&features=${encodeURIComponent(features)}`

        // robust headers strategy
        const csrfToken = getCsrfToken()
        const headers = {
          authorization:
            "Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA",
          "x-csrf-token": csrfToken,
          "x-twitter-active-user": "yes",
          "x-twitter-auth-type": "OAuth2Session",
          "x-twitter-client-language": "en",
          "content-type": "application/json",
        }

        // Ensure credentials are included
        const response = await fetch(url, {
          method: "GET",
          credentials: "include",
          headers: headers,
        })

        let location = null
        let joinedDate = null
        const usernameChanges = null
        const lastOn = null
        let connectedVia = null

        if (response.ok) {
          const data = await response.json()
          console.log(`API response for ${screenName}:`, data)

          const result = data?.data?.user?.result

          if (result) {
            // Location - prefer the specific country code if available (often in verification info or specialized fields)
            // But standard profile location is result.legacy.location
            location = result.legacy.location || null

            // Joined Date
            if (result.legacy && result.legacy.created_at) {
              // Format: "Fri Jan 01 00:00:00 +0000 2021" -> "2021-01-01"
              try {
                const date = new Date(result.legacy.created_at)
                joinedDate = date.toISOString().split("T")[0]
              } catch (e) {
                joinedDate = result.legacy.created_at
              }
            }

            if (result.verification_info?.reason?.description?.text) {
              connectedVia = result.verification_info.reason.description.text
            }
          }
        } else {
          const errorText = await response.text().catch(() => "")

          // Handle rate limiting
          if (response.status === 429) {
            const resetTime = response.headers.get("x-rate-limit-reset")

            if (resetTime) {
              // Store rate limit info for content script
              window.postMessage(
                {
                  type: "__rateLimitInfo",
                  resetTime: Number.parseInt(resetTime),
                },
                "*",
              )
            }
          }
        }

        // Send response back to content script via postMessage
        window.postMessage(
          {
            type: "__locationResponse",
            screenName,
            location,
            joinedDate,
            usernameChanges,
            lastOn,
            connectedVia,
            requestId,
            isRateLimited: response.status === 429,
          },
          "*",
        )
      } catch (error) {
        console.error("Error fetching details:", error)
        window.postMessage(
          {
            type: "__locationResponse",
            screenName,
            location: null,
            requestId,
          },
          "*",
        )
      }
    }
  })
})()
