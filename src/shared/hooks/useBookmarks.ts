import { useState, useEffect } from 'react';
import { BookmarkStorage } from '../types/bookmark';
import { BookmarkStorageManager } from '../utils/storage';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState<BookmarkStorage>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBookmarks();

    // Listen for storage changes
    const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if ('gitlab_github_bookmarks' in changes) {
        setBookmarks(changes.gitlab_github_bookmarks.newValue || {});
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const loadBookmarks = async () => {
    try {
      setLoading(true);
      const data = await BookmarkStorageManager.getBookmarks();
      setBookmarks(data);
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (repository: string, bookmarkId: string) => {
    try {
      await BookmarkStorageManager.removeBookmark(repository, bookmarkId);
      await loadBookmarks();
    } catch (err) {
      console.error('Failed to remove bookmark:', err);
    }
  };

  return { bookmarks, loading, error, removeBookmark, refresh: loadBookmarks };
}
