import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Papa from 'papaparse';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { isPlatform } from '@ionic/react';
import * as AppGeneral from '../components/socialcalc/index.js';
import { purchaseService } from './PurchaseService';

export class ExportService {
    /**
   * Check if user can export (premium feature check)
   */
  static async canExport(): Promise<{ canExport: boolean; message?: string }> {
    await purchaseService.initialize();
    
    const canExport = purchaseService.canUseFeature('export');
    const remaining = purchaseService.getRemainingExports();
    
    if (!canExport) {
      if (remaining === 0) {
        return {
          canExport: false,
          message: 'You have reached your export limit. Upgrade to Premium for unlimited exports.'
        };
      }
    }
    
    return { canExport: true };
  }

  /**
   * Use an export (decrement counter for free users)
   */
  static async useExport(): Promise<boolean> {
    await purchaseService.initialize();
    return await purchaseService.useExport();
  }

  /**
   * Export current invoice as PDF
   */
  static async exportToPDF(fileName: string = 'invoice'): Promise<{ success: boolean; message: string; path?: string }> {
    try {
      // Check if user can export
      const { canExport, message } = await this.canExport();
      if (!canExport) {
        return { success: false, message: message || 'Export not allowed' };
      }

      // Get the spreadsheet container
      const element = document.getElementById('tableeditor');
      if (!element) {
        throw new Error('Spreadsheet element not found');
      }

      // Use an export
      const exportUsed = await this.useExport();
      if (!exportUsed) {
        return { success: false, message: 'Failed to process export' };
      }

      // Create canvas from the spreadsheet
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      // Create PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Calculate dimensions to fit A4
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 30;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

      if (isPlatform('hybrid')) {
        // For mobile devices, use Downloads directory (no permission required on Android 10+)
        const pdfBase64 = pdf.output('datauristring').split(',')[1];
        const fileName64 = `${fileName}_${Date.now()}.pdf`;
        
        try {
          const result = await Filesystem.writeFile({
            path: fileName64,
            data: pdfBase64,
            directory: Directory.Cache, // Use Cache directory which doesn't require permissions
          });

          return {
            success: true,
            message: `PDF saved successfully as ${fileName64}`,
            path: result.uri
          };
        } catch (writeError) {
          // Fallback: try using data directory
          try {
            const fallbackResult = await Filesystem.writeFile({
              path: fileName64,
              data: pdfBase64,
              directory: Directory.Data,
            });

            return {
              success: true,
              message: `PDF saved to app folder as ${fileName64}`,
              path: fallbackResult.uri
            };
          } catch (fallbackError) {
            throw new Error(`Could not save file: ${fallbackError.message}`);
          }
        }
      } else {
        // For web, trigger download
        pdf.save(`${fileName}_${Date.now()}.pdf`);
        return {
          success: true,
          message: 'PDF downloaded successfully'
        };
      }
    } catch (error) {
      console.error('PDF Export Error:', error);
      return {
        success: false,
        message: `Failed to export PDF: ${error.message}`
      };
    }
  }
  /**
   * Export current invoice data as CSV
   */
  static async exportToCSV(fileName: string = 'invoice'): Promise<{ success: boolean; message: string; path?: string }> {
    try {
      // Check if user can export
      const { canExport, message } = await this.canExport();
      if (!canExport) {
        return { success: false, message: message || 'Export not allowed' };
      }

      // Get spreadsheet data
      const spreadsheetData = AppGeneral.getSpreadsheetData();
      
      if (!spreadsheetData || !spreadsheetData.cells) {
        throw new Error('No spreadsheet data found');
      }

      // Use an export
      const exportUsed = await this.useExport();
      if (!exportUsed) {
        return { success: false, message: 'Failed to process export' };
      }

      // Convert spreadsheet data to CSV format
      const csvData = this.convertSpreadsheetToCSV(spreadsheetData);
      const csvString = Papa.unparse(csvData);

      if (isPlatform('hybrid')) {
        // For mobile devices, use Cache directory (no permission required)
        const fileName64 = `${fileName}_${Date.now()}.csv`;
        
        try {
          const result = await Filesystem.writeFile({
            path: fileName64,
            data: csvString,
            directory: Directory.Cache,
            encoding: Encoding.UTF8
          });

          return {
            success: true,
            message: `CSV saved successfully as ${fileName64}`,
            path: result.uri
          };
        } catch (writeError) {
          // Fallback: try using data directory
          try {
            const fallbackResult = await Filesystem.writeFile({
              path: fileName64,
              data: csvString,
              directory: Directory.Data,
              encoding: Encoding.UTF8
            });

            return {
              success: true,
              message: `CSV saved to app folder as ${fileName64}`,
              path: fallbackResult.uri
            };
          } catch (fallbackError) {
            throw new Error(`Could not save file: ${fallbackError.message}`);
          }
        }
      } else {
        // For web, trigger download
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${fileName}_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return {
          success: true,
          message: 'CSV downloaded successfully'
        };
      }
    } catch (error) {
      console.error('CSV Export Error:', error);
      return {
        success: false,
        message: `Failed to export CSV: ${error.message}`
      };
    }
  }

