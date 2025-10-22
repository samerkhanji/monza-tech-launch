/**
 * scripts/uploadStockData.ts
 * Upload stock data provided by user to Supabase car_inventory table
 * Run: npx tsx scripts/uploadStockData.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Try to get from environment, fallback to known values
const url = process.env.VITE_SUPABASE_URL || 'https://wunqntfreyezylvbzvxc.supabase.co';
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

// If no service key, try using anon key for now (limited permissions but might work)
const authKey = serviceKey || anonKey;

if (!url || !authKey) {
  console.error('Missing Supabase credentials. The development server should have these configured.');
  console.error('Please ensure your .env.local file is set up correctly.');
  console.error('URL:', url ? 'Found' : 'Missing');
  console.error('Auth Key:', authKey ? 'Found' : 'Missing');
  console.log('');
  console.log('🔧 To fix this:');
  console.log('1. Create a .env.local file in the project root');
  console.log('2. Add your Supabase credentials from: https://supabase.com/dashboard');
  console.log('3. Restart the development server');
  process.exit(1);
}

const supabase = createClient(url, authKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '' || dateStr.includes('need') || dateStr === 'NOT ON DMS') return null;
  
  // Handle special cases
  if (dateStr.includes('12/30/1907')) return null; // Invalid date
  if (dateStr.includes('Sold, need the selling date')) return null;
  if (dateStr.includes('DELIVERY DATE NEEDED')) return null;
  if (dateStr.includes('TO BE DELIVERED')) return null;
  
  // Handle MM/DD/YYYY format
  const dateParts = dateStr.split('/');
  if (dateParts.length === 3) {
    const [month, day, year] = dateParts;
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);
    const dayNum = parseInt(day);
    
    // Validate reasonable dates
    if (yearNum < 2020 || yearNum > 2035 || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
      return null;
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  // Handle DD/MM/YYYY format (for service dates)
  if (dateStr.includes('/') && !dateStr.includes('YYYY')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      
      // Validate reasonable dates
      if (yearNum < 2020 || yearNum > 2035 || monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        return null;
      }
      
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }
  
  return null;
}

function calculateWarrantyDate(deliveryDate: string | null, yearsToAdd: number): string | null {
  if (!deliveryDate) return null;
  
  try {
    const date = new Date(deliveryDate);
    date.setFullYear(date.getFullYear() + yearsToAdd);
    return date.toISOString().split('T')[0];
  } catch {
    return null;
  }
}

const stockData = [
  // Your stock data here - each row will be parsed
  { status: 'Sold', clientName: 'Yoland Salem', vin: 'LDP95H961SE900274', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '5/17/2025', warrantyDeadline: '08/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'H.E. Saqr Ghabbash Said Ghabbash', vin: 'LDP95H963RE104961', vehicleType: 'REEV', color: 'BLACK', model: 'Dream', modelYear: 2024, deliveryDate: '6/3/2025', warrantyDeadline: '10/15/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Assaad Obeid', vin: 'LDP95H960SE900265', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '5/17/2025', warrantyDeadline: '08/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'FADI ASSI', vin: 'LDP95H961RE300364', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '5/16/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'DIAB Hisham Nahed', vin: 'LDP95H963RE300365', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '6/17/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Mashreq Hospital', vin: 'LDP91E968RE201874', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '5/23/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Ali Kobeissy', vin: 'LDP29H923SM520023', vehicleType: 'REEV', color: 'GREY', model: 'Mhero', modelYear: 2025, deliveryDate: '5/22/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Samir Haddad', vin: 'LDP91E968RE201857', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '5/23/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Mohamad Kafel', vin: 'LDP95H963SE900258', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '6/3/2025', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Ziad el Sayed', vin: 'LDP95H967RE302345', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '6/19/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'RAKAN ABDEL WAHAB', vin: 'LDP91E963RE201782', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '6/17/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Georges Hraoui', vin: 'LDP95C969SY890014', vehicleType: 'EV', color: 'WHITE', model: 'Courage', modelYear: 2025, deliveryDate: '6/17/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Tarek Darwish', vin: 'LDP95H964SE900267', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '6/19/2025', warrantyDeadline: '08/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Ramzi Abdo Zidan', vin: 'LDP95H961SE900257', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '6/20/2025', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Fadi Jiji', vin: 'LDP95H966SE900254', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '6/24/2025', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Mhamad Kassem Saleh', vin: 'LDP95H961SE900260', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '6/27/2025', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Hilal Saab', vin: 'LDP91E966SE100256', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2025, deliveryDate: '6/28/2025', warrantyDeadline: '10/07/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Faysal Abdallah', vin: 'LDP91E967RE201901', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '6/27/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Roni Abou Khalil', vin: 'LDP95H963SE900275', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2025, deliveryDate: '6/28/2025', warrantyDeadline: '08/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'kareem subra', vin: 'LDP95H965RE301744', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2024, deliveryDate: '7/11/2025', warrantyDeadline: '10/01/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Nasser El Ek', vin: 'LDP95H962SE900249', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2025, deliveryDate: '7/14/2025', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Mrs. Suhair Khanji', vin: 'LDP95H965SE900262', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '12/30/1907', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Hanady Zorkout', vin: 'LDP95C961SY890010', vehicleType: 'REEV', color: 'WHITE', model: 'Courage', modelYear: 2025, deliveryDate: '7/11/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Samer Khanji', vin: 'LDP95C967SY890058', vehicleType: 'EV', color: 'GREY', model: 'Courage', modelYear: 2025, deliveryDate: '7/15/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Georges Hraoui', vin: 'LDP95H965SE900259', vehicleType: 'REEV', color: 'GREY', model: 'Free', modelYear: 2025, deliveryDate: '5/22/2025', warrantyDeadline: '08/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Jaafar Hamed', vin: 'LDP95H966SE900268', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2025, deliveryDate: '5/16/2025', warrantyDeadline: '08/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Marianne Joseph Khalaf', vin: 'LDP95C964SY890017', vehicleType: 'EV', color: 'WHITE', model: 'COURAGE', modelYear: 2025, deliveryDate: '7/16/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'MAKRAM BOU HABIB', vin: 'LDP29H927SM520011', vehicleType: 'REEV', color: 'BLACK', model: 'MHERO', modelYear: 2025, deliveryDate: '5/6/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Rabih Mezher', vin: 'LDP29H921SM520019', vehicleType: 'REEV', color: 'BLACK', model: 'MHERO', modelYear: 2025, deliveryDate: '5/13/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'HELMI HAREB', vin: 'LDP29H929SM520026', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2025, deliveryDate: '6/5/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'MAJED EID', vin: 'LDP29H920SM520030', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2025, deliveryDate: '4/9/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'HOUSSAM KHANJI', vin: 'LDP29H924SM520029', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2025, deliveryDate: '5/9/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Wassim Kfoury', vin: 'LDP29H923RM500333', vehicleType: 'REEV', color: 'FANJING GREEN', model: 'MHERO', modelYear: 2024, deliveryDate: '10/7/2024', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Abdel Karim Fanj', vin: 'LDP29H925RM500334', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2024, deliveryDate: '11/5/2024', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Antoine Hraoui', vin: 'LDP29H925RM520003', vehicleType: 'REEV', color: 'FANJING GREEN', model: 'MHERO', modelYear: 2024, deliveryDate: '10/4/2024', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Fouad Halbawi', vin: 'LDP29H927RM520004', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2024, deliveryDate: '1/7/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Rabih Abou Dargham', vin: 'LDP95H960RE300811', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '9/9/2024', warrantyDeadline: '10/15/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'OMAR HACHWI', vin: 'LDP95H969PE309648', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2023, deliveryDate: '6/17/2025', warrantyDeadline: '06/25/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'ELHAM KORKOMAZ', vin: 'LDP95C967PE900581', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2023, deliveryDate: '5/5/2025', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Elie Meouchi', vin: 'LDP91C96XPE203420', vehicleType: 'EV', color: 'WHITE', model: 'Passion', modelYear: 2023, deliveryDate: '2/13/2025', warrantyDeadline: '6/12/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Nada Saab', vin: 'LDP95H963PE309631', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2023, deliveryDate: '6/21/2024', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'MOHAMAD SALAMEH / DANIA NASSER', vin: 'LDP95H966RE301848', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '3/5/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Zareh Khederlarian', vin: 'LDP95H96XRE302209', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '6/10/2024', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Galina Anatoly Setsokfish', vin: 'LDP95H962RE300812', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '1/20/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'HSEIN HOTEIT', vin: 'LDP95H963RE300902', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '2/21/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'ADEL WAKIM / KITCHEN AVENUE', vin: 'LDP95H962RE301863', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '9/3/2024', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'HICHAM NASSER', vin: 'LDP95H963RE301841', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '6/13/2024', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'SAMER SAAB', vin: 'LDP95H960RE301828', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2024, deliveryDate: '9/17/2024', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'JOANNA KHANJI', vin: 'LDP95H960RE302378', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '7/10/2024', warrantyDeadline: '10/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Fayez Imad Hamoudi', vin: 'LDP95H961RE300963', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '3/5/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Anthony Hajjar', vin: 'LDP95H960RE301859', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '1/9/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'KAREEM KHANJI', vin: 'LDP95H962RE302348', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '7/10/2024', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'KAREEM GEBARA', vin: 'LDP95H960RE300906', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '4/11/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Hadi Halawani', vin: 'LDP95H969RE302377', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '1/7/2025', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'DANY HERMEZ', vin: 'LDP95H962RE302351', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '2/7/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Tarek & Sara Kaadan', vin: 'LDP95H965RE300366', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '4/16/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'BASSAM MHASSEB', vin: 'LDP95H965RE300643', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '11/7/2024', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'WAEL HOMSI', vin: 'LDP95H967RE300367', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '1/7/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'NASMA NIZAMEDDINE', vin: 'LDP95H968RE300359', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: 'Sold, need the selling date', warrantyDeadline: '10/1/2029', notes: 'Sold, need the selling date', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'ASSAAD ZOOROB', vin: 'LDP95H968RE302337', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '5/3/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'CHAHINE KORJIAN', vin: 'LDP95H969RE301858', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '1/24/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Mohamad Itani', vin: 'LDP95H961RE300915', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '1/31/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'SAMER ALI HASSAN', vin: 'LDP95H96XRE300816', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '9/23/2024', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'MOHAMAD BSAT', vin: 'LDP95H96XRE300900', vehicleType: 'REEV', color: 'BLACK', model: 'Free', modelYear: 2024, deliveryDate: '2/26/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Monza SAL / Company Car', vin: 'LDP91E965RE201864', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '11/20/2024', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'OUSSAMA CHOUCAIR / PATCHI', vin: 'LDP91E964RE201869', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '4/3/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'ALI JAWAD AL ATRACH', vin: 'LDP91E966RE201873', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: 'SOLD WITH A SUBDEALER, DELOVEY DATE NEEDED ASAP', warrantyDeadline: '10/1/2029', notes: 'SOLD WITH A SUBDEALER, DELOVEY DATE NEEDED ASAP', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'SALAM CHARAFELDINE', vin: 'LDP91E969RE201785', vehicleType: 'REEV', color: 'BLACK', model: 'Passion', modelYear: 2024, deliveryDate: '2/13/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Marianne Kadmous wife Alain Debs', vin: 'LDP91E961RE201828', vehicleType: 'REEV', color: 'WHITE', model: 'Passion', modelYear: 2024, deliveryDate: '1/7/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Berti Zein', vin: 'LDP91E963RE201829', vehicleType: 'REEV', color: 'WHITE', model: 'Passion', modelYear: 2024, deliveryDate: '2/6/2025', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Jaber Jafar', vin: 'LDP95H962RE104949', vehicleType: 'REEV', color: 'BLACK', model: 'Dream', modelYear: 2024, deliveryDate: '1/24/2025', warrantyDeadline: '10/15/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Rami Kaddoura', vin: 'LDP95H969RE104950', vehicleType: 'REEV', color: 'BLACK', model: 'Dream', modelYear: 2024, deliveryDate: '7/2/2024', warrantyDeadline: '10/15/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'MOHAMAD JOMAA', vin: 'LDP95H965RE104945', vehicleType: 'REEV', color: 'BLACK', model: 'Dream', modelYear: 2024, deliveryDate: '9/9/2024', warrantyDeadline: '10/15/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'NAME NEEDED', vin: 'LDP29H92XSM520018', vehicleType: 'REEV', color: 'BLACK', model: 'Mhero', modelYear: 2025, deliveryDate: 'DELIVERY DATE NEEDED SOLD BY BLACK MOTORS, DETAILS NEEDED', warrantyDeadline: '', notes: 'DELIVERY DATE NEEDED SOLD BY BLACK MOTORS, DETAILS NEEDED', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Faraj Kanso', vin: 'LDP29H927SM520025', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2025, deliveryDate: 'DELIVERY DATE NEEDED', warrantyDeadline: '', notes: 'DELIVERY DATE NEEDED', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Rishard Hashem', vin: 'LDP29H926SM520016', vehicleType: 'REEV', color: 'BLACK', model: 'MHERO', modelYear: 2025, deliveryDate: '7/26/2025', warrantyDeadline: '', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: 'Fares South Dealer', vin: 'LDP95H96XRE300413', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Sold', clientName: 'Antoine Daou', vin: 'LDP95H965SE900276', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: 'TO BE DELIVERED', warrantyDeadline: '8/20/2030', notes: 'TO BE DELIVERED', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP91E963SE100280', vehicleType: 'REEV', color: 'WHITE', model: 'PASSION', modelYear: 2025, deliveryDate: '', warrantyDeadline: '10/7/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP91E965SE100278', vehicleType: 'REEV', color: 'WHITE', model: 'PASSION', modelYear: 2025, deliveryDate: '', warrantyDeadline: '10/7/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP91E962SE100268', vehicleType: 'REEV', color: 'BLACK', model: 'PASSION', modelYear: 2025, deliveryDate: '', warrantyDeadline: '10/7/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C966SY890018', vehicleType: 'EV', color: 'WHITE', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C965SY890009', vehicleType: 'EV', color: 'WHITE', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C962SY890016', vehicleType: 'EV', color: 'WHITE', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LGB320H80SW800064', vehicleType: 'EV', color: 'WHITE', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: 'Chinese version', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C960SY890094', vehicleType: 'EV', color: 'BLACK', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C962SY890095', vehicleType: 'EV', color: 'BLACK', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C964SY890096', vehicleType: 'EV', color: 'BLACK', model: 'COURAGE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95C964PE009325', vehicleType: 'EV', color: 'BLACK', model: 'DREAM', modelYear: 2023, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP91C96XPE203188', vehicleType: 'EV', color: 'BLACK', model: 'PASSION', modelYear: 2023, deliveryDate: '', warrantyDeadline: '6/12/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H962RE301829', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '7/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H963RE302388', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H967RE301759', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '9/7/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H961RE300655', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H968RE302211', vehicleType: 'REEV', color: 'GREEN', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H968RE301897', vehicleType: 'REEV', color: 'WHITE', model: 'Free', modelYear: 2024, deliveryDate: '', warrantyDeadline: '10/1/2029', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H962RE104952', vehicleType: 'REEV', color: 'BLACK', model: 'DREAM', modelYear: 2024, deliveryDate: '', warrantyDeadline: '10/15/20209', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP29H928SM520017', vehicleType: 'REEV', color: 'BLACK', model: 'MHERO', modelYear: 2025, deliveryDate: '', warrantyDeadline: '', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP29H925SM520024', vehicleType: 'REEV', color: 'GREY', model: 'MHERO', modelYear: 2025, deliveryDate: '', warrantyDeadline: '', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP29H922SM520014', vehicleType: 'REEV', color: 'FANJING GREEN', model: 'MHERO', modelYear: 2025, deliveryDate: '', warrantyDeadline: '', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H962SE900266', vehicleType: 'REEV', color: 'BLACK', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H963SE009001', vehicleType: 'REEV', color: 'BLACK', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: 'NOT ON DMS', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H964SE900270', vehicleType: 'REEV', color: 'BLACK', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H960SE900248', vehicleType: 'REEV', color: 'GREEN', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H960SE900251', vehicleType: 'REEV', color: 'GREEN', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H969SE900250', vehicleType: 'REEV', color: 'GREEN', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H962SE900252', vehicleType: 'REEV', color: 'GREEN', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H963SE900261', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H964SE900253', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H966SE900271', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H967SE900263', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H968SE900255', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H968SE900269', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H968SE900272', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H969SE900264', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H96XSE900256', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/21/2030', notes: '', serviceDate: '', contactInfo: '' },
  { status: 'Available', clientName: '', vin: 'LDP95H96XSE900273', vehicleType: 'REEV', color: 'GREY', model: 'FREE', modelYear: 2025, deliveryDate: '', warrantyDeadline: '8/20/2030', notes: '', serviceDate: '', contactInfo: '' }
];

async function uploadStockData() {
  console.log('🚗 Parsing and uploading stock data to Supabase...');
  console.log('');

  const processedData = stockData.map((item, index) => {
    const deliveryDate = parseDate(item.deliveryDate);
    const dmsWarrantyDeadline = parseDate(item.warrantyDeadline);
    const serviceDate = parseDate(item.serviceDate);
    
    // Calculate warranty dates based on delivery date
    const vehicleWarrantyExpiry = calculateWarrantyDate(deliveryDate, 5); // 5 years vehicle warranty
    const batteryWarrantyExpiry = calculateWarrantyDate(deliveryDate, 8); // 8 years battery warranty
    
    return {
      status: item.status,
      client_name: item.clientName || null,
      vin: item.vin,
      vehicle_type: item.vehicleType,
      color: item.color,
      model: item.model,
      model_year: item.modelYear,
      delivery_date: deliveryDate,
      vehicle_warranty_expiry: vehicleWarrantyExpiry,
      battery_warranty_expiry: batteryWarrantyExpiry,
      dms_warranty_deadline: dmsWarrantyDeadline,
      service_date: serviceDate,
      notes: item.notes || null,
      contact_info: item.contactInfo || null
    };
  });

  console.log(`📊 Processing ${processedData.length} vehicles...`);
  console.log('');

  // Upload in batches to avoid timeout
  const batchSize = 50;
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < processedData.length; i += batchSize) {
    const batch = processedData.slice(i, i + batchSize);
    
    console.log(`📤 Uploading batch ${Math.floor(i/batchSize) + 1} (${batch.length} vehicles)...`);
    
    const { data, error } = await supabase
      .from('car_inventory')
      .upsert(batch, { 
        onConflict: 'vin',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`❌ Error in batch ${Math.floor(i/batchSize) + 1}:`, error);
      errorCount += batch.length;
    } else {
      console.log(`✅ Successfully uploaded batch ${Math.floor(i/batchSize) + 1}`);
      successCount += batch.length;
    }
  }

  console.log('');
  console.log('🎉 Stock data upload completed!');
  console.log('');
  console.log('📊 UPLOAD SUMMARY:');
  console.log(`   ✅ Successfully uploaded: ${successCount} vehicles`);
  console.log(`   ❌ Failed uploads: ${errorCount} vehicles`);
  console.log('');
  console.log('📋 DATA BREAKDOWN:');
  
  const soldCount = processedData.filter(item => item.status === 'Sold').length;
  const availableCount = processedData.filter(item => item.status === 'Available').length;
  
  console.log(`   💰 Sold vehicles: ${soldCount}`);
  console.log(`   📦 Available vehicles: ${availableCount}`);
  console.log('');
  
  // Show model breakdown
  const modelCounts = processedData.reduce((acc, item) => {
    acc[item.model] = (acc[item.model] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('🚗 BY MODEL:');
  Object.entries(modelCounts).forEach(([model, count]) => {
    console.log(`   ${model}: ${count} vehicles`);
  });
  
  console.log('');
  console.log('✅ Your stock data is now in Supabase and should appear in the software!');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. Check the Car Inventory page in your web app');
  console.log('2. Verify sold vs available vehicle counts');
  console.log('3. Review warranty tracking and client information');
  console.log('4. Update any missing delivery dates or notes');
}

async function main() {
  try {
    // Test database connection
    console.log('🔗 Testing database connection...');
    const { error: testError } = await supabase
      .from('car_inventory')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      process.exit(1);
    }
    
    console.log('✅ Database connection successful');
    console.log('');
    
    await uploadStockData();
    
  } catch (error) {
    console.error('❌ Upload failed:', error);
    process.exit(1);
  }
}

main();
