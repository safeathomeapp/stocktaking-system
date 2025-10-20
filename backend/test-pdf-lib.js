const {PDFParse} = require('pdf-parse');
const fs = require('fs');

async function test() {
  try {
    const buf = fs.readFileSync('C:/Users/kevth/Downloads/Invoices/0337_003.pdf');
    const parser = new PDFParse({data: buf});

    console.log('Parser created successfully');
    console.log('Methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(parser)));

    // Load the PDF
    await parser.load();

    // Get text
    const textResult = await parser.getText();
    console.log('Text extracted, pages:', textResult.pages.length);

    // Show all text from all pages
    let totalText = '';
    textResult.pages.forEach((page, i) => {
      console.log(`\n===== Page ${i + 1} =====`);
      console.log(page.text);
      totalText += page.text + '\n';
    });

    console.log('\n\n===== Summary =====');
    console.log('Total characters extracted:', totalText.length);
    console.log('Contains actual content:', totalText.length > 100);
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

test();
