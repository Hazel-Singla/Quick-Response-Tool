import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import './App.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      const selectedFile = acceptedFiles[0];
      setFile(selectedFile);
      setPreview({
        name: selectedFile.name,
        size: (selectedFile.size / 1024 / 1024).toFixed(2),
        type: selectedFile.name.split('.').pop().toUpperCase()
      });
      setStatus('idle');
      setMessage('');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file || !email) {
      setStatus('error');
      setMessage('Please provide both a file and email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('email', email);

    try {
      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        timeout: 120000 // 2 minutes timeout
      });

      setStatus('success');
      setMessage(response.data.message);
      
      // Reset form after success
      setTimeout(() => {
        setFile(null);
        setPreview(null);
        setEmail('');
      }, 5000);

    } catch (error) {
      setStatus('error');
      
      if (error.response) {
        // Server responded with error
        setMessage(error.response.data?.message || 'Server error occurred.');
      } else if (error.request) {
        // Request made but no response
        setMessage('Cannot connect to server. Please try again later.');
      } else {
        // Something else happened
        setMessage('An unexpected error occurred.');
      }
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setMessage('');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="logo">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="8" fill="url(#gradient)"/>
              <path d="M20 10L28 20L20 30L12 20L20 10Z" fill="white"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                  <stop stopColor="#667eea"/>
                  <stop offset="1" stopColor="#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
            <div>
              <h1>Quick Response Tool</h1>
              <span className="subtitle">Sales Insight Automator</span>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="card animate-fade-in">
          <div className="card-header">
            <h2>Upload Sales Data</h2>
            <p>Upload your CSV or Excel file and receive an AI-generated summary via email</p>
          </div>

          <form onSubmit={handleSubmit} className="form">
            {/* File Upload Zone */}
            <div className="form-group">
              <label>Data File</label>
              {!file ? (
                <div
                  {...getRootProps()}
                  className={`dropzone ${isDragActive ? 'active' : ''} ${isDragReject ? 'reject' : ''}`}
                >
                  <input {...getInputProps()} />
                  <div className="dropzone-content">
                    <svg className="upload-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="17 8 12 3 7 8"/>
                      <line x1="12" y1="3" x2="12" y2="15"/>
                    </svg>
                    {isDragActive ? (
                      <p>Drop the file here...</p>
                    ) : (
                      <>
                        <p><strong>Click to upload</strong> or drag and drop</p>
                        <span className="file-types">CSV, XLSX, or XLS (max 10MB)</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="file-preview animate-slide-in">
                  <div className="file-info">
                    <div className="file-icon">
                      {preview?.type === 'CSV' ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#48bb78" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="8" y1="13" x2="16" y2="13"/>
                          <line x1="8" y1="17" x2="16" y2="17"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <rect x="8" y="12" width="8" height="6"/>
                        </svg>
                      )}
                    </div>
                    <div className="file-details">
                      <span className="file-name">{preview?.name}</span>
                      <span className="file-meta">{preview?.type} • {preview?.size} MB</span>
                    </div>
                  </div>
                  <button type="button" className="remove-btn" onClick={removeFile}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email">Recipient Email</label>
              <div className="input-wrapper">
                <svg className="input-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@company.com"
                  required
                  disabled={status === 'loading'}
                />
              </div>
            </div>

            {/* Status Messages */}
            {message && (
              <div className={`alert ${status}`}>
                {status === 'loading' && <div className="spinner-small"></div>}
                {status === 'success' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                    <polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                )}
                {status === 'error' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="15" y1="9" x2="9" y2="15"/>
                    <line x1="9" y1="9" x2="15" y2="15"/>
                  </svg>
                )}
                <span>{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="submit-btn"
              disabled={status === 'loading' || !file || !email}
            >
              {status === 'loading' ? (
                <>
                  <div className="spinner-small"></div>
                  <span>Processing Analysis...</span>
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="22" y1="2" x2="11" y2="13"/>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                  <span>Generate & Send Brief</span>
                </>
              )}
            </button>
          </form>

          {/* Info Section */}
          <div className="info-section">
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <span>Secure file handling with encryption</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Analysis completed in under 60 seconds</span>
            </div>
            <div className="info-item">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#667eea" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span>Professional AI-generated summaries</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="footer">
        <p>&copy; {new Date().getFullYear()} Rabbitt AI. All rights reserved.</p>
        <p className="powered-by">Powered by Google Gemini AI</p>
      </footer>
    </div>
  );
}

export default App;
