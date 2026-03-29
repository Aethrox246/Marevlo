import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'public', 'docx', 'courses', 'clustring');
const outputDir = path.join(__dirname, 'public', 'cources', 'clus');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const filesToConvert = [
    'part 0.docx',
    'part1.docx',
    'part 2.docx',
    'part 3.docx',
    'part 4.docx',
    'part 5.docx',
    'part 6.docx',
    'part 7.docx',
    'part 8.docx',
    'part 9.docx',
    'part 10.docx',
    'part 11.docx'
];

/**
 * Convert all <table>...</table> elements in the mammoth HTML output
 * into <python>...</python> blocks by extracting text from <p> tags inside them.
 * 
 * Word uses single-cell tables to represent code blocks in these documents.
 */
function convertTablesToPythonBlocks(html) {
    // Match full table elements (mammoth outputs simple <table> without attributes)
    return html.replace(/<table>([\s\S]*?)<\/table>/g, (match, tableContent) => {
        // Extract text from all <p> tags inside the table
        const lines = [];
        const pRegex = /<p>([\s\S]*?)<\/p>/g;
        let pMatch;
        while ((pMatch = pRegex.exec(tableContent)) !== null) {
            // Strip any remaining HTML tags from the paragraph content
            const lineText = pMatch[1].replace(/<[^>]+>/g, '').trim();
            lines.push(lineText);
        }
        const code = lines.join('\n');
        
        // If empty, skip
        if (!code.trim()) return '';
        
        // Return as <python> block (the CourseContent.jsx parser handles this)
        return `<python>${code}</python>`;
    });
}

async function convert() {
    let totalBlocks = 0;

    for (const file of filesToConvert) {
        const inputPath = path.join(inputDir, file);
        if (!fs.existsSync(inputPath)) {
            console.warn(`  ! File not found: ${inputPath}`);
            continue;
        }

        const baseName = file.replace('.docx', '');
        const outputPath = path.join(outputDir, `${baseName}.html`);

        try {
            // Step 1: Standard mammoth conversion
            const result = await mammoth.convertToHtml({ path: inputPath });
            let html = result.value;

            // Step 2: Post-process — replace tables with <python> blocks
            html = convertTablesToPythonBlocks(html);

            // Count python blocks
            const blockCount = (html.match(/<python>/g) || []).length;
            totalBlocks += blockCount;

            fs.writeFileSync(outputPath, html, 'utf8');
            console.log(`✓ ${file} → ${path.basename(outputPath)}  [${blockCount} Python IDE block${blockCount !== 1 ? 's' : ''}]`);
        } catch (err) {
            console.error(`✗ Error converting ${file}:`, err.message);
        }
    }

    console.log(`\n✅ All done! ${totalBlocks} Python IDE blocks created across all files.`);
}

convert();
