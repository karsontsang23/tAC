import React from 'react';

export default function Sidebar({ 
    conversations, 
    currentConversationId, 
    onNewChat, 
    onSelectConversation, 
    onDeleteConversation,
    isOpen, 
    onClose,
    user,
    onSignOut,
    onSignIn
}) {
    const handleConversationClick = (conversationId) => {
        onSelectConversation(conversationId);
    };

    const handleDeleteClick = (e, conversationId) => {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            onDeleteConversation(conversationId);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}
            
            <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-brand">
                        <div className="sidebar-brand-icon">
                            <span className="material-icons-round">psychology</span>
                        </div>
                        <span>AI Chat</span>
                    </div>
                    
                    <button 
                        onClick={onNewChat}
                        className="new-chat-button"
                        aria-label="Start new conversation"
                        disabled={!user}
                    >
                        <span className="material-icons-round">add</span>
                        New Chat
                    </button>
                </div>
                
                <div className="conversation-list">
                    {user ? (
                        conversations.length > 0 ? (
                            conversations.map(conversation => (
                                <div
                                    key={conversation.id}
                                    className={`conversation-item ${conversation.id === currentConversationId ? 'active' : ''}`}
                                    onClick={() => handleConversationClick(conversation.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            handleConversationClick(conversation.id);
                                        }
                                    }}
                                    aria-label={`Select conversation: ${conversation.title}`}
                                >
                                    <div className="conversation-icon">
                                        <span className="material-icons-round">chat_bubble</span>
                                    </div>
                                    <div className="conversation-content">
                                        <div className="conversation-title">
                                            {conversation.title}
                                        </div>
                                        <div className="conversation-date">
                                            {formatDate(conversation.updated_at)}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-ghost btn-icon conversation-delete"
                                        onClick={(e) => handleDeleteClick(e, conversation.id)}
                                        aria-label="Delete conversation"
                                    >
                                        <span className="material-icons-round">delete</span>
                                    </button>
                                </div>
                            ))
                        ) : (
                            <div className="empty-conversations">
                                <div className="empty-conversations-icon">
                                    <span className="material-icons-round">chat_bubble_outline</span>
                                </div>
                                <p>No conversations yet</p>
                                <p className="empty-conversations-subtitle">Start a new chat to begin</p>
                            </div>
                        )
                    ) : (
                        <div className="auth-prompt">
                            <div className="auth-prompt-icon">
                                <span className="material-icons-round">person</span>
                            </div>
                            <h3>Sign in to save your chats</h3>
                            <p>Create an account to keep your conversation history</p>
                            <button 
                                onClick={onSignIn}
                                className="btn btn-primary"
                            >
                                <span className="material-icons-round">login</span>
                                Sign In
                            </button>
                        </div>
                    )}
                </div>

                {user && (
                    <div className="sidebar-footer">
                        <div className="user-info">
                            <div className="user-avatar">
                                <span className="material-icons-round">person</span>
                            </div>
                            <div className="user-details">
                                <div className="user-email">{user.email}</div>
                                <div className="user-status">Online</div>
                            </div>
                            <button
                                onClick={onSignOut}
                                className="btn btn-ghost btn-icon"
                                aria-label="Sign out"
                            >
                                <span className="material-icons-round">logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </aside>
        </>
    );
}