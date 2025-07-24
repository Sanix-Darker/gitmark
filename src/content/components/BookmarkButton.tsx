import React, { useState, useEffect } from 'react';
import { Bookmark } from '../../shared/types/bookmark';
import { BookmarkStorageManager } from '../../shared/utils/storage';

interface BookmarkButtonProps {
  commentElement: HTMLElement;
  onBookmark: (bookmark: Bookmark) => void;
  initialBookmark?: Bookmark;
}

export const BookmarkButton: React.FC<BookmarkButtonProps> = ({
  onBookmark,
  initialBookmark
}) => {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkBookmarkStatus();
  }, []);

  const checkBookmarkStatus = async () => {
    if (initialBookmark) {
      const bookmarks = await BookmarkStorageManager.getBookmarks();
      const repoBookmarks = bookmarks[initialBookmark.repository] || [];
      setIsBookmarked(repoBookmarks.some(b => b.permalink === initialBookmark.permalink));
    }
  };

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!initialBookmark) return;

    setIsLoading(true);

    try {
      if (isBookmarked) {
        await BookmarkStorageManager.removeBookmark(
          initialBookmark.repository,
          initialBookmark.id
        );
        setIsBookmarked(false);
      } else {
        const success = await BookmarkStorageManager.addBookmark(initialBookmark);
        if (success) {
          setIsBookmarked(true);
          onBookmark(initialBookmark);
        }
      }
    } catch (error) {
      console.error('Bookmark operation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      className={`bookmark-btn ${isBookmarked ? 'bookmarked' : ''}`}
      onClick={handleClick}
      disabled={isLoading}
      title={isBookmarked ? 'Remove bookmark' : 'Bookmark this comment'}
      aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this comment'}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d={isBookmarked
          ? "M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2z"
          : "M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z"
        }/>
      </svg>
    </button>
  );
};
