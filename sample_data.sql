-- Insert sample venues
INSERT INTO venues (name, address) VALUES 
('The Red Lion', '123 High Street, Village Green, VG1 2AB'),
('The Crown & Anchor', '45 Market Square, Townville, TV3 4CD');

-- Insert sample products for The Red Lion
INSERT INTO products (venue_id, name, category, brand, size, unit_type, barcode) 
SELECT 
    v.id,
    product_data.name,
    product_data.category,
    product_data.brand,
    product_data.size,
    product_data.unit_type,
    product_data.barcode
FROM venues v,
(VALUES 
    ('Stella Artois', 'Beer', 'Stella Artois', '500ml', 'bottle', '5000169005026'),
    ('Guinness Draught', 'Beer', 'Guinness', '440ml', 'can', '5000213102824'),
    ('Jameson Irish Whiskey', 'Spirits', 'Jameson', '700ml', 'bottle', '5011007003043'),
    ('House Red Wine', 'Wine', 'House', '750ml', 'bottle', NULL),
    ('Coca Cola', 'Soft Drinks', 'Coca Cola', '330ml', 'can', '5449000000996')
) AS product_data(name, category, brand, size, unit_type, barcode)
WHERE v.name = 'The Red Lion';
