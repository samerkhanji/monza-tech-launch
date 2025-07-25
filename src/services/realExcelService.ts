import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { supabase } from '@/integrations/supabase/client';

export interface ExcelExportOptions {
  fileName?: string;
  sheetName?: string;
  includeTimestamp?: boolean;
  uploadToSupabase?: boolean;
}

export interface ExcelImportResult<T = any> {
  data: T[];
  errors: string[];
  totalRows: number;
  successfulRows: number;
}

class RealExcelService {
  
  /**
   * Export data to Excel file with real XLSX library
   */
  static async exportToExcel<T>(
    data: T[], 
    options: ExcelExportOptions = {}
  ): Promise<{ success: boolean; message: string; fileName?: string }> {
    try {
      const {
        fileName = 'export',
        sheetName = 'Data',
        includeTimestamp = true,
        uploadToSupabase = true
      } = options;

      if (!data || data.length === 0) {
        return { success: false, message: 'No data to export' };
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      // Generate timestamp
      const timestamp = includeTimestamp 
        ? new Date().toISOString().slice(0, 19).replace(/:/g, '-')
        : '';
      
      const finalFileName = `${fileName}${timestamp ? `_${timestamp}` : ''}.xlsx`;

      // Write workbook to buffer
      const workbookBuffer = XLSX.write(workbook, { 
        bookType: 'xlsx', 
        type: 'array' 
      });

      // Create blob and download
      const blob = new Blob([workbookBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, finalFileName);

      // Optional: Upload to Supabase storage as backup
      if (uploadToSupabase) {
        await this.uploadBackupToSupabase(workbookBuffer, finalFileName);
      }

      return { 
        success: true, 
        message: `Successfully exported ${data.length} records to ${finalFileName}`,
        fileName: finalFileName
      };

    } catch (error) {
      console.error('Excel export error:', error);
      return { 
        success: false, 
        message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Import data from Excel file with validation
   */
  static async importFromExcel<T>(
    file: File,
    expectedColumns?: string[]
  ): Promise<ExcelImportResult<T>> {
    return new Promise((resolve) => {
      try {
        const reader = new FileReader();
        
        reader.onload = (e) => {
          try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Get first worksheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet) as T[];
            
            const errors: string[] = [];
            let successfulRows = 0;

            // Validate columns if expected columns provided
            if (expectedColumns && jsonData.length > 0) {
              const actualColumns = Object.keys(jsonData[0] as any);
              const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));
              
              if (missingColumns.length > 0) {
                errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
              }
            }

            // Count successful rows (non-empty rows)
            successfulRows = jsonData.filter(row => 
              Object.values(row as any).some(value => value !== null && value !== undefined && value !== '')
            ).length;

            resolve({
              data: jsonData,
              errors,
              totalRows: jsonData.length,
              successfulRows
            });

          } catch (parseError) {
            resolve({
              data: [],
              errors: [`Failed to parse Excel file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`],
              totalRows: 0,
              successfulRows: 0
            });
          }
        };

        reader.onerror = () => {
          resolve({
            data: [],
            errors: ['Failed to read file'],
            totalRows: 0,
            successfulRows: 0
          });
        };

        reader.readAsArrayBuffer(file);

      } catch (error) {
        resolve({
          data: [],
          errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          totalRows: 0,
          successfulRows: 0
        });
      }
    });
  }

  /**
   * Upload Excel backup to Supabase storage
   */
  private static async uploadBackupToSupabase(
    fileBuffer: ArrayBuffer, 
    fileName: string
  ): Promise<{ success: boolean; url?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('excel-backups')
        .upload(`backups/${fileName}`, fileBuffer, {
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          upsert: true
        });

      if (error) {
        console.error('Supabase storage upload error:', error);
        return { success: false };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('excel-backups')
        .getPublicUrl(data.path);

      return { 
        success: true, 
        url: urlData.publicUrl 
      };

    } catch (error) {
      console.error('Backup upload error:', error);
      return { success: false };
    }
  }

  /**
   * List available backups from Supabase storage
   */
  static async listBackups(): Promise<{ files: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('excel-backups')
        .list('backups/', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        return { files: [], error: error.message };
      }

      return { files: data || [] };

    } catch (error) {
      return { 
        files: [], 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Download backup from Supabase storage
   */
  static async downloadBackup(fileName: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.storage
        .from('excel-backups')
        .download(`backups/${fileName}`);

      if (error || !data) {
        return { success: false, message: 'Failed to download backup' };
      }

      // Trigger download
      saveAs(data, fileName);
      
      return { success: true, message: 'Backup downloaded successfully' };

    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Download failed' 
      };
    }
  }
}

export default RealExcelService; 