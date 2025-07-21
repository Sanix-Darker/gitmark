# GitBookmark - Universal Git Comment Bookmark Extension

![image](./screenshot.png)

A sophisticated web extension for bookmarking comments across multiple Git platforms with repository-centric organization.

## SUPPORTED PLATFORMS

- **GitLab** (gitlab.com and self-hosted instances)
- **GitHub** (github.com and GitHub Enterprise)
- **Gitea** (gitea.io, codeberg.org, and self-hosted)
- **Bitbucket** (bitbucket.org and Bitbucket Server)
- **SourceHut** (sr.ht and self-hosted)
- **Azure DevOps** (dev.azure.com and on-premises)
- **CodeGiant** (codegiant.io)
- **GitKraken** (gitkraken.com)


## FEATURES

### CORE BOOKMARKING

- **One-click bookmarking** across all supported Git platforms
- **Auto-title suggestion** from comment text or parent MR/issue title
- **Manual title override** with inline editing
- **Context preservation** (comment text, author, timestamp, permalink)

### REPOSITORY-CENTRIC ORGANIZATION

- **Auto-grouping** by `namespace/project` hierarchy
- **Sub-grouping** within repos (MRs, Issues, Epics, Snippets)
- **Expandable/collapsible** repository sections
- **Bookmark counters** per repository

### SEARCH & NAVIGATION

- **Instant search** across all bookmarks with highlighting
- **Repository filtering** and scoped search
- **Multiple sort options** (recent, alphabetical, frequency)
- **Visual repository dashboard**

## INSTALLATION

### DEVELOPMENT

1. Clone/download the extension files
2. Run `npm install` to install dependencies
3. Run `npm run build` to build the extension
4. Open Chrome/Edge and navigate to `chrome://extensions/`
5. Enable "Developer mode"
6. Click "Load unpacked" and select the `dist` folder

## USAGE

### BOOKMARKING COMMENTS

1. Navigate to a GitLab MR/Issue or GitHub PR/Issue
2. Find the comment you want to bookmark
3. Click the bookmark button (📑) that appears in the comment header
4. The comment will be automatically organized by repository

### ORGANIZATION

Bookmarks are automatically grouped by:
```
repository-name/
├── MR #123 (3 bookmarks)
├── Issue #456 (2 bookmarks)
└── Snippets (1 bookmark)
```

### EXPORT

Click "Export" in the footer to download all bookmarks as JSON.

## TECHNICAL DETAILS

### ARCHITECTURE

- **Framework**: Preact (lightweight React alternative)
- **Manifest**: V3 (latest Chrome extension standard)
- **Storage**: Chrome Storage API (local)
- **Content Scripts**: Inject bookmark buttons into GitLab/GitHub
- **Background**: Service worker for extension management

### FILE STRUCTURE

```
├── manifest.json           # Extension manifest
├── background.js           # Service worker
├── content.js             # Content script injection
├── popup.html/js          # Popup interface
├── options.html/js        # Full-screen interface
├── src/
│   ├── components/        # Preact components
│   └── utils/            # Storage & parsing utilities
└── styles.css            # Monochrome theme
```

### URL PARSING

Supports GitLab and GitHub URL patterns:
- GitLab: `https://gitlab.com/group/project/-/merge_requests/123#note_456`
- GitHub: `https://github.com/user/repo/issues/123#issuecomment-456`

### STORAGE SCHEMA

```json
{
  "namespace/repository": [
    {
      "id": "timestamp",
      "title": "Gean-Was-There title",
      "permalink": "Direct comment URL",
      "repository": "namespace/project",
      "platform": "gitlab|github|xyz",
      "type": "merge_requests|issues|epics",
      "contextId": 123,
      "commentText": "Full comment content",
      "author": "sanix-darker",
      "avatar": "avatar URL",
      "timestamp": "ISO date string"
    }
  ]
}
```

## BROWSER COMPATIBILITY

- **Chrome 88+** (Manifest V3 support)
- **Edge 88+** (Chromium-based)
- **Firefox 109+** (Manifest V2 version included)
- **Safari 14+** (Safari extension version included)

## CROSS-BROWSER BUILDING

```bash
npm run build:cross-browser  # Build for all browsers
npm run build:chrome        # Chrome/Edge specific build
npm run build:firefox       # Firefox specific build
npm run build:safari        # Safari specific build
```

### BROWSER-SPECIFIC FILES

- `manifest.json` - Chrome/Edge (Manifest V3)
- `manifest-v2.json` - Firefox (Manifest V2)
- `safari-manifest.json` - Safari (Manifest V2)
- `cross-browser-build.js` - Build script for all browsers

## REGARDING PRIVACY

- All data stored locally in browser
- No external servers or tracking
- No network requests except to GitLab/GitHub
- Open source and transparent

## DEVELOPMENT

```bash
npm install          # Install dependencies
npm run dev         # Development server
npm run build       # Production build
```

## AUTHOR

