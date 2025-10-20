# Master Products Catalog

## Overview

Comprehensive master products database for UK pub, nightclub, and hotel (wet trade) operations.

**Last Updated:** 2025-10-09
**Total Products:** 570
**Database:** PostgreSQL `master_products` table

## Statistics by Category

| Category | Product Count | Subcategories |
|----------|--------------|---------------|
| **Spirits** | 269 | Vodka, Gin, Whisky, Rum, Tequila, Liqueurs & Specialities, Aperitifs & Digestifs, Bitters & Syrups, Low & No Alcohol Spirits |
| **Wines** | 124 | Bottled Wine, Sparkling Wine, Fortified Wine, Bag-in-Box Wine, Low & No Alcohol Wine |
| **Beers & Ales** | 83 | Lager, Cask Ale, Craft Beer, Low & No Alcohol Beer, RTDs (Ready-to-Drink) |
| **Soft Drinks** | 67 | Bottled Soft Drinks, Bag-in-Box Soft Drinks, Mixers & Tonic Waters, Juices & Cordials, Energy Drinks, Bottled Water |
| **Cider & Perry** | 27 | Cider (Draught), Bottled Cider |

## Schema Structure

```sql
master_products (
  id               UUID PRIMARY KEY
  name             VARCHAR(255)  NOT NULL
  brand            VARCHAR(100)
  category         VARCHAR(100)
  subcategory      VARCHAR(100)
  unit_type        VARCHAR(50)   CHECK IN ('bottle', 'can', 'keg', 'cask', 'bag-in-box')
  unit_size        INTEGER       -- ml value (e.g., 330, 750, 50000)
  case_size        INTEGER       -- units per case (e.g., 6, 12, 24)
  barcode          VARCHAR(100)
  ean_code         VARCHAR(20)
  upc_code         VARCHAR(20)
  active           BOOLEAN       DEFAULT true
  created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  updated_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
  created_by_id    UUID
)
```

## Spirits (269 products)

### Vodka (49 products)
- **Smirnoff:** Red Label (700ml, 1000ml), 16 flavoured varieties
- **Absolut:** Original (700ml, 1000ml), 8 flavoured varieties
- **Grey Goose:** Original (700ml, 1000ml), 3 flavoured varieties
- **Belvedere, Russian Standard, Stolichnaya, Ciroc, Ketel One, Skyy**

### Gin (52 products)
- **Gordon's:** London Dry, Premium Pink, Sicilian Lemon, Mediterranean Orange, White Peach
- **Bombay Sapphire:** Original, Bramble, Citron Presse
- **Tanqueray:** London Dry, Flor de Sevilla, Blackcurrant Royale, No. Ten
- **Beefeater, Hendrick's (4 variants), Warner's, Whitley Neill (7 variants)**
- **Manchester, Mermaid, Sipsmith, Edinburgh, Monkey 47, The Botanist, Opihr, Malfy, Plymouth, Hayman's**

### Whisky (85 products)
- **Blended Scotch:** Johnnie Walker (6 variants), Famous Grouse, Bell's, Whyte & Mackay, Grant's, Teacher's, Chivas Regal, Ballantine's, William Lawson's, J&B
- **Single Malt:** Glenfiddich (3 ages), Glenlivet (3 ages), Glenmorangie (3 variants), Macallan (3 ages), Laphroaig, Lagavulin, Ardbeg, Talisker, Highland Park, Oban, Bowmore, Jura
- **Irish:** Jameson (5 variants), Bushmills (3 variants), Tullamore Dew (3 variants), Powers, Redbreast, Teeling
- **American:** Jack Daniel's (7 variants), Jim Beam (6 variants), Maker's Mark, Woodford Reserve, Buffalo Trace, Wild Turkey, Four Roses, Bulleit, Knob Creek
- **Japanese:** Yamazaki, Hibiki, Nikka (2 variants)

### Rum (35 products)
- **Bacardi:** White, Gold, Black, Spiced, Coconut, Raspberry
- **Captain Morgan:** Original Spiced, White, Dark, Black Spiced, Tiki
- **Kraken, Malibu (5 flavours), Havana Club, Mount Gay, Sailor Jerry, Dead Man's Fingers, Lamb's, Wray & Nephew, Appleton Estate, Diplomatico, Zacapa**

### Tequila (15 products)
- **Jose Cuervo, Olmeca, Sierra, Patron (3 variants), Don Julio (2 variants), Casamigos (2 variants), El Jimador**

