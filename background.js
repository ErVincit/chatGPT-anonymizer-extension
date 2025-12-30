// Service worker to handle request interception
let sensitiveWords = [];

// Load sensitive words
chrome.storage.sync.get(['sensitiveWords'], (result) => {
  sensitiveWords = result.sensitiveWords || [];
  console.log('[Background] Loaded words:', sensitiveWords);
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.sensitiveWords) {
    sensitiveWords = changes.sensitiveWords.newValue || [];
    console.log('[Background] Updated words:', sensitiveWords);
  }
});

// Message handler from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'anonymizeBody') {
    const anonymized = anonymizeObject(request.body);
    sendResponse({ 
      body: anonymized,
      mapping: lastMapping
    });
  } else if (request.action === 'getWords') {
    sendResponse({ words: sensitiveWords });
  }
  return true;
});

let lastMapping = {};

function getPlaceholder(index) {
  const letter = String.fromCharCode(65 + (index % 26));
  const repeat = Math.floor(index / 26) + 1;
  return 'XXX' + letter.repeat(repeat);
}

function anonymizeText(text) {
  if (!text || typeof text !== 'string' || sensitiveWords.length === 0) {
    return text;
  }
  
  let result = text;
  
  sensitiveWords.forEach((word, index) => {
    if (word.trim()) {
      const placeholder = getPlaceholder(index);
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      
      if (result.match(regex)) {
        lastMapping[word] = placeholder;
        result = result.replace(regex, placeholder);
      }
    }
  });
  
  if (Object.keys(lastMapping).length > 0) {
    chrome.storage.local.set({ lastMapping });
    console.log('[Background] Anonymized:', lastMapping);
  }
  
  return result;
}

function anonymizeObject(obj) {
  if (typeof obj === 'string') {
    return anonymizeText(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => anonymizeObject(item));
  }
  
  if (obj && typeof obj === 'object') {
    const result = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        result[key] = anonymizeObject(obj[key]);
      }
    }
    return result;
  }
  
  return obj;
}

console.log('[Background] Service worker initialized');