# ChatGPT Anonymizer

A lightweight Chrome/Edge extension that anonymizes sensitive words in ChatGPT requests. It intercepts fetch calls to ChatGPT, swaps configured terms with placeholders like `XXXA`, and keeps a mapping so you can see what was replaced.

## Features

- Add any number of sensitive words/phrases (case-insensitive) via the popup UI.
- Automatic placeholder mapping (e.g., `XXXA`, `XXXB`) persisted per session for quick reference.
- Optional test area in the popup to preview anonymization before sending.
- Runs entirely in the browser: background service worker + content/injected scripts; no external services.

## Install (unpacked)

1. Download or clone the repo locally.
2. In Chrome/Edge open `chrome://extensions/`.
3. Enable **Developer mode**.
4. Click **Load unpacked** and select the project folder.

## Usage

1. Open the extension popup.
2. Enter one word/phrase per line under **Sensitive Words/Phrases**, then click **Save Words** (refresh your ChatGPT tab afterward).
3. Optional: use **Test Anonymization** in the popup to see how text will be rewritten and view the placeholder mapping.
4. In ChatGPT, send a message; the extension intercepts the conversation request and replaces any configured terms with placeholders. Open DevTools console to see `[Anonymizer]` logs and review the last mapping in the popup.

## How it works

- `injected.js` overrides `window.fetch` on ChatGPT pages, forwarding request bodies to the content script.
- `content.js` relays anonymization requests to the background service worker and returns anonymized payloads.
- `background.js` performs the text replacement and stores the last mapping (`chrome.storage.local`) plus your word list (`chrome.storage.sync`).
- `popup.html`/`popup.js` provide the UI for managing words, testing replacements, and viewing the latest mapping.

## Development & release

- Manifest v3, plain JS/HTML/CSS—no build step required for local use.
