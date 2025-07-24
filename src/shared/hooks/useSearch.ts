import { useState, useMemo } from 'react';
import { BookmarkStorage } from '../types/bookmark';

export function useSearch(bookmarks: BookmarkStorage) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBookmarks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return null;

    const filtered: BookmarkStorage = {};

    Object.entries(bookmarks).forEach(([repo, repoBookmarks]) => {
      const matchingBookmarks = repoBookmarks.filter(bookmark => {
        const titleMatch = bookmark.title.toLowerCase().includes(query);
        const contentMatch = bookmark.commentText?.toLowerCase().includes(query);
        const authorMatch = bookmark.author.toLowerCase().includes(query);
        const repoMatch = repo.toLowerCase().includes(query);

        return titleMatch || contentMatch || authorMatch || repoMatch;
      });

      if (matchingBookmarks.length > 0) {
        filtered[repo] = matchingBookmarks;
      }
    });

    return Object.keys(filtered).length > 0 ? filtered : null;
  }, [bookmarks, searchQuery]);

  return {
    searchQuery,
    setSearchQuery,
    filteredBookmarks
  };
}
