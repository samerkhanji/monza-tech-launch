/**
 * scripts/csvToSupabase.ts
 * Generic CSV → Supabase table importer (server-side only).
 * Usage:
 *   npx tsx scripts/csvToSupabase.ts ./data/employees.csv users
 * Optional flags:
 *   --upsert=<cols>    Upsert on comma-separated unique columns (e.g., email or id)
 *   --preview          Show preview without inserting
 *   --batch=<size>     Batch size (default: 500)
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

const url = process.env.SUPABASE_URL as string;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!url || !serviceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment');
  console.error('Create .env.local with your Supabase credentials');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const [, , csvPath, tableName, ...rest] = process.argv;
if (!csvPath || !tableName) {
  console.error('Usage: tsx scripts/csvToSupabase.ts <csvPath> <tableName> [options]');
  console.error('');
  console.error('Options:');
  console.error('  --upsert=email,id    Upsert on unique columns (comma-separated)');
  console.error('  --preview            Show preview without inserting');
  console.error('  --batch=500          Set batch size (default: 500)');
  console.error('');
  console.error('Examples:');
  console.error('  tsx scripts/csvToSupabase.ts ./data/cars.csv vehicles --upsert=vin');
  console.error('  tsx scripts/csvToSupabase.ts ./data/employees.csv users --upsert=email --preview');
  process.exit(1);
}

const flags = Object.fromEntries(
  rest
    .filter(f => f.startsWith('--'))
    .map(f => {
      const [k, v] = f.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
);

function coerce(value: string): any {
  if (value === '' || value?.toLowerCase?.() === 'null') return null;
  if (/^\d+$/.test(value)) return Number(value);
  if (/^\d+\.\d+$/.test(value)) return Number(value);
  // ISO date-ish
  if (/^\d{4}-\d{2}-\d{2}(t|\s)?\d{0,2}:?\d{0,2}:?\d{0,2}?.*/i.test(value)) return value;
  if (/^(true|false)$/i.test(value)) return value.toLowerCase() === 'true';
  return value;
}

function normalizeData(obj: Record<string, any>): Record<string, any> {
  const normalized = { ...obj };
  
  // Normalize common fields
  if (normalized.role && typeof normalized.role === 'string') {
    normalized.role = normalized.role.toUpperCase();
  }
  if (normalized.email && typeof normalized.email === 'string') {
    normalized.email = normalized.email.toLowerCase();
  }
  if (normalized.status && typeof normalized.status === 'string') {
    normalized.status = normalized.status.toLowerCase();
  }
  
  return normalized;
}

async function main() {
  const resolved = path.resolve(csvPath);
  if (!fs.existsSync(resolved)) {
    console.error(`❌ CSV file not found: ${resolved}`);
    process.exit(1);
  }

  console.log('📊 Parsing CSV file...');
  console.log(`📁 File: ${resolved}`);
  console.log(`🎯 Target table: ${tableName}`);
  console.log('');

  // Parse CSV
  const csv = fs.readFileSync(resolved, 'utf8');
  const records = parse(csv, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const rows = records.map(r => {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(r)) {
      obj[k] = coerce(v as string);
    }
    return normalizeData(obj);
  });

  console.log(`📋 Parsed ${rows.length} rows from CSV`);
  
  if (rows.length === 0) {
    console.log('⚠️ No data found in CSV file');
    process.exit(0);
  }

  // Show preview
  console.log('');
  console.log('📖 Preview of first row:');
  console.log(JSON.stringify(rows[0], null, 2));
  console.log('');
  
  // Show columns
  const columns = Object.keys(rows[0]);
  console.log(`📊 Columns found (${columns.length}): ${columns.join(', ')}`);
  console.log('');

  // Preview mode
  if (flags.preview) {
    console.log('👁️ Preview mode - no data will be inserted');
    console.log('');
    console.log('📋 Sample data:');
    console.table(rows.slice(0, 5));
    console.log('');
    console.log('✅ Preview complete. Remove --preview flag to insert data.');
    process.exit(0);
  }

  // Test database connection
  try {
    const { error: testError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error(`❌ Cannot access table '${tableName}':`, testError.message);
      process.exit(1);
    }
    
    console.log(`✅ Database connection to '${tableName}' successful`);
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Batch settings
  const chunkSize = Number(flags.batch) || 500;
  const upsertCols = typeof flags.upsert === 'string' && flags.upsert.length > 0
    ? (flags.upsert as string).split(',').map(s => s.trim()).filter(Boolean)
    : null;

  console.log('');
  console.log('🔄 Starting data upload...');
  console.log(`📦 Batch size: ${chunkSize}`);
  if (upsertCols) {
    console.log(`🔄 Upsert mode on columns: ${upsertCols.join(', ')}`);
  } else {
    console.log('➕ Insert mode (new records only)');
  }
  console.log('');

  let totalInserted = 0;

  // Process in chunks
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const chunkNum = Math.floor(i / chunkSize) + 1;
    const totalChunks = Math.ceil(rows.length / chunkSize);
    
    console.log(`📦 Processing chunk ${chunkNum}/${totalChunks} (${chunk.length} rows)...`);
    
    try {
      const query = supabase.from(tableName);
      const { data, error } = upsertCols
        ? await query.upsert(chunk, { onConflict: upsertCols.join(',') }).select()
        : await query.insert(chunk).select();

      if (error) {
        console.error(`❌ Error in chunk ${chunkNum}:`, error);
        console.error('🔍 Sample problematic data:', JSON.stringify(chunk[0], null, 2));
        process.exit(1);
      }

      const insertedCount = data?.length ?? 0;
      totalInserted += insertedCount;
      console.log(`✅ Chunk ${chunkNum}: ${insertedCount} rows processed`);
      
    } catch (error) {
      console.error(`❌ Unexpected error in chunk ${chunkNum}:`, error);
      process.exit(1);
    }
  }

  console.log('');
  console.log('🎉 CSV import completed successfully!');
  console.log(`📊 Total rows processed: ${totalInserted}`);
  console.log(`🎯 Table: ${tableName}`);
  console.log('');
  
  // Show final count
  try {
    const { data: countData } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countData !== null) {
      console.log(`📋 Total rows in table: ${countData}`);
    }
  } catch (error) {
    // Ignore count errors
  }
  
  console.log('✅ Upload complete!');
}

main().catch(err => {
  console.error('❌ Upload failed:', err);
  process.exit(1);
});