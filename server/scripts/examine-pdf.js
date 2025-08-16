/**
 * Script to examine the structure of the Athletics Integrity PDF
 * to improve parsing accuracy
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

async function examinePdf() {
  try {
    const pdfPath = path.join(__dirname, '../temp/Global-List-AUG_25.pdf');
    
    if (!fs.existsSync(pdfPath)) {
      console.log('PDF not found. Please run the athletics integrity scraper first.');
      return;
    }
    
    console.log('Examining PDF structure...');
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log('=== PDF METADATA ===');
    console.log('Pages:', data.numpages);
    console.log('Info:', data.info);
    
    console.log('\n=== FULL TEXT CONTENT ===');
    const text = data.text;
    console.log('Total characters:', text.length);
    
    // Split into lines and examine structure
    const lines = text.split('\n');
    console.log('Total lines:', lines.length);
    
    console.log('\n=== FIRST 50 LINES ===');
    lines.slice(0, 50).forEach((line, index) => {
      console.log(`${index + 1}: "${line.trim()}"`);
    });
    
    console.log('\n=== LOOKING FOR PATTERNS ===');
    
    // Look for athlete name patterns
    const namePatterns = [];
    const datePatterns = [];
    const countryPatterns = [];
    
    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      
      // Look for potential athlete names (starts with capital letters)
      if (trimmed.match(/^[A-Z][a-zA-Z\s]+\s+[A-Z]{3}\s+(M|F)/)) {
        namePatterns.push({ line: index + 1, content: trimmed });
      }
      
      // Look for date patterns
      if (trimmed.match(/\d{2}\.\d{2}\.\d{4}/)) {
        datePatterns.push({ line: index + 1, content: trimmed });
      }
      
      // Look for country codes
      if (trimmed.match(/\b[A-Z]{3}\b/)) {
        countryPatterns.push({ line: index + 1, content: trimmed });
      }
    });
    
    console.log('\n=== NAME PATTERNS FOUND ===');
    namePatterns.slice(0, 10).forEach(pattern => {
      console.log(`Line ${pattern.line}: "${pattern.content}"`);
    });
    
    console.log('\n=== DATE PATTERNS FOUND ===');
    datePatterns.slice(0, 10).forEach(pattern => {
      console.log(`Line ${pattern.line}: "${pattern.content}"`);
    });
    
    console.log('\n=== SAMPLE LINES WITH COUNTRY CODES ===');
    countryPatterns.slice(0, 10).forEach(pattern => {
      console.log(`Line ${pattern.line}: "${pattern.content}"`);
    });
    
    // Save full text to file for manual examination
    const outputPath = path.join(__dirname, '../temp/pdf-content.txt');
    fs.writeFileSync(outputPath, text);
    console.log(`\nFull PDF text saved to: ${outputPath}`);
    
  } catch (error) {
    console.error('Error examining PDF:', error);
  }
}

examinePdf();
