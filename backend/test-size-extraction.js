// Test the new size extraction logic

const testLines = [
  "097149 Lemons \t1 10s \t1 \t4.99 \t4.99 \tA",
  "139753 CL 40cm Black Tissue Napkin \t1 125s \t1 \t6.99 \t6.99 \tB",
  "308317 Jena White Paper Plates 15cm \t1 100s \t1 \t6.99 \t6.99 \tB",
  "299225 CLE 2 \tPly Blue Centrefeed \t1 6pk \t2 \t6.99 \t13.98 \tB",
  "063724 Coke Zero \t24 330ml \t1 \t10.95 P \t10.95 \tB \t1.35 59.4%"
];

console.log('Testing size extraction with new logic:\n');

testLines.forEach((line, index) => {
  const sku = line.substring(0, 6);
  const remainder = line.substring(6).trim();

  // Split by tabs
  const tabParts = remainder.split(/\t+/);

  let productName = tabParts[0] ? tabParts[0].trim() : '';
  let packSize = '';
  let unitSize = '';

  // Check if we have the pack/size field
  if (tabParts.length >= 2) {
    const packSizeField = tabParts[1].trim();

    // Try to extract pack and size
    const packAndSizeMatch = packSizeField.match(/^(\d+)\s+([\d.]+(?:ml|g|cl|l|kg|s|pk|cm))/i);

    if (packAndSizeMatch) {
      packSize = packAndSizeMatch[1];
      unitSize = packAndSizeMatch[2];
    }
  }

  // Extract quantity (third field)
  let quantity = 1;
  if (tabParts.length >= 3) {
    const qtyField = tabParts[2].trim();
    const qtyNum = parseInt(qtyField);
    if (!isNaN(qtyNum)) {
      quantity = qtyNum;
    }
  }

  console.log(`${index + 1}. ${productName}`);
  console.log(`   SKU: ${sku}`);
  console.log(`   Pack: ${packSize || '?'}`);
  console.log(`   Size: ${unitSize || '?'}`);
  console.log(`   Qty: ${quantity}`);
  console.log('');
});
