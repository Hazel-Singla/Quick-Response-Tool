const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

class CSVParserService {
  /**
   * Parse a CSV or Excel file and return structured data
   * @param {string} filePath - Path to the file
   * @returns {Promise<{headers: string[], rows: Array, summary: Object}>}
   */
  async parseFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    try {
      if (ext === '.csv') {
        return await this.parseCSV(filePath);
      } else if (ext === '.xlsx' || ext === '.xls') {
        return await this.parseExcel(filePath);
      } else {
        throw new Error('Unsupported file format');
      }
    } catch (error) {
      throw new Error(`Failed to parse file: ${error.message}`);
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath) {
    return new Promise((resolve, reject) => {
      const results = [];
      const csv = require('csv-parser');
      
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => {
          if (results.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }
          
          const headers = Object.keys(results[0]);
          const summary = this.generateSummary(results, headers);
          
          resolve({
            headers,
            rows: results,
            summary
          });
        })
        .on('error', (error) => reject(error));
    });
  }

  /**
   * Parse Excel file
   */
  async parseExcel(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Convert to JSON
      const data = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (data.length === 0) {
        throw new Error('Excel file is empty');
      }
      
      // First row as headers
      const headers = data[0].map(h => String(h).trim());
      
      // Convert remaining rows to objects
      const rows = data.slice(1).map(row => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index] !== undefined ? row[index] : '';
        });
        return obj;
      }).filter(row => Object.values(row).some(v => v !== ''));
      
      const summary = this.generateSummary(rows, headers);
      
      return {
        headers,
        rows,
        summary
      };
    } catch (error) {
      throw new Error(`Excel parsing error: ${error.message}`);
    }
  }

  /**
   * Generate summary statistics from data
   */
  generateSummary(rows, headers) {
    const summary = {
      totalRows: rows.length,
      totalColumns: headers.length,
      columns: headers,
      numericColumns: [],
      sampleData: rows.slice(0, 5) // First 5 rows as sample
    };

    // Detect numeric columns and calculate basic stats
    headers.forEach(header => {
      const values = rows.map(row => row[header]).filter(v => v !== '' && v !== null && v !== undefined);
      const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      if (numericValues.length > values.length * 0.5) {
        const sum = numericValues.reduce((a, b) => a + b, 0);
        const avg = sum / numericValues.length;
        const min = Math.min(...numericValues);
        const max = Math.max(...numericValues);
        
        summary.numericColumns.push({
          name: header,
          count: numericValues.length,
          sum: Math.round(sum * 100) / 100,
          average: Math.round(avg * 100) / 100,
          min: Math.round(min * 100) / 100,
          max: Math.round(max * 100) / 100
        });
      }
    });

    return summary;
  }

  /**
   * Format data for AI processing
   */
  formatForAI(data, maxRows = 100) {
    const { headers, rows, summary } = data;
    
    // Limit rows to avoid token limits
    const limitedRows = rows.slice(0, maxRows);
    
    let formatted = `Sales Data Summary:\n`;
    formatted += `Total Records: ${summary.totalRows}\n`;
    formatted += `Columns: ${headers.join(', ')}\n\n`;
    
    if (summary.numericColumns.length > 0) {
      formatted += `Key Metrics:\n`;
      summary.numericColumns.forEach(col => {
        formatted += `- ${col.name}: Total=${col.sum}, Avg=${col.average}, Min=${col.min}, Max=${col.max}\n`;
      });
      formatted += '\n';
    }
    
    formatted += `Sample Data (first ${limitedRows.length} rows):\n`;
    formatted += headers.join('\t') + '\n';
    limitedRows.forEach(row => {
      formatted += headers.map(h => row[h] || '').join('\t') + '\n';
    });
    
    return formatted;
  }
}

module.exports = new CSVParserService();
