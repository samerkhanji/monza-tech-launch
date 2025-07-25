-- Insert sample clients
INSERT INTO clients (id, name, phone, email, address, nationality) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'Ahmed Hassan', '+961-70-123456', 'ahmed.hassan@email.com', '123 Beirut Street, Beirut, Lebanon', 'Lebanese'),
  ('550e8400-e29b-41d4-a716-446655440002', 'Maria Silva', '+961-71-234567', 'maria.silva@email.com', '456 Hamra Avenue, Beirut, Lebanon', 'Brazilian'),
  ('550e8400-e29b-41d4-a716-446655440003', 'John Smith', '+961-03-345678', 'john.smith@email.com', '789 Achrafieh Road, Beirut, Lebanon', 'American'),
  ('550e8400-e29b-41d4-a716-446655440004', 'Fatima Al-Zahra', '+961-76-456789', 'fatima.alzahra@email.com', '321 Verdun Street, Beirut, Lebanon', 'Lebanese'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Pierre Dubois', '+961-70-567890', 'pierre.dubois@email.com', '654 Gemmayzeh Lane, Beirut, Lebanon', 'French');

-- Insert sample cars
INSERT INTO cars (
  id, vin_number, model, brand, year, color, category, status, current_location,
  selling_price, purchase_price, range_km, horse_power, torque, acceleration,
  top_speed, charging_time, warranty, manufacturing_date, arrival_date, customs
) VALUES
  -- Showroom Floor 1 Cars
  ('650e8400-e29b-41d4-a716-446655440001', 'WVWZZZ1KZDW123456', 'FREE', 'Voyah', 2024, 'Pearl White', 'EV', 'in_stock', 'Showroom Floor 1', 85000.00, 75000.00, 505, 402, 720, '4.4s', 200, '45 min (DC fast)', '8 years/160,000 km', '2024-01-15', '2024-01-20', 'paid'),
  ('650e8400-e29b-41d4-a716-446655440002', 'WVWZZZ1KZDW123457', 'DREAMER', 'Voyah', 2024, 'Midnight Black', 'REV', 'reserved', 'Showroom Floor 1', 95000.00, 82000.00, 650, 272, 610, '5.8s', 190, '50 min (DC fast)', '8 years/160,000 km', '2024-01-10', '2024-01-25', 'paid'),
  ('650e8400-e29b-41d4-a716-446655440003', 'WVWZZZ1KZDW123458', 'FREE', 'Voyah', 2024, 'Ocean Blue', 'EV', 'in_stock', 'Showroom Floor 1', 87000.00, 76000.00, 505, 402, 720, '4.4s', 200, '45 min (DC fast)', '8 years/160,000 km', '2024-01-12', '2024-01-28', 'paid'),
  
  -- Showroom Floor 2 Cars
  ('650e8400-e29b-41d4-a716-446655440004', 'WVWZZZ1KZDW123459', 'DREAMER', 'Voyah', 2024, 'Silver Metallic', 'REV', 'in_stock', 'Showroom Floor 2', 93000.00, 80000.00, 650, 272, 610, '5.8s', 190, '50 min (DC fast)', '8 years/160,000 km', '2024-01-08', '2024-02-01', 'paid'),
  ('650e8400-e29b-41d4-a716-446655440005', 'WVWZZZ1KZDW123460', 'FREE', 'Voyah', 2024, 'Ruby Red', 'EV', 'sold', 'Showroom Floor 2', 86000.00, 74000.00, 505, 402, 720, '4.4s', 200, '45 min (DC fast)', '8 years/160,000 km', '2024-01-05', '2024-02-03', 'paid'),
  
  -- Garage Cars
  ('650e8400-e29b-41d4-a716-446655440006', 'WVWZZZ1KZDW123461', 'FREE', 'Voyah', 2024, 'Deep Green', 'EV', 'in_stock', 'Garage', 84000.00, 73000.00, 505, 402, 720, '4.4s', 200, '45 min (DC fast)', '8 years/160,000 km', '2024-01-03', '2024-02-05', 'paid'),
  ('650e8400-e29b-41d4-a716-446655440007', 'WVWZZZ1KZDW123462', 'DREAMER', 'Voyah', 2024, 'Champagne Gold', 'REV', 'in_stock', 'Garage', 94000.00, 81000.00, 650, 272, 610, '5.8s', 190, '50 min (DC fast)', '8 years/160,000 km', '2024-01-01', '2024-02-07', 'paid'),
  
  -- Inventory Cars
  ('650e8400-e29b-41d4-a716-446655440008', 'WVWZZZ1KZDW123463', 'FREE', 'Voyah', 2024, 'Storm Gray', 'EV', 'in_stock', 'Inventory', 85500.00, 75500.00, 505, 402, 720, '4.4s', 200, '45 min (DC fast)', '8 years/160,000 km', '2023-12-28', '2024-02-10', 'pending'),
  ('650e8400-e29b-41d4-a716-446655440009', 'WVWZZZ1KZDW123464', 'DREAMER', 'Voyah', 2024, 'Arctic White', 'REV', 'in_stock', 'Inventory', 92000.00, 79000.00, 650, 272, 610, '5.8s', 190, '50 min (DC fast)', '8 years/160,000 km', '2023-12-25', '2024-02-12', 'not_paid'),
  ('650e8400-e29b-41d4-a716-446655440010', 'WVWZZZ1KZDW123465', 'FREE', 'Voyah', 2024, 'Cosmic Purple', 'EV', 'in_stock', 'Inventory', 88000.00, 77000.00, 505, 402, 720, '4.4s', 200, '45 min (DC fast)', '8 years/160,000 km', '2023-12-20', '2024-02-15', 'not_paid');

-- Create car-client links (reservations and sales)
INSERT INTO car_client_links (car_id, client_id, link_type, delivery_date, sale_price) VALUES
  ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'reserved', '2024-03-01', 95000.00),
  ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'sold', '2024-02-20', 86000.00);

