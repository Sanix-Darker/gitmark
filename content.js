// Content script for GitLab/GitHub comment bookmarking
// Using vanilla JS to avoid module import issues

// Global variable to store platform configurations
let PLATFORM_CONFIGS = null;

// Load platform configurations from JSON file
async function loadPlatformConfigs() {
  if (PLATFORM_CONFIGS) return PLATFORM_CONFIGS;

  try {
    const response = await fetch(chrome.runtime.getURL('config/platform-selectors.json'));
    PLATFORM_CONFIGS = await response.json();
    console.log('Platform configurations loaded:', Object.keys(PLATFORM_CONFIGS));
    return PLATFORM_CONFIGS;
  } catch (error) {
    console.error('Failed to load platform configurations:', error);
    // Fallback to empty config
    PLATFORM_CONFIGS = {};
    return PLATFORM_CONFIGS;
  }
}

// Helper functions for easy access
async function getPlatformConfig(platformName) {
  const configs = await loadPlatformConfigs();
  return configs[platformName.toLowerCase()] || null;
}

async function getPlatformByDomain(hostname) {
  const configs = await loadPlatformConfigs();
  for (const [key, config] of Object.entries(configs)) {
    if (config.domains.some(domain => hostname.includes(domain))) {
      return { key, config };
    }
  }
  return null;
}

async function getAllSelectorsForPlatform(platformName) {
  const config = await getPlatformConfig(platformName);
  if (!config) return [];

  return [
    ...config.commentSelectors,
    ...config.headerSelectors,
    ...config.actionsSelectors,
    ...Object.values(config.dataSelectors).flat()
  ];
}

// Debug helper
async function debugPlatformSelectors(platformName) {
  const config = await getPlatformConfig(platformName);
  if (!config) {
    console.log(`Platform "${platformName}" not found`);
    return;
  }

  console.log(`=== ${config.name} Selectors ===`);
  console.log('Comment Selectors:', config.commentSelectors);
  console.log('Header Selectors:', config.headerSelectors);
  console.log('Actions Selectors:', config.actionsSelectors);
  console.log('Data Selectors:', config.dataSelectors);
}

