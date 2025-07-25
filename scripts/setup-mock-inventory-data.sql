-- Mock Inventory Data for Parts Tracking System
-- This script populates the inventory_items table with realistic parts data

-- Clear existing data (optional - remove if you want to keep existing data)
-- DELETE FROM inventory_items;

-- Insert comprehensive parts inventory matching garage schedule usage
INSERT INTO inventory_items (
  part_number, part_name, car_model, quantity, cost_per_unit, supplier, 
  location, shelf, row_position, column_position, created_at, last_updated
) VALUES 

-- Electrical Parts (for VF2024-E001 and MH2024-E002)
('CHG-PORT-VF24', 'Charging Port Assembly', 'Voyah Free 2024', 8, 285.50, 'Voyah Parts UAE', 
 'Electrical Storage', 'E1', '1', 'A', now(), now()),
('BMS-CTRL-001', 'Battery Management Controller', 'Voyah Free 2024', 5, 445.00, 'Advanced EV Components', 
 'Electrical Storage', 'E1', '2', 'A', now(), now()),
('CHG-CABLE-HV', 'High Voltage Charging Cable', 'Voyah Free 2024', 12, 125.75, 'HV Cable Solutions', 
 'Electrical Storage', 'E1', '3', 'A', now(), now()),
('FUSE-HV-40A', 'High Voltage Fuse 40A', 'Universal', 25, 25.00, 'Electrical Components Ltd', 
 'Electrical Storage', 'E2', '1', 'A', now(), now()),
('HEADLIGHT-LED-MH', 'LED Headlight Assembly', 'MHero 917 2024', 6, 385.00, 'MHero Parts Center', 
 'Electrical Storage', 'E2', '2', 'B', now(), now()),
('HEADLIGHT-BULB-H7', 'H7 LED Headlight Bulb', 'Universal', 20, 45.50, 'Philips Automotive', 
 'Electrical Storage', 'E2', '3', 'B', now(), now()),

-- Paint Shop Parts (for VD2025-P001 and VP2024-P002)
('PAINT-PW-001', 'Pearl White Premium Paint', 'Voyah Dream 2025', 15, 65.00, 'Premium Auto Paints', 
 'Paint Storage', 'P1', '1', 'A', now(), now()),
('PRIMER-HQ-001', 'High Quality Primer', 'Universal', 25, 42.75, 'Auto Paint Solutions', 
 'Paint Storage', 'P1', '2', 'A', now(), now()),
('CERAMIC-COAT', 'Ceramic Coating Solution', 'Universal', 8, 320.00, 'Ceramic Pro UAE', 
 'Paint Storage', 'P1', '3', 'A', now(), now()),
('CLEAR-COAT-PR', 'Premium Clear Coat', 'Universal', 18, 72.50, 'Premium Auto Paints', 
 'Paint Storage', 'P2', '1', 'B', now(), now()),
('SAND-PAPER-2K', 'Professional Sandpaper Set', 'Universal', 30, 45.00, ' 3M Automotive', 
 'Paint Storage', 'P2', '2', 'B', now(), now()),
('TOUCH-UP-PAINT', 'Touch-up Paint Pen', 'Voyah Passion 2024', 12, 35.00, 'Voyah Parts UAE', 
 'Paint Storage', 'P2', '3', 'B', now(), now()),

-- Mechanical Parts (for VF2024-M001 and VD2025-M002)
('BRAKE-PAD-FR', 'Front Brake Pads Premium', 'Voyah Free 2024', 15, 125.00, 'Brembo UAE', 
 'Mechanical Storage', 'M1', '1', 'A', now(), now()),
('BRAKE-PAD-RR', 'Rear Brake Pads Premium', 'Voyah Free 2024', 12, 110.00, 'Brembo UAE', 
 'Mechanical Storage', 'M1', '2', 'A', now(), now()),
('BRAKE-ROTOR-FR', 'Front Brake Rotors', 'Voyah Free 2024', 8, 92.50, 'Brembo UAE', 
 'Mechanical Storage', 'M1', '3', 'A', now(), now()),
('BRAKE-FLUID-DOT4', 'DOT4 Brake Fluid', 'Universal', 35, 17.50, 'Castrol UAE', 
 'Mechanical Storage', 'M2', '1', 'B', now(), now()),
('TRANS-FLUID-VF', 'Transmission Fluid Voyah', 'Voyah Free 2024', 20, 21.25, 'Voyah Parts UAE', 
 'Mechanical Storage', 'M2', '2', 'B', now(), now()),
('TRANS-FILTER', 'Transmission Filter', 'Voyah Free 2024', 10, 65.00, 'Voyah Parts UAE', 
 'Mechanical Storage', 'M2', '3', 'B', now(), now()),
