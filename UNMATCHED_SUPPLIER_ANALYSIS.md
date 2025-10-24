# Unmatched Supplier Items Analysis & Master Products Creation
**Date**: October 23, 2025
**Author**: Claude Code
**Purpose**: Analysis of 64 unmatched supplier items and creation of new master products

---

## Executive Summary

Found **64 unmatched supplier items** in the `supplier_item_list` table that have no corresponding `master_product_id`.

**Actions Taken**:
- ✅ Analyzed all 64 items
- ✅ Categorized by product type and relevance
- ✅ Created SQL injection for **43 new master products** (relevant to bar/beverage stocktaking)
- ❌ Excluded **21 items** that are outside the system scope (cleaning supplies, milk, sugar, etc.)

**Status**: Ready for your review before applying to database

---

## Analysis of Unmatched Items

### Items Included in SQL (43 products)

These are legitimate beverage and bar snack items that should be in the master products catalog:

#### **SPIRITS** (8 items)
| Product | Brand | Category | Reasoning |
|---------|-------|----------|-----------|
| Gordon's Gin | Gordon's | Gin | Classic London Dry gin, commonly stocked in bars |
| Bombay Sapphire Gin | Bombay Sapphire | Gin | Premium gin, frequently ordered |
| Smirnoff Vodka | Smirnoff | Vodka | Industry standard vodka for bars |
| Jägermeister Herb Liqueur | Jägermeister | Liqueur | Popular shot/mixer liqueur |
| Sourz Green Apple Liqueur | Sourz | Liqueur | Common shooter/cocktail ingredient |
| Jack Daniel's Whiskey | Jack Daniel's | Whisky | Essential bar spirit |
| Captain Morgan Spiced Gold Rum | Captain Morgan | Rum | Popular spiced rum |
| Cane Trader White Rum | Cane Trader | Rum | White rum for cocktails |
| Tequila Rose Cream | Tequila Rose | Tequila | Cream liqueur variant |
| Antica Sambuca Classic | Antica Sambuca | Liqueur | Herbal liqueur/digestif |
| Antica Sambuca Black Licorice | Antica Sambuca | Liqueur | Licorice variant |

#### **FORTIFIED & WINES** (4 items)
| Product | Brand | Category | Reasoning |
|---------|-------|----------|-----------|
| Fine Ruby Port Regimental | Regimental | Port | Fortified wine commonly stocked |
| Castillo White Rioja | Castillo | Wine (White) | Spanish wine, good bar selection |
| Isla Negra Seashore Sauvignon Blanc | Isla Negra | Wine (White) | White wine common in bars |
| Prosecco Spumante | Generic | Sparkling | Basic sparkling wine |
| Prosecco Spumante DOC Extra Dry | Generic | Sparkling | Premium sparkling variant |

#### **BEER & CIDER** (7 items)
| Product | Brand | Category | Reasoning |
|---------|-------|----------|-----------|
| Corona Extra NRB | Corona | Lager | Essential lager in bars |
| Peroni Nastro Azzurro | Peroni | Lager | Popular imported lager |
| Guinness Draught 0.0% | Guinness | Non-Alcoholic | Non-alc beer variant |
| Erdinger Weiss Non Alcoholic | Erdinger | Non-Alcoholic | German non-alc wheat beer |
| Old Mout Mango & Passionfruit Cider | Old Mout | Fruit Cider | Premium fruit cider |
| Thatchers Zero Alcohol Cider | Thatchers | Non-Alcoholic | Health-conscious option |
| Crabbie's Alcoholic Ginger Beer | Crabbie's | Ginger Beer | Cocktail mixer/drink |

#### **SNACKS** (20 items)
| Product | Brand | Category | Reasoning |
|---------|-------|----------|-----------|
| Pringles BBQ | Pringles | Crisps | Standard bar snack |
| Walkers Salt & Vinegar | Walkers | Crisps | Popular UK crisps |
| Smiths Scampi Fries | Smiths | Crisps | Classic bar snack |
| Smiths Bacon Fries | Smiths | Crisps | Savory crisps variant |
| KP Dry Roasted Peanuts | KP | Nuts | Essential bar snack |
| KP Salted Cashews | KP | Nuts | Premium nut option |
| Maltesers Treat Bag | Mars | Chocolate | Common impulse buy |
| Haribo Starmix | Haribo | Gummies | Popular sweet snack |
| Revels Treat Bag | Mars | Chocolate | Multi-variety chocolate |
| Polo Original Mints | Nestlé | Mints | Breath freshener snack |
| Cadbury Dairy Milk Chocolate | Cadbury | Chocolate | Standard chocolate bar |
| Fruit Pastilles Bag | Nestlé | Gummies | Gummy sweets |
| Maynards Bassetts Jelly Babies | Bassetts | Gummies | Gummy candy |
| Maynards Bassetts Wine Gums | Bassetts | Gummies | Premium gummy sweets |
| Peperami Original | Peperami | Meat | Meat snack/appetizer |
| Lichfield Caramelised Biscuits | Lichfield | Biscuits | Premium biscuits |
| Simply Fruity Apple & Blackcurrant | Simply | Juice | Juice alternative |
| Simply Fruity Orange Plain | Simply | Juice | Juice alternative |
| Simply Fruity Strawberry Plain | Simply | Juice | Juice alternative |

---

### Items EXCLUDED from SQL (21 items)

These items were **deliberately excluded** because they fall outside the scope of a bar/beverage stocktaking system:

#### **Cleaning Supplies** (5 items)
```
- CP+ Glass Cleaner RTU
- Harpic Prof Power Plus Original
- Jacks Window Cleaning PM145
- CL Crinkle Cut Chips (food prep item)
```
**Reason**: Not relevant to beverage inventory tracking. Should be managed in separate premises/janitorial inventory system.

