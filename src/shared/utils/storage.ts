import { BookmarkStorage, Bookmark } from '../types/bookmark';

export class BookmarkStorageManager {
  private static readonly STORAGE_KEY = 'gitlab_github_bookmarks';

  static async getBookmarks(): Promise<BookmarkStorage> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([this.STORAGE_KEY]);
        return result[this.STORAGE_KEY] || {};
      }
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get bookmarks:', error);
      return {};
    }
  }

  static async saveBookmarks(bookmarks: BookmarkStorage): Promise<void> {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        await chrome.storage.local.set({ [this.STORAGE_KEY]: bookmarks });
      } else {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(bookmarks));
      }
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
      throw error;
    }
  }

  static async addBookmark(bookmark: Bookmark): Promise<boolean> {
    const bookmarks = await this.getBookmarks();
    const repoKey = bookmark.repository;

    if (!bookmarks[repoKey]) {
      bookmarks[repoKey] = [];
    }

    const exists = this.checkDuplicate(bookmarks[repoKey], bookmark);
    if (exists) return false;

    bookmarks[repoKey].unshift(bookmark);
    await this.saveBookmarks(bookmarks);
    return true;
  }

  static async removeBookmark(repository: string, bookmarkId: string): Promise<void> {
    const bookmarks = await this.getBookmarks();
    if (bookmarks[repository]) {
      bookmarks[repository] = bookmarks[repository].filter(b => b.id !== bookmarkId);
      if (bookmarks[repository].length === 0) {
        delete bookmarks[repository];
      }
      await this.saveBookmarks(bookmarks);
    }
  }

  private static checkDuplicate(existingBookmarks: Bookmark[], newBookmark: Bookmark): boolean {
    return existingBookmarks.some(b => {
      if (newBookmark.permalink.includes('#note_') || newBookmark.permalink.includes('#issuecomment-')) {
        return b.permalink === newBookmark.permalink;
      }
      const timeDiff = Math.abs(new Date(b.timestamp).getTime() - new Date(newBookmark.timestamp).getTime());
      return b.repository === newBookmark.repository &&
             b.contextId === newBookmark.contextId &&
             b.author === newBookmark.author &&
             timeDiff < 60000;
    });
  }
}
