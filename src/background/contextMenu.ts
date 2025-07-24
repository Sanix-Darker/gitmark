import { BookmarkStorageManager } from '../shared/utils/storage';
import { URLParser } from '../shared/utils/urlParser';

export function setupContextMenu() {
  // Create context menu items
  chrome.contextMenus.create({
    id: 'bookmark-selection',
    title: 'Git Bookmark selected text',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'bookmark-link',
    title: 'Git Bookmark this link',
    contexts: ['link']
  });

  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (!tab?.id) return;

    switch (info.menuItemId) {
      case 'bookmark-selection':
        await handleSelectionBookmark(info, tab);
        break;
      case 'bookmark-link':
        await handleLinkBookmark(info, tab);
        break;
    }
  });
}

async function handleSelectionBookmark(info: chrome.contextMenus.OnClickData, tab: chrome.tabs.Tab) {
  const selectedText = info.selectionText || '';
  const pageUrl = tab.url || '';

  // Send message to content script to get more context
  chrome.tabs.sendMessage(tab.id!, {
    action: 'bookmark-selection',
    selectedText,
    pageUrl
  });
}

async function handleLinkBookmark(info: chrome.contextMenus.OnClickData, _tab: chrome.tabs.Tab) {
  const linkUrl = info.linkUrl || '';

  // Parse the URL to see if it's a supported Git platform
  const urlData = URLParser.parseURL(linkUrl);

  if (urlData) {
    // Create a bookmark for the link
    const bookmark = {
      id: Date.now().toString(),
      title: `Link to ${urlData.type} #${urlData.id}`,
      permalink: linkUrl,
      repository: urlData.repository,
      platform: urlData.platform,
      type: urlData.type as any,
      contextId: urlData.id,
      commentText: '',
      author: 'Via context menu',
      avatar: '',
      timestamp: new Date().toISOString()
    };

    await BookmarkStorageManager.addBookmark(bookmark);

    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon-48.png',
      title: 'Bookmark Added',
      message: `Bookmarked ${urlData.type} #${urlData.id} from ${urlData.repository}`
    });
  }
}
