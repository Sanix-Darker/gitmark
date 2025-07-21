# PLATFORM SELECTOR MAINTENANCE GUIDE

This guide explains how to maintain and update platform-specific selectors for the GitBookmark extension.

## FILE STRUCTURE

```
config/platform-selectors.json    # Main configuration file (JSON)
content.js                        # Uses the configurations
PLATFORM_MAINTENANCE.md          # This guide
```

## CONFIGURATION STRUCTURE

Each platform has the following structure:

```javascript
platformname: {
  name: 'Platform Name',
  domains: ['domain.com', 'subdomain.'],
  commentSelectors: [...],      // Selectors for comment containers
  headerSelectors: [...],       // Selectors for comment headers
  actionsSelectors: [...],      // Selectors for action areas
  dataSelectors: {              // Selectors for extracting data
    commentText: [...],
    author: [...],
    avatar: [...],
    timestamp: [...]
  }
}
```

## HOW TO UPDATE SELECTORS

### 1. FOR GITHUB UPDATES

When GitHub changes their DOM structure:

```javascript
// In config/platform-selectors.json
{
  "github": {
    "commentSelectors": [
      ".new-github-selector",     // Add new selectors at the top
      ".react-issue-comment",     // Keep existing selectors as fallback
      // ... rest of selectors
    ]
  }
}
```

### 2. FOR NEW PLATFORMS

To add a new platform:

```javascript
// Add to PLATFORM_CONFIGS in src/config/platform-selectors.js
newplatform: {
  name: 'New Platform',
  domains: ['newplatform.com', 'new.'],
  commentSelectors: [
    '.comment-container',
    '.comment-wrapper'
  ],
  headerSelectors: [
    '.comment-header',
    '.comment-meta'
  ],
  actionsSelectors: [
    '.comment-actions',
    '.action-buttons'
  ],
  dataSelectors: {
    commentText: ['.comment-body', '.text'],
    author: ['.author', '.username'],
    avatar: ['.avatar', 'img[alt*="avatar"]'],
    timestamp: ['time', '[datetime]']
  }
}
```

### 3. FOR EXISTING PLATFORM UPDATES

To update existing platform selectors:

```javascript
// Find the platform in config/platform-selectors.json
{
  "gitlab": {
    "commentSelectors": [
      ".new-selector",           // Add new selectors
      ".note-wrapper:not(.system-note)", // Keep existing
      // ... rest
    ]
  }
}
```

## TESTING SELECTORS

### 1. BROWSER CONSOLE TESTING

```javascript
// Test if selectors work on current page
document.querySelectorAll('.your-selector').length

// Test specific platform selectors
import { debugPlatformSelectors } from './src/config/platform-selectors.js';
debugPlatformSelectors('github');
```

### 2. EXTENSION CONSOLE

```javascript
// In content script console
console.log('Found comments:', document.querySelectorAll('.react-issue-comment').length);

// Debug platform selectors (now async)
await debugPlatformSelectors('github');
```

## BEST PRACTICES

### 1. SELECTOR PRIORITY

- **Most specific first**: Put the most specific/newest selectors at the top
- **Fallback selectors**: Keep older selectors as fallbacks
- **Generic last**: Put generic selectors at the end

### 2. SELECTOR NAMING

- Use exact class names from the platform
- Include data attributes when available
- Avoid overly generic selectors

### 3. TESTING

- Test on multiple pages (issues, PRs, reviews)
- Test on different repositories
- Test with different comment types

## COMMON ISSUES

### 1. SELECTORS NOT WORKING

- Check if the platform updated their DOM structure
- Verify selector specificity
- Test in browser console first

### 2. BUTTONS NOT APPEARING

- Check if comment containers are detected
- Verify header selectors are working
- Check CSS conflicts

### 3. DATA EXTRACTION FAILING

- Update dataSelectors for the platform
- Test each selector individually
- Add fallback selectors

## Platform-Specific Notes

### GITHUB

- Frequently updates DOM structure
- Uses CSS modules with generated class names
- Has different structures for issues vs reviews
- Uses data-testid attributes (preferred)

### GITLAB

- More stable DOM structure
- Uses semantic class names
- Different selectors for different comment types

### OTHERS

- Less frequent updates
- Usually simpler DOM structures
- May need custom handling

## DEBUGGING COMMANDS

```javascript
// Debug all selectors for a platform
debugPlatformSelectors('github');

// Get all selectors for a platform
getAllSelectorsForPlatform('github');

// Get platform config
getPlatformConfig('github');

// Detect current platform
getPlatformByDomain(window.location.hostname);
```

## UPDATE CHECKLIST

When updating selectors:

- [ ] Test on the actual platform
- [ ] Verify all comment types work (issues, PRs, reviews)
- [ ] Check data extraction works
- [ ] Test button injection
- [ ] Verify no conflicts with existing selectors
- [ ] Update this documentation if needed
- [ ] Test on multiple repositories

## EMERGENCY FIXES

For urgent fixes when a platform breaks:

1. **Quick Fix**: Add new selectors to the top of existing arrays
2. **Test**: Verify on the broken platform
3. **Deploy**: Update the extension
4. **Document**: Update this guide with the changes

## CONTACT

For questions about selector maintenance, check the project repository or create an issue.
