# BlockedByCountry (MyXFollowing)

A privacy-focused tool to visualize your Twitter/X network. See where your followers are from, when they joined, and who you've blocked, organized by country.

## 🚀 Getting Started

This project consists of two parts:
1. **Chrome Extension**: Scrapes your data locally from Twitter/X.
2. **Web Dashboard**: Visualizes the scraped data (runs locally or hosted).

### Step 1: Install the Chrome Extension

Since this is a custom tool, you'll need to install it in "Developer Mode":

1.  Download this project and unzip it.
2.  Open Chrome and navigate to `chrome://extensions`.
3.  Toggle **Developer mode** in the top right corner.
4.  Click **Load unpacked** (top left).
5.  Select the `chrome-extension` folder inside this project.
6.  The "MyXFollowing Exporter" extension should now appear in your list.

### Step 2: Get Your Data

1.  Go to [x.com](https://x.com) and log in.
2.  Navigate to your **Followers**, **Following**, or **Blocked** list (e.g., `https://x.com/your_handle/followers`).
3.  **Important**: Scroll down a little bit first to ensure the page is fully active.
4.  Click the **MyXFollowing extension icon** in your browser toolbar.
5.  Click **"Scrape Visible Users"**.
    *   The extension will automatically scroll down and collect user data.
    *   *Note: This process respects Twitter's rate limits. If it pauses, just wait.*
6.  When you have enough users, click **"Stop & Save"** (or wait for it to finish).
7.  Click **"Download JSON"** to save your `followers.json` file.

### Step 3: Visualize Your Network

1.  Open the web app (if running locally: `http://localhost:3000`, or use the public link provided).
2.  Click **"Import Data"** or **"Upload Extension Data"**.
3.  Select the `followers.json` file you just downloaded.
4.  Explore your dashboard!
    *   **Filter** by Status (Follower, Following, Blocked).
    *   **Search** by username or country.
    *   **View Charts** for join dates and account status distribution.

## 🛠 Troubleshooting

**"Joined Date" or "Country" shows as "-" or "Unknown"?**
*   **Fix**: This usually happens if the extension couldn't authenticate the background API request.
    1.  Refresh the Twitter page.
    2.  Scroll down to load at least one batch of new users *before* opening the extension.
    3.  Open the extension and try scraping again.
*   **Rate Limits**: If you see "Rate Limited", the extension will pause. This is normal. Wait 15 minutes or try again later.

## 🔒 Privacy

*   **Your data stays local.** The JSON file is generated in your browser and processed in your browser.
*   No data is sent to any external server.

## 🙏 Credits

This project was built with inspiration and code from:
*   [x-twitter_location_display](https://github.com/RAY1133/x-twitter_location_display)
*   [twitter-account-location-in-username](https://github.com/RhysSullivan/twitter-account-location-in-username)
