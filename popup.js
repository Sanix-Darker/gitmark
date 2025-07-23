let originalConsoleLog = console.log;
let enableConsoleLog = false;
console.log = function() {
    if (enableConsoleLog) {
        originalConsoleLog.apply(console, arguments);
    }
};

// Global state for search and filtering
let allBookmarks = {};
let filteredBookmarks = null;
let searchQuery = '';

// Simple vanilla JS implementation for popup
function createApp(isFullScreen = false) {
  const app = document.getElementById('app');
  if (!app) {
    console.error('App element not found');
    return;
  }

  // Clear loading state
  app.innerHTML = '';

  // Create header
  const header = document.createElement('div');
  header.className = 'app-header';
  header.innerHTML = `
    <h1 class="app-title"><svg fill="#000000" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24px" height="18px" viewBox="0 0 535.72 535.72" xml:space="preserve" stroke="#000000" stroke-width="0.00535717" transform="rotate(180)"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round" stroke="#CCCCCC" stroke-width="1.071434"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M371.563,0H164.156c-7.515,0-13.599,6.089-13.599,13.599v509.349c0,5.393,3.134,10.049,7.687,12.252 c3.042,1.471,7.98-0.445,10.532-2.662l99.083-86.09l99.083,86.09c2.553,2.217,7.49,4.139,10.533,2.662 c4.547-2.203,7.686-6.859,7.686-12.252V13.605C385.168,6.089,379.079,0,371.563,0z"></path> </g> </g> </g></svg>GitBookmark</h1>
    ${!isFullScreen ? '<button class="btn-text" id="expand-btn" title="Open full screen">⤢</button>' : ''}
  `;

  // Create search bar
  const searchContainer = document.createElement('div');
  searchContainer.className = 'app-controls';
  searchContainer.innerHTML = `
    <div class="search-bar">
      <div class="search-input-container">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 16 16">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
        <input type="text" class="search-input" placeholder="Search bookmarks..." id="search-input">
      </div>
    </div>
    <div class="sort-controls">
      <label class="sort-label">Sort by:</label>
      <select class="sort-select" id="sort-select">
        <option value="recent">Recent</option>
        <option value="alphabetical">A-Z</option>
        <option value="frequency">Most bookmarks</option>
      </select>
      <label class="sort-label" style="margin-left: 16px;">Platform:</label>
      <select class="sort-select" id="platform-filter">
        <option value="all">All Platforms</option>
      </select>
    </div>
  `;

  // Create main content area
  const main = document.createElement('main');
  main.className = 'app-main';
  main.id = 'main-content';

  // Create footer
  const footer = document.createElement('footer');
  footer.className = 'app-footer';
  footer.innerHTML = `
    <div class="stats" id="stats">0 total bookmarks</div>
    <div class="footer-right">
      <button class="btn-text" id="export-btn">Export</button>
    </div>
    <div class="attribution">
      Made by <a href="https://github.com/sanix-darker" target="_blank" rel="noopener">sanix-darker</a>
    </div>
  `;

  // Assemble app
  app.className = `app ${isFullScreen ? 'fullscreen' : 'popup'}`;
  app.appendChild(header);
  app.appendChild(searchContainer);
  app.appendChild(main);
  app.appendChild(footer);

  // Add search functionality
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      handleSearch(e.target.value);
    });
  }

  // Add sort functionality
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      const sortBy = e.target.value;
      console.log('Sort changed to:', sortBy);
      const dataToDisplay = filteredBookmarks || allBookmarks;
      displayBookmarks(dataToDisplay, sortBy);
    });
  }

  // Add platform filter functionality
  const platformFilter = document.getElementById('platform-filter');
  if (platformFilter) {
    platformFilter.addEventListener('change', (e) => {
      const platform = e.target.value;
      console.log('Platform filter changed to:', platform);
      handlePlatformFilter(platform);
    });
  }

  // Add event listeners
  if (!isFullScreen) {
    const expandBtn = document.getElementById('expand-btn');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        if (typeof chrome !== 'undefined' && chrome.runtime) {
          chrome.runtime.openOptionsPage();
        }
      });
    }
  }

  // Load and display bookmarks
  loadBookmarks();
}

async function loadBookmarks() {
  try {
    console.log('Loading bookmarks...');
    allBookmarks = await getBookmarks();
    console.log('Bookmarks loaded:', allBookmarks);
    populatePlatformFilter();
    displayBookmarks(filteredBookmarks || allBookmarks);
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
    displayError('Failed to load bookmarks');
  }
}

