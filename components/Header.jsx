import React from 'react';

export default function Header({ onToggleSidebar, currentConversation, user, onSignIn, onSignOut }) {
    return (
        <header className="chat-header">
            <div className="header-left">
                <button 
                    onClick={onToggleSidebar}
                    className="btn btn-ghost btn-icon md:hidden"
                    aria-label="Toggle sidebar"
                >
                    <span className="material-icons-round">menu</span>
                </button>
                <h1 className="header-title">
                    {currentConversation?.title || 'AI Chat'}
                </h1>
            </div>
            
            <div className="header-actions">
                {user ? (
                    <>
                        <div className="header-user-info">
                            <span className="user-email-header">{user.email}</span>
                        </div>
                        <button 
                            onClick={onSignOut}
                            className="btn btn-ghost btn-icon"
                            aria-label="Sign out"
                        >
                            <span className="material-icons-round">logout</span>
                        </button>
                    </>
                ) : (
                    <button 
                        onClick={onSignIn}
                        className="btn btn-primary"
                        aria-label="Sign in"
                    >
                        <span className="material-icons-round">login</span>
                        Sign In
                    </button>
                )}
                <button 
                    className="btn btn-ghost btn-icon"
                    aria-label="Settings"
                >
                    <span className="material-icons-round">settings</span>
                </button>
            </div>
        </header>
    );
}