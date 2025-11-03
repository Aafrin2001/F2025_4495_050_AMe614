import React from 'react';
import { IoWarningOutline } from 'react-icons/io5';
import './ErrorPage.css';

interface ErrorPageProps {
  message?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ message }) => {
  return (
    <div className="error-page">
      <div className="error-content">
          <h1><IoWarningOutline className="error-title-icon" /> Configuration Required</h1>
        <p className="error-message">
          {message || 'Supabase environment variables are not set.'}
        </p>
        <div className="error-instructions">
          <h2>Setup Instructions:</h2>
          <ol>
            <li>Navigate to the <code>web</code> directory</li>
            <li>Copy <code>.env.example</code> to <code>.env</code></li>
            <li>Add your Supabase credentials:
              <pre>{`VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`}</pre>
            </li>
            <li>Restart the development server</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;