('AIR-STRUT-FR-VD', 'Front Air Suspension Strut', 'Voyah Dream 2025', 4, 242.50, 'Voyah Parts UAE', 
 'Mechanical Storage', 'M3', '1', 'C', now(), now()),
('AIR-COMPRESSOR', 'Air Suspension Compressor', 'Voyah Dream 2025', 3, 325.00, 'Voyah Parts UAE', 
 'Mechanical Storage', 'M3', '2', 'C', now(), now()),
('SUSP-CONTROL-MOD', 'Suspension Control Module', 'Voyah Dream 2025', 2, 225.00, 'Voyah Parts UAE', 
 'Mechanical Storage', 'M3', '3', 'C', now(), now()),

-- Detailing Supplies (for MH2024-D001)
('DETL-SHAMPOO', 'Premium Car Shampoo', 'Universal', 25, 25.00, 'Chemical Guys UAE', 
 'Detailing Storage', 'D1', '1', 'A', now(), now()),
('DETL-WAX-CERAM', 'Ceramic Wax Coating', 'Universal', 15, 85.00, 'Ceramic Pro UAE', 
 'Detailing Storage', 'D1', '2', 'A', now(), now()),
('DETL-POLISH', 'Professional Polish', 'Universal', 20, 35.00, 'Meguiars UAE', 
 'Detailing Storage', 'D1', '3', 'A', now(), now()),
('DETL-INT-CLEAN', 'Interior Cleaner Premium', 'Universal', 18, 45.00, 'Chemical Guys UAE', 
 'Detailing Storage', 'D2', '1', 'B', now(), now()),
('DETL-MICROFIBER', 'Microfiber Cloth Set', 'Universal', 50, 20.00, 'Autogeek UAE', 
 'Detailing Storage', 'D2', '2', 'B', now(), now()),

-- Body Work Parts (for VP2024-B001)
('DOOR-PANEL-VP-FR', 'Front Door Panel VP2024', 'Voyah Passion 2024', 6, 485.00, 'Voyah Parts UAE', 
 'Body Work Storage', 'B1', '1', 'A', now(), now()),
('DOOR-HANDLE-INT', 'Interior Door Handle', 'Voyah Passion 2024', 12, 65.00, 'Voyah Parts UAE', 
 'Body Work Storage', 'B1', '2', 'A', now(), now()),
('DOOR-SEAL-RUBBER', 'Door Rubber Seal', 'Universal', 25, 35.00, 'Auto Seals UAE', 
 'Body Work Storage', 'B1', '3', 'A', now(), now()),
('BODY-ADHESIVE', 'Structural Adhesive', 'Universal', 15, 45.00, '3M Automotive', 
 'Body Work Storage', 'B2', '1', 'B', now(), now()),
('BOLT-SET-DOOR', 'Door Mounting Bolt Set', 'Universal', 30, 25.00, 'Fasteners UAE', 
 'Body Work Storage', 'B2', '2', 'B', now(), now()),

-- Additional Common Parts
('OIL-FILTER-UNIV', 'Universal Oil Filter', 'Universal', 40, 15.50, 'Mann Filter UAE', 
 'General Storage', 'G1', '1', 'A', now(), now()),
('ENGINE-OIL-5W30', 'Engine Oil 5W-30 Synthetic', 'Universal', 60, 35.00, 'Castrol UAE', 
 'General Storage', 'G1', '2', 'A', now(), now()),
('COOLANT-FLUID', 'Engine Coolant Fluid', 'Universal', 30, 28.50, 'Prestone UAE', 
 'General Storage', 'G1', '3', 'A', now(), now()),
('DIAG-FLUID', 'Diagnostic Test Fluid', 'Universal', 10, 15.00, 'Diagnostic Tools UAE', 
 'General Storage', 'G2', '1', 'B', now(), now()),
('BATTERY-12V', '12V Car Battery', 'Universal', 8, 185.00, 'Varta UAE', 
 'General Storage', 'G2', '2', 'B', now(), now()),
('TIRE-SEALANT', 'Emergency Tire Sealant', 'Universal', 25, 22.50, 'Slime UAE', 
 'General Storage', 'G2', '3', 'B', now(), now()),

-- Low Stock Items (for testing alerts)
('LOW-STOCK-001', 'Critical Low Stock Part', 'Universal', 2, 125.00, 'Test Supplier', 
 'Test Storage', 'T1', '1', 'A', now(), now()),
('LOW-STOCK-002', 'Medium Low Stock Part', 'Universal', 5, 85.00, 'Test Supplier', 
 'Test Storage', 'T1', '2', 'A', now(), now()),
