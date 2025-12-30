// This script is injected into the page context
(function() {
  'use strict';
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    let [url, options] = args;
    
    // Check if this is a ChatGPT conversation request
    if (url && typeof url === 'string' && 
        (url.includes('/backend-api/conversation') || url.includes('/backend-api/f/conversation'))) {
      
      console.log('[Anonymizer Injected] 🎯 Intercepted:', url);
      
      if (options && options.body) {
        try {
          const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
          console.log('[Anonymizer Injected] 📤 Original body:', bodyStr);
          
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
          
          console.log('[Anonymizer Injected] 🔒 Anonymized body:', response);
          
          options = {
            ...options,
            body: response
          };
        } catch (e) {
          console.error('[Anonymizer Injected] ❌ Error:', e);
        }
      }
    }
    
    return originalFetch.apply(this, [url, options]);
  };
  
  console.log('[Anonymizer Injected] ✅ Fetch override installed');
})();