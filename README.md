# Quick Response Tool

A secure, containerized application for generating AI-powered sales insights. Upload CSV or Excel files and receive professional executive summaries via email.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- **File Upload**: Support for CSV and Excel (.xlsx, .xls) files up to 10MB
- **AI-Powered Analysis**: Google Gemini integration for intelligent data summarization
- **Email Delivery**: Professional HTML email reports with executive summaries
- **Real-time Feedback**: Loading states, success/error notifications
- **Secure Endpoints**: Rate limiting, CORS, Helmet security headers, input validation
- **API Documentation**: Live Swagger/OpenAPI documentation
- **Containerized**: Docker and docker-compose for easy deployment

## Tech Stack

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express.js
- **AI**: Google Gemini API
- **Email**: Nodemailer (SMTP)
- **Security**: Helmet, express-rate-limit, CORS, express-validator
- **Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Variables
- **File Upload**: react-dropzone
- **HTTP Client**: Axios

### DevOps
- **Containerization**: Docker, Docker Compose
- **CI/CD**: GitHub Actions
- **Hosting**: Render (Backend), Vercel (Frontend)

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (optional)
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- SMTP credentials (Gmail recommended with App Password)

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quick-response-tool
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:5000
   - API Docs: http://localhost:5000/api-docs

### Option 2: Local Development

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

Backend will run on http://localhost:5000

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# VITE_API_URL defaults to http://localhost:5000/api

# Start development server
npm run dev
```

Frontend will run on http://localhost:5173

## API Documentation

Once the backend is running, access the interactive API documentation at:

```
http://localhost:5000/api-docs
```

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analyze` | Upload file and receive analysis via email |
| GET | `/api/health` | Health check endpoint |
| GET | `/api-docs` | Swagger UI documentation |

### Example API Request

```bash
curl -X POST http://localhost:5000/api/analyze \
  -F "file=@sales_data.csv" \
  -F "email=executive@company.com"
```

## Security Implementation

### Endpoint Security

1. **Rate Limiting**
   - General endpoints: 100 requests per 15 minutes per IP
   - Analysis endpoint: 10 requests per 15 minutes per IP
   - Configurable via environment variables

2. **Helmet Security Headers**
   - Content Security Policy (CSP)
   - HTTP Strict Transport Security (HSTS)
   - X-Frame-Options, X-Content-Type-Options
   - Referrer Policy

3. **CORS Configuration**
   - Whitelist-based origin validation
   - Credentials support for authenticated requests
   - Configurable allowed origins

4. **File Upload Security**
   - File type validation (CSV, XLSX, XLS only)
   - File size limit: 10MB
   - Secure filename sanitization
   - Temporary file cleanup after processing

5. **Input Validation**
   - Email format validation using express-validator
   - XSS protection through input sanitization
   - Request body size limits

### Data Protection

- Files are processed in memory and immediately deleted after analysis
- No persistent storage of uploaded files
- Environment variables for sensitive configuration
- Non-root user in Docker containers

## Environment Variables

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port (default: 5000) | No |
| `NODE_ENV` | Environment (development/production) | No |
| `GEMINI_API_KEY` | Google Gemini API key | Yes |
| `SMTP_HOST` | SMTP server hostname | Yes |
| `SMTP_PORT` | SMTP server port | Yes |
| `SMTP_USER` | SMTP username/email | Yes |
| `SMTP_PASS` | SMTP password/app password | Yes |
| `EMAIL_FROM` | Sender email address | Yes |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | No |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window in ms | No |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window | No |
| `MAX_FILE_SIZE` | Max upload size in bytes | No |

### Frontend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_URL` | Backend API URL | No |

## Deployment

### Backend (Render)

1. Create a new Web Service on [Render](https://render.com)
2. Connect your GitHub repository
3. Set build command: `cd backend && npm install`
4. Set start command: `cd backend && npm start`
5. Add environment variables in Render dashboard
6. Deploy

### Frontend (Vercel)

1. Import your project on [Vercel](https://vercel.com)
2. Set framework preset to "Vite"
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.onrender.com/api`
5. Deploy

### GitHub Actions CI/CD

The repository includes a GitHub Actions workflow that:

- Runs on pull requests to `main`
- Lints backend and frontend code
- Runs security audits
- Builds Docker images
- Runs integration tests with docker-compose

Configure the following secrets for automatic deployment:
- `RENDER_API_KEY`: Render API key
- `RENDER_SERVICE_ID`: Render service ID
- `VERCEL_TOKEN`: Vercel authentication token

## Project Structure

```
quick-response-tool/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── swagger.js       # Swagger configuration
│   │   ├── middleware/
│   │   │   ├── rateLimiter.js   # Rate limiting
│   │   │   ├── upload.js        # File upload handling
│   │   │   └── validator.js     # Input validation
│   │   ├── routes/
│   │   │   └── analysis.js      # API routes
│   │   ├── services/
│   │   │   ├── aiService.js     # Gemini AI integration
│   │   │   ├── csvParser.js     # File parsing
│   │   │   └── emailService.js  # Email delivery
│   │   └── app.js               # Express app entry
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main component
│   │   ├── App.css              # Component styles
│   │   ├── index.css            # Global styles
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── workflows/
│       └── ci-cd.yml            # GitHub Actions
├── docker-compose.yml
├── Dockerfile.frontend
├── .env.example
└── README.md
```

## Troubleshooting

### Common Issues

**File upload fails**
- Check file size (max 10MB)
- Verify file type (CSV, XLSX, XLS only)
- Check browser console for CORS errors

**Email not received**
- Verify SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Check spam/junk folders
- Check backend logs for email errors

**AI analysis fails**
- Verify `GEMINI_API_KEY` is set correctly
- Check API key has quota available
- Review backend logs for API errors

**Docker issues**
- Ensure Docker daemon is running
- Check port availability (80, 5000)
- Run `docker-compose down -v` to clean up volumes

## License

MIT License - see LICENSE file for details

## Support

For issues or questions:
- Create an issue in the GitHub repository
- Contact: support@rabbitt.ai

---

Built with by the Rabbitt AI Engineering Team
