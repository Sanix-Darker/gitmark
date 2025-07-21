// Storage utilities for bookmark management
export class BookmarkStorage {
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
    const exists = bookmarks[repoKey].find(b => b.permalink === bookmark.permalink);
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
  
  static async updateBookmark(repository, bookmarkId, updates) {
    const bookmarks = await this.getBookmarks();
    if (bookmarks[repository]) {
      const bookmark = bookmarks[repository].find(b => b.id === bookmarkId);
      if (bookmark) {
        Object.assign(bookmark, updates);
        await this.saveBookmarks(bookmarks);
      }
    }
  }
  
  static async searchBookmarks(query) {
    const bookmarks = await this.getBookmarks();
    const results = [];
    
    for (const [repo, repoBookmarks] of Object.entries(bookmarks)) {
      const filtered = repoBookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.commentText.toLowerCase().includes(query.toLowerCase()) ||
        bookmark.author.toLowerCase().includes(query.toLowerCase())
      );
      
      if (filtered.length > 0) {
        results.push({ repository: repo, bookmarks: filtered });
      }
    }
    
    return results;
  }
}