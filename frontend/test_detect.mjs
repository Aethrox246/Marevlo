import mammoth from 'mammoth';
import JSZip from 'jszip';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.join(__dirname, 'public', 'docx', 'courses', 'clustring', 'part 0.docx');
const zipData = fs.readFileSync(inputPath);
const zip = await JSZip.loadAsync(zipData);
const documentXml = await zip.file('word/document.xml').async('string');
let stylesXml = '';
if (zip.file('word/styles.xml')) stylesXml = await zip.file('word/styles.xml').async('string');

// Find monospace style IDs
const codeStyleIds = new Set();
const styleRegex = /<w:style[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g;
let styleMatch;
while ((styleMatch = styleRegex.exec(stylesXml)) !== null) {
  const styleId = styleMatch[1];
  const styleContent = styleMatch[2];
  if (/Courier New|Consolas|Lucida Console|Courier|monospace/i.test(styleContent)) {
    codeStyleIds.add(styleId);
  }
}
console.log('Code style IDs:', [...codeStyleIds]);

// Count paragraphs with monospace fonts
const paraRegex = /<w:p[ >]([\s\S]*?)<\/w:p>/g;
let paraMatch;
let paraIndex = 0;
const codeParas = [];
while ((paraMatch = paraRegex.exec(documentXml)) !== null) {
  const paraContent = paraMatch[1];
  const pStyleMatch = paraContent.match(/<w:pStyle w:val="([^"]+)"/);
  const hasCodeStyle = pStyleMatch && codeStyleIds.has(pStyleMatch[1]);
  const hasMonoFont = /Courier New|Consolas|Lucida Console|Courier/i.test(paraContent);
  if (hasCodeStyle || hasMonoFont) {
    codeParas.push(paraIndex);
  }
  paraIndex++;
}
console.log('Total paragraphs:', paraIndex);
console.log('Code paragraphs:', codeParas.length, codeParas.slice(0, 10));

// Also do a test conversion and find code lines
const result = await mammoth.convertToHtml({path: inputPath});
const html = result.value;
const idx = html.indexOf('import numpy');
if (idx !== -1) {
  console.log('\nContext around "import numpy":');
  console.log(html.substring(idx - 300, idx + 400));
}
