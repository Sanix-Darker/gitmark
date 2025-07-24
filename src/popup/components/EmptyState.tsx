import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <h3>No bookmarks yet</h3>
      <p>Navigate to GitLab, GitHub, or other supported platforms and click the bookmark button to save comments.</p>
      <div className="supported-platforms">
        <p className="supported-platforms-title">Supported platforms:</p>
        <div className="platform-list">
          <span className="platform-badge">GitLab | </span>
          <span className="platform-badge">GitHub | </span>
          <span className="platform-badge">Gitea | </span>
          <span className="platform-badge">Bitbucket | </span>
          <span className="platform-badge">SourceHut | </span>
          <span className="platform-badge">Azure DevOps</span>
        </div>
      </div>
    </div>
  );
};