-- Insert sample parts inventory
INSERT INTO parts_inventory (
  id, part_number, part_name, description, category, compatible_models,
  quantity_in_stock, minimum_stock_level, cost_price, selling_price,
  supplier_name, storage_location
) VALUES
  ('750e8400-e29b-41d4-a716-446655440001', 'VH-BAT-001', 'High Voltage Battery Pack', 'Main battery pack for EV models', 'Battery', ARRAY['FREE'], 5, 2, 15000.00, 18000.00, 'Voyah Parts Supplier', 'A-1-01'),
  ('750e8400-e29b-41d4-a716-446655440002', 'VH-MOT-001', 'Front Electric Motor', 'Front axle electric motor', 'Motor', ARRAY['FREE', 'DREAMER'], 8, 3, 8000.00, 10000.00, 'Voyah Parts Supplier', 'A-1-02'),
  ('750e8400-e29b-41d4-a716-446655440003', 'VH-MOT-002', 'Rear Electric Motor', 'Rear axle electric motor', 'Motor', ARRAY['FREE', 'DREAMER'], 6, 3, 8500.00, 10500.00, 'Voyah Parts Supplier', 'A-1-03'),
  ('750e8400-e29b-41d4-a716-446655440004', 'VH-CHG-001', 'Onboard Charger', 'AC charging unit', 'Charging', ARRAY['FREE', 'DREAMER'], 12, 4, 2500.00, 3200.00, 'Voyah Parts Supplier', 'A-2-01'),
  ('750e8400-e29b-41d4-a716-446655440005', 'VH-BRK-001', 'Brake Pads Set', 'Complete brake pad set', 'Brakes', ARRAY['FREE', 'DREAMER'], 25, 10, 350.00, 450.00, 'Voyah Parts Supplier', 'B-1-01'),
  ('750e8400-e29b-41d4-a716-446655440006', 'VH-TIR-001', 'Tire Set (4)', 'Complete tire set', 'Tires', ARRAY['FREE', 'DREAMER'], 15, 8, 800.00, 1200.00, 'Tire Supplier Co.', 'C-1-01'),
  ('750e8400-e29b-41d4-a716-446655440007', 'VH-FIL-001', 'Air Filter', 'Cabin air filter', 'Filters', ARRAY['FREE', 'DREAMER'], 30, 15, 45.00, 65.00, 'Filter Tech Ltd.', 'B-2-01'),
  ('750e8400-e29b-41d4-a716-446655440008', 'VH-REX-001', 'Range Extender Unit', 'Range extender engine for REV models', 'Engine', ARRAY['DREAMER'], 3, 1, 12000.00, 15000.00, 'Voyah Parts Supplier', 'A-3-01');

