'use client';

import { useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

interface LoginCredentials {
  userId: string;
  password: string;
  totpCode?: string;
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    userId: '',
    password: '',
    totpCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTotp, setShowTotp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validate Client Code format (AAA000)
    const clientCodePattern = /^[A-Z]{3}[0-9]{3}$/;
    if (!clientCodePattern.test(credentials.userId)) {
      setError('Client code must be in format AAA000 (3 letters followed by 3 numbers)');
      return;
    }
    
    setIsLoading(true);

    try {
      // Call Tauri backend for authentication
      const response = await invoke('authenticate_user', {
        userId: credentials.userId,
        password: credentials.password,
        totpCode: credentials.totpCode || null,
      });

      console.log('Login successful:', response);
      
      // Store session/token if needed
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed. Please check your credentials.');
      
      // If TOTP is required, show the TOTP field
      if (err instanceof Error && (err.message?.includes('TOTP') || err.message?.includes('2FA'))) {
        setShowTotp(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'userId') {
      // Only allow alphanumeric input for userId
      const sanitized = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
      
      // Enforce AAA000 format: first 3 chars must be letters, next 3 must be numbers
      let formatted = '';
      
      for (let i = 0; i < sanitized.length && i < 6; i++) {
        const char = sanitized[i];
        if (i < 3) {
          // First 3 positions: only letters
          if (/[A-Z]/.test(char)) {
            formatted += char;
          }
        } else {
          // Last 3 positions: only numbers
          if (/[0-9]/.test(char)) {
            formatted += char;
          }
        }
      }
      
      setCredentials((prev) => ({
        ...prev,
        userId: formatted,
      }));
    } else {
      setCredentials((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
    
    // Clear error when user starts typing
    if (error) setError('');
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {/* Header */}
        <div className="login-header">
          <h1 className="terminal-title">Sapphire Terminal</h1>
          <p className="terminal-subtitle">Professional Trading Platform</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* User ID Field */}
          <div className="form-group">
            <label htmlFor="userId" className="form-label">
              Client Code
            </label>
            <input
              type="text"
              id="userId"
              name="userId"
              value={credentials.userId}
              onChange={handleInputChange}
              className="form-input"
              placeholder="AAA000"
              required
              disabled={isLoading}
              autoComplete="username"
              autoFocus
              maxLength={6}
              pattern="[A-Z]{3}[0-9]{3}"
              title="Client code must be 3 letters followed by 3 numbers (e.g., ABC123)"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Enter your password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          {/* TOTP Field (shown conditionally) */}
          {showTotp && (
            <div className="form-group">
              <label htmlFor="totpCode" className="form-label">
                2FA Code
              </label>
              <input
                type="text"
                id="totpCode"
                name="totpCode"
                value={credentials.totpCode}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Enter 6-digit code"
                maxLength={6}
                disabled={isLoading}
                autoComplete="one-time-code"
              />
              <span className="form-hint">
                Enter the 6-digit code from your authenticator app
              </span>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <svg
                className="error-icon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            disabled={isLoading || credentials.userId.length !== 6 || !credentials.password}
          >
            {isLoading ? (
              <span className="button-loading">
                <span className="spinner"></span>
                Authenticating...
              </span>
            ) : (
              'Login'
            )}
          </button>

          {/* Additional Links */}
          <div className="form-footer">
            <a href="#" className="footer-link">
              Forgot Password?
            </a>
            <span className="footer-separator">•</span>
            <a href="https://signup.sapphirebroking.com" className="footer-link">
              Open a Demat Account?
            </a>
          </div>
        </form>

        {/* Security Notice */}
        <div className="security-notice">
          <svg
            className="security-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <span>Secure connection • Your data is encrypted</span>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #2b3e50;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          user-select: none;
        }

        .login-box {
          background: #f5f6f7;
          border: 1px solid #4a5f7f;
          border-radius: 0;
          box-shadow: 
            0 0 0 1px rgba(0, 0, 0, 0.08),
            0 4px 12px rgba(0, 0, 0, 0.25),
            0 8px 32px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 450px;
          padding: 0;
        }

        .login-header {
          background: linear-gradient(180deg, #3a5f9e 0%, #2d4a7c 100%);
          padding: 14px 20px;
          border-bottom: 1px solid #1e3456;
          text-align: center;
        }

        .terminal-title {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
          letter-spacing: 0.3px;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }

        .terminal-subtitle {
          font-size: 11px;
          color: #c5d9f1;
          margin: 0;
          font-weight: 400;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 24px;
          background: #f5f6f7;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          font-size: 12px;
          font-weight: 600;
          color: #2c3e50;
          text-transform: none;
          letter-spacing: 0;
        }

        .form-input {
          padding: 8px 10px;
          border: 1px solid #8b9dc3;
          border-radius: 0;
          font-size: 13px;
          color: #1a1a1a;
          background: #ffffff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08);
          user-select: text;
        }

        .form-input#userId {
          text-transform: uppercase;
        }

        .form-input:focus {
          outline: none;
          border-color: #3a5f9e;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.08),
                      0 0 0 2px rgba(58, 95, 158, 0.15);
        }

        .form-input:disabled {
          background: #e8e8e8;
          color: #666666;
          cursor: not-allowed;
        }

        .form-input::placeholder {
          color: #999999;
        }

        .form-hint {
          font-size: 11px;
          color: #7f8c8d;
          margin-top: 2px;
          font-style: italic;
        }

        .error-message {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          padding: 10px 12px;
          background: #fadbd8;
          border: 1px solid #e74c3c;
          border-radius: 0;
          color: #c0392b;
          font-size: 12px;
          font-weight: 500;
          box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .error-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
          margin-top: 1px;
        }

        .login-button {
          padding: 9px 20px;
          background: linear-gradient(180deg, #0078d7 0%, #0055a6 100%);
          color: #ffffff;
          border: 1px solid #003d82;
          border-radius: 0;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 10px;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          box-shadow: 
            0 1px 0 rgba(255, 255, 255, 0.2) inset,
            0 2px 4px rgba(0, 0, 0, 0.2);
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .login-button:hover:not(:disabled) {
          background: linear-gradient(180deg, #1a8ce8 0%, #0066c7 100%);
          border-color: #003d82;
        }

        .login-button:active:not(:disabled) {
          background: linear-gradient(180deg, #004a99 0%, #003670 100%);
          box-shadow: 
            0 1px 0 rgba(0, 0, 0, 0.2) inset,
            0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .login-button:disabled {
          background: linear-gradient(180deg, #cccccc 0%, #999999 100%);
          border-color: #888888;
          cursor: not-allowed;
          box-shadow: none;
          color: #f0f0f0;
        }

        .button-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-top-color: #ffffff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .form-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 6px;
          padding-top: 16px;
          border-top: 1px solid #d4d4d4;
        }

        .footer-link {
          font-size: 11px;
          color: #0055d4;
          text-decoration: none;
          font-weight: 500;
        }

        .footer-link:hover {
          color: #003d82;
          text-decoration: underline;
        }

        .footer-separator {
          color: #999999;
          font-size: 11px;
        }

        .security-notice {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 20px;
          background: #f0f0f0;
          border-top: 1px solid #d4d4d4;
          font-size: 10px;
          color: #666666;
          font-weight: 500;
        }

        .security-icon {
          width: 13px;
          height: 13px;
          color: #0055d4;
        }

        @media (max-width: 480px) {
          .login-box {
            max-width: 100%;
          }

          .login-form {
            padding: 20px;
          }

          .terminal-title {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}