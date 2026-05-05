const fs = require('fs');
const pdfParse = require('pdf-parse');

module.exports = {
    async extractTextFromPDF(filePath) {
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const result = await pdfParse(dataBuffer);
            return result.text;
        } catch (error) {
            console.error('PDF Parse Error:', error);
            throw new Error('Failed to parse PDF file');
        }
    }
};
