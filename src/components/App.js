import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { BookmarkStorage } from '../utils/storage';
import { RepositoryGroup } from './RepositoryGroup';
import { SearchBar } from './SearchBar';

export function App({ isFullScreen = false }) {
  const [bookmarks, setBookmarks] = useState({});
  const [searchResults, setSearchResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent, alphabetical, frequency
  
  useEffect(() => {
    loadBookmarks();
  }, []);
  
  const loadBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await BookmarkStorage.getBookmarks();
      setBookmarks(data);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
      setError('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }
    
    try {
      const results = await BookmarkStorage.searchBookmarks(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };
  
  const handleRemoveBookmark = async (repository, bookmarkId) => {
    try {
      await BookmarkStorage.removeBookmark(repository, bookmarkId);
      await loadBookmarks();
    } catch (error) {
      console.error('Failed to remove bookmark:', error);
    }
  };
  
  const handleUpdateBookmark = async (repository, bookmarkId, updates) => {
    try {
      await BookmarkStorage.updateBookmark(repository, bookmarkId, updates);
      await loadBookmarks();
    } catch (error) {
      console.error('Failed to update bookmark:', error);
    }
  };
  
  const getSortedRepositories = (bookmarksData) => {
    const repos = Object.entries(bookmarksData);
    
    switch (sortBy) {
      case 'alphabetical':
        return repos.sort(([a], [b]) => a.localeCompare(b));
      case 'frequency':
        return repos.sort(([, a], [, b]) => b.length - a.length);
      case 'recent':
      default:
        return repos.sort(([, a], [, b]) => {
          const latestA = new Date(Math.max(...a.map(bookmark => new Date(bookmark.timestamp))));
          const latestB = new Date(Math.max(...b.map(bookmark => new Date(bookmark.timestamp))));
          return latestB - latestA;
        });
    }
  };
  
  const displayData = searchResults || bookmarks;
  const hasBookmarks = Object.keys(displayData).length > 0;
  
  if (loading) {
    return h('div', { className: `app ${isFullScreen ? 'fullscreen' : 'popup'}` }, [
      h('div', { className: 'loading' }, 'Loading bookmarks...')
    ]);
  }
  
  if (error) {
    return h('div', { className: `app ${isFullScreen ? 'fullscreen' : 'popup'}` }, [
      h('div', { className: 'error' }, [
        h('h3', null, 'Error'),
        h('p', null, error),
        h('button', { 
          className: 'btn-text',
          onClick: loadBookmarks 
        }, 'Retry')
      ])
    ]);
  }
  
  return h('div', { className: `app ${isFullScreen ? 'fullscreen' : 'popup'}` }, [
    h('header', { className: 'app-header' }, [
      h('h1', { className: 'app-title' }, 'GitLab/GitHub Bookmarks'),
      !isFullScreen && h('button', {
        className: 'btn-text',
        onClick: () => {
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.openOptionsPage();
          }
        },
        title: 'Open full screen'
      }, '⤢')
    ]),
    
    h('div', { className: 'app-controls' }, [
      h(SearchBar, { onSearch: handleSearch }),
      
      h('div', { className: 'sort-controls' }, [
        h('label', { className: 'sort-label' }, 'Sort by:'),
        h('select', {
          className: 'sort-select',
          value: sortBy,
          onChange: (e) => setSortBy(e.target.value)
        }, [
          h('option', { value: 'recent' }, 'Recent'),
          h('option', { value: 'alphabetical' }, 'A-Z'),
          h('option', { value: 'frequency' }, 'Most bookmarks')
        ])
      ])
    ]),
    
    h('main', { className: 'app-main' }, [
      !hasBookmarks && h('div', { className: 'empty-state' }, [
        h('h3', null, 'No bookmarks yet'),
        h('p', null, 'Navigate to GitLab or GitHub comments and click the bookmark button to get started.')
      ]),
      
      hasBookmarks && h('div', { className: 'repositories' },
        getSortedRepositories(displayData).map(([repository, repoBookmarks]) =>
          h(RepositoryGroup, {
            key: repository,
            repository,
            bookmarks: repoBookmarks,
            onRemoveBookmark: handleRemoveBookmark,
            onUpdateBookmark: handleUpdateBookmark
          })
        )
      )
    ]),
    
    hasBookmarks && h('footer', { className: 'app-footer' }, [
      h('div', { className: 'stats' }, `${Object.values(displayData).flat().length} total bookmarks`),
      h('button', {
        className: 'btn-text',
        onClick: async () => {
          try {
            const data = await BookmarkStorage.getBookmarks();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'gitlab-github-bookmarks.json';
            a.click();
            URL.revokeObjectURL(url);
          } catch (error) {
            console.error('Export failed:', error);
          }
        }
      }, 'Export')
    ])
  ]);
}