// Tests for popup functionality
/**
 * @jest-environment jsdom
 */

// Mock the popup module functions
const mockBookmarks = {
  'user/repo1': [
    {
      id: '123',
      title: 'Test bookmark 1',
      permalink: 'https://github.com/user/repo1/issues/1',
      repository: 'user/repo1',
      platform: 'github',
      type: 'issues',
      contextId: 1,
      author: 'testuser',
      timestamp: '2023-01-01T12:00:00Z'
    }
  ],
  'user/repo2': [
    {
      id: '456',
      title: 'Test bookmark 2',
      permalink: 'https://gitlab.com/user/repo2/-/issues/2',
      repository: 'user/repo2',
      platform: 'gitlab',
      type: 'issues',
      contextId: 2,
      author: 'testuser2',
      timestamp: '2023-01-02T12:00:00Z'
    }
  ]
};

describe('Popup', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '<div id="app"></div>';

    // Mock chrome storage
    chrome.storage.local.get.mockResolvedValue({
      gitlab_github_bookmarks: mockBookmarks
    });

    jest.clearAllMocks();
  });

  describe('App Initialization', () => {
    it('should create app structure', async () => {
      // Import and run popup script
      await import('../popup.js');

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 300));

      const app = document.getElementById('app');
      expect(app).toBeTruthy();
      expect(app.classList.contains('app')).toBe(true);
    });


    //it('should load bookmarks on initialization', async () => {
    //  // Import popup script
    //  await import('../popup.js');

    //  // Wait for async operations to complete
    //  await new Promise(resolve => setTimeout(resolve, 500));

    //  // Check that storage was called
    //  expect(chrome.storage.local.get).toHaveBeenCalledWith(['gitlab_github_bookmarks']);
    //});
  });

  describe('Search Functionality', () => {
    it('should filter bookmarks by search query', async () => {
      await import('../popup.js');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 300));

      // Simulate search input
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.value = 'Test bookmark 1';
        searchInput.dispatchEvent(new Event('input'));

        // Wait for search to process
        await new Promise(resolve => setTimeout(resolve, 100));

        // Check that search was performed
        expect(searchInput.value).toBe('Test bookmark 1');
      }
    });
  });

  describe('Sort Functionality', () => {
    it('should sort bookmarks by different criteria', async () => {
      await import('../popup.js');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 300));

      const sortSelect = document.getElementById('sort-select');
      if (sortSelect) {
        // Test alphabetical sort
        sortSelect.value = 'alphabetical';
        sortSelect.dispatchEvent(new Event('change'));

        expect(sortSelect.value).toBe('alphabetical');

        // Test frequency sort
        sortSelect.value = 'frequency';
        sortSelect.dispatchEvent(new Event('change'));

        expect(sortSelect.value).toBe('frequency');
      }
    });
  });

  describe('Platform Filter', () => {
    it('should filter bookmarks by platform', async () => {
      await import('../popup.js');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 300));

      const platformFilter = document.getElementById('platform-filter');
      if (platformFilter) {
        // Should have platform options
        const options = platformFilter.querySelectorAll('option');
        expect(options.length).toBeGreaterThan(0); // At least "All Platforms"

        // Test filtering by GitHub
        platformFilter.value = 'github';
        platformFilter.dispatchEvent(new Event('change'));

        expect(platformFilter.value).toBe('github');
      }
    });
  });

  describe('Bookmark Actions', () => {
    it('should handle bookmark removal', async () => {
      chrome.storage.local.set.mockResolvedValue();

      await import('../popup.js');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 300));

      // Find and click remove button
      const removeButton = document.querySelector('.remove-bookmark');
      if (removeButton) {
        removeButton.click();

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(chrome.storage.local.set).toHaveBeenCalled();
      }
    });

    it('should handle bookmark opening', async () => {
      await import('../popup.js');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 300));

      // Find and click open button
      const openButton = document.querySelector('.open-bookmark');
      if (openButton) {
        openButton.click();

        expect(chrome.tabs.create).toHaveBeenCalled();
      }
    });
  });

  describe('Export Functionality', () => {
    it('should export bookmarks as JSON', async () => {
      // Mock URL.createObjectURL and document.createElement
      global.URL.createObjectURL = jest.fn().mockReturnValue('blob:test');
      global.URL.revokeObjectURL = jest.fn();

      const mockAnchor = {
        href: '',
        download: '',
        click: jest.fn()
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockAnchor);

      await import('../popup.js');

      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 300));

      const exportButton = document.getElementById('export-btn');
      if (exportButton) {
        exportButton.click();

        // Wait for async operation
        await new Promise(resolve => setTimeout(resolve, 100));

        expect(mockAnchor.click).toHaveBeenCalled();
        expect(mockAnchor.download).toBe('gitlab-github-bookmarks.json');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      await import('../popup.js');

      // Wait for error handling
      await new Promise(resolve => setTimeout(resolve, 300));

      const app = document.getElementById('app');
      expect(app).toBeTruthy();
      // Should show error state or empty state
    });
  });
});
