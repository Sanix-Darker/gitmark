// Tests for BookmarkStorage utility
import { BookmarkStorage } from '../../src/utils/storage.js';

describe('BookmarkStorage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getBookmarks', () => {
    it('should return empty object when no bookmarks exist', async () => {
      chrome.storage.local.get.mockResolvedValue({});

      const result = await BookmarkStorage.getBookmarks();

      expect(result).toEqual({});
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['gitlab_github_bookmarks']);
    });

    it('should return existing bookmarks', async () => {
      const mockBookmarks = {
        'user/repo': [
          {
            id: '123',
            title: 'Test bookmark',
            permalink: 'https://github.com/user/repo/issues/1#comment-123'
          }
        ]
      };

      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: mockBookmarks
      });

      const result = await BookmarkStorage.getBookmarks();

      expect(result).toEqual(mockBookmarks);
    });

    it('should handle storage errors gracefully', async () => {
      chrome.storage.local.get.mockRejectedValue(new Error('Storage error'));

      const result = await BookmarkStorage.getBookmarks();

      expect(result).toEqual({});
    });
  });

  describe('saveBookmarks', () => {
    it('should save bookmarks to storage', async () => {
      const bookmarks = { 'user/repo': [] };

      await BookmarkStorage.saveBookmarks(bookmarks);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gitlab_github_bookmarks: bookmarks
      });
    });

    it('should throw error when save fails', async () => {
      const error = new Error('Save failed');
      chrome.storage.local.set.mockRejectedValue(error);

      await expect(BookmarkStorage.saveBookmarks({})).rejects.toThrow('Save failed');
    });
  });

  describe('addBookmark', () => {
    it('should add new bookmark to empty repository', async () => {
      chrome.storage.local.get.mockResolvedValue({});
      chrome.storage.local.set.mockResolvedValue();

      const bookmark = {
        id: '123',
        title: 'Test bookmark',
        repository: 'user/repo',
        permalink: 'https://github.com/user/repo/issues/1#comment-123'
      };

      const result = await BookmarkStorage.addBookmark(bookmark);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gitlab_github_bookmarks: {
          'user/repo': [bookmark]
        }
      });
    });

    it('should add bookmark to existing repository', async () => {
      const existingBookmark = {
        id: '456',
        title: 'Existing bookmark',
        permalink: 'https://github.com/user/repo/issues/2#comment-456'
      };

      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: {
          'user/repo': [existingBookmark]
        }
      });

      const newBookmark = {
        id: '123',
        title: 'New bookmark',
        repository: 'user/repo',
        permalink: 'https://github.com/user/repo/issues/1#comment-123'
      };

      const result = await BookmarkStorage.addBookmark(newBookmark);

      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gitlab_github_bookmarks: {
          'user/repo': [newBookmark, existingBookmark]
        }
      });
    });

    it('should not add duplicate bookmark', async () => {
      const existingBookmark = {
        id: '123',
        title: 'Existing bookmark',
        permalink: 'https://github.com/user/repo/issues/1#comment-123'
      };

      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: {
          'user/repo': [existingBookmark]
        }
      });

      const duplicateBookmark = {
        id: '456',
        title: 'Duplicate bookmark',
        repository: 'user/repo',
        permalink: 'https://github.com/user/repo/issues/1#comment-123'
      };

      const result = await BookmarkStorage.addBookmark(duplicateBookmark);

      expect(result).toBe(false);
      expect(chrome.storage.local.set).not.toHaveBeenCalled();
    });
  });

  describe('removeBookmark', () => {
    it('should remove bookmark from repository', async () => {
      const bookmarks = {
        'user/repo': [
          { id: '123', title: 'Bookmark 1' },
          { id: '456', title: 'Bookmark 2' }
        ]
      };

      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: bookmarks
      });

      await BookmarkStorage.removeBookmark('user/repo', '123');

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gitlab_github_bookmarks: {
          'user/repo': [{ id: '456', title: 'Bookmark 2' }]
        }
      });
    });

    it('should remove repository when last bookmark is removed', async () => {
      const bookmarks = {
        'user/repo': [{ id: '123', title: 'Last bookmark' }]
      };

      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: bookmarks
      });

      await BookmarkStorage.removeBookmark('user/repo', '123');

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        gitlab_github_bookmarks: {}
      });
    });
  });

  describe('searchBookmarks', () => {
    it('should find bookmarks matching query', async () => {
      const bookmarks = {
        'user/repo1': [
          {
            id: '123',
            title: 'Fix bug in parser',
            commentText: 'This fixes the parsing issue',
            author: 'john'
          }
        ],
        'user/repo2': [
          {
            id: '456',
            title: 'Add new feature',
            commentText: 'Great addition to the codebase',
            author: 'jane'
          }
        ]
      };

      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: bookmarks
      });

      const results = await BookmarkStorage.searchBookmarks('parser');

      expect(results).toHaveLength(1);
      expect(results[0].repository).toBe('user/repo1');
      expect(results[0].bookmarks).toHaveLength(1);
      expect(results[0].bookmarks[0].title).toBe('Fix bug in parser');
    });

    it('should return empty array when no matches found', async () => {
      chrome.storage.local.get.mockResolvedValue({
        gitlab_github_bookmarks: {
          'user/repo': [
            { id: '123', title: 'Test', commentText: 'Content', author: 'user' }
          ]
        }
      });

      const results = await BookmarkStorage.searchBookmarks('nonexistent');

      expect(results).toEqual([]);
    });
  });
});
