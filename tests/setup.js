// tests/setup.js
import '@testing-library/jest-dom';
import 'jest-webextension-mock'; // Use this instead of jest-chrome

// The chrome mock is already provided by jest-webextension-mock
// No need to manually mock chrome APIs

// Mock fetch
global.fetch = jest.fn();

// Additional setup if needed
beforeEach(() => {
  jest.clearAllMocks();

  // Reset chrome storage mocks
  chrome.storage.local.get.mockImplementation((keys, callback) => {
    if (callback) callback({});
    return Promise.resolve({});
  });

  chrome.storage.local.set.mockImplementation((items, callback) => {
    if (callback) callback();
    return Promise.resolve();
  });

  // Reset fetch mock
  global.fetch.mockResolvedValue({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    ok: true
  });
});

// Mock window.location if needed
delete window.location;
window.location = {
  href: 'https://github.com/user/repo/issues/123',
  hostname: 'github.com',
  pathname: '/user/repo/issues/123',
  search: '',
  hash: ''
};
