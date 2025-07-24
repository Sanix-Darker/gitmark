import { PlatformDetector } from './PlatformDetector';
import { Bookmark } from '../../shared/types/bookmark';
import { URLParser } from '../../shared/utils/urlParser';
import { BookmarkStorageManager } from '../../shared/utils/storage';

export class CommentInjector {
  private injectedButtons = new Map<string, boolean>();
  private observer: MutationObserver | null = null;
  private reinjectTimeout: any = null;
  private onBookmarkCallback: ((bookmark: Bookmark) => void) | null = null;

  constructor(private platformDetector: PlatformDetector) {}

  async injectButtons(onBookmark: (bookmark: Bookmark) => void) {
    this.onBookmarkCallback = onBookmark;

    const platform = await this.platformDetector.getCurrentPlatform();
    if (!platform) return;

    console.log(`Injecting buttons for platform: ${platform.config.name}`);

    // Use both platform-specific and generic selectors
    const selectors = [
      ...platform.config.commentSelectors,
      // Additional GitHub selectors
      '.js-comment-container',
      '.js-timeline-item',
      '.timeline-comment',
      '.review-comment',
      '.discussion-timeline-item',
      '[data-testid="issue-comment"]',
      '[data-testid="pr-timeline-comment"]',
      '.TimelineItem',
      '.js-comment',
      // Additional GitLab selectors
      '.note-wrapper',
      '.note:not(.system-note)',
      '.timeline-entry:not(.system-note)',
      '.discussion-notes .note'
    ];

    let foundComments = 0;
    const processedElements = new Set<HTMLElement>();

    selectors.forEach(selector => {
      try {
        const comments = document.querySelectorAll(selector);

        comments.forEach(comment => {
          const element = comment as HTMLElement;

          // Skip if already processed
          if (processedElements.has(element)) return;
          processedElements.add(element);

          // Skip system notes
          if (element.classList.contains('system-note')) return;

          if (this.injectButtonForComment(element, platform.key)) {
            foundComments++;
          }
        });
      } catch (error) {
        console.error(`Error with selector ${selector}:`, error);
      }
    });

    console.log(`Injected buttons for ${foundComments} comments`);
  }

  private injectButtonForComment(
    commentElement: HTMLElement,
    _platformKey: string
  ): boolean {
    // Check if already injected
    if (commentElement.querySelector('.bookmark-btn-wrapper')) {
      return false;
    }

    // Get comment ID for tracking
    const commentId = this.getCommentId(commentElement);
    if (commentId && this.injectedButtons.has(commentId)) {
      return false;
    }

    // Find insertion point
    const insertionPoint = this.findInsertionPoint(commentElement);
    if (!insertionPoint) {
      console.log('No suitable insertion point found for comment');
      return false;
    }

    // Create bookmark data
    const bookmarkData = this.createBookmarkData(commentElement);
    if (!bookmarkData) {
      console.log('Failed to create bookmark data');
      return false;
    }

    // Create and inject button
    const button = this.createBookmarkButton(bookmarkData);
    this.insertButton(insertionPoint, button);

    // Track injection
    if (commentId) {
      this.injectedButtons.set(commentId, true);
    }

    return true;
  }

  private createBookmarkButton(bookmarkData: Bookmark): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'bookmark-btn-wrapper';

