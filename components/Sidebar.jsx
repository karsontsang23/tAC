import React from 'react';

export default function Sidebar({ 
    conversations, 
    currentConversationId, 
    onNewChat, 
    onSelectConversation, 
    onDeleteConversation,
    isOpen, 
    onClose 
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
                    >
                        <span className="material-icons-round">add</span>
                        New Chat
                    </button>
                </div>
                
                <div className="conversation-list">
                    {conversations.map(conversation => (
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
                            <div className="conversation-title">
                                {conversation.title}
                            </div>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={(e) => handleDeleteClick(e, conversation.id)}
                                aria-label="Delete conversation"
                                style={{ opacity: 0, transition: 'opacity 0.2s' }}
                                onMouseEnter={(e) => e.target.style.opacity = 1}
                                onMouseLeave={(e) => e.target.style.opacity = 0}
                            >
                                <span className="material-icons-round" style={{ fontSize: '1rem' }}>delete</span>
                            </button>
                        </div>
                    ))}
                </div>
            </aside>
        </>
    );
}