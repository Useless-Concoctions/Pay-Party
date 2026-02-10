
import * as pdfjsLib from 'pdfjs-dist';

// Point to the worker file in public or node_modules (handling for Vite)
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractDataFromPDF(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;

    let textContent = '';

    // Check first few pages (usually paystub is 1-2 pages)
    const maxPages = Math.min(pdf.numPages, 2);

    for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i);
        const text = await page.getTextContent();
        textContent += text.items.map(item => item.str).join(' ') + '\n';
    }

    console.log('--- Extracted Text ---', textContent);
    return parsePaystubText(textContent);
}

function parsePaystubText(text) {
    // Normalization
    const cleanText = text.replace(/\$/g, '').replace(/,/g, '');

    const result = {
        gross: null,
        net: null,
        date: null,
        hours: null,
        company: null
    };

    // 1. Find DATE (Period Ending or Pay Date)
    // Common formats: MM/DD/YYYY, YYYY-MM-DD
    const dateRegex = /(\d{1,2}\/\d{1,2}\/\d{4})|(\d{4}-\d{2}-\d{2})/;
    const dateMatch = text.match(dateRegex);
    if (dateMatch) {
        // Try to standardize to YYYY-MM-DD for input
        const dateStr = dateMatch[0];
        try {
            const dateObj = new Date(dateStr);
            result.date = dateObj.toISOString().split('T')[0];
        } catch (e) {
            console.warn('Date parse failed', e);
        }
    }

    // 2. Find NET PAY
    const netRegex = /(?:Net Pay|Net Check|Net Pay Distribution).*?(\d+\.\d{2})/i;
    const netMatch = cleanText.match(netRegex);
    if (netMatch) result.net = parseFloat(netMatch[1]);

    // 3. Find GROSS PAY
    const grossRegex = /(?:Gross Pay|Total Gross).*?(\d+\.\d{2})/i;
    const grossMatch = cleanText.match(grossRegex);
    if (grossMatch) result.gross = parseFloat(grossMatch[1]);

    // 4. Find HOURS (Regular/Units)
    // Look for generic number pattern near "Regular" or "Hours"
    // "Regular Hours 40.00"
    const regHoursRegex = /(?:Reg(?:ular)?\s*(?:Hours|Hrs)?|Hours)\D{0,20}(\d{1,3}\.\d{2})/i;
    const regMatch = cleanText.match(regHoursRegex);
    if (regMatch) result.hours = parseFloat(regMatch[1]);

    return result;
}
