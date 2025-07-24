import React, { useState } from 'react';
import { Bookmark } from '../../shared/types/bookmark';

interface BookmarkCardProps {
  bookmark: Bookmark;
  searchQuery: string;
  onRemove: () => void;
}

export const BookmarkCard: React.FC<BookmarkCardProps> = ({
  bookmark,
  searchQuery,
  onRemove
}) => {
  const [showFullContent, setShowFullContent] = useState(false);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`;
    }

    return date.toLocaleDateString();
  };

  const highlightText = (text: string, query: string): string => {
    if (!query || !text) return text;

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't open if clicking on actions
    if ((e.target as HTMLElement).closest('.bookmark-actions')) {
      return;
    }
    openBookmark();
  };

  const openBookmark = () => {
    chrome.tabs.create({ url: bookmark.permalink });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.permalink);
      // Show toast notification
      showNotification('URL copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback to older method
      const textArea = document.createElement('textarea');
      textArea.value = bookmark.permalink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('URL copied to clipboard');
    }
  };

  const showNotification = (message: string) => {
    // Simple notification implementation
    const notification = document.createElement('div');
    notification.className = 'bookmark-notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 2000);
  };

  const getPlatformIcon = () => {
    const icons: Record<string, string> = {
      gitlab: '🦊',
      github: '🐙',
      gitea: '🍵',
      bitbucket: '🪣',
      sourcehut: '🏠',
      azure: '☁️'
    };
    return icons[bookmark.platform] || '📑';
  };

  const contentPreview = bookmark.commentText.substring(0, 200);
  const hasMoreContent = bookmark.commentText.length > 200;

  return (
    <div
      className="bookmark-card"
      onClick={handleCardClick}
      role="article"
      tabIndex={0}
    >
      <div className="bookmark-header">
        <h4
          className="bookmark-title"
          dangerouslySetInnerHTML={{
            __html: highlightText(bookmark.title, searchQuery)
          }}
        />
        <div className="bookmark-actions">
          <button
            className="btn-icon"
            onClick={copyToClipboard}
            title="Copy URL"
            aria-label="Copy URL"
          >
            📋
          </button>
          <button
            className="btn-icon"
            onClick={openBookmark}
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            ↗
          </button>
          <button
            className="btn-icon btn-danger"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Remove bookmark"
            aria-label="Remove bookmark"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="bookmark-meta">
        {bookmark.avatar && (
          <img
            className="author-avatar"
            src={bookmark.avatar}
            alt={`${bookmark.author} avatar`}
            width="20"
            height="20"
          />
        )}
        <span
          className="author"
          dangerouslySetInnerHTML={{
            __html: highlightText(bookmark.author, searchQuery)
          }}
        />
        <span className="separator">•</span>
        <span className="date">{formatDate(bookmark.timestamp)}</span>
        <span className="separator">•</span>
        <span className="platform-indicator" title={bookmark.platform}>
          {getPlatformIcon()}
        </span>
      </div>

      {bookmark.commentText && (
        <div className="bookmark-content">
          <p
            dangerouslySetInnerHTML={{
              __html: highlightText(
                showFullContent ? bookmark.commentText : contentPreview,
                searchQuery
              ) + (hasMoreContent && !showFullContent ? '...' : '')
            }}
          />
          {hasMoreContent && (
            <button
              className="btn-text show-more"
              onClick={(e) => {
                e.stopPropagation();
                setShowFullContent(!showFullContent);
              }}
            >
              {showFullContent ? 'Show less' : 'Show more'}
            </button>
          )}
        </div>
      )}

      <div className="bookmark-context">
        <span className="context-type">
          {bookmark.type === 'merge_requests' ? 'MR' :
           bookmark.type === 'issues' ? 'Issue' :
           bookmark.type === 'epics' ? 'Epic' : 'Comment'}
        </span>
        <span className="context-id">#{bookmark.contextId}</span>
        <span className="repository-name">
          {bookmark.repository}
        </span>
      </div>
    </div>
  );
};
