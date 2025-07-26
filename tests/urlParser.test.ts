// tests/urlParser.test.ts
import { URLParser } from '../src/shared/utils/urlParser';

describe('URLParser', () => {
  describe('parseGitLabURL', () => {
    it('should parse GitLab merge request URL correctly', () => {
      const url = 'https://gitlab.com/user/project/-/merge_requests/123#note_456';
      const result = URLParser.parseGitLabURL(url);

      expect(result).toEqual({
        platform: 'gitlab',
        domain: 'gitlab.com',
        repository: 'user/project',
        type: 'merge_requests',
        id: 123,
        noteId: 456,
        permalink: url
      });
    });

    it('should parse GitLab issue URL without note', () => {
      const url = 'https://gitlab.com/user/project/-/issues/789';
      const result = URLParser.parseGitLabURL(url);

      expect(result).toEqual({
        platform: 'gitlab',
        domain: 'gitlab.com',
        repository: 'user/project',
        type: 'issues',
        id: 789,
        noteId: undefined,
        permalink: url
      });
    });

    it('should return null for non-GitLab URLs', () => {
      const url = 'https://github.com/user/repo/issues/123';
      const result = URLParser.parseGitLabURL(url);
      expect(result).toBeNull();
    });
  });

  describe('parseGitHubURL', () => {
    it('should parse GitHub issue URL with comment', () => {
      const url = 'https://github.com/user/repo/issues/123#issuecomment-456';
      const result = URLParser.parseGitHubURL(url);

      expect(result).toEqual({
        platform: 'github',
        domain: 'github.com',
        repository: 'user/repo',
        type: 'issues',
        id: 123,
        commentId: 456,
        permalink: url
      });
    });

    it('should parse GitHub pull request URL', () => {
      const url = 'https://github.com/user/repo/pull/789';
      const result = URLParser.parseGitHubURL(url);

      expect(result).toEqual({
        platform: 'github',
        domain: 'github.com',
        repository: 'user/repo',
        type: 'merge_requests',
        id: 789,
        commentId: undefined,
        permalink: url
      });
    });
  });

  describe('parseURL', () => {
    it('should detect and parse GitLab URLs', () => {
      const url = 'https://gitlab.com/user/project/-/issues/123';
      const result = URLParser.parseURL(url);
      expect(result?.platform).toBe('gitlab');
    });

    it('should detect and parse GitHub URLs', () => {
      const url = 'https://github.com/user/repo/issues/123';
      const result = URLParser.parseURL(url);
      expect(result?.platform).toBe('github');
    });

    it('should return null for unsupported URLs', () => {
      const url = 'https://example.com/something';
      const result = URLParser.parseURL(url);
      expect(result).toBeNull();
    });
  });

  describe('generateTitle', () => {
    it('should truncate long comment text', () => {
      const longText = 'This is a very long comment that should be truncated after 40 characters';
      const title = URLParser.generateTitle(longText, 'Fallback');
      expect(title).toBe('This is a very long comment that should...');
    });

    it('should use context title when comment is empty', () => {
      const title = URLParser.generateTitle('', 'Issue #123');
      expect(title).toBe('Issue #123');
    });

    it('should use default when both are empty', () => {
      const title = URLParser.generateTitle('', '');
      expect(title).toBe('Untitled Bookmark');
    });
  });

  describe('extractCommentData', () => {
    it('should extract comment data from DOM element', () => {
      const element = document.createElement('div');
      element.innerHTML = `
        <div class="comment-body">Test comment</div>
        <span class="author">John Doe</span>
        <img class="avatar" src="avatar.jpg" />
        <time datetime="2024-01-01T00:00:00Z">Jan 1</time>
      `;

      const result = URLParser.extractCommentData(element);

      expect(result).toEqual({
        commentText: 'Test comment',
        author: 'John Doe',
        avatar: 'http://localhost/avatar.jpg',
        timestamp: '2024-01-01T00:00:00Z'
      });
    });

    it('should provide defaults when elements are missing', () => {
      const element = document.createElement('div');
      const result = URLParser.extractCommentData(element);

      expect(result.author).toBe('Unknown');
      expect(result.commentText).toBe('');
      expect(result.avatar).toBe('');
      expect(result.timestamp).toBeTruthy();
    });
  });
});
