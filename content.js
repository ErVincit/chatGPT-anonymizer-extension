// Content script that bridges page and extension
console.log('[Content] Script loaded');

// Inject the script into page context
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = function() {
  this.remove();
  console.log('[Content] Injected script loaded');
};
(document.head || document.documentElement).appendChild(script);

// Listen for messages from injected script
window.addEventListener('message', async (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === 'ANONYMIZE_REQUEST') {
    console.log('[Content] 📨 Received anonymization request');
    
    try {
      const bodyObj = JSON.parse(event.data.body);
      
      // Send to background script for anonymization
      chrome.runtime.sendMessage({
        action: 'anonymizeBody',
        body: bodyObj
      }, (response) => {
        if (chrome.runtime.lastError) {
          console.error('[Content] ❌ Error:', chrome.runtime.lastError);
          window.postMessage({
            type: 'ANONYMIZE_RESPONSE',
            body: event.data.body
          }, '*');
          return;
        }
        
        console.log('[Content] ✅ Anonymized, mapping:', response.mapping);
        
        window.postMessage({
          type: 'ANONYMIZE_RESPONSE',
          body: JSON.stringify(response.body)
        }, '*');
      });
    } catch (e) {
      console.error('[Content] ❌ Parse error:', e);
      window.postMessage({
        type: 'ANONYMIZE_RESPONSE',
        body: event.data.body
      }, '*');
    }
  }
});

console.log('[Content] Message listener installed');