('OUT-OF-STOCK', 'Out of Stock Part', 'Universal', 0, 95.00, 'Test Supplier', 
 'Test Storage', 'T1', '3', 'A', now(), now());

-- Insert some parts usage tracking data for demonstration
INSERT INTO parts_usage_tracking (
  part_number, part_name, quantity, car_vin, car_model, client_name, 
  client_phone, client_license_plate, technician, usage_date, cost_per_unit, total_cost,
  location_used, repair_type, notes
) VALUES 
('CHG-PORT-VF24', 'Charging Port Assembly', 1, 'VF2024-E001', 'Voyah Free 2024', 'Ahmad Al-Mansouri',
 '+971 50 123 4567', 'A12345', 'Carlos Martinez', now() - interval '2 hours', 285.50, 285.50,
 'Electrical Bay', 'Charging System Repair', 'Replaced faulty charging port - customer reported slow charging'),

('BRAKE-PAD-FR', 'Front Brake Pads Premium', 1, 'VF2024-M001', 'Voyah Free 2024', 'Omar Al-Maktoum',
 '+971 50 456 7890', 'B67890', 'Mike Johnson', now() - interval '4 hours', 125.00, 125.00,
 'Mechanical Bay', 'Brake System Overhaul', 'Front brake pads worn to metal - grinding noise reported'),

('DETL-SHAMPOO', 'Premium Car Shampoo', 1, 'MH2024-D001', 'MHero 917 2024', 'Khalid Al-Mansoori',
 '+971 55 234 5678', 'C11111', 'Kevin Zhang', now() - interval '6 hours', 25.00, 25.00,
 'Detailing Bay', 'Full Detailing Service', 'Complete interior and exterior detailing with ceramic coating'),

('PAINT-PW-001', 'Pearl White Premium Paint', 2, 'VD2025-P001', 'Voyah Dream 2025', 'Mohammed bin Rashid',
 '+971 55 987 6543', 'VIP001', 'Antonio Garcia', now() - interval '8 hours', 65.00, 130.00,
 'Paint Bay', 'Premium Paint Job', 'VIP customer - premium pearl white paint with ceramic coating');

-- Create some sample reorder alerts
INSERT INTO parts_reorder_alerts (
  part_number, part_name, current_stock, minimum_threshold, reorder_quantity,
  alert_level, priority, estimated_cost, supplier_info
) VALUES 
('LOW-STOCK-001', 'Critical Low Stock Part', 2, 5, 20, 'critical', 4, 2500.00, 
 '{"supplier": "Test Supplier", "contact": "+971-50-999-8888", "lead_time": "3-5 days"}'),
('OUT-OF-STOCK', 'Out of Stock Part', 0, 5, 15, 'out_of_stock', 4, 1425.00,
 '{"supplier": "Test Supplier", "contact": "+971-50-999-8888", "lead_time": "5-7 days"}'),
('LOW-STOCK-002', 'Medium Low Stock Part', 5, 10, 25, 'low', 2, 2125.00,
 '{"supplier": "Test Supplier", "contact": "+971-50-999-8888", "lead_time": "2-3 days"}');

-- Update last_updated timestamps to show recent activity
UPDATE inventory_items SET last_updated = now() - interval '1 hour' WHERE part_number IN ('CHG-PORT-VF24', 'BRAKE-PAD-FR');
UPDATE inventory_items SET last_updated = now() - interval '2 hours' WHERE part_number IN ('DETL-SHAMPOO', 'PAINT-PW-001');
UPDATE inventory_items SET last_updated = now() - interval '30 minutes' WHERE part_number LIKE 'LOW-STOCK%' OR part_number = 'OUT-OF-STOCK';

-- Decrease quantities for parts that have been used (simulate real usage)
UPDATE inventory_items SET quantity = quantity - 1 WHERE part_number = 'CHG-PORT-VF24';
UPDATE inventory_items SET quantity = quantity - 1 WHERE part_number = 'BRAKE-PAD-FR';
UPDATE inventory_items SET quantity = quantity - 1 WHERE part_number = 'DETL-SHAMPOO';
UPDATE inventory_items SET quantity = quantity - 2 WHERE part_number = 'PAINT-PW-001';

-- Add some barcode mappings for testing the scanner
INSERT INTO parts_barcode_mappings (part_number, barcode_value, barcode_type, is_primary) VALUES
('CHG-PORT-VF24', '1234567890123', 'CODE128', true),
('BRAKE-PAD-FR', '2345678901234', 'CODE128', true),
('PAINT-PW-001', '3456789012345', 'CODE128', true),
('DETL-SHAMPOO', '4567890123456', 'CODE128', true),
('DOOR-PANEL-VP-FR', '5678901234567', 'CODE128', true)
ON CONFLICT (barcode_value) DO NOTHING; 