  /**
   * Convert spreadsheet data to CSV format
   */
  private static convertSpreadsheetToCSV(spreadsheetData: any): any[] {
    const csvRows: any[] = [];
    const cells = spreadsheetData.cells || {};
    
    // Find the maximum row and column
    let maxRow = 0;
    let maxCol = 0;
    
    Object.keys(cells).forEach(cellRef => {
      const match = cellRef.match(/([A-Z]+)(\d+)/);
      if (match) {
        const col = this.columnLetterToNumber(match[1]);
        const row = parseInt(match[2]);
        maxRow = Math.max(maxRow, row);
        maxCol = Math.max(maxCol, col);
      }
    });

    // Create CSV matrix
    for (let row = 1; row <= maxRow; row++) {
      const rowData: string[] = [];
      for (let col = 1; col <= maxCol; col++) {
        const cellRef = this.numberToColumnLetter(col) + row;
        const cell = cells[cellRef];
        let cellValue = '';
        
        if (cell) {
          // Extract cell value based on cell type
          if (cell.t) cellValue = cell.t; // text
          else if (cell.v !== undefined) cellValue = cell.v.toString(); // value
          else if (cell.f) cellValue = cell.f; // formula
        }
        
        rowData.push(cellValue);
      }
      csvRows.push(rowData);
    }

    return csvRows;
  }

  /**
   * Convert column letter to number (A=1, B=2, etc.)
   */
  private static columnLetterToNumber(letter: string): number {
    let result = 0;
    for (let i = 0; i < letter.length; i++) {
      result = result * 26 + (letter.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
    }
    return result;
  }

  /**
   * Convert number to column letter (1=A, 2=B, etc.)
   */
  private static numberToColumnLetter(num: number): string {
    let result = '';
    while (num > 0) {
      num--;
      result = String.fromCharCode(num % 26 + 'A'.charCodeAt(0)) + result;
      num = Math.floor(num / 26);
    }
    return result;
  }
  /**
   * Request storage permissions for Android
   */
  static async requestPermissions(): Promise<boolean> {
    // For modern Android (API 29+), we don't need storage permissions for app-specific directories
    if (isPlatform('hybrid')) {
      try {
        // Check if we can write to cache directory (should always work)
        const testFile = await Filesystem.writeFile({
          path: 'test.txt',
          data: 'test',
          directory: Directory.Cache,
        });
        
        // Clean up test file
        await Filesystem.deleteFile({
          path: 'test.txt',
          directory: Directory.Cache,
        });
        
        return true;
      } catch (error) {
        console.error('Permission test failed:', error);
        return false;
      }
    }
    return true; // Web doesn't need permissions
  }
}
