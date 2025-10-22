-- Complete Stock Data Upload for Monza TECH - All 117 Vehicles
-- This script adds all missing vehicles with complete warranty tracking

-- First, add missing columns if they don't exist
ALTER TABLE public.car_inventory 
ADD COLUMN IF NOT EXISTS vehicle_warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS battery_warranty_expiry DATE,
ADD COLUMN IF NOT EXISTS dms_warranty_deadline DATE,
ADD COLUMN IF NOT EXISTS service_date DATE,
ADD COLUMN IF NOT EXISTS contact_info TEXT;

-- Insert all 117 vehicles (these are NOT duplicates of existing ones)
INSERT INTO public.car_inventory (
    client_name, vin, vehicle_type, color, model, model_year, 
    delivery_date, vehicle_warranty_expiry, battery_warranty_expiry, 
    dms_warranty_deadline, status, notes, created_at, updated_at
) VALUES 
-- Sold Vehicles (77 vehicles)
('Yoland Salem', 'LDP95H961SE900274', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-17', '2030-05-17', '2033-05-17', '2030-08-20', 'Sold', 'Sold', NOW(), NOW()),

('H.E. Saqr Ghabbash Said Ghabbash', 'LDP95H963RE104961', 'REEV', 'BLACK', 'Dream', 2024, 
 '2025-06-03', '2030-06-03', '2033-06-03', '2029-10-15', 'Sold', 'Sold', NOW(), NOW()),

('Assaad Obeid', 'LDP95H960SE900265', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-17', '2030-05-17', '2033-05-17', '2030-08-20', 'Sold', 'Sold', NOW(), NOW()),

('FADI ASSI', 'LDP95H961RE300364', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-05-16', '2030-05-16', '2033-05-16', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('DIAB Hisham Nahed', 'LDP95H963RE300365', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-06-17', '2030-06-17', '2033-06-17', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Mashreq Hospital', 'LDP91E968RE201874', 'REEV', 'BLACK', 'Passion', 2024, 
 '2025-05-23', '2030-05-23', '2033-05-23', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Ali Kobeissy', 'LDP29H923SM520023', 'REEV', 'GREY', 'Mhero', 2025, 
 '2025-05-22', '2030-05-22', '2033-05-22', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Samir Haddad', 'LDP91E968RE201857', 'REEV', 'BLACK', 'Passion', 2024, 
 '2025-05-23', '2030-05-23', '2033-05-23', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Mohamad Kafel', 'LDP95H963SE900258', 'REEV', 'GREY', 'Free', 2025, 
 '2025-06-03', '2030-06-03', '2033-06-03', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Ziad el Sayed', 'LDP95H967RE302345', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-06-19', '2030-06-19', '2033-06-19', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('RAKAN ABDEL WAHAB', 'LDP91E963RE201782', 'REEV', 'BLACK', 'Passion', 2024, 
 '2025-06-17', '2030-06-17', '2033-06-17', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Georges Hraoui', 'LDP95C969SY890014', 'EV', 'WHITE', 'Courage', 2025, 
 '2025-06-17', '2030-06-17', '2033-06-17', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Tarek Darwish', 'LDP95H964SE900267', 'REEV', 'GREY', 'Free', 2025, 
 '2025-06-19', '2030-06-19', '2033-06-19', '2030-08-20', 'Sold', 'Sold', NOW(), NOW()),

('Ramzi Abdo Zidan', 'LDP95H961SE900257', 'REEV', 'GREY', 'Free', 2025, 
 '2025-06-20', '2030-06-20', '2033-06-20', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Fadi Jiji', 'LDP95H966SE900254', 'REEV', 'GREY', 'Free', 2025, 
 '2025-06-24', '2030-06-24', '2033-06-24', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Mhamad Kassem Saleh', 'LDP95H961SE900260', 'REEV', 'GREY', 'Free', 2025, 
 '2025-06-27', '2030-06-27', '2033-06-27', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Hilal Saab', 'LDP91E966SE100256', 'REEV', 'BLACK', 'Passion', 2025, 
 '2025-06-28', '2030-06-28', '2033-06-28', '2030-10-07', 'Sold', 'Sold', NOW(), NOW()),

('Faysal Abdallah', 'LDP91E967RE201901', 'REEV', 'BLACK', 'Passion', 2024, 
 '2025-06-27', '2030-06-27', '2033-06-27', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Roni Abou Khalil', 'LDP95H963SE900275', 'REEV', 'BLACK', 'Free', 2025, 
 '2025-06-28', '2030-06-28', '2033-06-28', '2030-08-20', 'Sold', 'Sold', NOW(), NOW()),

('kareem subra', 'LDP95H965RE301744', 'REEV', 'WHITE', 'Free', 2024, 
 '2025-07-11', '2030-07-11', '2033-07-11', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Nasser El Ek', 'LDP95H962SE900249', 'REEV', 'GREEN', 'Free', 2025, 
 '2025-07-14', '2030-07-14', '2033-07-14', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Mrs. Suhair Khanji', 'LDP95H965SE900262', 'REEV', 'GREY', 'Free', 2025, 
 NULL, '2030-12-30', '2033-12-30', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Hanady Zorkout', 'LDP95C961SY890010', 'REEV', 'WHITE', 'Courage', 2025, 
 '2025-07-11', '2030-07-11', '2033-07-11', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Samer Khanji', 'LDP95C967SY890058', 'EV', 'GREY', 'Courage', 2025, 
 '2025-07-15', '2030-07-15', '2033-07-15', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Georges Hraoui', 'LDP95H965SE900259', 'REEV', 'GREY', 'Free', 2025, 
 '2025-05-22', '2030-05-22', '2033-05-22', '2030-08-21', 'Sold', 'Sold', NOW(), NOW()),

('Jaafar Hamed', 'LDP95H966SE900268', 'REEV', 'BLACK', 'Free', 2025, 
 '2025-05-16', '2030-05-16', '2033-05-16', '2030-08-20', 'Sold', 'Sold', NOW(), NOW()),

('Marianne Joseph Khalaf', 'LDP95C964SY890017', 'EV', 'WHITE', 'COURAGE', 2025, 
 '2025-07-16', '2030-07-16', '2033-07-16', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('MAKRAM BOU HABIB', 'LDP29H927SM520011', 'REEV', 'BLACK', 'MHERO', 2025, 
 '2025-05-06', '2030-05-06', '2033-05-06', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Rabih Mezher', 'LDP29H921SM520019', 'REEV', 'BLACK', 'MHERO', 2025, 
 '2025-05-13', '2030-05-13', '2033-05-13', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('HELMI HAREB', 'LDP29H929SM520026', 'REEV', 'GREY', 'MHERO', 2025, 
 '2025-06-05', '2030-06-05', '2033-06-05', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('MAJED EID', 'LDP29H920SM520030', 'REEV', 'GREY', 'MHERO', 2025, 
 '2025-04-09', '2030-04-09', '2033-04-09', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('HOUSSAM KHANJI', 'LDP29H924SM520029', 'REEV', 'GREY', 'MHERO', 2025, 
 '2025-05-09', '2030-05-09', '2033-05-09', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Wassim Kfoury', 'LDP29H923RM500333', 'REEV', 'FANJING GREEN', 'MHERO', 2024, 
 '2024-10-07', '2029-10-07', '2032-10-07', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Abdel Karim Fanj', 'LDP29H925RM500334', 'REEV', 'GREY', 'MHERO', 2024, 
 '2024-11-05', '2029-11-05', '2032-11-05', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Antoine Hraoui', 'LDP29H925RM520003', 'REEV', 'FANJING GREEN', 'MHERO', 2024, 
 '2024-10-04', '2029-10-04', '2032-10-04', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Fouad Halbawi', 'LDP29H927RM520004', 'REEV', 'GREY', 'MHERO', 2024, 
 '2025-01-07', '2030-01-07', '2033-01-07', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Rabih Abou Dargham', 'LDP95H960RE300811', 'REEV', 'BLACK', 'Free', 2024, 
 '2024-09-09', '2029-09-09', '2032-09-09', '2029-10-15', 'Sold', 'Sold', NOW(), NOW()),

('OMAR HACHWI', 'LDP95H969PE309648', 'REEV', 'BLACK', 'Free', 2023, 
 '2025-06-17', '2030-06-17', '2033-06-17', '2029-06-25', 'Sold', 'Sold', NOW(), NOW()),

('ELHAM KORKOMAZ', 'LDP95C967PE900581', 'REEV', 'WHITE', 'Free', 2023, 
 '2025-05-05', '2030-05-05', '2033-05-05', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('Elie Meouchi', 'LDP91C96XPE203420', 'EV', 'WHITE', 'Passion', 2023, 
 '2025-02-13', '2030-02-13', '2033-02-13', '2029-06-12', 'Sold', 'Sold', NOW(), NOW()),

('Nada Saab', 'LDP95H963PE309631', 'REEV', 'GREEN', 'Free', 2023, 
 '2024-06-21', '2029-06-21', '2032-06-21', NULL, 'Sold', 'NOT ON DMS', NOW(), NOW()),

('MOHAMAD SALAMEH / DANIA NASSER', 'LDP95H966RE301848', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-03-05', '2030-03-05', '2033-03-05', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('Zareh Khederlarian', 'LDP95H96XRE302209', 'REEV', 'GREEN', 'Free', 2024, 
 '2024-06-10', '2029-06-10', '2032-06-10', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('Galina Anatoly Setsokfish', 'LDP95H962RE300812', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-01-20', '2030-01-20', '2033-01-20', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('HSEIN HOTEIT', 'LDP95H963RE300902', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-02-21', '2030-02-21', '2033-02-21', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('ADEL WAKIM / KITCHEN AVENUE', 'LDP95H962RE301863', 'REEV', 'GREEN', 'Free', 2024, 
 '2024-09-03', '2029-09-03', '2032-09-03', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('HICHAM NASSER', 'LDP95H963RE301841', 'REEV', 'GREEN', 'Free', 2024, 
 '2024-06-13', '2029-06-13', '2032-06-13', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('SAMER SAAB', 'LDP95H960RE301828', 'REEV', 'WHITE', 'Free', 2024, 
 '2024-09-17', '2029-09-17', '2032-09-17', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('JOANNA KHANJI', 'LDP95H960RE302378', 'REEV', 'BLACK', 'Free', 2024, 
 '2024-07-10', '2029-07-10', '2032-07-10', '2029-10-07', 'Sold', 'Sold', NOW(), NOW()),

('Fayez Imad Hamoudi', 'LDP95H961RE300963', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-03-05', '2030-03-05', '2033-03-05', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('Anthony Hajjar', 'LDP95H960RE301859', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-01-09', '2030-01-09', '2033-01-09', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('KAREEM KHANJI', 'LDP95H962RE302348', 'REEV', 'GREEN', 'Free', 2024, 
 '2024-07-10', '2029-07-10', '2032-07-10', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('KAREEM GEBARA', 'LDP95H960RE300906', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-04-11', '2030-04-11', '2033-04-11', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('Hadi Halawani', 'LDP95H969RE302377', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-01-07', '2030-01-07', '2033-01-07', '2029-09-07', 'Sold', 'Sold', NOW(), NOW()),

('DANY HERMEZ', 'LDP95H962RE302351', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-02-07', '2030-02-07', '2033-02-07', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Tarek & Sara Kaadan', 'LDP95H965RE300366', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-04-16', '2030-04-16', '2033-04-16', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('BASSAM MHASSEB', 'LDP95H965RE300643', 'REEV', 'GREEN', 'Free', 2024, 
 '2024-11-07', '2029-11-07', '2032-11-07', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('WAEL HOMSI', 'LDP95H967RE300367', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-01-07', '2030-01-07', '2033-01-07', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('NASMA NIZAMEDDINE', 'LDP95H968RE300359', 'REEV', 'GREEN', 'Free', 2024, 
 NULL, NULL, NULL, '2029-10-01', 'Sold', 'Sold, need the selling date', NOW(), NOW()),

('ASSAAD ZOOROB', 'LDP95H968RE302337', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-05-03', '2030-05-03', '2033-05-03', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('CHAHINE KORJIAN', 'LDP95H969RE301858', 'REEV', 'GREEN', 'Free', 2024, 
 '2025-01-24', '2030-01-24', '2033-01-24', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Mohamad Itani', 'LDP95H961RE300915', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-01-31', '2030-01-31', '2033-01-31', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('SAMER ALI HASSAN', 'LDP95H96XRE300816', 'REEV', 'BLACK', 'Free', 2024, 
 '2024-09-23', '2029-09-23', '2032-09-23', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('MOHAMAD BSAT', 'LDP95H96XRE300900', 'REEV', 'BLACK', 'Free', 2024, 
 '2025-02-26', '2030-02-26', '2033-02-26', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Monza SAL / Company Car', 'LDP91E965RE201864', 'REEV', 'BLACK', 'Passion', 2024, 
 '2024-11-20', '2029-11-20', '2032-11-20', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('OUSSAMA CHOUCAIR / PATCHI', 'LDP91E964RE201869', 'REEV', 'BLACK', 'Passion', 2024, 
 '2025-04-03', '2030-04-03', '2033-04-03', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('ALI JAWAD AL ATRACH', 'LDP91E966RE201873', 'REEV', 'BLACK', 'Passion', 2024, 
 NULL, NULL, NULL, '2029-10-01', 'Sold', 'SOLD WITH A SUBDEALER, DELOVEY DATE NEEDED ASAP', NOW(), NOW()),

('SALAM CHARAFELDINE', 'LDP91E969RE201785', 'REEV', 'BLACK', 'Passion', 2024, 
 '2025-02-13', '2030-02-13', '2033-02-13', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Marianne Kadmous wife Alain Debs', 'LDP91E961RE201828', 'REEV', 'WHITE', 'Passion', 2024, 
 '2025-01-07', '2030-01-07', '2033-01-07', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Berti Zein', 'LDP91E963RE201829', 'REEV', 'WHITE', 'Passion', 2024, 
 '2025-02-06', '2030-02-06', '2033-02-06', '2029-10-01', 'Sold', 'Sold', NOW(), NOW()),

('Jaber Jafar', 'LDP95H962RE104949', 'REEV', 'BLACK', 'Dream', 2024, 
 '2025-01-24', '2030-01-24', '2033-01-24', '2029-10-15', 'Sold', 'Sold', NOW(), NOW()),

('Rami Kaddoura', 'LDP95H969RE104950', 'REEV', 'BLACK', 'Dream', 2024, 
 '2024-07-02', '2029-07-02', '2032-07-02', '2029-10-15', 'Sold', 'Sold', NOW(), NOW()),

('MOHAMAD JOMAA', 'LDP95H965RE104945', 'REEV', 'BLACK', 'Dream', 2024, 
 '2024-09-09', '2029-09-09', '2032-09-09', '2029-10-15', 'Sold', 'Sold', NOW(), NOW()),

('NAME NEEDED', 'LDP29H92XSM520018', 'REEV', 'BLACK', 'Mhero', 2025, 
 NULL, NULL, NULL, NULL, 'Sold', 'DELIVERY DATE NEEDED SOLD BY BLACK MOTORS, DETAILS NEEDED', NOW(), NOW()),

('Faraj Kanso', 'LDP29H927SM520025', 'REEV', 'GREY', 'MHERO', 2025, 
 NULL, NULL, NULL, NULL, 'Sold', 'DELIVERY DATE NEEDED', NOW(), NOW()),

-- Available Vehicles (40 vehicles)
('Rishard Hashem', 'LDP29H926SM520016', 'REEV', 'BLACK', 'MHERO', 2025, 
 '2025-07-26', '2030-07-26', '2033-07-26', NULL, 'Available', 'Available', NOW(), NOW()),

('Fares South Dealer', 'LDP95H96XRE300413', 'REEV', 'GREEN', 'Free', 2024, 
 NULL, NULL, NULL, '2029-10-01', 'Available', 'Available', NOW(), NOW()),

('Antoine Daou', 'LDP95H965SE900276', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'TO BE DELIVERED', NOW(), NOW()),

('Available', 'LDP91E963SE100280', 'REEV', 'WHITE', 'PASSION', 2025, 
 NULL, NULL, NULL, '2030-10-07', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP91E965SE100278', 'REEV', 'WHITE', 'PASSION', 2025, 
 NULL, NULL, NULL, '2030-10-07', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP91E962SE100268', 'REEV', 'BLACK', 'PASSION', 2025, 
 NULL, NULL, NULL, '2030-10-07', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95C966SY890018', 'EV', 'WHITE', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP95C965SY890009', 'EV', 'WHITE', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP95C962SY890016', 'EV', 'WHITE', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LGB320H80SW800064', 'EV', 'WHITE', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS (Chinese version)', NOW(), NOW()),

('Available', 'LDP95C960SY890094', 'EV', 'BLACK', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP95C962SY890095', 'EV', 'BLACK', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP95C964SY890096', 'EV', 'BLACK', 'COURAGE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP95C964PE009325', 'EV', 'BLACK', 'DREAM', 2023, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP91C96XPE203188', 'EV', 'BLACK', 'PASSION', 2023, 
 NULL, NULL, NULL, '2029-06-12', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H962RE301829', 'REEV', 'WHITE', 'Free', 2024, 
 NULL, NULL, NULL, '2029-07-01', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H963RE302388', 'REEV', 'WHITE', 'Free', 2024, 
 NULL, NULL, NULL, '2029-09-07', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H967RE301759', 'REEV', 'WHITE', 'Free', 2024, 
 NULL, NULL, NULL, '2029-09-07', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H961RE300655', 'REEV', 'GREEN', 'Free', 2024, 
 NULL, NULL, NULL, '2029-10-01', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H968RE302211', 'REEV', 'GREEN', 'Free', 2024, 
 NULL, NULL, NULL, '2029-10-01', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H968RE301897', 'REEV', 'WHITE', 'Free', 2024, 
 NULL, NULL, NULL, '2029-10-01', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H962RE104952', 'REEV', 'BLACK', 'DREAM', 2024, 
 NULL, NULL, NULL, '2029-10-15', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP29H928SM520017', 'REEV', 'BLACK', 'MHERO', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP29H925SM520024', 'REEV', 'GREY', 'MHERO', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP29H922SM520014', 'REEV', 'FANJING GREEN', 'MHERO', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H962SE900266', 'REEV', 'BLACK', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H963SE009001', 'REEV', 'BLACK', 'FREE', 2025, 
 NULL, NULL, NULL, NULL, 'Available', 'NOT ON DMS', NOW(), NOW()),

('Available', 'LDP95H964SE900270', 'REEV', 'BLACK', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H960SE900248', 'REEV', 'GREEN', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H960SE900251', 'REEV', 'GREEN', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-21', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H969SE900250', 'REEV', 'GREEN', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H962SE900252', 'REEV', 'GREEN', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H963SE900261', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-21', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H964SE900253', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H966SE900271', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H967SE900263', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-21', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H968SE900255', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-21', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H968SE900269', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H968SE900272', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H969SE900264', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H96XSE900256', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-21', 'Available', 'Available', NOW(), NOW()),

('Available', 'LDP95H96XSE900273', 'REEV', 'GREY', 'FREE', 2025, 
 NULL, NULL, NULL, '2030-08-20', 'Available', 'Available', NOW(), NOW());

-- Verify the data was inserted
SELECT COUNT(*) as total_records FROM public.car_inventory;
SELECT status, COUNT(*) as count_by_status FROM public.car_inventory GROUP BY status;
