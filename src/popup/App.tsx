import React, { useState } from 'react';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { BookmarkList } from './components/BookmarkList';
import { EmptyState } from './components/EmptyState';
import { useBookmarks } from '../shared/hooks/useBookmarks';
import { useSearch } from '../shared/hooks/useSearch';
import { usePlatformFilter } from '../shared/hooks/usePlatformFilter';
import './styles/popup.css';

export const App: React.FC = () => {
  const { bookmarks, loading, error, removeBookmark } = useBookmarks();
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'frequency'>('recent');

  const {
    searchQuery,
    setSearchQuery,
    filteredBookmarks: searchFiltered
  } = useSearch(bookmarks);

  const {
    selectedPlatform,
    setSelectedPlatform,
    filteredBookmarks: platformFiltered,
    availablePlatforms
  } = usePlatformFilter(searchFiltered || bookmarks);

  const displayBookmarks = platformFiltered || searchFiltered || bookmarks;
  const totalCount = Object.values(displayBookmarks).flat().length;

  const handleExport = async () => {
    try {
      const blob = new Blob([JSON.stringify(bookmarks, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gitbookmark-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleOpenFullScreen = () => {
    chrome.runtime.openOptionsPage();
  };

  if (loading) {
    return <div className="loading">Loading bookmarks...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="app popup">
      <Header
        isFullScreen={false}
        onExpand={handleOpenFullScreen}
      />

      <div className="app-controls">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search bookmarks..."
        />

        <div className="sort-controls">
          <label className="sort-label">Sort by:</label>
          <select
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Recent</option>
            <option value="alphabetical">A-Z</option>
            <option value="frequency">Most bookmarks</option>
          </select>

          <label className="sort-label" style={{ marginLeft: '16px' }}>
            Platform:
          </label>
          <select
            className="sort-select"
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
          >
            <option value="all">All Platforms</option>
            {availablePlatforms.map(platform => (
              <option key={platform} value={platform}>
                {platform.charAt(0).toUpperCase() + platform.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <main className="app-main">
        {totalCount === 0 ? (
          <EmptyState />
        ) : (
          <BookmarkList
            bookmarks={displayBookmarks}
            searchQuery={searchQuery}
            sortBy={sortBy}
            onRemove={removeBookmark}
          />
        )}
      </main>

      <footer className="app-footer">
        <div className="stats">{totalCount} total bookmarks</div>
        <div className="footer-right">
          <button className="btn-text" onClick={handleExport}>
            Export
          </button>
        </div>
        <div className="attribution">
          Made by{' '}
          <a
            href="https://github.com/sanix-darker"
            target="_blank"
            rel="noopener noreferrer"
          >
            sanix-darker
          </a>
        </div>
      </footer>
    </div>
  );
};
