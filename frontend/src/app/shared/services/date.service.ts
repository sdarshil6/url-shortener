import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DateService {
  /**
   * Format date to 'dd-mm-yyyy' format
   * @param dateString - ISO date string
   * @returns Formatted date string in 'dd-mm-yyyy' format
   */
  formatToDDMMYYYY(dateString: string | null): string {
    if (!dateString) return 'Never';
    
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  /**
   * Get current date in 'yyyy-mm-dd' format for date input min attribute
   * @returns Current date string in 'yyyy-mm-dd' format
   */
  getCurrentDateString(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Convert date input value to ISO string for API
   * @param dateValue - Date value from date input (yyyy-mm-dd)
   * @returns ISO date string
   */
  toISOString(dateValue: string): string {
    if (!dateValue) return '';
    // Create date at midnight UTC to avoid timezone issues
    const date = new Date(dateValue + 'T00:00:00Z');
    return date.toISOString();
  }

  /**
   * Convert ISO date string to date input format (yyyy-mm-dd)
   * @param isoString - ISO date string
   * @returns Date string in 'yyyy-mm-dd' format
   */
  toDateInputValue(isoString: string | null): string {
    if (!isoString) return '';
    
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }
}
