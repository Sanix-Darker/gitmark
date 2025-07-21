import { h } from 'preact';
import { useState } from 'preact/hooks';

export function BookmarkCard({ bookmark, onRemove, onUpdate, onTitleEdit }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(bookmark.title);
  
  const handleSave = () => {
    if (editTitle.trim() !== bookmark.title) {
      onUpdate(bookmark.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditTitle(bookmark.title);
      setIsEditing(false);
    }
  };
  
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString();
  };
  
  return h('div', { className: 'bookmark-card' }, [
    h('div', { className: 'bookmark-header' }, [
      isEditing ? h('input', {
        className: 'bookmark-title-input',
        value: editTitle,
        onInput: (e) => setEditTitle(e.target.value),
        onBlur: handleSave,
        onKeyDown: handleKeyDown,
        autoFocus: true
      }) : h('h4', { 
        className: 'bookmark-title',
        onClick: () => setIsEditing(true)
      }, bookmark.title),
      h('div', { className: 'bookmark-actions' }, [
        h('button', {
          className: 'btn-icon',
          onClick: () => setIsEditing(true),
          title: 'Edit title'
        }, '✏️'),
        h('button', {
          className: 'btn-icon',
          onClick: () => window.open(bookmark.permalink, '_blank'),
          title: 'Open in new tab'
        }, '↗'),
        h('button', {
          className: 'btn-icon btn-danger',
          onClick: () => onRemove(bookmark.id),
          title: 'Remove bookmark'
        }, '✕')
      ])
    ]),
    h('div', { className: 'bookmark-meta' }, [
      bookmark.avatar && h('img', {
        className: 'author-avatar',
        src: bookmark.avatar,
        alt: `${bookmark.author} avatar`,
        width: 20,
        height: 20
      }),
      h('span', { className: 'author' }, bookmark.author),
      h('span', { className: 'separator' }, '•'),
      h('span', { className: 'date' }, formatDate(bookmark.timestamp))
    ]),
    bookmark.commentText && h('div', { className: 'bookmark-content' }, 
      h('p', null, bookmark.commentText.substring(0, 200) + 
        (bookmark.commentText.length > 200 ? '...' : ''))
    ),
    h('div', { className: 'bookmark-context' }, [
      h('span', { className: 'context-type' }, 
        bookmark.type === 'merge_requests' ? 'MR' : 
        bookmark.type === 'issues' ? 'Issue' : 'Epic'
      ),
      h('span', { className: 'context-id' }, `#${bookmark.contextId}`)
    ])
  ]);
}