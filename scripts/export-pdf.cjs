/**
 * Markdown → HTML → PDF（pandoc + Edge headless）
 * 用法: node scripts/export-pdf.cjs <input.md> <output.pdf>
 */
const { execSync, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const inputMd = process.argv[2];
const outputPdf = process.argv[3];

if (!inputMd || !outputPdf) {
  console.error('Usage: node export-pdf.cjs <input.md> <output.pdf>');
  process.exit(1);
}

const absInput = path.resolve(inputMd);
const absOutput = path.resolve(outputPdf);
const htmlPath = absOutput.replace(/\.pdf$/i, '.html');

const printCss = `
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body {
    font-family: "Microsoft YaHei", "Segoe UI", sans-serif;
    font-size: 11pt;
    line-height: 1.55;
    color: #1a1a1a;
  }
  h1 { font-size: 20pt; border-bottom: 2px solid #4CAF50; padding-bottom: 6px; }
  h2 { font-size: 14pt; margin-top: 1.4em; color: #2E7D32; }
  h3 { font-size: 12pt; }
  table { border-collapse: collapse; width: 100%; font-size: 9pt; margin: 12px 0; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  th { background: #E8F5E9; }
  pre {
    background: #f5f5f5;
    border: 1px solid #ddd;
    padding: 10px;
    font-size: 8pt;
    line-height: 1.35;
    white-space: pre-wrap;
    word-break: break-all;
  }
  code { font-family: Consolas, monospace; font-size: 9pt; }
  blockquote { border-left: 4px solid #4CAF50; padding-left: 12px; color: #555; }
  hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
</style>
`;

// Step 1: pandoc → HTML
try {
  execSync(
    `pandoc "${absInput}" -f markdown -t html5 -o "${htmlPath}" --standalone --metadata title="Health Buddy 文件清单"`,
    { stdio: 'inherit', shell: true }
  );
} catch {
  console.error('pandoc failed. Is pandoc installed?');
  process.exit(1);
}

// Step 2: inject CSS
let html = fs.readFileSync(htmlPath, 'utf8');
html = html.replace('</head>', `${printCss}</head>`);
fs.writeFileSync(htmlPath, html, 'utf8');

// Step 3: Edge headless → PDF
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
];

const browser = edgePaths.find((p) => fs.existsSync(p));
if (!browser) {
  console.error('Edge/Chrome not found. HTML saved at:', htmlPath);
  process.exit(1);
}

const outDir = path.dirname(absOutput);
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const fileUrl = 'file:///' + htmlPath.replace(/\\/g, '/');
const result = spawnSync(
  browser,
  [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    `--print-to-pdf=${absOutput}`,
    '--print-to-pdf-no-header',
    fileUrl,
  ],
  { stdio: 'inherit' }
);

if (result.status !== 0) {
  console.error('PDF generation failed.');
  process.exit(1);
}

console.log('PDF saved:', absOutput);
