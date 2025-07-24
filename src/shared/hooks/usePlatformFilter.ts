import { useState, useMemo } from 'react';
import { BookmarkStorage } from '../types/bookmark';

export function usePlatformFilter(bookmarks: BookmarkStorage) {
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  const availablePlatforms = useMemo(() => {
    const platforms = new Set<string>();

    Object.values(bookmarks).flat().forEach(bookmark => {
      if (bookmark.platform) {
        platforms.add(bookmark.platform);
      }
    });

    return Array.from(platforms).sort();
  }, [bookmarks]);

  const filteredBookmarks = useMemo(() => {
    if (selectedPlatform === 'all') return null;

    const filtered: BookmarkStorage = {};

    Object.entries(bookmarks).forEach(([repo, repoBookmarks]) => {
      const matchingBookmarks = repoBookmarks.filter(
        bookmark => bookmark.platform === selectedPlatform
      );

      if (matchingBookmarks.length > 0) {
        filtered[repo] = matchingBookmarks;
      }
    });

    return Object.keys(filtered).length > 0 ? filtered : null;
  }, [bookmarks, selectedPlatform]);

  return {
    selectedPlatform,
    setSelectedPlatform,
    filteredBookmarks,
    availablePlatforms
  };
}
