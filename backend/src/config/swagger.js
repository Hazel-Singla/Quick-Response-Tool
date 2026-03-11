const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Quick Response Tool API',
      version: '1.0.0',
      description: 'Sales Insight Automator - Upload sales data and receive AI-generated summaries via email',
      contact: {
        name: 'Rabbitt AI',
        email: 'support@rabbitt.ai'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://your-backend-url.onrender.com/api'
          : 'http://localhost:5000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      schemas: {
        AnalysisRequest: {
          type: 'object',
          required: ['file', 'email'],
          properties: {
            file: {
              type: 'string',
              format: 'binary',
              description: 'CSV or Excel file containing sales data'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Recipient email address for the summary'
            }
          }
        },
        AnalysisResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful'
            },
            message: {
              type: 'string',
              description: 'Status message'
            },
            data: {
              type: 'object',
              properties: {
                summary: {
                  type: 'string',
                  description: 'AI-generated summary of the sales data'
                },
                emailSent: {
                  type: 'boolean',
                  description: 'Whether the email was sent successfully'
                }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
