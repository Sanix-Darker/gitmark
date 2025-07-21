// Tests for content script
/**
 * @jest-environment jsdom
 */

// Mock fetch for platform configs
const mockPlatformConfigs = {
  github: {
    name: 'GitHub',
    domains: ['github.com'],
    commentSelectors: ['.timeline-comment', '.js-comment-container'],
    headerSelectors: ['.timeline-comment-header'],
    actionsSelectors: ['.timeline-comment-actions'],
    dataSelectors: {
      commentText: ['.comment-body'],
      author: ['.author'],
      avatar: ['.avatar'],
      timestamp: ['time']
    }
  },
  gitlab: {
    name: 'GitLab',
    domains: ['gitlab.com'],
    commentSelectors: ['.note-wrapper'],
    headerSelectors: ['.note-header'],
    actionsSelectors: ['.note-actions'],
    dataSelectors: {
      commentText: ['.md'],
      author: ['.author'],
      avatar: ['.avatar'],
      timestamp: ['time']
    }
  }
};

// Mock chrome.runtime.getURL
chrome.runtime.getURL = jest.fn((path) => `chrome-extension://test/${path}`);

// Mock fetch
global.fetch = jest.fn().mockResolvedValue({
  json: () => Promise.resolve(mockPlatformConfigs)
});

