import { h } from 'preact';
import { useState } from 'preact/hooks';
import { BookmarkCard } from './BookmarkCard.js';

export function RepositoryGroup({ repository, bookmarks, onRemoveBookmark, onUpdateBookmark }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const toggleExpanded = () => setIsExpanded(!isExpanded);
  
  return h('div', { className: 'repository-group' }, [
    h('div', { className: 'repository-header', onClick: toggleExpanded }, [
      h('div', { className: 'repository-info' }, [
        h('span', { className: `expand-icon ${isExpanded ? 'expanded' : ''}` }, '▶'),
        h('h3', { className: 'repository-name' }, repository),
        h('span', { className: 'bookmark-count' }, `${bookmarks.length} bookmark${bookmarks.length !== 1 ? 's' : ''}`)
      ]),
      h('div', { className: 'repository-actions' }, [
        h('button', {
          className: 'btn-text',
          onClick: (e) => {
            e.stopPropagation();
            // Implement bulk operations
          }
        }, 'Options')
      ])
    ]),
    isExpanded && h('div', { className: 'repository-bookmarks' },
      bookmarks.map(bookmark =>
        h(BookmarkCard, {
          key: bookmark.id,
          bookmark,
          onRemove: (id) => onRemoveBookmark(repository, id),
          onUpdate: (id, updates) => onUpdateBookmark(repository, id, updates)
        })
      )
    )
  ]);
}