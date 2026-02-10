
const fs = require('fs');
const pdf = require('pdf-parse'); // Try default again, but carefully
const path = require('path');

const dataBuffer = fs.readFileSync(path.resolve(__dirname, 'Examples/08.10.2025-08.23.2025.pdf'));

pdf(dataBuffer).then(function (data) {
    console.log('--- PDF TEXT START ---');
    console.log(data.text);
    console.log('--- PDF TEXT END ---');
}).catch(e => console.error(e));
