import { PlatformConfig, PlatformConfigs } from '../../shared/types/platform';

export class PlatformDetector {
  private platformConfigs: PlatformConfigs | null = null;
  private currentPlatform: { key: string; config: PlatformConfig } | null = null;

  async loadConfigs(): Promise<PlatformConfigs | null> {
    console.log("LOADING CONFIGS...");
    if (this.platformConfigs) return this.platformConfigs;

    try {
      const response = await fetch(chrome.runtime.getURL('config/platform-selectors.json'));
      this.platformConfigs = await response.json();
      console.log('Successfuly load platform configurations.', this.platformConfigs);
      return this.platformConfigs;
    } catch (error) {
      console.error('Failed to load platform configurations:', error);
      this.platformConfigs = {};
      return this.platformConfigs;
    }
  }

  async detectPlatform(): Promise<{ key: string; config: PlatformConfig; name: string } | null> {
    const configs = await this.loadConfigs();
    const hostname = window.location.hostname.toLowerCase();

    if (!configs) {
        return null;
    }

    for (const [key, config] of Object.entries(configs)) {
      if (config.domains.some(domain => hostname.includes(domain))) {
        this.currentPlatform = { key, config };
        return { key, config, name: config.name };
      }
    }

    return null;
  }

  async getCurrentPlatform(): Promise<{ key: string; config: PlatformConfig } | null> {
    if (this.currentPlatform) return this.currentPlatform;

    const platform = await this.detectPlatform();
    return platform ? { key: platform.key, config: platform.config } : null;
  }

  async getPlatformConfig(platformName: string): Promise<PlatformConfig | null> {
    const configs = await this.loadConfigs();
    if (configs) {
        return configs[platformName.toLowerCase()] || null;
    }
    return null;
  }

  isCommentElement(element: HTMLElement): boolean | undefined {
    const commonCommentClasses = [
      'note-wrapper', 'timeline-comment', 'react-issue-comment',
      'comment-container', 'js-comment', 'review-comment'
    ];

    const className = element.className || '';
    const hasCommentClass = commonCommentClasses.some(cls =>
      className.includes(cls)
    );

    const hasCommentId = element.id && element.id.includes('comment');
    const hasCommentTestId = element.hasAttribute('data-testid') &&
      element.getAttribute('data-testid')?.includes('comment');

    return hasCommentClass || hasCommentId || hasCommentTestId;
  }

  async getSelectorsForCurrentPlatform(): Promise<{
    commentSelectors: string[];
    headerSelectors: string[];
    actionsSelectors: string[];
    dataSelectors: {
      commentText: string[];
      author: string[];
      avatar: string[];
      timestamp: string[];
    };
  } | null> {
    const platform = await this.getCurrentPlatform();
    if (!platform) return null;

    return {
      commentSelectors: platform.config.commentSelectors,
      headerSelectors: platform.config.headerSelectors,
      actionsSelectors: platform.config.actionsSelectors,
      dataSelectors: platform.config.dataSelectors
    };
  }
}
