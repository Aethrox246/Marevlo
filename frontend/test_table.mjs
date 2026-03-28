import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const inputPath = path.join(__dirname, 'public', 'docx', 'courses', 'clustring', 'part 0.docx');
const result = await mammoth.convertToHtml({path: inputPath});
const html = result.value;

// Find the first table
const tableStart = html.indexOf('<table>');
const tableEnd = html.indexOf('</table>') + 8;
if (tableStart !== -1) {
  console.log('First table HTML:');
  console.log(html.substring(tableStart, tableEnd));
  console.log('\nTotal tables:', (html.match(/<table>/g) || []).length);
}
