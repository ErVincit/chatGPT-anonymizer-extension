// This script is injected into the page context
(function() {
  'use strict';

  const originalFetch = window.fetch;

  function extractUrl(input) {
    if (typeof input === 'string') return input;
    if (input instanceof Request) return input.url;
    if (input instanceof URL) return input.toString();
    return '';
  }

  window.fetch = async function(...args) {
    let [input, options] = args;
    const url = extractUrl(input);

    // Check if this is a ChatGPT conversation request
    if (url && (url.includes('/backend-api/conversation') || url.includes('/backend-api/f/conversation'))) {
      console.log('[Anonymizer Injected] ?? Intercepted:', url);

      const bodySource = options?.body ?? (input instanceof Request ? await input.clone().text() : null);

      if (bodySource) {
        try {
          const bodyStr = typeof bodySource === 'string' ? bodySource : JSON.stringify(bodySource);
          console.log('[Anonymizer Injected] ?? Original body:', bodyStr);

          // Send to content script for anonymization
          const response = await new Promise((resolve) => {
            window.postMessage({
              type: 'ANONYMIZE_REQUEST',
              body: bodyStr
            }, '*');

            const listener = (event) => {
              if (event.data.type === 'ANONYMIZE_RESPONSE') {
                window.removeEventListener('message', listener);
                resolve(event.data.body);
              }
            };

            window.addEventListener('message', listener);
          });

          console.log('[Anonymizer Injected] ?? Anonymized body:', response);

          if (input instanceof Request) {
            const newInit = {
              ...options,
              body: response
            };
            input = new Request(input, newInit);
            options = undefined;
          } else {
            options = {
              ...options,
              body: response
            };
          }
        } catch (e) {
          console.error('[Anonymizer Injected] ? Error:', e);
        }
      }
    }

    return originalFetch.apply(this, [input, options]);
  };

  console.log('[Anonymizer Injected] ? Fetch override installed');
})();
