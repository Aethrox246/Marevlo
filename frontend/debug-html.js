const fs = require('fs');
const { JSDOM } = require('jsdom');
const html = fs.readFileSync('public/cources/clus/part 0.html', 'utf8');

const parser = new JSDOM().window.DOMParser;
const doc = new parser().parseFromString(html, 'text/html');
const LANG_TAGS = ['python'];
for (const lang of LANG_TAGS) {
  const allEls = Array.from(doc.querySelectorAll('p, div, h1, h2, h3, h4'));
  let openEl = null;
  for (let i = 0; i < allEls.length; i++) {
    const cleanText = allEls[i].textContent.replace(/[^a-z0-9<>\/]/gi, '').toLowerCase();
    if (!openEl && (cleanText === \<\>\ || cleanText === lang)) {
      openEl = allEls[i];
      continue;
    }
    if (openEl && (cleanText === \</\>\ || cleanText === \/\\ || cleanText === \<\>\ || cleanText === lang)) {
      const closeEl = allEls[i];
      const codeLines = [];
      let node = openEl.nextSibling;
      while (node && node !== closeEl) {
        if (node.nodeType === 1) {
          let blockInner = node.innerHTML.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?p[^>]*>/gi, '\n').replace(/<[^>]+>/g, '');
          const txtArea = doc.createElement('textarea');
          txtArea.innerHTML = blockInner;
          blockInner = txtArea.value.replace(/\u00A0/g, ' ');
          blockInner.split('\n').forEach(l => {
            if (l.trim().length > 0 || codeLines.length > 0) codeLines.push(l);
          });
        }
        node = node.nextSibling;
      }
      console.log('--- FOUND BLOCK ---');
      console.log(JSON.stringify(codeLines));
      break;
    }
  }
}