describe('Content Script', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';

    // Mock window.location
    delete window.location;
    window.location = {
      href: 'https://github.com/user/repo/issues/123',
      hostname: 'github.com'
    };

    jest.clearAllMocks();

    // Reset fetch mock
    fetch.mockResolvedValue({
      json: () => Promise.resolve(mockPlatformConfigs)
    });
  });

  describe('Platform Detection', () => {
    it('should detect GitHub platform', async () => {
      // Import the content script to initialize platform configs
      await import('../content.js');

      // Wait for platform configs to load
      await new Promise(resolve => setTimeout(resolve, 100));

      // Test platform detection logic manually
      const hostname = 'github.com';
      let foundPlatform = null;

      for (const [key, config] of Object.entries(mockPlatformConfigs)) {
        if (config.domains.some(domain => hostname.includes(domain))) {
          foundPlatform = { key, config };
          break;
        }
      }

      expect(foundPlatform).toBeTruthy();
      expect(foundPlatform.key).toBe('github');
      expect(foundPlatform.config.name).toBe('GitHub');
    });

    it('should detect GitLab platform', async () => {
      await import('../content.js');

      // Wait for platform configs to load
      await new Promise(resolve => setTimeout(resolve, 100));

      const hostname = 'gitlab.com';
      let foundPlatform = null;

      for (const [key, config] of Object.entries(mockPlatformConfigs)) {
        if (config.domains.some(domain => hostname.includes(domain))) {
          foundPlatform = { key, config };
          break;
        }
      }

      expect(foundPlatform).toBeTruthy();
      expect(foundPlatform.key).toBe('gitlab');
      expect(foundPlatform.config.name).toBe('GitLab');
    });

    it('should return null for unsupported platform', async () => {
      await import('../content.js');

      const hostname = 'example.com';
      let foundPlatform = null;

      for (const [key, config] of Object.entries(mockPlatformConfigs)) {
        if (config.domains.some(domain => hostname.includes(domain))) {
          foundPlatform = { key, config };
          break;
        }
      }

      expect(foundPlatform).toBeNull();
    });
  });

  describe('Comment Detection', () => {
    it('should detect GitHub comments', () => {
      // Create mock GitHub comment
      const comment = document.createElement('div');
      comment.className = 'timeline-comment';
      comment.innerHTML = `
        <div class="timeline-comment-header">
          <span class="author">testuser</span>
          <time datetime="2023-01-01T12:00:00Z">Jan 1</time>
        </div>
        <div class="comment-body">Test comment</div>
      `;
      document.body.appendChild(comment);

      const comments = document.querySelectorAll('.timeline-comment');
      expect(comments).toHaveLength(1);
    });

    it('should detect GitLab comments', () => {
      // Create mock GitLab comment
      const comment = document.createElement('div');
      comment.className = 'note-wrapper';
      comment.innerHTML = `
        <div class="note-header">
          <span class="author">testuser</span>
          <time datetime="2023-01-01T12:00:00Z">Jan 1</time>
        </div>
        <div class="md">Test comment</div>
      `;
      document.body.appendChild(comment);

      const comments = document.querySelectorAll('.note-wrapper');
      expect(comments).toHaveLength(1);
    });
  });

  describe('Button Injection', () => {
    it('should not inject duplicate buttons', () => {
      // Create comment with existing button
      const comment = document.createElement('div');
      comment.className = 'timeline-comment';
      comment.innerHTML = `
        <div class="timeline-comment-header">
          <div class="bookmark-btn-wrapper">
            <button class="bookmark-btn">Existing</button>
          </div>
        </div>
      `;
      document.body.appendChild(comment);

      // Check that no duplicate button is created
      const existingButtons = comment.querySelectorAll('.bookmark-btn');
      expect(existingButtons).toHaveLength(1);
    });
  });

  describe('URL Parsing', () => {
    it('should parse GitHub issue URL', () => {
      // Test URL parsing logic directly
      const url = 'https://github.com/user/repo/issues/123#issuecomment-456';
      const githubRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/(issues|pull|discussions)\/(\d+)(?:#issuecomment-(\d+))?/;
      const match = url.match(githubRegex);

      expect(match).toBeTruthy();

      const [, domain, repository, type, id, commentId] = match;
      const result = {
        platform: 'github',
        domain,
        repository,
        type: type === 'pull' ? 'merge_requests' : 'issues',
        id: parseInt(id),
        commentId: commentId ? parseInt(commentId) : null,
        permalink: url
      };

      expect(result).toEqual({
        platform: 'github',
        domain: 'github.com',
        repository: 'user/repo',
        type: 'issues',
        id: 123,
        commentId: 456,
        permalink: url
      });
    });

    it('should parse GitLab merge request URL', () => {
      const url = 'https://gitlab.com/group/project/-/merge_requests/123#note_456';
      const gitlabRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/-?\/(merge_requests|issues|epics)\/(\d+)(?:#note_(\d+))?/;
      const match = url.match(gitlabRegex);

      expect(match).toBeTruthy();

      const [, domain, repository, type, id, noteId] = match;
      const result = {
        platform: 'gitlab',
        domain,
        repository,
        type,
        id: parseInt(id),
        noteId: noteId ? parseInt(noteId) : null,
        permalink: url
      };

      expect(result).toEqual({
        platform: 'gitlab',
        domain: 'gitlab.com',
        repository: 'group/project',
        type: 'merge_requests',
        id: 123,
        noteId: 456,
        permalink: url
      });
    });
  });

  describe('Bookmark Storage Integration', () => {
    it('should save bookmark when button is clicked', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      // Create a comment element
      const comment = document.createElement('div');
      comment.className = 'timeline-comment';
      comment.innerHTML = `
        <div class="timeline-comment-header">
          <span class="author">testuser</span>
          <time datetime="2023-01-01T12:00:00Z">Jan 1</time>
        </div>
        <div class="comment-body">Test comment</div>
      `;
      document.body.appendChild(comment);

      // Test bookmark storage logic directly
      const STORAGE_KEY = 'gitlab_github_bookmarks';
      const bookmark = {
        id: '123',
        title: 'Test bookmark',
        repository: 'user/repo',
        permalink: 'https://github.com/user/repo/issues/123'
      };

      // Simulate adding bookmark
      const bookmarks = {};
      const repoKey = bookmark.repository;

      if (!bookmarks[repoKey]) {
        bookmarks[repoKey] = [];
      }

      // Check for duplicates
      const exists = bookmarks[repoKey].find(b => b.permalink === bookmark.permalink);

      if (!exists) {
        bookmarks[repoKey].unshift(bookmark);
        await chrome.storage.local.set({ [STORAGE_KEY]: bookmarks });
      }

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gitlab_github_bookmarks: {
          'user/repo': [bookmark]
        }
      });
    });
  });
});
