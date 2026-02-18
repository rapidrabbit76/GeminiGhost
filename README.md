# GeminiGhost

<p align="center">
  <img src="icons/origin.png" width="160" alt="GeminiGhost logo" />
</p>

<p align="center">
  <strong>Keyboard shortcut for Gemini temporary chat — the feature Google forgot to add.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome-Extension-4285f4?logo=googlechrome&logoColor=white" alt="Chrome Extension" />
  <img src="https://img.shields.io/badge/Manifest-V3-34a853" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/i18n-EN%20%7C%20KO%20%7C%20JA-lightgrey" alt="i18n" />
</p>

---

## The Problem

Gemini has a temporary chat mode — conversations that leave no history, no trace. Useful. But activating it requires navigating the UI manually every single time. There's no keyboard shortcut.

GeminiGhost fixes that with a single keystroke.

---

## What It Does

Press **`Ctrl+Shift+O`** anywhere in Chrome:

- **Gemini tab already open** → focuses it and activates temporary chat
- **No Gemini tab** → opens one and activates temporary chat
- **Temporary chat already active** → does nothing (no accidental toggle-off)

The temp chat button also gets an upgraded tooltip showing the keyboard shortcut on hover.

---

## Install

No Chrome Web Store listing yet. Load it manually:

1. Clone or download this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode** (top right toggle)
4. Click **Load unpacked**
5. Select the project folder

To update after pulling changes: click the ↺ reload button on the extension card.

---

## Usage

| Action | How |
|--------|-----|
| Open temporary chat | `Ctrl+Shift+O` |
| Open temporary chat | Click the toolbar icon → **Start Temporary Chat** |
| Customize shortcut | `chrome://extensions/shortcuts` |
| Open settings | Click the toolbar icon → **Shortcut Settings** |

---

## Customizing the Shortcut

Chrome lets you override any extension shortcut:

1. Go to `chrome://extensions/shortcuts`
2. Find **GeminiGhost**
3. Click the input field next to "Open Gemini Temporary Chat"
4. Press your preferred key combination

---

## How It Works

```
Ctrl+Shift+O
  └─ background.js (service worker)
       ├─ Finds existing Gemini tab → focuses it
       │    └─ Sends message to content.js → clicks temp chat button
       │         [fallback] → chrome.scripting.executeScript
       └─ No Gemini tab → opens gemini.google.com
            └─ Waits for page load (~1500ms for Angular bootstrap)
                 └─ Activates temporary chat
```

The temp chat button is detected by `[data-test-id="temp-chat-button"]` with multiple fallback selectors. Active state is determined by the presence of the `temp-chat-on` CSS class. A `MutationObserver` watches for Angular re-renders and re-attaches listeners as needed.

---

## Project Structure

```
GeminiKeyOpen/
├── manifest.json           # Extension entry point (MV3)
├── background.js           # Service worker — shortcut listener, tab management
├── content.js              # Injected into gemini.google.com — DOM manipulation, tooltip
├── popup.html / popup.js   # Toolbar icon popup
├── options.html / options.js  # Settings page
├── _locales/
│   ├── en/messages.json    # English (default)
│   ├── ko/messages.json    # Korean
│   └── ja/messages.json    # Japanese
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

---

## Localization

GeminiGhost supports English, Korean, and Japanese. Chrome automatically applies the locale that matches the browser's language setting. To add a new language, create `_locales/{lang}/messages.json` following the same key structure as `en/messages.json`.

---

## Contributing

No build step, no dependencies. Edit a file, reload the extension, test.

**Code conventions:**
- Plain ES2020+ JavaScript — no transpilation
- 2-space indentation, double quotes, trailing commas
- No comments unless the code genuinely cannot explain itself
- All user-visible strings go in `_locales/` — never hardcode them
- Always guard temp chat button clicks with a `temp-chat-on` class check

See `AGENTS.md` for the full development guide.
