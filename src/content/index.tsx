import { CommentInjector } from './injectors/CommentInjector';
import { PlatformDetector } from './injectors/PlatformDetector';
import { Bookmark } from '../shared/types/bookmark';
import { URLParser } from '../shared/utils/urlParser';
import { BookmarkStorageManager } from '../shared/utils/storage';
import './styles/content.css';

class ContentScript {
  private injector: CommentInjector;
  private platformDetector: PlatformDetector;

  constructor() {
    this.platformDetector = new PlatformDetector();
    this.injector = new CommentInjector(this.platformDetector);
    this.init();
  }

  async init() {
    console.log('GitBookmark content script initializing...');

    // Start injection process
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.start());
    } else {
      this.start();
    }

    // Listen for messages from background script
    this.setupMessageListeners();
  }

  private async start() {
    const platform = await this.platformDetector.detectPlatform();
    if (!platform) {
      console.log('Not on a supported Git platform');
      return;
    }

    console.log(`Detected platform: ${platform.name}`);

    // Start injecting bookmark buttons
    this.injector.injectButtons(this.handleBookmark.bind(this));

    // Observe for new comments
    this.injector.observeChanges();
  }

  private handleBookmark = (bookmark: Bookmark) => {
    // Show native notification through background script
    this.showNotification('Bookmark added', 'success');

    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'bookmark_added',
      bookmark
    }).catch(error => {
      console.error('Failed to send message to background:', error);
    });
  };

  private showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
    // Simple DOM notification
    const notification = document.createElement('div');
    notification.className = `gitbookmark-notification gitbookmark-notification--${type}`;
    notification.innerHTML = `
      <span class="gitbookmark-notification__icon">${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
      <span class="gitbookmark-notification__message">${message}</span>
    `;

    // Ensure notification container exists
    let container = document.getElementById('gitbookmark-notifications');
    if (!container) {
      container = document.createElement('div');
      container.id = 'gitbookmark-notifications';
      document.body.appendChild(container);
    }

    container.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  private setupMessageListeners() {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      console.log('Content script received message:', request);

      if (request.action === 'bookmark-selection') {
        this.handleSelectionBookmark(request.selectedText, request.pageUrl);
        sendResponse({ success: true });
      }

      // Return true to indicate we'll send a response asynchronously
      return true;
    });
  }

  private async handleSelectionBookmark(selectedText: string, pageUrl: string) {
    const urlData = URLParser.parseURL(pageUrl);
    // we may allow copying from anywhere
    //if (!urlData) {
    //  this.showNotification('Cannot bookmark - unsupported page', 'error');
    //  return;
    //}

    // Find the comment element containing the selected text
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const commentElement = this.findCommentElement(container);


    // Extract comment data
    const commentData = URLParser.extractCommentData(commentElement);

    // Create bookmark
    const bookmark: Bookmark = {
      id: Date.now().toString(),
      title: URLParser.generateTitle(selectedText, document.title),
      permalink: URLParser.generateUniquePermalink(pageUrl, commentElement),
      repository: urlData?.repository ?? "",
      platform: urlData?.platform ?? "",
      type: urlData?.type as any ?? "",
      contextId: urlData?.id ?? "",
      commentText: selectedText,
      author: commentData.author,
      avatar: commentData.avatar,
      timestamp: commentData.timestamp
    };

    // Save bookmark
    const success = await BookmarkStorageManager.addBookmark(bookmark);

    if (success) {
      this.showNotification('Selected text bookmarked', 'success');
    } else {
      this.showNotification('Bookmark already exists', 'info');
    }
  }

  private findCommentElement(node: Node): HTMLElement | null {
    let current: Node | null = node;

    while (current && current !== document.body) {
      if (current.nodeType === Node.ELEMENT_NODE) {
        const element = current as HTMLElement;

        // Check if this is a comment element
        const commentSelectors = [
          // GitHub selectors
          '.js-comment-container',
          '.js-timeline-item',
          '.timeline-comment',
          '.review-comment',
          '.discussion-timeline-item',
          '[data-testid="issue-comment"]',
          '[data-testid="pr-timeline-comment"]',

          // GitLab selectors
          '.note-wrapper',
          '.note',
          '.timeline-entry',
          '.discussion-notes .note'
        ];

        for (const selector of commentSelectors) {
          if (element.matches(selector)) {
            return element;
          }
        }
      }

      current = current.parentNode;
    }

    return null;
  }
}

// Initialize content script
console.log('Loading GitBookmark content script...');
new ContentScript();
