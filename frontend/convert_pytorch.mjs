import mammoth from 'mammoth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, 'public', 'docx', 'courses', 'Data_Science', 'pytorch');
const outputDir = path.join(__dirname, 'public', 'cources', 'Data_Science', 'pytorch');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

const filesToConvert = [
    'module1_tensors.docx',
    'module2_autograd.docx',
    'module3_nn_module.docx',
    'module4_training_loop.docx',
    'module5_data_pipelines.docx',
    'module6_evaluation.docx',
    'module7_cnns.docx',
    'module8_sequence_models.docx',
    'module9_training_tricks.docx',
    'module10_debugging.docx',
    'module11_distributed.docx',
    'module12_deployment.docx'
];

function convertTablesToPythonBlocks(html) {
    return html.replace(/<table>([\s\S]*?)<\/table>/g, (match, tableContent) => {
        const lines = [];
        const pRegex = /<p>([\s\S]*?)<\/p>/g;
        let pMatch;
        while ((pMatch = pRegex.exec(tableContent)) !== null) {
            let lineText = pMatch[1].replace(/<[^>]+>/g, '').trimEnd();
            lineText = lineText.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
            lines.push(lineText);
        }
        const code = lines.join('\n');
        if (!code.trim()) return '';
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
            const result = await mammoth.convertToHtml({ path: inputPath });
            let html = result.value;
            html = convertTablesToPythonBlocks(html);
            const blockCount = (html.match(/<python>/g) || []).length;
            totalBlocks += blockCount;
            fs.writeFileSync(outputPath, html, 'utf8');
            console.log(`✓ ${file} → ${path.basename(outputPath)}  [${blockCount} Python blocks]`);
        } catch (err) {
            console.error(`✗ Error converting ${file}:`, err.message);
        }
    }

    console.log(`\n✅ All done! ${totalBlocks} Python IDE blocks created across all files.`);
}

convert();
