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

// Extract all tables with their content
const tblRegex = /<w:tbl[ >]([\s\S]*?)<\/w:tbl>/g;
let tblMatch;
let tblCount = 0;
while ((tblMatch = tblRegex.exec(documentXml)) !== null) {
  const tblContent = tblMatch[1];
  const text = tblContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (text.length > 10) {
    tblCount++;
    console.log(`\n--- Table ${tblCount} ---`);
    console.log(text.substring(0, 400));
    // Check background fill
    const fillMatch = tblContent.match(/w:fill="([^"]+)"/);
    if (fillMatch) console.log('Fill:', fillMatch[1]);
    // Check if single or multi-column
    const colCount = (tblContent.match(/<w:tc[> ]/g) || []).length;
    console.log('Cell count:', colCount);
  }
}
console.log('\nTotal tables:', tblCount);