function handleSearch(query) {
  searchQuery = query.toLowerCase().trim();
  console.log('Searching for:', searchQuery);

  if (!searchQuery) {
    filteredBookmarks = null;
    const sortBy = document.getElementById('sort-select')?.value || 'recent';
    displayBookmarks(allBookmarks, sortBy);
    return;
  }

  filteredBookmarks = {};

  Object.entries(allBookmarks).forEach(([repo, bookmarks]) => {
    const matchingBookmarks = bookmarks.filter(bookmark => {
      const titleMatch = bookmark.title.toLowerCase().includes(searchQuery);
      const contentMatch = bookmark.commentText && bookmark.commentText.toLowerCase().includes(searchQuery);
      const authorMatch = bookmark.author.toLowerCase().includes(searchQuery);
      const repoMatch = repo.toLowerCase().includes(searchQuery);

      return titleMatch || contentMatch || authorMatch || repoMatch;
    });

    if (matchingBookmarks.length > 0) {
      filteredBookmarks[repo] = matchingBookmarks;
    }
  });

  const sortBy = document.getElementById('sort-select')?.value || 'recent';
  displayBookmarks(filteredBookmarks, sortBy);
}

function populatePlatformFilter() {
  const platformFilter = document.getElementById('platform-filter');
  if (!platformFilter) return;

  const platforms = new Set();
  Object.values(allBookmarks).flat().forEach(bookmark => {
    if (bookmark.platform) {
      platforms.add(bookmark.platform);
    }
  });

  // Clear existing options except "All Platforms"
  platformFilter.innerHTML = '<option value="all">All Platforms</option>';

  // Add platform options
  Array.from(platforms).sort().forEach(platform => {
    const option = document.createElement('option');
    option.value = platform;
    option.textContent = platform.charAt(0).toUpperCase() + platform.slice(1);
    platformFilter.appendChild(option);
  });
}

function handlePlatformFilter(platform) {
  if (platform === 'all') {
    filteredBookmarks = null;
    displayBookmarks(allBookmarks);
    return;
  }

  filteredBookmarks = {};

  Object.entries(allBookmarks).forEach(([repo, bookmarks]) => {
    const matchingBookmarks = bookmarks.filter(bookmark => bookmark.platform === platform);

    if (matchingBookmarks.length > 0) {
      filteredBookmarks[repo] = matchingBookmarks;
    }
  });

  displayBookmarks(filteredBookmarks);
}


function highlightText(text, query) {
  if (!query || !text) return text;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="search-highlight">$1</mark>');
}

async function getBookmarks() {
  const STORAGE_KEY = 'gitlab_github_bookmarks';

  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      const result = await chrome.storage.local.get([STORAGE_KEY]);
      return result[STORAGE_KEY] || {};
    } else {
      // Fallback for development
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    }
  } catch (error) {
    console.error('Failed to get bookmarks:', error);
    return {};
  }
}

