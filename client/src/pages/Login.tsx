import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Define CSS as a JavaScript string
const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    body {
        font-family: 'Inter', sans-serif;
        background-color: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
    }

    .login-card {
        background-color: #ffffff;
        padding: 2rem;
        border-radius: 1rem;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        width: 100%;
        max-width: 28rem;
        margin: 1rem;
        display: flex;
        flex-direction: column;
        align-items: center;
        transition: transform 0.3s ease-in-out;
    }

    .login-card:hover {
        transform: scale(1.05);
    }

    .logo-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .owl-logo {
        width: 6rem;
        height: 6rem;
        color: #60a5fa;
        margin-bottom: 0.5rem;
    }

    .logo-text {
        font-size: 2.25rem;
        font-weight: 800;
        letter-spacing: -0.025em;
        color: #1f2937;
    }

    .logo-subtext {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }

    .form-container {
        width: 100%;
    }

    .form-header {
        text-align: center;
        margin-bottom: 1.5rem;
    }

    .form-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: #1f2937;
    }

    .form-subtitle {
        margin-top: 0.5rem;
        font-size: 0.875rem;
        color: #6b7280;
    }
    
    .form-content {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        max-width: 20rem;
        margin: 0 auto;
    }

    .form-field-label {
        display: block;
        font-size: 0.875rem;
        font-weight: 500;
        color: #374151;
    }

    .form-field-input {
        margin-top: 0.25rem;
        display: block;
        width: 100%;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        transition: border-color 0.2s, box-shadow 0.2s;
    }

    .form-field-input:focus {
        outline: none;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
    }
    
    .message-box {
        text-align: center;
        font-size: 0.875rem;
        font-weight: 500;
        transition: color 0.3s;
    }

    .message-success {
        color: #16a34a;
    }
    
    .message-error {
        color: #dc2626;
    }

    .primary-btn {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 0.5rem 1rem;
        border: 1px solid transparent;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        font-size: 0.875rem;
        font-weight: 600;
        color: #ffffff;
        background-color: #2563eb;
        transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }

    .primary-btn:hover {
        background-color: #1d4ed8;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .primary-btn:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
        transform: none;
    }

    .primary-btn:disabled:hover {
        background-color: #9ca3af;
        transform: none;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .secondary-btn {
        width: 100%;
        display: flex;
        justify-content: center;
        padding: 0.5rem 1rem;
        border: 1px solid #d1d5db;
        border-radius: 0.5rem;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        font-size: 0.875rem;
        font-weight: 600;
        color: #374151;
        background-color: #ffffff;
        transition: transform 0.2s, background-color 0.2s, box-shadow 0.2s;
        cursor: pointer;
    }

    .secondary-btn:hover {
        background-color: #f9fafb;
        transform: translateY(-2px);
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    }

    .secondary-btn:disabled {
        background-color: #f3f4f6;
        color: #9ca3af;
        cursor: not-allowed;
        transform: none;
    }

    .secondary-btn:disabled:hover {
        background-color: #f3f4f6;
        transform: none;
        box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
    }

    .signup-btn {
        background-color: #10b981;
    }

    .signup-btn:hover {
        background-color: #059669;
    }
`;

function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [message, setMessage] = useState({ text: '', type: '' });
    const [signupMessage, setSignupMessage] = useState({ text: '', type: '' });
    const [isLoading, setIsLoading] = useState(false);
    
    const { login, register, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            const from = location.state?.from?.pathname || '/';
            navigate(from, { replace: true });
        }
    }, [isAuthenticated, navigate, location]);

    const handleLoginSubmit = async (event: any) => {
        event.preventDefault();
        setIsLoading(true);
        setMessage({ text: '', type: '' });
        
        const email = event.target.email.value;
        const password = event.target.password.value;

        try {
            const success = await login(email, password);
            if (success) {
                setMessage({ text: 'Login successful!', type: 'success' });
                // Navigation will be handled by useEffect
            } else {
                setMessage({ text: 'Invalid email or password.', type: 'error' });
            }
        } catch (error) {
            setMessage({ text: 'An error occurred during login.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSignupSubmit = async (event: any) => {
        event.preventDefault();
        setIsLoading(true);
        setSignupMessage({ text: '', type: '' });
        
        const username = event.target.newUsername.value;
        const email = event.target.email.value;
        const password = event.target.newPassword.value;

        if (!username || !email || !password) {
            setSignupMessage({ text: 'All fields are required to sign up.', type: 'error' });
            setIsLoading(false);
            return;
        }

        try {
            const success = await register(username, email, password);
            if (success) {
                setSignupMessage({ text: 'Sign up successful! Redirecting...', type: 'success' });
                // Navigation will be handled by useEffect
            } else {
                setSignupMessage({ text: 'Sign up failed. Email may already be in use.', type: 'error' });
            }
        } catch (error) {
            setSignupMessage({ text: 'An error occurred during sign up.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <React.Fragment>
            <style dangerouslySetInnerHTML={{ __html: styles }} />
            <div className="login-card">
                <div className="logo-container">
                    <svg className="owl-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-4-8c0 1.66 1.34 3 3 3s3-1.34 3-3V8c0-1.66-1.34-3-3-3s-3 1.34-3 3v4zm6 0c0 1.66 1.34 3 3 3s3-1.34 3-3V8c0-1.66-1.34-3-3-3s-3 1.34-3 3v4z"/>
                    </svg>
                    <h1 className="logo-text">Owl AI</h1>
                    <p className="logo-subtext">Your AI-powered assistant</p>
                </div>

                <div className="form-container">
                    {isLogin ? (
                        <div id="loginContent">
                            <div className="form-header">
                                <h1 className="form-title">Welcome Back</h1>
                                <p className="form-subtitle">Sign in to your account</p>
                            </div>
                            <form id="loginForm" className="form-content" onSubmit={handleLoginSubmit}>
                                <div>
                                    <label htmlFor="email" className="form-field-label">Email</label>
                                    <input type="email" id="email" name="email" className="form-field-input" required />
                                </div>
                                <div>
                                    <label htmlFor="password" className="form-field-label">Password</label>
                                    <input type="password" id="password" name="password" className="form-field-input" required />
                                </div>
                                <div className={`message-box ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
                                    {message.text}
                                </div>
                                <button type="submit" className="primary-btn" disabled={isLoading}>
                                    {isLoading ? 'Logging in...' : 'Log In'}
                                </button>
                                <button type="button" onClick={() => setIsLogin(false)} className="secondary-btn" disabled={isLoading}>
                                    Don't have an account? Sign Up
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div id="signupContent">
                            <div className="form-header">
                                <h1 className="form-title">Create an Account</h1>
                                <p className="form-subtitle">Join the Owl AI community</p>
                            </div>
                            <form id="signupForm" className="form-content" onSubmit={handleSignupSubmit}>
                                <div>
                                    <label htmlFor="newUsername" className="form-field-label">Username</label>
                                    <input type="text" id="newUsername" name="newUsername" className="form-field-input" required />
                                </div>
                                <div>
                                    <label htmlFor="email" className="form-field-label">Email Address</label>
                                    <input type="email" id="email" name="email" className="form-field-input" required />
                                </div>
                                <div>
                                    <label htmlFor="newPassword" className="form-field-label">Password</label>
                                    <input type="password" id="newPassword" name="newPassword" className="form-field-input" required />
                                </div>
                                <div className={`message-box ${signupMessage.type === 'success' ? 'message-success' : 'message-error'}`}>
                                    {signupMessage.text}
                                </div>
                                <button type="submit" className="primary-btn signup-btn" disabled={isLoading}>
                                    {isLoading ? 'Signing up...' : 'Sign Up'}
                                </button>
                                <button type="button" onClick={() => setIsLogin(true)} className="secondary-btn" disabled={isLoading}>
                                    Back to Log In
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}

export default LoginPage;
