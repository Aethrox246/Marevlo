import fs from 'fs';
import path from 'path';
import fsPromises from 'fs/promises';
import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

import mammoth from 'mammoth';

const srcFile = path.join(__dirname, 'public', 'docs', 'clustering', 'CLUSTERING PART 4.docx');
const dstFile = path.join(__dirname, 'public', 'courses', 'clustering', 'CLUSTERING PART 4.html');

async function run() {
    await fsPromises.mkdir(path.dirname(dstFile), { recursive: true });

    console.log(`Converting: ${srcFile} -> ${dstFile}`);
    try {
        const result = await mammoth.convertToHtml({ path: srcFile });
        await fsPromises.writeFile(dstFile, result.value);
        console.log(`Success: CLUSTERING PART 4.docx`);
    } catch (err) {
        console.error(`Error converting:`, err.message);
    }
}

run().catch(console.error);