### Liqueurs & Specialities (23 products)
- **Baileys (5 variants), Kahlua, Tia Maria, Disaronno, Cointreau, Grand Marnier, Drambuie, Southern Comfort, Jägermeister, Sambuca, Pernod, Chambord, St-Germain**

### Aperitifs & Digestifs (8 products)
- **Aperol, Campari, Martini (3 types), Pimm's**

### Bitters & Syrups (3 products)
- **Angostura Aromatic, Angostura Orange, Peychaud's**

### Low & No Alcohol Spirits (9 products)
- **Seedlip (3 variants), Lyre's (3 variants), Gordon's 0.0%**

## Wines (124 products)

### Bottled Wine (66 products)
- **Popular Brands:** Hardys, Echo Falls, Blossom Hill, Yellow Tail, Barefoot, Casillero del Diablo, Campo Viejo, Jacob's Creek
- **Varieties:** Red (Shiraz, Cabernet Sauvignon, Merlot, Pinot Noir, Carmenere), White (Chardonnay, Sauvignon Blanc, Pinot Grigio), Rosé, White Zinfandel
- **Standard bottle size:** 750ml, case size: 12 bottles

### Sparkling Wine (19 products)
- **Prosecco:** Mionetto, Freixenet, Galeotti, La Marca, Bottega Gold
- **Champagne:** Moët & Chandon, Veuve Clicquot, Lanson, Bollinger, Taittinger, Piper-Heidsieck, Perrier-Jouët, Laurent-Perrier
- **Cava:** Freixenet, Codorníu
- **Bottle size:** 750ml

### Fortified Wine (19 products)
- **Port:** Graham's (3 variants), Taylor's (2 variants), Cockburn's (2 variants), Sandeman (2 variants), Warre's, Fonseca, Dow's
- **Sherry:** Harveys Bristol Cream, Tio Pepe, Croft Original, Lustau
- **Bottle sizes:** 375ml, 750ml

### Bag-in-Box Wine (16 products)
- **Stowells (7 varieties):** Cabernet Sauvignon, Merlot, Shiraz, Chardonnay, Sauvignon Blanc, Pinot Grigio, Rosé
- **Other brands:** BIB Wine Company (3), Wine Route (2), Isla Negra, Shallow Bay, Torri Cantine (2)
- **Sizes:** 2.25L (2250ml), 3L (3000ml)

### Low & No Alcohol Wine (8 products)
- **McGuigan Zero:** Shiraz, Chardonnay, Sauvignon Blanc, Rosé
- **Eisberg:** Cabernet Sauvignon, Chardonnay, Sauvignon Blanc, Rosé
- **Bottle size:** 750ml

## Beers & Ales (83 products)

### Lager (57 products)
- **Major brands:** Carling, Stella Artois, Foster's, Heineken, Carlsberg, Budweiser, Corona, Peroni, San Miguel, Kronenbourg, Moretti, Amstel, Grolsch, Beck's, Asahi, Cobra, Tiger, Estrella, Modelo, Pacifico
- **Formats:**
  - Keg (50L)
  - Bottles (275ml, 330ml, 355ml, 450ml)
  - Cans (440ml)

### Cask Ale (13 products)
- **Guinness** (keg/can), **John Smith's**, **Greene King** (2 variants), **London Pride**, **Timothy Taylor Landlord**, **Doom Bar**, **Old Speckled Hen**, **Pedigree**, **Bass**, **Newcastle Brown**
- **Cask size:** 72L (72000ml)

### Craft Beer (16 products)
- **BrewDog (4 variants), Camden Town (2), Beavertown (2), Meantime (2), Thornbridge, Cloudwater, Northern Monk, Tiny Rebel, Vocation**
- **Formats:** Bottles, cans (330ml, 440ml)

### Low & No Alcohol Beer (10 products)
- **Heineken 0.0, Peroni Libera, Budweiser Zero, Guinness 0.0, Corona Cero, Beck's Blue, Stella 0.0%, BrewDog Nanny State, Erdinger Alkoholfrei**

### RTDs (Ready-to-Drink) (7 products)
- **WKD, Smirnoff Ice, Gordon's Premix, Bacardi & Cola, Jack Daniel's & Cola, Captain Morgan & Cola**

## Soft Drinks (67 products)

### Bottled Soft Drinks (24 products)
- **Colas:** Coca-Cola Classic, Coca-Cola Zero Sugar, Diet Coke, Pepsi, Pepsi Max
- **Lemonades:** 7UP, 7UP Free, Sprite, Sprite Zero
- **Fruit Drinks:** Fanta (Orange, Lemon, Fruit Twist), Schweppes Lemonade
- **Sizes:** 330ml bottles/cans

