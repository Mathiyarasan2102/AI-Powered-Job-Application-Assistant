const Tesseract = require('tesseract.js');

module.exports = {
    async extractTextFromImage(filePath) {
        try {
            const result = await Tesseract.recognize(filePath, 'eng', {
                // logger: m => console.log(m)
            });
            return result.data.text;
        } catch (error) {
            console.error('OCR Error:', error);
            throw new Error('Failed to extract text from image');
        }
    }
};
