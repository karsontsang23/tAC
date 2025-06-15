import React from 'react';

export default function Header({ onToggleSidebar, currentConversation }) {
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
                <button 
                    className="btn btn-ghost btn-icon"
                    aria-label="Settings"
                >
                    <span className="material-icons-round">settings</span>
                </button>
                <button 
                    className="btn btn-ghost btn-icon"
                    aria-label="More options"
                >
                    <span className="material-icons-round">more_vert</span>
                </button>
            </div>
        </header>
    );
}