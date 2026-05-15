import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Export data as an Excel file.
 * 
 * @param {Array<Object>} data - array of objects to export
 * @param {string} filename - file name without extension
 * @param {string} sheetName - name of the worksheet
 */
export const exportToExcel = (data, filename = 'export', sheetName = 'Sheet1') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

/**
 * Export data as a CSV file.
 * 
 * @param {Array<Object>} data - array of objects to export
 * @param {string} filename - file name without extension
 */
export const exportToCSV = (data, filename = 'export') => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  saveAs(blob, `${filename}.csv`);
};

/**
 * Print the current page (or a specific element).
 * 
 * @param {string} elementId - Optional CSS ID of the element to print
 */
export const printPage = (elementId = null) => {
  if (elementId) {
    const element = document.getElementById(elementId);
    if (!element) return;
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head><title>Print</title>
          <style>
            body { font-family: 'Cairo', sans-serif; direction: rtl; padding: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; font-size: 12px; }
            th { background-color: #f8fafc; font-weight: bold; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  } else {
    window.print();
  }
};
