// Background script for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('GitLab/GitHub Comment Bookmarks extension installed');
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // This will open the popup, no additional action needed
});

// Listen for bookmark updates from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'bookmark_added') {
    // Could show notification or update badge
    chrome.action.setBadgeText({ text: '✓', tabId: sender.tab.id });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId: sender.tab.id });
    }, 2000);
  }
});