// Test smarter parsing that handles tabs in product names

const testLines = [
  "097149 Lemons \t1 10s \t1 \t4.99 \t4.99 \tA",
  "139753 CL 40cm Black Tissue Napkin \t1 125s \t1 \t6.99 \t6.99 \tB",
  "308317 Jena White Paper Plates 15cm \t1 100s \t1 \t6.99 \t6.99 \tB",
  "299225 CLE 2 \tPly Blue Centrefeed \t1 6pk \t2 \t6.99 \t13.98 \tB",
  "063724 Coke Zero \t24 330ml \t1 \t10.95 P \t10.95 \tB \t1.35 59.4%"
];

console.log('Testing smart parsing:\n');

testLines.forEach((line, index) => {
  const sku = line.substring(0, 6);
  const remainder = line.substring(6).trim();

  // Split by tabs
  const tabParts = remainder.split(/\t+/);

  let packSize = '';
  let unitSize = '';
  let packSizeFieldIndex = -1;

  // Find which field contains the pack/size pattern "number space unit"
  for (let i = 0; i < tabParts.length; i++) {
    const field = tabParts[i].trim();
    const packAndSizeMatch = field.match(/^(\d+)\s+([\d.]+(?:ml|g|cl|l|kg|s|pk|cm))/i);

    if (packAndSizeMatch) {
      packSize = packAndSizeMatch[1];
      unitSize = packAndSizeMatch[2];
      packSizeFieldIndex = i;
      break;
    }
  }

  // Product name is everything before the pack/size field
  let productName = '';
  if (packSizeFieldIndex > 0) {
    productName = tabParts.slice(0, packSizeFieldIndex).join(' ').trim();
  } else if (tabParts.length > 0) {
    productName = tabParts[0].trim();
  }

  // Quantity is the field after pack/size
  let quantity = 1;
  if (packSizeFieldIndex >= 0 && tabParts.length > packSizeFieldIndex + 1) {
    const qtyField = tabParts[packSizeFieldIndex + 1].trim();
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