// URL Parser utilities
class URLParser {
  static parseGitLabURL(url) {
    const gitlabRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/-?\/(merge_requests|issues|epics)\/(\d+)(?:#note_(\d+))?/;
    const match = url.match(gitlabRegex);

    if (!match) return null;

    const [, domain, repository, type, id, noteId] = match;

    return {
      platform: 'gitlab',
      domain,
      repository,
      type,
      id: parseInt(id),
      noteId: noteId ? parseInt(noteId) : null,
      permalink: url
    };
  }

  static parseGitHubURL(url) {
    const githubRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/(issues|pull|discussions)\/(\d+)(?:#issuecomment-(\d+))?/;
    const match = url.match(githubRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'github',
      domain,
      repository,
      type: type === 'pull' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : null,
      permalink: url
    };
  }

  static parseGiteaURL(url) {
    const giteaRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/(issues|pulls)\/(\d+)(?:#issuecomment-(\d+))?/;
    const match = url.match(giteaRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'gitea',
      domain,
      repository,
      type: type === 'pulls' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : null,
      permalink: url
    };
  }

  static parseBitbucketURL(url) {
    const bitbucketRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/(issues|pull-requests)\/(\d+)(?:#comment-(\d+))?/;
    const match = url.match(bitbucketRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'bitbucket',
      domain,
      repository,
      type: type === 'pull-requests' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : null,
      permalink: url
    };
  }

  static parseSourcehutURL(url) {
    const sourcehutRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/(issues|patches)\/(\d+)(?:#comment-(\d+))?/;
    const match = url.match(sourcehutRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'sourcehut',
      domain,
      repository,
      type: type === 'patches' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : null,
      permalink: url
    };
  }

  static parseAzureDevOpsURL(url) {
    const azureRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/_workitems\/edit\/(\d+)(?:#comment-(\d+))?/;
    const match = url.match(azureRegex);

    if (!match) return null;

    const [, domain, repository, id, commentId] = match;

    return {
      platform: 'azure',
      domain,
      repository,
      type: 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : null,
      permalink: url
    };
  }

  static parseURL(url) {
    return this.parseGitLabURL(url) ||
           this.parseGitHubURL(url) ||
           this.parseGiteaURL(url) ||
           this.parseBitbucketURL(url) ||
           this.parseSourcehutURL(url) ||
           this.parseAzureDevOpsURL(url);
  }

  static generateTitle(commentText, contextTitle) {
    // Take first 40 characters of comment or fallback to context
    const commentPreview = commentText?.substring(0, 40).trim();
    if (commentPreview) {
      return commentPreview + (commentText.length > 40 ? '...' : '');
    }
    return contextTitle || 'Untitled Bookmark';
  }

  static extractCommentData(element) {
    // Detect platform for this element
    const hostname = window.location.hostname.toLowerCase();

    // This method needs to be async now, but we'll handle it in the caller
    return this.extractCommentDataSync(element);
  }

  static async extractCommentDataAsync(element) {
    const hostname = window.location.hostname.toLowerCase();
    const platformInfo = await getPlatformByDomain(hostname);

    let commentText = '';
    let author = 'Unknown';
    let avatar = '';
    let timestamp = new Date().toISOString();

    if (platformInfo) {
      const { config } = platformInfo;

      // Extract comment text using platform-specific selectors
      for (const selector of config.dataSelectors.commentText) {
        const textElement = element.querySelector(selector);
        if (textElement?.textContent?.trim()) {
          commentText = textElement.textContent.trim();
          break;
        }
      }

      // Extract author using platform-specific selectors
      for (const selector of config.dataSelectors.author) {
        const authorElement = element.querySelector(selector);
        if (authorElement) {
          author = authorElement.textContent?.trim() ||
                  authorElement.getAttribute('data-username') ||
                  authorElement.getAttribute('data-user') ||
                  'Unknown';
          if (author !== 'Unknown') break;
        }
      }

      // Extract avatar using platform-specific selectors
      for (const selector of config.dataSelectors.avatar) {
        const avatarElement = element.querySelector(selector);
        if (avatarElement?.src) {
          avatar = avatarElement.src;
          break;
        }
      }

      // Extract timestamp using platform-specific selectors
      for (const selector of config.dataSelectors.timestamp) {
        const timeElement = element.querySelector(selector);
        if (timeElement) {
          timestamp = timeElement.getAttribute('datetime') ||
                     timeElement.textContent ||
                     new Date().toISOString();
          break;
        }
      }
    } else {
      // Fallback to generic selectors if platform not detected
      const genericSelectors = {
        commentText: ['.md', '.comment-body', '.note-text', 'p'],
        author: ['[data-username]', '.author', 'a[href*="/users/"]'],
        avatar: ['.avatar', 'img[alt*="avatar"]'],
        timestamp: ['time', '[datetime]', '.created-at']
      };

      // Generic extraction logic
      for (const selector of genericSelectors.commentText) {
        const textElement = element.querySelector(selector);
        if (textElement?.textContent?.trim()) {
          commentText = textElement.textContent.trim();
          break;
        }
      }

      for (const selector of genericSelectors.author) {
        const authorElement = element.querySelector(selector);
        if (authorElement?.textContent?.trim()) {
          author = authorElement.textContent.trim();
          break;
        }
      }

      for (const selector of genericSelectors.avatar) {
        const avatarElement = element.querySelector(selector);
        if (avatarElement?.src) {
          avatar = avatarElement.src;
          break;
        }
      }

      for (const selector of genericSelectors.timestamp) {
        const timeElement = element.querySelector(selector);
        if (timeElement) {
          timestamp = timeElement.getAttribute('datetime') ||
                     timeElement.textContent ||
                     new Date().toISOString();
          break;
        }
      }
    }

    return {
      commentText,
      author,
      avatar,
      timestamp
    };
  }

  static extractCommentDataSync(element) {
    // Fallback synchronous method using generic selectors
    const genericSelectors = {
      commentText: ['.md', '.comment-body', '.note-text', '.markdown-body', '.NewMarkdownViewer-module__safe-html-box--cRsz0', 'p'],
      author: ['[data-username]', '.author', '.ActivityHeader-module__AuthorLink--iofTU', '[data-testid="avatar-link"]', 'a[href*="/users/"]'],
      avatar: ['.avatar', 'img[alt*="avatar"]', '[data-testid="github-avatar"]', 'img[src*="avatar"]'],
      timestamp: ['time', '[datetime]', '.created-at', 'relative-time']
    };

    let commentText = '';
    let author = 'Unknown';
    let avatar = '';
    let timestamp = new Date().toISOString();

    // Generic extraction logic
    for (const selector of genericSelectors.commentText) {
      const textElement = element.querySelector(selector);
      if (textElement?.textContent?.trim()) {
        commentText = textElement.textContent.trim();
        break;
      }
    }

    for (const selector of genericSelectors.author) {
      const authorElement = element.querySelector(selector);
      if (authorElement?.textContent?.trim()) {
        author = authorElement.textContent.trim();
        break;
      }
    }

    for (const selector of genericSelectors.avatar) {
      const avatarElement = element.querySelector(selector);
      if (avatarElement?.src) {
        avatar = avatarElement.src;
        break;
      }
    }

    for (const selector of genericSelectors.timestamp) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        timestamp = timeElement.getAttribute('datetime') ||
                   timeElement.textContent ||
                   new Date().toISOString();
        break;
      }
    }

    return {
      commentText,
      author,
      avatar,
      timestamp
    };
  }
}

// Storage utilities
class BookmarkStorage {
  static STORAGE_KEY = 'gitlab_github_bookmarks';

  static async getBookmarks() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([this.STORAGE_KEY]);
        return result[this.STORAGE_KEY] || {};
      } else {
        // Fallback for development/testing
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : {};
      }
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return {};
    }
  }

  static async saveBookmarks(bookmarks) {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({
          [this.STORAGE_KEY]: bookmarks
        });
      } else {
        // Fallback for development/testing
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
      }
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
      throw error;
    }
  }

  static async addBookmark(bookmark) {
    const bookmarks = await this.getBookmarks();
    const repoKey = bookmark.repository;

    if (!bookmarks[repoKey]) {
      bookmarks[repoKey] = [];
    }

    // Check for duplicates
    const exists = bookmarks[repoKey].find(b => {
      // For comments with specific IDs, check the full permalink
      if (bookmark.permalink.includes('#note_') || bookmark.permalink.includes('#issuecomment-')) {
        return b.permalink === bookmark.permalink;
      }
      // For general page bookmarks, check repository + contextId + author + timestamp proximity
      const timeDiff = Math.abs(new Date(b.timestamp).getTime() - new Date(bookmark.timestamp).getTime());
      return b.repository === bookmark.repository &&
             b.contextId === bookmark.contextId &&
             b.author === bookmark.author &&
             timeDiff < 60000; // Within 1 minute
    });

    if (exists) {
      return false;
    }

    bookmarks[repoKey].unshift(bookmark);
    await this.saveBookmarks(bookmarks);
    return true;
  }

  static async removeBookmark(repository, bookmarkId) {
    const bookmarks = await this.getBookmarks();
    if (bookmarks[repository]) {
      bookmarks[repository] = bookmarks[repository].filter(b => b.id !== bookmarkId);
      if (bookmarks[repository].length === 0) {
        delete bookmarks[repository];
      }
      await this.saveBookmarks(bookmarks);
    }
  }
}

