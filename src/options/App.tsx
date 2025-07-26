import React from 'react';
import { Header } from '../popup/components/Header';
import { SearchBar } from '../popup/components/SearchBar';
import { BookmarkList } from '../popup/components/BookmarkList';
import { EmptyState } from '../popup/components/EmptyState';
import { useBookmarks } from '../shared/hooks/useBookmarks';
import { useSearch } from '../shared/hooks/useSearch';
import { usePlatformFilter } from '../shared/hooks/usePlatformFilter';
import './styles/options.css';

export const App: React.FC = () => {
  const { bookmarks, loading, error, removeBookmark, refresh } = useBookmarks();
  const [sortBy, setSortBy] = React.useState<'recent' | 'alphabetical' | 'frequency'>('recent');

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

  const handleImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const importedBookmarks = JSON.parse(text);

        // Validate the imported data
        if (typeof importedBookmarks !== 'object') {
          throw new Error('Invalid bookmarks format');
        }

        // Merge with existing bookmarks
        const { BookmarkStorageManager } = await import('../shared/utils/storage');
        const currentBookmarks = await BookmarkStorageManager.getBookmarks();

        // Merge imported bookmarks
        Object.entries(importedBookmarks).forEach(([repo, bookmarks]) => {
          if (!currentBookmarks[repo]) {
            currentBookmarks[repo] = [];
          }

          // Add non-duplicate bookmarks
          (bookmarks as any[]).forEach(bookmark => {
            const exists = currentBookmarks[repo].some(
              b => b.permalink === bookmark.permalink
            );
            if (!exists) {
              currentBookmarks[repo].push(bookmark);
            }
          });
        });

        await BookmarkStorageManager.saveBookmarks(currentBookmarks);
        refresh();

        alert(`Successfully imported bookmarks!`);
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import bookmarks. Please check the file format.');
      }
    };

    input.click();
  };

  // Check for welcome parameter
  React.useEffect(() => {
    // FIXME better way of saying welcome
    //const params = new URLSearchParams(window.location.search);
    //if (params.get('welcome') === 'true') {
    //  // Show welcome message for new users
    //  const welcomeMessage = document.createElement('div');
    //  welcomeMessage.className = 'welcome-message';
    //  welcomeMessage.innerHTML = `
    //    <h2>Welcome to GitMark!</h2>
    //    <p>Start bookmarking comments on your favorite Git platforms.</p>
    //    <button onclick="this.parentElement.remove()">Got it!</button>
    //  `;
    //  document.body.appendChild(welcomeMessage);
    //}
  }, []);

  if (loading) {
    return <div className="loading">Loading bookmarks...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <h3>Error</h3>
        <p>{error}</p>
        <button onClick={refresh}>Retry</button>
      </div>
    );
  }

  return (
    <div className="app fullscreen">
      <Header isFullScreen={true} />

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
        <div className="footer-actions">
          <button className="btn-text" onClick={handleImport}>
            Import
          </button>
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
