// Tests for background script
describe('Background Script', () => {
  let mockOnInstalled, mockOnMessage, mockOnClicked;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup Chrome API mocks
    mockOnInstalled = {
      addListener: jest.fn()
    };
    mockOnMessage = {
      addListener: jest.fn()
    };
    mockOnClicked = {
      addListener: jest.fn()
    };

    // Ensure chrome object exists and is properly mocked
    global.chrome = {
      ...global.chrome,
      runtime: {
        ...global.chrome?.runtime,
        onInstalled: mockOnInstalled,
        onMessage: mockOnMessage
      },
      action: {
        ...global.chrome?.action,
        onClicked: mockOnClicked,
        setBadgeText: jest.fn()
      }
    };
  });

  describe('Extension Installation', () => {
    it('should log installation message', async () => {
      // Import background script
      await import('../background.js');

      expect(mockOnInstalled.addListener).toHaveBeenCalled();

      // Get the listener function and call it
      const listener = mockOnInstalled.addListener.mock.calls[0][0];
      listener();

      // Should not throw any errors
    });
  });

  // FIXME
  //describe('Message Handling', () => {
  //  it('should handle bookmark_added message', async () => {
  //    // Import background script
  //    await import('../background.js');

  //    expect(mockOnMessage.addListener).toHaveBeenCalled();

  //    // Get the listener function
  //    const listener = mockOnMessage.addListener.mock.calls[0][0];

  //    // Mock sender with tab
  //    const mockSender = {
  //      tab: { id: 123 }
  //    };

  //    // Call listener with bookmark_added message
  //    listener({ action: 'bookmark_added' }, mockSender, jest.fn());

  //    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
  //      text: '✓',
  //      tabId: 123
  //    });
  //  });

  //  it('should clear badge after timeout', async () => {
  //    jest.useFakeTimers();

  //    // Import background script
  //    await import('../background.js');

  //    const listener = mockOnMessage.addListener.mock.calls[0][0];
  //    const mockSender = { tab: { id: 123 } };

  //    listener({ action: 'bookmark_added' }, mockSender, jest.fn());

  //    // Fast-forward time
  //    jest.advanceTimersByTime(2000);

  //    expect(chrome.action.setBadgeText).toHaveBeenCalledWith({
  //      text: '',
  //      tabId: 123
  //    });

  //    jest.useRealTimers();
  //  });
  //});

  //describe('Action Click Handling', () => {
  //  it('should handle action click', async () => {
  //    // Import background script
  //    await import('../background.js');

  //    expect(mockOnClicked.addListener).toHaveBeenCalled();

  //    // Get the listener and call it
  //    const listener = mockOnClicked.addListener.mock.calls[0][0];
  //    const mockTab = { id: 123, url: 'https://github.com/user/repo' };

  //    // Should not throw any errors
  //    expect(() => listener(mockTab)).not.toThrow();
  //  });
  //});
});
