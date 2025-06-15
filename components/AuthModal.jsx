import React from 'react';
import { chatAPI } from '../lib/supabase.js';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            let result;
            if (isSignUp) {
                result = await chatAPI.signUp(email, password);
            } else {
                result = await chatAPI.signIn(email, password);
            }

            if (result.error) {
                setError(result.error.message);
            } else {
                onAuthSuccess(result.data.user);
                onClose();
                setEmail('');
                setPassword('');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsSignUp(!isSignUp);
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="auth-modal-overlay" onClick={onClose}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <div className="auth-modal-header">
                    <h2 className="auth-modal-title">
                        {isSignUp ? 'Create Account' : 'Sign In'}
                    </h2>
                    <button 
                        onClick={onClose}
                        className="btn btn-ghost btn-icon"
                        aria-label="Close modal"
                    >
                        <span className="material-icons-round">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && (
                        <div className="auth-error">
                            <span className="material-icons-round">error</span>
                            {error}
                        </div>
                    )}

                    <div className="form-group">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="Enter your email"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="Enter your password"
                            required
                            minLength={6}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary auth-submit-btn"
                    >
                        {loading ? (
                            <>
                                <span className="material-icons-round">hourglass_empty</span>
                                {isSignUp ? 'Creating Account...' : 'Signing In...'}
                            </>
                        ) : (
                            <>
                                <span className="material-icons-round">
                                    {isSignUp ? 'person_add' : 'login'}
                                </span>
                                {isSignUp ? 'Create Account' : 'Sign In'}
                            </>
                        )}
                    </button>

                    <div className="auth-toggle">
                        <span>
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <button
                            type="button"
                            onClick={toggleMode}
                            className="auth-toggle-btn"
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}