-- Insert sample PDI inspections
INSERT INTO pdi_inspections (
  id, car_id, status, technician_name, start_date, completion_date,
  exterior_inspection, interior_inspection, engine_inspection, electronics_inspection,
  battery_inspection, charging_system_inspection, software_update, overall_score, notes
) VALUES
  ('850e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'completed', 'Hassan Mechanical', '2024-01-21', '2024-01-22', true, true, true, true, true, true, true, 95, 'Excellent condition, all systems working perfectly'),
  ('850e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440002', 'completed', 'Ahmad Tech', '2024-01-26', '2024-01-27', true, true, true, true, true, true, true, 92, 'Minor software update required, completed successfully'),
  ('850e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', 'pending', 'Hassan Mechanical', '2024-01-29', NULL, false, false, false, false, false, false, false, NULL, 'Scheduled for inspection'),
  ('850e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440006', 'in_progress', 'Ahmad Tech', '2024-02-06', NULL, true, true, false, false, false, false, false, NULL, 'Currently under inspection');

-- Insert sample test drives
INSERT INTO test_drives (
  id, car_id, client_id, type, driver_name, driver_phone, driver_license,
  scheduled_start, scheduled_end, actual_start, actual_end, is_active, completed,
  driver_feedback, technician_notes
) VALUES
  ('950e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 'client', 'Maria Silva', '+961-71-234567', 'DL123456789', '2024-02-01 10:00:00+00', '2024-02-01 11:00:00+00', '2024-02-01 10:05:00+00', '2024-02-01 10:55:00+00', false, true, 'Excellent driving experience, very smooth and quiet', 'Car performed well, no issues noted'),
  ('950e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'client', 'Fatima Al-Zahra', '+961-76-456789', 'DL987654321', '2024-02-03 14:00:00+00', '2024-02-03 15:00:00+00', '2024-02-03 14:10:00+00', '2024-02-03 15:05:00+00', false, true, 'Love the hybrid system, very efficient', 'Range extender worked perfectly'),
  ('950e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440005', 'client', 'Pierre Dubois', '+961-70-567890', 'DL456789123', '2024-02-15 16:00:00+00', '2024-02-15 17:00:00+00', NULL, NULL, true, false, NULL, 'Scheduled for today');

-- Insert sample parts usage
INSERT INTO parts_usage (car_id, part_id, quantity_used, used_for, usage_date, notes) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440007', 1, 'pdi', '2024-01-22', 'Replaced air filter during PDI'),
  ('650e8400-e29b-41d4-a716-446655440002', '750e8400-e29b-41d4-a716-446655440005', 1, 'pdi', '2024-01-27', 'Brake pad inspection and replacement'),
  ('650e8400-e29b-41d4-a716-446655440006', '750e8400-e29b-41d4-a716-446655440004', 1, 'repair', '2024-02-06', 'Charger unit replacement');

-- Update parts inventory quantities after usage
UPDATE parts_inventory SET quantity_in_stock = quantity_in_stock - 1 WHERE id = '750e8400-e29b-41d4-a716-446655440007';
UPDATE parts_inventory SET quantity_in_stock = quantity_in_stock - 1 WHERE id = '750e8400-e29b-41d4-a716-446655440005';
UPDATE parts_inventory SET quantity_in_stock = quantity_in_stock - 1 WHERE id = '750e8400-e29b-41d4-a716-446655440004';

-- Insert sample financial records
INSERT INTO financial_records (
  id, car_id, client_id, type, amount, currency, description, transaction_date
) VALUES
  ('450e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', 'sale', 86000.00, 'USD', 'Car sale - FREE Pearl White 2024', '2024-02-20'),
  ('450e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440001', NULL, 'purchase', 75000.00, 'USD', 'Car purchase from manufacturer', '2024-01-20'),
  ('450e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440002', NULL, 'purchase', 82000.00, 'USD', 'Car purchase from manufacturer', '2024-01-25'),
  ('450e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440001', NULL, 'customs', 5000.00, 'USD', 'Customs duties and fees', '2024-01-21');

-- Insert sample car movements
INSERT INTO car_movements (car_id, from_location, to_location, movement_date, reason) VALUES
  ('650e8400-e29b-41d4-a716-446655440001', 'Inventory', 'Showroom Floor 1', '2024-01-23', 'Moved to showroom after PDI completion'),
  ('650e8400-e29b-41d4-a716-446655440002', 'Inventory', 'Showroom Floor 1', '2024-01-28', 'Moved to showroom after PDI completion'),
  ('650e8400-e29b-41d4-a716-446655440003', 'Inventory', 'Showroom Floor 1', '2024-01-30', 'Moved to showroom for display'),
  ('650e8400-e29b-41d4-a716-446655440006', 'Inventory', 'Garage', '2024-02-06', 'Moved to garage for maintenance');

-- Create some sample garage status updates
UPDATE cars SET garage_status = 'in_repair', garage_notes = 'Charger unit replacement in progress' 
WHERE id = '650e8400-e29b-41d4-a716-446655440006';

UPDATE cars SET garage_status = 'stored', garage_notes = 'Awaiting PDI inspection'
WHERE id = '650e8400-e29b-41d4-a716-446655440007';

-- Set some custom features for cars
UPDATE cars SET features = ARRAY['Panoramic Sunroof', 'Premium Audio System', 'Heated Seats', 'Wireless Charging', 'Advanced Driver Assistance'] 
WHERE category = 'EV';

UPDATE cars SET features = ARRAY['Panoramic Sunroof', 'Premium Audio System', 'Heated Seats', 'Wireless Charging', 'Range Extender', 'Hybrid System'] 
WHERE category = 'REV'; 