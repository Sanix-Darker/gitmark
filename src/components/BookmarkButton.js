import { h } from 'preact';

export function BookmarkButton({ onClick, isBookmarked = false, className = '' }) {
  return h('button', {
    className: `bookmark-btn ${isBookmarked ? 'bookmarked' : ''} ${className}`,
    onClick,
    title: isBookmarked ? 'Remove bookmark' : 'Bookmark this comment',
    'aria-label': isBookmarked ? 'Remove bookmark' : 'Bookmark comment'
  }, [
    h('svg', {
      width: 16,
      height: 16,
      viewBox: '0 0 16 16',
      fill: 'currentColor'
    }, [
      h('path', {
        d: isBookmarked 
          ? 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2z'
          : 'M2 2a2 2 0 012-2h8a2 2 0 012 2v13.5a.5.5 0 01-.777.416L8 13.101l-5.223 2.815A.5.5 0 012 15.416V2zm2-1a1 1 0 00-1 1v12.566l4.723-2.482a.5.5 0 01.554 0L13 14.566V2a1 1 0 00-1-1H4z'
      })
    ])
  ]);
}