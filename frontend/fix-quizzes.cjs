const fs = require('fs');
const path = require('path');

const dirPath = './public/cources/clus';
const files = fs.readdirSync(dirPath).filter(f => f.endsWith('_quiz.json'));

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(dirPath, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let newQuestions = [];
  for (const q of data.questions) {
    // If the question has no options but appears to have options squished inside it:
    if (q.options.length === 0 && /[a-eA-E]\)/.test(q.question)) {
        let text = q.question;
        
        // Add a magic split token (|||) before option letters like a), A), b), etc.
        text = text.replace(/([a-eA-E]\))/g, '|||$1 ');
        // Add token before question numbers like 1., 2.
        text = text.replace(/(\d{1,2}\.)/g, '|||$1 ');
        
        // Let's also split words that merged into sentences. 
        // Example: "datasets?a) It is faster" -> "datasets? |||a) It is faster"
        // The regex above already does this!
        
        const chunks = text.split('|||').map(s => s.trim()).filter(Boolean);
        
        let curr = null;
        for (const chunk of chunks) {
            if (/^[a-eA-E]\)/.test(chunk)) {
                if (curr) curr.options.push(chunk);
            } else {
                if (curr) newQuestions.push(curr);
                curr = { question: chunk, options: [] };
            }
        }
        if (curr) newQuestions.push(curr);
        totalFixed++;
    } 
    // Filter noise like "ANSWERS:" or "bbbbcbbcbc" or empty strings
    else if (/ANSWERS/i.test(q.question) || /^[a-eA-E]+$/i.test(q.question) || q.question.length < 5) {
        // Drop it
    } else {
        newQuestions.push(q);
    }
  }

  // Final sanity check: ensure all kept questions have options
  data.questions = newQuestions.filter(q => q.options && q.options.length > 0 && q.question.length > 5);
  
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

console.log(`Fixed ${totalFixed} corrupted squished question blocks!`);
