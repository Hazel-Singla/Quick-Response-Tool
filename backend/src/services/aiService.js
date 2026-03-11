const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.initialized = false;
  }

  /**
   * Initialize the Gemini AI client
   */
  initialize() {
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn('GEMINI_API_KEY not set. AI features will be disabled.');
      return false;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      this.initialized = true;
      console.log('AI Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize AI Service:', error.message);
      return false;
    }
  }

  /**
   * Generate a professional sales summary from data
   * @param {Object} data - Parsed data from CSV/Excel
   * @returns {Promise<string>} - Generated summary
   */
  async generateSalesSummary(data) {
    if (!this.initialized) {
      if (!this.initialize()) {
        return this.generateFallbackSummary(data);
      }
    }

    try {
      const prompt = this.buildPrompt(data);
      
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 40
        }
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('AI generation error:', error.message);
      return this.generateFallbackSummary(data);
    }
  }

  /**
   * Build the prompt for the AI
   */
  buildPrompt(data) {
    const { headers, rows, summary } = data;
    
    // Build a concise data representation
    let dataContext = `\nDATA OVERVIEW:\n`;
    dataContext += `- Total Records: ${summary.totalRows}\n`;
    dataContext += `- Available Fields: ${headers.join(', ')}\n`;
    
    if (summary.numericColumns && summary.numericColumns.length > 0) {
      dataContext += `\nKEY METRICS:\n`;
      summary.numericColumns.forEach(col => {
        dataContext += `- ${col.name}: Total ${col.sum.toLocaleString()}, Average ${col.average.toLocaleString()}, Range ${col.min.toLocaleString()} - ${col.max.toLocaleString()}\n`;
      });
    }
    
    // Add sample data (first 10 rows)
    dataContext += `\nSAMPLE RECORDS:\n`;
    const sampleRows = rows.slice(0, 10);
    sampleRows.forEach((row, index) => {
      dataContext += `${index + 1}. `;
      const rowData = headers.slice(0, 5).map(h => `${h}: ${row[h] || 'N/A'}`).join(', ');
      dataContext += rowData + '\n';
    });

    const prompt = `You are a senior sales analyst at Rabbitt AI. Your task is to analyze the provided sales data and create a professional executive summary for leadership.

${dataContext}

Please provide a comprehensive sales analysis in the following format:

## Executive Summary
Provide 2-3 sentences summarizing the overall performance and key highlights.

## Key Performance Indicators
- Total Revenue/Sales (if available)
- Top performing products/regions (identify from data)
- Notable trends or patterns
- Areas of concern or opportunity

## Strategic Insights
Provide 3-4 actionable insights based on the data patterns. Focus on:
- What the data reveals about customer behavior
- Seasonal or periodic trends
- Performance gaps or opportunities
- Recommendations for next quarter

## Data Quality Notes
Mention any observations about data completeness or patterns.

Write in a professional, executive-ready tone. Use bullet points and clear formatting for readability. Be specific with numbers and percentages where the data supports it.`;

    return prompt;
  }

  /**
   * Generate a fallback summary when AI is unavailable
   */
  generateFallbackSummary(data) {
    const { headers, rows, summary } = data;
    
    let summary_text = `# Sales Data Analysis Report\n\n`;
    summary_text += `## Executive Summary\n`;
    summary_text += `This report analyzes ${summary.totalRows} sales records across ${summary.totalColumns} data fields. `;
    
    if (summary.numericColumns && summary.numericColumns.length > 0) {
      summary_text += `Key metrics include ${summary.numericColumns.map(c => c.name).join(', ')}.\n\n`;
      
      summary_text += `## Key Metrics\n`;
      summary.numericColumns.forEach(col => {
        summary_text += `- **${col.name}**: Total ${col.sum.toLocaleString()}, Average ${col.average.toLocaleString()}\n`;
      });
    } else {
      summary_text += `The dataset contains the following fields: ${headers.join(', ')}.\n\n`;
    }
    
    summary_text += `\n## Data Overview\n`;
    summary_text += `- Total Records: ${summary.totalRows}\n`;
    summary_text += `- Data Fields: ${headers.join(', ')}\n`;
    summary_text += `- Analysis Date: ${new Date().toLocaleDateString()}\n\n`;
    
    summary_text += `*Note: AI-powered insights are currently unavailable. This is an automated summary based on basic data statistics.*`;
    
    return summary_text;
  }

  /**
   * Check if AI service is healthy
   */
  async healthCheck() {
    if (!this.initialized) {
      return { status: 'not_configured', message: 'API key not configured' };
    }

    try {
      // Try a simple generation to verify connectivity
      await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }],
        generationConfig: { maxOutputTokens: 10 }
      });
      return { status: 'healthy', message: 'AI service is operational' };
    } catch (error) {
      return { status: 'unhealthy', message: error.message };
    }
  }
}

module.exports = new AIService();