function displayBookmarks(bookmarks, sortBy = 'recent') {
  const main = document.getElementById('main-content');
  const stats = document.getElementById('stats');

  if (!main) return;

  const repositories = Object.keys(bookmarks);
  const totalBookmarks = Object.values(bookmarks).flat().length;

  // Update stats
  if (stats) {
    stats.textContent = `${totalBookmarks} total bookmarks`;
  }

  if (repositories.length === 0) {
    main.innerHTML = `
      <div class="empty-state">
        <h3>No bookmarks yet</h3>
        <p>Navigate to GitLab or GitHub comments and click the bookmark button to get started.</p>
      </div>
    `;
    return;
  }

  // Sort repositories based on selected option
  let sortedRepos;
  switch (sortBy) {
    case 'alphabetical':
      sortedRepos = repositories.sort((a, b) => a.localeCompare(b));
      break;
    case 'frequency':
      sortedRepos = repositories.sort((a, b) => bookmarks[b].length - bookmarks[a].length);
      break;
    case 'recent':
    default:
      sortedRepos = repositories.sort((a, b) => {
        const latestA = Math.max(...bookmarks[a].map(bookmark => new Date(bookmark.timestamp).getTime()));
        const latestB = Math.max(...bookmarks[b].map(bookmark => new Date(bookmark.timestamp).getTime()));
        return latestB - latestA;
      });
      break;
  }

  const repositoriesHTML = sortedRepos.map(repo => {
    const repoBookmarks = bookmarks[repo];
    // Sort bookmarks within each repository by timestamp (DESC)
    const sortedBookmarks = [...repoBookmarks].sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    const safeRepo = repo.replace(/"/g, '&quot;');
    return `
      <div class="repository-group">
        <div class="repository-header" data-repository="${safeRepo}">
          <div class="repository-info">
            <span class="expand-icon expanded">▶</span>
            <h3 class="repository-name">${highlightText(repo, searchQuery)}</h3>
            <span class="bookmark-count">${repoBookmarks.length} bookmark${repoBookmarks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        <div class="repository-bookmarks">
          ${sortedBookmarks.map(bookmark => createBookmarkCard(bookmark)).join('')}
        </div>
      </div>
    `;
  }).join('');

  main.innerHTML = `<div class="repositories">${repositoriesHTML}</div>`;

  // Add event listeners after DOM is updated
  addEventListeners();
}

function createBookmarkCard(bookmark) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return `
    <div class="bookmark-card" data-permalink="${bookmark.permalink.replace(/"/g, '&quot;')}">
      <div class="bookmark-header">
        <h4 class="bookmark-title">${highlightText(bookmark.title, searchQuery)}</h4>
        <div class="bookmark-actions">
          <button class="btn-icon copy-bookmark" data-permalink="${bookmark.permalink.replace(/"/g, '&quot;')}" title="Copy URL">📋</button>
          <button class="btn-icon open-bookmark" data-permalink="${bookmark.permalink.replace(/"/g, '&quot;')}" title="Open in new tab">↗</button>
          <button class="btn-icon btn-danger remove-bookmark" data-repository="${bookmark.repository}" data-bookmark-id="${bookmark.id}" title="Remove bookmark">✕</button>
        </div>
      </div>
      <div class="bookmark-meta">
        ${bookmark.avatar ? `<img class="author-avatar" src="${bookmark.avatar}" alt="${bookmark.author} avatar" width="20" height="20">` : ''}
        <span class="author">${highlightText(bookmark.author, searchQuery)}</span>
        <span class="separator">•</span>
        <span class="date">${formatDate(bookmark.timestamp)}</span>
      </div>
      ${bookmark.commentText ? `
        <div class="bookmark-content">
          <p>${highlightText(bookmark.commentText.substring(0, 200), searchQuery)}${bookmark.commentText.length > 200 ? '...' : ''}</p>
        </div>
      ` : ''}
      <div class="bookmark-context">
        <span class="context-type">${bookmark.type === 'merge_requests' ? 'MR' : bookmark.type === 'issues' ? 'Issue' : 'Epic'}</span>
        <span class="context-id">#${bookmark.contextId}</span>
      </div>
    </div>
  `;
}

function openBookmark(permalink) {
  console.log('Opening bookmark:', permalink);
  if (typeof chrome !== 'undefined' && chrome.tabs) {
    // Use Chrome extension API if available
    chrome.tabs.create({ url: permalink });
  } else {
    // Fallback to window.open
    window.open(permalink, '_blank', 'noopener,noreferrer');
  }
}

function displayError(message) {
  const main = document.getElementById('main-content');
  if (main) {
    main.innerHTML = `
      <div class="error">
        <h3>Error</h3>
        <p>${message}</p>
        <button class="btn-text" onclick="loadBookmarks()">Retry</button>
      </div>
    `;
  }
}

function toggleRepository(repo) {
  console.log('Toggling repository:', repo);

  // Use event delegation to find the clicked repository header
  const clickedHeader = event.target.closest('.repository-header');
  if (!clickedHeader) {
    console.error('Repository header not found');
    return;
  }

  const repositoryGroup = clickedHeader.closest('.repository-group');
  if (!repositoryGroup) {
    console.error('Repository group not found');
    return;
  }

  const bookmarksContainer = repositoryGroup.querySelector('.repository-bookmarks');
  const expandIcon = repositoryGroup.querySelector('.expand-icon');

  if (bookmarksContainer && expandIcon) {
    const isCurrentlyExpanded = expandIcon.classList.contains('expanded');

    if (isCurrentlyExpanded) {
      // Collapse
      bookmarksContainer.style.display = 'none';
      expandIcon.classList.remove('expanded');
      console.log('Collapsed repository:', repo);
    } else {
      // Expand
      bookmarksContainer.style.display = 'block';
      expandIcon.classList.add('expanded');
      console.log('Expanded repository:', repo);
    }
  }
}

