// URL parsing utilities for GitLab and GitHub
export class URLParser {
  static parseGitLabURL(url) {
    const gitlabRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/-\/(merge_requests|issues|epics)\/(\d+)(?:#note_(\d+))?/;
    const match = url.match(gitlabRegex);

    if (!match) return null;

    const [, domain, repository, type, id, noteId] = match;

    return {
      platform: 'gitlab',
      domain,
      repository,
      type,
      id: parseInt(id),
      noteId: noteId ? parseInt(noteId) : null,
      permalink: url
    };
  }

  static parseGitHubURL(url) {
    const githubRegex = /https?:\/\/(.*?)\/([^\/]+\/[^\/]+)\/(issues|pull)\/(\d+)(?:#issuecomment-(\d+))?/;
    const match = url.match(githubRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'github',
      domain,
      repository,
      type: type === 'pull' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : null,
      permalink: url
    };
  }

  static parseURL(url) {
    return this.parseGitLabURL(url) || this.parseGitHubURL(url);
  }

  static generateTitle(commentText, contextTitle) {
    // Take first 40 characters of comment or fallback to context
    const commentPreview = commentText?.substring(0, 40).trim();
    if (commentPreview) {
      return commentPreview + (commentText.length > 40 ? '...' : '');
    }
    return contextTitle || 'Untitled Bookmark';
  }

  static extractCommentData(element) {
    // Try multiple selectors for comment text
    const commentText = (
      element.querySelector('.md')?.textContent?.trim() ||
      element.querySelector('.comment-body')?.textContent?.trim() ||
      element.querySelector('.note-text')?.textContent?.trim() ||
      element.querySelector('.timeline-comment-text')?.textContent?.trim() ||
      element.querySelector('.js-comment-body')?.textContent?.trim() ||
      ''
    );

    // Try multiple selectors for author
    const authorElement = (
      element.querySelector('[data-username]') ||
      element.querySelector('.author') ||
      element.querySelector('.note-header-author-name') ||
      element.querySelector('.timeline-comment-header .author') ||
      element.querySelector('.js-discussion-header .author')
    );
    const author = authorElement?.textContent?.trim() || 'Unknown';

    // Try multiple selectors for avatar
    const avatarElement = (
      element.querySelector('.avatar') ||
      element.querySelector('img[alt*="avatar"]') ||
      element.querySelector('.note-header-author-name img') ||
      element.querySelector('.timeline-comment-header img')
    );
    const avatar = avatarElement?.src || '';

    // Try multiple selectors for timestamp
    const timeElement = (
      element.querySelector('time') ||
      element.querySelector('.created-at') ||
      element.querySelector('.note-created-ago') ||
      element.querySelector('.timeline-comment-header time')
    );
    const timestamp = timeElement?.getAttribute('datetime') || timeElement?.textContent || new Date().toISOString();

    return {
      commentText,
      author,
      avatar,
      timestamp
    };
  }
}
