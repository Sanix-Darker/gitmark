import { setupContextMenu } from './contextMenu';
import { setupMessageHandlers } from './messageHandler';

console.log('Background script initializing...');

// Initialize background script
chrome.runtime.onInstalled.addListener(() => {
  console.log('GitMark extension installed');
  setupContextMenu();
});

// Setup message handlers
setupMessageHandlers();

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Only send messages to tabs with content scripts
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { action: 'POPUP_OPENED' }).catch((error) => {
      console.warn('Could not establish connection:', error);
    });
  }
});

// Keep service worker alive
chrome.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  port.onDisconnect.addListener(() => {
    console.log('Port disconnected:', port.name);
  });
});
