let matchedLinks = [];

document.getElementById('findLinks').addEventListener('click', async () => {
  const pattern = document.getElementById('urlPattern').value;
  
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: findMatchingLinks,
    args: [pattern]
  });
  
  matchedLinks = results[0].result;
  document.getElementById('matchCount').textContent = `Found ${matchedLinks.length} matching links`;
  document.getElementById('searchContainer').style.display = 'block';
});

document.getElementById('search').addEventListener('click', async () => {
  const searchTerm = document.getElementById('searchTerm').value.toLowerCase();
  const timeout = parseInt(document.getElementById('timeout').value) || 3000;
  const batchSize = parseInt(document.getElementById('batchSize').value) || 3;
  const resultsDiv = document.getElementById('results');
  resultsDiv.innerHTML = 'Searching through pages...';
  
  const matches = [];
  
  for (let i = 0; i < matchedLinks.length; i += batchSize) {
    const batch = matchedLinks.slice(i, i + batchSize);
    const batchPromises = batch.map(async (link) => {
      try {
        const tab = await chrome.tabs.create({ 
          url: link.href, 
          active: false 
        });

        await new Promise(resolve => setTimeout(resolve, timeout));
        
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () => document.body.textContent
        });
        
        const pageContent = result.result.toLowerCase();
        await chrome.tabs.remove(tab.id);
        
        function parseSearchQuery(query) {
          const terms = query.toLowerCase().split(' ');
          const parsedQuery = [];
          let currentGroup = [];
        
          terms.forEach((term) => {
            if (term === 'and' || term === 'or') {
              if (currentGroup.length > 0) {
                parsedQuery.push({ type: 'terms', terms: currentGroup });
                currentGroup = [];
              }
              parsedQuery.push({ type: 'operator', value: term });
            } else {
              currentGroup.push(term);
            }
          });
        
          if (currentGroup.length > 0) {
            parsedQuery.push({ type: 'terms', terms: currentGroup });
          }
        
          return parsedQuery;
        }
        
        function evaluateSearchQuery(content, query) {
          const parsedQuery = parseSearchQuery(query);
          let result = false;
          let currentOperator = 'or';
        
          parsedQuery.forEach(item => {
            if (item.type === 'operator') {
              currentOperator = item.value;
            } else {
              const termsMatch = item.terms.every(term => 
                content.includes(term)
              );
        
              if (currentOperator === 'and') {
                result = result && termsMatch;
              } else {
                result = result || termsMatch;
              }
            }
          });
        
          return result;
        }
        
        if (evaluateSearchQuery(pageContent, searchTerm) || 
            evaluateSearchQuery(link.text.toLowerCase(), searchTerm) || 
            evaluateSearchQuery(link.href.toLowerCase(), searchTerm)) {
          return {
            ...link
          };
        }
      } catch (error) {
        console.error(`Error processing ${link.href}:`, error);
      }
      return null;
    });

    const batchResults = await Promise.all(batchPromises);
    matches.push(...batchResults.filter(result => result !== null));
  }
  
  resultsDiv.innerHTML = '';
  
  if (matches.length === 0) {
    resultsDiv.innerHTML = 'No matches found in page contents';
    return;
  }
  
  const openAllButton = document.createElement('button');
  openAllButton.textContent = `Open All Matches (${matches.length})`;
  openAllButton.addEventListener('click', () => {
    matches.forEach(match => {
      chrome.tabs.create({ url: match.href });
    });
  });
  resultsDiv.appendChild(openAllButton);
  
  matches.forEach(match => {
    const div = document.createElement('div');
    div.className = 'match-result';
    div.innerHTML = `<a href="${match.href}" target="_blank">${match.text}</a>`;
    resultsDiv.appendChild(div);
  });
});

function findMatchingLinks(pattern) {
  const links = Array.from(document.getElementsByTagName('a'));
  const wildcardToRegex = pattern => {
    return new RegExp('^' + pattern.split('*').map(s => escapeRegex(s)).join('.*') + '$');
  };
  
  const escapeRegex = string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };
  
  const regex = wildcardToRegex(pattern);
  
  const uniqueLinks = new Map();
  
  links
    .filter(link => regex.test(link.href))
    .forEach(link => {
      if (!uniqueLinks.has(link.href)) {
        uniqueLinks.set(link.href, {
          href: link.href,
          text: link.textContent.trim()
        });
      }
    });
  
  return Array.from(uniqueLinks.values());
}