// Tests for URLParser utility
import { URLParser } from '../../src/utils/parser.js';

describe('URLParser', () => {
  describe('parseGitLabURL', () => {
    it('should parse GitLab merge request URL', () => {
      const url = 'https://gitlab.com/group/project/-/merge_requests/123#note_456';
      const result = URLParser.parseGitLabURL(url);

      expect(result).toEqual({
        platform: 'gitlab',
        domain: 'gitlab.com',
        repository: 'group/project',
        type: 'merge_requests',
        id: 123,
        noteId: 456,
        permalink: url
      });
    });

    it('should parse GitLab issue URL', () => {
      const url = 'https://gitlab.example.com/user/repo/-/issues/789';
      const result = URLParser.parseGitLabURL(url);

      expect(result).toEqual({
        platform: 'gitlab',
        domain: 'gitlab.example.com',
        repository: 'user/repo',
        type: 'issues',
        id: 789,
        noteId: null,
        permalink: url
      });
    });

    it('should return null for invalid GitLab URL', () => {
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
        commentId: null,
        permalink: url
      });
    });

    it('should return null for invalid GitHub URL', () => {
      const url = 'https://example.com/not/a/github/url';
      const result = URLParser.parseGitHubURL(url);

      expect(result).toBeNull();
    });
  });

  describe('parseURL', () => {
    it('should parse GitLab URL', () => {
      const url = 'https://gitlab.com/group/project/-/merge_requests/123';
      const result = URLParser.parseURL(url);

      expect(result.platform).toBe('gitlab');
    });

    it('should parse GitHub URL', () => {
      const url = 'https://github.com/user/repo/issues/123';
      const result = URLParser.parseURL(url);

      expect(result.platform).toBe('github');
    });

    it('should return null for unsupported URL', () => {
      const url = 'https://example.com/some/path';
      const result = URLParser.parseURL(url);

      expect(result).toBeNull();
    });
  });

  describe('generateTitle', () => {
    it('should generate title from comment text', () => {
      const commentText = 'This is a long comment that should be truncated after 40 characters';
      const result = URLParser.generateTitle(commentText, 'Fallback title');

      expect(result).toBe('This is a long comment that should be tr...');
    });

    it('should use full comment text if under 40 characters', () => {
      const commentText = 'Short comment';
      const result = URLParser.generateTitle(commentText, 'Fallback title');

      expect(result).toBe('Short comment');
    });

    it('should use context title when comment text is empty', () => {
      const result = URLParser.generateTitle('', 'Context title');

      expect(result).toBe('Context title');
    });

    it('should use default title when both are empty', () => {
      const result = URLParser.generateTitle('', '');

      expect(result).toBe('Untitled Bookmark');
    });
  });

  describe('extractCommentData', () => {
    let mockElement;

    beforeEach(() => {
      mockElement = {
        querySelector: jest.fn(),
        textContent: 'Mock element'
      };
    });

    it('should extract comment data from element', () => {
      const mockCommentElement = { textContent: 'Test comment text' };
      const mockAuthorElement = { textContent: 'testuser' };
      const mockAvatarElement = { src: 'https://example.com/avatar.jpg' };
      const mockTimeElement = {
        getAttribute: jest.fn().mockReturnValue('2023-01-01T12:00:00Z'),
        textContent: '2023-01-01'
      };

      mockElement.querySelector
        .mockReturnValueOnce(mockCommentElement) // .md
        .mockReturnValueOnce(mockAuthorElement) // [data-username]
        .mockReturnValueOnce(mockAvatarElement) // .avatar
        .mockReturnValueOnce(mockTimeElement); // time

      const result = URLParser.extractCommentData(mockElement);

      expect(result).toEqual({
        commentText: 'Test comment text',
        author: 'testuser',
        avatar: 'https://example.com/avatar.jpg',
        timestamp: '2023-01-01T12:00:00Z'
      });
    });

    it('should handle missing elements gracefully', () => {
      mockElement.querySelector.mockReturnValue(null);

      const result = URLParser.extractCommentData(mockElement);

      expect(result.commentText).toBe('');
      expect(result.author).toBe('Unknown');
      expect(result.avatar).toBe('');
      expect(typeof result.timestamp).toBe('string');
    });
  });
});
