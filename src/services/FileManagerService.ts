import { Filesystem, Directory } from '@capacitor/filesystem';
import { isPlatform } from '@ionic/react';

export class FileManagerService {
  
  /**
   * Get list of exported files
   */
  static async getExportedFiles(): Promise<{ name: string; uri: string; type: 'pdf' | 'csv' }[]> {
    if (!isPlatform('hybrid')) {
      return []; // Web files are downloaded directly
    }

    try {
      const files: { name: string; uri: string; type: 'pdf' | 'csv' }[] = [];
      
      // Check cache directory for exported files
      try {
        const cacheFiles = await Filesystem.readdir({
          path: '',
          directory: Directory.Cache,
        });

        for (const file of cacheFiles.files) {
          if (file.name.endsWith('.pdf') || file.name.endsWith('.csv')) {
            const stat = await Filesystem.stat({
              path: file.name,
              directory: Directory.Cache,
            });
            
            files.push({
              name: file.name,
              uri: stat.uri,
              type: file.name.endsWith('.pdf') ? 'pdf' : 'csv'
            });
          }
        }
      } catch (error) {
        console.log('No cache files found');
      }

      // Check data directory for exported files
      try {
        const dataFiles = await Filesystem.readdir({
          path: '',
          directory: Directory.Data,
        });

        for (const file of dataFiles.files) {
          if (file.name.endsWith('.pdf') || file.name.endsWith('.csv')) {
            const stat = await Filesystem.stat({
              path: file.name,
              directory: Directory.Data,
            });
            
            files.push({
              name: file.name,
              uri: stat.uri,
              type: file.name.endsWith('.pdf') ? 'pdf' : 'csv'
            });
          }
        }
      } catch (error) {
        console.log('No data files found');
      }

      // Sort by name (newest first due to timestamp)
      return files.sort((a, b) => b.name.localeCompare(a.name));
      
    } catch (error) {
      console.error('Error getting exported files:', error);
      return [];
    }
  }
  /**
   * Open/Share exported file
   */
  static async openFile(uri: string): Promise<boolean> {
    if (!isPlatform('hybrid')) {
      return false;
    }

    try {
      // On Android, we can open the file using the system default app
      window.open(uri, '_system');
      return true;
    } catch (error) {
      console.error('Error opening file:', error);
      return false;
    }
  }

  /**
   * Delete exported file
   */
  static async deleteFile(fileName: string): Promise<boolean> {
    if (!isPlatform('hybrid')) {
      return false;
    }

    try {
      // Try cache directory first
      try {
        await Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Cache,
        });
        return true;
      } catch (error) {
        // Try data directory
        await Filesystem.deleteFile({
          path: fileName,
          directory: Directory.Data,
        });
        return true;
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }
}
