// Background script for the extension
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onInstalled) {
  chrome.runtime.onInstalled.addListener(() => {
    console.log('GitLab/GitHub Comment Bookmarks extension installed');
  });
}

// Handle extension icon click
if (typeof chrome !== 'undefined' && chrome.action && chrome.action.onClicked) {
  chrome.action.onClicked.addListener((tab) => {
    // This will open the popup, no additional action needed
  });
}

// Listen for bookmark updates from content scripts
if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'bookmark_added') {
      // Could show notification or update badge
      if (chrome.action && chrome.action.setBadgeText && sender.tab) {
        chrome.action.setBadgeText({ text: '✓', tabId: sender.tab.id });
        setTimeout(() => {
          chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
        }, 2000);
      }
    }
  });
}
