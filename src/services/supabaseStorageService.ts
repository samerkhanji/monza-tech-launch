import { supabase } from '@/integrations/supabase/client';

export interface FileUploadOptions {
  bucket: string;
  path: string;
  file: File;
  replace?: boolean;
  metadata?: Record<string, string>;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  path?: string;
}

export interface StorageFile {
  name: string;
  size: number;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
  id: string;
}

class SupabaseStorageService {
  
  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(options: FileUploadOptions): Promise<FileUploadResult> {
    try {
      const { bucket, path, file, replace = false, metadata = {} } = options;
      
      // Check if Supabase is properly configured
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase client not configured'
        };
      }

      // Validate file size (max 50MB by default)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: `File size exceeds maximum limit of ${maxSize / (1024 * 1024)}MB`
        };
      }

      // Upload file
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: replace,
          metadata: {
            ...metadata,
            originalName: file.name,
            uploadedAt: new Date().toISOString(),
            size: file.size.toString(),
            type: file.type
          }
        });

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      return {
        success: true,
        url: urlData.publicUrl,
        path: data.path
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadMultipleFiles(files: FileUploadOptions[]): Promise<FileUploadResult[]> {
    const results: FileUploadResult[] = [];
    
    for (const fileOptions of files) {
      const result = await this.uploadFile(fileOptions);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Download a file from storage
   */
  static async downloadFile(bucket: string, path: string): Promise<{ success: boolean; data?: Blob; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: true,
        data
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Download failed'
      };
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: string, path: string): string {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Delete a file from storage
   */
  static async deleteFile(bucket: string, path: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  /**
   * List files in a bucket/folder
   */
  static async listFiles(bucket: string, folder: string = ''): Promise<{ files: StorageFile[]; error?: string }> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(folder, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (error) {
        return {
          files: [],
          error: error.message
        };
      }

      return {
        files: data.map(file => ({
          name: file.name,
          size: file.metadata?.size || 0,
          created_at: file.created_at,
          updated_at: file.updated_at,
          last_accessed_at: file.last_accessed_at,
          metadata: file.metadata || {},
          id: file.id
        })) as StorageFile[]
      };

    } catch (error) {
      return {
        files: [],
        error: error instanceof Error ? error.message : 'List failed'
      };
    }
  }

  /**
   * Create automated backup of data
   */
  static async createBackup(data: any, backupName: string): Promise<FileUploadResult> {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const fileName = `${backupName}_${timestamp}.json`;
      
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const file = new File([blob], fileName, { type: 'application/json' });

      // Try to upload to Supabase storage
      const result = await this.uploadFile({
        bucket: 'excel-backups',
        path: `backups/${fileName}`,
        file,
        replace: true,
        metadata: {
          backupType: 'automated',
          dataType: backupName,
          recordCount: Array.isArray(data) ? data.length.toString() : '1'
        }
      });

      // If Supabase upload fails, fall back to localStorage
      if (!result.success) {
        console.warn('Supabase backup failed, falling back to localStorage:', result.error);
        
        // Store backup in localStorage as fallback
        const backupKey = `backup_${backupName}_${timestamp}`;
        localStorage.setItem(backupKey, jsonString);
        
        return {
          success: true,
          url: 'localStorage',
          path: backupKey,
          error: 'Stored in localStorage due to Supabase error'
        };
      }

      return result;

    } catch (error) {
      console.error('Backup creation failed:', error);
      
      // Fallback to localStorage
      try {
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const backupKey = `backup_${backupName}_${timestamp}`;
        const jsonString = JSON.stringify(data, null, 2);
        localStorage.setItem(backupKey, jsonString);
        
        return {
          success: true,
          url: 'localStorage',
          path: backupKey,
          error: 'Stored in localStorage due to error'
        };
      } catch (localError) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Backup failed completely'
        };
      }
    }
  }

  /**
   * Upload car photo with automatic resizing
   */
  static async uploadCarPhoto(carId: string, file: File): Promise<FileUploadResult> {
    try {
      // Create a canvas for image compression
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = async () => {
          // Resize image to max 1920x1080 for better performance
          const maxWidth = 1920;
          const maxHeight = 1080;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(async (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });

              const result = await this.uploadFile({
                bucket: 'car-photos',
                path: `cars/${carId}/${Date.now()}_${file.name}`,
                file: compressedFile,
                replace: false,
                metadata: {
                  carId,
                  originalSize: file.size.toString(),
                  compressedSize: blob.size.toString()
                }
              });

              resolve(result);
            } else {
              resolve({
                success: false,
                error: 'Failed to compress image'
              });
            }
          }, 'image/jpeg', 0.85);
        };

        img.onerror = () => {
          resolve({
            success: false,
            error: 'Failed to load image'
          });
        };

        img.src = URL.createObjectURL(file);
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Photo upload failed'
      };
    }
  }

  /**
   * Upload PDI documentation
   */
  static async uploadPdiDocument(carId: string, file: File): Promise<FileUploadResult> {
    return await this.uploadFile({
      bucket: 'pdi-files',
      path: `pdi/${carId}/${Date.now()}_${file.name}`,
      file,
      replace: false,
      metadata: {
        carId,
        documentType: 'pdi',
        fileType: file.type
      }
    });
  }

  /**
   * Upload repair documentation
   */
  static async uploadRepairDocument(repairId: string, file: File): Promise<FileUploadResult> {
    return await this.uploadFile({
      bucket: 'repair-photos',
      path: `repairs/${repairId}/${Date.now()}_${file.name}`,
      file,
      replace: false,
      metadata: {
        repairId,
        documentType: 'repair',
        fileType: file.type
      }
    });
  }

  /**
   * Upload signature file
   */
  static async uploadSignature(documentId: string, file: File): Promise<FileUploadResult> {
    return await this.uploadFile({
      bucket: 'signatures',
      path: `signatures/${documentId}/${Date.now()}_signature.png`,
      file,
      replace: false,
      metadata: {
        documentId,
        documentType: 'signature',
        fileType: 'image/png'
      }
    });
  }

  /**
   * Get storage usage statistics
   */
  static async getStorageStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    bucketStats: Record<string, { files: number; size: number }>;
    error?: string;
  }> {
    try {
      const buckets = ['car-photos', 'documents', 'pdi-files', 'repair-photos', 'signatures', 'excel-backups'];
      const bucketStats: Record<string, { files: number; size: number }> = {};
      let totalFiles = 0;
      let totalSize = 0;

      for (const bucket of buckets) {
        const { files, error } = await this.listFiles(bucket);
        if (!error) {
          const bucketFileCount = files.length;
          const bucketSize = files.reduce((sum, file) => sum + file.size, 0);
          
          bucketStats[bucket] = {
            files: bucketFileCount,
            size: bucketSize
          };
          
          totalFiles += bucketFileCount;
          totalSize += bucketSize;
        }
      }

      return {
        totalFiles,
        totalSize,
        bucketStats
      };

    } catch (error) {
      return {
        totalFiles: 0,
        totalSize: 0,
        bucketStats: {},
        error: error instanceof Error ? error.message : 'Stats retrieval failed'
      };
    }
  }

  /**
   * Clean up old backups (keep only last 30 days)
   */
  static async cleanupOldBackups(): Promise<{ success: boolean; deletedCount: number; error?: string }> {
    try {
      const { files, error } = await this.listFiles('excel-backups', 'backups');
      
      if (error) {
        return {
          success: false,
          deletedCount: 0,
          error
        };
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const oldFiles = files.filter(file => 
        new Date(file.created_at) < thirtyDaysAgo
      );

      let deletedCount = 0;
      for (const file of oldFiles) {
        const { success } = await this.deleteFile('excel-backups', `backups/${file.name}`);
        if (success) {
          deletedCount++;
        }
      }

      return {
        success: true,
        deletedCount
      };

    } catch (error) {
      return {
        success: false,
        deletedCount: 0,
        error: error instanceof Error ? error.message : 'Cleanup failed'
      };
    }
  }
}

export default SupabaseStorageService; 