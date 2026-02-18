# GeminiGhost — Agent Guide

Chrome Extension (Manifest V3) that opens a Gemini temporary chat session via keyboard shortcut (`Ctrl+Shift+O`).

---

## Project Structure

```
GeminiKeyOpen/
├── manifest.json          # Extension entry point (MV3)
├── background.js          # Service worker — shortcut listener, tab management
├── content.js             # Injected into gemini.google.com — DOM manipulation, tooltip
├── popup.html / popup.js  # Toolbar icon popup
├── options.html / options.js  # Settings page
├── _locales/
│   ├── en/messages.json   # Default (English)
│   ├── ko/messages.json   # Korean
│   └── ja/messages.json   # Japanese
└── icons/                 # icon16.png, icon48.png, icon128.png
```

---

## Build & Dev Commands

No build step. Plain JavaScript — edit and reload directly.

```bash
# Load extension
# Chrome → chrome://extensions → Developer mode ON → Load unpacked → select this folder

# After any file change
# Chrome → chrome://extensions → click ↺ reload button on the extension card

# After changing content.js only
# Hard-refresh the Gemini tab (Cmd+Shift+R) — no extension reload needed

# Change shortcut
# chrome://extensions/shortcuts
```

No linter, formatter, or test runner is configured. Keep it that way unless the project grows significantly.

---

## Architecture

### Message Flow

```
keyboard shortcut
  → background.js (chrome.commands)
    → chrome.tabs.sendMessage → content.js activateTempChat()
    [fallback] → chrome.scripting.executeScript → activateTempChatInPage()
```

### Key Selectors (Gemini DOM)

Primary: `[data-test-id="temp-chat-button"]`  
Fallbacks (in order):
- `[aria-label="임시 채팅"]`
- `[aria-label="Temporary chat"]`
- `.temp-chat-button`
- `button[mattooltip="임시 채팅"]`

Active state: button has class `temp-chat-on` when temporary chat is ON.  
Never click the button when `temp-chat-on` is present — it would deactivate.

### content.js responsibilities
- Find and click the temp chat button
- Attach custom tooltip (replaces Gemini's native `matTooltip`)
- Watch for button re-renders via `MutationObserver`
- Respond to messages: `activate-temp-chat`, `get-temp-chat-status`

### background.js responsibilities
- Listen for `chrome.commands` (`open-temp-chat`)
- Find existing Gemini tab or open a new one
- Delegate activation to content.js; fall back to `executeScript` if content script is not yet ready

---

## Code Style

### General
- Plain ES2020+ JavaScript — no transpilation, no bundler
- 2-space indentation
- Double quotes for strings
- Trailing commas in multi-line arrays/objects
- `const` by default, `let` only when reassignment is needed, never `var`
- Arrow functions for callbacks, named `function` declarations for top-level functions
- `async/await` over `.then()` chains — except in `onMessage` listeners where you need `return true` before the async call

### Naming
- `camelCase` for variables and functions
- `SCREAMING_SNAKE_CASE` for module-level constants (`GEMINI_URL`, `TEMP_CHAT_SELECTORS`)
- DOM element IDs use `kebab-case` with `gtc-` prefix for extension-injected elements (e.g. `gtc-tooltip`)
- Message action strings use `kebab-case` (e.g. `"activate-temp-chat"`)
- i18n message keys use `camelCase` (e.g. `"tooltipLabel"`, `"openTempChat"`)

### No Comments Policy
Code must be self-explanatory. Do not add comments unless:
- A regex or bitwise operation is used
- A non-obvious browser quirk is being worked around (include the reason)
- A timing hack like `setTimeout` is used (explain why the delay exists)

### Error Handling
- Wrap `chrome.tabs.sendMessage` in try/catch — content script may not be ready
- Always provide a fallback via `chrome.scripting.executeScript`
- Reject promises with `new Error("descriptive message")` — never reject with a string
- Do not swallow errors silently — propagate via `sendResponse({ success: false, error: err.message })`

### Chrome Extension Patterns
- Always `return true` in `onMessage` listeners that respond asynchronously
- Use `chrome.tabs.query({ url: "https://gemini.google.com/*" })` to find existing tabs
- Never use `chrome.tabs.executeScript` (MV2) — use `chrome.scripting.executeScript` (MV3)
- Functions passed to `executeScript` via `func:` must be self-contained — no closure variables

### i18n
- All user-visible strings go in `_locales/{en,ko,ja}/messages.json`
- HTML elements use `data-i18n="messageKey"` attribute; JS applies via `querySelectorAll("[data-i18n]")`
- Always add the key to all three locale files simultaneously
- Helper: `function t(key) { return chrome.i18n.getMessage(key) || key; }`
- `manifest.json` strings use `__MSG_keyName__` syntax

### DOM Manipulation (content.js)
- Always check `temp-chat-on` class before clicking the temp chat button
- Use `dataset.gtcTooltip = "1"` as a guard flag to prevent double-attaching listeners
- `MutationObserver` for watching Angular re-renders — always `disconnect()` when done in one-shot observers
- Injected elements get `id` or `dataset` prefix `gtc-` to avoid collisions with Gemini's own DOM

---

## Gemini-Specific Notes

- Gemini is an Angular app — DOM can be re-rendered at any time
- `mattooltip` attribute drives Angular Material tooltips; removing it disables the native tooltip
- `_ngcontent-*` attributes are unstable — never use them as selectors
- After opening a new tab, wait ~1500ms before trying to activate (Angular bootstrap time)
- `data-test-id` attributes are the most stable selectors available
