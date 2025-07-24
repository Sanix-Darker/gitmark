import React, { useState } from 'react';
import { Bookmark, BookmarkStorage } from '../../shared/types/bookmark';
import { BookmarkCard } from './BookmarkCard';

interface BookmarkListProps {
  bookmarks: BookmarkStorage;
  searchQuery: string;
  sortBy: 'recent' | 'alphabetical' | 'frequency';
  onRemove: (repository: string, bookmarkId: string) => void;
}

export const BookmarkList: React.FC<BookmarkListProps> = ({
  bookmarks,
  searchQuery,
  sortBy,
  onRemove
}) => {
  const repositories = Object.keys(bookmarks);

  if (repositories.length === 0) {
    return (
      <div className="empty-state">
        <h3>No bookmarks yet</h3>
        <p>Navigate to GitLab or GitHub comments and click the bookmark button to get started.</p>
      </div>
    );
  }

  const sortedRepos = sortRepositories(repositories, bookmarks, sortBy);

  return (
    <div className="repositories">
      {sortedRepos.map(repo => (
        <RepositoryGroup
          key={repo}
          repository={repo}
          bookmarks={bookmarks[repo]}
          searchQuery={searchQuery}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

const RepositoryGroup: React.FC<{
  repository: string;
  bookmarks: Bookmark[];
  searchQuery: string;
  onRemove: (repository: string, bookmarkId: string) => void;
}> = ({ repository, bookmarks, searchQuery, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const sortedBookmarks = [...bookmarks].sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="repository-group">
      <div
        className="repository-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="repository-info">
          <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▶</span>
          <h3 className="repository-name">{highlightText(repository, searchQuery)}</h3>
          <span className="bookmark-count">
            {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
      {isExpanded && (
        <div className="repository-bookmarks">
          {sortedBookmarks.map(bookmark => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              searchQuery={searchQuery}
              onRemove={() => onRemove(repository, bookmark.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function sortRepositories(repos: string[], bookmarks: BookmarkStorage, sortBy: string): string[] {
  switch (sortBy) {
    case 'alphabetical':
      return repos.sort((a, b) => a.localeCompare(b));
    case 'frequency':
      return repos.sort((a, b) => bookmarks[b].length - bookmarks[a].length);
    case 'recent':
    default:
      return repos.sort((a, b) => {
        const latestA = Math.max(...bookmarks[a].map(b => new Date(b.timestamp).getTime()));
        const latestB = Math.max(...bookmarks[b].map(b => new Date(b.timestamp).getTime()));
        return latestB - latestA;
      });
  }
}

function highlightText(text: string, query: string): string {
  if (!query || !text) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}
