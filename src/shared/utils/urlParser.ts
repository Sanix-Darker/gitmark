import { URLData } from '../types/bookmark';

export class URLParser {
  static parseURL(url: string): URLData | null {
    return this.parseGitLabURL(url) ||
           this.parseGitHubURL(url) ||
           this.parseGiteaURL(url) ||
           this.parseBitbucketURL(url) ||
           this.parseSourcehutURL(url) ||
           this.parseAzureDevOpsURL(url);
  }

  static parseGitLabURL(url: string): URLData | null {
    const gitlabRegex = /https?:\/\/(.*?)\/([^/]+\/[^/]+)\/-?\/(merge_requests|issues|epics)\/(\d+)(?:#note_(\d+))?/;
    const match = url.match(gitlabRegex);

    if (!match) return null;

    const [, domain, repository, type, id, noteId] = match;

    return {
      platform: 'gitlab',
      domain,
      repository,
      type,
      id: parseInt(id),
      noteId: noteId ? parseInt(noteId) : undefined,
      permalink: url
    };
  }

  static parseGitHubURL(url: string): URLData | null {
    const githubRegex = /https?:\/\/(.*?)\/([^/]+\/[^/]+)\/(issues|pull|discussions)\/(\d+)(?:#issuecomment-(\d+))?/;
    const match = url.match(githubRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'github',
      domain,
      repository,
      type: type === 'pull' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : undefined,
      permalink: url
    };
  }

  static parseGiteaURL(url: string): URLData | null {
    const giteaRegex = /https?:\/\/(.*?)\/([^/]+\/[^/]+)\/(issues|pulls)\/(\d+)(?:#issuecomment-(\d+))?/;
    const match = url.match(giteaRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'gitea',
      domain,
      repository,
      type: type === 'pulls' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : undefined,
      permalink: url
    };
  }

  static parseBitbucketURL(url: string): URLData | null {
    const bitbucketRegex = /https?:\/\/(.*?)\/([^/]+\/[^/]+)\/(issues|pull-requests)\/(\d+)(?:#comment-(\d+))?/;
    const match = url.match(bitbucketRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'bitbucket',
      domain,
      repository,
      type: type === 'pull-requests' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : undefined,
      permalink: url
    };
  }

  static parseSourcehutURL(url: string): URLData | null {
    const sourcehutRegex = /https?:\/\/(.*?)\/([^/]+\/[^/]+)\/(issues|patches)\/(\d+)(?:#comment-(\d+))?/;
    const match = url.match(sourcehutRegex);

    if (!match) return null;

    const [, domain, repository, type, id, commentId] = match;

    return {
      platform: 'sourcehut',
      domain,
      repository,
      type: type === 'patches' ? 'merge_requests' : 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : undefined,
      permalink: url
    };
  }

  static parseAzureDevOpsURL(url: string): URLData | null {
    const azureRegex = /https?:\/\/(.*?)\/([^/]+\/[^/]+)\/_workitems\/edit\/(\d+)(?:#comment-(\d+))?/;
    const match = url.match(azureRegex);

    if (!match) return null;

    const [, domain, repository, id, commentId] = match;

    return {
      platform: 'azure',
      domain,
      repository,
      type: 'issues',
      id: parseInt(id),
      commentId: commentId ? parseInt(commentId) : undefined,
      permalink: url
    };
  }

  static generateTitle(commentText: string, contextTitle: string): string {
    const commentPreview = commentText?.substring(0, 40).trim();
    if (commentPreview) {
      return commentPreview + (commentText.length > 40 ? '...' : '');
    }
    return contextTitle || 'Untitled Bookmark';
  }

  static generateUniquePermalink(url: string, commentElement: any): string {
    // Try to find a unique comment identifier
    const commentId = commentElement.id ||
                     commentElement.querySelector('[id]')?.id ||
                     commentElement.getAttribute('data-note-id') ||
                     commentElement.getAttribute('data-comment-id');

    if (commentId && !url.includes('#')) {
      return `${url}#${commentId}`;
    }

    // If URL already has a hash or no ID found, add timestamp
    const separator = url.includes('#') ? '&' : '#';
    return `${url}${separator}t=${Date.now()}`;
  }

  static extractCommentData(element: any): {
    commentText: string;
    author: string;
    avatar: string;
    timestamp: string;
  } {
    const selectors = {
      commentText: ['.md', '.comment-body', '.note-text', '.markdown-body', 'p'],
      author: ['[data-username]', '.author', '[data-testid="avatar-link"]', 'a[href*="/users/"]'],
      avatar: ['.avatar', 'img[alt*="avatar"]', '[data-testid="github-avatar"]'],
      timestamp: ['time', '[datetime]', '.created-at', 'relative-time']
    };

    let commentText = '';
    let author = 'Unknown';
    let avatar = '';
    let timestamp = new Date().toISOString();

    // Extract comment text
    for (const selector of selectors.commentText) {
      const textElement = element.querySelector(selector);
      if (textElement?.textContent?.trim()) {
        commentText = textElement.textContent.trim();
        break;
      }
    }

    // Extract author
    for (const selector of selectors.author) {
      const authorElement = element.querySelector(selector);
      if (authorElement?.textContent?.trim()) {
        author = authorElement.textContent.trim();
        break;
      }
    }

    // Extract avatar
    for (const selector of selectors.avatar) {
      const avatarElement = element.querySelector(selector) as HTMLImageElement;
      if (avatarElement?.src) {
        avatar = avatarElement.src;
        break;
      }
    }

    // Extract timestamp
    for (const selector of selectors.timestamp) {
      const timeElement = element.querySelector(selector);
      if (timeElement) {
        timestamp = timeElement.getAttribute('datetime') ||
                   timeElement.textContent ||
                   new Date().toISOString();
        break;
      }
    }

    return { commentText, author, avatar, timestamp };
  }
}
