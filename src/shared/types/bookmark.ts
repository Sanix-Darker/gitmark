export interface Bookmark {
  id: string;
  title: string;
  permalink: string;
  repository: string;
  platform: Platform | any;
  type: 'merge_requests' | 'issues' | 'epics' | 'snippets';
  contextId: number  | any;
  commentText: string;
  author: string;
  avatar: string;
  timestamp: string;
}

export interface BookmarkStorage {
  [repository: string]: Bookmark[];
}

export type Platform = 'gitlab' | 'github' | 'gitea' | 'bitbucket' | 'sourcehut' | 'azure' | 'codegiant' | 'gitkraken';

export interface URLData {
  platform: Platform;
  domain: string;
  repository: string;
  type: string;
  id: number;
  noteId?: number;
  commentId?: number;
  permalink: string;
}