    const button = document.createElement('button');
    button.className = 'bookmark-btn';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z"/>
      </svg>
    `;
    button.title = 'Bookmark this comment';
    button.setAttribute('aria-label', 'Bookmark this comment');

    // Check if already bookmarked
    this.checkBookmarkStatus(button, bookmarkData.permalink);

    // Add click handler
    button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      await this.handleBookmarkClick(button, bookmarkData);
    });

    wrapper.appendChild(button);
    return wrapper;
  }

  private async checkBookmarkStatus(button: HTMLElement, permalink: string) {
    try {
      const bookmarks = await BookmarkStorageManager.getBookmarks();
      const isBookmarked = Object.values(bookmarks)
        .flat()
        .some(bookmark => bookmark.permalink === permalink);

      if (isBookmarked) {
        button.classList.add('bookmarked');
        button.title = 'Remove bookmark';
        const path = button.querySelector('svg path');
        if (path) {
          path.setAttribute('d', 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2z');
        }
      }
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
    }
  }

  private async handleBookmarkClick(button: HTMLElement, bookmark: Bookmark) {
    const isBookmarked = button.classList.contains('bookmarked');

    try {
      if (isBookmarked) {
        // Remove bookmark
        const bookmarks = await BookmarkStorageManager.getBookmarks();
        const repoBookmarks = bookmarks[bookmark.repository] || [];
        const existingBookmark = repoBookmarks.find(b => b.permalink === bookmark.permalink);

        if (existingBookmark) {
          await BookmarkStorageManager.removeBookmark(bookmark.repository, existingBookmark.id);
          button.classList.remove('bookmarked');
          button.title = 'Bookmark this comment';
          const path = button.querySelector('svg path');
          if (path) {
            path.setAttribute('d', 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z');
          }
        }
      } else {
        // Add bookmark
        const success = await BookmarkStorageManager.addBookmark(bookmark);
        if (success) {
          button.classList.add('bookmarked');
          button.title = 'Remove bookmark';
          const path = button.querySelector('svg path');
          if (path) {
            path.setAttribute('d', 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2z');
          }

          if (this.onBookmarkCallback) {
            this.onBookmarkCallback(bookmark);
          }
        }
      }
    } catch (error) {
      console.error('Bookmark operation failed:', error);
    }
  }

  private getCommentId(element: HTMLElement): string | null {
    return element.id ||
           element.getAttribute('data-comment-id') ||
           element.getAttribute('data-note-id') ||
           element.querySelector('[id^="comment-"]')?.id ||
           element.querySelector('[id^="note_"]')?.id ||
           null;
  }

    private findInsertionPoint(commentElement: HTMLElement): HTMLElement | null {
      // Try multiple strategies to find the header/actions area
      const strategies = [
        // GitHub specific - current structure
        () => commentElement.querySelector('.timeline-comment-header'),
        () => commentElement.querySelector('.timeline-comment-header-text'),
        () => commentElement.querySelector('.js-comment-header'),
        () => commentElement.querySelector('.comment-header'),
        () => commentElement.querySelector('.TimelineItem-header'),
        () => commentElement.querySelector('.Header'),
        () => commentElement.querySelector('h3.timeline-comment-header-text'),

        // Look for author link containers
        () => {
          const authorLink = commentElement.querySelector('a.author, [data-testid="author-link"]');
          return authorLink?.closest('.d-flex, .flex-items-center');
        },

        // Look for timestamp containers
        () => {
          const timestamp = commentElement.querySelector('relative-time, time-ago, [datetime]');
          return timestamp?.closest('.d-flex, .flex-items-center');
        },

        // GitLab specific
        () => commentElement.querySelector('.note-header'),
        () => commentElement.querySelector('.note-header-info'),
        () => commentElement.querySelector('.note-actions'),

        // Generic
        () => commentElement.querySelector('[class*="header"]'),
        () => commentElement.querySelector('[class*="actions"]'),
        () => commentElement.querySelector('.d-flex'),

        // Fallback
        () => commentElement.firstElementChild as HTMLElement
      ];

      for (const strategy of strategies) {
        try {
          const element = strategy();
          if (element) return element as HTMLElement;
        } catch (e) {
          // Continue to next strategy
        }
      }

      return commentElement;
    }

    private insertButton(target: HTMLElement, wrapper: HTMLElement) {
      // Try to find the best insertion point
      const actionSelectors = [
        '.timeline-comment-actions',
        '.comment-actions',
        '.note-actions',
        '.js-comment-header-actions-deferred-content-placeholder',
        '.Header-link',
        '.ml-auto',
        '.float-right'
      ];

      let inserted = false;

      // First try to find an actions container
      for (const selector of actionSelectors) {
        const actionsContainer = target.querySelector(selector);
        if (actionsContainer) {
          actionsContainer.appendChild(wrapper);
          inserted = true;
          break;
        }
      }

      // If no actions container, try to append to the last flex container
      if (!inserted) {
        const flexContainers = target.querySelectorAll('.d-flex');
        if (flexContainers.length > 0) {
          const lastFlex = flexContainers[flexContainers.length - 1];
          lastFlex.appendChild(wrapper);
          inserted = true;
        }
      }

      // If still not inserted, append to target
      if (!inserted) {
        target.appendChild(wrapper);
      }
    }

  private createBookmarkData(commentElement: HTMLElement): Bookmark | null {
    const url = window.location.href;
    const urlData = URLParser.parseURL(url);

    if (!urlData) return null;

    const commentData = URLParser.extractCommentData(commentElement);
    const pageTitle = document.title;
    const contextTitle = URLParser.generateTitle(commentData.commentText, pageTitle);

    return {
      id: Date.now().toString(),
      title: contextTitle,
      permalink: URLParser.generateUniquePermalink(url, commentElement),
      repository: urlData.repository,
      platform: urlData.platform,
      type: urlData.type as any,
      contextId: urlData.id,
      commentText: commentData.commentText,
      author: commentData.author,
      avatar: commentData.avatar,
      timestamp: commentData.timestamp
    };
  }

  observeChanges() {
    this.observer = new MutationObserver((mutations) => {
      let shouldReinject = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE && this.checkForComments(node as HTMLElement)) {
              shouldReinject = true;
            }
          });
        }
      });

      if (shouldReinject) {
        clearTimeout(this.reinjectTimeout!);
        this.reinjectTimeout = setTimeout(() => {
          this.injectButtons(this.onBookmarkCallback!).catch(console.error);
        }, 100);
      }

       // GitHub-specific: Check for late-loading content
      if (window.location.hostname.includes('github.com')) {
        // Re-inject after various GitHub events
        const reinjectEvents = [
          'turbo:load',
          'turbo:render',
          'pjax:end',
          'page:loaded',
          'soft-nav:end'
        ];

        reinjectEvents.forEach(event => {
          document.addEventListener(event, () => {
            setTimeout(() => {
              this.injectedButtons.clear();
              this.injectButtons(this.onBookmarkCallback!);
            }, 500);
          });
        });

        // Also check periodically for the first few seconds
        let checkCount = 0;
        const checkInterval = setInterval(() => {
          checkCount++;
          this.injectButtons(this.onBookmarkCallback!);

          if (checkCount >= 10) {
            clearInterval(checkInterval);
          }
        }, 500);
      }

    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also observe URL changes
    this.observeURLChanges();
  }

  private observeURLChanges() {
    let currentURL = window.location.href;

    const reinject = () => {
      this.injectedButtons.clear();
      setTimeout(() => this.injectButtons(this.onBookmarkCallback!), 100);
      setTimeout(() => this.injectButtons(this.onBookmarkCallback!), 1000);
    };

    // Listen for various navigation events
    window.addEventListener('popstate', reinject);
    document.addEventListener('turbo:load', reinject);
    document.addEventListener('pjax:end', reinject);
    document.addEventListener('turbo:render', reinject);

    // Override pushState and replaceState
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function(...args) {
      originalPushState.apply(history, args);
      if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        reinject();
      }
    };

    history.replaceState = function(...args) {
      originalReplaceState.apply(history, args);
      if (window.location.href !== currentURL) {
        currentURL = window.location.href;
        reinject();
      }
    };
  }

  private checkForComments(element: HTMLElement): boolean {
    const commentSelectors = [
      '.note-wrapper', '.timeline-comment', '.js-comment-container',
      '.review-comment', '[data-testid="issue-comment"]', '.TimelineItem'
    ];

    return commentSelectors.some(selector => {
      return element.matches(selector) || element.querySelector(selector);
    });
  }

  cleanup() {
    if (this.observer) {
      this.observer.disconnect();
    }
    if (this.reinjectTimeout) {
      clearTimeout(this.reinjectTimeout);
    }
  }
}
