export interface PlatformConfig {
  name: string;
  domains: string[];
  commentSelectors: string[];
  headerSelectors: string[];
  actionsSelectors: string[];
  dataSelectors: {
    commentText: string[];
    author: string[];
    avatar: string[];
    timestamp: string[];
  };
}

export interface PlatformConfigs {
  [key: string]: PlatformConfig;
}
