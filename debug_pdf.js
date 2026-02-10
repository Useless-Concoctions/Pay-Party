
const pdfParse = require('pdf-parse');
console.log('Type of export:', typeof pdfParse);
console.log('Export keys:', Object.keys(pdfParse));

const fs = require('fs');
const path = require('path');
const buffer = fs.readFileSync(path.resolve(__dirname, 'Examples/08.10.2025-08.23.2025.pdf'));

if (typeof pdfParse === 'function') {
    pdfParse(buffer).then(data => console.log(data.text)).catch(console.error);
} else if (pdfParse.default) {
    pdfParse.default(buffer).then(data => console.log(data.text)).catch(console.error);
}
