// This script runs in the page context to access cookies and make API calls
(function () {
  // Store headers from Twitter's own API calls
  let twitterHeaders = null;
  let headersReady = false;

  // Function to capture headers from a request
  function captureHeaders(headers) {
    if (!headers) return;

    const headerObj = {};
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        headerObj[key] = value;
      });
    } else if (headers instanceof Object) {
      // Copy all headers
      for (const [key, value] of Object.entries(headers)) {
        headerObj[key] = value;
      }
    }

    // Replace headers completely (don't merge) to ensure we get auth tokens
    twitterHeaders = headerObj;
    headersReady = true;
    console.log('Captured Twitter API headers:', Object.keys(headerObj));
  }

  // Intercept fetch to capture Twitter's headers
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const url = args[0];
    const options = args[1] || {};

    // If it's a Twitter GraphQL API call, capture ALL headers
    if (typeof url === 'string' && url.includes('x.com/i/api/graphql')) {
      if (options.headers) {
        captureHeaders(options.headers);
        console.log('Captured Twitter headers:', Object.keys(twitterHeaders || {}));
      }
    }

    return originalFetch.apply(this, args);
  };

  // Also intercept XMLHttpRequest
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (method, url, ...rest) {
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function (...args) {
    if (this._url && this._url.includes('x.com/i/api/graphql')) {
      const headers = {};
      // Try to get headers from setRequestHeader
      if (this._headers) {
        Object.assign(headers, this._headers);
      }
      captureHeaders(headers);
    }
    return originalXHRSend.apply(this, args);
  };

  const originalSetRequestHeader = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
    if (!this._headers) this._headers = {};
    this._headers[header] = value;
    return originalSetRequestHeader.apply(this, [header, value]);
  };

  // Wait a bit for Twitter to make some API calls first
  setTimeout(() => {
    if (!headersReady) {
      console.log('No Twitter headers captured yet, using defaults');
      twitterHeaders = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };
      headersReady = true;
    }
  }, 3000);

  // Listen for fetch requests from content script via postMessage
  window.addEventListener('message', async function (event) {
    // Only accept messages from our extension
    if (event.data && event.data.type === '__fetchLocation') {
      const { screenName, requestId } = event.data;

      // Helper to get CSRF token
      function getCsrfToken() {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'ct0') {
            return decodeURIComponent(value);
          }
        }
        return null;
      }

      try {
        const variables = JSON.stringify({ screenName });
        const url = `https://x.com/i/api/graphql/XRqGa7EeokUU5kppkh13EA/AboutAccountQuery?variables=${encodeURIComponent(variables)}`;

        // robust headers strategy
        const csrfToken = getCsrfToken();
        const headers = {
          'authorization': 'Bearer AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA',
          'x-csrf-token': csrfToken,
          'x-twitter-active-user': 'yes',
          'x-twitter-auth-type': 'OAuth2Session',
          'x-twitter-client-language': 'en',
          'content-type': 'application/json'
        };

        // Ensure credentials are included
        const response = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: headers,
        });

        let location = null;
        let joinedDate = null;
        let usernameChanges = null;
        let lastOn = null;
        let connectedVia = null;

        if (response.ok) {
          const data = await response.json();
          console.log(`API response for ${screenName}:`, data);

          const result = data?.data?.user_result_by_screen_name?.result;

          if (result) {
            // Location
            location = result.about_profile?.account_based_in || null;

            // Joined Date
            if (result.legacy && result.legacy.created_at) {
              // Format: "Fri Jan 01 00:00:00 +0000 2021" -> "2021-01-01"
              try {
                const date = new Date(result.legacy.created_at);
                joinedDate = date.toISOString().split('T')[0];
              } catch (e) {
                joinedDate = result.legacy.created_at;
              }
            }

            // Attempt to find other fields in verification_info or similar
            if (result.verification_info) {
              // "Connected via" often appears here for automated accounts or similar
              if (result.verification_info.reason && result.verification_info.reason.description) {
                // This might contain "This account is verified because..."
                // But specific "Connected via" label might be elsewhere.
                // We'll capture the reason text as a fallback for "Connected via" if it looks relevant.
                const reason = result.verification_info.reason.description.text;
                if (reason && (reason.includes("Connected") || reason.includes("Automated"))) {
                  connectedVia = reason;
                }
              }
            }

            // "Username changes" is specific to the "About this account" modal which might require a different query
            // or be part of a more detailed profile response. 
            // If it's not in the initial AboutAccountQuery, we might miss it without a separate call.
            // However, sometimes it's in `professional` or `business_account` data.

            // For now, we'll leave them as null if not found, but we've added the structure to support them.

            // Other fields might be in verification_info or business_account or specific label fields
            // Since the exact path for "Username changes", "Last on", "Connected via" can vary or be in a generic "label" list
            // We will try to find them in the about_profile or similar sections if they exist as structured data
            // Otherwise we might need to look for them in a generic "labels" array if X provides one.

            // For now, let's look for them in likely places based on typical API responses for "About this account"
            // Note: These specific fields are often dynamically generated text in the UI, but let's check for structured data.

            // Placeholder logic for fields that might need specific paths found during debugging
            // If we can't find them, they will remain null/Unknown
          }

        } else {
          const errorText = await response.text().catch(() => '');

          // Handle rate limiting
          if (response.status === 429) {
            const resetTime = response.headers.get('x-rate-limit-reset');

            if (resetTime) {
              // Store rate limit info for content script
              window.postMessage({
                type: '__rateLimitInfo',
                resetTime: parseInt(resetTime)
              }, '*');
            }
          }
        }

        // Send response back to content script via postMessage
        window.postMessage({
          type: '__locationResponse',
          screenName,
          location,
          joinedDate,
          usernameChanges,
          lastOn,
          connectedVia,
          requestId,
          isRateLimited: response.status === 429
        }, '*');
      } catch (error) {
        console.error('Error fetching details:', error);
        window.postMessage({
          type: '__locationResponse',
          screenName,
          location: null,
          requestId
        }, '*');
      }
    }
  });
})();
