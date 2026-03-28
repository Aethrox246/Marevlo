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

// Check if there are text boxes / inline shapes
const hasTextBox = documentXml.includes('txbxContent') || documentXml.includes('w:txbx');
const hasTable = documentXml.includes('<w:tbl>') || documentXml.includes('<w:tbl ');
console.log('Has text boxes:', hasTextBox);
console.log('Has tables:', hasTable);

// Find text boxes content
if (hasTextBox) {
  const txbxRegex = /<w:txbxContent>([\s\S]*?)<\/w:txbxContent>/g;
  let match;
  let count = 0;
  while ((match = txbxRegex.exec(documentXml)) !== null) {
    // Extract text from text box
    const text = match[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 10) {
      console.log(`\nText box ${++count}: "${text.substring(0, 200)}"`);
    }
  }
}

// Check table cells
if (hasTable) {
  const tblRegex = /<w:tbl[ >]([\s\S]*?)<\/w:tbl>/g;
  let tblMatch;
  let tblCount = 0;
  while ((tblMatch = tblRegex.exec(documentXml)) !== null && tblCount < 3) {
    const tblContent = tblMatch[1];
    const text = tblContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (text.length > 10) {
      console.log(`\nTable ${++tblCount}: "${text.substring(0, 300)}"`);
    }
  }
}

// Also look for paragraphs with specific background shading (code blocks often have gray bg)
const shadingRegex = /<w:shd[^/]*w:fill="([^"]+)"/g;
const fills = new Set();
let shadMatch;
while ((shadMatch = shadingRegex.exec(documentXml)) !== null) {
  fills.add(shadMatch[1]);
}
console.log('\nBackground fills used:', [...fills].slice(0, 10));

// Check what fonts are actually used
const fontRegex = /<w:rFonts[^/]*w:ascii="([^"]+)"/g;
const fonts = new Set();
let fontMatch;
while ((fontMatch = fontRegex.exec(documentXml)) !== null) {
  fonts.add(fontMatch[1]);
}
console.log('Fonts used:', [...fonts]);

// Extract raw text to confirm code is there
const rawResult = await mammoth.extractRawText({path: inputPath});
const lines = rawResult.value.split('\n').filter(l => l.trim());
const codeLines = lines.filter(l => 
  l.includes('import ') || l.includes('def ') || l.includes('print(') || 
  l.includes('sklearn') || l.includes('numpy') || l.includes('KMeans')
);
console.log('\nCode-like lines in raw text:');
codeLines.slice(0, 20).forEach(l => console.log(' -', l.trim().substring(0, 100)));
