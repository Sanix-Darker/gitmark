// Jest setup file
// import 'jest-webextension-mock';

// Mock Chrome APIs
global.chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      remove: jest.fn(),
      clear: jest.fn()
    }
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    openOptionsPage: jest.fn(),
    getURL: jest.fn((path) => `chrome-extension://test/${path}`)
  },
  tabs: {
    create: jest.fn(),
    query: jest.fn()
  },
  action: {
    setBadgeText: jest.fn(),
    onClicked: {
      addListener: jest.fn()
    }
  }
};

// Mock DOM methods
global.MutationObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  disconnect: jest.fn(),
  takeRecords: jest.fn()
}));

// Mock fetch for platform configs
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();

  // Reset chrome storage mock
  chrome.storage.local.get.mockResolvedValue({});
  chrome.storage.local.set.mockResolvedValue();

  // Reset fetch mock
  fetch.mockResolvedValue({
    json: () => Promise.resolve({})
  });
});