### Bag-in-Box Soft Drinks (5 products)
- **Coca-Cola, Coca-Cola Zero, Diet Coke, Pepsi, Pepsi Max**
- **Size:** 10L (10000ml)

### Mixers & Tonic Waters (10 products)
- **Schweppes:** Ginger Ale, Tonic Water, Slimline Tonic, Soda Water
- **Fever-Tree:** Indian Tonic, Mediterranean Tonic, Elderflower Tonic, Light Tonic, Ginger Ale, Ginger Beer
- **Size:** 200ml bottles

### Juices & Cordials (12 products)
- **Britvic (5 flavours):** Orange, Apple, Cranberry, Pineapple, Tomato
- **J2O (3 flavours):** Orange & Passion Fruit, Apple & Mango, Apple & Raspberry
- **Robinsons Squash (4 flavours):** Orange, Lemon Barley, Summer Fruits, Blackcurrant
- **Sizes:** 250ml, 275ml, 1000ml

### Energy Drinks (7 products)
- **Red Bull (3 variants), Monster (2), Relentless, Rockstar, Lucozade (2)**
- **Sizes:** 250ml, 380ml, 500ml cans

### Bottled Water (9 products)
- **Still:** Evian (330ml, 750ml), Highland Spring (330ml, 500ml), Volvic (500ml), Buxton (500ml)
- **Sparkling:** Highland Spring (500ml), San Pellegrino (500ml), Perrier (330ml), Buxton (500ml)

## Cider & Perry (27 products)

### Draught Cider (4 products)
- **Strongbow Original, Magners Original, Bulmers Original, Thatchers Gold**
- **Keg size:** 50L (50000ml)

### Bottled Cider (23 products)
- **Strongbow (3 variants), Magners (4 variants), Kopparberg (4 flavours), Rekorderlig (3 flavours), Bulmers (4 variants), Old Mout (3 flavours), Thatchers (3 variants), Aspall, Somersby, Henry Weston's**
- **Sizes:** 440ml, 500ml, 568ml bottles

## Unit Type Standards

| Unit Type | Description | Common Sizes |
|-----------|-------------|--------------|
| **bottle** | Glass bottles | 200ml, 330ml, 500ml, 700ml, 750ml, 1000ml |
| **can** | Aluminium cans | 250ml, 330ml, 440ml, 500ml |
| **keg** | Pressurised kegs | 50000ml (50L) |
| **cask** | Traditional casks | 72000ml (72L/Firkin) |
| **bag-in-box** | Boxed wine/soft drinks | 2250ml (2.25L), 3000ml (3L), 10000ml (10L) |

## Case Size Standards

| Product Type | Typical Case Sizes |
|--------------|-------------------|
| **Spirits (Standard)** | 12 bottles |
| **Spirits (Premium)** | 6 bottles |
| **Wine (Standard)** | 12 bottles |
| **Wine (Premium)** | 6 bottles |
| **Bag-in-Box** | 4 units |
| **Beer/Cider (Bottles)** | 8-24 bottles |
| **Beer/Cider (Cans)** | 24 cans |
| **Soft Drinks** | 24 bottles/cans |
| **Kegs/Casks** | 1 unit |

## Import Process

### Files
- **CSV Source:** `master_products_comprehensive.csv` (571 lines: 1 header + 570 products)
- **Import Script:** `backend/migrations/import-master-products.js`

### Database Migrations
1. `drop-old-search-trigger.js` - Removed legacy search trigger and functions
2. `update-unit-type-constraint.js` - Updated unit_type constraint to include 'cask' and 'bag-in-box'
3. `import-master-products.js` - Cleared and imported all 570 products

### Import Command
```bash
cd backend
export DATABASE_URL="postgresql://[connection-string]"
node migrations/import-master-products.js
```

## Usage in Application

Master products serve as the single source of truth for:
- Product naming standardization
- Supplier invoice mapping
- Venue product matching
- Stock-taking product selection
- Inventory management
- Reporting and analytics

## Future Enhancements

- [ ] Add barcode/EAN/UPC codes for scanning support
- [ ] Include manufacturer/distributor information
- [ ] Add cost price ranges for different suppliers
- [ ] Implement product images for visual identification
- [ ] Add seasonal/limited edition flagging
- [ ] Include allergen information
- [ ] Add ABV (alcohol by volume) for beverages
