// Load saved words
chrome.storage.sync.get(['sensitiveWords'], (result) => {
  if (result.sensitiveWords) {
    document.getElementById('words').value = result.sensitiveWords.join('\n');
  }
});

// Load last mapping
function loadMapping() {
  chrome.storage.local.get(['lastMapping'], (result) => {
    if (result.lastMapping && Object.keys(result.lastMapping).length > 0) {
      const mappingDiv = document.getElementById('mapping');
      const mappingContent = document.getElementById('mappingContent');
      
      mappingContent.innerHTML = Object.entries(result.lastMapping)
        .map(([word, placeholder]) => 
          `<div class="mapping-item">"${word}" → ${placeholder}</div>`
        )
        .join('');
      
      mappingDiv.style.display = 'block';
    }
  });
}

loadMapping();

// Refresh mapping every 2 seconds
setInterval(loadMapping, 2000);

// Save words
document.getElementById('save').addEventListener('click', () => {
  const words = document.getElementById('words').value
    .split('\n')
    .map(w => w.trim())
    .filter(w => w.length > 0);
  
  chrome.storage.sync.set({ sensitiveWords: words }, () => {
    const status = document.getElementById('status');
    status.textContent = `✓ Saved ${words.length} word(s)! Refresh ChatGPT tab.`;
    status.className = 'status success';
    
    setTimeout(() => {
      status.style.display = 'none';
    }, 4000);
  });
});

// Test anonymization
document.getElementById('testBtn').addEventListener('click', () => {
  const input = document.getElementById('testInput').value;
  const words = document.getElementById('words').value
    .split('\n')
    .map(w => w.trim())
    .filter(w => w.length > 0);
  
  if (!input) {
    document.getElementById('testOutput').textContent = 'Enter some text to test...';
    return;
  }
  
  let result = input;
  const mapping = {};
  
  words.forEach((word, index) => {
    if (word.trim()) {
      const letter = String.fromCharCode(65 + (index % 26));
      const repeat = Math.floor(index / 26) + 1;
      const placeholder = 'XXX' + letter.repeat(repeat);
      const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedWord, 'gi');
      
      if (result.match(regex)) {
        mapping[word] = placeholder;
        result = result.replace(regex, placeholder);
      }
    }
  });
  
  let output = result;
  if (Object.keys(mapping).length > 0) {
    output += '\n\nMappings:\n' + Object.entries(mapping)
      .map(([w, p]) => `"${w}" → ${p}`)
      .join('\n');
  }
  
  document.getElementById('testOutput').textContent = output || '(no changes)';
});