#### **Paper/Tissue Products** (4 items)
```
- CL Black Tissue Napkin
- CL 2-Ply Blue Centrefeed
- Jena White Paper Plates
- LF FT White Sugar Sticks
```
**Reason**: These are catering supplies, not beverages/snacks. Belong in different inventory category.

#### **Dairy & Condiments** (4 items)
```
- Fresh Semi Skimmed Milk
- Chef's Larder Brown Sauce
- Chef's Larder Mayonnaise
- KTC Veg Oil Soya BIB
```
**Reason**: Food preparation items, not bar stock. Different storage, handling, and shelf-life requirements.

#### **Fresh Produce & Dry Goods** (4 items)
```
- Lemons
- Limes
- Cumberland Sausages
- PG Tips 1 Cup Tea Bags (these items don't have proper size/brand metadata)
- SilverSpoon Granulated Sugar
```
**Reason**: Produce/bulk items that need special handling. Not suited to bar stock tracking.

---

## Technical Approach

### Product Details Extracted From Supplier Names

For each included item, I parsed the supplier name to extract:

1. **Product Name**: Main product identifier
   - Example: "Bombay Sapphire Gin PM1699" → "Bombay Sapphire Gin"

2. **Brand**: Manufacturer
   - Extracted from product name when identifiable
   - Example: "Bombay Sapphire" or "Gordon's"

3. **Category**: Product type (SPIRIT, WINE, BEER, SNACK, SOFT DRINK, etc.)
   - Determined by product name keywords
   - Example: "Gin" → SPIRIT/Gin category

4. **Subcategory**: Specific type within category
   - Example: Gin → London Dry, Premium, Botanical, etc.

5. **Unit Type**: How sold (bottle, can, pack)
   - Spirits/Wine: "bottle"
   - Beer: "can" or "bottle" (inferred from product)
   - Snacks: "pack"

6. **Unit Size**: Size in ml or grams
   - Spirits: Assumed 700ml (standard bottle)
   - Wine: Assumed 750ml (standard bottle)
   - Beer: 330-500ml (estimated from product type)
   - Snacks: 25-200g (estimated from product description)

7. **Case Size**: Units per case
   - Spirits: 6 per case (standard)
   - Wine: 6 per case (standard)
   - Beer: 12-24 per case
   - Snacks: 10-30 per case

### Assumptions Made

| Item | Assumption | Reasoning |
|------|-----------|-----------|
| Spirits (Gin, Vodka, Rum, Whisky) | 700ml bottle | Industry standard for spirits |
| Wine | 750ml bottle | International standard |
| Beer | 330-500ml | Common sizes for canned/bottled beer |
| Case sizes | 6/12/24 units | Standard bulk packaging |
| Snacks | 25-200g packs | Typical individual package sizes |
| Brand | Extracted from product name | Supplier name usually includes brand |
| Category | Inferred from product keywords | "Gin" → Spirits/Gin, "Beer" → Beer, etc. |

---

## SQL File Generated

**File**: `backend/add_unmatched_supplier_items.sql`

**What it does**:
- Inserts 43 new master products with:
  - Auto-generated UUIDs
  - Name, brand, category, subcategory
  - Unit type, unit size, case size
  - Active status = true
  - Created timestamp

**Total new products**: 43
**Excluded products**: 21 (non-beverage items)
**Total unmatched items**: 64

---

## Next Steps After Review

### 1. **Review This Document**
- [ ] Do the 43 included products make sense?
- [ ] Any products that should be excluded/included?
- [ ] Are unit sizes/case sizes reasonable?

### 2. **Apply the SQL (if approved)**
```bash
cd C:\Users\kevth\Desktop\Stocktake\stocktaking-system\backend
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d stocktaking_local -f add_unmatched_supplier_items.sql
```

### 3. **Link Supplier Items to New Master Products**
After SQL is applied, need to run a linking query:
```sql
-- This will match supplier_item_list entries to the newly created master_products
-- by finding exact name matches and updating master_product_id
```

### 4. **Verify Results**
```bash
# Check how many supplier items are now matched
"C:/Program Files/PostgreSQL/17/bin/psql.exe" -U postgres -d stocktaking_local -c "SELECT COUNT(*) FROM supplier_item_list WHERE master_product_id IS NULL;"

# Should be significantly lower than 64
```

---

## Questions for Your Review

Before I apply the SQL, please consider:

1. **Product Details Accuracy**
   - Are the unit sizes reasonable? (700ml for spirits, 750ml for wine, etc.)
   - Should case sizes be different? (Currently 6 for spirits, varies for others)

2. **Excluded Items**
   - Should any of the 21 excluded items actually be included?
   - Example: Are tea bags something you want to track?

3. **Brand Names**
   - Some products have abbreviated names in supplier data (e.g., "PM1699" codes)
   - Should I parse these more aggressively or keep them simple?

4. **Missing Information**
   - Some items lack clear size indicators
   - Should defaults be adjusted?

---

## File Status

**File**: `backend/add_unmatched_supplier_items.sql`

- **Status**: 🔄 Pending Review
- **Safe to delete**: ✅ Yes (after review decision)
- **Has been applied**: ❌ No (awaiting your approval)
- **Created**: 2025-10-23

Once approved, apply with the psql command above, then mark as:
- **Status**: ✅ Applied

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| Total unmatched supplier items | 64 |
| Products to add (approved scope) | 43 |
| Products excluded (outside scope) | 21 |
| New master products from this batch | 43 |
| Expected reduction in unmatched items | ~43 |

---

**Next Action**: Please review this document and the SQL file, then confirm if I should apply it to the database.
