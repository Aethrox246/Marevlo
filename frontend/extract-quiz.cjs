const fs = require('fs');
const { JSDOM } = require('jsdom');
const path = require('path');

const dirPath = './public/cources/clus';
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.html'));

for (const file of files) {
  const htmlPath = path.join(dirPath, file);
  const html = fs.readFileSync(htmlPath, 'utf8');
  const dom = new JSDOM(html);
  const document = dom.window.document;

  const els = Array.from(document.body.children);
  const quizIdx = els.findIndex(e => e.textContent.trim().toUpperCase() === 'QUIZ');

  if (quizIdx >= 0) {
    const quizEls = els.slice(quizIdx + 1);
    const rawTextNodes = [];

    // Extract clean text blocks
    for (const el of quizEls) {
        if (el.tagName.toLowerCase() === 'p') {
            const htmlContent = el.innerHTML;
            const fragments = htmlContent.split(/<br\s*\/?>/i);
            for (let frag of fragments) {
                const temp = document.createElement('div');
                temp.innerHTML = frag;
                const text = temp.textContent.trim().replace(/\u00A0/g, ' ');
                if (text) rawTextNodes.push(text);
            }
        } else {
            const text = el.textContent.trim().replace(/\u00A0/g, ' ');
            if (text) rawTextNodes.push(text);
        }
        el.remove();
    }

    const quizJson = { title: "Clustering Quiz", questions: [] };
    let currentQ = null;

    for (const text of rawTextNodes) {
      if (text.match(/^[a-eA-E][)\.]\s/)) { // Matches "a) ", "A) ", "a. "
        if (currentQ) {
          currentQ.options.push(text);
        }
      } else {
        if (currentQ) {
          quizJson.questions.push(currentQ);
        }
        currentQ = { question: text, options: [] };
      }
    }
    if (currentQ) {
        quizJson.questions.push(currentQ);
    }

    els[quizIdx].remove(); // Remove "QUIZ" header

    const outputJsonPath = path.join(dirPath, file.replace(/\.html$/, '_quiz.json'));
    // Clean up empty/noise questions
    quizJson.questions = quizJson.questions.filter(q => q.question.length > 5);

    fs.writeFileSync(outputJsonPath, JSON.stringify(quizJson, null, 2));
    fs.writeFileSync(htmlPath, document.body.innerHTML);
    console.log(`[Extracted] Quiz extracted from ${file} and HTML updated.`);
  } else {
    // console.log(`No QUIZ found in ${file}.`);
  }
}
console.log("Extraction complete.");