function addEventListeners() {
  // Repository header toggle listeners
  document.querySelectorAll('.repository-header').forEach(header => {
    header.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();

      const repo = this.getAttribute('data-repository');
      const repositoryGroup = this.closest('.repository-group');

      if (!repositoryGroup) {
        console.error('Repository group not found for:', repo);
        return;
      }

      const bookmarksContainer = repositoryGroup.querySelector('.repository-bookmarks');
      const expandIcon = repositoryGroup.querySelector('.expand-icon');

      if (bookmarksContainer && expandIcon) {
        const isCurrentlyExpanded = expandIcon.classList.contains('expanded');

        if (isCurrentlyExpanded) {
          // Collapse
          bookmarksContainer.style.display = 'none';
          expandIcon.classList.remove('expanded');
          console.log('Collapsed repository:', repo);
        } else {
          // Expand
          bookmarksContainer.style.display = 'block';
          expandIcon.classList.add('expanded');
          console.log('Expanded repository:', repo);
        }
      }
    });
  });

  // Bookmark card click listeners
  document.querySelectorAll('.bookmark-card').forEach(card => {
    card.addEventListener('click', function(event) {
      // Don't trigger if clicking on action buttons
      if (event.target.closest('.bookmark-actions')) {
        return;
      }

      const permalink = this.getAttribute('data-permalink');
      if (permalink) {
        openBookmark(permalink);
      }
    });
  });

  // Open bookmark button listeners
  document.querySelectorAll('.open-bookmark').forEach(button => {
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      const permalink = this.getAttribute('data-permalink');
      if (permalink) {
        openBookmark(permalink);
      }
    });
  });

  // Copy bookmark button listeners
  document.querySelectorAll('.copy-bookmark').forEach(button => {
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      const permalink = this.getAttribute('data-permalink');
      if (permalink) {
        copyToClipboard(permalink);
      }
    });
  });

  // Remove bookmark button listeners
  document.querySelectorAll('.remove-bookmark').forEach(button => {
    button.addEventListener('click', function(event) {
      event.stopPropagation();
      const repository = this.getAttribute('data-repository');
      const bookmarkId = this.getAttribute('data-bookmark-id');
      if (repository && bookmarkId) {
        removeBookmark(repository, bookmarkId);
      }
    });
  });
}

function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      console.log('URL copied to clipboard:', text);
      showNotification('URL copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      fallbackCopyToClipboard(text);
    });
  } else {
    fallbackCopyToClipboard(text);
  }
}

function fallbackCopyToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();

  try {
    document.execCommand('copy');
    console.log('URL copied to clipboard (fallback):', text);
    showNotification('URL copied to clipboard');
  } catch (err) {
    console.error('Fallback copy failed:', err);
    showNotification('Failed to copy URL');
  }

  document.body.removeChild(textArea);
}

function showNotification(message) {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #000;
    color: #fff;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

async function removeBookmark(repository, bookmarkId) {
  try {
    if (allBookmarks[repository]) {
      allBookmarks[repository] = allBookmarks[repository].filter(b => b.id !== bookmarkId);
      if (allBookmarks[repository].length === 0) {
        delete allBookmarks[repository];
      }
      await saveBookmarks(allBookmarks);

      // Update filtered bookmarks if search is active
      if (filteredBookmarks && filteredBookmarks[repository]) {
        filteredBookmarks[repository] = filteredBookmarks[repository].filter(b => b.id !== bookmarkId);
        if (filteredBookmarks[repository].length === 0) {
          delete filteredBookmarks[repository];
        }
      }

      loadBookmarks(); // Reload display
    }
  } catch (error) {
    console.error('Failed to remove bookmark:', error);
  }
}

async function saveBookmarks(bookmarks) {
  const STORAGE_KEY = 'gitlab_github_bookmarks';

  try {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({ [STORAGE_KEY]: bookmarks });
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
    }
  } catch (error) {
    console.error('Failed to save bookmarks:', error);
    throw error;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, creating app...');
    createApp(false);
  });
} else {
  console.log('DOM already loaded, creating app...');
  createApp(false);
}
