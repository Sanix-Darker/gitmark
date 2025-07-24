export function setupMessageHandlers() {
  console.log('Setting up message handlers...');

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Background received message:', request.action);

    switch (request.action) {
      case 'bookmark_added':
        handleBookmarkAdded(request.bookmark, sender.tab);
        sendResponse({ success: true });
        break;

      case 'get_current_tab':
        handleGetCurrentTab(sendResponse);
        return true; // Keep channel open for async response

      case 'check_bookmark_status':
        handleCheckBookmarkStatus(request.url, sendResponse);
        return true;

      default:
        console.log('Unknown message action:', request.action);
        sendResponse({ error: 'Unknown action' });
    }
  });
}

function handleBookmarkAdded(bookmark: any, tab?: chrome.tabs.Tab) {
  console.log('Bookmark added:', bookmark);

  // Show badge notification
  if (tab?.id) {
    chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50', tabId: tab.id });

    // Clear badge after 2 seconds
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }, 2000);
  }
}

async function handleGetCurrentTab(sendResponse: (response: any) => void) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    sendResponse({ tab });
  } catch (error) {
    console.error('Failed to get current tab:', error);
    sendResponse({ error: 'Failed to get current tab' });
  }
}

async function handleCheckBookmarkStatus(url: string, sendResponse: (response: any) => void) {
  try {
    const { BookmarkStorageManager } = await import('../shared/utils/storage');
    const bookmarks = await BookmarkStorageManager.getBookmarks();

    // Check if URL is bookmarked
    const isBookmarked = Object.values(bookmarks)
      .flat()
      .some(bookmark => bookmark.permalink === url);

    sendResponse({ isBookmarked });
  } catch (error) {
    console.error('Failed to check bookmark status:', error);
    sendResponse({ error: 'Failed to check bookmark status' });
  }
}
