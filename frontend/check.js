const fs = require('fs');
const html = fs.readFileSync('public/cources/clus/part 0.html', 'utf8');
const { JSDOM } = require('jsdom');
const dom = new JSDOM(html);
const doc = dom.window.document;
const ps = Array.from(doc.querySelectorAll('p, pre, div, td'));
console.log('Found nodes:', ps.length);
ps.forEach(p => {
    const text = p.textContent.trim().toLowerCase();
    if (text.includes('python')) {
        console.log('MATCH:', JSON.stringify(text), 'TAG:', p.tagName);
    }
});
