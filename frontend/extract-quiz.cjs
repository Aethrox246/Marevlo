const fs = require('fs');
const { JSDOM } = require('jsdom');

const htmlPath = './public/courses/clustering/CLUSTERING_PART_0_3.html';
const html = fs.readFileSync(htmlPath, 'utf8');
const dom = new JSDOM(html);
const document = dom.window.document;

const els = Array.from(document.body.children);
const quizIdx = els.findIndex(e => e.textContent.trim().toUpperCase() === 'QUIZ');

if (quizIdx >= 0) {
  const quizEls = els.slice(quizIdx + 1);
  const rawTextNodes = [];

  // Mammoth sometimes groups text separated by <br>. Let's extract clean text blocks.
  for (const el of quizEls) {
      if (el.tagName.toLowerCase() === 'p') {
          // split by inner HTML <br> or just text content if separated
          const htmlContent = el.innerHTML;
          const fragments = htmlContent.split(/<br\s*\/?>/i);
          for (let frag of fragments) {
              const temp = document.createElement('div');
              temp.innerHTML = frag;
              const text = temp.textContent.trim();
              if (text) rawTextNodes.push(text);
          }
      } else {
          const text = el.textContent.trim();
          if (text) rawTextNodes.push(text);
      }
      el.remove();
  }

  const quizJson = { title: "Clustering Quiz", questions: [] };
  let currentQ = null;

  for (const text of rawTextNodes) {
    if (text.match(/^[a-d]\)/i)) {
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

  els[quizIdx].remove();

  fs.writeFileSync('./public/courses/clustering/CLUSTERING_PART_0_3_quiz.json', JSON.stringify(quizJson, null, 2));
  fs.writeFileSync(htmlPath, document.body.innerHTML);
  console.log("Extracted quiz to JSON and updated HTML.");
} else {
  console.log("No QUIZ found in HTML.");
}
