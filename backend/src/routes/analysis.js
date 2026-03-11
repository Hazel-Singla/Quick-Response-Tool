const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const { upload, handleUploadError } = require('../middleware/upload');
const { analysisValidation, handleValidationErrors } = require('../middleware/validator');
const { strictRateLimiter } = require('../middleware/rateLimiter');
const csvParser = require('../services/csvParser');
const aiService = require('../services/aiService');
const emailService = require('../services/emailService');

/**
 * @swagger
 * /api/analyze:
 *   post:
 *     summary: Upload sales data and receive AI-generated summary via email
 *     description: Upload a CSV or Excel file containing sales data and receive a professional AI-generated summary sent to the specified email address.
 *     tags:
 *       - Analysis
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - email
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file containing sales data (max 10MB)
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Recipient email address for the summary
 *     responses:
 *       200:
 *         description: Analysis completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AnalysisResponse'
 *       400:
 *         description: Validation error or invalid file
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/analyze',
  strictRateLimiter,
  upload.single('file'),
  handleUploadError,
  analysisValidation,
  handleValidationErrors,
  async (req, res) => {
    let filePath = null;
    
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded. Please provide a CSV or Excel file.'
        });
      }

      filePath = req.file.path;
      const email = req.body.email;
      const originalName = req.file.originalname;

      console.log(`Processing file: ${originalName} for ${email}`);

      // Step 1: Parse the file
      console.log('Parsing file...');
      const parsedData = await csvParser.parseFile(filePath);
      console.log(`Parsed ${parsedData.summary.totalRows} rows with ${parsedData.summary.totalColumns} columns`);

      // Step 2: Generate AI summary
      console.log('Generating AI summary...');
      const summary = await aiService.generateSalesSummary(parsedData);
      console.log('AI summary generated');

      // Step 3: Send email
      console.log('Sending email...');
      const emailResult = await emailService.sendSummaryEmail(email, summary, {
        fileName: originalName,
        recordCount: parsedData.summary.totalRows,
        generatedAt: new Date()
      });

      // Clean up uploaded file
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });

      // Return success response
      res.json({
        success: true,
        message: emailResult.success 
          ? 'Analysis complete! The summary has been sent to your email.'
          : 'Analysis complete! However, there was an issue sending the email.',
        data: {
          summary: summary.substring(0, 500) + (summary.length > 500 ? '...' : ''),
          emailSent: emailResult.success,
          recordsAnalyzed: parsedData.summary.totalRows,
          messageId: emailResult.messageId
        }
      });

    } catch (error) {
      // Clean up file on error
      if (filePath && fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }

      console.error('Analysis error:', error);

      // Determine appropriate status code
      let statusCode = 500;
      let message = 'An error occurred while processing your request.';

      if (error.message.includes('parse') || error.message.includes('Invalid file')) {
        statusCode = 400;
        message = error.message;
      } else if (error.message.includes('empty')) {
        statusCode = 400;
        message = 'The uploaded file appears to be empty.';
      }

      res.status(statusCode).json({
        success: false,
        message: message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Check if the API and its services are operational
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 services:
 *                   type: object
 */
router.get('/health', async (req, res) => {
  const aiHealth = await aiService.healthCheck();
  const emailHealth = await emailService.verifyConnection();

  const isHealthy = aiHealth.status !== 'unhealthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    services: {
      api: { status: 'healthy' },
      ai: aiHealth,
      email: emailHealth.valid ? { status: 'healthy' } : { status: 'not_configured', message: emailHealth.message }
    }
  });
});

module.exports = router;