// Main bookmarker class
class CommentBookmarker {
  constructor() {
    this.injectedButtons = new Map();
    this.init();
  }

  init() {
    console.log('GitLab/GitHub Comment Bookmarker initializing...');
    // Load platform configurations first, then start observing
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.loadConfigsAndStart();
      });
    } else {
      this.loadConfigsAndStart();
    }
  }

  async loadConfigsAndStart() {
    await loadPlatformConfigs();
    this.startObserving();
  }

  startObserving() {
    console.log('Starting to observe page changes...');
    this.injectButtons();
    this.observeChanges();

    // Also observe for URL changes (for SPAs like GitHub)
    this.observeURLChanges();
  }

  observeURLChanges() {
    let currentURL = window.location.href;

    // More aggressive reinjection for GitHub
    const reinjectButtons = () => {
      console.log('URL changed, reinjecting buttons...');
      setTimeout(() => {
        if (window.commentBookmarker) {
          window.commentBookmarker.injectButtons().catch(console.error);
        }
      }, 100);
      // Second attempt after more time for dynamic content
      setTimeout(() => {
        if (window.commentBookmarker) {
          window.commentBookmarker.injectButtons().catch(console.error);
        }
      }, 1000);
    };

    // Listen for popstate events (back/forward navigation)
    window.addEventListener('popstate', () => {
      if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        reinjectButtons();
      }
    });

    // Listen for pushstate/replacestate (programmatic navigation)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        reinjectButtons();
      }
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        reinjectButtons();
      }
    };

    // Also listen for GitHub's turbo navigation
    document.addEventListener('turbo:load', () => {
      reinjectButtons();
    });

    // Listen for GitHub's pjax navigation
    document.addEventListener('pjax:end', () => {
      reinjectButtons();
    });

    // Listen for GitHub's soft navigation (modern GitHub)
    document.addEventListener('turbo:render', () => {
      reinjectButtons();
    });

    // Listen for any navigation change
    document.addEventListener('turbo:before-render', () => {
      // Clear existing buttons before new content loads
      this.injectedButtons.clear();
    });
  }

  observeChanges() {
    const observer = new MutationObserver((mutations) => {
      let shouldReinject = false;
      let hasNewComments = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check if any added nodes contain comments
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.querySelector && this.checkForComments(node)) {
                hasNewComments = true;
                shouldReinject = true;
              }
              // Also check if the node itself is a comment
              if (this.isCommentElement(node)) {
                hasNewComments = true;
                shouldReinject = true;
              }
            }
          });
        } else if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // Clean up tracking for removed comments
          mutation.removedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const commentId = node.id || node.querySelector && node.querySelector('[id^="comment-"]')?.id;
              if (commentId && this.injectedButtons.has(commentId)) {
                this.injectedButtons.delete(commentId);
                console.log('Cleaned up tracking for removed comment:', commentId);
              }
            }
          });
        } else if (mutation.type === 'attributes') {
          // Check if attribute changes might reveal new comments
          const target = mutation.target;
          if (target.nodeType === Node.ELEMENT_NODE && this.checkForComments(target)) {
            shouldReinject = true;
          }
        }
      });

      if (shouldReinject) {
        console.log('New comments detected, reinjecting buttons...', hasNewComments ? 'New comments found' : 'Attribute changes');
        // Debounce reinjection
        clearTimeout(this.reinjectTimeout);
        this.reinjectTimeout = setTimeout(() => {
          this.injectButtons().catch(console.error);
        }, 50);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-testid', 'style', 'hidden']
    });
  }

  checkForComments(element) {
    if (!element || !element.querySelector) return false;

    // Check if element contains any comment selectors
    const commonCommentSelectors = [
      // GitHub selectors
      '.react-issue-comment',
      '.timeline-comment',
      '.js-comment-container',
      '.review-comment',
      '[data-testid="comment-viewer-outer-box"]',
      '[data-testid="issue-comment"]',
      '[data-testid="timeline-comment"]',

      // GitLab selectors
      '.note-wrapper',
      '.note:not(.system-note)',
      '.timeline-entry:not(.system-note)',
      '.discussion-notes .note',
      '.discussion-wrapper .note',

      // Bitbucket selectors
      '[id^="comment-"]',
      'div[id*="comment-"]',
      '._1e0c11p5',
      '.css-1j1v6qw',
      '[id^="portal-parent-pr-dialog-conversation"]',
      '.ak-renderer-wrapper',

      // Generic selectors
      '.comment-container',
      '.comment-wrapper',
      '.comment'
    ];

    // Check if element matches any comment selector (but avoid duplicates)
    try {
      for (const selector of commonCommentSelectors) {
        if (element.matches && element.matches(selector)) {
          // Make sure it doesn't already have a bookmark button
          if (!element.querySelector('.bookmark-btn') && !element.querySelector('.bookmark-btn-wrapper')) {
            return true;
          }
        }
        if (element.querySelector(selector)) {
          const foundElements = element.querySelectorAll(selector);
          // Only return true if we found elements without bookmark buttons
          for (const foundElement of foundElements) {
            if (!foundElement.querySelector('.bookmark-btn') && !foundElement.querySelector('.bookmark-btn-wrapper')) {
              return true;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error in checkForComments:', error);
    }

    return false;
  }

  isCommentElement(element) {
    if (!element.querySelector) return false;

    // Check if element matches any comment selector patterns
    const commonCommentClasses = [
      'note-wrapper', 'timeline-comment', 'react-issue-comment',
      'comment-container', 'js-comment', 'IssueCommentViewer',
      '_1e0c11p5', 'css-1j1v6qw', 'ak-renderer-wrapper'
    ];

    const className = element.className || '';
    const hasCommentClass = commonCommentClasses.some(cls => className.includes(cls));
    const hasCommentId = element.id && element.id.includes('comment');
    const hasCommentTestId = element.hasAttribute('data-testid') && element.getAttribute('data-testid').includes('comment');

    return hasCommentClass || hasCommentId || hasCommentTestId;
  }

  async injectButtons() {
    console.log('Injecting bookmark buttons...');

    // Wait a bit for DOM to stabilize
    await new Promise(resolve => setTimeout(resolve, 100));

    // Detect platform
    const hostname = window.location.hostname.toLowerCase();
    const platformInfo = await getPlatformByDomain(hostname);

    if (!platformInfo) {
      console.log('Not on a supported Git platform, skipping injection');
      return;
    }

    const { key: platformKey, config: platformConfig } = platformInfo;
    const platform = platformConfig.name;

    console.log(`Detected platform: ${platform}`);

    // Get comment selectors for this platform
    const commentSelectors = platformConfig.commentSelectors;

    let foundComments = 0;

    commentSelectors.forEach(selector => {
      const comments = document.querySelectorAll(selector);
      console.log(`Found ${comments.length} comments with selector: ${selector}`);
      foundComments += comments.length;

      comments.forEach(comment => {
        this.injectButtonForComment(comment, platformKey, platformConfig);
      });
    });

    console.log(`Total comments found: ${foundComments}`);

    if (foundComments === 0) {
      console.log('No comments found. Current URL:', window.location.href);
      console.log('Available elements:', {
        notes: document.querySelectorAll('.note').length,
        noteWrappers: document.querySelectorAll('.note-wrapper').length,
        timelineComments: document.querySelectorAll('.timeline-comment').length,
        jsComments: document.querySelectorAll('.js-comment-container').length,
        allDivs: document.querySelectorAll('div').length
      });
    }
  }

  injectButtonForComment(commentElement, platformKey, platformConfig) {
    // Skip if already injected - check more thoroughly
    const existingButton = commentElement.querySelector('.bookmark-btn');
    const existingWrapper = commentElement.querySelector('.bookmark-btn-wrapper');
    if (existingButton || existingWrapper) {
      console.log('Button already exists for comment, skipping');
      return false;
    }

    // Also check if we've already processed this comment by ID or unique identifier
    const commentId = commentElement.id ||
                     commentElement.getAttribute('data-comment-id') ||
                     commentElement.querySelector('[id^="comment-"]')?.id;

    if (commentId && this.injectedButtons.has(commentId)) {
      console.log('Button already injected for comment ID:', commentId);
      return false;
    }

    console.log('Injecting button for comment:', commentElement, 'Platform:', platformConfig.name);

    // Find appropriate insertion point
    let headerElement = null;

    // Try platform-specific header selectors first
    for (const selector of platformConfig.headerSelectors) {
      headerElement = commentElement.querySelector(selector);
      if (headerElement) break;
    }

    // Fallback: try generic header selectors
    if (!headerElement) {
      const genericSelectors = [
        '[class*="header"]',
        '[class*="meta"]',
        '[class*="comment-header"]',
        '[class*="review-header"]',
        '.author'
      ];

      for (const selector of genericSelectors) {
        headerElement = commentElement.querySelector(selector);
        if (headerElement) break;
      }

      // Last resort
      if (!headerElement) {
        headerElement = commentElement.firstElementChild;
      }
    }

    // Special handling for GitHub review comments
    if (!headerElement && (commentElement.classList.contains('review-comment') || commentElement.querySelector('.review-comment-contents'))) {
      headerElement = commentElement.querySelector('.review-comment-contents .comment-body') ||
                     commentElement.querySelector('.comment-body') ||
                     commentElement.querySelector('.js-comment-body') ||
                     commentElement;
    }

    // Special handling for GitHub issue comments
    if (!headerElement && (commentElement.classList.contains('timeline-comment') || commentElement.querySelector('.timeline-comment-header'))) {
      headerElement = commentElement.querySelector('.timeline-comment-header') ||
                     commentElement.querySelector('.timeline-comment-header-text') ||
                     commentElement.querySelector('.timeline-comment-header .d-flex') ||
                     commentElement.querySelector('.comment-meta') ||
                     commentElement;
    }

    // Special handling for GitHub issue comments with data-testid
    if (!headerElement && (commentElement.hasAttribute('data-testid') || commentElement.querySelector('[data-testid]'))) {
      headerElement = commentElement.querySelector('.timeline-comment-header') ||
                     commentElement.querySelector('[class*="header"]') ||
                     commentElement.querySelector('.d-flex') ||
                     commentElement.querySelector('.flex-items-center') ||
                     commentElement;
    }

    if (!headerElement) {
      console.log('Still no header found, trying to inject at comment root');
      headerElement = commentElement;
    }

    if (!headerElement) {
      console.log('No suitable injection point found, skipping this comment');
      return false;
    }

    console.log('Found header element:', headerElement);

    // Create bookmark button
    const button = document.createElement('button');
    button.className = 'bookmark-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z"/>
      </svg>
    `;
    button.title = 'Bookmark this comment';
    button.setAttribute('aria-label', 'Bookmark this comment');

    // Add click handler
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleBookmarkClick(commentElement, button);
    });

    // Insert button - try different insertion strategies
    try {
      // Try to find an actions area first
      let actionsArea = null;

      // Try platform-specific actions selectors first
      for (const selector of platformConfig.actionsSelectors) {
        actionsArea = headerElement.querySelector(selector);
        if (actionsArea) break;
      }

      // Fallback to generic selectors
      if (!actionsArea) {
        const genericActionsSelectors = [
          '.float-right',
          '.d-flex:last-child',
          '.flex-items-center:last-child',
          '[class*="actions"]'
        ];

        for (const selector of genericActionsSelectors) {
          actionsArea = headerElement.querySelector(selector);
          if (actionsArea) break;
        }
      }

      if (actionsArea) {
        console.log('Found actions area, appending button');
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'bookmark-btn-wrapper';
        buttonWrapper.style.cssText = 'display: inline-block; margin-left: 8px; position: relative; z-index: 1000;';
        buttonWrapper.appendChild(button);
        actionsArea.appendChild(buttonWrapper);
      } else if (headerElement.querySelector('[data-testid="comment-header"]') ||
                 headerElement.querySelector('.ActivityHeader-module__ActivityHeaderContainer--NuqfC')) {
        // Special handling for new GitHub issue comments
        console.log('Handling new GitHub issue comment structure');
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'bookmark-btn-wrapper';
        buttonWrapper.style.cssText = 'display: inline-flex; align-items: center; margin-left: 8px; position: relative; z-index: 1000;';
        buttonWrapper.appendChild(button);

        // Try to find the actions container or create one
        const actionsContainer = headerElement.querySelector('[data-testid="comment-header-right-side-items"]') ||
                                headerElement.querySelector('.ActivityHeader-module__ActionsContainer--eBuKL');

        if (actionsContainer) {
          actionsContainer.appendChild(buttonWrapper);
        } else {
          // Fallback: append to the header
          headerElement.appendChild(buttonWrapper);
        }
      } else if (headerElement.classList.contains('timeline-comment-header') ||
                 headerElement.classList.contains('review-comment-header') ||
                 headerElement.classList.contains('comment-header') ||
                 headerElement.querySelector('.timeline-comment-header')) {
        // For GitHub comment headers, append directly
        console.log('Appending to comment header directly');
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'bookmark-btn-wrapper';
        buttonWrapper.style.cssText = 'display: inline-block; margin-left: 8px; position: relative; z-index: 1000;';
        buttonWrapper.appendChild(button);

        // Try to append to the header or its flex container
        const targetElement = headerElement.querySelector('.timeline-comment-header') || headerElement;
        targetElement.appendChild(buttonWrapper);
      } else {
        console.log('No actions area found, creating wrapper and appending to header');
        // Create a wrapper to position the button properly
        const buttonWrapper = document.createElement('div');
        buttonWrapper.className = 'bookmark-btn-wrapper';
        buttonWrapper.style.cssText = 'display: inline-block; margin-left: 8px; position: relative; z-index: 1000;';
        buttonWrapper.appendChild(button);
        headerElement.appendChild(buttonWrapper);
      }

      console.log('Button injected successfully');

      // Check if already bookmarked
      this.checkBookmarkStatus(commentElement, button);

      // Track this comment as processed
      if (commentId) {
        this.injectedButtons.set(commentId, true);
      }

      return true;

    } catch (error) {
      console.error('Failed to inject button:', error);
      console.log('Trying fallback injection method...');

      // Fallback: inject at the end of the comment element
      try {
        const fallbackWrapper = document.createElement('div');
        fallbackWrapper.className = 'bookmark-btn-wrapper fallback';
        fallbackWrapper.style.cssText = 'position: absolute; top: 10px; right: 10px; z-index: 1000;';
        fallbackWrapper.appendChild(button);
        commentElement.style.position = 'relative';
        commentElement.appendChild(fallbackWrapper);
        console.log('Fallback injection successful');

        // Check if already bookmarked
        this.checkBookmarkStatus(commentElement, button);
        return true;
      } catch (fallbackError) {
        console.error('Fallback injection also failed:', fallbackError);
        return false;
      }
    }
  }

  async handleBookmarkClick(commentElement, buttonElement) {
    console.log('Bookmark button clicked');

    const currentURL = window.location.href;
    const urlData = URLParser.parseURL(currentURL);

    if (!urlData) {
      console.error('Unable to parse URL:', currentURL);
      this.showNotification('Unable to bookmark this page');
      return;
    }

    console.log('Parsed URL data:', urlData);

    // Extract comment data
    const commentData = URLParser.extractCommentData(commentElement);
    console.log('Extracted comment data:', commentData);

    // Get page context
    const pageTitle = document.title;
    const contextTitle = URLParser.generateTitle(commentData.commentText, pageTitle);

    // Create bookmark object
    const bookmark = {
      id: Date.now().toString(),
      title: contextTitle,
      permalink: this.generateUniquePermalink(currentURL, commentElement),
      repository: urlData.repository,
      platform: urlData.platform,
      type: urlData.type,
      contextId: urlData.id,
      commentText: commentData.commentText,
      author: commentData.author,
      avatar: commentData.avatar,
      timestamp: commentData.timestamp || new Date().toISOString()
    };

    console.log('Created bookmark:', bookmark);

    // Check if already bookmarked
    const isBookmarked = buttonElement.classList.contains('bookmarked');

    if (isBookmarked) {
      // Remove bookmark
      try {
        const bookmarks = await BookmarkStorage.getBookmarks();
        const repoBookmarks = bookmarks[urlData.repository] || [];
        const existingBookmark = repoBookmarks.find(b => b.permalink === currentURL);

        if (existingBookmark) {
          await BookmarkStorage.removeBookmark(urlData.repository, existingBookmark.id);
          this.updateButtonState(buttonElement, false);
          this.showNotification('Bookmark removed');
        }
      } catch (error) {
        console.error('Failed to remove bookmark:', error);
        this.showNotification('Failed to remove bookmark');
      }
    } else {
      // Add bookmark
      try {
        const success = await BookmarkStorage.addBookmark(bookmark);

        if (success) {
          this.updateButtonState(buttonElement, true);
          this.showNotification('Bookmark added');

          // Notify background script
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({ action: 'bookmark_added' });
          }
        } else {
          this.showNotification('Bookmark already exists');
        }
      } catch (error) {
        console.error('Failed to add bookmark:', error);
        this.showNotification('Failed to add bookmark');
      }
    }
  }

  async checkBookmarkStatus(commentElement, buttonElement) {
    try {
      const currentURL = window.location.href;
      const urlData = URLParser.parseURL(currentURL);

      if (!urlData) return;

      const bookmarks = await BookmarkStorage.getBookmarks();
      const repoBookmarks = bookmarks[urlData.repository] || [];
      const isBookmarked = repoBookmarks.some(b => b.permalink === currentURL);

      this.updateButtonState(buttonElement, isBookmarked);
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
    }
  }

  updateButtonState(buttonElement, isBookmarked) {
    const svg = buttonElement.querySelector('svg path');

    if (isBookmarked) {
      buttonElement.classList.add('bookmarked');
      buttonElement.title = 'Remove bookmark';
      // Filled bookmark icon
      svg.setAttribute('d', 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2z');
    } else {
      buttonElement.classList.remove('bookmarked');
      buttonElement.title = 'Bookmark this comment';
      // Outlined bookmark icon
      svg.setAttribute('d', 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z');
    }
  }

  showNotification(message) {
    console.log('Showing notification:', message);

    // Remove existing notification
    const existing = document.querySelector('.bookmark-notification');
    if (existing) {
      existing.remove();
    }

    // Create a simple toast notification
    const notification = document.createElement('div');
    notification.className = 'bookmark-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }

  generateUniquePermalink(url, commentElement) {
    // Try to find a unique comment identifier
    const commentId = commentElement.id ||
                     commentElement.querySelector('[id]')?.id ||
                     commentElement.getAttribute('data-note-id') ||
                     commentElement.getAttribute('data-comment-id');

    if (commentId) {
      // If URL doesn't already have a hash, add the comment ID
      if (!url.includes('#')) {
        return `${url}#${commentId}`;
      }
    }

    // Fallback: add timestamp to make URL unique
    const separator = url.includes('#') ? '&' : '#';
    return `${url}${separator}t=${Date.now()}`;
  }
}

// Initialize when DOM is ready
console.log('Content script loaded');

// Store instance globally for URL change detection
window.commentBookmarker = null;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.commentBookmarker = new CommentBookmarker();
  });
} else {
  console.log('DOM already loaded, initializing bookmarker...');
  window.commentBookmarker = new CommentBookmarker();
}
