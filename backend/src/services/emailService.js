const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
  }

  /**
   * Initialize the email transporter
   */
  initialize() {
    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      console.warn('Email service not fully configured. Emails will be logged to console only.');
      this.initialized = false;
      return false;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: host,
        port: parseInt(port) || 587,
        secure: parseInt(port) === 465,
        auth: {
          user: user,
          pass: pass
        },
        tls: {
          rejectUnauthorized: process.env.NODE_ENV === 'production'
        }
      });

      this.initialized = true;
      console.log('Email service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize email service:', error.message);
      return false;
    }
  }

  /**
   * Send sales summary email
   * @param {string} to - Recipient email
   * @param {string} summary - AI-generated summary
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<{success: boolean, message: string, messageId?: string}>}
   */
  async sendSummaryEmail(to, summary, metadata = {}) {
    if (!this.initialized) {
      this.initialize();
    }

    const { fileName, recordCount, generatedAt } = metadata;
    const from = process.env.EMAIL_FROM || 'Quick Response Tool <noreply@example.com>';

    const subject = `Sales Analysis Report - ${new Date().toLocaleDateString()}`;
    
    // Convert markdown-like summary to HTML
    const htmlContent = this.formatSummaryToHTML(summary, metadata);
    
    const mailOptions = {
      from,
      to,
      subject,
      text: summary, // Plain text version
      html: htmlContent // HTML version
    };

    // If not initialized, log to console (development mode)
    if (!this.initialized) {
      console.log('\n========== EMAIL WOULD BE SENT ==========');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content preview:', summary.substring(0, 200) + '...');
      console.log('=========================================\n');
      
      return {
        success: true,
        message: 'Email logged to console (SMTP not configured)',
        messageId: 'console-log-' + Date.now()
      };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId
      };
    } catch (error) {
      console.error('Failed to send email:', error.message);
      
      return {
        success: false,
        message: `Failed to send email: ${error.message}`
      };
    }
  }

  /**
   * Format summary text to HTML
   */
  formatSummaryToHTML(summary, metadata) {
    const { fileName, recordCount } = metadata;
    
    // Convert markdown-style headers to HTML
    let html = summary
      .replace(/^## (.*$)/gim, '<h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 8px;">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 style="color: #2c3e50;">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*$)/gim, '<li style="margin: 5px 0;">$1</li>')
      .replace(/(<li>.*<\/li>)/s, '<ul style="padding-left: 20px;">$1</ul>')
      .replace(/\n/g, '<br>');

    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sales Analysis Report</title>
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Sales Insight Report</h1>
    <p style="color: #e0e0e0; margin: 10px 0 0 0;">Powered by Rabbitt AI</p>
  </div>
  
  <div style="background: #f8f9fa; padding: 20px; border-left: 4px solid #3498db;">
    <p style="margin: 5px 0;"><strong>Report Generated:</strong> ${new Date().toLocaleString()}</p>
    ${fileName ? `<p style="margin: 5px 0;"><strong>Source File:</strong> ${fileName}</p>` : ''}
    ${recordCount ? `<p style="margin: 5px 0;"><strong>Records Analyzed:</strong> ${recordCount.toLocaleString()}</p>` : ''}
  </div>
  
  <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 0 0 10px 10px;">
    ${html}
  </div>
  
  <div style="text-align: center; padding: 20px; color: #666; font-size: 12px;">
    <p>This report was automatically generated by the Quick Response Tool.</p>
    <p>&copy; ${new Date().getFullYear()} Rabbitt AI. All rights reserved.</p>
  </div>
</body>
</html>`;

    return emailTemplate;
  }

  /**
   * Verify email configuration
   */
  async verifyConnection() {
    if (!this.initialized) {
      return { valid: false, message: 'Email service not initialized' };
    }

    try {
      await this.transporter.verify();
      return { valid: true, message: 'Email configuration is valid' };
    } catch (error) {
      return { valid: false, message: error.message };
    }
  }
}

module.exports = new EmailService();
